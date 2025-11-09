#!/usr/bin/env python3
"""
Smoke test for AmorFati app (static checks on files)
Checks:
 - index.html contains link to manifest.json
 - index.html contains service-worker registration code
 - index.html contains 4 nav-tabs
 - manifest.json exists and contains name/short_name
 - service-worker.js exists
 - offline.html exists
Exits with code 0 if all checks pass, non-zero otherwise.
"""
import sys
from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
index = root / 'index.html'
manifest = root / 'manifest.json'
sw = root / 'service-worker.js'
offline = root / 'offline.html'

errors = []

if not index.exists():
    errors.append('index.html not found')
else:
    text = index.read_text(encoding='utf-8')
    if 'rel="manifest"' not in text or 'manifest.json' not in text:
        errors.append('manifest link not found or not pointing to manifest.json in index.html')
    if 'serviceWorker' not in text or 'service-worker.js' not in text:
        errors.append('service worker registration code not found in index.html')
    # check nav-tab buttons
    nav_count = text.count('class="nav-tab"')
    if nav_count < 4:
        errors.append(f'expected >=4 nav-tab buttons, found {nav_count}')
    if 'id="assessmentForm"' not in text:
        errors.append('assessmentForm not found in index.html')

if not manifest.exists():
    errors.append('manifest.json not found')
else:
    try:
        m = json.loads(manifest.read_text(encoding='utf-8'))
        if not m.get('name') or not m.get('short_name'):
            errors.append('manifest.json missing name or short_name')
        if not m.get('start_url'):
            errors.append('manifest.json missing start_url')
    except Exception as e:
        errors.append('manifest.json invalid JSON: ' + str(e))

if not sw.exists():
    errors.append('service-worker.js not found')

if not offline.exists():
    errors.append('offline.html not found')

if errors:
    print('SMOKE TEST: FAIL')
    for e in errors:
        print(' -', e)
    sys.exit(2)

print('SMOKE TEST: OK')
sys.exit(0)
