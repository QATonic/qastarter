import fs from 'node:fs/promises';
import path from 'node:path';

const run = path.resolve(process.argv[2]);
const phase = process.argv[3] || 'verify';
const inventory = JSON.parse(await fs.readFile(path.join(run, 'inventory.json'), 'utf8'));
const category = phase === 'container' ? 'baseline' : (process.env.WEB_AUDIT_CATEGORY || 'runtime');
const expected = inventory.projects.filter(p => p.categories.includes(category));
const results = JSON.parse(await fs.readFile(path.join(run, `${phase}-results.json`), 'utf8'));
const failures = [];
for (const project of expected) {
  const result = results.find(r => r.id === project.id);
  if (project.download !== 'passed' || project.extraction !== 'passed') failures.push(`${project.pack}: ZIP incomplete`);
  else if (!result) failures.push(`${project.pack}/${project.id}: no runtime result`);
  else if (phase === 'container') {
    if (result.build?.status !== 'passed' || result.test?.status !== 'passed' || result.evidence?.status !== 'passed' || (result.compose && result.compose.status !== 'passed')) failures.push(`${project.pack}: Docker build/test/artifact/Compose verification failed`);
  } else if (!result.steps.some(s => s.label === 'tests') || result.steps.some(s => s.status !== 'passed') || result.evidence?.status !== 'passed') {
    failures.push(`${project.pack}/${project.id}: build/lint/test/artifact verification incomplete or failed`);
  }
}
for (const file of ['structure-results.json', 'option-results.json']) {
  const checks = await fs.readFile(path.join(run, file), 'utf8').then(JSON.parse).catch(() => null);
  if (checks && (file.startsWith('structure') ? checks.some(c => c.issues.length) : checks.length)) failures.push(`${file}: issues found`);
}
if (!expected.length) failures.push('No expected projects; refusing an empty audit pass');
console.log(`${expected.length} expected ${category} configurations; ${failures.length} failures`);
for (const failure of failures) console.error(failure);
process.exitCode = failures.length ? 1 : 0;
