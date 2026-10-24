"""Inspect downloaded ZIPs without shadowing Python's standard inspect module."""
import ast
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import zipfile

run = Path(sys.argv[1]).resolve()
inventory = json.loads((run / 'inventory.json').read_text(encoding='utf-8'))
results = []
syntax = []
for project in inventory['projects']:
    result = {key: project[key] for key in ('id', 'pack', 'config', 'categories')}
    result['issues'] = []
    if project.get('download') != 'passed':
        result['issues'].append({'file': '', 'check': 'download', 'error': project.get('error')})
        results.append(result)
        continue
    with zipfile.ZipFile(run / 'zips' / (project['id'] + '.zip')) as archive:
        files = [name for name in archive.namelist() if not name.endswith('/')]
        result['files'] = files
        for required in ('README.md', '.gitignore'):
            if required not in files:
                result['issues'].append({'file': required, 'check': 'structure', 'error': 'Missing project root file'})
        language = project['config']['language']
        expected = {'java': 'build.gradle' if project['config']['buildTool'] == 'gradle' else 'pom.xml',
                    'javascript': 'package.json', 'typescript': 'package.json',
                    'python': 'requirements.txt', 'go': 'go.mod', 'csharp': project['config']['projectName'] + '.csproj'}[language]
        if expected not in files:
            result['issues'].append({'file': expected, 'check': 'structure', 'error': 'Missing dependency/build manifest'})
        for name in files:
            if name.endswith(('.jar', '.png', '.jpg', '.ico')):
                continue
            try:
                content = archive.read(name).decode('utf-8-sig')
            except UnicodeDecodeError:
                continue
            try:
                if name.endswith('.json'):
                    json.loads(content)
                elif name.endswith(('.xml', '.csproj')):
                    ET.fromstring(content)
                elif name.endswith('.py'):
                    ast.parse(content, filename=name)
                elif name.endswith(('.yml', '.yaml', '.js', '.ts', '.mjs', '.cjs')):
                    syntax.append({'id': project['id'], 'name': name, 'content': content})
            except (ValueError, SyntaxError, ET.ParseError) as error:
                result['issues'].append({'file': name, 'check': 'syntax', 'error': str(error)})
            if any(token in content for token in ('{{#if', '{{/if', '{{projectName}}', '{{packagePath}}', '{{toolVersions.')):
                result['issues'].append({'file': name, 'check': 'rendering', 'error': 'Unresolved generator expression'})
    results.append(result)
(run / 'structure-results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
(run / 'syntax-input.json').write_text(json.dumps(syntax), encoding='utf-8')
print('Inspected', len(results), 'ZIP configurations;', sum(bool(r['issues']) for r in results), 'with structural/syntax issues')
