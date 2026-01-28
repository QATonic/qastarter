/**
 * Testing Pattern Step - Select the testing architecture pattern
 */

import React from 'react';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Layers, FileText, Database, FileJson2 } from 'lucide-react';
import WizardStep from '../../WizardStep';
import HelpTooltip from '../../HelpTooltip';
import { getHelpContent } from '@/lib/helpContent';
import { validationLabels } from '../../../../../shared/validationMatrix';
import { useWizard } from '../WizardContext';

const patternIcons: Record<string, React.ElementType> = {
  'page-object-model': Layers,
  pom: Layers,
  bdd: FileText,
  'data-driven': Database,
  fluent: Layers,
  'functional-patterns': Layers,
  'contract-testing': FileJson2,
  'fluent-assertions': Layers,
  'integration-test': Layers,
};

export default function TestingPatternStep() {
  const {
    config,
    updateConfig,
    handleNext,
    handlePrevious,
    currentStep,
    steps,
    getFilteredOptions,
  } = useWizard();
  const availablePatterns = getFilteredOptions('testingPattern');

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Testing Pattern"
      description="Choose your testing architecture pattern"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-3">
        {!config.framework && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Please select a testing framework first to see compatible patterns.
            </span>
          </div>
        )}

        <RadioGroup
          value={config.testingPattern}
          onValueChange={(value) => updateConfig('testingPattern', value)}
          disabled={!config.framework}
          className="grid gap-3"
        >
          {availablePatterns.map((pattern) => {
            const Icon = patternIcons[pattern] || Layers;
            const isSelected = config.testingPattern === pattern;
            const label =
              validationLabels.testingPatterns[
              pattern as keyof typeof validationLabels.testingPatterns
              ] || pattern;

            return (
              <div
                key={pattern}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${isSelected
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                  }
                  ${!config.framework ? 'opacity-50 pointer-events-none' : ''}
                `}
                onClick={() => config.framework && updateConfig('testingPattern', pattern)}
              >
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value={pattern}
                      id={pattern}
                      data-testid={`radio-${pattern}`}
                      className="sr-only"
                    />
                    <Label htmlFor={pattern} className="text-sm font-medium cursor-pointer">
                      {label}
                    </Label>
                    <HelpTooltip content={getHelpContent(pattern)} />
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </WizardStep>
  );
}
