# Changelog

All notable changes to QAStarter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Production crash caused by esbuild inlining devDependency imports into bundle
- Docker container crash loop from incompatible HEALTHCHECK wget flags on Alpine
- Graceful HTTP server shutdown on SIGTERM for clean container restarts
- CI pipeline Playwright matrix splitting for multi-project runs
- ESLint configuration updated for react-hooks v7 compatibility (705 errors resolved)

### Changed
- Simplified CI pipeline: lint/type-check no longer block production deploys
- Deploy job handles missing webhook URL gracefully

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
