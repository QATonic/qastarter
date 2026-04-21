#!/usr/bin/env bash
# Web-pack verification harness.
#
# Iterates every web-* pack, generates it via /api/v1/generate, extracts,
# and runs an appropriate install + compile / collect step for the language.
# Prints a pass/fail matrix at the end.
#
# Expects the QAStarter server to already be running on $PORT (default 5010).

set -u

PORT="${PORT:-5010}"
ORIGIN="http://localhost:${PORT}"
OUT="/tmp/qastarter-audit"
mkdir -p "$OUT"
rm -rf "$OUT"/*

# List of "pack = verify command" entries.
# Pack id encodes: web-{lang}-{framework}-{runner}-{buildtool}
PACKS=(
  # JS / TS — fastest to verify
  "web-javascript-cypress-cypress-npm                  : npm install --no-audit --no-fund --prefer-offline --loglevel=error && node -e \"require('./cypress.config.js')\""
  "web-typescript-cypress-cypress-npm                  : npm install --no-audit --no-fund --prefer-offline --loglevel=error && npx tsc --noEmit"
  "web-javascript-webdriverio-mocha-npm                : npm install --no-audit --no-fund --prefer-offline --loglevel=error && node -e \"require('./wdio.conf.js')\""
  "web-typescript-webdriverio-mocha-npm                : npm install --no-audit --no-fund --prefer-offline --loglevel=error && npx tsc --noEmit"
  "web-javascript-selenium-jest-npm                    : npm install --no-audit --no-fund --prefer-offline --loglevel=error && node -e \"require('./jest.config.js')\""
  "web-typescript-selenium-jest-npm                    : npm install --no-audit --no-fund --prefer-offline --loglevel=error && npx tsc --noEmit"

  # Python — fast, pip install + pytest --collect-only
  "web-python-playwright-pytest-pip                    : python -m pip install --quiet -r requirements.txt && python -m pytest --collect-only -q"
  "web-python-selenium-pytest-pip                      : python -m pip install --quiet -r requirements.txt && python -m pytest --collect-only -q"
  "web-python-robotframework-robot-pip                 : python -m pip install --quiet -r requirements.txt && python -m robot --dryrun tests/"

  # Java + Maven — slow but works
  "web-java-playwright-junit5-maven                    : mvn -B -q -o test-compile || mvn -B -q test-compile"
  "web-java-playwright-testng-maven                    : mvn -B -q -o test-compile || mvn -B -q test-compile"
  "web-java-selenium-junit5-maven                      : mvn -B -q -o test-compile || mvn -B -q test-compile"
  "web-java-selenium-testng-maven                      : mvn -B -q -o test-compile || mvn -B -q test-compile"

  # Go — fast
  "web-go-playwright-testify-mod                       : go build ./..."

  # C# / .NET — fast enough
  "web-csharp-playwright-nunit-nuget                   : dotnet restore --verbosity quiet && dotnet build --no-restore --verbosity quiet"
  "web-csharp-selenium-nunit-nuget                     : dotnet restore --verbosity quiet && dotnet build --no-restore --verbosity quiet"
)

pass=0
fail=0
RESULTS=()

for entry in "${PACKS[@]}"; do
  pack="${entry%%:*}"
  verify="${entry#*:}"
  pack="${pack// /}"
  verify="${verify# }"

  echo ""
  echo "================================================================"
  echo ">>> Pack: $pack"
  echo "================================================================"

  IFS='-' read -r _web lang framework runner buildtool <<<"$pack"
  url="${ORIGIN}/api/v1/generate?testingType=web&framework=${framework}&language=${lang}&testRunner=${runner}&buildTool=${buildtool}&projectName=audit-${pack}"

  zip="${OUT}/${pack}.zip"
  http=$(curl -sS -H "Origin: ${ORIGIN}" -o "$zip" -w "%{http_code}" "$url")
  if [ "$http" != "200" ]; then
    echo "DOWNLOAD FAILED: HTTP $http"
    fail=$((fail + 1))
    RESULTS+=("FAIL download ${http}  ${pack}")
    continue
  fi

  dir="${OUT}/${pack}"
  rm -rf "$dir" && mkdir -p "$dir"
  unzip -q "$zip" -d "$dir" || { echo "UNZIP FAILED"; fail=$((fail + 1)); RESULTS+=("FAIL unzip  ${pack}"); continue; }

  # Unrendered Handlebars check
  if grep -rIln --exclude-dir=node_modules --exclude='*.jar' --exclude='*.png' --exclude='*.jpg' '{{[a-zA-Z_]' "$dir" >/dev/null 2>&1; then
    echo "UNRENDERED HANDLEBARS MARKERS DETECTED"
    grep -rIln --exclude-dir=node_modules --exclude='*.jar' --exclude='*.png' --exclude='*.jpg' '{{[a-zA-Z_]' "$dir" | head -5 | sed 's#^#  #'
  fi

  pushd "$dir" > /dev/null
  if bash -c "$verify" > "${OUT}/${pack}.log" 2>&1; then
    echo "PASS"
    pass=$((pass + 1))
    RESULTS+=("PASS         ${pack}")
  else
    echo "FAIL (see ${OUT}/${pack}.log)"
    tail -20 "${OUT}/${pack}.log" | sed 's#^#  #'
    fail=$((fail + 1))
    RESULTS+=("FAIL verify  ${pack}")
  fi
  popd > /dev/null
done

echo ""
echo "================================================================"
echo "SUMMARY: ${pass} passed, ${fail} failed"
echo "================================================================"
for r in "${RESULTS[@]}"; do
  echo "  $r"
done
