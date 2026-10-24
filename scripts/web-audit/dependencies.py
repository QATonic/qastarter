"""Inventory resolved baseline dependencies and query the public OSV database."""
import importlib.metadata
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.request

run = Path(sys.argv[1]).resolve()
inventory = json.loads((run / 'inventory.json').read_text())
output = run / 'security'
output.mkdir(exist_ok=True)
env = dict(os.environ)
java = env.get('WEB_AUDIT_JAVA_HOME')
if java:
    env['JAVA_HOME'] = java
    env['PATH'] = str(Path(java) / 'bin') + os.pathsep + env.get('PATH', '')
init = output / 'dependencies.gradle'
init.write_text('''allprojects {
    tasks.register('auditDependencyInventory') {
        doLast {
            def deps = configurations.testRuntimeClasspath.resolvedConfiguration.resolvedArtifacts.collect {
                [name: "${it.moduleVersion.id.group}:${it.moduleVersion.id.name}", version: it.moduleVersion.id.version]
            }.unique()
            new File(System.getProperty('audit.output')).text = groovy.json.JsonOutput.toJson(deps)
        }
    }
}
''')
projects = []
def command(args, cwd):
    completed = subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=180)
    if completed.returncode:
        raise RuntimeError(f'Dependency inventory command exited {completed.returncode}')
    return completed.stdout

for project in inventory['projects']:
    if 'baseline' not in project['categories']:
        continue
    folder = run / 'projects' / project['id']
    config = project['config']
    row = {'id': project['id'], 'pack': project['pack'], 'dependencies': []}
    deps = set()
    try:
        language = config['language']
        if language in ('javascript', 'typescript'):
            lock = json.loads((folder / 'package-lock.json').read_text(encoding='utf-8'))
            for location, package in lock['packages'].items():
                if not location or not package.get('version'):
                    continue
                name = package.get('name') or location.rsplit('node_modules/', 1)[-1]
                deps.add(('npm', name, package['version']))
        elif language == 'python':
            site = folder / '.venv' / ('Lib/site-packages' if os.name == 'nt' else 'lib/python3.12/site-packages')
            for dist in importlib.metadata.distributions(path=[str(site)]):
                name = re.sub(r'[-_.]+', '-', dist.metadata['Name']).lower()
                deps.add(('PyPI', name, dist.version))
        elif language == 'csharp':
            assets = json.loads((folder / 'obj/project.assets.json').read_text())
            for key, package in assets['libraries'].items():
                if package['type'] == 'package':
                    name, version = key.rsplit('/', 1)
                    deps.add(('NuGet', name, version))
        elif language == 'go':
            stream = command(['go', 'list', '-m', '-json', 'all'], folder)
            decoder = json.JSONDecoder()
            while stream.strip():
                item, index = decoder.raw_decode(stream.lstrip())
                stream = stream.lstrip()[index:]
                if item.get('Version'):
                    deps.add(('Go', item['Path'], item['Version']))
        elif config['buildTool'] == 'maven':
            classpath = output / (project['id'] + '-classpath.txt')
            command(['mvn.cmd' if os.name == 'nt' else 'mvn', '-B', '-q', 'dependency:build-classpath', '-Dmdep.includeScope=test', f'-Dmdep.outputFile={classpath}'], folder)
            for item in classpath.read_text().strip().split(os.pathsep):
                path = Path(item.replace('\\', '/'))
                parts = path.parts
                if 'repository' in parts and path.suffix == '.jar':
                    relative = parts[parts.index('repository') + 1:]
                    group, artifact, version = '.'.join(relative[:-3]), relative[-3], relative[-2]
                    deps.add(('Maven', f'{group}:{artifact}', version))
        else:
            dependency_file = output / (project['id'] + '-gradle.json')
            command([str(folder / 'gradlew.bat') if os.name == 'nt' else './gradlew', '--no-daemon', '--max-workers=2', '-Dorg.gradle.jvmargs=-Xmx384m', '-I', str(init), f'-Daudit.output={dependency_file}', 'auditDependencyInventory'], folder)
            for dep in json.loads(dependency_file.read_text()):
                deps.add(('Maven', dep['name'], dep['version']))
        if not deps:
            raise RuntimeError('No resolved dependencies found')
        row['dependencies'] = [{'ecosystem': e, 'name': n, 'version': v} for e, n, v in sorted(deps)]
        row['status'] = 'inventoried'
    except Exception as error:
        row['status'] = 'incomplete'
        row['error'] = str(error)
    projects.append(row)
    (output / 'inventory.json').write_text(json.dumps(projects, indent=2))
    print(row['pack'], row['status'], len(deps), flush=True)

unique = {tuple(d[k] for k in ('ecosystem', 'name', 'version')) for p in projects for d in p['dependencies']}
queries = sorted(unique)
vulnerabilities = {}
errors = []
for offset in range(0, len(queries), 100):
    batch = queries[offset:offset + 100]
    payload = {'queries': [{'package': {'ecosystem': e, 'name': n}, 'version': v} for e, n, v in batch]}
    try:
        req = urllib.request.Request('https://api.osv.dev/v1/querybatch', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=60) as response:
            data = json.load(response)
        if len(data['results']) != len(batch):
            raise RuntimeError('Incomplete OSV batch response')
        for package, result in zip(batch, data['results']):
            if result.get('next_page_token'):
                raise RuntimeError('OSV response needs pagination; audit is incomplete')
            vulnerabilities[package] = [v['id'] for v in result.get('vulns', [])]
    except Exception as error:
        errors.append({'offset': offset, 'error': str(error)})
    time.sleep(0.1)
for row in projects:
    row['findings'] = [dict(dep, vulnerabilities=vulnerabilities.get(tuple(dep[k] for k in ('ecosystem', 'name', 'version')), [])) for dep in row['dependencies'] if vulnerabilities.get(tuple(dep[k] for k in ('ecosystem', 'name', 'version')))]
result = {'source': 'https://api.osv.dev/v1/querybatch', 'scope': 'Resolved baseline dependencies only; optional BDD/reporter/cloud dependency graphs require separate checks', 'uniqueDependencies': len(queries), 'queriedDependencies': len(vulnerabilities), 'errors': errors, 'projects': projects}
(output / 'osv-results.json').write_text(json.dumps(result, indent=2))
print('OSV results:', len(queries), 'dependencies;', sum(len(p['findings']) for p in projects), 'affected project/package pairs;', len(errors), 'query errors', flush=True)
