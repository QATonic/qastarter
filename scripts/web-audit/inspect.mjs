import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import yaml from 'js-yaml';
import { parse } from 'acorn';

const run = path.resolve(process.argv[2]);
const results = JSON.parse(await fs.readFile(path.join(run, 'structure-results.json'), 'utf8'));
const byId = new Map(results.map(result => [result.id, result]));
const inputs = JSON.parse(await fs.readFile(path.join(run, 'syntax-input.json'), 'utf8'));
for (const { id, name, content } of inputs) {
  try {
    if (/\.ya?ml$/.test(name)) yaml.load(content);
    else if (/\.[cm]?js$/.test(name)) parse(content, { ecmaVersion: 'latest', sourceType: 'module' });
    else {
      const file = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true);
      for (const diagnostic of file.parseDiagnostics) {
        const { line } = file.getLineAndCharacterOfPosition(diagnostic.start || 0);
        byId.get(id).issues.push({ file: name, check: 'syntax', line: line + 1, error: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') });
      }
    }
  } catch (error) {
    byId.get(id).issues.push({ file: name, check: 'syntax', error: error.message });
  }
}
await fs.writeFile(path.join(run, 'structure-results.json'), JSON.stringify(results, null, 2));
const groups = new Map();
for (const result of results) for (const issue of result.issues) {
  const key = `${result.pack}: ${issue.file}: ${issue.error}`;
  groups.set(key, (groups.get(key) || 0) + 1);
}
await fs.writeFile(path.join(run, 'structure-summary.json'), JSON.stringify(Object.fromEntries(groups), null, 2));
console.log(`${results.length} configurations inspected; ${results.filter(result => result.issues.length).length} with issues; ${groups.size} distinct issues`);
