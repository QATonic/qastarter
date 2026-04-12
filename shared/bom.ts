// Bill of Materials (BOM) for QAStarter
// Defines standard versions for all supported tools and libraries

export const BOM = {
  java: {
    version: '11',
    selenium: '4.16.0',
    testng: '7.8.0',
    junit5: '5.10.1',
    log4j: '2.22.0',
    extentreports: '5.1.1',
    allure: '2.25.0',
    cucumber: '7.15.0',
    appium: '9.0.0', // Java client
    restAssured: '5.3.0',
  },
  python: {
    version: '3.8+',
    selenium: '4.16.0',
    pytest: '8.0.0',
    requests: '2.31.0',
    appium: '3.1.0', // Python client
    pyautogui: '0.9.54',
  },
  javascript: {
    node: '18+',
    selenium: '4.16.0',
    jest: '29.7.0',
    mocha: '10.2.0',
    cypress: '13.6.0',
    playwright: '1.40.0',
    webdriverio: '8.24.0',
    appium: '9.0.0', // JS client
    supertest: '6.3.3',
  },
  csharp: {
    dotnet: '8.0',
    selenium: '4.16.0',
    nunit: '3.14.0',
    nunitTestAdapter: '4.5.0',
    testSdk: '17.8.0',
    restsharp: '110.2.0',
    appium: '5.0.0', // Dotnet client
  },
  kotlin: {
    kotlin: '1.9.22',
    espresso: '3.5.1',
    junit5: '5.10.1',
    gradle: '8.4',
    androidGradlePlugin: '8.2.0',
    allure: '2.25.0',
  },
  go: {
    version: '1.21+',
    playwrightGo: '0.4101.1',
    resty: '2.11.0',
    testify: '1.8.4',
  },
  dart: {
    dart: '3.2.0+',
    flutter: '3.16.0+',
  },
  swift: {
    swift: '5.9',
    xctest: 'latest', // Part of Xcode
  },
};

export type BOMType = typeof BOM;
