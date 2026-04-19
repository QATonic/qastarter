# Reddit Post — r/QualityAssurance

**Subreddit**: r/QualityAssurance
**Flair**: Tools / Resources
**Title**: I got tired of setting up test frameworks from scratch, so I built QAStarter — generates 49+ ready-to-run automation projects in seconds

---

**Body**:

Hey r/QualityAssurance,

Every time I joined a new team or started a new client project, I spent the first 2-3 days doing the same thing: setting up a Selenium/Playwright project with Maven/Gradle, configuring CI/CD, adding reporting, setting up page object structure, Docker, logging... you know the drill.

After doing this maybe 30+ times across different stacks, I finally automated the whole thing.

**What QAStarter does:**

- You pick your stack (testing type, framework, language, build tool, CI/CD, reporting)
- It generates a complete, production-ready project with proper folder structure, base classes, config management, sample tests — everything
- Download as ZIP, unzip, and your `mvn test` / `npm test` / `pytest` runs out of the box

**What's supported:**

- **Web**: Selenium, Playwright, Cypress, WebdriverIO
- **API**: REST Assured, Supertest, Requests, RestSharp, Resty
- **Mobile**: Appium, Espresso
- **Desktop**: WinAppDriver, PyAutoGUI
- **Performance**: k6, Gatling, Locust
- **Languages**: Java, Python, TypeScript, JavaScript, C#, Go, Kotlin
- **Build tools**: Maven, Gradle, npm, pip, NuGet, Go modules
- **CI/CD**: Jenkins, GitHub Actions, GitLab CI, Azure DevOps, CircleCI
- **Reporting**: Allure, ExtentReports, and framework-native reporters
- **Cloud farms**: BrowserStack, Sauce Labs (pre-configured YAML)
- **OpenAPI**: Paste a Swagger/OpenAPI URL and it auto-generates API test stubs
- **Test data**: Faker/DataFaker/Bogus integration for realistic test data generation

**49+ template combinations total.**

Every generated project includes:
- Page Object Model / proper architecture
- Configuration management (multi-environment: dev, qa, prod)
- Logging (Log4j, Winston, Python logging)
- Docker + docker-compose support
- CI/CD pipeline ready to go
- Sample tests that actually run

There's also a CLI tool (`qastarter`) that can check and update your project's dependency versions against our maintained BOM.

**It's free.** I built it because I needed it. Hoping it saves other QA folks some time too.

Would love feedback from this community — what frameworks or features would you want to see added?

**Links:**
- Web app: https://qastarter.qatonic.com
- GitHub: https://github.com/QATonic/qastarter
- npm CLI: `npm install -g qastarter`

---

**Posting tips:**
- Post on Tuesday or Wednesday, 9-11am EST (peak engagement)
- Reply to every comment within 2 hours
- If someone asks "why not just use X?", respond genuinely — don't be defensive
- Offer to add requested frameworks/languages in follow-up versions
