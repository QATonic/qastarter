import { promises as fs, openSync, closeSync, writeSync } from 'node:fs';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const run = path.resolve(process.env.WEB_AUDIT_RUN || 'tmp/web-audit/baseline');
const inventory = JSON.parse(await fs.readFile(path.join(run, 'inventory.json'), 'utf8'));
const phase = process.argv[2] || 'build';
const selected = process.env.WEB_AUDIT_PACK;
const category = process.env.WEB_AUDIT_CATEGORY;
const pattern = process.env.WEB_AUDIT_PATTERN;
const reporter = process.env.WEB_AUDIT_REPORTER;
const eligible = inventory.projects.filter(project => (!selected || selected.split(',').some(part => project.pack.includes(part))) && (!category || project.categories.includes(category)) && (!pattern || project.config.testingPattern === pattern) && (!reporter || (reporter === 'none' ? !project.config.reportingTool : project.config.reportingTool === reporter)));
if (!eligible.length || eligible.some(project => project.download !== 'passed' || project.extraction !== 'passed')) {
  throw new Error('Selected ZIP generation/extraction is incomplete or the selection is empty');
}
const concurrency = Number(process.env.WEB_AUDIT_WORKERS || '1');
await fs.mkdir(path.join(run, 'logs'), { recursive: true });
await fs.mkdir(path.join(run, 'results'), { recursive: true });
const resultFile = path.join(run, `${phase}-results.json`);
const previous = await fs.readFile(resultFile, 'utf8').then(JSON.parse).catch(() => []);
const results = new Map(previous.map(result => [result.id, result]));
let pendingSave = Promise.resolve();
function persist() {
  pendingSave = pendingSave.then(() => fs.writeFile(resultFile, JSON.stringify([...results.values()], null, 2)));
  return pendingSave;
}
async function command(project, label, text, timeout = 900_000) {
  const logFile = path.join(run, 'logs', `${project.id}-${phase}-${label}.log`);
  const log = openSync(logFile, 'w');
  writeSync(log, `Command: ${text}\n`);
  const started = Date.now();
  const env = { ...process.env, HEADLESS: 'true', BROWSER: 'chrome', CI: 'true', DOTNET_NOLOGO: '1', DOTNET_CLI_TELEMETRY_OPTOUT: '1',
    npm_config_fetch_retries: '1', npm_config_fetch_timeout: '60000', npm_config_maxsockets: '3',
    npm_config_cache: process.env.WEB_AUDIT_NPM_CACHE || path.join(run, 'npm-cache'),
    JAVA_TOOL_OPTIONS: '-Djunit.jupiter.execution.parallel.config.strategy=fixed -Djunit.jupiter.execution.parallel.config.fixed.parallelism=1' };
  if (process.platform === 'win32') {
    env.JAVA_HOME = process.env.WEB_AUDIT_JAVA_HOME || 'C:\\Program Files\\Java\\jdk-21';
    for (const key of Object.keys(env)) if (key.toLowerCase() === 'path') delete env[key];
    env.PATH = `${env.JAVA_HOME}\\bin;${process.env.PATH}`;
  }
  env.MAVEN_OPTS = '-Xmx512m';
  const child = process.platform === 'win32'
    ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', text], { cwd: path.join(run, 'projects', project.id), env, windowsHide: true, stdio: ['ignore', log, log] })
    : spawn('/bin/bash', ['-lc', text], { cwd: path.join(run, 'projects', project.id), env, windowsHide: true, stdio: ['ignore', log, log] });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    if (process.platform === 'win32') spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  }, timeout);
  const code = await new Promise(resolve => {
    let spawnError = false;
    child.once('error', error => { spawnError = true; writeSync(log, String(error)); });
    child.once('close', code => resolve(spawnError ? -1 : code));
  });
  clearTimeout(timer);
  closeSync(log);
  return { label, command: text, status: code === 0 && !timedOut ? 'passed' : 'failed', code, timedOut, seconds: Math.round((Date.now() - started) / 1000), log: path.relative(run, logFile) };
}
function plan(project, task = phase) {
  if (task === 'verify') return [...plan(project, 'build'), ...plan(project, 'test')];
  const { language, framework, buildTool } = project.config;
  if (task === 'test') {
    if (['javascript', 'typescript'].includes(language)) return [['tests', framework === 'cypress' ? 'npm test -- --config video=false' : project.config.testingPattern === 'bdd' ? 'npm test' : framework === 'webdriverio' ? 'npm test -- --maxInstances 1' : 'npm test -- --runInBand']];
    if (language === 'python') return [['tests', framework === 'robotframework' ? '.venv\\Scripts\\python.exe -m robot --variable HEADLESS:True --xunit junit.xml --outputdir results tests' : '.venv\\Scripts\\python.exe -m pytest -q --junitxml=results/junit.xml']];
    if (language === 'java') return [['tests', buildTool === 'gradle' ? 'gradlew.bat test --no-daemon --max-workers=2 -Dorg.gradle.jvmargs=-Xmx512m -Pheadless=true' : 'mvn -B test -Dheadless=true']];
    if (language === 'csharp') return [...(framework === 'playwright' ? [['browser', 'pwsh -NoProfile -File bin\\Debug\\net8.0\\playwright.ps1 install chromium']] : []), ['tests', 'dotnet test --no-build --logger "trx;LogFileName=results.trx"']];
    if (language === 'go') return [['tests', 'go test -v ./...']];
  }
  if (['javascript', 'typescript'].includes(language)) return [['install', 'npm install --no-audit --no-fund'], ...(language === 'typescript' ? [['compile', 'npx tsc --noEmit']] : []), ['lint', 'npm run lint --if-present']];
  if (language === 'python') return [['install', 'python -m venv .venv && .venv\\Scripts\\python.exe -m pip install --disable-pip-version-check -r requirements.txt'], ...(framework === 'playwright' ? [['browser', '.venv\\Scripts\\python.exe -m playwright install chromium']] : []), ['collect', framework === 'robotframework' ? '.venv\\Scripts\\python.exe -m robot --dryrun --outputdir results-dryrun tests' : '.venv\\Scripts\\python.exe -m pytest --collect-only -q']];
  if (language === 'java') return [['compile', buildTool === 'gradle' ? 'gradlew.bat testClasses --no-daemon --max-workers=2 -Dorg.gradle.jvmargs=-Xmx512m' : 'mvn -B -q -DskipTests test-compile']];
  if (language === 'csharp') return [['restore', 'dotnet restore'], ['compile', 'dotnet build --no-restore']];
  if (language === 'go') return [['install', 'go mod tidy'], ['compile', 'go test ./... -run "^$"']];
  throw new Error(`No runner for ${language}`);
}
const queue = eligible.filter(project => !results.has(project.id) || process.env.WEB_AUDIT_RETRY === 'true' || (process.env.WEB_AUDIT_RETRY === 'failed' && results.get(project.id).steps.some(step => step.status !== 'passed')));
await Promise.all(Array.from({ length: concurrency }, async () => {
  for (;;) {
    const project = queue.shift(); if (!project) break;
    const result = { id: project.id, pack: project.pack, config: project.config, steps: [] };
    console.log(`START ${phase} ${project.pack}`);
    results.set(project.id, result);
    for (const [label, text] of plan(project)) {
      const step = await command(project, label, text);
      result.steps.push(step);
      if (label === 'tests' && step.status === 'passed') {
        const { stdout } = await promisify(execFile)('python', [
          path.resolve('scripts/web-audit/evidence.py'), path.join(run, 'projects', project.id),
          JSON.stringify(project.config), path.join(run, step.log),
        ], { windowsHide: true });
        result.evidence = JSON.parse(stdout);
        if (result.evidence.status !== 'passed') {
          step.status = 'failed';
          step.evidenceIssues = result.evidence.issues;
        }
      }
      console.log(`${step.status.toUpperCase()} ${project.pack} ${label} (${step.seconds}s)`);
      await fs.writeFile(path.join(run, 'results', `${project.id}-${phase}.json`), JSON.stringify(result, null, 2));
      await persist();
      if (step.status !== 'passed' && ['install', 'restore', 'compile', 'collect', 'browser'].includes(label)) break;
    }
    await delay(100);
  }
}));
console.log(`Results: ${resultFile}`);
