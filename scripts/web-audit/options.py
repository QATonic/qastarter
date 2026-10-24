"""Check whether advertised options produce their promised project files/code."""
import json
from pathlib import Path
import sys
import zipfile

run = Path(sys.argv[1]).resolve()
inventory = json.loads((run / 'inventory.json').read_text(encoding='utf-8'))
projects = [p for p in inventory['projects'] if p.get('download') == 'passed']
ci_paths = {'github-actions': '.github/workflows/tests.yml', 'gitlab-ci': '.gitlab-ci.yml',
            'azure-devops': 'azure-pipelines.yml', 'circleci': '.circleci/config.yml', 'jenkins': 'Jenkinsfile'}
cache = {}
def files(project):
    if project['id'] not in cache:
        with zipfile.ZipFile(run / 'zips' / (project['id'] + '.zip')) as archive:
            cache[project['id']] = {name: archive.read(name) for name in archive.namelist() if not name.endswith('/')}
    return cache[project['id']]

issues = []
for project in projects:
    config = project['config']
    output = files(project)
    expected = ci_paths.get(config.get('cicdTool'))
    if expected and expected not in output:
        issues.append({'id': project['id'], 'pack': project['pack'], 'option': config['cicdTool'], 'issue': 'Selected CI file is missing', 'file': expected})
    for name in ('docker-compose.yml', 'docker-compose.yaml'):
        if name in output and b'build:' in output[name] and 'Dockerfile' not in output:
            issues.append({'id': project['id'], 'pack': project['pack'], 'option': 'includeDockerCompose', 'issue': 'Compose builds a project without a Dockerfile', 'file': name})
    reporter = config.get('reportingTool')
    if not reporter or 'runtime' not in project['categories']:
        continue
    # These reports are provided by the default runner, so identical output is
    # expected. This check identifies missing optional integrations, not defaults.
    if ((config['language'] == 'java' and reporter == 'junit-reports')
        or (config['testRunner'] == 'testng' and reporter == 'testng-reports')
        or (config['testRunner'] == 'nunit' and reporter == 'nunit-reports')
        or (config['testRunner'] == 'pytest' and reporter == 'pytest-html')
        or (config['testRunner'] == 'robot' and reporter == 'robot-reports')):
        continue
    baseline = next((p for p in projects if p['pack'] == project['pack'] and 'runtime' in p['categories']
                     and p['config']['testingPattern'] == config['testingPattern'] and not p['config'].get('reportingTool')), None)
    if not baseline:
        continue
    def functional(output):
        return {name: data for name, data in output.items() if not name.lower().endswith('.md') and name != '.gitignore'}
    if functional(output) == functional(files(baseline)):
        issues.append({'id': project['id'], 'pack': project['pack'], 'pattern': config['testingPattern'], 'option': reporter, 'issue': 'Selected reporter produces no functional change from no reporter'})
(run / 'option-results.json').write_text(json.dumps(issues, indent=2), encoding='utf-8')
groups = {}
for issue in issues:
    key = issue['pack'] + ': ' + issue['option'] + ': ' + issue['issue']
    groups[key] = groups.get(key, 0) + 1
(run / 'option-summary.json').write_text(json.dumps(groups, indent=2), encoding='utf-8')
print(len(issues), 'option mismatches;', len(groups), 'distinct pack/option findings')
