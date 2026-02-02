import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, FileText, ArrowRight, RefreshCw, Copy, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WizardConfig } from '@/components/wizard-steps/types';

interface SuccessViewProps {
  config: WizardConfig;
  onGenerateAnother: () => void;
}

interface CommandStep {
  label: string;
  command?: string;
}

export default function SuccessView({ config, onGenerateAnother }: SuccessViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getCommands = (): CommandStep[] => {
    const steps: CommandStep[] = [];

    // Step 1: Unzip
    steps.push({ label: 'Unzip the downloaded file' });

    // Step 2: Open Terminal
    steps.push({ label: 'Open terminal in project directory' });

    // Step 3 & 4: Install & Run
    const { language, buildTool } = config;
    const lang = language.toLowerCase();
    const build = buildTool.toLowerCase();

    if (lang === 'typescript' || lang === 'javascript') {
      steps.push({ label: 'Install dependencies', command: 'npm install' });

      if (build === 'vite' || build === 'next.js') {
        steps.push({ label: 'Start development server', command: 'npm run dev' });
      } else {
        steps.push({ label: 'Run tests', command: 'npx playwright test' });
      }
    } else if (lang === 'java') {
      if (build === 'maven') {
        steps.push({ label: 'Install dependencies', command: 'mvn clean install' });
        steps.push({ label: 'Run tests', command: 'mvn test' });
      } else if (build === 'gradle') {
        steps.push({ label: 'Install dependencies', command: './gradlew build' });
        steps.push({ label: 'Run tests', command: './gradlew test' });
      }
    } else if (lang === 'python') {
      steps.push({ label: 'Install dependencies', command: 'pip install -r requirements.txt' });
      steps.push({ label: 'Run tests', command: 'pytest' });
    } else if (lang === 'c#') {
      steps.push({ label: 'Restore dependencies', command: 'dotnet restore' });
      steps.push({ label: 'Run tests', command: 'dotnet test' });
    } else {
      // Fallback
      steps.push({ label: 'Check README.md for instructions' });
    }

    return steps;
  };

  const steps = getCommands();

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="w-full max-w-xl"
      >
        <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-xl ring-1 ring-border/40 overflow-hidden relative">
          {/* Confetti-like accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-violet-500 to-blue-500" />

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
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600 dark:to-violet-400">
                Project Ready!
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                <span className="font-semibold text-foreground/90">{config.projectName}</span> has been generated.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8">
            <div className="bg-muted/30 rounded-xl p-5 border border-border/50 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground mb-4">
                <Terminal className="w-4 h-4" /> Quick Start
              </h3>
              <ul className="space-y-3">
                {steps.map((step, idx) => (
                  <li key={idx} className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
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
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(step.command!, idx)}
                          title="Copy command"
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

          <CardFooter className="pb-8 px-8">
            <Button
              onClick={onGenerateAnother}
              className="w-full gap-2 text-md font-medium h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 text-white shadow-lg shadow-purple-500/20 transition-all rounded-xl border-0"
              size="lg"
            >
              <RefreshCw className="w-4 h-4" /> Generate Another Project
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
