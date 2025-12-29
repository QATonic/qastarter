# QAStarter CLI

Command-line tool for generating QA automation project structures.

## Installation

```bash
cd cli
npm install
npm run build
```

## Usage

### Interactive Mode

Generate a project interactively:

```bash
npx qastarter new --interactive
```

### Command Line Options

```bash
npx qastarter new [options]
```

**Options:**
- `-n, --name <name>` - Project name (default: `my-qa-project`)
- `-t, --type <type>` - Testing type: `web`, `mobile`, `api`, `desktop`
- `-f, --framework <framework>` - Testing framework: `selenium`, `playwright`, `cypress`, etc.
- `-l, --language <language>` - Programming language: `java`, `typescript`, `python`, `csharp`
- `-r, --runner <runner>` - Test runner: `testng`, `junit5`, `pytest`, `jest`, etc.
- `-b, --build <tool>` - Build tool: `maven`, `gradle`, `npm`, `pip`
- `-p, --pattern <pattern>` - Testing pattern: `page-object-model`, `bdd`, `fluent`
- `-c, --cicd <tool>` - CI/CD tool: `github-actions`, `gitlab-ci`, `jenkins`, etc.
- `--reporting <tool>` - Reporting tool: `allure`, `extent-reports`, etc.
- `-u, --utilities <list>` - Utilities (comma-separated)
- `--no-samples` - Exclude sample tests
- `-o, --output <path>` - Output directory (default: current directory)
- `-i, --interactive` - Use interactive mode

### Examples

**Web + Playwright + TypeScript:**
```bash
npx qastarter new -n my-web-tests -t web -f playwright -l typescript
```

**API + RestAssured + Java:**
```bash
npx qastarter new -n my-api-tests -t api -f restassured -l java -b maven
```

**Mobile + Appium + Python:**
```bash
npx qastarter new -n my-mobile-tests -t mobile -f appium -l python
```

### List Available Options

```bash
npx qastarter list
```

Filter by testing type:
```bash
npx qastarter list --type web
```

## Configuration

Set custom API URL (for local development):

```bash
export QASTARTER_API_URL=http://localhost:5000
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js new --interactive
```
