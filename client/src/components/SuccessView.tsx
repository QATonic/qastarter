import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  FileText,
  RefreshCw,
  Copy,
  Terminal,
  MonitorSmartphone,
  Lightbulb,
  ChevronDown,
  Github,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { WizardConfig } from '@/components/wizard-steps/types';
import GitHubPushDialog from '@/components/GitHubPushDialog';

interface SuccessViewProps {
  config: WizardConfig;
  onGenerateAnother: () => void;
}

interface CommandStep {
  label: string;
  command?: string;
}

interface IDERecommendation {
  name: string;
  extensions: string[];
}

export default function SuccessView({ config, onGenerateAnother }: SuccessViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showIDE, setShowIDE] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
    setCopiedIndex(index);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getCommands = (): CommandStep[] => {
    const steps: CommandStep[] = [];

    // Step 1: Unzip
    steps.push({ label: 'Unzip the downloaded file' });

    // Step 2: Open Terminal
    steps.push({ label: 'Open terminal in project directory' });

    // Step 3 & 4: Install & Run
    const { language, buildTool, framework } = config;
    const lang = language.toLowerCase();
    const build = buildTool.toLowerCase();
    const fw = framework.toLowerCase();

    if (lang === 'typescript' || lang === 'javascript') {
      steps.push({ label: 'Install dependencies', command: 'npm install' });

      if (fw === 'playwright') {
        steps.push({ label: 'Install browsers', command: 'npx playwright install' });
        steps.push({ label: 'Run tests', command: 'npx playwright test' });
      } else if (fw === 'cypress') {
        steps.push({ label: 'Open Cypress', command: 'npx cypress open' });
      } else if (fw === 'webdriverio') {
        steps.push({ label: 'Run tests', command: 'npx wdio run wdio.conf.ts' });
      } else {
        steps.push({ label: 'Run tests', command: 'npm test' });
      }
    } else if (lang === 'java') {
      if (build === 'maven') {
        steps.push({ label: 'Install dependencies', command: 'mvn clean install -DskipTests' });
        steps.push({ label: 'Run tests', command: 'mvn test' });
      } else if (build === 'gradle') {
        steps.push({ label: 'Install dependencies', command: './gradlew build -x test' });
        steps.push({ label: 'Run tests', command: './gradlew test' });
      }
    } else if (lang === 'python') {
      steps.push({
        label: 'Create virtual environment',
        command: 'python -m venv venv && source venv/bin/activate',
      });
      steps.push({ label: 'Install dependencies', command: 'pip install -r requirements.txt' });
      if (fw === 'robotframework') {
        steps.push({ label: 'Run tests', command: 'robot tests/' });
      } else {
        steps.push({ label: 'Run tests', command: 'pytest' });
      }
    } else if (lang === 'csharp' || lang === 'c#') {
      steps.push({ label: 'Restore dependencies', command: 'dotnet restore' });
      steps.push({ label: 'Build project', command: 'dotnet build' });
      steps.push({ label: 'Run tests', command: 'dotnet test' });
    } else if (lang === 'go') {
      steps.push({ label: 'Download modules', command: 'go mod download' });
      steps.push({ label: 'Run tests', command: 'go test ./...' });
    } else if (lang === 'kotlin') {
      if (build === 'gradle') {
        steps.push({ label: 'Build project', command: './gradlew build -x test' });
        steps.push({ label: 'Run tests', command: './gradlew test' });
      } else {
        steps.push({ label: 'Build project', command: 'mvn clean install -DskipTests' });
        steps.push({ label: 'Run tests', command: 'mvn test' });
      }
    } else if (lang === 'dart') {
      steps.push({ label: 'Install dependencies', command: 'flutter pub get' });
      steps.push({ label: 'Run tests', command: 'flutter test' });
    } else if (lang === 'swift') {
      steps.push({ label: 'Build project', command: 'swift build' });
      steps.push({ label: 'Run tests', command: 'swift test' });
    } else {
      // Fallback
      steps.push({ label: 'Check README.md for instructions' });
    }

    return steps;
  };

  const getIDERecommendation = (): IDERecommendation => {
    const lang = config.language.toLowerCase();
    const fw = config.framework.toLowerCase();

    if (lang === 'java' || lang === 'kotlin') {
      return {
        name: 'IntelliJ IDEA',
        extensions: [
          'File > Open > select project folder',
          'Enable auto-import for Maven/Gradle',
          fw === 'playwright' ? 'Install "Test Automation" plugin' : '',
          'Install "Allure" plugin for test reports',
        ].filter(Boolean),
      };
    }

    if (lang === 'csharp' || lang === 'c#') {
      return {
        name: 'Visual Studio / VS Code',
        extensions: [
          'C# Dev Kit extension',
          'NuGet Package Manager extension',
          '.NET Core Test Explorer extension',
          fw === 'playwright' ? 'Playwright Test for VSCode' : '',
        ].filter(Boolean),
      };
    }

    if (lang === 'python') {
      return {
        name: 'VS Code',
        extensions: [
          'Python extension (ms-python.python)',
          'Pylance for IntelliSense',
          fw === 'robotframework' ? 'Robot Framework Language Server' : '',
          fw === 'playwright' ? 'Playwright Test for VSCode' : '',
          'Python Test Explorer extension',
        ].filter(Boolean),
      };
    }

    if (lang === 'swift') {
      return {
        name: 'Xcode',
        extensions: [
          'Open the .xcodeproj or Package.swift',
          'Use Product > Test (Cmd+U) to run tests',
          'Enable test navigator (Cmd+6)',
        ],
      };
    }

    if (lang === 'go') {
      return {
        name: 'VS Code / GoLand',
        extensions: ['Go extension (golang.go)', 'Go Test Explorer', 'Delve debugger'],
      };
    }

    if (lang === 'dart') {
      return {
        name: 'VS Code / Android Studio',
        extensions: [
          'Flutter extension',
          'Dart extension',
          'Flutter Widget Inspector',
          'Flutter Intl (for localization)',
        ],
      };
    }

    // JS/TS default
    return {
      name: 'VS Code',
      extensions: [
        fw === 'playwright' ? 'Playwright Test for VSCode' : '',
        fw === 'cypress'
          ? 'Cypress Helper extension'
          : '',
        'ESLint extension',
        'Prettier extension',
        fw === 'webdriverio' ? 'WebdriverIO snippets' : '',
        'Test Explorer UI extension',
      ].filter(Boolean),
    };
  };

  const getEnvironmentChecks = (): CommandStep[] => {
    const lang = config.language.toLowerCase();
    const checks: CommandStep[] = [];

    if (lang === 'java' || lang === 'kotlin') {
      checks.push({ label: 'Verify Java', command: 'java --version' });
      if (config.buildTool.toLowerCase() === 'maven') {
        checks.push({ label: 'Verify Maven', command: 'mvn --version' });
      } else {
        checks.push({ label: 'Verify Gradle', command: 'gradle --version' });
      }
    } else if (lang === 'python') {
      checks.push({ label: 'Verify Python', command: 'python --version' });
      checks.push({ label: 'Verify pip', command: 'pip --version' });
    } else if (lang === 'typescript' || lang === 'javascript') {
      checks.push({ label: 'Verify Node.js', command: 'node --version' });
      checks.push({ label: 'Verify npm', command: 'npm --version' });
    } else if (lang === 'csharp' || lang === 'c#') {
      checks.push({ label: 'Verify .NET', command: 'dotnet --version' });
    } else if (lang === 'go') {
      checks.push({ label: 'Verify Go', command: 'go version' });
    } else if (lang === 'dart') {
      checks.push({ label: 'Verify Flutter', command: 'flutter --version' });
    } else if (lang === 'swift') {
      checks.push({ label: 'Verify Swift', command: 'swift --version' });
    }

    // Browser check for web testing
    if (config.testingType === 'web') {
      checks.push({ label: 'Verify browser installed', command: 'google-chrome --version' });
    }

    return checks;
  };

  const getTroubleshootingTips = (): string[] => {
    const lang = config.language.toLowerCase();
    const fw = config.framework.toLowerCase();
    const tips: string[] = [];

    // Universal tips
    tips.push('Make sure all prerequisites (runtime, build tool, browser) are installed before running tests.');

    if (lang === 'java' || lang === 'kotlin') {
      tips.push('If Maven/Gradle build fails, check that JAVA_HOME is set correctly.');
      tips.push('For Gradle wrapper issues, run: chmod +x gradlew (macOS/Linux).');
    }

    if (lang === 'python') {
      tips.push('Use a virtual environment (venv) to avoid dependency conflicts.');
      tips.push("If pip install fails, try: pip install --upgrade pip");
    }

    if (lang === 'typescript' || lang === 'javascript') {
      tips.push('If npm install fails, try deleting node_modules and package-lock.json, then run npm install again.');
    }

    if (fw === 'selenium' || fw === 'appium') {
      tips.push('Ensure the browser driver version matches your installed browser version.');
    }

    if (fw === 'playwright') {
      tips.push('Run "npx playwright install" to download required browsers.');
    }

    if (fw === 'appium') {
      tips.push('Start Appium server before running mobile tests: npx appium');
      tips.push('For Android, ensure ANDROID_HOME is set and an emulator is running.');
    }

    if (config.testingType === 'desktop') {
      tips.push('WinAppDriver requires Windows Developer Mode enabled.');
    }

    // Cloud Device Farm tips
    if (config.cloudDeviceFarm === 'browserstack') {
      tips.push('Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables before running tests.');
      tips.push('Update browserstack.yml with your desired browser/OS combinations.');
    }
    if (config.cloudDeviceFarm === 'saucelabs') {
      tips.push('Set SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables before running tests.');
      tips.push('Update saucelabs.yml with your desired platform configurations.');
    }

    // Faker test data tips
    if (config.utilities?.faker) {
      tips.push('The TestDataFactory class provides realistic test data. Import and use it in your tests for dynamic data generation.');
    }

    // OpenAPI tips
    if (config.openApiSpecUrl) {
      tips.push('OpenAPI-generated test stubs are in the tests directory. Review and customize assertions for your specific API responses.');
    }

    tips.push('Check the README.md in your generated project for framework-specific setup details.');

    return tips;
  };

  const steps = getCommands();
  const ide = getIDERecommendation();
  const envChecks = getEnvironmentChecks();
  const tips = getTroubleshootingTips();

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="w-full max-w-xl"
      >
        <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-xl ring-1 ring-border/40 overflow-hidden relative">
          {/* Confetti-like accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          <CardHeader className="text-center space-y-4 pb-4 pt-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto bg-primary/10 rounded-full p-4 w-fit shadow-inner ring-1 ring-primary/20"
            >
              <CheckCircle2 className="w-14 h-14 text-primary drop-shadow-sm" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
                Project Ready!
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                <span className="font-semibold text-foreground/90">{config.projectName}</span> has
                been generated.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-8">
            {/* Quick Start Commands */}
            <div className="bg-muted/30 rounded-xl p-5 border border-border/50 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground mb-4">
                <Terminal className="w-4 h-4" /> Quick Start
              </h3>
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {copiedIndex !== null ? 'Command copied to clipboard' : ''}
              </div>
              <ul className="space-y-3">
                {steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border font-mono text-xs text-muted-foreground shadow-sm">
                        {idx + 1}
                      </span>
                      <span className="text-foreground/80 truncate">{step.label}</span>
                    </div>

                    {step.command && (
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0 pl-9 sm:pl-0">
                        <code className="relative flex-1 sm:flex-none font-mono text-xs bg-background/80 px-3 py-1.5 rounded-md border border-border/60 text-primary min-w-[140px] flex items-center justify-between group-hover:border-primary/30 transition-colors">
                          {step.command}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(step.command!, idx)}
                          aria-label={
                            copiedIndex === idx ? 'Copied' : `Copy command: ${step.command}`
                          }
                        >
                          {copiedIndex === idx ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* IDE Setup (collapsible) */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowIDE(!showIDE)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/30 transition-colors"
                aria-expanded={showIDE}
              >
                <span className="flex items-center gap-2">
                  <MonitorSmartphone className="w-4 h-4" /> IDE Setup
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showIDE ? 'rotate-180' : ''}`}
                />
              </button>
              {showIDE && (
                <div className="px-5 pb-4 space-y-3 border-t border-border/30">
                  <p className="text-sm text-foreground/80 pt-3">
                    Recommended: <span className="font-semibold">{ide.name}</span>
                  </p>
                  <ul className="space-y-1.5">
                    {ide.extensions.map((ext, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{ext}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Environment verification */}
                  {envChecks.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Verify your environment:
                      </p>
                      <div className="space-y-1.5">
                        {envChecks.map((check, idx) => (
                          <div
                            key={idx}
                            className="group flex items-center gap-2 text-xs"
                          >
                            <code className="font-mono bg-background/80 px-2 py-1 rounded border border-border/60 text-primary">
                              {check.command}
                            </code>
                            {check.command && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() =>
                                  copyToClipboard(check.command!, 100 + idx)
                                }
                                aria-label={`Copy: ${check.command}`}
                              >
                                {copiedIndex === 100 + idx ? (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-muted-foreground" />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Troubleshooting (collapsible) */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/30 transition-colors"
                aria-expanded={showTroubleshooting}
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Troubleshooting Tips
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showTroubleshooting ? 'rotate-180' : ''}`}
                />
              </button>
              {showTroubleshooting && (
                <div className="px-5 pb-4 border-t border-border/30">
                  <ul className="space-y-2 pt-3">
                    {tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-6 pt-2">
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                Read Documentation
              </a>
            </div>
          </CardContent>

          <CardFooter className="pb-8 px-8 flex-col gap-3">
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => setShowGitHubDialog(true)}
                variant="outline"
                className="flex-1 gap-2 text-md font-medium h-12 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
                size="lg"
              >
                <Github className="w-4 h-4" /> Push to GitHub
              </Button>
              <Button
                onClick={onGenerateAnother}
                className="flex-1 gap-2 text-md font-medium h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all rounded-xl border-0"
                size="lg"
              >
                <RefreshCw className="w-4 h-4" /> Generate Another
              </Button>
            </div>
          </CardFooter>
        </Card>

        <GitHubPushDialog
          open={showGitHubDialog}
          onOpenChange={setShowGitHubDialog}
          config={config}
        />
      </motion.div>
    </div>
  );
}
