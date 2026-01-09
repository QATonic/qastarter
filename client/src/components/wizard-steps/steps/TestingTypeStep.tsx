/**
 * Testing Type Step - Select the primary type of testing
 */

import React from 'react';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Monitor, Smartphone, Server, MonitorSmartphone } from 'lucide-react';
import WizardStep from '../../WizardStep';
import HelpTooltip from '../../HelpTooltip';
import { getHelpContent } from '@/lib/helpContent';
import { validationLabels } from '../../../../../shared/validationMatrix';
import { useWizard } from '../WizardContext';

const testingTypeIcons: Record<string, React.ElementType> = {
  web: Monitor,
  mobile: Smartphone,
  api: Server,
  desktop: MonitorSmartphone,
};

export default function TestingTypeStep() {
  const {
    config,
    updateConfig,
    handleNext,
    handlePrevious,
    currentStep,
    steps,
    getFilteredOptions,
  } = useWizard();

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Testing Type"
      description="Select the primary type of testing for your project"
      onNext={handleNext}
      onPrevious={handlePrevious}
      canGoPrevious={true}
    >
      <div className="space-y-3">
        <RadioGroup
          value={config.testingType}
          onValueChange={(value) => updateConfig('testingType', value)}
          className="grid gap-3"
        >
          {Object.entries(validationLabels.testingTypes).map(([key, label]) => {
            const Icon = testingTypeIcons[key] || Monitor;
            const isSelected = config.testingType === key;
            return (
              <div
                key={key}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${
                    isSelected
                      ? 'bg-primary/5 border-primary/30 shadow-sm'
                      : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                  }
                `}
                onClick={() => updateConfig('testingType', key)}
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
                      value={key}
                      id={key}
                      data-testid={`radio-${key}`}
                      className="sr-only"
                    />
                    <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                      {label}
                    </Label>
                    <HelpTooltip content={getHelpContent(key)} />
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
              </div>
            );
          })}
        </RadioGroup>

        {config.testingType && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Available Frameworks:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {getFilteredOptions('framework').map((framework) => (
                <Badge key={framework} variant="secondary" className="text-xs">
                  {
                    validationLabels.frameworks[
                      framework as keyof typeof validationLabels.frameworks
                    ]
                  }
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
