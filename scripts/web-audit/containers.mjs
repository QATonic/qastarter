import { promises as fs, openSync, closeSync, writeSync } from 'node:fs';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = path.resolve(process.env.WEB_AUDIT_RUN || 'tmp/web-audit/containers');
const inventory = JSON.parse(await fs.readFile(path.join(run, 'inventory.json'), 'utf8'));
const selected = process.env.WEB_AUDIT_PACK;
const projects = inventory.projects.filter(p => p.categories.includes('baseline') &&
  (!selected || selected.split(',').some(part => p.pack.includes(part))));
if (!projects.length || projects.some(p => p.extraction !== 'passed')) {
  throw new Error('No complete baseline ZIPs to test');
}
await fs.mkdir(path.join(run, 'container-logs'), { recursive: true });
// Public images do not need the desktop credential helper. Keep the user's
// Docker configuration untouched and use an anonymous client configuration.
const clientConfig = path.join(run, 'docker-client');
await fs.mkdir(clientConfig, { recursive: true });
await fs.writeFile(path.join(clientConfig, 'config.json'), JSON.stringify({ auths: {} }));
const resultsFile = path.join(run, 'container-results.json');
const results = await fs.readFile(resultsFile, 'utf8').then(JSON.parse).catch(() => []);
async function docker(args, logFile, timeout = 1_200_000) {
  args = ['--config', clientConfig,
    ...(process.platform === 'win32' ? ['--host', process.env.WEB_AUDIT_DOCKER_HOST || 'npipe:////./pipe/dockerDesktopLinuxEngine'] : []),
    ...args];
  const log = openSync(logFile, 'a');
  writeSync(log, `\ndocker ${args.join(' ')}\n`);
  const child = spawn('docker', args, { windowsHide: true, stdio: ['ignore', log, log] });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeout);
  const code = await new Promise(resolve => {
    child.once('error', error => { writeSync(log, String(error)); resolve(-1); });
    child.once('close', resolve);
  });
  clearTimeout(timer);
  closeSync(log);
  return { code, timedOut, status: code === 0 && !timedOut ? 'passed' : 'failed' };
}
for (const project of projects) {
  const previous = results.find(r => r.id === project.id);
  if (previous && process.env.WEB_AUDIT_RETRY !== 'true' &&
    !(process.env.WEB_AUDIT_RETRY === 'failed' && (previous.build?.status !== 'passed' || previous.test?.status !== 'passed'))) continue;
  const context = path.join(run, 'projects', project.id);
  const log = path.join(run, 'container-logs', `${project.id}.log`);
  const image = `qastarter-web-audit:${project.pack.slice(4)}-20261024`;
  const name = `qastarter-web-audit-${project.id}-${Date.now()}`;
  const result = { id: project.id, pack: project.pack, image, log: path.relative(run, log), startedAt: new Date().toISOString() };
  console.log(`START container ${project.pack}`);
  try {
    if (await fs.stat(path.join(context, 'docker-compose.yml')).then(() => true).catch(() => false)) {
      result.compose = await docker(['compose', '-f', path.join(context, 'docker-compose.yml'), 'config', '--quiet'], log, 30_000);
    }
    result.build = await docker(['build', '--progress=plain', '-t', image, context], log);
    console.log(`${result.build.status.toUpperCase()} image ${project.pack}`);
    if (result.build.status === 'passed') {
      result.test = await docker(['run', '--name', name, '--init', '--shm-size=1g', '-e', 'HEADLESS=true', image], log);
      console.log(`${result.test.status.toUpperCase()} container tests ${project.pack}`);
      const artifacts = path.join(run, 'container-artifacts', project.id);
      await fs.mkdir(artifacts, { recursive: true });
      for (const directory of ['TestResults', 'reports', 'test-results', 'results', 'allure-results', 'target/surefire-reports', 'build/test-results', 'test-output']) {
        const destination = path.join(artifacts, directory);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await docker(['cp', `${name}:/app/${directory}`, destination], log, 30_000);
      }
      if (result.test.status === 'passed') {
        const { stdout } = await promisify(execFile)('python', [path.resolve('scripts/web-audit/evidence.py'), artifacts, JSON.stringify(project.config), log], { windowsHide: true });
        result.evidence = JSON.parse(stdout);
        if (result.evidence.status !== 'passed') result.test.status = 'failed';
      }
    }
  } finally {
    await docker(['rm', '-f', name], log, 30_000);
    result.finishedAt = new Date().toISOString();
    const old = results.findIndex(r => r.id === project.id);
    if (old >= 0) results[old] = result; else results.push(result);
    await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
  }
}
console.log(`Container evidence: ${resultsFile}`);
