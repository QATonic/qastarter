/**
 * Test Runner Step - Select the test runner
 */

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, TestTube } from "lucide-react";
import WizardStep from "../../WizardStep";
import HelpTooltip from "../../HelpTooltip";
import { getHelpContent } from "@/lib/helpContent";
import { validationLabels } from "../../../../../shared/validationMatrix";
import { useWizard } from "../WizardContext";

export default function TestRunnerStep() {
  const { config, updateConfig, handleNext, handlePrevious, currentStep, steps, getFilteredOptions } = useWizard();
  const availableTestRunners = getFilteredOptions('testRunner');

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Test Runner"
      description="Select the test runner for executing your tests"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-3">
        {!config.language && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Please select a programming language first to see compatible test runners.
            </span>
          </div>
        )}
        
        <RadioGroup
          value={config.testRunner}
          onValueChange={(value) => updateConfig("testRunner", value)}
          disabled={!config.language}
          className="grid gap-3"
        >
          {availableTestRunners.map((runner) => {
            const isSelected = config.testRunner === runner;
            return (
              <div 
                key={runner} 
                className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${isSelected 
                    ? 'bg-primary/5 border-primary/30 shadow-sm' 
                    : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                  }
                  ${!config.language ? 'opacity-50 pointer-events-none' : ''}
                `}
                onClick={() => config.language && updateConfig("testRunner", runner)}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}>
                  <TestTube className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem 
                      value={runner} 
                      id={runner}
                      data-testid={`radio-${runner}`}
                      className="sr-only"
                    />
                    <Label htmlFor={runner} className="text-sm font-medium cursor-pointer">
                      {validationLabels.testRunners[runner as keyof typeof validationLabels.testRunners]}
                    </Label>
                    <HelpTooltip content={getHelpContent(runner)} />
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </WizardStep>
  );
}
