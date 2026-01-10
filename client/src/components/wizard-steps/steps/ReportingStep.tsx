/**
 * Reporting Step - Select reporting tool (optional)
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, BarChart3 } from 'lucide-react';
import WizardStep from '../../WizardStep';
import HelpTooltip from '../../HelpTooltip';
import { getHelpContent } from '@/lib/helpContent';
import { validationLabels } from '../../../../../shared/validationMatrix';
import { useWizard } from '../WizardContext';

export default function ReportingStep() {
  const {
    config,
    updateConfig,
    handleNext,
    handlePrevious,
    currentStep,
    steps,
    getFilteredOptions,
  } = useWizard();
  const availableReportingTools = getFilteredOptions('reportingTool');

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Reporting Tool"
      description="Select a reporting tool for test results (optional)"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-3">
        <RadioGroup
          value={config.reportingTool}
          onValueChange={(value) => updateConfig('reportingTool', value)}
          className="grid gap-3"
        >
          {/* None option */}
          <div
            className={`
              flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
              ${!config.reportingTool
                ? 'bg-primary/5 border-primary/30 shadow-sm'
                : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
              }
            `}
            onClick={() => updateConfig('reportingTool', '')}
          >
            <div
              className={`
              flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
              ${!config.reportingTool ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
            `}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="" id="reporting-none" className="sr-only" />
                <Label htmlFor="reporting-none" className="text-sm font-medium cursor-pointer">
                  Default Reports Only
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Use built-in test runner reports</p>
            </div>
            {!config.reportingTool && (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>

          {availableReportingTools.map((tool) => {
            const isSelected = config.reportingTool === tool;
            return (
              <div
                key={tool}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${isSelected
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                  }
                `}
                onClick={() => updateConfig('reportingTool', tool)}
              >
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}
                >
                  <BarChart3 className="w-5 h-5" />
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
                        validationLabels.reportingTools[
                        tool as keyof typeof validationLabels.reportingTools
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

          {availableReportingTools.length === 0 && config.framework && (
            <div className="p-4 rounded-lg border border-dashed bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                No external reporting tools available for this configuration.
                <br />
                Standard framework reports will be generated.
              </p>
            </div>
          )}
        </RadioGroup>
      </div>
    </WizardStep>
  );
}
