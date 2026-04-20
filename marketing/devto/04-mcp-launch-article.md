---
title: "QAStarter now speaks MCP — let your AI scaffold test automation projects"
published: true
description: "Claude Desktop, Cursor, Claude Code and any other MCP-aware AI client can now scaffold production-ready QA test frameworks directly into your workspace — no browser, no download, no rate limit."
tags: ai, mcp, testing, devtools
cover_image:
canonical_url: https://qastarter.qatonic.com/mcp
series: QAStarter
---

If you live inside an AI IDE — Claude Desktop, Cursor, Claude Code, Windsurf — and you've ever asked your assistant to *"scaffold a Playwright + TypeScript test project into `./tests/e2e`"*, you know what happens next. Something like:

> *"Sure! Here's a `package.json` and a sample test…"*

What you actually want is a production-ready framework: the right `tsconfig`, the right `playwright.config.ts`, a base page object, a reporter, a CI workflow. Not a single handcrafted file.

QAStarter has been that production-ready scaffold for humans since day one — 49 combinations across Web, API, Mobile, Desktop and Performance. Today we shipped the same engine to your AI. **`qastarter mcp`** is an in-process Model Context Protocol server that lets any MCP-aware client scaffold a full test framework directly into your workspace.

## Hook it up in 30 seconds

Add this to your `claude_desktop_config.json` (or equivalent for Cursor / Claude Code / Windsurf):

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

Restart the client. Then ask:

> *"Use qastarter to scaffold a Playwright TypeScript project with Jest into `./tests/e2e`."*

The assistant calls `list_combinations` to see what's supported, confirms the combo with `validate_combination`, optionally calls `preview_project` to show you the file tree, and then `generate_project` writes the files straight into your workspace.

No browser. No ZIP. No unzip-and-copy. No "too many requests" rate limit halfway through an experiment.

## What's exposed

Six tools, each with a rich schema so the AI picks the right one without guessing:

| Tool | What it does |
|---|---|
| `list_combinations` | Enumerate every supported (type × framework × language × runner × build tool). The AI calls this first. |
| `validate_combination` | Confirm a combo is supported before scaffolding — avoids a 400 from the API. |
| `get_bom` | Pinned library / tool versions per language. Useful for "is my project up to date?" queries. |
| `get_dependencies` | The exact dep map that would be added to your `pom.xml` / `package.json` / `requirements.txt`. |
| `preview_project` | Dry-run — returns the file tree and sample files without writing to disk. |
| `generate_project` | Writes the full project into `targetDir`. |

Plus two read-only resources:
- `qastarter://compatibility-matrix` — everything the AI needs to pick a combo.
- `qastarter://bom` — version pins.

## Safe by default

`generate_project` isn't a free-for-all file writer. It:

- Rejects absolute target paths unless you pass `allowAbsolute: true`.
- Rejects non-empty target directories unless you pass `force: true`.
- Zip-slip guards the extraction — entries resolving outside the target dir are rejected.
- Runs entirely locally; your AI client never sees credentials or secrets.

## Why MCP matters for QA

QA engineers are among the heaviest users of AI IDEs right now. *"Write a test for this"* is one of the top prompts in every survey of AI coding usage. But most scaffolding tools — `create-react-app`, Vite templates, Yeoman — don't speak MCP. They expect a human to fill out a wizard.

With MCP, QAStarter becomes something the AI already knows how to use — just like it knows how to call `read_file` or `grep`. *"Scaffold a REST Assured framework against this OpenAPI spec"* becomes a tool call, not a shell script.

## Under the hood — 412 lines

The MCP server is a thin wrapper in the existing `@qatonic_innovations/qastarter-cli` package. It:

1. Reuses the REST API (`POST /v1/generate`, `GET /v1/metadata`, `POST /v1/project-preview`) so the scaffold engine stays canonical.
2. Runs over **stdio** — the standard MCP transport that every AI client already supports.
3. Sends `X-QAStarter-Client: mcp` on every request so the backend can apply the relaxed rate limit (100 generations per 15 minutes vs the anonymous 10) and split AI combo picks from human picks in telemetry.

Point it at a self-hosted QAStarter with `QASTARTER_API_URL=https://your-server.example.com`.

## Why we did telemetry split

Anonymous, aggregate, no PII — same as always. But now we can see *which combos AIs pick*. AI choices differ from human ones: assistants gravitate toward whatever has the richest docs in their training data, which tells us exactly which templates to invest in next. If Claude keeps picking `web-python-playwright-pytest-pip` while humans pick `web-java-selenium-testng-maven`, we know to invest accordingly. *That signal is gold.*

## Try it

```bash
# In your IDE config (one-off, no global install):
npx -y @qatonic_innovations/qastarter-cli mcp

# Or install globally:
npm i -g @qatonic_innovations/qastarter-cli
qastarter mcp
```

Source: [github.com/QATonic/qastarter](https://github.com/QATonic/qastarter) · CLI: [@qatonic_innovations/qastarter-cli](https://www.npmjs.com/package/@qatonic_innovations/qastarter-cli) · Web: [qastarter.qatonic.com](https://qastarter.qatonic.com)

*Ask your AI: "Scaffold a Playwright TypeScript project in ./tests/e2e."* and tell us what it picked.
