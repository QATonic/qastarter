# Reddit Post — r/selenium

**Subreddit**: r/selenium
**Title**: Free tool to generate a complete Selenium project (Java/Python/C#/JS) with CI/CD, Docker, reporting — in 30 seconds

---

**Body**:

Hey r/selenium,

I see a lot of posts here from people asking "how do I structure my Selenium project?" or "what's the best project setup for Selenium + TestNG?"

I built a free tool that generates fully structured Selenium projects with:

- **Java** (Maven or Gradle, TestNG or JUnit5)
- **Python** (Pytest)
- **TypeScript/JavaScript** (Jest)
- **C#** (NUnit + NuGet)

Every generated project includes:
- Page Object Model with BasePage + sample pages
- DriverManager / BrowserFactory with Chrome, Firefox, Edge support
- Multi-environment config (dev/qa/prod properties files)
- CI/CD pipeline (GitHub Actions, Jenkins, GitLab CI, Azure DevOps, CircleCI)
- Reporting (Allure or ExtentReports)
- Docker + docker-compose
- BrowserStack / Sauce Labs config (if you need cloud execution)
- Faker / DataFaker for test data generation
- Logging (Log4j for Java, Winston for JS, Python logging)
- Sample login tests that demonstrate the pattern

**Example: Java + Selenium + TestNG + Maven**

Generated project structure:
```
smoke-java-selenium/
  pom.xml
  src/main/java/com/example/qa/
    config/ConfigurationReader.java
    config/Environment.java
    core/BaseTest.java
    core/BrowserFactory.java
    core/DriverManager.java
    pages/BasePage.java
    pages/LoginPage.java
    utils/Log.java
    utils/WaitUtils.java
    utils/TestDataFactory.java      <-- Faker integration
  src/test/java/com/example/qa/
    tests/LoginTests.java
  .github/workflows/tests.yml       <-- CI/CD ready
  Dockerfile                         <-- Docker ready
```

Unzip, run `mvn clean test`, and it compiles and runs.

Try it: https://qastarter.qatonic.com

GitHub: https://github.com/QATonic/qastarter

Happy to take feature requests. What would make this more useful for your Selenium work?
