#!/usr/bin/env bash
# Static pre-scan over every desktop pack.

set -u

PORT="${PORT:-5051}"
ORIGIN="http://localhost:${PORT}"
OUT="/tmp/qastarter-desktop-scan"
mkdir -p "$OUT"
rm -rf "$OUT"/*

PACKS=(
  "desktop-csharp-winappdriver-nunit-nuget        : framework=winappdriver  language=csharp  testRunner=nunit   buildTool=nuget"
  "desktop-java-winappdriver-testng-maven         : framework=winappdriver  language=java    testRunner=testng  buildTool=maven"
  "desktop-java-winappdriver-testng-gradle        : framework=winappdriver  language=java    testRunner=testng  buildTool=gradle"
  "desktop-python-pyautogui-pytest-pip            : framework=pyautogui     language=python  testRunner=pytest  buildTool=pip"
  "desktop-python-winappdriver-pytest-pip         : framework=winappdriver  language=python  testRunner=pytest  buildTool=pip"
)

for entry in "${PACKS[@]}"; do
  pack="${entry%%:*}"
  pack="${pack// /}"
  qs="${entry#*:}"
  url="${ORIGIN}/api/v1/generate?testingType=desktop&projectName=audit-${pack}"
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

  mg=$(grep -rIln -E 'DriverManager|SessionManager|AppiumManager' "$dir" 2>/dev/null | wc -l)
  [ "$mg" -gt 0 ] && findings+="  Manager=${mg}"

  su=$(find "$dir" -iname 'ScreenshotUtils*' -o -iname 'screenshot_utils*' 2>/dev/null | grep -v "screenshot_helper\|ScreenshotHelper" | wc -l)
  [ "$su" -gt 0 ] && findings+="  ScreenshotUtils=${su}"

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
