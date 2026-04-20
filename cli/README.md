# QAStarter CLI

[![npm version](https://badge.fury.io/js/%40qatonic_innovations%2Fqastarter-cli.svg)](https://www.npmjs.com/package/@qatonic_innovations/qastarter-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

> Command-line tool for generating production-ready QA automation project structures.

Generate complete, well-structured test automation projects in seconds. Supports Selenium, Playwright, Cypress, Appium, and more.

## Installation

### From npm (Recommended)

```bash
npm install -g @qatonic_innovations/qastarter-cli
```

### From Source

```bash
git clone https://github.com/QATonic/QAStarter.git
cd QAStarter/cli
npm install
npm run build
npm link
```

## Quick Start

```bash
# Interactive mode - guided project setup
qastarter new --interactive

# One-liner for Web + Playwright + TypeScript
qastarter new -n my-project -t web -f playwright -l typescript

# See all available options
qastarter list
```

## Usage

### Interactive Mode

Generate a project with guided prompts:

```bash
qastarter new --interactive
```

### Command Line Options

```bash
qastarter new [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-n, --name <name>` | Project name | `my-qa-project` |
| `-t, --type <type>` | Testing type: `web`, `mobile`, `api`, `desktop` | `web` |
| `-f, --framework <framework>` | Testing framework | Varies by type |
| `-l, --language <language>` | Programming language | `java` |
| `-r, --runner <runner>` | Test runner | Varies by language |
| `-b, --build <tool>` | Build tool | Varies by language |
| `-p, --pattern <pattern>` | Testing pattern | `page-object-model` |
| `-c, --cicd <tool>` | CI/CD tool | (optional) |
| `--reporting <tool>` | Reporting tool | (optional) |
| `-u, --utilities <list>` | Utilities (comma-separated) | (optional) |
| `--no-samples` | Exclude sample tests | `false` |
| `-o, --output <path>` | Output directory | Current directory |
| `-i, --interactive` | Use interactive mode | `false` |

### Examples

**Web Testing with Playwright + TypeScript:**
```bash
qastarter new -n e2e-tests -t web -f playwright -l typescript -c github-actions --reporting allure
```

**API Testing with RestAssured + Java:**
```bash
qastarter new -n api-tests -t api -f restassured -l java -b maven -r testng
```

**Mobile Testing with Appium + Python:**
```bash
qastarter new -n mobile-tests -t mobile -f appium -l python --no-samples
```

**Desktop Testing with WinAppDriver + C#:**
```bash
qastarter new -n desktop-tests -t desktop -f winappdriver -l csharp
```

### List Available Options

```bash
# List all available frameworks, languages, etc.
qastarter list

# Filter by testing type
qastarter list --type web
qastarter list --type api
```

## Supported Stack

| Testing Type | Frameworks | Languages |
|--------------|------------|-----------|
| Web | Selenium, Playwright, Cypress, WebdriverIO | Java, Python, TypeScript, JavaScript, C# |
| API | RestAssured, Requests, Supertest, RestSharp | Java, Python, TypeScript, JavaScript, C# |
| Mobile | Appium, XCUITest, Espresso | Java, Python, TypeScript, Swift, C# |
| Desktop | WinAppDriver, PyAutoGUI | Java, Python, C# |

## Configuration

Set custom API URL (for local/self-hosted development):

```bash
export QASTARTER_API_URL=http://localhost:5000
```

## MCP server (AI assistants)

QAStarter ships a built-in [Model Context Protocol](https://modelcontextprotocol.io/) server so Claude Desktop, Cursor, Claude Code, Windsurf and other MCP-aware AI clients can scaffold projects directly into your workspace — no browser, no download, no rate limit.

### Quick start

```bash
# Option A — one-off via npx (no global install)
npx @qatonic_innovations/qastarter-cli mcp

# Option B — global install, then run
npm i -g @qatonic_innovations/qastarter-cli
qastarter mcp
```

The server talks JSON-RPC over stdio, so your MCP client invokes it for you — you shouldn't normally run it by hand.

### Claude Desktop / Claude Code config

Add to `claude_desktop_config.json` (macOS/Windows/Linux) or your `mcp` block:

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

Restart the client and ask: *"Use qastarter to scaffold a Playwright TypeScript project with Jest reporter into ./tests/e2e."*

### Exposed tools

| Tool | What it does |
|---|---|
| `list_combinations` | Every supported (type × framework × language × runner × build tool). Call this first. |
| `validate_combination` | Confirm a combo is supported before scaffolding. |
| `get_bom` | Pinned library/tool versions per language. |
| `get_dependencies` | The dep map that would be added to your project. |
| `preview_project` | Dry-run — returns the file tree and sample files without writing to disk. |
| `generate_project` | Writes the full project into `targetDir`. Safe by default: relative paths only, refuses non-empty dirs unless `force: true`. |

### Safety

- `generate_project` rejects absolute `targetDir` paths unless you pass `allowAbsolute: true`.
- It refuses non-empty target directories unless `force: true`.
- ZIP extraction is zip-slip guarded — entries that resolve outside `targetDir` are rejected.
- All file writes happen locally; your AI client never sees any credentials.

### Pointing at a local server

```bash
QASTARTER_API_URL=http://localhost:5000 qastarter mcp
```

Same `QASTARTER_API_URL` override used by the CLI's `new`/`list`/`update` commands.

### Rate limits

Anonymous users (web UI + untagged CLI): **10 project generations per 15 minutes per IP**.

MCP clients that send `X-QAStarter-Client: mcp` are tagged for telemetry; if the server operator sets `QASTARTER_MCP_BYPASS_TOKEN` and you pass a matching `X-QAStarter-Token` (via `QASTARTER_MCP_TOKEN` env), the limit becomes **100 per 15 minutes** — enough headroom for an AI iterating through options.

```bash
QASTARTER_API_URL=https://qa.internal.example.com \
  QASTARTER_MCP_TOKEN=your-shared-secret \
  qastarter mcp
```

### Health checks for operators

- `GET /api/v1/health` — liveness (always 200 while the process is up).
- `GET /api/v1/health/deep` — probes the metadata route (MCP depends on it), counts template packs on disk, and pings the cache. Returns **503** if any probe fails — wire this into uptime monitoring.

## Links

- 🌐 [Web App](https://qastarter.com)
- 📖 [Documentation](https://github.com/QATonic/QAStarter#readme)
- 🐛 [Report Issues](https://github.com/QATonic/QAStarter/issues)

## License

MIT © [QATonic Innovations](https://qatonic.com)

