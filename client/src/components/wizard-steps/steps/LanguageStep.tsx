/**
 * Language Step - Select the programming language
 */

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Code2 } from "lucide-react";
import WizardStep from "../../WizardStep";
import HelpTooltip from "../../HelpTooltip";
import { getHelpContent } from "@/lib/helpContent";
import { validationLabels } from "../../../../../shared/validationMatrix";
import { useWizard } from "../WizardContext";

export default function LanguageStep() {
  const { config, updateConfig, handleNext, handlePrevious, currentStep, steps, getFilteredOptions } = useWizard();
  const availableLanguages = getFilteredOptions('language');

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Programming Language"
      description="Select the programming language for your project"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-3">
        {!config.framework && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Please select a testing framework first to see compatible languages.
            </span>
          </div>
        )}
        
        <RadioGroup
          value={config.language}
          onValueChange={(value) => updateConfig("language", value)}
          disabled={!config.framework}
          className="grid gap-3"
        >
          {availableLanguages.map((language) => {
            const isSelected = config.language === language;
            return (
              <div 
                key={language} 
                className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${isSelected 
                    ? 'bg-primary/5 border-primary/30 shadow-sm' 
                    : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                  }
                  ${!config.framework ? 'opacity-50 pointer-events-none' : ''}
                `}
                onClick={() => config.framework && updateConfig("language", language)}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}>
                  <Code2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem 
                      value={language} 
                      id={language}
                      data-testid={`radio-${language}`}
                      className="sr-only"
                    />
                    <Label htmlFor={language} className="text-sm font-medium cursor-pointer">
                      {validationLabels.languages[language as keyof typeof validationLabels.languages]}
                    </Label>
                    <HelpTooltip content={getHelpContent(language)} />
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </RadioGroup>
        
        {config.language && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Available Test Runners:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {getFilteredOptions('testRunner').map(runner => (
                <Badge key={runner} variant="secondary" className="text-xs">
                  {validationLabels.testRunners[runner as keyof typeof validationLabels.testRunners]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
