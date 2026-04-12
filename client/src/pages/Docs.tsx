import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  Terminal,
  BookOpen,
  Laptop,
  Smartphone,
  Globe,
  Server,
  AlertTriangle,
  Copy,
  Check,
  Cloud,
  FlaskConical,
  FileCode2,
  Layers,
  Gauge,
  TerminalSquare,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

function DocCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy:', err);
    }
  };
  return (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

export default function Docs() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              Documentation & Guides
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about generating, running, and maintaining your QA
              automation projects.
            </p>
          </section>

          {/* Quick Start Guide */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">How to Generate a Project</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: '1. Select Type', desc: 'Choose Web, Mobile, API, Desktop, or Performance testing.' },
                { title: '2. Choose Tech', desc: 'Pick your language, framework, and tools.' },
                { title: '3. Configure', desc: 'Set project name, cloud farms, test data, environments, and utilities.' },
                { title: '4. Download', desc: 'Get a production-ready ZIP file instantly.' },
              ].map((step, i) => (
                <Card key={i} className="relative overflow-hidden border-primary/20">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-4xl font-bold text-primary/20">
                    {i + 1}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* What's Included Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold">What&apos;s Included?</h2>
            </div>

            <Tabs defaultValue="web" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
                <TabsTrigger value="web" className="flex gap-2 py-3">
                  <Globe className="h-4 w-4" /> Web
                </TabsTrigger>
                <TabsTrigger value="mobile" className="flex gap-2 py-3">
                  <Smartphone className="h-4 w-4" /> Mobile
                </TabsTrigger>
                <TabsTrigger value="api" className="flex gap-2 py-3">
                  <Server className="h-4 w-4" /> API
                </TabsTrigger>
                <TabsTrigger value="desktop" className="flex gap-2 py-3">
                  <Laptop className="h-4 w-4" /> Desktop
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex gap-2 py-3">
                  <Gauge className="h-4 w-4" /> Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="web" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Web Automation (Selenium, Playwright, Cypress)</CardTitle>
                    <CardDescription>Complete browser automation infrastructure</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="grid md:grid-cols-2 gap-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Page Object Model (POM):</b> Structured pages and locators.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Driver Factory:</b> Thread-safe driver management.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Utility Helpers:</b> JSON reader, Excel reader, Screenshot capture.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Reporting:</b> Allure or ExtentReports integration.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Cloud Device Farm:</b> BrowserStack or Sauce Labs configuration for
                          cross-browser testing in the cloud.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Test Data (Faker):</b> Auto-generated test data factories using
                          DataFaker, Faker.js, Bogus, or language-native libraries.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mobile" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mobile Automation (Appium, Flutter, Espresso)</CardTitle>
                    <CardDescription>Native and Hybrid app testing framework</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="grid md:grid-cols-2 gap-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Appium Service:</b> Programmatic server start/stop.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Capabilities Manager:</b> Configurable Android/iOS profiles.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Page Objects:</b> MobileElement / Widget locators.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Gestures:</b> Swipe, tap, and scroll helpers.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Cloud Device Farm:</b> BrowserStack or Sauce Labs for real-device
                          testing at scale.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>API Automation (RestAssured, Resty, Supertest, RestSharp)</CardTitle>
                    <CardDescription>REST, GraphQL, and OpenAPI schema-driven testing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="grid md:grid-cols-2 gap-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Request Spec Builder:</b> Reusable headers and auth.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Schema Validation:</b> JSON/XML schema assertions.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>POJO Models:</b> Request/Response serialization.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Endpoints Class:</b> Centralized API route management.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>OpenAPI Schema-Driven:</b> Paste a Swagger/OpenAPI URL to auto-generate
                          endpoint-specific test stubs for every path and method.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Multi-Environment:</b> Configure dev/staging/prod environments with
                          separate base URLs and credentials.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="desktop" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Desktop Automation (WinAppDriver, PyAutoGUI)</CardTitle>
                    <CardDescription>Windows application testing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="grid md:grid-cols-2 gap-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Windows Driver:</b> WinAppDriver session management.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Screen Object Model:</b> Window and control mappings.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Process Management:</b> App launch and teardown helpers.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Testing (k6, Gatling, Locust)</CardTitle>
                    <CardDescription>Load, stress, and scalability testing frameworks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="grid md:grid-cols-2 gap-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>k6 (JavaScript):</b> Modern load testing with scripted scenarios,
                          thresholds, and built-in metrics.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Gatling (Java/Scala):</b> High-performance load testing with detailed
                          HTML reports and Scala DSL.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Locust (Python):</b> Distributed load testing with a Python-based user
                          behavior definition and web UI.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{' '}
                        <span>
                          <b>Pre-built Scenarios:</b> Ramp-up, spike, soak, and stress test patterns
                          included out of the box.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          {/* Running the Project */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <Terminal className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-bold">How to Run Your Project</h2>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Prerequisites</AlertTitle>
              <AlertDescription>
                Ensure you have the required runtime installed:
                <br />• <b>Java:</b> JDK 11+ & Maven/Gradle
                <br />• <b>JavaScript/TypeScript:</b> Node.js 16+
                <br />• <b>Python:</b> Python 3.8+
                <br />• <b>C#:</b> .NET 6.0+ SDK
                <br />• <b>Go:</b> Go 1.18+
              </AlertDescription>
            </Alert>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-medium">
                  Java (Maven/Gradle)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <DocCodeBlock
                    code={'# Install Dependencies\nmvn clean install\n\n# Run Tests\nmvn test'}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-medium">
                  JavaScript/TypeScript (npm)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <DocCodeBlock
                    code={'# Install Dependencies\nnpm install\n\n# Run Tests\nnpm test'}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-medium">Python (Pip)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <DocCodeBlock
                    code={
                      '# Install Dependencies\npip install -r requirements.txt\n\n# Run Tests\npytest'
                    }
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg font-medium">
                  C# (.NET)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <DocCodeBlock
                    code={
                      '# Restore Dependencies\ndotnet restore\n\n# Build Project\ndotnet build\n\n# Run Tests\ndotnet test'
                    }
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-lg font-medium">Go (Mod)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <DocCodeBlock
                    code={'# Install Dependencies\ngo mod download\n\n# Run Tests\ngo test ./...'}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger className="text-lg font-medium">
                  Performance (k6/Locust)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <DocCodeBlock
                    code={
                      '# k6 (JavaScript)\nk6 run scripts/load-test.js\n\n# Locust (Python)\nlocust -f locustfile.py --host=https://your-api.com\n\n# Gatling (Java)\nmvn gatling:test'
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Post Generation Checklist */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Post-Download Checklist</h2>
            </div>

            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-lg">Detailed Setup for 100% Success</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                      1
                    </span>
                    <div>
                      <span className="font-medium text-foreground">Update Configuration</span>
                      <p className="text-sm text-muted-foreground">
                        Check <code>src/test/resources/config.properties</code> or <code>.env</code>
                        . Update URLs, credentials, and browser settings to match your local
                        environment.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                      2
                    </span>
                    <div>
                      <span className="font-medium text-foreground">Browser Drivers</span>
                      <p className="text-sm text-muted-foreground">
                        Most templates use WebDriverManager or Selenium Manager (auto-download). If
                        you use a manual path, ensure your Chrome/Gecko driver matches your browser
                        version.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                      3
                    </span>
                    <div>
                      <span className="font-medium text-foreground">
                        Appium Server (Mobile Only)
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Ensure Appium is running locally (
                        <code>npm install -g appium && appium</code>) or update the server URL in
                        your config if using a cloud provider (BrowserStack/SauceLabs).
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
          {/* New Features Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <FileCode2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">New Features</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Cloud Device Farm */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-purple-500" />
                    Cloud Device Farm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Run your Web and Mobile tests on BrowserStack or Sauce Labs cloud infrastructure.
                    Select a cloud provider in the generator and your project will include:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Cloud-specific configuration files (browserstack.yml / saucelabs.yml)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      RemoteWebDriver setup for cloud execution
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Cloud SDK dependencies pre-configured
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Test Data (Faker) */}
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-emerald-500" />
                    Test Data (Faker)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enable the Faker utility to get a TestDataFactory class with realistic test data
                    generation. Supported libraries per language:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Java: DataFaker 2.x
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Python: Faker 22.x
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      JS/TS: @faker-js/faker 8.x
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      C#: Bogus 35.x / Go: gofakeit 6.x
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* OpenAPI Schema-Driven */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCode2 className="h-5 w-5 text-blue-500" />
                    OpenAPI Schema-Driven
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    For API testing, paste an OpenAPI 3.x or Swagger 2.0 spec URL and QAStarter will
                    auto-generate endpoint-specific test stubs:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Test methods for each path + HTTP method
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Request/response body validation stubs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      HTTPS-only URL validation with safety checks
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Multi-Environment Config */}
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5 text-orange-500" />
                    Multi-Environment Config
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Define multiple target environments (dev, staging, prod) with separate URLs and
                    credentials. Your generated project will include:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Per-environment configuration files
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Environment switcher via CLI flag or env variable
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      Up to 10 named environments supported
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CLI Tool Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <TerminalSquare className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">CLI Tool</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  QAStarter also provides a command-line interface for generating projects and keeping
                  dependencies up to date.
                </p>
                <DocCodeBlock
                  code={
                    '# Install the CLI globally\nnpm install -g qastarter\n\n# Generate a new project interactively\nqastarter new\n\n# Generate with options\nqastarter new --framework selenium --language java --cloud-farm browserstack\n\n# List available template packs\nqastarter list\n\n# Update project dependencies to latest BOM versions\nqastarter update\n\n# Dry-run to see what would change\nqastarter update --dry-run'
                  }
                />
                <p className="text-sm text-muted-foreground">
                  The <code>update</code> command detects your build file (pom.xml, package.json,
                  requirements.txt, build.gradle, .csproj, go.mod), compares dependency versions
                  against the QAStarter BOM, and offers to update them in-place.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
