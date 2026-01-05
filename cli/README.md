# QAStarter CLI

[![npm version](https://badge.fury.io/js/%40qatonic%2Fqastarter-cli.svg)](https://www.npmjs.com/package/@qatonic/qastarter-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

> Command-line tool for generating production-ready QA automation project structures.

Generate complete, well-structured test automation projects in seconds. Supports Selenium, Playwright, Cypress, Appium, and more.

## Installation

### From npm (Recommended)

```bash
npm install -g @qatonic/qastarter-cli
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

## Links

- 🌐 [Web App](https://qastarter.com)
- 📖 [Documentation](https://github.com/QATonic/QAStarter#readme)
- 🐛 [Report Issues](https://github.com/QATonic/QAStarter/issues)

## License

MIT © [QATonic Innovations](https://qatonic.com)

