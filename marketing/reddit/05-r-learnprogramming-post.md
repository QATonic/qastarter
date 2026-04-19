# Reddit Post — r/learnprogramming

**Subreddit**: r/learnprogramming
**Title**: If you're learning test automation / QA engineering — here's a free tool that generates properly structured starter projects so you can focus on writing tests, not setup

---

**Body**:

I see a lot of posts here from people learning QA automation and getting stuck on project setup — "how do I configure Selenium with Maven?", "what's the right project structure for Playwright?", "how do I set up Pytest for Selenium?"

The setup phase is the most frustrating part when you're learning. You want to write tests, but first you need to figure out build tools, dependencies, folder structure, base classes, config files...

I built **QAStarter** — a free web tool where you:

1. Pick your testing type (Web, API, Mobile, Desktop, Performance)
2. Pick your framework (Selenium, Playwright, Cypress, Appium, REST Assured, etc.)
3. Pick your language (Java, Python, TypeScript, JavaScript, C#, Go)
4. Click generate

You get a ZIP with a complete, well-structured project that compiles and runs immediately.

**Why this is useful for learners:**

- **See how professionals structure projects** — Page Object Model, config management, logging, reporting
- **Working sample tests** — read the code, understand the patterns, modify for your use case
- **No dependency hell** — all versions are tested and compatible
- **Includes README** — explains how to run, how to add new tests, how to modify config

**Stacks you can generate:**

| Type | Frameworks | Languages |
|------|-----------|-----------|
| Web | Selenium, Playwright, Cypress, WebdriverIO | Java, Python, TS, JS, C#, Go |
| API | REST Assured, Supertest, Requests, RestSharp | Java, Python, TS, JS, C#, Go |
| Mobile | Appium, Espresso | Java, Python, TS, C#, Kotlin |
| Desktop | WinAppDriver, PyAutoGUI | Java, Python, C# |
| Performance | k6, Gatling, Locust | JS, Java, Python |

Every project includes CI/CD config (GitHub Actions, Jenkins, etc.), Docker support, and reporting.

Try it: https://qastarter.qatonic.com
GitHub: https://github.com/QATonic/qastarter

If you're studying for an SDET role or building your QA portfolio — generate a project, modify the tests for a real website, push to GitHub. Instant portfolio piece.
