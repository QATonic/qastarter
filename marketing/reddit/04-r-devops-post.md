# Reddit Post — r/devops

**Subreddit**: r/devops
**Title**: Built a free tool that generates test automation projects with CI/CD pipelines pre-configured (Jenkins, GitHub Actions, GitLab CI, Azure DevOps, CircleCI)

---

**Body**:

One thing I've noticed across teams: test automation projects often have janky or missing CI/CD configs because the QA engineer who set up the project wasn't a DevOps person.

I built QAStarter — a project generator for test automation frameworks. The DevOps angle that might interest this sub:

**Every generated project includes a fully configured CI/CD pipeline:**

- **GitHub Actions** — matrix builds, caching, artifact upload for test reports
- **Jenkins** — multi-stage Jenkinsfile with proper agent config, parallel stages
- **GitLab CI** — stages for build/test/report with caching and artifacts
- **Azure DevOps** — proper task-based pipeline with test result publishing
- **CircleCI** — orbs-based config with parallelism

**Plus:**
- **Dockerfile** — multi-stage build, proper base images (maven:3.9, gradle:8, node:20, python:3.12, dotnet:8.0)
- **docker-compose.yml** — for local headless browser testing (Selenium Grid, etc.)
- **BrowserStack / Sauce Labs config** — YAML configs for cloud test execution
- **Multi-environment configs** — dev/qa/prod properties, switched via env vars or `-Denv=qa`

Supports 49+ combinations across Java, Python, TypeScript, C#, Go with Selenium, Playwright, Cypress, Appium, REST Assured, k6, Gatling, and more.

The goal: QA teams generate a project, push it to their repo, and the CI pipeline works on first commit. No manual pipeline setup needed.

https://qastarter.qatonic.com
https://github.com/QATonic/qastarter
