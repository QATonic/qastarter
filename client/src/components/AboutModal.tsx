import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Heart, Zap, Shield, Download } from 'lucide-react';
import QAStarterLogo from './QAStarterLogo';

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <QAStarterLogo className="h-16 w-auto" />
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">QAStarter</DialogTitle>
              <DialogDescription className="text-base">
                Your testing foundation, fully implemented projects, ready to run.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overview Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Overview
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              QAStarter is a free, web-based application designed to simplify the setup of QA
              automation projects. Similar to Spring Initializr but tailored for quality assurance
              engineers, it provides a wizard-based interface for configuring and generating
              complete, production-ready QA automation projects with full source code.
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Key Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Multiple Frameworks</div>
                  <div className="text-xs text-muted-foreground">
                    Selenium, Playwright, Cypress, Appium, Flutter, Resty
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Language Support</div>
                  <div className="text-xs text-muted-foreground">
                    Java, Python, JS/TS, C#, Go, Dart
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Testing Patterns</div>
                  <div className="text-xs text-muted-foreground">
                    POM, BDD, Hybrid, Contract Testing, Fluent
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">CI/CD Ready</div>
                  <div className="text-xs text-muted-foreground">
                    GitHub Actions, Azure DevOps, Jenkins
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              How to Use
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>Configure your testing preferences using the step-by-step wizard</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>Select your testing framework, language, and build tools</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Choose CI/CD pipelines, reporting tools, and utility libraries</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  4
                </span>
                <span>Generate and download your customized project template</span>
              </li>
            </ol>
          </div>

          {/* Creator Info */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <h4 className="font-semibold">Created by QATonic Innovations</h4>
            </div>
          </div>

          {/* Enhanced Mission Statement */}
          <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold">Our Mission</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Empowering QA engineers worldwide with professional-grade automation tools. We believe
              quality assurance should be accessible, efficient, and enjoyable for everyone.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">46+</div>
                <div className="text-xs text-muted-foreground">Templates</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-xs text-muted-foreground">Free</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
