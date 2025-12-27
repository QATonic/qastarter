import handlebars from 'handlebars';
import { ProjectConfig } from '@shared/schema';
import { TemplatePackEngine } from './templatePackEngine';

export interface TemplateFile {
  path: string;
  content: string;
  isTemplate: boolean;
  mode?: string;
}

export class ProjectTemplateGenerator {
  private templatePackEngine: TemplatePackEngine;

  constructor() {
    this.templatePackEngine = new TemplatePackEngine();
    
    // Register required Handlebars helpers for fallback
    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    handlebars.registerHelper('or', (...args: any[]) => {
      const opts = args.pop();
      return args.some(Boolean);
    });
    handlebars.registerHelper('includes', (arr: any[], val: any) => Array.isArray(arr) && arr.includes(val));
  }

  public async generateProject(config: ProjectConfig): Promise<TemplateFile[]> {
    // Try to use sophisticated template pack first
    const hasTemplatePack = await this.templatePackEngine.hasTemplatePack(config);
    
    if (hasTemplatePack) {
      console.log('Using sophisticated template pack for:', {
        testingType: config.testingType,
        language: config.language,
        framework: config.framework,
        testRunner: config.testRunner,
        buildTool: config.buildTool
      });
      return await this.templatePackEngine.generateProject(config);
    } else {
      console.log('Template pack not found, falling back to simple generator for:', {
        testingType: config.testingType,
        language: config.language,
        framework: config.framework,
        testRunner: config.testRunner,
        buildTool: config.buildTool
      });
      return this.generateProjectFallback(config);
    }
  }

  public async getDependencies(config: ProjectConfig): Promise<Record<string, string>> {
    // Try to get dependencies from template pack manifest
    const hasTemplatePack = await this.templatePackEngine.hasTemplatePack(config);
    
    if (hasTemplatePack) {
      return await this.templatePackEngine.getDependencies(config);
    } else {
      // Return fallback dependencies if no template pack exists
      return this.getFallbackDependencies(config);
    }
  }

  private getFallbackDependencies(config: ProjectConfig): Record<string, string> {
    const dependencies: Record<string, string> = {};

    // Add language-specific dependencies
    switch (config.language) {
      case 'java':
        dependencies['java'] = '11+';
        if (config.framework === 'selenium') {
          dependencies['selenium'] = '4.16.0';
        }
        if (config.testRunner === 'testng') {
          dependencies['testng'] = '7.8.0';
        }
        if (config.testRunner === 'junit5') {
          dependencies['junit'] = '5.10.1';
        }
        break;

      case 'python':
        dependencies['python'] = '3.8+';
        if (config.framework === 'selenium') {
          dependencies['selenium'] = '4.16.0';
        }
        if (config.testRunner === 'pytest') {
          dependencies['pytest'] = '8.0.0';
        }
        break;

      case 'javascript':
      case 'typescript':
        dependencies['node'] = '16+';
        if (config.framework === 'selenium') {
          dependencies['selenium-webdriver'] = '4.16.0';
        }
        if (config.testRunner === 'jest') {
          dependencies['jest'] = '29.7.0';
        }
        break;

      case 'csharp':
        dependencies['.NET'] = '8.0+';
        if (config.framework === 'selenium') {
          dependencies['Selenium.WebDriver'] = '4.16.0';
        }
        if (config.testRunner === 'nunit') {
          dependencies['NUnit'] = '3.14.0';
        }
        break;
    }

    return dependencies;
  }

  private getBaseFiles(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [];

    // README.md
    files.push({
      path: 'README.md',
      content: this.getReadmeTemplate(),
      isTemplate: true
    });

    // .gitignore
    files.push({
      path: '.gitignore',
      content: this.getGitignoreTemplate(config),
      isTemplate: true
    });

    return files;
  }

  private getLanguageSpecificFiles(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [];

    switch (config.language) {
      case 'java':
        files.push(...this.getJavaFiles(config));
        break;
      case 'python':
        files.push(...this.getPythonFiles(config));
        break;
      case 'javascript':
      case 'typescript':
        files.push(...this.getJavaScriptFiles(config));
        break;
      case 'csharp':
        files.push(...this.getCSharpFiles(config));
        break;
      case 'swift':
        files.push(...this.getSwiftFiles(config));
        break;
    }

    return files;
  }

  private getJavaFiles(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [];

    if (config.buildTool === 'maven') {
      files.push({
        path: 'pom.xml',
        content: this.getMavenPomTemplate(),
        isTemplate: true
      });
    } else if (config.buildTool === 'gradle') {
      files.push({
        path: 'build.gradle',
        content: this.getGradleBuildTemplate(),
        isTemplate: true
      });
    }

    // Test files
    files.push({
      path: 'src/test/java/{{packageName}}/tests/SampleTest.java',
      content: this.getJavaTestTemplate(),
      isTemplate: true
    });

    // Base page class for POM
    if (config.testingPattern === 'page-object-model') {
      files.push({
        path: 'src/main/java/{{packageName}}/pages/BasePage.java',
        content: this.getJavaBasePageTemplate(),
        isTemplate: true
      });
    }

    // Configuration classes
    files.push({
      path: 'src/main/java/{{packageName}}/config/TestConfig.java',
      content: this.getJavaConfigTemplate(),
      isTemplate: true
    });

    return files;
  }

  private getPythonFiles(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [];

    files.push({
      path: 'requirements.txt',
      content: this.getPythonRequirementsTemplate(),
      isTemplate: true
    });

    files.push({
      path: 'tests/test_sample.py',
      content: this.getPythonTestTemplate(),
      isTemplate: true
    });

    if (config.testingPattern === 'page-object-model') {
      files.push({
        path: 'pages/base_page.py',
        content: this.getPythonBasePageTemplate(),
        isTemplate: true
      });
    }

    files.push({
      path: 'config/test_config.py',
      content: this.getPythonConfigTemplate(),
      isTemplate: true
    });

    return files;
  }

  private getJavaScriptFiles(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [];

    files.push({
      path: 'package.json',
      content: this.getPackageJsonTemplate(),
      isTemplate: true
    });

    files.push({
      path: 'tests/sample.test.js',
      content: this.getJavaScriptTestTemplate(),
      isTemplate: true
    });

    if (config.testingPattern === 'page-object-model') {
      files.push({
        path: 'pages/BasePage.js',
        content: this.getJavaScriptBasePageTemplate(),
        isTemplate: true
      });
    }

    return files;
  }

  private getCSharpFiles(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [];

    files.push({
      path: `{{projectName}}.csproj`,
      content: this.getCSharpProjectTemplate(),
      isTemplate: true
    });

    files.push({
      path: 'Tests/SampleTest.cs',
      content: this.getCSharpTestTemplate(),
      isTemplate: true
    });

    return files;
  }

  private getCICDFiles(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [];

    if (!config.cicdTool) {
      return files;
    }

    switch (config.cicdTool) {
      case 'github-actions':
        files.push({
          path: '.github/workflows/test.yml',
          content: this.getGitHubActionsTemplate(),
          isTemplate: true
        });
        break;
      case 'azure-devops':
        files.push({
          path: 'azure-pipelines.yml',
          content: this.getAzurePipelinesTemplate(),
          isTemplate: true
        });
        break;
      case 'jenkins':
        files.push({
          path: 'Jenkinsfile',
          content: this.getJenkinsfileTemplate(),
          isTemplate: true
        });
        break;
    }

    return files;
  }

  private getSwiftFiles(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [];

    files.push({
      path: 'Package.swift',
      content: this.getSwiftPackageTemplate(),
      isTemplate: true
    });

    files.push({
      path: 'Tests/{{projectName}}Tests/SampleTests.swift',
      content: this.getSwiftTestTemplate(),
      isTemplate: true
    });

    return files;
  }

  private generateProjectFallback(config: ProjectConfig): TemplateFile[] {
    const files: TemplateFile[] = [
      ...this.getBaseFiles(config),
      ...this.getLanguageSpecificFiles(config),
      ...this.getCICDFiles(config)
    ];

    // Process templates
    return files.map(file => {
      if (file.isTemplate) {
        try {
          // For CI/CD workflow files, mask GitHub Actions expressions before Handlebars compilation
          const isWorkflowFile = file.path.includes('.github/workflows/') || file.path.includes('azure-pipelines.yml');
          let content = file.content;
          
          if (isWorkflowFile) {
            // Mask GitHub Actions and Azure DevOps expressions
            const GHA_OPEN = '%%GHA_OPEN%%';
            const GHA_CLOSE = '%%GHA_CLOSE%%';
            const AZURE_VAR = '%%AZURE_VAR%%';
            
            // Replace GitHub Actions and Azure DevOps expressions (with optional backslash before $)
            content = content
              .replace(/(?:\\)?\$\{\{([\s\S]*?)\}\}/g, (_, inner) => `${GHA_OPEN}${inner}${GHA_CLOSE}`)
              .replace(/(?:\\)?\$\(([\s\S]*?)\)/g, (_, inner) => `${AZURE_VAR}${inner}%%END_AZURE%%`);
          }

          // Helper function to sanitize paths and prevent traversal attacks
          const sanitizePath = (path: string): string => {
            return path
              .replace(/\.\./g, '') // Remove .. sequences
              .replace(/^\/+/, '') // Remove leading slashes
              .replace(/[^a-zA-Z0-9._/-]/g, '_'); // Replace unsafe characters with underscore
          };

          const template = handlebars.compile(content);
          let processedContent = template({
            ...config,
            groupId: sanitizePath(config.groupId || 'com.example'),
            artifactId: sanitizePath(config.artifactId || config.projectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')),
            packageName: sanitizePath(config.groupId ? config.groupId.replace(/\./g, '/') : 'com/example'),
            packagePath: sanitizePath(config.groupId ? config.groupId.replace(/\./g, '/') : 'com/example')
          });

          // Unmask GitHub Actions and Azure DevOps expressions after rendering
          if (isWorkflowFile) {
            processedContent = processedContent.replaceAll('%%GHA_OPEN%%', '${{').replaceAll('%%GHA_CLOSE%%', '}}');
            processedContent = processedContent.replaceAll('%%AZURE_VAR%%', '$(').replaceAll('%%END_AZURE%%', ')');
          }

          // Process path template
          const pathTemplate = handlebars.compile(file.path);
          const processedPath = sanitizePath(pathTemplate({
            ...config,
            groupId: sanitizePath(config.groupId ? config.groupId.replace(/\./g, '/') : 'com/example')
          }));

          return {
            ...file,
            path: processedPath,
            content: processedContent
          };
        } catch (error) {
          console.error(`Template compilation failed for file: ${file.path}`, error);
          throw error;
        }
      }
      return file;
    });
  }

  // Template methods
  private getReadmeTemplate(): string {
    return `# {{projectName}}

This QA automation project was generated by QAStarter.

## Configuration
- **Testing Type**: {{testingType}}
- **Language**: {{language}}
- **Framework**: {{framework}}
- **Test Runner**: {{testRunner}}
- **Build Tool**: {{buildTool}}

## Getting Started

### Prerequisites
{{#if (eq language "java")}}
- Java 11 or higher
- {{buildTool}}
{{/if}}
{{#if (eq language "python")}}
- Python 3.8 or higher
- pip
{{/if}}
{{#if (or (eq language "javascript") (eq language "typescript"))}}
- Node.js 16 or higher
- npm
{{/if}}

### Installation
{{#if (eq buildTool "maven")}}
\`\`\`bash
mvn clean install
\`\`\`
{{/if}}
{{#if (eq buildTool "gradle")}}
\`\`\`bash
./gradlew build
\`\`\`
{{/if}}
{{#if (eq buildTool "npm")}}
\`\`\`bash
npm install
\`\`\`
{{/if}}
{{#if (eq buildTool "pip")}}
\`\`\`bash
pip install -r requirements.txt
\`\`\`
{{/if}}

### Running Tests
{{#if (eq buildTool "maven")}}
\`\`\`bash
mvn test
\`\`\`
{{/if}}
{{#if (eq buildTool "gradle")}}
\`\`\`bash
./gradlew test
\`\`\`
{{/if}}
{{#if (eq buildTool "npm")}}
\`\`\`bash
npm test
\`\`\`
{{/if}}
{{#if (eq buildTool "pip")}}
\`\`\`bash
pytest
\`\`\`
{{/if}}

## Project Structure
- \`src/test\` - Test files
- \`src/main\` - Source code and utilities
- \`config\` - Configuration files

## Generated by QAStarter
Visit [QAStarter](https://qaStarter.replit.app) to generate more QA automation projects.
`;
  }

  private getGitignoreTemplate(config: ProjectConfig): string {
    let gitignore = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# IDE files
.idea/
.vscode/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

`;

    if (config.language === 'java') {
      gitignore += `# Java
*.class
*.jar
*.war
*.ear
target/
*.iml

`;
    }

    if (config.language === 'python') {
      gitignore += `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt

`;
    }

    if (config.language === 'javascript' || config.language === 'typescript') {
      gitignore += `# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

`;
    }

    return gitignore;
  }

  private getMavenPomTemplate(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>{{groupId}}</groupId>
    <artifactId>{{artifactId}}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>{{projectName}}</name>
    <description>QA Automation project generated by QAStarter</description>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        {{#if (eq framework "selenium")}}
        <selenium.version>4.16.0</selenium.version>
        {{/if}}
        {{#if (eq testRunner "testng")}}
        <testng.version>7.8.0</testng.version>
        {{/if}}
        {{#if (eq testRunner "junit5")}}
        <junit.version>5.10.1</junit.version>
        {{/if}}
    </properties>

    <dependencies>
        {{#if (eq framework "selenium")}}
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>\${selenium.version}</version>
        </dependency>
        {{/if}}
        {{#if (eq testRunner "testng")}}
        <dependency>
            <groupId>org.testng</groupId>
            <artifactId>testng</artifactId>
            <version>\${testng.version}</version>
        </dependency>
        {{/if}}
        {{#if (eq testRunner "junit5")}}
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>\${junit.version}</version>
        </dependency>
        {{/if}}
        {{#if (eq reportingTool "extent-reports")}}
        <dependency>
            <groupId>com.aventstack</groupId>
            <artifactId>extentreports</artifactId>
            <version>5.0.9</version>
        </dependency>
        {{/if}}
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>2.20.0</version>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-slf4j-impl</artifactId>
            <version>2.20.0</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
            
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.1.2</version>
            </plugin>
        </plugins>
    </build>
</project>`;
  }

  private getJavaTestTemplate(): string {
    return `package {{groupId}}.tests;

{{#if (eq framework "selenium")}}
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;
import {{groupId}}.config.TestConfig;
{{/if}}
{{#if (eq testRunner "testng")}}
import org.testng.annotations.*;
import org.testng.Assert;
{{/if}}
{{#if (eq testRunner "junit5")}}
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Assertions;
{{/if}}

public class SampleTest {
    {{#if (eq framework "selenium")}}
    private WebDriver driver;
    private WebDriverWait wait;
    {{/if}}

    {{#if (eq testRunner "testng")}}
    @BeforeMethod
    {{/if}}
    {{#if (eq testRunner "junit5")}}
    @BeforeEach
    {{/if}}
    public void setUp() {
        {{#if (eq framework "selenium")}}
        driver = TestConfig.createDriver(TestConfig.getBrowser());
        wait = new WebDriverWait(driver, Duration.ofSeconds(TestConfig.getTimeout()));
        {{/if}}
    }

    {{#if (eq testRunner "testng")}}
    @Test
    {{/if}}
    {{#if (eq testRunner "junit5")}}
    @Test
    {{/if}}
    public void testPageTitle() {
        {{#if (eq framework "selenium")}}
        driver.get(TestConfig.getBaseUrl());
        String title = driver.getTitle();
        {{#if (eq testRunner "testng")}}
        Assert.assertNotNull(title, "Page title should not be null");
        Assert.assertTrue(title.contains("Example"), "Title should contain 'Example'");
        {{/if}}
        {{#if (eq testRunner "junit5")}}
        Assertions.assertNotNull(title, "Page title should not be null");
        Assertions.assertTrue(title.contains("Example"), "Title should contain 'Example'");
        {{/if}}
        {{else}}
        // Add your test logic here
        {{#if (eq testRunner "testng")}}
        Assert.assertTrue(true, "Sample test passed");
        {{/if}}
        {{#if (eq testRunner "junit5")}}
        Assertions.assertTrue(true, "Sample test passed");
        {{/if}}
        {{/if}}
    }

    {{#if (eq testRunner "testng")}}
    @AfterMethod
    {{/if}}
    {{#if (eq testRunner "junit5")}}
    @AfterEach
    {{/if}}
    public void tearDown() {
        {{#if (eq framework "selenium")}}
        if (driver != null) {
            driver.quit();
        }
        {{/if}}
    }
}`;
  }

  private getJavaBasePageTemplate(): string {
    return `package {{groupId}}.pages;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

public abstract class BasePage {
    protected WebDriver driver;
    protected WebDriverWait wait;

    public BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public String getTitle() {
        return driver.getTitle();
    }

    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    protected void clickElement(WebElement element) {
        wait.until(ExpectedConditions.elementToBeClickable(element));
        element.click();
    }

    protected void sendKeysToElement(WebElement element, String text) {
        wait.until(ExpectedConditions.visibilityOf(element));
        element.clear();
        element.sendKeys(text);
    }

    protected boolean isElementDisplayed(WebElement element) {
        try {
            return wait.until(ExpectedConditions.visibilityOf(element)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}`;
  }

  private getJavaConfigTemplate(): string {
    return `package {{groupId}}.config;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

public class TestConfig {
    public static final String BASE_URL = "https://example.com";
    public static final int TIMEOUT = 10;
    public static final String DEFAULT_BROWSER = "chrome";
    
    public static WebDriver createDriver(String browserName) {
        WebDriver driver;
        
        switch (browserName.toLowerCase()) {
            case "chrome":
                ChromeOptions chromeOptions = new ChromeOptions();
                chromeOptions.addArguments("--headless");
                chromeOptions.addArguments("--no-sandbox");
                chromeOptions.addArguments("--disable-dev-shm-usage");
                chromeOptions.addArguments("--disable-extensions");
                chromeOptions.addArguments("--disable-gpu");
                driver = new ChromeDriver(chromeOptions);
                break;
                
            case "firefox":
                FirefoxOptions firefoxOptions = new FirefoxOptions();
                firefoxOptions.addArguments("--headless");
                driver = new FirefoxDriver(firefoxOptions);
                break;
                
            default:
                throw new IllegalArgumentException("Browser not supported: " + browserName);
        }
        
        driver.manage().window().maximize();
        return driver;
    }
    
    public static String getBaseUrl() {
        return System.getProperty("base.url", BASE_URL);
    }
    
    public static int getTimeout() {
        return Integer.parseInt(System.getProperty("timeout", String.valueOf(TIMEOUT)));
    }
    
    public static String getBrowser() {
        return System.getProperty("browser", DEFAULT_BROWSER);
    }
}`;
  }

  private getPythonRequirementsTemplate(): string {
    return `{{#if (eq framework "selenium")}}
selenium==4.16.0
{{/if}}
{{#if (eq framework "playwright")}}
playwright==1.41.0
{{/if}}
{{#if (eq framework "requests")}}
requests==2.31.0
{{/if}}
{{#if (eq testRunner "pytest")}}
pytest==8.0.0
pytest-html==4.1.1
{{/if}}
{{#if (eq reportingTool "allure")}}
allure-pytest==2.13.2
{{/if}}
# Common testing utilities
pyyaml==6.0.1
python-dotenv==1.0.0`;
  }

  private getPythonTestTemplate(): string {
    return `import pytest
{{#if (eq framework "selenium")}}
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
{{/if}}

class TestSample:
    {{#if (eq framework "selenium")}}
    def setup_method(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-gpu")
        
        # Selenium Manager automatically handles driver management (Selenium 4+)
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.maximize_window()
        self.wait = WebDriverWait(self.driver, 10)

    def teardown_method(self):
        if hasattr(self, 'driver'):
            self.driver.quit()
    {{/if}}

    def test_page_title(self):
        {{#if (eq framework "selenium")}}
        self.driver.get("https://example.com")
        title = self.driver.title
        assert title is not None, "Page title should not be None"
        assert "Example" in title, "Title should contain 'Example'"
        {{else}}
        # Add your test logic here
        assert True, "Sample test passed"
        {{/if}}

    {{#if (eq framework "selenium")}}
    def test_page_elements(self):
        self.driver.get("https://example.com")
        # Wait for page to load
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        
        # Example of finding elements
        body = self.driver.find_element(By.TAG_NAME, "body")
        assert body.is_displayed(), "Body element should be visible"
    {{/if}}`;
  }

  private getPythonBasePageTemplate(): string {
    return `from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def get_title(self):
        return self.driver.title

    def get_current_url(self):
        return self.driver.current_url

    def wait_for_element(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))`;
  }

  private getPythonConfigTemplate(): string {
    return `class TestConfig:
    BASE_URL = "https://example.com"
    TIMEOUT = 10
    BROWSER = "chrome"
    
    # Add your configuration properties here`;
  }

  private getPackageJsonTemplate(): string {
    return `{
  "name": "{{projectName}}",
  "version": "1.0.0",
  "description": "QA Automation project generated by QAStarter",
  "main": "index.js",
  "scripts": {
    {{#if (eq testRunner "jest")}}
    "test": "jest",
    {{/if}}
    {{#if (eq testRunner "mocha")}}
    "test": "mocha tests/**/*.test.js",
    {{/if}}
    "test:watch": "npm test -- --watch"
  },
  "dependencies": {
    {{#if (eq framework "selenium")}}
    "selenium-webdriver": "^4.16.0",
    {{/if}}
    {{#if (eq framework "playwright")}}
    "playwright": "^1.41.0",
    {{/if}}
    {{#if (eq framework "cypress")}}
    "cypress": "^13.6.0",
    {{/if}}
    {{#if (eq testRunner "jest")}}
    "jest": "^29.7.0",
    {{/if}}
    {{#if (eq testRunner "mocha")}}
    "mocha": "^10.2.0",
    "chai": "^4.3.10",
    {{/if}}
    {{#if utilities.logger}}
    "winston": "^3.11.0"
    {{/if}}
  },
  "devDependencies": {
    {{#if (eq language "typescript")}}
    "typescript": "^5.2.2",
    "@types/node": "^20.8.0"
    {{/if}}
  }
}`;
  }

  private getJavaScriptTestTemplate(): string {
    return `{{#if (includes testingTool "Selenium")}}
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
{{/if}}
{{#if (eq testRunner "Jest")}}
describe('Sample Test Suite', () => {
{{/if}}
{{#if (eq testRunner "Mocha")}}
const { expect } = require('chai');

describe('Sample Test Suite', function() {
{{/if}}
    {{#if (includes testingTool "Selenium")}}
    let driver;

    {{#if (eq testRunner "Jest")}}
    beforeEach(async () => {
    {{/if}}
    {{#if (eq testRunner "Mocha")}}
    beforeEach(async function() {
    {{/if}}
        const options = new chrome.Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    {{#if (eq testRunner "Jest")}}
    afterEach(async () => {
    {{/if}}
    {{#if (eq testRunner "Mocha")}}
    afterEach(async function() {
    {{/if}}
        if (driver) {
            await driver.quit();
        }
    });
    {{/if}}

    {{#if (eq testRunner "Jest")}}
    test('should pass sample test', async () => {
    {{/if}}
    {{#if (eq testRunner "Mocha")}}
    it('should pass sample test', async function() {
    {{/if}}
        {{#if (includes testingTool "Selenium")}}
        await driver.get('https://example.com');
        const title = await driver.getTitle();
        {{#if (eq testRunner "Jest")}}
        expect(title).toBeTruthy();
        {{/if}}
        {{#if (eq testRunner "Mocha")}}
        expect(title).to.not.be.empty;
        {{/if}}
        {{else}}
        // Add your test logic here
        {{#if (eq testRunner "Jest")}}
        expect(true).toBe(true);
        {{/if}}
        {{#if (eq testRunner "Mocha")}}
        expect(true).to.be.true;
        {{/if}}
        {{/if}}
    });
});`;
  }

  private getJavaScriptBasePageTemplate(): string {
    return `class BasePage {
    constructor(driver) {
        this.driver = driver;
    }

    async getTitle() {
        return await this.driver.getTitle();
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }

    async waitForElement(locator, timeout = 10000) {
        return await this.driver.wait(until.elementLocated(locator), timeout);
    }
}

module.exports = BasePage;`;
  }

  private getCSharpProjectTemplate(): string {
    return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    {{#if (includes testingTool "Selenium")}}
    <PackageReference Include="Selenium.WebDriver" Version="4.16.0" />
    {{/if}}
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="NUnit" Version="3.14.0" />
    <PackageReference Include="NUnit3TestAdapter" Version="4.5.0" />
    <PackageReference Include="NUnit.Analyzers" Version="3.10.0" />
    <PackageReference Include="coverlet.collector" Version="6.0.0" />
  </ItemGroup>

</Project>`;
  }

  private getCSharpTestTemplate(): string {
    return `using NUnit.Framework;
{{#if (includes testingTool "Selenium")}}
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
{{/if}}

namespace {{projectName}}.Tests
{
    [TestFixture]
    public class SampleTest
    {
        {{#if (includes testingTool "Selenium")}}
        private IWebDriver driver;

        [SetUp]
        public void Setup()
        {
            var options = new ChromeOptions();
            options.AddArguments("--headless");
            options.AddArguments("--no-sandbox");
            options.AddArguments("--disable-dev-shm-usage");
            driver = new ChromeDriver(options);
        }

        [TearDown]
        public void TearDown()
        {
            driver?.Quit();
        }
        {{/if}}

        [Test]
        public void SampleTest_ShouldPass()
        {
            {{#if (includes testingTool "Selenium")}}
            driver.Navigate().GoToUrl("https://example.com");
            var title = driver.Title;
            Assert.That(title, Is.Not.Null.And.Not.Empty);
            {{else}}
            // Add your test logic here
            Assert.That(true, Is.True);
            {{/if}}
        }
    }
}`;
  }

  private getGitHubActionsTemplate(): string {
    return `name: QA Automation Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    {{#if (eq language "Java")}}
    - name: Set up JDK 11
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'

    - name: Cache Maven packages
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: \${{ runner.os }}-m2-\${{ hashFiles('**/pom.xml') }}
        restore-keys: \${{ runner.os }}-m2

    {{#if (eq buildTool "Maven")}}
    - name: Run tests with Maven
      run: mvn clean test
    {{/if}}
    {{#if (eq buildTool "Gradle")}}
    - name: Make gradlew executable
      run: chmod +x ./gradlew
    - name: Run tests with Gradle
      run: ./gradlew test
    {{/if}}
    {{/if}}

    {{#if (eq language "Python")}}
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: Run tests with pytest
      run: pytest
    {{/if}}

    {{#if (or (eq language "JavaScript") (eq language "TypeScript"))}}
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test
    {{/if}}

    {{#if (eq language "C#")}}
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 6.0.x

    - name: Restore dependencies
      run: dotnet restore

    - name: Build
      run: dotnet build --no-restore

    - name: Test
      run: dotnet test --no-build --verbosity normal
    {{/if}}`;
  }

  private getAzurePipelinesTemplate(): string {
    return `trigger:
- main
- develop

pool:
  vmImage: ubuntu-latest

{{#if (eq language "Java")}}
variables:
  MAVEN_CACHE_FOLDER: \$(Pipeline.Workspace)/.m2/repository
  MAVEN_OPTS: '-Dmaven.repo.local=\$(MAVEN_CACHE_FOLDER)'

steps:
- task: JavaToolInstaller@0
  inputs:
    versionSpec: '11'
    jdkArchitectureOption: 'x64'
    jdkSourceOption: 'PreInstalled'

- task: Cache@2
  inputs:
    key: 'maven | "\$(Agent.OS)" | **/pom.xml'
    restoreKeys: |
      maven | "\$(Agent.OS)"
      maven
    path: \$(MAVEN_CACHE_FOLDER)
  displayName: Cache Maven local repo

{{#if (eq buildTool "Maven")}}
- task: Maven@3
  inputs:
    mavenPomFile: 'pom.xml'
    goals: 'clean test'
    options: '-B'
{{/if}}
{{/if}}

{{#if (eq language "Python")}}
steps:
- task: UsePythonVersion@0
  inputs:
    versionSpec: '3.9'
    addToPath: true

- script: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt
  displayName: 'Install dependencies'

- script: |
    pytest
  displayName: 'Run tests'
{{/if}}`;
  }

  private getJenkinsfileTemplate(): string {
    return `pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        {{#if (eq language "Java")}}
        stage('Build') {
            steps {
                {{#if (eq buildTool "Maven")}}
                sh 'mvn clean compile'
                {{/if}}
                {{#if (eq buildTool "Gradle")}}
                sh './gradlew clean build'
                {{/if}}
            }
        }

        stage('Test') {
            steps {
                {{#if (eq buildTool "Maven")}}
                sh 'mvn test'
                {{/if}}
                {{#if (eq buildTool "Gradle")}}
                sh './gradlew test'
                {{/if}}
            }
            post {
                always {
                    {{#if (eq buildTool "Maven")}}
                    publishTestResults 'target/surefire-reports/*.xml'
                    {{/if}}
                    {{#if (eq buildTool "Gradle")}}
                    publishTestResults 'build/test-results/test/*.xml'
                    {{/if}}
                }
            }
        }
        {{/if}}

        {{#if (eq language "Python")}}
        stage('Setup') {
            steps {
                sh 'pip install -r requirements.txt'
            }
        }

        stage('Test') {
            steps {
                sh 'pytest --junitxml=test-results.xml'
            }
            post {
                always {
                    publishTestResults 'test-results.xml'
                }
            }
        }
        {{/if}}
    }

    post {
        always {
            cleanWs()
        }
    }
}`;
  }

  private getGradleBuildTemplate(): string {
    return `plugins {
    id 'java'
    {{#if (eq testRunner "junit5")}}
    id 'jacoco'
    {{/if}}
}

group = '{{groupId}}'
version = '1.0.0'
sourceCompatibility = '11'

repositories {
    mavenCentral()
}

dependencies {
    {{#if (includes testingTool "Selenium")}}
    implementation 'org.seleniumhq.selenium:selenium-java:4.16.0'
    {{/if}}
    
    {{#if (eq testRunner "TestNG")}}
    testImplementation 'org.testng:testng:7.8.0'
    {{/if}}
    
    {{#if (eq testRunner "junit5")}}
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
    {{/if}}
    
    {{#if (includes reporting "Extent Reports")}}
    implementation 'com.aventstack:extentreports:5.1.1'
    {{/if}}
    
    {{#if utilities.logger}}
    implementation 'org.apache.logging.log4j:log4j-core:2.22.0'
    {{/if}}
}

{{#if (eq testRunner "junit5")}}
test {
    useJUnitPlatform()
    
    testLogging {
        events "passed", "skipped", "failed"
    }
}

jacoco {
    toolVersion = "0.8.8"
}

jacocoTestReport {
    reports {
        xml.required = false
        csv.required = false
        html.outputLocation = layout.buildDirectory.dir('jacocoHtml')
    }
}
{{/if}}

{{#if (eq testRunner "TestNG")}}
test {
    useTestNG()
    
    testLogging {
        events "passed", "skipped", "failed"
    }
}
{{/if}}`;
  }

  private getSwiftPackageTemplate(): string {
    return `// swift-tools-version:5.7
import PackageDescription

let package = Package(
    name: "{{projectName}}",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "{{projectName}}",
            targets: ["{{projectName}}"]),
    ],
    dependencies: [
        {{#if (eq framework "xcuitest")}}
        .package(url: "https://github.com/apple/swift-testing", from: "0.4.0")
        {{/if}}
    ],
    targets: [
        .target(
            name: "{{projectName}}",
            dependencies: []),
        .testTarget(
            name: "{{projectName}}Tests",
            dependencies: ["{{projectName}}"])
    ]
)`;
  }

  private getSwiftTestTemplate(): string {
    return `import XCTest
@testable import {{projectName}}

final class SampleTests: XCTestCase {

    func testExample() throws {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        XCTAssertTrue(true, "Sample test passed")
    }
}`;
  }

  // Helper method for template conditions
  private includes(array: string[], item: string): boolean {
    return array.includes(item);
  }
}

// Register Handlebars helpers
handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

handlebars.registerHelper('includes', function(array: any[], item: string) {
  return Array.isArray(array) && array.includes(item);
});

handlebars.registerHelper('or', function(...args: any[]) {
  // Remove the last argument which is the options object
  const values = args.slice(0, -1);
  return values.some(Boolean);
});