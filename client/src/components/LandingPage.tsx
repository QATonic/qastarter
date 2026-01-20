import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Download,
  Code2,
  Globe,
  Smartphone,
  Server,
  Monitor,
  Play,
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LandingPageProps {
  onStartGeneration: () => void;
}

const YOUTUBE_VIDEO_ID = 'YYEBwX9oqas';

export default function LandingPage({ onStartGeneration }: LandingPageProps) {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      {/* Demo Video Modal */}
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>QAStarter Demo - Generate a Selenium Java Project</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black">
            {demoOpen && (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
                title="QAStarter Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="border-0"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-foreground leading-[1.1] tracking-tight text-balance">
              Free QA Automation
              <span className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent block mt-2">
                Framework Generator
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed text-balance">
              Create production-ready test automation frameworks instantly. Selenium, Playwright,
              Cypress, Robot Framework, Appium, RestAssured with Page Object Model, BDD, Contract
              Testing, and complete CI/CD integration.
            </p>

            {/* Trust badges - simplified */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-10">
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">No signup required</span>
              </div>
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Instant download</span>
              </div>
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">100% free</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Button
                size="lg"
                onClick={onStartGeneration}
                data-testid="button-start-generation"
                className="gap-2.5 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-primary/25 transition-all duration-200 border-0 h-auto"
              >
                <Code2 className="h-5 w-5" />
                Start Generating
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setDemoOpen(true)}
                data-testid="button-view-demo"
                className="gap-2.5 font-semibold px-8 py-6 text-lg transition-all duration-200 h-auto"
              >
                <Play className="h-5 w-5" />
                View Demo
              </Button>
            </div>

            {/* Quick Stats - cleaner design */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center p-6 rounded-xl bg-card border border-border/50 shadow-sm">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">16</div>
                <div className="text-sm font-medium text-foreground">Frameworks</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Selenium, Playwright, Robot Framework
                </div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card border border-border/50 shadow-sm">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">6</div>
                <div className="text-sm font-medium text-foreground">Languages</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Java, Python, Kotlin, TypeScript
                </div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card border border-border/50 shadow-sm">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  2<span className="text-xl font-normal text-muted-foreground ml-1">min</span>
                </div>
                <div className="text-sm font-medium text-foreground">Setup Time</div>
                <div className="text-xs text-muted-foreground mt-1">Download & start coding</div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto">
            <Card className="group border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-visible">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-5 mx-auto">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generate complete project structures in seconds. No more hours of manual setup.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-visible">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="flex items-center justify-center w-14 h-14 bg-green-500/10 rounded-xl mb-5 mx-auto">
                  <Shield className="h-7 w-7 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Production Ready</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Best practices built-in with secure dependencies and proper configurations.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-visible">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="flex items-center justify-center w-14 h-14 bg-violet-500/10 rounded-xl mb-5 mx-auto">
                  <Download className="h-7 w-7 text-violet-600 dark:text-violet-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Instant Download</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Download your customized project as a ZIP file. No account required.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Supported Technologies */}
          <div className="mt-24 lg:mt-32 text-center">
            <p className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">
              Comprehensive Technology Support
            </p>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground text-balance">
              43+ Production-Ready Templates
            </h2>

            <p className="text-base md:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Web, Mobile, API, and Desktop automation with Page Object Model, BDD, Contract
              Testing, CI/CD pipelines, and Docker support.
            </p>

            {/* Enhanced Technology Categories */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {/* Testing Frameworks */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Testing Frameworks
                  </h3>
                </div>
                <div className="space-y-3">
                  {['Selenium', 'Playwright', 'Cypress', 'Robot Framework', 'Appium'].map(
                    (tech) => (
                      <div
                        key={tech}
                        className="group flex items-center space-x-3 p-3 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300 hover-elevate"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform duration-300" />
                        <span className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors">
                          {tech}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Programming Languages */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Languages
                  </h3>
                </div>
                <div className="space-y-3">
                  {['Java', 'Python', 'Kotlin', 'JavaScript', 'TypeScript', 'C#'].map((tech) => (
                    <div
                      key={tech}
                      className="group flex items-center space-x-3 p-3 rounded-lg bg-green-500/5 dark:bg-green-500/10 border border-green-500/10 hover:border-green-500/20 transition-all duration-300 hover-elevate"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-125 transition-transform duration-300" />
                      <span className="text-sm font-medium text-foreground group-hover:text-green-600 transition-colors">
                        {tech}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Runners */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Test Runners
                  </h3>
                </div>
                <div className="space-y-3">
                  {['TestNG', 'JUnit', 'Pytest', 'Jest', 'Mocha'].map((tech) => (
                    <div
                      key={tech}
                      className="group flex items-center space-x-3 p-3 rounded-lg bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 hover:border-purple-500/20 transition-all duration-300 hover-elevate"
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-500 group-hover:scale-125 transition-transform duration-300" />
                      <span className="text-sm font-medium text-foreground group-hover:text-purple-600 transition-colors">
                        {tech}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Build Tools & CI/CD */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Build & CI/CD
                  </h3>
                </div>
                <div className="space-y-3">
                  {['Maven', 'Gradle', 'npm', 'GitHub Actions', 'Jenkins'].map((tech) => (
                    <div
                      key={tech}
                      className="group flex items-center space-x-3 p-3 rounded-lg bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10 hover:border-orange-500/20 transition-all duration-300 hover-elevate"
                    >
                      <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:scale-125 transition-transform duration-300" />
                      <span className="text-sm font-medium text-foreground group-hover:text-orange-600 transition-colors">
                        {tech}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Use Cases Section - SEO Optimized */}
            <div className="mt-32 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Test Automation Solutions for{' '}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Every Testing Need
                </span>
              </h2>

              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                Generate complete automation frameworks for web, mobile, API, and desktop testing
                with industry best practices
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                <Card className="hover-elevate">
                  <CardContent className="pt-8 pb-8">
                    <Globe className="h-12 w-12 text-blue-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold mb-2">Web Testing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selenium, Playwright, Cypress, Robot Framework, WebdriverIO with cross-browser
                      testing support
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>✓ Page Object Model</div>
                      <div>✓ BDD Cucumber Integration</div>
                      <div>✓ Parallel Test Execution</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardContent className="pt-8 pb-8">
                    <Smartphone className="h-12 w-12 text-green-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold mb-2">Mobile Testing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Appium for Android & iOS, Espresso, XCUITest frameworks with device cloud
                      integration
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>✓ Native & Hybrid Apps</div>
                      <div>✓ Real Device Testing</div>
                      <div>✓ Screenshot Capture</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardContent className="pt-8 pb-8">
                    <Server className="h-12 w-12 text-purple-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold mb-2">API Testing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      RestAssured, Supertest, GraphQL, gRPC with Contract Testing and Schema
                      Validation
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>✓ Contract Testing (Pact)</div>
                      <div>✓ JSON/XML Validation</div>
                      <div>✓ Authentication Support</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardContent className="pt-8 pb-8">
                    <Monitor className="h-12 w-12 text-orange-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold mb-2">Desktop Testing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      WinAppDriver, PyAutoGUI for Windows desktop application automation and UI
                      testing
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>✓ Windows Applications</div>
                      <div>✓ UI Automation</div>
                      <div>✓ Screen Recording</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ Section - Compact */}
            <div className="mt-24">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  Quick answers about QAStarter
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="what-is" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline py-3">
                      <span className="text-sm font-medium">What is QAStarter?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      A free QA automation framework generator supporting Selenium, Playwright,
                      Cypress, Robot Framework, Appium across Java, Python, Kotlin, JavaScript,
                      TypeScript, and C#. No signup required.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="frameworks" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline py-3">
                      <span className="text-sm font-medium">Which frameworks are supported?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      43+ templates: Web (Selenium, Playwright, Cypress, Robot Framework), Mobile
                      (Appium, Espresso with Kotlin), API (RestAssured, Supertest, GraphQL, gRPC),
                      and Desktop (WinAppDriver) with POM, BDD, and Docker support.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="free" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline py-3">
                      <span className="text-sm font-medium">Is it free to use?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      Yes, 100% free with no signup. Configure your project and download a complete,
                      production-ready framework as a ZIP file.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="includes" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline py-3">
                      <span className="text-sm font-medium">
                        What's included in generated projects?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      Page Object Model setup, sample tests, test runner config, build tools, CI/CD
                      pipelines (GitHub Actions, Jenkins), and reporting integration (Allure,
                      ExtentReports).
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cicd" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline py-3">
                      <span className="text-sm font-medium">Does it support CI/CD?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      Yes, includes pre-configured pipelines for GitHub Actions, GitLab CI, Azure
                      DevOps, CircleCI, and Jenkins with parallel testing support.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
