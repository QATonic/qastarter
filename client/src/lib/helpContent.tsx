interface HelpContent {
  [key: string]: string | React.ReactNode;
}

export const helpContent: HelpContent = {
  // Testing Types
  web: (
    <div>
      <p className="font-medium mb-1">Web Testing</p>
      <p className="text-xs">Automate browser-based web applications across different browsers and platforms.</p>
      <p className="text-xs mt-1">✓ Cross-browser testing (Chrome, Firefox, Edge, Safari)</p>
      <p className="text-xs">✓ Responsive design validation</p>
      <p className="text-xs">✓ Form interactions and validations</p>
      <p className="text-xs mt-1 italic">Frameworks: Selenium, Playwright, Cypress, Robot Framework</p>
    </div>
  ),
  mobile: (
    <div>
      <p className="font-medium mb-1">Mobile Testing</p>
      <p className="text-xs">Test native and hybrid mobile applications on iOS and Android devices.</p>
      <p className="text-xs mt-1">✓ Native app automation</p>
      <p className="text-xs">✓ Real device and emulator support</p>
      <p className="text-xs">✓ Gesture and touch interactions</p>
      <p className="text-xs mt-1 italic">Frameworks: Appium, XCUITest, Espresso</p>
    </div>
  ),
  api: (
    <div>
      <p className="font-medium mb-1">API Testing</p>
      <p className="text-xs">Validate REST/GraphQL APIs for functionality, reliability, and performance.</p>
      <p className="text-xs mt-1">✓ Request/Response validation</p>
      <p className="text-xs">✓ Schema validation</p>
      <p className="text-xs">✓ Authentication testing</p>
      <p className="text-xs mt-1 italic">Frameworks: RestAssured, Requests, Supertest</p>
    </div>
  ),
  desktop: (
    <div>
      <p className="font-medium mb-1">Desktop Testing</p>
      <p className="text-xs">Automate native Windows, macOS, or Linux desktop applications.</p>
      <p className="text-xs mt-1">✓ Windows app automation</p>
      <p className="text-xs">✓ Cross-platform GUI testing</p>
      <p className="text-xs">✓ Legacy application support</p>
      <p className="text-xs mt-1 italic">Frameworks: WinAppDriver, PyAutoGUI</p>
    </div>
  ),

  // Frameworks
  selenium: (
    <div>
      <p className="font-medium mb-1">Selenium WebDriver</p>
      <p className="text-xs">Industry-standard browser automation framework with multi-language support.</p>
      <p className="text-xs mt-1">✓ Supports all major browsers</p>
      <p className="text-xs">✓ Large community and ecosystem</p>
      <p className="text-xs">✓ Selenium Grid for parallel execution</p>
      <p className="text-xs mt-1 italic">Languages: Java, Python, C#, JavaScript</p>
    </div>
  ),
  playwright: (
    <div>
      <p className="font-medium mb-1">Playwright</p>
      <p className="text-xs">Modern automation framework by Microsoft with auto-wait and powerful selectors.</p>
      <p className="text-xs mt-1">✓ Auto-waiting for elements</p>
      <p className="text-xs">✓ Network interception</p>
      <p className="text-xs">✓ Built-in test runner</p>
      <p className="text-xs mt-1 italic">Languages: JavaScript, TypeScript, Python, Java, C#</p>
    </div>
  ),
  cypress: (
    <div>
      <p className="font-medium mb-1">Cypress</p>
      <p className="text-xs">JavaScript-based E2E testing framework with real-time reloading and debugging.</p>
      <p className="text-xs mt-1">✓ Time-travel debugging</p>
      <p className="text-xs">✓ Automatic waiting</p>
      <p className="text-xs">✓ Network stubbing</p>
      <p className="text-xs mt-1 italic">Languages: JavaScript, TypeScript</p>
    </div>
  ),
  appium: (
    <div>
      <p className="font-medium mb-1">Appium</p>
      <p className="text-xs">Cross-platform mobile automation using WebDriver protocol.</p>
      <p className="text-xs mt-1">✓ iOS and Android support</p>
      <p className="text-xs">✓ Native, hybrid, and mobile web apps</p>
      <p className="text-xs">✓ Real devices and emulators</p>
      <p className="text-xs mt-1 italic">Languages: Java, Python, JavaScript, C#</p>
    </div>
  ),
  webdriverio: (
    <div>
      <p className="font-medium mb-1">WebdriverIO</p>
      <p className="text-xs">Progressive automation framework with sync and async API support.</p>
      <p className="text-xs mt-1">✓ WebDriver and DevTools protocols</p>
      <p className="text-xs">✓ Rich plugin ecosystem</p>
      <p className="text-xs">✓ Mobile testing support</p>
      <p className="text-xs mt-1 italic">Languages: JavaScript, TypeScript</p>
    </div>
  ),
  restassured: (
    <div>
      <p className="font-medium mb-1">REST Assured</p>
      <p className="text-xs">Java DSL for testing REST APIs with fluent syntax.</p>
      <p className="text-xs mt-1">✓ BDD-style syntax</p>
      <p className="text-xs">✓ JSON/XML validation</p>
      <p className="text-xs">✓ Authentication support</p>
    </div>
  ),
  requests: (
    <div>
      <p className="font-medium mb-1">Requests + Pytest</p>
      <p className="text-xs">Python's HTTP library combined with pytest for API testing.</p>
      <p className="text-xs mt-1">✓ Simple and intuitive API</p>
      <p className="text-xs">✓ Session management</p>
      <p className="text-xs">✓ JSON handling</p>
    </div>
  ),
  supertest: (
    <div>
      <p className="font-medium mb-1">Supertest</p>
      <p className="text-xs">HTTP assertions library for Node.js API testing.</p>
      <p className="text-xs mt-1">✓ Fluent API</p>
      <p className="text-xs">✓ Promise-based</p>
      <p className="text-xs">✓ Express.js integration</p>
    </div>
  ),
  restsharp: (
    <div>
      <p className="font-medium mb-1">RestSharp</p>
      <p className="text-xs">.NET HTTP client library for REST API testing.</p>
      <p className="text-xs mt-1">✓ Async support</p>
      <p className="text-xs">✓ Serialization built-in</p>
      <p className="text-xs">✓ Authentication helpers</p>
    </div>
  ),
  winappdriver: (
    <div>
      <p className="font-medium mb-1">WinAppDriver</p>
      <p className="text-xs">Microsoft's UI automation driver for Windows applications.</p>
      <p className="text-xs mt-1">✓ UWP and Win32 apps</p>
      <p className="text-xs">✓ WebDriver protocol</p>
      <p className="text-xs">✓ Appium compatible</p>
    </div>
  ),
  pyautogui: (
    <div>
      <p className="font-medium mb-1">PyAutoGUI</p>
      <p className="text-xs">Cross-platform GUI automation library for Python.</p>
      <p className="text-xs mt-1">✓ Mouse and keyboard control</p>
      <p className="text-xs">✓ Screenshot capabilities</p>
      <p className="text-xs">✓ Image recognition</p>
    </div>
  ),
  espresso: (
    <div>
      <p className="font-medium mb-1">Espresso</p>
      <p className="text-xs">Google's native Android UI testing framework.</p>
      <p className="text-xs mt-1">✓ Fast and reliable</p>
      <p className="text-xs">✓ Automatic synchronization</p>
      <p className="text-xs">✓ Android Studio integration</p>
    </div>
  ),
  xcuitest: (
    <div>
      <p className="font-medium mb-1">XCUITest</p>
      <p className="text-xs">Apple's native iOS UI testing framework.</p>
      <p className="text-xs mt-1">✓ Swift and Objective-C</p>
      <p className="text-xs">✓ Xcode integration</p>
      <p className="text-xs">✓ Accessibility testing</p>
    </div>
  ),
  robotframework: (
    <div>
      <p className="font-medium mb-1">Robot Framework</p>
      <p className="text-xs">Keyword-driven testing framework for acceptance testing and RPA.</p>
      <p className="text-xs mt-1">✓ Human-readable test syntax</p>
      <p className="text-xs">✓ Extensive library ecosystem</p>
      <p className="text-xs">✓ SeleniumLibrary for web testing</p>
      <p className="text-xs mt-1 italic">Best for: Acceptance testing and non-programmers</p>
    </div>
  ),

  // Languages
  java: (
    <div>
      <p className="font-medium mb-1">Java</p>
      <p className="text-xs">Enterprise-grade language with robust testing ecosystem.</p>
      <p className="text-xs mt-1">✓ Strong typing and IDE support</p>
      <p className="text-xs">✓ TestNG and JUnit frameworks</p>
      <p className="text-xs">✓ Maven/Gradle build tools</p>
      <p className="text-xs mt-1 italic">Best for: Enterprise QA teams</p>
    </div>
  ),
  python: (
    <div>
      <p className="font-medium mb-1">Python</p>
      <p className="text-xs">Clean syntax with powerful testing libraries.</p>
      <p className="text-xs mt-1">✓ Easy to learn and read</p>
      <p className="text-xs">✓ pytest framework</p>
      <p className="text-xs">✓ Rich data science libraries</p>
      <p className="text-xs mt-1 italic">Best for: Quick automation and scripting</p>
    </div>
  ),
  javascript: (
    <div>
      <p className="font-medium mb-1">JavaScript</p>
      <p className="text-xs">Web's native language with async/await support.</p>
      <p className="text-xs mt-1">✓ Same language as web apps</p>
      <p className="text-xs">✓ Jest and Mocha frameworks</p>
      <p className="text-xs">✓ npm ecosystem</p>
      <p className="text-xs mt-1 italic">Best for: Frontend and full-stack teams</p>
    </div>
  ),
  typescript: (
    <div>
      <p className="font-medium mb-1">TypeScript</p>
      <p className="text-xs">Type-safe JavaScript with better tooling and error detection.</p>
      <p className="text-xs mt-1">✓ Compile-time error checking</p>
      <p className="text-xs">✓ Better IDE autocomplete</p>
      <p className="text-xs">✓ Easier refactoring</p>
      <p className="text-xs mt-1 italic">Best for: Large-scale test projects</p>
    </div>
  ),
  csharp: (
    <div>
      <p className="font-medium mb-1">C#</p>
      <p className="text-xs">Microsoft's language with excellent .NET integration.</p>
      <p className="text-xs mt-1">✓ Visual Studio support</p>
      <p className="text-xs">✓ NUnit and xUnit frameworks</p>
      <p className="text-xs">✓ Strong typing</p>
      <p className="text-xs mt-1 italic">Best for: .NET development teams</p>
    </div>
  ),
  swift: (
    <div>
      <p className="font-medium mb-1">Swift</p>
      <p className="text-xs">Apple's modern language for iOS/macOS development.</p>
      <p className="text-xs mt-1">✓ Native iOS testing</p>
      <p className="text-xs">✓ XCTest framework</p>
      <p className="text-xs">✓ Xcode integration</p>
      <p className="text-xs mt-1 italic">Best for: iOS development teams</p>
    </div>
  ),
  kotlin: (
    <div>
      <p className="font-medium mb-1">Kotlin</p>
      <p className="text-xs">Modern JVM language by JetBrains, official for Android development.</p>
      <p className="text-xs mt-1">✓ Concise and expressive syntax</p>
      <p className="text-xs">✓ Full Java interoperability</p>
      <p className="text-xs">✓ Android Studio integration</p>
      <p className="text-xs mt-1 italic">Best for: Android and modern JVM projects</p>
    </div>
  ),

  // Testing Patterns
  pom: (
    <div>
      <p className="font-medium mb-1">Page Object Model (POM)</p>
      <p className="text-xs">Design pattern that creates an object for each page in your application.</p>
      <p className="text-xs mt-1">✓ Separates UI structure from test logic</p>
      <p className="text-xs">✓ Reduces code duplication</p>
      <p className="text-xs">✓ Easy maintenance when UI changes</p>
      <p className="text-xs mt-1 italic">Recommended for most projects</p>
    </div>
  ),
  "page-object-model": (
    <div>
      <p className="font-medium mb-1">Page Object Model (POM)</p>
      <p className="text-xs">Design pattern that creates an object for each page in your application.</p>
      <p className="text-xs mt-1">✓ Separates UI structure from test logic</p>
      <p className="text-xs">✓ Reduces code duplication</p>
      <p className="text-xs">✓ Easy maintenance when UI changes</p>
      <p className="text-xs mt-1 italic">Recommended for most projects</p>
    </div>
  ),
  bdd: (
    <div>
      <p className="font-medium mb-1">Behavior-Driven Development (BDD)</p>
      <p className="text-xs">Write tests in plain English using Given/When/Then syntax.</p>
      <p className="text-xs mt-1">✓ Business-readable test scenarios</p>
      <p className="text-xs">✓ Cucumber/Gherkin integration</p>
      <p className="text-xs">✓ Living documentation</p>
      <p className="text-xs mt-1 italic">Best for: Teams with non-technical stakeholders</p>
    </div>
  ),
  fluent: (
    <div>
      <p className="font-medium mb-1">Fluent Pattern</p>
      <p className="text-xs">Chain method calls for readable and expressive API testing.</p>
      <p className="text-xs mt-1">✓ Readable test code</p>
      <p className="text-xs">✓ Method chaining</p>
      <p className="text-xs">✓ Self-documenting tests</p>
      <p className="text-xs mt-1 italic">Best for: API testing with REST Assured</p>
    </div>
  ),
  "data-driven": (
    <div>
      <p className="font-medium mb-1">Data-Driven Testing</p>
      <p className="text-xs">Run the same test with multiple data sets from external sources.</p>
      <p className="text-xs mt-1">✓ Test data separation</p>
      <p className="text-xs">✓ CSV, JSON, Excel support</p>
      <p className="text-xs">✓ Parameterized test execution</p>
      <p className="text-xs mt-1 italic">Best for: Testing with multiple input combinations</p>
    </div>
  ),
  "functional-patterns": (
    <div>
      <p className="font-medium mb-1">Functional Patterns</p>
      <p className="text-xs">Organize tests around functional areas and user workflows.</p>
      <p className="text-xs mt-1">✓ Action-based organization</p>
      <p className="text-xs">✓ Reusable helper functions</p>
      <p className="text-xs">✓ Simple and direct approach</p>
      <p className="text-xs mt-1 italic">Best for: Desktop automation with PyAutoGUI</p>
    </div>
  ),
  hybrid: (
    <div>
      <p className="font-medium mb-1">Hybrid Pattern</p>
      <p className="text-xs">Combines multiple patterns for flexible test architecture.</p>
      <p className="text-xs mt-1">✓ Best of multiple approaches</p>
      <p className="text-xs">✓ Flexible structure</p>
      <p className="text-xs">✓ Adaptable to project needs</p>
      <p className="text-xs mt-1 italic">Best for: Complex projects with varied requirements</p>
    </div>
  ),
  "contract-testing": (
    <div>
      <p className="font-medium mb-1">Contract Testing (Pact)</p>
      <p className="text-xs">Consumer-driven contract testing for API integrations.</p>
      <p className="text-xs mt-1">✓ Verify API compatibility between services</p>
      <p className="text-xs">✓ Consumer defines expected interactions</p>
      <p className="text-xs">✓ Provider verifies against contracts</p>
      <p className="text-xs mt-1 italic">Best for: Microservices and API integrations</p>
    </div>
  ),

  // Test Runners
  testng: (
    <div>
      <p className="font-medium mb-1">TestNG</p>
      <p className="text-xs">Feature-rich Java testing framework inspired by JUnit.</p>
      <p className="text-xs mt-1">✓ Parallel test execution</p>
      <p className="text-xs">✓ Data-driven testing with @DataProvider</p>
      <p className="text-xs">✓ Flexible test configuration via XML</p>
      <p className="text-xs mt-1 italic">Popular in enterprise Java projects</p>
    </div>
  ),
  junit5: (
    <div>
      <p className="font-medium mb-1">JUnit 5</p>
      <p className="text-xs">Modern Java testing framework with modular architecture.</p>
      <p className="text-xs mt-1">✓ Parameterized tests</p>
      <p className="text-xs">✓ Dynamic tests</p>
      <p className="text-xs">✓ Extension model</p>
      <p className="text-xs mt-1 italic">Standard for Java unit testing</p>
    </div>
  ),
  pytest: (
    <div>
      <p className="font-medium mb-1">pytest</p>
      <p className="text-xs">Python's most popular testing framework with simple syntax.</p>
      <p className="text-xs mt-1">✓ Simple assert statements</p>
      <p className="text-xs">✓ Powerful fixtures</p>
      <p className="text-xs">✓ Rich plugin ecosystem</p>
      <p className="text-xs mt-1 italic">De facto standard for Python testing</p>
    </div>
  ),
  jest: (
    <div>
      <p className="font-medium mb-1">Jest</p>
      <p className="text-xs">JavaScript testing framework by Meta with zero config.</p>
      <p className="text-xs mt-1">✓ Built-in mocking</p>
      <p className="text-xs">✓ Snapshot testing</p>
      <p className="text-xs">✓ Code coverage</p>
      <p className="text-xs mt-1 italic">Popular for React and Node.js projects</p>
    </div>
  ),
  mocha: (
    <div>
      <p className="font-medium mb-1">Mocha</p>
      <p className="text-xs">Flexible JavaScript testing framework with async support.</p>
      <p className="text-xs mt-1">✓ BDD and TDD interfaces</p>
      <p className="text-xs">✓ Works with any assertion library</p>
      <p className="text-xs">✓ Browser and Node.js support</p>
    </div>
  ),
  nunit: (
    <div>
      <p className="font-medium mb-1">NUnit</p>
      <p className="text-xs">Popular .NET testing framework with rich assertions.</p>
      <p className="text-xs mt-1">✓ Parameterized tests</p>
      <p className="text-xs">✓ Parallel execution</p>
      <p className="text-xs">✓ Visual Studio integration</p>
      <p className="text-xs mt-1 italic">Standard for .NET testing</p>
    </div>
  ),
  xctest: (
    <div>
      <p className="font-medium mb-1">XCTest</p>
      <p className="text-xs">Apple's native testing framework for iOS/macOS.</p>
      <p className="text-xs mt-1">✓ UI and unit testing</p>
      <p className="text-xs">✓ Performance testing</p>
      <p className="text-xs">✓ Xcode integration</p>
    </div>
  ),
  robot: (
    <div>
      <p className="font-medium mb-1">Robot Framework</p>
      <p className="text-xs">Keyword-driven test runner for acceptance testing.</p>
      <p className="text-xs mt-1">✓ .robot test files</p>
      <p className="text-xs">✓ Built-in HTML reports</p>
      <p className="text-xs">✓ Library-based extensibility</p>
      <p className="text-xs mt-1 italic">Standard for Robot Framework projects</p>
    </div>
  ),

  // Build Tools
  maven: (
    <div>
      <p className="font-medium mb-1">Maven</p>
      <p className="text-xs">Java's standard build tool with convention over configuration.</p>
      <p className="text-xs mt-1">✓ Standardized project structure</p>
      <p className="text-xs">✓ Dependency management via pom.xml</p>
      <p className="text-xs">✓ Extensive plugin ecosystem</p>
      <p className="text-xs mt-1 italic">Most popular for Java projects</p>
    </div>
  ),
  gradle: (
    <div>
      <p className="font-medium mb-1">Gradle</p>
      <p className="text-xs">Modern build tool with Groovy/Kotlin DSL support.</p>
      <p className="text-xs mt-1">✓ Faster than Maven (incremental builds)</p>
      <p className="text-xs">✓ Flexible configuration</p>
      <p className="text-xs">✓ Android's default build tool</p>
      <p className="text-xs mt-1 italic">Growing in popularity</p>
    </div>
  ),
  npm: (
    <div>
      <p className="font-medium mb-1">npm</p>
      <p className="text-xs">Node.js package manager with the largest registry.</p>
      <p className="text-xs mt-1">✓ package.json configuration</p>
      <p className="text-xs">✓ Script automation</p>
      <p className="text-xs">✓ Millions of packages</p>
      <p className="text-xs mt-1 italic">Standard for JavaScript projects</p>
    </div>
  ),
  pip: (
    <div>
      <p className="font-medium mb-1">pip</p>
      <p className="text-xs">Python's package installer for managing dependencies.</p>
      <p className="text-xs mt-1">✓ requirements.txt support</p>
      <p className="text-xs">✓ Virtual environment compatible</p>
      <p className="text-xs">✓ PyPI package registry</p>
      <p className="text-xs mt-1 italic">Standard for Python projects</p>
    </div>
  ),
  nuget: (
    <div>
      <p className="font-medium mb-1">NuGet</p>
      <p className="text-xs">.NET's package manager for libraries and tools.</p>
      <p className="text-xs mt-1">✓ Visual Studio integration</p>
      <p className="text-xs">✓ .csproj configuration</p>
      <p className="text-xs">✓ Package restore</p>
      <p className="text-xs mt-1 italic">Standard for .NET projects</p>
    </div>
  ),
  spm: (
    <div>
      <p className="font-medium mb-1">Swift Package Manager</p>
      <p className="text-xs">Apple's native dependency manager for Swift.</p>
      <p className="text-xs mt-1">✓ Package.swift configuration</p>
      <p className="text-xs">✓ Xcode integration</p>
      <p className="text-xs">✓ Cross-platform support</p>
      <p className="text-xs mt-1 italic">Standard for Swift projects</p>
    </div>
  ),

  // CI/CD Tools
  "github-actions": (
    <div>
      <p className="font-medium mb-1">GitHub Actions</p>
      <p className="text-xs">Built-in CI/CD for GitHub with marketplace of reusable actions.</p>
      <p className="text-xs mt-1">✓ Free for public repositories</p>
      <p className="text-xs">✓ Matrix builds for cross-platform testing</p>
      <p className="text-xs">✓ Integrated with GitHub ecosystem</p>
      <p className="text-xs mt-1 italic">Best for: GitHub-hosted projects</p>
    </div>
  ),
  jenkins: (
    <div>
      <p className="font-medium mb-1">Jenkins</p>
      <p className="text-xs">Open-source automation server with extensive plugin ecosystem.</p>
      <p className="text-xs mt-1">✓ Self-hosted and customizable</p>
      <p className="text-xs">✓ Pipeline as code (Jenkinsfile)</p>
      <p className="text-xs">✓ Thousands of plugins</p>
      <p className="text-xs mt-1 italic">Best for: Enterprise environments</p>
    </div>
  ),
  "gitlab-ci": (
    <div>
      <p className="font-medium mb-1">GitLab CI/CD</p>
      <p className="text-xs">Built-in CI/CD for GitLab with Docker support.</p>
      <p className="text-xs mt-1">✓ Auto DevOps capabilities</p>
      <p className="text-xs">✓ Container registry</p>
      <p className="text-xs">✓ Security scanning</p>
      <p className="text-xs mt-1 italic">Best for: GitLab-hosted projects</p>
    </div>
  ),
  "azure-devops": (
    <div>
      <p className="font-medium mb-1">Azure DevOps</p>
      <p className="text-xs">Microsoft's comprehensive DevOps platform.</p>
      <p className="text-xs mt-1">✓ Azure Pipelines for CI/CD</p>
      <p className="text-xs">✓ Boards for project management</p>
      <p className="text-xs">✓ Artifact management</p>
      <p className="text-xs mt-1 italic">Best for: Microsoft ecosystem teams</p>
    </div>
  ),
  circleci: (
    <div>
      <p className="font-medium mb-1">CircleCI</p>
      <p className="text-xs">Cloud-based CI/CD platform known for fast builds.</p>
      <p className="text-xs mt-1">✓ Docker-first approach</p>
      <p className="text-xs">✓ Parallelism and caching</p>
      <p className="text-xs">✓ Generous free tier</p>
      <p className="text-xs mt-1 italic">Best for: Fast iteration teams</p>
    </div>
  ),
  none: (
    <div>
      <p className="font-medium mb-1">None</p>
      <p className="text-xs">Skip this configuration step.</p>
      <p className="text-xs mt-1">You can always add this later to your project manually.</p>
    </div>
  ),

  // Reporting Tools
  allure: (
    <div>
      <p className="font-medium mb-1">Allure Report</p>
      <p className="text-xs">Feature-rich reporting framework with beautiful UI.</p>
      <p className="text-xs mt-1">✓ Timeline visualization</p>
      <p className="text-xs">✓ Historical trends and analytics</p>
      <p className="text-xs">✓ Screenshot and log attachments</p>
      <p className="text-xs mt-1 italic">Best for: Detailed test analytics</p>
    </div>
  ),
  "extent-reports": (
    <div>
      <p className="font-medium mb-1">ExtentReports</p>
      <p className="text-xs">Lightweight HTML/PDF reporting library.</p>
      <p className="text-xs mt-1">✓ Real-time reporting</p>
      <p className="text-xs">✓ Charts and dashboards</p>
      <p className="text-xs">✓ Easy integration</p>
      <p className="text-xs mt-1 italic">Best for: Quick setup and simple reports</p>
    </div>
  ),
  "testng-reports": (
    <div>
      <p className="font-medium mb-1">TestNG Reports</p>
      <p className="text-xs">Built-in HTML reports from TestNG framework.</p>
      <p className="text-xs mt-1">✓ No additional setup required</p>
      <p className="text-xs">✓ Test results and execution time</p>
      <p className="text-xs">✓ Suite and test details</p>
    </div>
  ),
  "junit-reports": (
    <div>
      <p className="font-medium mb-1">JUnit Reports</p>
      <p className="text-xs">Standard XML/HTML reports from JUnit.</p>
      <p className="text-xs mt-1">✓ CI/CD compatible format</p>
      <p className="text-xs">✓ Surefire plugin integration</p>
      <p className="text-xs">✓ Widely supported</p>
    </div>
  ),
  "pytest-html": (
    <div>
      <p className="font-medium mb-1">pytest-html</p>
      <p className="text-xs">HTML report plugin for pytest.</p>
      <p className="text-xs mt-1">✓ Self-contained HTML files</p>
      <p className="text-xs">✓ Screenshot support</p>
      <p className="text-xs">✓ Customizable appearance</p>
    </div>
  ),
  "mochawesome": (
    <div>
      <p className="font-medium mb-1">Mochawesome</p>
      <p className="text-xs">Beautiful HTML reporter for Mocha/Cypress.</p>
      <p className="text-xs mt-1">✓ Modern UI design</p>
      <p className="text-xs">✓ Charts and statistics</p>
      <p className="text-xs">✓ JSON output for CI/CD</p>
    </div>
  ),
  "nunit-reports": (
    <div>
      <p className="font-medium mb-1">NUnit Reports</p>
      <p className="text-xs">Built-in XML reports from NUnit framework.</p>
      <p className="text-xs mt-1">✓ Visual Studio integration</p>
      <p className="text-xs">✓ TRX format support</p>
      <p className="text-xs">✓ Azure DevOps compatible</p>
    </div>
  ),
  "jest-html": (
    <div>
      <p className="font-medium mb-1">Jest HTML Report</p>
      <p className="text-xs">Simple HTML report generator for Jest tests.</p>
      <p className="text-xs mt-1">✓ Clean and minimal design</p>
      <p className="text-xs">✓ Test summary and details</p>
      <p className="text-xs">✓ Easy to share</p>
    </div>
  ),
  "jest-html-reporter": (
    <div>
      <p className="font-medium mb-1">Jest HTML Reporter</p>
      <p className="text-xs">Customizable HTML reporter for Jest test results.</p>
      <p className="text-xs mt-1">✓ Detailed test output</p>
      <p className="text-xs">✓ Configurable themes</p>
      <p className="text-xs">✓ CI/CD friendly</p>
    </div>
  ),
  "junit-html": (
    <div>
      <p className="font-medium mb-1">JUnit HTML Reports</p>
      <p className="text-xs">HTML formatted JUnit test reports.</p>
      <p className="text-xs mt-1">✓ Browser-viewable results</p>
      <p className="text-xs">✓ Test execution details</p>
      <p className="text-xs">✓ Easy to navigate</p>
    </div>
  ),
  "pytest-json": (
    <div>
      <p className="font-medium mb-1">PyTest JSON Report</p>
      <p className="text-xs">JSON format test results for pytest.</p>
      <p className="text-xs mt-1">✓ Machine-readable output</p>
      <p className="text-xs">✓ CI/CD integration</p>
      <p className="text-xs">✓ Custom processing support</p>
    </div>
  ),
  "pytest-json-report": (
    <div>
      <p className="font-medium mb-1">PyTest JSON Report</p>
      <p className="text-xs">Detailed JSON reporting plugin for pytest.</p>
      <p className="text-xs mt-1">✓ Comprehensive test metadata</p>
      <p className="text-xs">✓ Custom report generation</p>
      <p className="text-xs">✓ API integration ready</p>
    </div>
  ),
  junit: (
    <div>
      <p className="font-medium mb-1">JUnit Reports</p>
      <p className="text-xs">Standard JUnit XML format reports.</p>
      <p className="text-xs mt-1">✓ Universal CI/CD support</p>
      <p className="text-xs">✓ Industry standard format</p>
      <p className="text-xs">✓ Tool agnostic</p>
    </div>
  ),
  "robot-reports": (
    <div>
      <p className="font-medium mb-1">Robot Framework Reports</p>
      <p className="text-xs">Built-in HTML reports from Robot Framework.</p>
      <p className="text-xs mt-1">✓ Interactive log.html and report.html</p>
      <p className="text-xs">✓ Screenshot and trace attachments</p>
      <p className="text-xs">✓ No additional setup required</p>
    </div>
  ),

  // Utility Components
  configReader: (
    <div>
      <p className="font-medium mb-1">Configuration Reader</p>
      <p className="text-xs">Centralized configuration management for your test framework.</p>
      <p className="text-xs mt-1">✓ Environment-specific settings (dev, qa, prod)</p>
      <p className="text-xs">✓ Type-safe configuration access</p>
      <p className="text-xs">✓ Easy to switch between environments</p>
      <p className="text-xs mt-1 text-primary font-medium">Recommended for all projects</p>
    </div>
  ),
  jsonReader: (
    <div>
      <p className="font-medium mb-1">JSON Reader</p>
      <p className="text-xs">Utility for parsing and reading JSON test data files.</p>
      <p className="text-xs mt-1">✓ Load test data from JSON files</p>
      <p className="text-xs">✓ Support for nested data structures</p>
      <p className="text-xs">✓ Easy data-driven testing setup</p>
      <p className="text-xs mt-1 italic">Best for: Data-driven test scenarios</p>
    </div>
  ),
  screenshotUtility: (
    <div>
      <p className="font-medium mb-1">Screenshot Utility</p>
      <p className="text-xs">Capture screenshots during test execution for debugging and reporting.</p>
      <p className="text-xs mt-1">✓ Auto-capture on test failure</p>
      <p className="text-xs">✓ Manual screenshot capture</p>
      <p className="text-xs">✓ Integration with test reports</p>
      <p className="text-xs mt-1 text-primary font-medium">Recommended for UI testing</p>
    </div>
  ),
  logger: (
    <div>
      <p className="font-medium mb-1">Logger</p>
      <p className="text-xs">Enhanced logging utility for debugging and test execution tracking.</p>
      <p className="text-xs mt-1">✓ Multiple log levels (DEBUG, INFO, WARN, ERROR)</p>
      <p className="text-xs">✓ File and console output</p>
      <p className="text-xs">✓ Structured logging format</p>
      <p className="text-xs mt-1 text-primary font-medium">Recommended for all projects</p>
    </div>
  ),
  dataProvider: (
    <div>
      <p className="font-medium mb-1">Data Provider</p>
      <p className="text-xs">Manage test data providers for parameterized testing.</p>
      <p className="text-xs mt-1">✓ CSV and JSON data sources</p>
      <p className="text-xs">✓ Dynamic test data generation</p>
      <p className="text-xs">✓ Reusable data sets across tests</p>
      <p className="text-xs mt-1 italic">Best for: Data-driven and parameterized tests</p>
    </div>
  ),

  // Keyboard Shortcuts
  keyboardShortcuts: (
    <div className="space-y-2">
      <p className="font-medium">Keyboard Shortcuts</p>
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Alt</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">N</kbd>
          <span>Next step</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Alt</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">P</kbd>
          <span>Previous step</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Alt</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">S</kbd>
          <span>Skip step</span>
        </div>
      </div>
    </div>
  ),
};

// Helper function to get help content by key
export function getHelpContent(key: string): string | React.ReactNode {
  return helpContent[key] || "No help available for this item.";
}
