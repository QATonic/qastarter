"""Validate and extract downloaded audit ZIPs, preserving executable launchers."""
import json
import os
from pathlib import Path
import stat
import sys
import zipfile

run = Path(sys.argv[1]).resolve()
inventory = json.loads((run / 'inventory.json').read_text(encoding='utf-8'))
categories = set(filter(None, os.environ.get('WEB_AUDIT_EXTRACT_CATEGORY', '').split(',')))
for index, project in enumerate(inventory['projects'], 1):
    if project.get('download') != 'passed' or project.get('extraction') == 'passed':
        continue
    destination = (run / 'projects' / project['id']).resolve()
    if not destination.is_relative_to(run):
        raise ValueError('Extraction target escaped audit run')
    try:
        with zipfile.ZipFile(run / 'zips' / (project['id'] + '.zip')) as archive:
            entries = archive.infolist()
            if len(entries) > 5000 or sum(entry.file_size for entry in entries) > 100 * 1024 * 1024:
                raise ValueError('Archive exceeds generator limits')
            for entry in entries:
                target = (destination / entry.filename).resolve()
                if not target.is_relative_to(destination) or stat.S_ISLNK(entry.external_attr >> 16):
                    raise ValueError('Unsafe archive path: ' + entry.filename)
            corrupt = archive.testzip()
            if corrupt:
                raise ValueError('CRC failure: ' + corrupt)
            project['archiveValidation'] = 'passed'
            if categories and not categories.intersection(project['categories']):
                project['extraction'] = 'not requested'
                continue
            archive.extractall(destination)
            for entry in entries:
                mode = (entry.external_attr >> 16) & 0o777
                if mode and not entry.is_dir():
                    (destination / entry.filename).chmod(mode)
            project['extraction'] = 'passed'
            project['fileCount'] = len([entry for entry in entries if not entry.is_dir()])
    except Exception as error:
        project['extraction'] = 'failed'
        project['error'] = str(error)
    if index % 25 == 0:
        (run / 'inventory.json').write_text(json.dumps(inventory, indent=2), encoding='utf-8')
        print('Validated', index, 'of', len(inventory['projects']), flush=True)
(run / 'inventory.json').write_text(json.dumps(inventory, indent=2), encoding='utf-8')
print('Extracted', sum(p.get('extraction') == 'passed' for p in inventory['projects']), 'projects')
