# Telegram Launch Messages

> **Telegram > WhatsApp for tech content.** It supports Markdown, longer
> messages, link previews that don't collapse, and pinned polls.
>
> **Where to post (priority):**
> 1. **SDET Unicorns / Test Automation channels** — the QA-specific
>    Telegram groups active in CIS + Eastern Europe + India are the
>    single best distribution channel outside Reddit.
> 2. **Playwright / Cypress / Selenium / Appium community channels** —
>    framework-specific. Lead with the framework angle.
> 3. **MCP / Claude developer channels** — for the AI-native angle.
> 4. **Your language/region channel** (Russian-speaking QA, Hindi QA,
>    Portuguese QA, Spanish-speaking SDET) — localize the first line.

---

## Variant A — Full launch post (channels / one-way broadcast)

Supports Telegram Markdown. Use `*bold*` and backticks for `inline code`.
Keep it under 1000 chars for the preview-rendered form.

```
*QAStarter — production-ready QA automation frameworks, instant.*

Open-source tool for QA engineers: pick your stack in the wizard, get a ZIP with POM, CI config, Dockerfile, sample tests that actually run. First test green in 60 seconds.

🔧 *49 combinations* covering Selenium, Playwright, Cypress, WebdriverIO, Appium, Espresso, XCUITest, REST Assured, k6, Gatling, Locust, Robot Framework.

🌐 *10 languages*: Java, Python, JS/TS, C#, Go, Kotlin, Swift, Dart.

🤖 *Speaks MCP* — works inside Claude Desktop, Cursor, Claude Code. Just ask your AI:
"scaffold a Playwright TypeScript project into ./tests/e2e"

MIT licensed. No signup. No telemetry you can't turn off.

🔗 https://qastarter.qatonic.com
⭐️ https://github.com/QATonic/qastarter

Feedback + issue reports very welcome 🙏
```

---

## Variant B — Short (active chat groups, not channels)

For groups where people are actively chatting. Long posts scroll past fast.

```
Shipped a free thing — QAStarter.

Pick a QA stack (Selenium / Playwright / Cypress / Appium / k6 / Gatling / 44 more), hit Generate, get a full project with POM + CI + Docker. MIT + no signup.

Bonus: it's an MCP server too — "scaffold me a Playwright TS project" in Claude Desktop or Cursor, it just writes the files.

https://qastarter.qatonic.com

Would genuinely love feedback on stacks I missed.
```

---

## Variant C — Framework-specific (for Playwright / Cypress / Selenium channels)

Replace the bracketed placeholders:

```
New for the [Playwright] community:

QAStarter scaffolds production-ready [Playwright] projects — pick [TypeScript + Jest + POM + Allure + GitHub Actions] and you get the full project in one ZIP. Also supports [JavaScript, Python, Java, C#, Go] as [Playwright] languages.

Open source, MIT, free. Works as a CLI (`npx @qatonic_innovations/qastarter-cli new`) and as an MCP server for Claude Desktop / Cursor.

🔗 https://qastarter.qatonic.com

If [Playwright]'s your thing — curious which combos we got right/wrong. Issues + PRs welcome: https://github.com/QATonic/qastarter
```

---

## Variant D — MCP / Claude channel angle

For AI-dev channels, lead with the MCP story:

```
*Building an MCP server for QA test automation — released v1.2.0 today.*

QAStarter exposes 6 MCP tools:
  • `list_combinations` — every supported stack
  • `validate_combination` — check before scaffolding
  • `preview_project` — dry-run file tree
  • `generate_project` — write to disk (zip-slip + symlink guarded)
  • `get_dependencies` — what lands in package.json / pom.xml
  • `get_bom` — pinned library versions

Add to your Claude Desktop / Cursor / Windsurf config:
`
{
  "mcpServers": {
    "qastarter": {
      "command": "npx",
      "args": ["-y", "@qatonic_innovations/qastarter-cli", "mcp"]
    }
  }
}
`

Then ask your AI: "scaffold a Playwright TS project with Jest + Allure into ./tests/e2e". Files appear.

Website: https://qastarter.qatonic.com/mcp
Repo: https://github.com/QATonic/qastarter
npm: https://www.npmjs.com/package/@qatonic_innovations/qastarter-cli

Feedback on the tool schemas welcome — this is v1, I expect to learn a lot from real usage.
```

---

## Variant E — Poll follow-up (24h after launch post)

Telegram's native poll is under-used. Pin it below the launch post.

```
Which test stack do you spend the most time setting up from scratch?

(multiple choice)

🔘 Selenium + Java + TestNG
🔘 Playwright + TypeScript + Jest
🔘 Cypress + TypeScript
🔘 REST Assured / Java
🔘 pytest + Requests (Python)
🔘 Appium (mobile)
🔘 k6 / Gatling (performance)
🔘 Something else (reply!)
```

Use the reply to validate whether QAStarter covers it. If 20 people say
"Cypress + C#" — that's a real signal for a new template pack.

---

## Timing / cadence

- **Launch day** — Variant A in 2-3 channels (don't spam — pick carefully)
- **Day 2** — Variant C in the framework-specific channel that had the
  most engagement
- **Day 5** — Variant D in MCP / Claude channels, link the dev.to post
- **Day 10** — Variant E as a poll in the largest-engagement channel
- **Don't repost** the same variant to the same channel

## What NOT to do on Telegram

- ❌ Don't @everyone or @admin — instant ban in most channels
- ❌ Don't add your launch-post bot to random channels
- ❌ Don't send via DM to members you don't know (most channels' top rule)
- ❌ Don't use link-shorteners — Telegram's link preview hides them
- ❌ Don't edit a posted message 5 times — the "edited" tag looks amateur

---

## A note on channel admin requests

If you'd like a channel to pin your post, message the admin 1-on-1 with:
1. Link to your original post (already in the channel, don't re-post)
2. One sentence on why their members would benefit
3. Offer something back (co-author a post, AMA, promo their meetup)

Never: "please pin my post 🙏🙏🙏" — that's what everyone sends.
