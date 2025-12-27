# QAStarter

<p align="center">
  <img src="logo-wizard.png" alt="QAStarter Logo" width="120" />
</p>

<p align="center">
  <strong>Generate Production-Ready Test Automation Frameworks in Minutes</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#supported-technologies">Technologies</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## What is QAStarter?

QAStarter is a web-based project generator that enables QA engineers to instantly create production-ready test automation framework boilerplates. Inspired by Spring Initializr, QAStarter eliminates the time-consuming setup process and allows QA professionals to focus on writing tests rather than configuring frameworks.

**Problem:** QA engineers spend 40-60% of their initial project time setting up test automation frameworks, configuring build tools, managing dependencies, and establishing project structure.

**Solution:** QAStarter provides a guided wizard interface that generates customized, production-ready test automation projects with pre-configured structure, boilerplate code, CI/CD pipelines, and documentation.

## Features

- **Multi-Framework Support** - Selenium, Playwright, Cypress, Appium, RestAssured, and more
- **Multi-Language Support** - Java, Python, JavaScript, TypeScript, C#, Swift
- **Testing Patterns** - Page Object Model (POM), BDD with Cucumber, Data-Driven, Fluent patterns
- **CI/CD Integration** - GitHub Actions, Jenkins, GitLab CI, Azure DevOps, CircleCI
- **Reporting Tools** - Allure, ExtentReports, TestNG Reports, Jest HTML, Mochawesome
- **Build Tools** - Maven, Gradle, npm, pip, NuGet
- **Utilities** - Config readers, Screenshot capture, Logging, Data providers
- **Download as ZIP** - Works with any Git provider (GitHub, GitLab, Azure DevOps, Bitbucket)

## Supported Technologies

### Testing Types
| Type | Frameworks |
|------|------------|
| **Web** | Selenium, Playwright, Cypress, WebdriverIO |
| **API** | RestAssured, Python Requests, Supertest, RestSharp |
| **Mobile** | Appium, Espresso, XCUITest |
| **Desktop** | WinAppDriver, PyAutoGUI |

### Languages & Build Tools
| Language | Build Tools | Test Runners |
|----------|-------------|--------------|
| Java | Maven, Gradle | TestNG, JUnit 5 |
| Python | pip | PyTest |
| JavaScript | npm | Jest, Mocha, Cypress |
| TypeScript | npm | Jest, Mocha, Cypress |
| C# | NuGet | NUnit |
| Swift | SPM | XCTest |

### CI/CD Platforms
- GitHub Actions
- Jenkins (Jenkinsfile)
- GitLab CI (.gitlab-ci.yml)
- Azure DevOps (azure-pipelines.yml)
- CircleCI (.circleci/config.yml)

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/qastarter.git
cd qastarter

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
qastarter/
├── client/                   # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/       # UI components (Wizard, ProjectPreview, etc.)
│   │   ├── pages/            # Page components (Home, ApiDocs)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   └── styles/           # Global styles
├── server/                   # Express backend
│   ├── templates/            # Project template packs
│   │   └── packs/            # 34 framework templates
│   ├── routes.ts             # API routes
│   └── storage.ts            # Analytics storage
├── shared/                   # Shared types and validation
│   ├── schema.ts             # Zod schemas
│   └── validationMatrix.ts   # Framework compatibility rules
└── package.json
```

## API

### Generate Project (POST)

```bash
curl -X POST http://localhost:5000/api/generate-project \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-qa-project",
    "testingType": "web",
    "framework": "playwright",
    "language": "java",
    "testRunner": "testng",
    "buildTool": "maven",
    "testingPattern": "page-object-model",
    "cicdTool": "github-actions",
    "reportingTool": "allure"
  }' \
  --output my-qa-project.zip
```

### Get Metadata (GET)

```bash
curl http://localhost:5000/api/v1/metadata
```

### Generate via Query Parameters (GET)

```bash
curl "http://localhost:5000/api/v1/generate?projectName=my-project&testingType=web&framework=selenium&language=java" \
  --output my-project.zip
```

## Configuration Options

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `projectName` | Yes | Project folder name | `my-qa-project` |
| `testingType` | Yes | Type of testing | `web`, `api`, `mobile`, `desktop` |
| `framework` | Yes | Testing framework | `selenium`, `playwright`, `cypress` |
| `language` | Yes | Programming language | `java`, `python`, `typescript` |
| `testRunner` | Yes | Test runner | `testng`, `junit5`, `pytest`, `jest` |
| `buildTool` | Yes | Build tool | `maven`, `gradle`, `npm`, `pip` |
| `testingPattern` | Yes | Design pattern | `page-object-model`, `bdd`, `data-driven` |
| `cicdTool` | No | CI/CD platform | `github-actions`, `jenkins`, `gitlab-ci` |
| `reportingTool` | No | Reporting tool | `allure`, `extent-reports`, `pytest-html` |
| `groupId` | Java only | Maven group ID | `com.company.qa` |
| `artifactId` | Java only | Maven artifact ID | `qa-automation` |

## Generated Project Structure

Example for Java + Playwright + TestNG + Maven:

```
my-qa-project/
├── pom.xml                           # Maven configuration
├── README.md                         # Setup instructions
├── .gitignore                        # Git ignore rules
├── .github/workflows/tests.yml       # GitHub Actions CI/CD
├── src/
│   ├── main/java/com/company/qa/
│   │   ├── config/                   # Configuration management
│   │   ├── core/                     # Base classes (DriverManager, BaseTest)
│   │   ├── pages/                    # Page Object classes
│   │   ├── utils/                    # Utilities (Wait, Screenshot, Log)
│   │   └── listeners/                # TestNG listeners
│   └── test/java/com/company/qa/
│       └── tests/                    # Test classes
├── src/main/resources/
│   ├── config/                       # Environment configs (dev, qa, prod)
│   └── log4j2.xml                    # Logging configuration
└── src/test/resources/
    ├── testng.xml                    # TestNG suite configuration
    └── testdata/                     # Test data files
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- TanStack Query (data fetching)
- Wouter (routing)

**Backend:**
- Node.js + Express
- TypeScript
- Handlebars (templating)
- Archiver (ZIP generation)
- Zod (validation)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Templates

Templates are located in `server/templates/packs/`. Each template pack contains:
- `manifest.json` - Template metadata and file definitions
- `files/` - Handlebars template files (.hbs)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Issues:** [GitHub Issues](https://github.com/your-org/qastarter/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/qastarter/discussions)

---

<p align="center">
  Made with ❤️ for the QA Community
</p>
