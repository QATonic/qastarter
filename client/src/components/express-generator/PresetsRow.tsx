import React from 'react';
import { Globe, Smartphone, Server, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpressGenerator } from './ExpressGeneratorContext';
import type { WizardConfig } from '@/components/wizard-steps/types';

interface Preset {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  config: Partial<WizardConfig>;
}

const PRESETS: Preset[] = [
  {
    name: 'Selenium + Java',
    icon: Globe,
    category: 'Web',
    config: {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'selenium-java-project',
      cicdTool: 'github-actions',
      reportingTool: 'allure',
    },
  },
  {
    name: 'Playwright + TS',
    icon: Globe,
    category: 'Web',
    config: {
      testingType: 'web',
      framework: 'playwright',
      language: 'typescript',
      testRunner: 'jest',
      buildTool: 'npm',
      testingPattern: 'page-object-model',
      projectName: 'playwright-ts-project',
      cicdTool: 'github-actions',
      reportingTool: 'allure',
    },
  },
  {
    name: 'Cypress + TS',
    icon: Globe,
    category: 'Web',
    config: {
      testingType: 'web',
      framework: 'cypress',
      language: 'typescript',
      testRunner: 'cypress',
      buildTool: 'npm',
      testingPattern: 'page-object-model',
      projectName: 'cypress-ts-project',
      cicdTool: 'github-actions',
      reportingTool: 'allure',
    },
  },
  {
    name: 'Appium + Java',
    icon: Smartphone,
    category: 'Mobile',
    config: {
      testingType: 'mobile',
      framework: 'appium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'appium-java-project',
      cicdTool: 'github-actions',
      reportingTool: 'allure',
    },
  },
  {
    name: 'REST Assured',
    icon: Server,
    category: 'API',
    config: {
      testingType: 'api',
      framework: 'restassured',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'data-driven',
      projectName: 'api-java-project',
      cicdTool: 'github-actions',
      reportingTool: 'allure',
    },
  },
  {
    name: 'Pytest + Requests',
    icon: Server,
    category: 'API',
    config: {
      testingType: 'api',
      framework: 'requests',
      language: 'python',
      testRunner: 'pytest',
      buildTool: 'pip',
      testingPattern: 'data-driven',
      projectName: 'api-python-project',
      cicdTool: 'github-actions',
      reportingTool: 'allure',
    },
  },
];

// Fields that must ALL match exactly for a preset to be considered "active"
const PRESET_MATCH_FIELDS: (keyof WizardConfig)[] = [
  'testingType',
  'framework',
  'language',
  'testRunner',
  'buildTool',
];

export default function PresetsRow() {
  const { config, applyPreset } = useExpressGenerator();

  return (
    <div className="w-full px-4 sm:px-6 pt-4 pb-3 border-b border-border/50 bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quick Start
        </span>
        <span className="text-xs text-muted-foreground/80 hidden sm:inline">
          — pick a stack and you&apos;re ready in one click
        </span>
      </div>
      <div className="relative">
        {/* Scroll hint fade on the right edge */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent z-10 sm:hidden" />
        <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              // Tight match: every key field in the preset must equal config
              const isActive = PRESET_MATCH_FIELDS.every(
                (field) =>
                  preset.config[field] === undefined || config[field] === preset.config[field]
              );

              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.config)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all whitespace-nowrap',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    isActive
                      ? 'border-primary/50 bg-primary/10 text-primary font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 hover:border-primary/30 text-foreground'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{preset.name}</span>
                  <span
                    className={cn(
                      'text-xs rounded-full px-1.5 py-0.5',
                      isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {preset.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
