/**
 * Utilities Step - Select utility modules to include
 */

import React from 'react';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, FileJson, Camera, FileText, Database, Container, Boxes } from 'lucide-react';
import WizardStep from '../../WizardStep';
import HelpTooltip from '../../HelpTooltip';
import { useWizard } from '../WizardContext';
import { defaultUtilities } from '@shared/schema';

interface UtilityItem {
  key: keyof typeof defaultUtilities;
  label: string;
  description: string;
  icon: React.ElementType;
}

interface DockerItem {
  key: 'includeDocker' | 'includeDockerCompose';
  label: string;
  description: string;
  icon: React.ElementType;
}

const utilityItems: UtilityItem[] = [
  {
    key: 'configReader',
    label: 'Config Reader',
    description: 'Read configuration from properties/yaml files',
    icon: Settings,
  },
  {
    key: 'jsonReader',
    label: 'JSON Reader',
    description: 'Parse and read JSON test data files',
    icon: FileJson,
  },
  {
    key: 'screenshotUtility',
    label: 'Screenshot Utility',
    description: 'Capture screenshots on test failure',
    icon: Camera,
  },
  {
    key: 'logger',
    label: 'Logger',
    description: 'Structured logging for test execution',
    icon: FileText,
  },
  {
    key: 'dataProvider',
    label: 'Data Provider',
    description: 'Data-driven testing utilities',
    icon: Database,
  },
];

const dockerItems: DockerItem[] = [
  {
    key: 'includeDocker',
    label: 'Dockerfile',
    description: 'Run tests in isolated Docker containers',
    icon: Container,
  },
  {
    key: 'includeDockerCompose',
    label: 'Docker Compose',
    description: 'Selenium Grid with multiple browsers (Chrome, Firefox, Edge)',
    icon: Boxes,
  },
];

export default function UtilitiesStep() {
  const { config, updateConfig, handleNext, handlePrevious, currentStep, steps } = useWizard();

  const toggleUtility = (key: keyof typeof defaultUtilities) => {
    updateConfig('utilities', {
      ...config.utilities,
      [key]: !config.utilities[key],
    });
  };

  const toggleDocker = (key: 'includeDocker' | 'includeDockerCompose') => {
    updateConfig('utilities', {
      ...config.utilities,
      [key]: !config.utilities[key],
    });
  };

  const utilityCount = Object.entries(config.utilities)
    .filter(([key]) => !key.startsWith('include'))
    .filter(([, value]) => value).length;

  const dockerCount =
    (config.utilities.includeDocker ? 1 : 0) + (config.utilities.includeDockerCompose ? 1 : 0);

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Utility Modules"
      description="Select helper utilities and Docker support for your project"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-6">
        {/* Utility Modules Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Helper Utilities
          </h3>
          {utilityItems
            // Filter out screenshot utility for API testing (UI-less)
            .filter((item) => !(config.testingType === 'api' && item.key === 'screenshotUtility'))
            .map((item) => {
              const Icon = item.icon;
              const isEnabled = config.utilities[item.key];

              return (
                <div
                  key={item.key}
                  className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${isEnabled ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-muted/30'}
                `}
                  onClick={() => toggleUtility(item.key)}
                >
                  <div
                    className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium cursor-pointer">{item.label}</Label>
                      <HelpTooltip content={item.description} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleUtility(item.key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              );
            })}
        </div>

        {/* Docker Support Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Docker Support (Optional)
          </h3>
          {dockerItems
            // Filter out Docker Compose (Selenium Grid) for non-Web testing types
            .filter(
              (item) => !(config.testingType !== 'web' && item.key === 'includeDockerCompose')
            )
            .map((item) => {
              const Icon = item.icon;
              const isEnabled = config.utilities[item.key];

              return (
                <div
                  key={item.key}
                  className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                  ${isEnabled ? 'bg-blue-500/5 border-blue-500/30' : 'bg-card hover:bg-muted/30'}
                `}
                  onClick={() => toggleDocker(item.key)}
                >
                  <div
                    className={`
                  flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                  ${isEnabled ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}
                `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium cursor-pointer">{item.label}</Label>
                      <HelpTooltip content={item.description} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleDocker(item.key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              );
            })}
        </div>

        {/* Summary */}
        <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{utilityCount}</span> utilities selected
          </p>
          {dockerCount > 0 && (
            <p className="text-sm text-blue-600">
              <span className="font-medium">{dockerCount}</span> Docker{' '}
              {dockerCount === 1 ? 'file' : 'files'}
            </p>
          )}
        </div>
      </div>
    </WizardStep>
  );
}
