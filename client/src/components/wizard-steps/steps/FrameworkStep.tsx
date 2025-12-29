/**
 * Framework Step - Select the testing framework
 */

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Globe, Layers, Smartphone, Server, MonitorSmartphone } from "lucide-react";
import WizardStep from "../../WizardStep";
import HelpTooltip from "../../HelpTooltip";
import { getHelpContent } from "@/lib/helpContent";
import { validationLabels } from "../../../../../shared/validationMatrix";
import { useWizard } from "../WizardContext";

const frameworkIcons: Record<string, React.ElementType> = {
  selenium: Globe,
  playwright: Layers,
  cypress: Layers,
  appium: Smartphone,
  webdriverio: Globe,
  restassured: Server,
  requests: Server,
  supertest: Server,
  restsharp: Server,
  winappdriver: MonitorSmartphone,
  pyautogui: MonitorSmartphone,
  espresso: Smartphone,
  xcuitest: Smartphone,
};

export default function FrameworkStep() {
  const { config, updateConfig, handleNext, handlePrevious, currentStep, steps, getFilteredOptions } = useWizard();
  const availableFrameworks = getFilteredOptions('framework');

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Testing Framework"
      description="Choose the testing framework for your project"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-3">
        {!config.testingType && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Please select a testing type first to see available frameworks.
            </span>
          </div>
        )}
        
        <RadioGroup 
          value={config.framework} 
          onValueChange={(value) => updateConfig("framework", value)}
          disabled={!config.testingType}
          className="grid gap-3"
        >
          {availableFrameworks.map((framework) => {
            const Icon = frameworkIcons[framework] || Layers;
            const isSelected = config.framework === framework;
            return (
              <div 
                key={framework} 
                className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${isSelected 
                    ? 'bg-primary/5 border-primary/30 shadow-sm' 
                    : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                  }
                  ${!config.testingType ? 'opacity-50 pointer-events-none' : ''}
                `}
                onClick={() => config.testingType && updateConfig("framework", framework)}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem 
                      value={framework} 
                      id={framework}
                      data-testid={`radio-${framework}`}
                      className="sr-only"
                    />
                    <Label htmlFor={framework} className="text-sm font-medium cursor-pointer">
                      {validationLabels.frameworks[framework as keyof typeof validationLabels.frameworks]}
                    </Label>
                    <HelpTooltip content={getHelpContent(framework)} />
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </RadioGroup>
        
        {config.framework && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Available Languages:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {getFilteredOptions('language').map(language => (
                <Badge key={language} variant="secondary" className="text-xs">
                  {validationLabels.languages[language as keyof typeof validationLabels.languages]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
