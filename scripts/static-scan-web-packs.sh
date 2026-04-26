#!/usr/bin/env bash
# Cheap static pre-scan over every web pack. Generates each pack via
# /api/v1/generate, extracts it, and runs greps for known defect patterns.
# Prints a findings matrix. Does NOT install deps or compile.

set -u

PORT="${PORT:-5010}"
ORIGIN="http://localhost:${PORT}"
OUT="/tmp/qastarter-static-scan"
mkdir -p "$OUT"
rm -rf "$OUT"/*

PACKS=(
  "web-csharp-playwright-nunit-nuget            : framework=playwright  language=csharp       testRunner=nunit       buildTool=nuget"
  "web-csharp-selenium-nunit-nuget              : framework=selenium    language=csharp       testRunner=nunit       buildTool=nuget"
  "web-go-playwright-testify-mod                : framework=playwright  language=go           testRunner=testify     buildTool=mod"
  "web-java-playwright-junit5-maven             : framework=playwright  language=java         testRunner=junit5      buildTool=maven"
  "web-java-playwright-testng-maven             : framework=playwright  language=java         testRunner=testng      buildTool=maven"
  "web-java-selenium-junit5-maven               : framework=selenium    language=java         testRunner=junit5      buildTool=maven"
  "web-java-selenium-testng-maven               : framework=selenium    language=java         testRunner=testng      buildTool=maven"
  "web-java-playwright-junit5-gradle            : framework=playwright  language=java         testRunner=junit5      buildTool=gradle"
  "web-java-playwright-testng-gradle            : framework=playwright  language=java         testRunner=testng      buildTool=gradle"
  "web-java-selenium-junit5-gradle              : framework=selenium    language=java         testRunner=junit5      buildTool=gradle"
  "web-java-selenium-testng-gradle              : framework=selenium    language=java         testRunner=testng      buildTool=gradle"
  "web-javascript-cypress-cypress-npm           : framework=cypress     language=javascript   testRunner=cypress     buildTool=npm"
  "web-javascript-selenium-jest-npm             : framework=selenium    language=javascript   testRunner=jest        buildTool=npm"
  "web-javascript-webdriverio-mocha-npm         : framework=webdriverio language=javascript   testRunner=mocha       buildTool=npm"
  "web-python-playwright-pytest-pip             : framework=playwright  language=python       testRunner=pytest      buildTool=pip"
  "web-python-robotframework-robot-pip          : framework=robotframework language=python    testRunner=robot       buildTool=pip"
  "web-python-selenium-pytest-pip               : framework=selenium    language=python       testRunner=pytest      buildTool=pip"
  "web-typescript-cypress-cypress-npm           : framework=cypress     language=typescript   testRunner=cypress     buildTool=npm"
  "web-typescript-selenium-jest-npm             : framework=selenium    language=typescript   testRunner=jest        buildTool=npm"
  "web-typescript-webdriverio-mocha-npm         : framework=webdriverio language=typescript   testRunner=mocha       buildTool=npm"
)

for entry in "${PACKS[@]}"; do
  pack="${entry%%:*}"
  pack="${pack// /}"
  qs="${entry#*:}"
  # Parse k=v pairs into URL query
  url="${ORIGIN}/api/v1/generate?testingType=web&projectName=audit-${pack}"
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

  # PlaywrightManager singleton drift (we already fixed 2 packs)
  pm=$(grep -rIln 'PlaywrightManager' "$dir" 2>/dev/null | wc -l)
  [ "$pm" -gt 0 ] && findings+="  PlaywrightManager=${pm}"

  # Dead ScreenshotUtils (case-sensitive import bug)
  su=$(grep -rIln 'ScreenshotUtils' "$dir" 2>/dev/null | wc -l)
  [ "$su" -gt 0 ] && findings+="  ScreenshotUtils=${su}"

  # login.spec duplicates (testMatch excludes .spec.*)
  spec=$(find "$dir" -name 'login.spec.*' 2>/dev/null | wc -l)
  [ "$spec" -gt 0 ] && findings+="  login.spec=${spec}"

  # Import default / named mismatch heuristic: files with `import X from './y'`
  # where ./y.ts has `export { X }` (named only). Very rough — just count
  # suspicious default imports of files in the same dir.
  # (Skipped — too many false positives in static scan; will catch in compile.)

  # Total files
  total=$(find "$dir" -type f | wc -l)
  echo "[${total}f] ${pack}${findings}"
done
