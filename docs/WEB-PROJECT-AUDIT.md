# Web project audit — updated 24 October 2026

**Status: incomplete. Do not treat this as company-readiness approval.**

The audit covers 22 web template packs: Java, JavaScript, TypeScript, Python,
C#, and Go; Selenium, Playwright, Cypress, WebdriverIO, and Robot Framework;
Maven, Gradle, npm, pip, NuGet, and Go modules.

The detailed, partial coverage matrix is in [web-audit-results.json](web-audit-results.json).
API, mobile, desktop, and performance projects have not been audited in this pass.

## Completed evidence

- Downloaded and extracted **697 web configurations** through the production
  generation API. The matrix covers each advertised pattern/reporter pairing,
  CI choice, cloud choice, no-sample mode, utilities disabled, and each utility
  enabled individually. It is not the Cartesian product of every option.
- Validated ZIP paths, CRCs, executable metadata, root README, ignore file,
  dependency manifests, and rendering. JSON, XML, Python, JavaScript,
  TypeScript, and YAML syntax checks pass in the latest completed matrix.
- Confirmed real browser execution for several combinations, including repaired
  C# suites, Go, all four Java Playwright variants, JavaScript Playwright,
  Selenium and WebdriverIO, and TypeScript Playwright and Selenium.
- Robot Framework passed all five tests against public SauceDemo with an
  explicit headless browser override. Its earlier local-fixture failures are
  not evidence of a framework defect.
- Added 38 template regression tests and additional option-validation regressions.
  The 24 October server/shared run passed **829 tests** after reviewing and
  updating the expected snapshots. Client and CLI suites passed 63 and 36 tests.
  Type checking passed; the latest full and targeted lint retries stalled locally.
- A subsequent matrix downloaded **665 currently supported configurations** with
  zero structure/syntax issues and zero reporter no-ops. Unsupported reporter
  choices were removed from wizard/API validation. This matrix predates the last
  BDD, TypeScript WebdriverIO and CI follow-up repairs, which need their own reruns.
- The fresh baseline build pass completed successfully for 21 of 22 packs.
  TypeScript WebdriverIO exposed missing DOM types and an unknown ESLint rule;
  those source fixes await regeneration and retesting. Native browser runs passed
  for both C# packs, Go, and all eight Java baselines before the Cypress stall.
- Resolved dependency inventories for all 22 baselines were checked against OSV:
  **1,225 distinct package versions queried, zero query errors, 90 affected
  project/package pairs**. These are advisory matches, including toolchain
  dependencies; remediation and reachability review remain open. Optional
  BDD/reporter/cloud graphs are not covered by this baseline scan.

These are intermediate results. Successful earlier browser runs do not certify
the final repaired ZIPs. The final public-app run across all 22 repaired
baselines did not complete.

## Defects corrected in the working tree

1. C# projects omitted CSV data from build output, breaking NUnit data sources.
2. C# credentials accidentally used Windows' system `USERNAME`. Test credentials
   now use dedicated environment variables and prefixed configuration overrides.
3. C# BDD generated invalid namespaces and assembly-hook class names for project
   names containing hyphens. Generated assemblies now use the sanitized namespace.
4. C# Playwright multiplied a millisecond timeout by 1,000.
5. Java Selenium/JUnit/Gradle shipped successful-login rows for unrelated users.
6. Cypress sample tests expected an array, while their fixture contained an object
   with unrelated placeholder accounts.
7. Python Playwright lacked credential properties; its CSV reader included the
   header as test data. Python Selenium parametrized dictionary keys rather than
   credential values and shipped unrelated successful-login credentials.
8. Python test credential lookup could collide with Windows' `USERNAME` variable.
9. Playwright's pytest output cleanup could delete the HTML report directory.
   HTML reports now use a separate directory.
10. Several generated CI YAML files had invalid indentation. Robot CI jobs now
    distinguish Robot output XML from JUnit XML and collect an actual xUnit file.
11. CircleCI checksum expressions broke four Java Playwright/Gradle downloads.
12. JavaScript Selenium's optional Allure Jest configuration had invalid syntax.
13. Node projects lacked standalone lint configuration or required dependencies.
    TypeScript Selenium also used an incompatible legacy lint CLI flag.
14. Web Faker factories called an API absent from their declared Faker v8
    dependency. TypeScript checks now include utility modules where omitted.
15. Go and Robot ignored headless settings; JavaScript WebdriverIO only checked
    an argv flag. The Go Playwright installer also used an SDK version that could
    differ from the project's dependency.
16. Selecting Compose without Docker omitted the Dockerfile needed by its build.
17. Go advertised CircleCI but did not generate its configuration file.
18. Removed unsupported reporter choices and made Java reporter availability
    runner-specific. BDD Playwright projects no longer offer a Jest HTML formatter.
19. Repaired web Docker bootstrapping: lockfile-free npm installation, Cypress's
    inherited entrypoint, browser/SDK alignment, Maven availability, and Linux
    browser dependencies. Container validation remains in progress.
20. JavaScript/TypeScript BDD projects now have runnable Cucumber/preprocessor
    configuration and steps using their selected browser framework. Python BDD
    discovery and browser fixtures were corrected; sample features use SauceDemo.
21. Replaced broken C# BDD bindings with scenario-owned browser lifecycle and
    bindings matching the generated framework. Both regenerated C# projects now
    build and pass their scenario/browser runs, with executed feature methods
    confirmed in TRX evidence. Other reporter combinations still need retesting.
22. TestNG BDD suites now select the Cucumber runner instead of ordinary tests.
23. JUnit BDD selection avoids duplicate scenario execution; Selenium/Maven now
    includes the JUnit Platform suite dependency required by its runner.
24. Corrected TypeScript WebdriverIO utility compilation and an invalid lint-rule
    suppression. Its container Chrome options now include the required root flags.
25. Corrected lockfile assumptions and missing report commands in generated Node
    CI files, and aligned Java Gradle CI browser-install/headless task arguments.

Fixes are on `codex/web-template-runtime-audit`. Earlier review PR #27
is the base review work. Some fixes have runtime evidence; others have generation, syntax,
or regression-test evidence only and still need final runtime verification.

## Remaining findings and verification

The original option comparison found **29 configurations across 15 pack/reporter groups**
where selecting an optional reporter produces no functional change from selecting
none. Native/default runner reports were excluded from that comparison. These
unsupported choices are now rejected; the latest completed comparison found zero
such no-ops. Runtime verification of the remaining reporters is still required.

| Packs | Advertised option needing correction |
| --- | --- |
| C# Playwright | ExtentReports |
| Java Playwright and Selenium with JUnit, Maven and Gradle | TestNG reports |
| JavaScript/TypeScript Cypress | Jest HTML reporter |
| JavaScript/TypeScript Selenium | Jest HTML reporter, Mochawesome |
| JavaScript/TypeScript WebdriverIO | Mochawesome, Jest HTML reporter |

Other reporter choices still need execution and verification of their output
artifacts. A dependency or properties file alone is not proof that a reporter
works. BDD suites must be executed through their BDD runner, rather than counting
only the ordinary sample tests.

The following remain pending, in order of follow-up. This is a status update;
no new runtime passes are claimed by this update.

| Follow-up | Outstanding work |
| --- | --- |
| Local execution blocker | Confirm the cause of the file-access/install stalls, including the user-reported possibility of Quick Heal blocking or quarantining CLI/dependency files; then verify normal API startup and package restores. |
| Reporter verification | Unsupported selections are removed. Execute every remaining supported integration and confirm its own report artifacts; dependency/file differences alone do not prove success. |
| Fresh ZIP verification | Regenerate all 22 baseline projects after the last source changes; install, build, lint where available, and run browser tests. Prioritize interrupted/failed Cypress, Python Selenium, TypeScript Selenium/WebdriverIO, and Java Selenium results, then complete the whole set. |
| BDD and report output | Execute every supported BDD/reporter combination through its intended runner and inspect the actual report artifacts. |
| Dependency and execution quality | Review dependency vulnerabilities and deprecations; verify parallel execution and cleanup after test failures. |
| Docker | Build and run generated Docker projects across the web matrix. |
| CI and cloud | Run generated pipelines on their actual CI services and browser sessions with authorized cloud credentials. Generation and syntax checks alone do not establish runtime success. |
| Repository regression checks | Snapshots and 829 server/shared tests pass; type checking passes. Complete lint and the new GitHub audit workflow on the committed source. |
| Final readiness assessment | Consolidate results for every web pack, document remaining limitations, and assess company usability only after the required checks pass. |

Install logs also report deprecated dependencies, including ESLint 8 and
`jest-playwright-preset`. Dependency maintenance remains part of readiness work;
this audit does not establish that generated dependency graphs are vulnerability-free.

## Local verification blocker

Windows dependency/file-access operations stopped making progress during the
final pass. Examples include an installed OpenAPI schema file blocking API
startup, npm installation timing out after 902 seconds, and stalled NuGet restores.
An exact dependency archive was fetched and checked against the lockfile's SHA-512
integrity value, but the cached file was in use and cache recovery did not complete.

On 20 October 2026, the user reported using Quick Heal antivirus and suggested
that it may be blocking or quarantining CLI commands. This is a **suspected,
unconfirmed cause**: no matching security-history or quarantine evidence has been
checked. Confirmation remains pending; the observed stalls alone do not establish
an antivirus cause. No antivirus settings were changed as part of this update.

On 24 October, Swagger import completed and workspace-local npm caching recovered
installs that failed against missing global cache files. Subsequent Cypress,
BDD npm, lint and extraction operations stalled again. These remain environment
observations, not confirmed antivirus diagnoses.

The user identified GitHub and BrowserStack as available providers. Existing Git
credentials can publish the audit branch. No BrowserStack process/local environment
credentials or GitHub repository secrets were found. BrowserStack live sessions
remain blocked until credentials are configured. Other providers have no supplied
account access. The new GitHub workflow keeps generated ZIPs and reports on its
runner; it does not upload those artifacts.

These stalls are recorded separately from template failures. Audit-owned stalled
jobs and diagnostic servers were stopped where possible. A healthy local runtime
is needed before the remaining checks can establish a final verdict.

## Reproduction and evidence

Helpers are in `scripts/web-audit/`:

```powershell
$env:WEB_AUDIT_RUN = 'tmp/web-audit/new-run'
$env:WEB_AUDIT_BASE_URL = 'https://www.saucedemo.com'
node node_modules/tsx/dist/cli.mjs scripts/web-audit/generate.ts --variants
python scripts/web-audit/inspect_zip.py $env:WEB_AUDIT_RUN
node scripts/web-audit/inspect.mjs $env:WEB_AUDIT_RUN
python scripts/web-audit/options.py $env:WEB_AUDIT_RUN
$env:WEB_AUDIT_CATEGORY = 'baseline'
node scripts/web-audit/verify.mjs build
node scripts/web-audit/verify.mjs test
```

Wait for extraction to finish before verification. The current runtime helper is
Windows-specific and requires the relevant SDKs on PATH; Java 17 can be selected
with `WEB_AUDIT_JAVA_HOME`. `WEB_AUDIT_PACK` filters pack names, and
`WEB_AUDIT_RETRY=true` reruns previously recorded results.

Original ZIPs, extracted projects, logs, and intermediate results are retained
under ignored `tmp/web-audit/`. `followup/` is the latest completed 697-variant
structural matrix; subsequent targeted source fixes are not all reverified.
`final/` contains the interrupted public-app baseline attempt. Earlier local
fixture results are explicitly intermediate and should not replace public-app
or company-application acceptance testing.
