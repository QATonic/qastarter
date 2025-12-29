/**
 * CI/CD Step - Select CI/CD tool (optional)
 */

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, GitBranch } from "lucide-react";
import WizardStep from "../../WizardStep";
import HelpTooltip from "../../HelpTooltip";
import { getHelpContent } from "@/lib/helpContent";
import { validationLabels } from "../../../../../shared/validationMatrix";
import { useWizard } from "../WizardContext";

export default function CiCdStep() {
  const { config, updateConfig, handleNext, handlePrevious, currentStep, steps, getFilteredOptions } = useWizard();
  const availableCicdTools = getFilteredOptions('cicdTool');

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="CI/CD Integration"
      description="Select a CI/CD tool for automated testing (optional)"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-3">
        <RadioGroup
          value={config.cicdTool}
          onValueChange={(value) => updateConfig("cicdTool", value)}
          className="grid gap-3"
        >
          {/* None option */}
          <div
            className={`
              flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
              ${!config.cicdTool
                ? 'bg-primary/5 border-primary/30 shadow-sm'
                : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
              }
            `}
            onClick={() => updateConfig("cicdTool", "")}
          >
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
              ${!config.cicdTool ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
            `}>
              <GitBranch className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value=""
                  id="cicd-none"
                  className="sr-only"
                />
                <Label htmlFor="cicd-none" className="text-sm font-medium cursor-pointer">
                  None (Skip CI/CD)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configure CI/CD later manually
              </p>
            </div>
            {!config.cicdTool && (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>

          {availableCicdTools.map((tool) => {
            const isSelected = config.cicdTool === tool;
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
                onClick={() => updateConfig("cicdTool", tool)}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}>
                  <GitBranch className="w-5 h-5" />
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
                      {validationLabels.cicdTools[tool as keyof typeof validationLabels.cicdTools]}
                    </Label>
                    <HelpTooltip content={getHelpContent(tool)} />
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
