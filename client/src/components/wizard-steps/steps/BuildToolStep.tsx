/**
 * Build Tool Step - Select the build tool
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Wrench } from 'lucide-react';
import WizardStep from '../../WizardStep';
import HelpTooltip from '../../HelpTooltip';
import { getHelpContent } from '@/lib/helpContent';
import { validationLabels } from '../../../../../shared/validationMatrix';
import { useWizard } from '../WizardContext';

export default function BuildToolStep() {
  const {
    config,
    updateConfig,
    handleNext,
    handlePrevious,
    currentStep,
    steps,
    getFilteredOptions,
  } = useWizard();
  const availableBuildTools = getFilteredOptions('buildTool');

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Build Tool"
      description="Select the build tool for managing dependencies"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-3">
        {!config.language && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Please select a programming language first to see compatible build tools.
            </span>
          </div>
        )}

        <RadioGroup
          value={config.buildTool}
          onValueChange={(value) => updateConfig('buildTool', value)}
          disabled={!config.language}
          className="grid gap-3"
        >
          {availableBuildTools.map((tool) => {
            const isSelected = config.buildTool === tool;
            return (
              <div
                key={tool}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${
                    isSelected
                      ? 'bg-primary/5 border-primary/30 shadow-sm'
                      : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                  }
                  ${!config.language ? 'opacity-50 pointer-events-none' : ''}
                `}
                onClick={() => config.language && updateConfig('buildTool', tool)}
              >
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}
                >
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value={tool}
                      id={tool}
                      data-testid={`radio-${tool}`}
                      className="sr-only"
                    />
                    <Label htmlFor={tool} className="text-sm font-medium cursor-pointer">
                      {
                        validationLabels.buildTools[
                          tool as keyof typeof validationLabels.buildTools
                        ]
                      }
                    </Label>
                    <HelpTooltip content={getHelpContent(tool)} />
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
