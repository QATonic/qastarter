# YouTube Video Script — Main Demo

**Title**: Generate a Complete Test Automation Framework in 30 Seconds | QAStarter
**Duration**: 4-5 minutes
**Thumbnail text**: "30 Seconds" + Selenium/Playwright logos + generated project screenshot

---

## INTRO (0:00 - 0:30)

**[Screen: You at desk or just screen recording]**

"Every time I start a new test automation project, I spend the first 2-3 days on setup. Creating a Maven project, adding dependencies, writing base classes, configuring CI/CD, adding reporting...

Today I'm going to show you a tool that does all of that in 30 seconds. It's called QAStarter, and it generates production-ready test automation frameworks for any stack."

## DEMO 1: Java + Selenium + Maven (0:30 - 2:00)

**[Screen: Browser on qastarter.qatonic.com]**

"Let's start with the most common stack — Java, Selenium, TestNG, Maven.

I'll select:
- Testing Type: Web
- Framework: Selenium
- Language: Java
- Test Runner: TestNG
- Build Tool: Maven

For extras:
- CI/CD: GitHub Actions
- Reporting: Allure
- Docker: Yes
- Faker test data: Yes

[Click Generate]

A ZIP file downloads. Let me unzip it and look at the structure."

**[Screen: Terminal / IDE showing project structure]**

"Look at this — a complete framework:
- pom.xml with all dependencies configured
- BaseTest, DriverManager, BrowserFactory
- BasePage with reusable utilities
- LoginPage as a sample page object
- ConfigurationReader for multi-environment support
- Log4j logging
- Allure reporting integration
- GitHub Actions workflow
- Dockerfile
- Working sample tests

Let me run it:"

**[Screen: Terminal]**

```
mvn clean test
```

"And the tests compile and run. That took about 30 seconds from start to finish."

## DEMO 2: TypeScript + Playwright + npm (2:00 - 3:00)

**[Screen: Browser on QAStarter]**

"Let me try another stack — TypeScript, Playwright, Jest.

[Select options, generate, unzip]

Same thing — complete project with:
- PlaywrightManager
- BasePage with TypeScript types
- Config management
- Allure integration
- BrowserStack config — because I selected that option
- Faker test data factory

Let me install and run:"

```
npm install
npm test
```

"All dependencies resolve. Tests run. Done."

## DEMO 3: OpenAPI Generation (3:00 - 4:00)

**[Screen: Browser on QAStarter]**

"Here's something cool — API test generation from an OpenAPI spec.

I'll select:
- Testing Type: API
- Framework: Supertest
- Language: TypeScript

And in the OpenAPI field, I'll paste the Petstore API spec URL.

[Generate, unzip]

Let me open the generated openapi.test.ts file...

It generated 19 test cases — one for every endpoint in the Petstore API. GET, POST, PUT, DELETE — all mapped automatically with the correct HTTP methods and content types.

You'd customize these with real test data and assertions, but the scaffolding is done for you."

## OUTRO (4:00 - 4:30)

"QAStarter supports 49+ framework combinations across Java, Python, TypeScript, JavaScript, C#, Go, and Kotlin.

Every project includes CI/CD, Docker, reporting, and proper architecture.

Links are in the description. It's free.

If you try it, let me know in the comments what framework combination you used. And if there's a stack you want that's not supported yet — tell me."

---

## Description Box

QAStarter generates production-ready test automation frameworks in seconds.

49+ combinations: Selenium, Playwright, Cypress, WebdriverIO, Appium, REST Assured, Supertest, k6, Gatling, Locust + more.

Languages: Java, Python, TypeScript, JavaScript, C#, Go, Kotlin.

Try it FREE:
- Web: https://qastarter.qatonic.com
- GitHub: https://github.com/QATonic/qastarter
- CLI: npm install -g qastarter

Timestamps:
0:00 Intro
0:30 Demo: Java + Selenium + Maven
2:00 Demo: TypeScript + Playwright
3:00 Demo: OpenAPI test generation
4:00 Summary & links

#TestAutomation #Selenium #Playwright #QA #SDET #QAStarter

---

## Tags
test automation, selenium tutorial, playwright tutorial, test framework setup, qa automation, sdet, selenium java, playwright typescript, test automation framework, qa tools, qastarter, free testing tool, open source testing
