# Twitter/X Thread — MCP Launch

## Tweet 1 (the hook — keep under 280 chars)

QAStarter now speaks MCP.

Your AI can scaffold a production QA automation framework — Page Object Model, reporter, CI workflow, the lot — directly into your workspace.

No browser. No ZIP. No "too many requests" mid-session.

https://qastarter.qatonic.com/mcp

🧵 →

---

## Tweet 2

Paste this into your Claude Desktop / Cursor / Claude Code MCP config:

```json
{
  "mcpServers": {
    "qastarter": {
      "command": "npx",
      "args": ["-y", "@qatonic_innovations/qastarter-cli", "mcp"]
    }
  }
}
```

Then ask: *"Scaffold a Playwright TypeScript project into ./tests/e2e."*

---

## Tweet 3

Six MCP tools:

• `list_combinations` — what's supported
• `validate_combination` — will this combo build?
• `preview_project` — dry-run, no disk I/O
• `generate_project` — write it
• `get_dependencies` — what lands in your package.json
• `get_bom` — pinned versions

Plus 2 read-only resources.

---

## Tweet 4

49 combinations out of the box:

• Web: Selenium, Playwright, Cypress, WebdriverIO, RobotFramework
• API: RestAssured, Requests, Supertest, RestSharp, GraphQL, gRPC, Resty
• Mobile: Appium, Espresso, XCUITest, Flutter
• Desktop: WinAppDriver, PyAutoGUI
• Perf: k6, Gatling, Locust

---

## Tweet 5

Safe by default:

• Relative paths only (refuses absolute unless you opt in)
• Refuses non-empty target dirs unless `force: true`
• Zip-slip + POSIX symlink guards on extraction
• realpath re-check after every write
• Your AI client never sees credentials

---

## Tweet 6

Why this matters:

Human wizards and AI clients pick *different* combos. We can now see which templates the AI keeps reaching for — and prioritise docs + fixes around them.

AI-native dev tools aren't about making it prettier. They're about making it *reachable from the AI's toolchain*.

---

## Tweet 7 (close)

Free. MIT. No login. Anonymous telemetry only.

• 🌐 https://qastarter.qatonic.com/mcp
• 🐙 https://github.com/QATonic/qastarter
• 📦 @qatonic_innovations/qastarter-cli on npm

Ask your AI to scaffold something. Tell us what it picked.

/fin
