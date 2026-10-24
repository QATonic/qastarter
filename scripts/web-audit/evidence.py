"""Require executed tests and selected reporter artifacts, beyond exit codes."""
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

root = Path(sys.argv[1]).resolve()
config = json.loads(sys.argv[2])
log = Path(sys.argv[3]).read_text(encoding='utf-8', errors='replace')
log = re.sub(r'\x1b\[[0-9;]*m', '', log)
evidence = {'testCount': 0, 'bddScenarios': 0, 'artifacts': [], 'issues': []}
reports = []
for directory in ('reports', 'results', 'test-results', 'TestResults', 'target', 'build', 'allure-results', 'test-output', 'cypress/results'):
    folder = root / directory
    if folder.is_dir():
        reports.extend(p for p in folder.rglob('*') if p.is_file())
reports = list(dict.fromkeys(reports))
if config.get('testingPattern') == 'bdd' and config['language'] in ('java', 'javascript', 'typescript'):
    cucumber = [p for p in reports if p.name == 'cucumber.json']
    for p in cucumber:
        data = json.loads(p.read_text(encoding='utf-8'))
        for feature in data:
            for scenario in feature.get('elements', []):
                if scenario.get('type') != 'scenario':
                    continue
                evidence['bddScenarios'] += 1
                steps = scenario.get('steps', [])
                if not steps or any(s.get('result', {}).get('status') != 'passed' for s in steps):
                    evidence['issues'].append('BDD scenario did not pass: ' + scenario.get('name', ''))
        evidence['artifacts'].append(str(p.relative_to(root)))
    if not evidence['bddScenarios']:
        evidence['issues'].append('No executed BDD scenarios in Cucumber JSON')
    evidence['testCount'] = evidence['bddScenarios']
else:
    for p in reports:
        if p.suffix not in ('.xml', '.trx'):
            continue
        try:
            document = ET.parse(p).getroot()
            if p.suffix == '.trx':
                counters = document.find('.//{*}Counters')
                if counters is not None:
                    evidence['testCount'] += int(counters.get('passed', '0'))
                if config.get('testingPattern') == 'bdd':
                    methods = document.findall('.//{*}TestMethod')
                    evidence['bddScenarios'] += sum('.Features.' in m.get('className', '') for m in methods)
            elif document.tag == 'testsuite':
                evidence['testCount'] += int(document.get('tests', '0')) - int(document.get('skipped', '0'))
            elif document.tag == 'testsuites':
                evidence['testCount'] += sum(int(s.get('tests', '0')) - int(s.get('skipped', '0')) for s in document.findall('testsuite'))
        except (ET.ParseError, ValueError):
            pass
    if not evidence['testCount']:
        for expression in (r'Tests:\s+(\d+) passed', r'(\d+) passing', r'(\d+) passed', r'Tests:\s+(\d+)', r'Passed:\s+(\d+)'):
            matches = re.findall(expression, log)
            if matches:
                evidence['testCount'] = sum(map(int, matches))
                break
        if config['language'] == 'go':
            evidence['testCount'] = len(re.findall(r'--- PASS: Test\w+/', log)) or len(re.findall(r'--- PASS:', log))
    if config.get('testingPattern') == 'bdd' and config['language'] == 'csharp' and not evidence['bddScenarios']:
        evidence['issues'].append('No SpecFlow feature methods in TRX')
if not evidence['testCount']:
    evidence['issues'].append('No executed tests found')

reporter = config.get('reportingTool')
if reporter == 'allure':
    artifacts = [p for p in reports if p.name.endswith('-result.json')]
    if not artifacts:
        evidence['issues'].append('Allure selected but no test result JSON produced')
elif reporter in ('extent-reports', 'jest-html', 'pytest-html', 'mochawesome', 'robot-reports'):
    def matches_reporter(p):
        relative = str(p.relative_to(root)).replace('\\', '/').lower()
        if reporter == 'extent-reports':
            return 'extent' in relative
        if reporter == 'jest-html':
            return p.name == 'test-report.html'
        if reporter == 'pytest-html':
            return relative == 'reports/report.html'
        if reporter == 'mochawesome':
            return relative.startswith('cypress/results/')
        return relative in ('results/log.html', 'results/report.html')
    artifacts = [p for p in reports if p.suffix == '.html' and p.stat().st_size > 200 and matches_reporter(p)]
    if not artifacts:
        evidence['issues'].append(f'{reporter} selected but no HTML report produced')
else:
    artifacts = []
evidence['artifacts'].extend(str(p.relative_to(root)) for p in artifacts)
evidence['status'] = 'failed' if evidence['issues'] else 'passed'
print(json.dumps(evidence))
