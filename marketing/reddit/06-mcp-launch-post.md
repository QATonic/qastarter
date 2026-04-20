# Reddit — QAStarter MCP launch

## Target subreddits (post order)

1. **r/QualityAssurance** — primary QA audience
2. **r/softwaretesting** — secondary QA audience
3. **r/ClaudeAI** — Claude-specific, high engagement
4. **r/cursor** — IDE-specific
5. **r/programming** — only if the first few perform well (strict self-promo rules)

Post to one subreddit per day; don't crosspost on day 1.

---

## Post — r/QualityAssurance

**Title**: *Your AI can now scaffold a production QA framework directly into your workspace — QAStarter MCP launch*

**Body**:

Hi all — we just shipped QAStarter MCP, a Model Context Protocol server that lets Claude Desktop, Cursor, Claude Code, Windsurf etc. scaffold a production QA automation framework (POM, reporter, CI workflow, the lot) directly into your workspace.

TL;DR — drop this into your AI IDE's MCP config:

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

…restart the client, then ask:

> "Use qastarter to scaffold a Playwright TypeScript project with Jest into ./tests/e2e."

The AI calls `list_combinations` to see what's supported, confirms with `validate_combination`, optionally previews with `preview_project`, and writes the files via `generate_project`.

**49 combinations out of the box** — Selenium, Playwright, Cypress, WebdriverIO, Appium, REST Assured, k6, Gatling, etc. in Java / Python / TypeScript / JavaScript / C# / Go / Swift / Kotlin / Dart.

Free, MIT licensed, no login. Web app is at https://qastarter.qatonic.com and the MCP docs are at https://qastarter.qatonic.com/mcp.

Tech notes if you're curious:
- MCP server is a thin stdio wrapper over the existing REST API — 412 lines of TS.
- Tools have rich JSON-Schema descriptions so the AI picks the right one without brute-force trial-and-error.
- Rate limit is higher for authenticated MCP clients (100/15min vs 10/15min anon) so iterating through options during a session doesn't hit the wall.
- Zip extraction is zip-slip + POSIX-symlink guarded, target dir is confined to cwd by default.

Keen to hear which combos your AI keeps asking for — we're using the telemetry split (anon, no PII) to decide which templates to invest in next. If Claude keeps picking something humans don't, that's the signal.

**Sources**
- npm: `@qatonic_innovations/qastarter-cli`
- GitHub: https://github.com/QATonic/qastarter
- MCP landing: https://qastarter.qatonic.com/mcp

---

## Post — r/ClaudeAI (different angle)

**Title**: *I built an MCP server so Claude can scaffold production QA automation frameworks*

**Body**:

One thing I kept hitting in Claude Desktop: ask it to "write tests for this", get a single handcrafted file. Not a real framework — no POM, no reporter, no CI.

So I shipped an MCP server for QAStarter, which already has 49 production-ready QA scaffolds. Now Claude can invoke:
- `list_combinations` — discover what's supported
- `validate_combination` — confirm before scaffolding
- `preview_project` — dry-run file tree
- `generate_project` — write files into a target dir
- `get_dependencies` — see what lands in pom.xml / package.json
- `get_bom` — pinned library versions

Plus two resources (`qastarter://compatibility-matrix`, `qastarter://bom`) for ambient context.

Config is a one-liner in `claude_desktop_config.json`:

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

Totally free, works with any MCP-aware client (Cursor, Claude Code, Windsurf too).

Interesting discovery from the telemetry split: Claude picks `web-python-playwright-pytest-pip` more than any human does. Human wizard users skew heavily toward `web-java-selenium-testng-maven`. That's a nudge about which docs we need to invest in.

- https://qastarter.qatonic.com/mcp
- https://github.com/QATonic/qastarter

Feedback welcome — especially on the tool descriptions. I spent as much time on those as on the code; descriptions are what the AI uses to pick.

---

## Guidelines
- Do NOT crosspost word-for-word. Each subreddit gets its own angle.
- Engage with the top 3 comments on each post within the first hour.
- If the post gets downvoted fast on /r/programming, pull it — that sub hates self-promo.
