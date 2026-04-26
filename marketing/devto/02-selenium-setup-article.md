---
title: "How to Set Up a Production-Ready Selenium Framework in 30 Seconds"
published: true
tags: selenium, testing, java, automation
cover_image: [ADD_COVER_IMAGE_URL]
series: "QAStarter"
---

## The Traditional Way (2-3 Days)

If you've ever set up a Selenium framework from scratch, you know the checklist:

1. Create Maven/Gradle project
2. Add Selenium, TestNG/JUnit dependencies
3. Create DriverManager / BrowserFactory
4. Create BaseTest with setup/teardown
5. Create BasePage with common utilities
6. Set up configuration management
7. Add logging (Log4j / SLF4J)
8. Add reporting (Allure / ExtentReports)
9. Create Page Object classes
10. Configure CI/CD pipeline
11. Add Docker support for headless execution
12. Write your first actual test...

By step 12, it's been 2-3 days. And you haven't tested anything yet.

## The QAStarter Way (30 Seconds)

1. Go to [qastarter.qatonic.com](https://qastarter.qatonic.com)
2. Select: **Web > Selenium > Java > TestNG > Maven**
3. Choose your CI/CD tool, reporting, and extras
4. Click **Generate**
5. Unzip and run:

```bash
mvn clean test
```

Done. Your framework is ready.

## What You Get

```
your-project/
  pom.xml                                    # All dependencies configured
  src/main/java/com/example/
    config/
      ConfigurationReader.java               # Reads env-specific properties
      Environment.java                       # DEV, QA, STG, PROD enum
    core/
      BaseTest.java                          # @BeforeMethod/@AfterMethod
      BrowserFactory.java                    # Chrome, Firefox, Edge
      DriverManager.java                     # ThreadLocal driver management
    pages/
      BasePage.java                          # click, sendKeys, waitFor, screenshot
      LoginPage.java                         # Sample page object
    listeners/
      TestListener.java                      # Allure/Extent reporting hooks
      RetryAnalyzer.java                     # Auto-retry failed tests
    utils/
      Log.java                               # Log4j wrapper
      WaitUtils.java                         # Explicit wait utilities
      ScreenshotUtils.java                   # Failure screenshot capture
      TestDataFactory.java                   # Faker test data (optional)
  src/test/java/com/example/
    tests/
      LoginTests.java                        # Working sample tests
  src/test/resources/
    testdata/sample.json                     # Sample test data
    testng.xml / regression.xml              # Test suite configs
  src/main/resources/
    config/dev.properties                    # Dev environment config
    config/qa.properties                     # QA environment config
    config/prod.properties                   # Prod environment config
    log4j2.xml                               # Logging config
  .github/workflows/tests.yml               # CI/CD pipeline
  Dockerfile                                 # Docker support
  README.md                                  # How to run everything
```

Every file has real, working code — not empty stubs.

## Switching Environments

```bash
# Run against dev (default)
mvn clean test

# Run against QA
mvn clean test -Denv=qa

# Run against prod
mvn clean test -Denv=prod
```

The `ConfigurationReader` automatically loads the right `dev.properties` / `qa.properties` / `prod.properties`.

## Adding a New Page Object

Follow the pattern in `LoginPage.java`:

```java
public class DashboardPage extends BasePage {

    private final By welcomeMessage = By.id("welcome-msg");
    private final By logoutButton = By.cssSelector("[data-test='logout']");

    public DashboardPage(WebDriver driver) {
        super(driver);
    }

    public String getWelcomeText() {
        return getText(welcomeMessage);
    }

    public LoginPage clickLogout() {
        click(logoutButton);
        return new LoginPage(driver);
    }
}
```

The `BasePage` gives you `click()`, `sendKeys()`, `getText()`, `waitForVisible()`, `takeScreenshot()` — all the common utilities.

## Other Selenium Stacks Available

| Language | Build Tool | Test Runner |
|----------|-----------|-------------|
| Java | Maven | TestNG |
| Java | Maven | JUnit5 |
| Java | Gradle | TestNG |
| Java | Gradle | JUnit5 |
| Python | pip | Pytest |
| TypeScript | npm | Jest |
| JavaScript | npm | Jest |
| C# | NuGet | NUnit |
| Go | Go mod | Testify |

All 10 combinations generate the same quality of framework, just in your preferred language.

## Try It

- **Web**: [qastarter.qatonic.com](https://qastarter.qatonic.com)
- **GitHub**: [github.com/QATonic/qastarter](https://github.com/QATonic/qastarter)
- **CLI**: `npm install -g qastarter && qastarter new`
