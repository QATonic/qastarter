---
title: "I Built QAStarter — Generate 49+ Test Automation Frameworks in Seconds"
published: true
tags: testing, automation, webdev, opensource
cover_image: [ADD_COVER_IMAGE_URL]
series: "QAStarter"
---

## The Problem

Every QA engineer knows this pain:

```
Day 1: New project. Need a test framework.
Day 2: Still configuring Maven/Gradle/npm...
Day 3: Still setting up base classes, config, logging...
Day 4: Finally writing my first actual test.
```

I've done this 30+ times. Selenium + Java + Maven. Then Playwright + TypeScript. Then REST Assured for APIs. Then Appium for mobile. Every single time — same boilerplate, different flavor.

## The Solution

I built **QAStarter** — a web app that generates production-ready test automation projects.

Pick your stack. Download a ZIP. Run `mvn test` / `npm test` / `pytest`. Done.

### What You Get

Every generated project includes:

- **Proper architecture** — Page Object Model, base classes, utilities
- **Config management** — multi-environment (dev/qa/prod) with property files
- **CI/CD pipeline** — Jenkins, GitHub Actions, GitLab CI, Azure DevOps, or CircleCI
- **Reporting** — Allure or ExtentReports, pre-configured
- **Docker** — Dockerfile + docker-compose for headless execution
- **Cloud testing** — BrowserStack / Sauce Labs YAML configs
- **Test data** — Faker/DataFaker/Bogus for realistic data generation
- **Logging** — Log4j (Java), Winston (JS), Python logging
- **Sample tests** — working examples that demonstrate the patterns

## Supported Stacks

### Web Testing
| Framework | Languages | Build Tools |
|-----------|-----------|-------------|
| Selenium | Java, Python, TypeScript, JavaScript, C#, Go | Maven, Gradle, npm, pip, NuGet, Go mod |
| Playwright | Java, Python, TypeScript, JavaScript, C#, Go | Maven, Gradle, npm, pip, NuGet, Go mod |
| Cypress | TypeScript, JavaScript | npm |
| WebdriverIO | TypeScript, JavaScript | npm |

### API Testing
| Framework | Languages |
|-----------|-----------|
| REST Assured | Java (Maven, Gradle) |
| Supertest | TypeScript, JavaScript (npm) |
| Requests | Python (pip) |
| RestSharp | C# (NuGet) |
| Resty | Go (Go mod) |

### Mobile Testing
| Framework | Languages |
|-----------|-----------|
| Appium | Java, Python, TypeScript, C# |
| Espresso | Java, Kotlin |

### Desktop Testing
| Framework | Languages |
|-----------|-----------|
| WinAppDriver | Java, Python, C# |
| PyAutoGUI | Python |

### Performance Testing
| Framework | Languages |
|-----------|-----------|
| k6 | JavaScript |
| Gatling | Java |
| Locust | Python |

**49+ combinations total.**

## How It Works

### 1. Choose Your Stack

The wizard walks you through:
- Testing type (Web, API, Mobile, Desktop, Performance)
- Framework (Selenium, Playwright, etc.)
- Language & build tool
- Test runner, CI/CD tool, reporting tool
- Optional: BrowserStack/Sauce Labs, Faker, Docker, BDD (Cucumber)

### 2. Generate & Download

Click generate — get a ZIP file with your complete project.

### 3. Unzip and Run

```bash
# Java + Maven
mvn clean test

# TypeScript + npm
npm install && npm test

# Python + Pytest
pip install -r requirements.txt && pytest

# C# + .NET
dotnet test

# Go
go test ./tests/...
```

That's it. Your first test runs in under a minute.

## OpenAPI-Driven Test Generation

For API testing — paste your Swagger/OpenAPI spec URL and QAStarter auto-generates test stubs for every endpoint.

I tested it with the Petstore API (`https://petstore3.swagger.io/api/v3/openapi.json`) — it generated 19 endpoint tests covering GET, POST, PUT, DELETE across `/pet`, `/store`, and `/user` resources.

```typescript
describe('OpenAPI Endpoints', () => {
  test('GET /pet/findByStatus - Finds Pets by status', async () => {
    const res = await request(BASE_URL)
      .get('/pet/findByStatus');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);
  });

  test('POST /store/order - Place an order for a pet', async () => {
    const res = await request(BASE_URL)
      .post('/store/order')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);
  });
  // ... 17 more tests auto-generated
});
```

## CLI Tool

QAStarter also ships as a CLI:

```bash
npm install -g qastarter

# Generate a new project
qastarter new

# Check for outdated dependencies in your project
qastarter update

# List all available templates
qastarter list
```

The `update` command reads your `pom.xml`, `package.json`, `requirements.txt`, `build.gradle`, `.csproj`, or `go.mod` and compares dependency versions against QAStarter's maintained Bill of Materials (BOM).

## Why I Built This

I'm a QA engineer. I've set up frameworks for Selenium, Playwright, Appium, REST Assured — across Java, Python, TypeScript, C#. Every time, the first 2-3 days are wasted on the same boilerplate.

I wanted a tool where I could pick my stack and get a project that's ready to go — not a "hello world" quickstart, but a real framework with proper architecture, CI/CD, reporting, and config management.

QAStarter is that tool.

## Links

- **Web App**: [https://qastarter.qatonic.com](https://qastarter.qatonic.com)
- **GitHub**: [https://github.com/QATonic/qastarter](https://github.com/QATonic/qastarter)
- **npm**: `npm install -g qastarter`

It's free and open source. Feedback welcome.

---

*What framework combination would you want to see added? Drop a comment.*
