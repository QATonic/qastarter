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
  Globe,
  Smartphone,
  Server,
  Monitor,
  Play,
  Github,
  Star,
  FileCode2,
  ScrollText,
  Rocket,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { validationMatrix } from '@shared/validationMatrix';

const YOUTUBE_VIDEO_ID = 'YYEBwX9oqas';
const GITHUB_REPO_URL = 'https://github.com/QATonic/qastarter';

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Derive live stats from the validation matrix instead of hardcoding
  const { frameworkCount, languageCount } = useMemo(() => {
    const allFrameworks = new Set<string>();
    const allLanguages = new Set<string>();
    for (const frameworks of Object.values(validationMatrix.frameworks)) {
      for (const fw of frameworks) allFrameworks.add(fw);
    }
    for (const languages of Object.values(validationMatrix.languages)) {
      for (const lang of languages) allLanguages.add(lang);
    }
    return { frameworkCount: allFrameworks.size, languageCount: allLanguages.size };
  }, []);

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
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?origin=${window.location.origin}`}
                referrerPolicy="origin"
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
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-500/15 to-cyan-500/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl motion-safe:animate-pulse"></div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-foreground leading-[1.1] tracking-tight text-balance">
              Free QA Automation
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent block mt-2">
                Framework Generator
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed text-balance">
              Get fully implemented, production-ready test automation frameworks instantly. Includes
              source code for Selenium, Playwright, Cypress, Robot, Appium, Flutter, RestAssured,
              Resty with POM, BDD, and valid CI/CD pipelines.
            </p>

            {/* Trust badges - simplified */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-10">
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">No signup required</span>
              </div>
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">Instant download</span>
              </div>
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">100% free</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                size="lg"
                onClick={() => setLocation('/express')}
                data-testid="button-start-generation"
                className="gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-emerald-500/25 transition-all duration-200 border-0 h-auto hover:scale-[1.02]"
              >
                <Rocket className="h-5 w-5" />
                Launch Generator
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
                Watch 60-sec Demo
              </Button>
            </div>

            {/* Trust Strip: credibility signals */}
            <div className="mb-20 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                data-testid="trust-github"
              >
                <Github className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Open Source</span>
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-muted-foreground">on GitHub</span>
              </a>
              <div
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground"
                data-testid="trust-templates"
              >
                <FileCode2 className="h-3.5 w-3.5 text-primary" />
                <span>{frameworkCount * 2}+ Template Packs</span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground"
                data-testid="trust-license"
              >
                <ScrollText className="h-3.5 w-3.5 text-primary" />
                <span>MIT Licensed</span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground"
                data-testid="trust-privacy"
              >
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>No Tracking, No Signup</span>
              </div>
            </div>

            {/* Quick Stats - cleaner design */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center p-6 rounded-xl bg-card border border-border/50 shadow-sm">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {frameworkCount}
                </div>
                <div className="text-sm font-medium text-foreground">Frameworks</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Selenium, Playwright, Robot, Flutter
                </div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card border border-border/50 shadow-sm">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {languageCount}
                </div>
                <div className="text-sm font-medium text-foreground">Languages</div>
                <div className="text-xs text-muted-foreground mt-1">Java, Python, TS, Go, Dart</div>
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
                  Get fully functional projects with source code in seconds. Skip the setup and
                  start coding tests immediately.
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
                  Includes Page Objects, Helper Utilities, and working sample tests. Best practices
                  built-in.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-visible">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="flex items-center justify-center w-14 h-14 bg-cyan-500/10 rounded-xl mb-5 mx-auto">
                  <Download className="h-7 w-7 text-cyan-600 dark:text-cyan-500" />
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
              46+ Production-Ready Templates
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
                  {['Selenium', 'Playwright', 'Cypress', 'Appium', 'Flutter', 'Resty'].map(
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
                  {['Java', 'Python', 'Kotlin', 'TypeScript', 'Go', 'Dart'].map((tech) => (
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
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Test Runners
                  </h3>
                </div>
                <div className="space-y-3">
                  {['TestNG', 'JUnit', 'Pytest', 'Jest', 'Testify', 'Flutter Test'].map((tech) => (
                    <div
                      key={tech}
                      className="group flex items-center space-x-3 p-3 rounded-lg bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 transition-all duration-300 hover-elevate"
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500 group-hover:scale-125 transition-transform duration-300" />
                      <span className="text-sm font-medium text-foreground group-hover:text-rose-600 transition-colors">
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
                  {['Maven', 'Gradle', 'npm', 'Go Mod', 'Pub', 'GitHub Actions'].map((tech) => (
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
                <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
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
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Page Object Model
                      </div>
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        BDD Cucumber Integration
                      </div>
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Parallel Test Execution
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardContent className="pt-8 pb-8">
                    <Smartphone className="h-12 w-12 text-green-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold mb-2">Mobile Testing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Appium, Flutter, Espresso, XCUITest frameworks with device cloud integration
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Native &amp; Hybrid Apps
                      </div>
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Real Device Testing
                      </div>
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Screenshot Capture
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardContent className="pt-8 pb-8">
                    <Server className="h-12 w-12 text-rose-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold mb-2">API Testing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      RestAssured, Resty (Go), Supertest, GraphQL, gRPC with Contract Testing
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Contract Testing (Pact)
                      </div>
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        JSON/XML Validation
                      </div>
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Authentication Support
                      </div>
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
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Windows Applications
                      </div>
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        UI Automation
                      </div>
                      <div>
                        <CheckCircle
                          className="inline h-3 w-3 text-green-500 mr-1"
                          aria-hidden="true"
                        />
                        Screen Recording
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ Section - Compact */}
            <section className="mt-24" aria-label="Frequently Asked Questions">
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
                      Cypress, Robot Framework, Appium, Flutter across Java, Python, Go, Dart,
                      TypeScript, and C#. No signup required.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="frameworks" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline py-3">
                      <span className="text-sm font-medium">Which frameworks are supported?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      46+ templates: Web (Selenium, Playwright, Cypress), Mobile (Appium, Espresso,
                      Flutter), API (RestAssured, Resty, Supertest), and Desktop (WinAppDriver) with
                      POM, BDD, and Docker support.
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
                        What&apos;s included in generated projects?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      Complete source code with Page Object Model implementation, working sample
                      tests, configured runners, reusable utilities, CI/CD pipelines, and reporting
                      integration.
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
            </section>

            {/* Final CTA Band */}
            <div className="mt-24 mb-12">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 px-6 py-12 md:px-12 md:py-16 text-center">
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-balance">
                    Ready in 30 seconds.{' '}
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                      No signup. No tracking.
                    </span>
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Pick a stack, click Generate, start writing tests. That&apos;s it.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      size="lg"
                      onClick={() => setLocation('/express')}
                      data-testid="button-bottom-cta"
                      className="gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-emerald-500/25 transition-all duration-200 border-0 h-auto hover:scale-[1.02]"
                    >
                      <Rocket className="h-5 w-5" />
                      Launch Generator
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <a
                      href={GITHUB_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      Star us on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
