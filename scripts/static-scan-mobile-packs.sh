#!/usr/bin/env bash
# Static pre-scan over every mobile pack.

set -u

PORT="${PORT:-5041}"
ORIGIN="http://localhost:${PORT}"
OUT="/tmp/qastarter-mobile-scan"
mkdir -p "$OUT"
rm -rf "$OUT"/*

PACKS=(
  "mobile-csharp-appium-nunit-nuget                : framework=appium         language=csharp       testRunner=nunit         buildTool=nuget"
  "mobile-dart-flutter-flutter-test-pub            : framework=flutter        language=dart         testRunner=flutter-test  buildTool=pub"
  "mobile-java-appium-testng-maven                 : framework=appium         language=java         testRunner=testng        buildTool=maven"
  "mobile-java-appium-testng-gradle                : framework=appium         language=java         testRunner=testng        buildTool=gradle"
  "mobile-java-espresso-junit5-gradle              : framework=espresso       language=java         testRunner=junit5        buildTool=gradle"
  "mobile-javascript-appium-jest-npm               : framework=appium         language=javascript   testRunner=jest          buildTool=npm"
  "mobile-kotlin-espresso-junit5-gradle            : framework=espresso       language=kotlin       testRunner=junit5        buildTool=gradle"
  "mobile-python-appium-pytest-pip                 : framework=appium         language=python       testRunner=pytest         buildTool=pip"
  "mobile-swift-xcuitest-xctest-spm                : framework=xcuitest       language=swift        testRunner=xctest        buildTool=spm"
  "mobile-typescript-appium-jest-npm               : framework=appium         language=typescript   testRunner=jest          buildTool=npm"
)

for entry in "${PACKS[@]}"; do
  pack="${entry%%:*}"
  pack="${pack// /}"
  qs="${entry#*:}"
  url="${ORIGIN}/api/v1/generate?testingType=mobile&projectName=audit-${pack}"
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

  hbs=$(grep -rIln --exclude-dir=node_modules '{{[a-zA-Z_#/]' "$dir" 2>/dev/null | wc -l)
  [ "$hbs" -gt 0 ] && findings+="  HBS=${hbs}"

  # Singleton Manager drift
  mg=$(grep -rIln -E 'DriverManager|AppiumManager|ClientManager' "$dir" 2>/dev/null | wc -l)
  [ "$mg" -gt 0 ] && findings+="  Manager=${mg}"

  # Duplicate helpers
  su=$(find "$dir" -iname 'ScreenshotUtils*' -o -iname 'screenshot_utils*' 2>/dev/null | grep -v "screenshot_helper\|ScreenshotHelper" | wc -l)
  [ "$su" -gt 0 ] && findings+="  ScreenshotUtils=${su}"

  # login.spec duplicates alongside .test.*
  spec=$(find "$dir" -iname '*.spec.*' -not -path '*/node_modules/*' 2>/dev/null)
  test=$(find "$dir" -iname '*.test.*' -not -path '*/node_modules/*' 2>/dev/null)
  if [ -n "$spec" ] && [ -n "$test" ]; then
    findings+="  spec+test=both"
  fi

  # Python class-body indentation bug
  py_bad=0
  while IFS= read -r pyf; do
    awk '
      /^class .*:$/ { inclass=1; next }
      inclass && /^[a-zA-Z_]/ { print "bad"; exit }
    ' "$pyf" | grep -q bad && py_bad=$((py_bad + 1))
  done < <(find "$dir" -name "test_*.py" -type f 2>/dev/null)
  [ "$py_bad" -gt 0 ] && findings+="  py_unindent=${py_bad}"

  total=$(find "$dir" -type f | wc -l)
  echo "[${total}f] ${pack}${findings}"
done
