# Changelog

All notable changes to @qatonic_innovations/qastarter-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-20

### Added
- `redactSecrets()` helper — every thrown error now scrubs
  `QASTARTER_MCP_TOKEN`, Authorization / Bearer / `sk_` / `ghp_` / `npm_`
  shapes before the text is handed to the MCP client (which may echo it to
  the user). Closes a token-leak path flagged by the security audit.
- `rateLimitSuffix()` — 429 responses now surface
  `(limit: N; remaining: 0; retry in Xs)` in the error message so AI
  clients and humans know when to retry.
- `safeBuildFilePath()` in `qastarter update` — refuses to edit symlinked
  `pom.xml` / `build.gradle` / `package.json` / `requirements.txt` /
  `*.csproj` / `go.mod`, and any file whose realpath escapes the project
  directory.
- MCP `generate_project` schema now uses `enum` for `framework`,
  `testRunner`, and `buildTool`. AIs pick valid combos first time instead
  of free-text-guessing.
- `extractZipSafely` hardened further:
  - Refuses ZIP entries whose external-attr bits indicate a POSIX symlink
    (`S_IFLNK`) — AdmZip would otherwise materialise them as regular
    files containing the target path.
  - After each write, `fs.realpathSync` re-checks that the path is still
    inside the resolved `targetDir` (catches parent-dir symlinks).
- MAX_ZIP_BYTES safety cap in `generateProjectBuffer` (default 50 MB,
  override via `QASTARTER_MAX_ZIP_BYTES`) — both pre- and post-download.
- `AbortSignal.timeout` on every REST call (10–15 s depending on endpoint).

### Changed
- `resolveTargetDir` hardened: rejects UNC (`\\server\share\…`) and
  drive-rooted (`C:\…`) paths unless `allowAbsolute: true`; strict
  `startsWith(cwd + path.sep)` containment check; refuses cwd itself
  as a target.
- Published tarball drops TypeScript declaration files — `.d.ts` /
  `.d.ts.map` excluded via `.npmignore` and `declaration:false` in
  `tsconfig.json`. 13 files → 8 files in the tarball.

### Fixed
- Timing-attack hygiene: MCP bypass token is no longer in the CLI by
  default — this is a server-side fix, but the CLI paired with it here
  because CLI users set `QASTARTER_MCP_TOKEN` to match.
- pom.xml dependency parser no longer uses one large backtracking regex;
  splits on `</dependency>` first so malformed input can't hang the CLI.

## [1.1.0] - 2026-04-20

### Added
- `qastarter mcp` — Model Context Protocol (MCP) server over stdio so
  Claude Desktop / Cursor / Claude Code / Windsurf can scaffold QAStarter
  projects directly. Six tools: `list_combinations`, `validate_combination`,
  `get_bom`, `get_dependencies`, `preview_project`, `generate_project`.
  Safe-by-default file writes — relative paths only, refuses non-empty
  targetDir unless `force: true`, zip-slip guarded.
- All REST calls now send `X-QAStarter-Client` (and optional
  `X-QAStarter-Token`) headers. The `mcp` entry point sets
  `QASTARTER_CLIENT=mcp` automatically so the backend can grant a relaxed
  rate limit and tag telemetry with the AI source.
- Programmatic API helpers in `lib/api.ts`: `generateProjectBuffer`,
  `previewProject`, `getProjectDependencies`, `validateConfig`,
  `clientHeaders`.

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
