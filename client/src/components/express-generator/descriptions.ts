/**
 * Short, user-facing descriptions for each configurable option shown in the
 * Express Generator. Used as tooltip content on the OptionButtonGroup chips so
 * users can quickly understand what each choice means without leaving the page.
 *
 * Keep each description to ~1 sentence (max ~140 chars). Avoid marketing fluff.
 */

export const testingTypeDescriptions: Record<string, string> = {
  web: 'Browser-based end-to-end testing across Chrome, Firefox, Safari, Edge.',
  mobile: 'Native and hybrid mobile app testing on Android and iOS devices.',
  api: 'REST, GraphQL, gRPC, and contract testing for backend services.',
  desktop: 'Windows desktop application automation and UI testing.',
};

export const frameworkDescriptions: Record<string, string> = {
  // Web
  selenium: 'Most popular cross-browser automation tool — massive ecosystem and hiring market.',
  playwright: 'Modern cross-browser automation by Microsoft — auto-waits, fast, great debugging.',
  cypress: 'Developer-friendly with time-travel debugging and real-time reload.',
  webdriverio: 'Flexible WebDriver + DevTools runner with strong plugin ecosystem.',
  robotframework: 'Keyword-driven, plain-text test syntax — great for QA-first teams.',

  // Mobile
  appium: 'Cross-platform mobile automation for Android and iOS with a single API.',
  espresso: "Google's native Android UI testing framework — fast, reliable, first-party.",
  xcuitest: "Apple's native iOS UI testing framework using XCTest.",
  flutter: 'Official Flutter testing framework for Dart apps on iOS, Android, web.',

  // API
  restassured: 'Java DSL for REST API testing — fluent, readable, very popular.',
  requests: "Python's de-facto HTTP library — simple and reliable for API testing.",
  supertest: 'HTTP assertion library for Node.js — pairs well with Express/Koa apps.',
  restsharp: 'Simple REST/HTTP client for .NET — pairs well with NUnit/xUnit.',
  graphql: 'GraphQL-specific query and mutation testing with schema validation.',
  grpc: 'gRPC service testing with protobuf contract validation.',
  resty: 'Fast, feature-rich HTTP and REST client for Go.',

  // Desktop
  winappdriver: "Microsoft's Selenium-compatible driver for Windows desktop apps.",
  pyautogui: 'Cross-platform GUI automation via Python — works for any desktop app.',
};

export const languageDescriptions: Record<string, string> = {
  java: 'Enterprise standard — best for large teams, rich tooling and libraries.',
  kotlin: 'Modern JVM language — concise Java replacement with null safety.',
  python: 'Readable, fast to write — dominant in data, scripting, and QA.',
  javascript: 'Ubiquitous runtime language — pairs naturally with web front-ends.',
  typescript: 'Typed JavaScript — safer refactors and autocomplete, ideal for large codebases.',
  csharp: 'Microsoft ecosystem — best for .NET shops and Windows-first projects.',
  swift: 'Apple platforms — required for native iOS UI testing.',
  go: 'Simple, fast, compiled — great for API/performance test suites.',
  dart: 'Modern, typed language used by Flutter for cross-platform apps.',
};

export const testRunnerDescriptions: Record<string, string> = {
  junit5: 'Modern Java testing standard with parameterized tests and extensions.',
  testng: 'Java runner with powerful data providers, parallel exec, and suites.',
  pytest: "Python's most popular runner — minimal boilerplate and rich plugins.",
  jest: 'Fast, zero-config JavaScript/TypeScript runner with snapshots built in.',
  mocha: 'Flexible JS test framework — pair with Chai for assertions.',
  nunit: 'Leading .NET testing framework with solid IDE integration.',
  xctest: "Apple's first-party unit/UI testing framework for Swift.",
  cypress: "Cypress's own bundled runner — used only with Cypress tests.",
  robot: 'Keyword-driven runner used exclusively with Robot Framework.',
  'flutter-test': 'Built-in Flutter runner for widget and integration tests.',
  testify: "Go's most popular assertion and mocking toolkit.",
};

export const buildToolDescriptions: Record<string, string> = {
  maven: 'Battle-tested Java build tool with huge ecosystem and CI support.',
  gradle: 'Faster, more flexible JVM build tool — scripts in Groovy or Kotlin.',
  pip: "Python's standard package installer — simple requirements.txt workflow.",
  npm: 'Node.js standard — huge package registry and lock-file support.',
  nuget: '.NET package manager integrated with Visual Studio and dotnet CLI.',
  'dotnet-cli': '.NET CLI for building and testing C# projects without an IDE.',
  spm: "Apple's Swift Package Manager — integrated with Xcode.",
  pub: "Dart and Flutter's package manager and build tool.",
  mod: 'Go modules — built-in dependency management since Go 1.11.',
};

export const testingPatternDescriptions: Record<string, string> = {
  'page-object-model':
    'Wraps each page in a class with methods and locators — industry standard for maintainability.',
  pom: 'Wraps each page in a class with methods and locators — industry standard for maintainability.',
  bdd: 'Behavior-Driven Development — write tests as human-readable Given/When/Then scenarios.',
  fluent: 'Method-chained test steps that read like sentences for improved readability.',
  'data-driven': 'Parameterize the same test with many data sets via CSV/JSON/Excel inputs.',
  'contract-testing': 'Consumer-driven contracts (Pact) verify API compatibility across services.',
  'schema-validation': 'Validate response payloads against a JSON/XML/Avro schema definition.',
  'functional-patterns': 'Compose tests from small pure functions — minimal state.',
  'fluent-assertions': 'More readable, chainable assertions with great failure messages.',
  'integration-test': 'Test multiple components together — slower but higher confidence.',
  hybrid: 'Mix Page Object Model with data-driven or BDD patterns for flexibility.',
};
