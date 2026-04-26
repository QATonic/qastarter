# LinkedIn Post — MCP Launch

**Headline (hook)**: *Your AI IDE can now scaffold a production QA framework for you.*

---

## Post (1,200 char — under LinkedIn's 3,000 char limit)

If you live inside Claude Desktop, Cursor, Claude Code or Windsurf, and you've ever asked your AI to "scaffold a Playwright TypeScript test project into ./tests/e2e" — you know what happens next. A package.json and one handcrafted sample test. Not a production framework.

We just shipped QAStarter MCP — a Model Context Protocol server that lets any MCP-aware AI client scaffold a *real* test automation framework (Page Object Model, reporter, CI workflow, the lot) directly into your workspace.

Setup is 30 seconds — paste one JSON snippet into your client's MCP config:

{
  "mcpServers": {
    "qastarter": {
      "command": "npx",
      "args": ["-y", "@qatonic_innovations/qastarter-cli", "mcp"]
    }
  }
}

Then ask your AI: "Use qastarter to scaffold a Playwright TypeScript project into ./tests/e2e."

49 supported combinations across Web, API, Mobile, Desktop and Performance. Six MCP tools (list_combinations, validate_combination, preview_project, generate_project, get_dependencies, get_bom). Safe by default — relative paths only, zip-slip + symlink guarded, your AI client never sees secrets.

→ Try it: https://qastarter.qatonic.com/mcp
→ Source: https://github.com/QATonic/qastarter
→ npm: @qatonic_innovations/qastarter-cli

Free, MIT-licensed, no login required.

#TestAutomation #AI #DeveloperTools #Selenium #Playwright #Cypress #MCP

---

## Comment 1 (reply-to-yourself for reach)

> QAStarter also exposes the compatibility matrix as an MCP *resource* (`qastarter://compatibility-matrix`), so the AI can reason about valid combos before it asks to generate anything. If Claude isn't sure whether Cypress + Java is a thing (it isn't), it calls `validate_combination` first.

---

## Image suggestion
Screenshot of Claude Desktop with the MCP config JSON on one side and a `./tests/e2e` file tree that was just scaffolded on the other. Alt: "Claude Desktop calling the QAStarter MCP server to scaffold a Playwright project."
