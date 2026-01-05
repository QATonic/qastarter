# Changelog

All notable changes to @qatonic/qastarter-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-05

### Added
- Initial public release
- Interactive wizard mode for project generation
- CLI one-liner mode with query parameters
- Support for multiple testing types:
  - Web testing (Selenium, Playwright, Cypress, WebdriverIO)
  - API testing (RestAssured, Requests, Supertest, RestSharp)
  - Mobile testing (Appium, XCUITest, Espresso)
  - Desktop testing (WinAppDriver, PyAutoGUI)
- Support for multiple languages:
  - Java (Maven/Gradle, TestNG/JUnit5)
  - Python (pip, Pytest)
  - TypeScript/JavaScript (npm, Jest/Mocha/Cypress)
  - C# (NuGet, NUnit)
  - Swift (SPM, XCTest)
- CI/CD integration templates (GitHub Actions, Jenkins, GitLab CI, Azure DevOps)
- Reporting tool integration (Allure, Extent Reports, TestNG Reports)
- Utility generators (Logger, Config Reader, Screenshot Utility, Data Provider)
- Page Object Model pattern support
- Sample tests included by default
- Progress indicators with ora spinners
- Cross-platform compatibility (Windows, macOS, Linux)

### Dependencies
- chalk v5.3.0 - Terminal string styling
- commander v12.0.0 - Command-line argument parsing
- inquirer v9.2.12 - Interactive command line prompts
- ora v8.0.1 - Terminal spinners

[Unreleased]: https://github.com/QATonic/QAStarter/compare/cli-v1.0.0...HEAD
[1.0.0]: https://github.com/QATonic/QAStarter/releases/tag/cli-v1.0.0
