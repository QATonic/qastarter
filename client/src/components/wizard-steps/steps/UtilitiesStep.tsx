/**
 * Utilities Step - Select utility modules to include
 */

import type React from 'react';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Settings,
  FileJson,
  Camera,
  FileText,
  Database,
  Container,
  Boxes,
  FlaskConical,
  Cloud,
} from 'lucide-react';
import WizardStep from '../../WizardStep';
import HelpTooltip from '../../HelpTooltip';
import { useWizard } from '../WizardContext';
import { defaultUtilities } from '@shared/schema';
import { validationLabels } from '@shared/validationMatrix';

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
  {
    key: 'faker',
    label: 'Test Data (Faker)',
    description: 'Auto-generate realistic test data with Faker/Bogus/DataFaker libraries',
    icon: FlaskConical,
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

        {/* Cloud Device Farm — only for web and mobile */}
        {(config.testingType === 'web' || config.testingType === 'mobile') && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Cloud Device Farm (Optional)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['none', 'browserstack', 'saucelabs', 'testmu'] as const).map((farm) => {
                // Only BrowserStack is fully wired today. The other
                // providers are kept on the panel as discoverability
                // signals and disabled with a "Coming Soon" badge.
                const comingSoon = farm === 'saucelabs' || farm === 'testmu';
                const isSelected = (config.cloudDeviceFarm || 'none') === farm;
                const label =
                  farm === 'none'
                    ? 'None (Local)'
                    : (validationLabels.cloudDeviceFarms as Record<string, string>)[farm] || farm;
                const subLabel = farm === 'testmu' ? 'formerly LambdaTest' : null;
                return (
                  <button
                    key={farm}
                    type="button"
                    disabled={comingSoon}
                    aria-disabled={comingSoon}
                    title={comingSoon ? 'Coming soon — only BrowserStack is supported today' : undefined}
                    className={`
                      relative flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-sm font-medium transition-all
                      ${isSelected
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-700 dark:text-purple-300'
                        : comingSoon
                          ? 'bg-muted/20 border-border text-muted-foreground/60 cursor-not-allowed opacity-60'
                          : 'bg-card hover:bg-muted/30 border-border text-muted-foreground'}
                    `}
                    onClick={() => {
                      if (comingSoon) return;
                      updateConfig('cloudDeviceFarm', farm);
                    }}
                  >
                    {comingSoon && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                        Coming Soon
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <Cloud className={`w-4 h-4 ${isSelected ? 'text-purple-500' : ''}`} />
                      {label}
                    </span>
                    {subLabel && (
                      <span className="text-[10px] text-muted-foreground/70 normal-case">
                        {subLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Run tests on BrowserStack cloud infrastructure instead of local browsers. Sauce Labs and TestMu AI (formerly LambdaTest) are coming soon.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{utilityCount}</span> utilities selected
          </p>
          {dockerCount > 0 && (
            <p className="text-sm text-blue-600">
              <span className="font-medium">{dockerCount}</span> Docker{' '}
              {dockerCount === 1 ? 'file' : 'files'}
            </p>
          )}
          {config.cloudDeviceFarm && config.cloudDeviceFarm !== 'none' && (
            <p className="text-sm text-purple-600">
              {(validationLabels.cloudDeviceFarms as Record<string, string>)[config.cloudDeviceFarm] || config.cloudDeviceFarm}
            </p>
          )}
        </div>
      </div>
    </WizardStep>
  );
}
