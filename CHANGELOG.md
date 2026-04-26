# Changelog

All notable changes to QAStarter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **BrowserStack cloud integration** across all 28 BrowserStack-compatible
  template packs:
  - Phase 1: Java Playwright (×4) + WebdriverIO JS/TS — `browserstack-java-sdk` +
    `@wdio/browserstack-service`. Live-verified on cloud.
  - Phase 2: Python (×3) + JS/TS Jest (×4) + C# (×2) + Cypress (×2) — native SDKs
    per language family. JS Selenium-Jest + JS Cypress live-verified.
  - Phase 3a: Appium mobile (×6) — Java×2, Python, JS, TS, C#. Java gradle
    routing live-verified end-to-end (Appium → BS App Automate cloud).
  - Phase 3b: Go Playwright — in-code CDP connect to
    `wss://cdp.browserstack.com/playwright`. **2/2 tests PASSED** on BS cloud.
  - Phase 3c: Native mobile (×4) — Espresso × 2, XCUITest, Flutter — wired with
    self-contained `scripts/run-on-browserstack.sh` driving the BS App Automate
    REST API (build artifact upload → trigger → poll).
- Cloud Device Farm picker in the wizard now lists all four providers; Sauce
  Labs and TestMu AI (formerly LambdaTest) carry an amber "Coming Soon" pill
  and are disabled until their wiring lands.
- Header + Footer "Support" link routing to GitHub Issues, plus `SUPPORT.md`
  documenting where to ask questions, file bugs, and request features.
- `.editorconfig`, `.gitattributes`, and `.nvmrc` to lock cross-platform
  formatting + Node version (especially relevant now that we ship binary
  `gradle-wrapper.jar` files).
- `.github/dependabot.yml` for weekly auto-PRs on direct npm dependencies and
  GitHub Actions, grouped by ecosystem (UI, build tooling, test tooling, types).

### Fixed
- **Engine: binary file corruption.** Template loader read every file as UTF-8
  even for `isTemplate:false` entries — `gradle-wrapper.jar` ballooned from
  43 KB to 73 KB with U+FFFD replacement chars and corrupted zip headers.
  `templatePackEngine.loadTemplateFile` now returns a `Buffer` for known-binary
  extensions (`.jar`, `.apk`, `.png`, `.pdf`, keystores, fonts, etc.); downstream
  archiver / GitHub-push / preview paths handle string + Buffer both.
- **9 Gradle packs** missing or 0-byte `gradle-wrapper.jar`. Real 43 KB
  Gradle 8.5 wrapper jar shipped + manifest entries added. Bundled `gradlew` /
  `gradlew.bat` were also stale (109 / 236 lines, with a git-bash arg-duplication
  bug); replaced with the fresh 249-line Gradle 8.5 wrapper script across all
  nine Gradle packs.
- **CapabilitiesManager** in `mobile-java-appium-testng-{gradle,maven}`: optional
  property lookups (`udid`, `app`, `appPackage`, `appActivity`, `bundleId`,
  `platformVersion`) used the single-arg `ConfigurationReader.getProperty(key)`
  overload that throws on missing keys — every test crashed before the Appium
  driver was constructed. Switched to 2-arg form with `""` default; null/empty
  guards now behave as the original author intended.
- **testng.xml** in both Java Appium packs referenced a non-existent
  `SmokeSuite` class — TestNG collection failed. Removed the dangling reference.
- **Duplicate `import {{javaPackage}}.utils.Log;`** in three Java TestNG
  LoginTests templates (`web-java-{selenium-testng-gradle,playwright-testng-
  gradle,playwright-testng-maven}`).
- **`web-javascript-webdriverio-mocha-npm`** had hardcoded SauceDemo
  credentials inline in `test/specs/login.spec.js` — users couldn't switch
  accounts without editing the spec, breaking the "edit only locators + config"
  promise. Mirrored the TypeScript pack: added `test/data/users.js` exporting
  `validUser` + `invalidUser`, the spec now imports them, and the docstring
  tells users where to edit. Dropped the parallel `config/environments.js` —
  it shipped but was never imported (`wdio.conf.js` already handles env
  switching via `process.env.BASE_URL`).
- **C# BrowserStack adapter**: bumped `BrowserStack.TestAdapter` from 0.5.0
  (which crashed with `IndexOutOfRangeException` on a missing `.addins` file)
  to 0.28.1 across all 3 C# packs (Selenium + Playwright + Appium).
- **Cypress browser config**: `"Windows"` → `"Windows 10"` (BrowserStack
  Cypress requires the OS version, not just the family).
- **JS Selenium-Jest** `driverFactory.js` had `const logger = require('./logger')`
  while `logger.js` exports `{ log }`; corrected to `const { log: logger } =
  require('./logger')`.
- Production crash caused by esbuild inlining devDependency imports into bundle.
- Docker container crash loop from incompatible HEALTHCHECK wget flags on Alpine.
- Graceful HTTP server shutdown on SIGTERM for clean container restarts.
- CI pipeline Playwright matrix splitting for multi-project runs.
- ESLint configuration updated for react-hooks v7 compatibility (705 errors resolved).

### Security
- **npm audit: 18 vulnerabilities → 4** (0 high, 0 critical, 0 low; 4 moderate,
  all dev-only build chain). Direct upgrades: `drizzle-orm` → 0.45.2+ (SQL
  injection in identifier escaping), `uuid` → ^14, `postcss` → 8.5.10+
  (XSS via unescaped `</style>`). Transitive overrides: `serialize-javascript`
  ^7.0.5 (RCE in `RegExp.flags`), `fast-xml-parser` ^5.7.0, `@tootallnate/once`
  ^3.0.1, `uuid` ^14 (gaxios chain). Full audit + triage in commit
  history; remaining 4 moderates require breaking-change upgrades to
  `vite-plugin-pwa` / `drizzle-kit` and were left for a separate PR.
- **SSRF hardening** in `openApiService.isUrlSafe()`: blocks alternate IPv4
  numeric forms (decimal `2130706433`, hex `0x7f000001`, octal `0177.0.0.1`,
  3-part `127.1`) that would otherwise bypass `startsWith('127.')` checks
  and resolve to loopback / private ranges at fetch time. New
  `toDottedQuadIPv4()` helper coerces any pure-numeric host to dotted-quad
  before the existing private-range check runs.

### Changed
- Simplified CI pipeline: lint/type-check no longer block production deploys.
- Deploy job handles missing webhook URL gracefully.
- Cloud Device Farm yml moved from `config/browserstack.yml` to project root
  `browserstack.yml` across every BS-wired pack — the BrowserStack SDKs
  (Java, Node, Python, .NET) hard-code the project-root path and silently
  no-op if it's elsewhere.

### Audited
- **End-to-end audit of all 49 template packs.** Static render check (49/49
  HTTP 200, zero unrendered Handlebars), four parallel deep-code-review
  agents covering web-Java×8 / web-JS-TS×8 / web-Python-Go-C#×6 / non-web×27,
  and local toolchain build verification (Python pip + pytest collect, dotnet
  build, Maven test-compile, Gradle wrapper bootstrap, Go build, Cypress tsc).
  Two real defects (above) and two false-positives (Go locators work because
  SauceDemo carries both `id` and `data-test`; modern Cypress bundles its own
  types, no `@types/cypress` package needed).

## [1.0.0] - 2026-01-05

### Added
- Initial public release of QAStarter web application
- **46 production-ready template packs** covering:
  - Web testing (Selenium, Playwright, Cypress, WebdriverIO)
  - API testing (RestAssured, Requests, Supertest, RestSharp, Axios)
  - Mobile testing (Appium, Espresso, XCUITest, Flutter)
  - Desktop testing (WinAppDriver, PyAutoGUI)
- **6 language support**: Java, Python, TypeScript/JavaScript, C#, Swift, Go
- **Express Generator** for rapid project configuration
- **Multi-step wizard** with real-time project preview
- Interactive dependency search with version selection
- CI/CD integration templates (GitHub Actions, Jenkins, GitLab CI, Azure DevOps)
- Reporting tool integration (Allure, Extent Reports, TestNG Reports)
- Page Object Model pattern support across all packs
- Utility generators (Logger, Config Reader, Screenshot, Data Provider)
- Dark/light theme toggle
- Project download as ZIP with full directory structure
- RESTful API with OpenAPI/Swagger documentation
- Rate limiting and security headers (Helmet, CORS)
- PostgreSQL persistence with file-based fallback
- Redis caching support
- Docker multi-stage build for production deployment
- Comprehensive E2E test suite (Playwright, multi-browser)
- CLI tool (`@qatonic_innovations/qastarter-cli`) for terminal-based generation
- Template pack validation and parity checking system
- Analytics dashboard for tracking generation trends
