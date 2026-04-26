#!/usr/bin/env bash
# Static pre-scan over every API pack. Generates each via /api/v1/generate,
# extracts it, and runs greps for known drift patterns. Prints findings.
# Does NOT install deps or compile — this is the fast triage pass.

set -u

PORT="${PORT:-5030}"
ORIGIN="http://localhost:${PORT}"
OUT="/tmp/qastarter-api-scan"
mkdir -p "$OUT"
rm -rf "$OUT"/*

PACKS=(
  "api-csharp-restsharp-nunit-nuget              : framework=restsharp    language=csharp       testRunner=nunit    buildTool=nuget"
  "api-go-resty-testify-mod                      : framework=resty        language=go           testRunner=testify  buildTool=mod"
  "api-java-restassured-testng-maven             : framework=restassured  language=java         testRunner=testng   buildTool=maven"
  "api-java-restassured-testng-gradle            : framework=restassured  language=java         testRunner=testng   buildTool=gradle"
  "api-javascript-supertest-jest-npm             : framework=supertest    language=javascript   testRunner=jest     buildTool=npm"
  "api-python-requests-pytest-pip                : framework=requests     language=python       testRunner=pytest   buildTool=pip"
  "api-typescript-graphql-jest-npm               : framework=graphql      language=typescript   testRunner=jest     buildTool=npm"
  "api-typescript-grpc-jest-npm                  : framework=grpc         language=typescript   testRunner=jest     buildTool=npm"
  "api-typescript-supertest-jest-npm             : framework=supertest    language=typescript   testRunner=jest     buildTool=npm"
)

for entry in "${PACKS[@]}"; do
  pack="${entry%%:*}"
  pack="${pack// /}"
  qs="${entry#*:}"
  url="${ORIGIN}/api/v1/generate?testingType=api&projectName=audit-${pack}"
  for kv in $qs; do
    url="${url}&${kv}"
  done

  zip="${OUT}/${pack}.zip"
  http=$(curl -sS -H "Origin: ${ORIGIN}" -o "$zip" -w "%{http_code}" "$url")
  if [ "$http" != "200" ]; then
    echo "[DL-FAIL ${http}] ${pack}"
    continue
  fi
  dir="${OUT}/${pack}"
  rm -rf "$dir" && mkdir -p "$dir"
  unzip -q "$zip" -d "$dir" 2>/dev/null

  findings=""

  # Unrendered handlebars
  hbs=$(grep -rIln --exclude-dir=node_modules '{{[a-zA-Z_#/]' "$dir" 2>/dev/null | wc -l)
  [ "$hbs" -gt 0 ] && findings+="  HBS=${hbs}"

  # Singleton Manager drift pattern
  mg=$(grep -rIln -E 'ClientManager|RequestManager|HttpClientManager|ApiClientManager' "$dir" 2>/dev/null | wc -l)
  [ "$mg" -gt 0 ] && findings+="  Manager=${mg}"

  # Dead duplicate helpers
  sh=$(find "$dir" -iname 'ScreenshotUtils*' -o -iname 'ScreenshotHelper*' 2>/dev/null | wc -l)
  [ "$sh" -gt 0 ] && findings+="  screenshot_files=${sh}"

  # login.spec duplicates (API shouldn't have these but check anyway)
  spec=$(find "$dir" -iname '*.spec.*' -not -path '*/node_modules/*' 2>/dev/null | wc -l)
  sp=$(find "$dir" -iname '*test*.spec.*' 2>/dev/null | wc -l)
  [ "$sp" -gt 0 ] && findings+="  test.spec=${sp}"

  # Check for Python indentation bug (unindented class body)
  py_bad=0
  if ls "$dir"/tests/test_*.py 2>/dev/null >/dev/null; then
    # Look for class X: followed by an unindented line (except blanks/comments)
    for pyf in "$dir"/tests/test_*.py; do
      if awk '/^class [A-Za-z_].*:$/{inclass=1; next} inclass && /^[^ \t#\n]/{print; exit 1}' "$pyf" >/dev/null 2>&1; then
        :
      else
        py_bad=$((py_bad + 1))
      fi
    done
  fi
  [ "$py_bad" -gt 0 ] && findings+="  py_unindent=${py_bad}"

  total=$(find "$dir" -type f | wc -l)
  echo "[${total}f] ${pack}${findings}"
done
