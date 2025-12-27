# QAStarter CLI

Command-line tool for generating QA automation project structures.

## Installation

```bash
# Install globally
npm install -g qastarter-cli

# Or use directly with npx
npx qastarter-cli new
```

## Usage

### Interactive Mode

Run without arguments to use the interactive wizard:

```bash
qastarter new
```

### Command Line Flags

Generate a project with specific options:

```bash
qastarter new \
  --name my-selenium-project \
  --type web \
  --framework selenium \
  --language java \
  --pattern page-object-model \
  --cicd github-actions \
  --reporting allure \
  --output ./projects
```

### Available Options

```
Options:
  -n, --name <name>        Project name (default: "my-qa-project")
  -t, --type <type>        Testing type: web, mobile, api, desktop
  -f, --framework <name>   Testing framework: selenium, playwright, cypress, etc.
  -l, --language <lang>    Programming language: java, typescript, python, csharp
  -r, --runner <runner>    Test runner (auto-selected based on language)
  -b, --build <tool>       Build tool (auto-selected based on language)
  -p, --pattern <pattern>  Testing pattern: page-object-model, bdd, fluent
  -c, --cicd <tool>        CI/CD: github-actions, gitlab-ci, azure-devops, etc.
  --reporting <tool>       Reporting: allure, extent-reports, etc.
  -u, --utilities <list>   Utilities (comma-separated)
  --no-samples             Exclude sample tests
  -o, --output <path>      Output directory (default: ".")
  -i, --interactive        Force interactive mode
```

### List Available Options

View all available frameworks, languages, and configurations:

```bash
qastarter list

# Filter by testing type
qastarter list --type web
```

## Examples

### Generate Playwright TypeScript Project

```bash
qastarter new -f playwright -l typescript -p page-object-model
```

### Generate Selenium Java Project with CI/CD

```bash
qastarter new -f selenium -l java -c github-actions --reporting allure
```

### Generate API Testing Project

```bash
qastarter new -t api -f rest-assured -l java
```

## Environment Variables

- `QASTARTER_API_URL`: Override the API URL (default: https://qastarter.replit.app)

## Development

```bash
# Install dependencies
cd cli
npm install

# Build
npm run build

# Run locally
node dist/index.js new
```

## License

MIT
