# Phase 2: Template Engine Test Report

**Date:** 2026-01-10T13:07:31.491Z

## Summary

- **Total Tests:** 13
- **✅ Passed:** 13
- **❌ Failed:** 0
- **Success Rate:** 100.0%

## Test Results

### Test 1: Minimal Config (No CI/CD, No Reporting)

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: NONE
- Reporting Tool: NONE

**Files Generated:** 27

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 2: Maximal Config (GitHub Actions + ExtentReports)

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: github-actions
- Reporting Tool: extent-reports

**Files Generated:** 30

**CI/CD Files (1):**
- .github/workflows/tests.yml

**Reporting Files (2):**
- src/main/java/com/test/utils/ExtentManager.java
- src/main/resources/extent-config.xml

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 3: Jenkins CI/CD

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: jenkins
- Reporting Tool: NONE

**Files Generated:** 28

**CI/CD Files (1):**
- Jenkinsfile

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 4: GitLab CI/CD

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: gitlab-ci
- Reporting Tool: NONE

**Files Generated:** 28

**CI/CD Files (1):**
- .gitlab-ci.yml

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 5: Azure DevOps CI/CD

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: azure-devops
- Reporting Tool: NONE

**Files Generated:** 28

**CI/CD Files (1):**
- azure-pipelines.yml

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 6: CircleCI CI/CD

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: circleci
- Reporting Tool: NONE

**Files Generated:** 28

**CI/CD Files (1):**
- .circleci/config.yml

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 7: ExtentReports

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: NONE
- Reporting Tool: extent-reports

**Files Generated:** 29

**Reporting Files (2):**
- src/main/java/com/example/utils/ExtentManager.java
- src/main/resources/extent-config.xml

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 8: Allure Reports

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: NONE
- Reporting Tool: allure

**Files Generated:** 29

**Reporting Files (2):**
- src/main/java/com/example/utils/AllureManager.java
- src/main/resources/allure.properties

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 9: TestNG Reports

**Status:** ✅ PASSED

**Pack:** `web-java-selenium-testng-maven`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: NONE
- Reporting Tool: testng-reports

**Files Generated:** 27

**Test Resources (2):**
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 10: API Pack - ExtentReports Fix

**Status:** ✅ PASSED

**Pack:** `api-java-restassured-testng-maven`

**Configuration:**
- Testing Type: api
- Framework: restassured
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: NONE
- Reporting Tool: extent-reports

**Files Generated:** 31

**Reporting Files (2):**
- src/main/java/com/example/utils/ExtentManager.java
- src/main/resources/extent-config.xml

**Test Resources (2):**
- src/test/resources/testdata/users.json
- src/test/resources/testdata/test-requests.json

---

### Test 11: Playwright JUnit5 Pack

**Status:** ✅ PASSED

**Pack:** `web-java-playwright-junit5-maven`

**Configuration:**
- Testing Type: web
- Framework: playwright
- Language: java
- Test Runner: junit5
- Build Tool: maven
- CI/CD Tool: NONE
- Reporting Tool: NONE

**Files Generated:** 25

**Test Resources (3):**
- src/test/resources/junit-platform.properties
- src/test/resources/testdata/users.csv
- src/test/resources/testdata/sample.json

---

### Test 12: Python Pack - pytest-html

**Status:** ✅ PASSED

**Pack:** `web-python-selenium-pytest-pip`

**Configuration:**
- Testing Type: web
- Framework: selenium
- Language: python
- Test Runner: pytest
- Build Tool: pip
- CI/CD Tool: NONE
- Reporting Tool: pytest-html

**Files Generated:** 28

---

### Test 13: Desktop Pack - Legacy Cleanup

**Status:** ✅ PASSED

**Pack:** `desktop-java-winappdriver-testng-maven`

**Configuration:**
- Testing Type: desktop
- Framework: winappdriver
- Language: java
- Test Runner: testng
- Build Tool: maven
- CI/CD Tool: github-actions
- Reporting Tool: extent-reports

**Files Generated:** 33

**CI/CD Files (1):**
- .github/workflows/tests.yml

**Reporting Files (2):**
- src/main/java/com/example/utils/ExtentManager.java
- src/main/resources/extent-config.xml

---

