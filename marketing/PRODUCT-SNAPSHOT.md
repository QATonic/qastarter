# QAStarter — Messaging Source of Truth

> The single reference sheet every blog post, tweet, LinkedIn update, email,
> conference talk, and sales conversation should pull from. If any other
> marketing file disagrees with this doc, this doc wins.
>
> **Last synced with product:** 2026-04-21 (after v1.2.0 + MCP launch + security audit sprint)

---

## The one-liner (40 chars)

**Production-ready QA frameworks, instant.**

## The elevator pitch (280 chars)

> QAStarter generates production-ready test automation projects — Selenium,
> Playwright, Cypress, Appium, REST Assured, k6 and more — in one click.
> Web, CLI, or directly inside Claude Desktop via MCP. 49 proven
> combinations. 10 languages. 100% free, MIT-licensed, no signup.

## The 90-second demo narrative

1. Open qastarter.qatonic.com
2. Pick testing type → framework → language → runner → build tool
3. Click Generate → ZIP downloads with working sample tests, CI config, Dockerfile, README
4. Extract → run one command → first test passes
5. *(or ask Claude: "Scaffold me a Playwright TS project")*

---

## Numbers that are canonical (use these exact figures)

| Metric | Value | Where it came from |
|---|---|---|
| Template combinations | **49** | `server/templates/packs/` count |
| Testing types | **5** | Web, API, Mobile, Desktop, Performance |
| Languages | **10** | Java, Python, JavaScript, TypeScript, C#, Go, Kotlin, Swift, Dart, Ruby |
| Frameworks | **15+** | Selenium, Playwright, Cypress, WebdriverIO, Appium, XCUITest, Espresso, Flutter, REST Assured, RestSharp, Resty, Requests, SuperTest, gRPC, GraphQL, Gatling, k6, Locust, Robot Framework, WinAppDriver, PyAutoGUI |
| Test runners | **10** | JUnit 5, TestNG, NUnit, Jest, Mocha, pytest, XCTest, Testify, Flutter Test, k6 |
| Build tools | **9** | Maven, Gradle, npm, pip, NuGet, Go Modules, SPM, Pub, Cargo-ish |
| MCP tools | **6** | list_combinations, validate_combination, preview_project, generate_project, get_dependencies, get_bom |
| Rate limit (anonymous) | **10 req / 15 min** | Public web + CLI without auth |
| Rate limit (authenticated MCP) | **100 req / 15 min** | 10× boost for `source: mcp-trusted` |
| Security findings fixed | **27** | From the audit sprint (C/H/M/L across web, CLI, MCP) |
| CLI package | `@qatonic_innovations/qastarter-cli` | Current scope — NOT `@qatonic` |
| Current CLI version | **1.2.0** | Update when publishing new |
| License | **MIT** | `LICENSE` at repo root |

⚠️ **Stop using these outdated numbers if you see them anywhere:**
- ❌ "42 templates" → ✅ 49
- ❌ "7 languages" / "8 languages" → ✅ 10
- ❌ `@qatonic/qastarter` → ✅ `@qatonic_innovations/qastarter-cli`
- ❌ "RobotFramework / XCUITest / Flutter are languages" → they are frameworks (languages are Ruby/Dart/Swift respectively… and no, there's no Ruby yet — double-check before listing)

---

## Three surfaces, one engine

Every piece of copy should pick one primary surface and treat the others as "also available":

### 1. Web wizard (the discovery surface)
- URL: https://qastarter.qatonic.com
- Best for: first-time users, visual pickers, managers evaluating the tool
- Hero verb: **"Generate"**
- Highlight: no signup, instant ZIP download, live preview

### 2. CLI (the engineer surface)
- Install: `npm i -g @qatonic_innovations/qastarter-cli`
- One-off: `npx @qatonic_innovations/qastarter-cli new`
- Best for: automation, CI, scripting, repeat users
- Hero verb: **"Scaffold"**
- Highlight: works offline after first run, fits into existing workflows

### 3. MCP server (the AI-native surface)
- Config: `{ "mcpServers": { "qastarter": { "command": "npx", "args": ["-y", "@qatonic_innovations/qastarter-cli", "mcp"] } } }`
- Best for: Claude Desktop, Cursor, Claude Code, Windsurf users
- Hero verb: **"Ask"**
- Highlight: "Tell your AI to scaffold a Playwright TS project into ./tests" and it just happens. 10× rate limit vs. anonymous web.

---

## Differentiation one-liners (pick one per post, don't stack)

| Angle | One-liner |
|---|---|
| Speed | "First test green in 60 seconds, not 60 minutes." |
| Coverage | "49 battle-tested combinations covering Web, API, Mobile, Desktop, and Performance." |
| AI-native | "The only QA scaffolder that speaks MCP — your AI client *is* the generator." |
| Trust | "27 security findings closed in the last audit sprint. Zip-slip guarded, symlink-guarded, relative-path only." |
| Opinion | "Every template ships with Page Object Model, Dockerfile, CI config, and a sample test that actually runs." |
| Openness | "MIT-licensed. No signup. No telemetry you can't turn off. No paywalled 'pro' frameworks." |

---

## Features that are under-marketed (call these out more often)

These are real features users love but the current marketing barely mentions:

1. **Live dependency search** — Maven Central, npm, NuGet, PyPI all searched inline while you configure. No more tab-switching to copy package names.
2. **Shareable URL hydration** — every wizard state is a URL. Paste in Slack, teammate opens → identical config ready to generate.
3. **localStorage persistence** — close the tab, come back tomorrow, your last stack is still there.
4. **OpenAPI → test stubs** — paste a Swagger URL, get generated contract tests.
5. **Cloud device farm presets** — BrowserStack and Sauce Labs configs baked into mobile/web templates.
6. **`qastarter update`** — checks your existing QAStarter-generated project against the latest BOM and offers to bump pinned versions.
7. **`qastarter preview`** — dry-run the file tree before committing to disk. Great for CI pipelines.

---

## What QAStarter is NOT (guardrails for honest marketing)

- ❌ Not a test execution platform (it scaffolds, it doesn't run your tests for you)
- ❌ Not a SaaS (no signup, no cloud account, no "free tier" vs. paid)
- ❌ Not an AI that writes your tests (the MCP server scaffolds the *framework*; the sample tests are templates, not generated from scratch)
- ❌ Not a replacement for Playwright/Selenium/etc. — it's the thing that sets them up for you correctly

---

## Keep this doc green

When you ship:
- A new template pack → bump the "combinations" number here first, then update copy downstream
- A new CLI version → bump the version + note what changed
- A new MCP tool → update the tools count + brief
- A security/perf audit → update the "findings closed" number

5 minutes keeping this doc fresh saves 5 hours of inconsistent copy across channels.
