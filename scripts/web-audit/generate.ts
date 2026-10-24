import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { WizardValidator, validationMatrix } from '../../shared/validationMatrix';
import type { ProjectConfig } from '../../shared/schema';

async function main() {
  const root = process.cwd();
  const run = path.resolve(process.env.WEB_AUDIT_RUN || `tmp/web-audit/run-${Date.now()}`);
  const expanded = process.argv.includes('--variants');
  await fs.mkdir(path.join(run, 'zips'), { recursive: true });
  interface AuditProject {
    id: string;
    pack: string;
    categories: string[];
    config: ProjectConfig;
    download?: 'passed' | 'failed';
    bytes?: number;
    error?: string;
  }
  const projects = new Map<string, AuditProject>();
  const add = (pack: string, config: ProjectConfig, category: string) => {
    const id = createHash('sha256').update(JSON.stringify(config)).digest('hex').slice(0, 10);
    const found = projects.get(id);
    if (found) found.categories.push(category);
    else projects.set(id, { id, pack, config, categories: [category] });
  };
  const packRoot = path.join(root, 'server/templates/packs');
  const selected = process.env.WEB_AUDIT_PACK;
  const packs = (await fs.readdir(packRoot))
    .filter((name) => name.startsWith('web-') && (!selected || selected.split(',').some(part => name.includes(part))))
    .sort();
  const utilities = [
    'configReader',
    'jsonReader',
    'screenshotUtility',
    'logger',
    'dataProvider',
    'faker',
    'includeDocker',
    'includeDockerCompose',
  ] as const;
  for (const pack of packs) {
    const manifest = JSON.parse(
      await fs.readFile(path.join(packRoot, pack, 'manifest.json'), 'utf8')
    );
    const combo = manifest.supportedCombination;
    const patterns = WizardValidator.getAvailableTestingPatternsForFramework(
      combo.framework,
      combo.language
    );
    const config: ProjectConfig = {
      ...combo,
      projectName: 'company-web-tests',
      groupId: 'com.company.quality',
      artifactId: 'company-web-tests',
      testingPattern: patterns.includes('page-object-model') ? 'page-object-model' : patterns[0],
      cloudDeviceFarm: 'none',
      includeSampleTests: true,
      cicdTool: 'github-actions',
      baseUrl: process.env.WEB_AUDIT_BASE_URL || 'http://127.0.0.1:53440',
      testUsername: 'standard_user',
      testPassword: 'secret_sauce',
      utilities: Object.fromEntries(utilities.map((name) => [name, true])),
    };
    add(pack, config, 'baseline');
    if (!expanded) continue;
    for (const testingPattern of patterns) {
      const reporters = [
        undefined,
        ...WizardValidator.getAvailableReportingToolsForFramework(combo.framework, combo.language, combo.testRunner, testingPattern),
      ];
      for (const reportingTool of reporters)
        add(pack, { ...config, testingPattern, reportingTool }, 'runtime');
      for (const cicdTool of WizardValidator.getAvailableCicdTools(combo.framework))
        add(pack, { ...config, testingPattern, cicdTool }, 'ci');
      for (const farm of validationMatrix.cloudDeviceFarms.web)
        add(
          pack,
          { ...config, testingPattern, cloudDeviceFarm: farm as ProjectConfig['cloudDeviceFarm'] },
          'cloud'
        );
    }
    add(pack, { ...config, includeSampleTests: false }, 'no-samples');
    const disabled = Object.fromEntries(utilities.map((name) => [name, false]));
    add(pack, { ...config, utilities: disabled }, 'utilities-off');
    for (const name of utilities)
      add(pack, { ...config, utilities: { ...disabled, [name]: true } }, `utility:${name}`);
  }
  const inventory = process.argv.includes('--resume')
    ? JSON.parse(await fs.readFile(path.join(run, 'inventory.json'), 'utf8'))
    : {
        createdAt: new Date().toISOString(),
        commit: execFileSync('git', ['rev-parse', 'HEAD'], {
          encoding: 'utf8',
          windowsHide: true,
        }).trim(),
        run,
        packs,
        projects: Array.from(projects.values()),
      };
  await fs.writeFile(path.join(run, 'inventory.json'), JSON.stringify(inventory, null, 2));
  console.log(`${packs.length} web packs; ${projects.size} downloadable audit variants; ${run}`);
  const socket = createServer();
  await new Promise<void>((resolve) => socket.listen(0, '127.0.0.1', resolve));
  const port = (socket.address() as { port: number }).port;
  await new Promise<void>((resolve) => socket.close(() => resolve()));
  const server = spawn(process.execPath, ['dist/index.js'], {
    cwd: root,
    windowsHide: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      DATABASE_URL: '',
      REDIS_URL: '',
      LOG_FILE: 'false',
      LOG_CONSOLE: 'true',
      RATE_LIMIT_MAX: '1000000',
      RATE_LIMIT_GENERATE_MAX: '1000000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  server.stdout.on('data', (chunk) => {
    logs += chunk;
  });
  server.stderr.on('data', (chunk) => {
    logs += chunk;
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    for (let attempt = 0; ; attempt++) {
      if (server.exitCode !== null) throw new Error(`Audit API exited: ${server.exitCode}`);
      try {
        if ((await fetch(`${base}/api/v1/health/deep`, { signal: AbortSignal.timeout(1000) })).ok)
          break;
      } catch {
        /* starting */
      }
      if (attempt === 120) throw new Error('Audit API startup timed out');
      await delay(250);
    }
    let completed = 0;
    const queue: AuditProject[] = inventory.projects.filter(
      (project: AuditProject) => project.download !== 'passed'
    );
    await Promise.all(
      Array.from({ length: 3 }, async () => {
        for (;;) {
          const project = queue.shift();
          if (!project) break;
          for (let retry = 0; retry < 3; retry++)
            try {
              const response = await fetch(`${base}/api/v1/generate-project`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project.config),
                signal: AbortSignal.timeout(60_000),
              });
              const body = Buffer.from(await response.arrayBuffer());
              if (!response.ok || !body.subarray(0, 2).equals(Buffer.from('PK')))
                throw new Error(`HTTP ${response.status}: ${body.toString('utf8').slice(0, 1000)}`);
              await fs.writeFile(path.join(run, 'zips', `${project.id}.zip`), body);
              project.download = 'passed';
              project.bytes = body.length;
              delete project.error;
              break;
            } catch (error) {
              project.download = 'failed';
              project.error = String(error);
              if (retry < 2) await delay(500);
            }
          completed++;
          if (completed % 10 === 0 || project.download === 'failed')
            console.log(
              `${completed}/${projects.size}: ${project.pack} ${project.categories.join(',')} ${project.download}`
            );
        }
      })
    );
  } finally {
    server.kill();
    await fs.writeFile(path.join(run, 'server.log'), logs);
    await fs.writeFile(path.join(run, 'inventory.json'), JSON.stringify(inventory, null, 2));
  }
  execFileSync(
    process.env.PYTHON || 'python',
    [path.join(root, 'scripts/web-audit/extract.py'), run],
    { stdio: 'inherit', windowsHide: true }
  );
  console.log(
    `Downloaded ${inventory.projects.filter((p: AuditProject) => p.download === 'passed').length}/${inventory.projects.length} ZIPs`
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
