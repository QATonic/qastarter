import { useState } from 'react';
import { useExpressGenerator } from './ExpressGeneratorContext';
import OptionButtonGroup from './OptionButtonGroup';
import DependencySearch from './DependencySearch';
import {
  testingTypeDescriptions,
  frameworkDescriptions,
  languageDescriptions,
  testRunnerDescriptions,
  buildToolDescriptions,
  testingPatternDescriptions,
} from './descriptions';
import { validationLabels, validationMatrix } from '@shared/validationMatrix';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  Globe,
  Code2,
  Terminal,
  Wrench,
  Settings,
  Cog,
  RotateCcw,
  Sparkles,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const testingPatternLabels: Record<string, string> = validationLabels.testingPatterns ?? {
  'page-object-model': 'Page Object Model (POM)',
  bdd: 'BDD (Cucumber)',
  hybrid: 'Hybrid',
  'data-driven': 'Data Driven',
  'keyword-driven': 'Keyword Driven',
  fluent: 'Fluent API',
  contract: 'Contract Testing',
};

export default function ConfigPanel() {
  const { config, updateConfig, getFilteredOptions, reset } = useExpressGenerator();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isProjectNameValid = (name: string) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) return false;
    if (config.language === 'dart' && !/^[a-z0-9_]+$/.test(name)) return false;
    return true;
  };

  // Build a "what's blocking this section" hint based on what's already chosen
  const frameworkHint = !config.testingType ? 'Pick a Testing Type first' : undefined;
  const languageHint = !config.framework ? 'Pick a Framework first' : undefined;
  const testRunnerHint = !config.language ? 'Pick a Language first' : undefined;
  const buildToolHint = !config.language ? 'Pick a Language first' : undefined;
  const testingPatternHint = !config.framework
    ? 'Pick a Framework first'
    : !config.language
      ? 'Pick a Language first'
      : undefined;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Configure Your Project</h2>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                className="gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Reset configuration"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Clear all selections and start over</TooltipContent>
          </Tooltip>
        </div>

        {/* Testing Type */}
        <div className="space-y-1 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Testing Type <span className="text-destructive ml-0.5">*</span>
            </Label>
          </div>
          <OptionButtonGroup
            options={validationMatrix.testingTypes}
            value={config.testingType}
            onChange={(value) => updateConfig('testingType', value)}
            labels={validationLabels.testingTypes}
            descriptions={testingTypeDescriptions}
            groupLabel="Testing Type"
          />
        </div>

        {/* Framework */}
        <div className="space-y-1 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Framework <span className="text-destructive ml-0.5">*</span>
            </Label>
          </div>
          <OptionButtonGroup
            options={getFilteredOptions('framework')}
            value={config.framework}
            onChange={(value) => updateConfig('framework', value)}
            labels={validationLabels.frameworks}
            lockedHint={frameworkHint}
            descriptions={frameworkDescriptions}
            groupLabel="Framework"
          />
        </div>

        {/* Language */}
        <div className="space-y-1 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Language <span className="text-destructive ml-0.5">*</span>
            </Label>
          </div>
          <OptionButtonGroup
            options={getFilteredOptions('language')}
            value={config.language}
            onChange={(value) => updateConfig('language', value)}
            labels={validationLabels.languages}
            lockedHint={languageHint}
            descriptions={languageDescriptions}
            groupLabel="Language"
          />
        </div>

        {/* Test Runner */}
        <div className="space-y-1 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Test Runner <span className="text-destructive ml-0.5">*</span>
            </Label>
          </div>
          <OptionButtonGroup
            options={getFilteredOptions('testRunner')}
            value={config.testRunner}
            onChange={(value) => updateConfig('testRunner', value)}
            labels={validationLabels.testRunners}
            lockedHint={testRunnerHint}
            descriptions={testRunnerDescriptions}
            groupLabel="Test Runner"
          />
        </div>

        {/* Build Tool */}
        <div className="space-y-1 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Build Tool <span className="text-destructive ml-0.5">*</span>
            </Label>
          </div>
          <OptionButtonGroup
            options={getFilteredOptions('buildTool')}
            value={config.buildTool}
            onChange={(value) => updateConfig('buildTool', value)}
            labels={validationLabels.buildTools}
            lockedHint={buildToolHint}
            descriptions={buildToolDescriptions}
            groupLabel="Build Tool"
          />
        </div>

        {/* Testing Pattern */}
        <div className="space-y-1 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Testing Pattern <span className="text-destructive ml-0.5">*</span>
            </Label>
          </div>
          <OptionButtonGroup
            options={getFilteredOptions('testingPattern')}
            value={config.testingPattern}
            onChange={(value) => updateConfig('testingPattern', value)}
            labels={testingPatternLabels}
            lockedHint={testingPatternHint}
            descriptions={testingPatternDescriptions}
            groupLabel="Testing Pattern"
          />
        </div>

        {/* Dependencies (live search Maven Central / npm) */}
        <div className="space-y-1 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Dependencies</Label>
            <span className="text-[10px] text-muted-foreground font-normal">
              (optional, live search)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Add packages from Maven Central or npm. They&apos;ll be injected into your generated
            build file alongside the defaults.
          </p>
          <DependencySearch />
        </div>

        {/* Project Name */}
        <div className="space-y-1 pb-4 border-b border-border/50">
          <Label htmlFor="projectName" className="text-sm font-medium">
            Project Name <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="projectName"
            placeholder="my-qa-project"
            value={config.projectName}
            onChange={(e) => updateConfig('projectName', e.target.value)}
            className={cn(
              'max-w-sm',
              config.projectName &&
                !isProjectNameValid(config.projectName) &&
                'border-destructive focus-visible:ring-destructive'
            )}
          />
          {config.projectName && !isProjectNameValid(config.projectName) && (
            <p className="text-xs text-destructive mt-1">
              Only letters, numbers, hyphens, and underscores are allowed.
            </p>
          )}
          {!config.projectName && config.framework && config.language && (
            <button
              type="button"
              aria-label={`Use suggested project name: ${config.framework}-${config.language}-tests`}
              onClick={() =>
                updateConfig('projectName', `${config.framework}-${config.language}-tests`)
              }
              className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              Use suggested: {config.framework}-{config.language}-tests
            </button>
          )}
        </div>

        {/* Java Group ID (conditional) — Artifact ID auto-derived from Project Name */}
        {config.language === 'java' && (
          <div className="space-y-1 pb-4 border-b border-border/50">
            <Label htmlFor="groupId" className="text-sm font-medium">
              Group ID
            </Label>
            <Input
              id="groupId"
              placeholder="com.qastarter"
              value={config.groupId ?? ''}
              onChange={(e) => updateConfig('groupId', e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}

        {/* Base URL — shown for web and API */}
        {(config.testingType === 'web' || config.testingType === 'api') && (
          <div className="space-y-1 pb-4 border-b border-border/50">
            <Label htmlFor="baseUrl" className="text-sm font-medium">
              Base URL
            </Label>
            <Input
              id="baseUrl"
              placeholder={
                config.testingType === 'api'
                  ? 'https://jsonplaceholder.typicode.com'
                  : 'https://www.saucedemo.com/'
              }
              value={config.baseUrl || ''}
              onChange={(e) => updateConfig('baseUrl', e.target.value)}
              className={cn(
                'max-w-sm',
                config.baseUrl &&
                  !/^https?:\/\/.+/i.test(config.baseUrl) &&
                  'border-destructive focus-visible:ring-destructive'
              )}
            />
            {config.baseUrl && !/^https?:\/\/.+/i.test(config.baseUrl) && (
              <p className="text-xs text-destructive mt-1">Must start with http:// or https://</p>
            )}
            {config.testingType === 'web' &&
              config.baseUrl &&
              !/saucedemo\.com/i.test(config.baseUrl) &&
              /^https?:\/\/.+/i.test(config.baseUrl) && (
                <p className="text-xs text-amber-600 mt-1">
                  Sample tests use SauceDemo locators. Update page objects for your site.
                </p>
              )}
            {config.testingType === 'api' &&
              config.baseUrl &&
              !/jsonplaceholder/i.test(config.baseUrl) &&
              /^https?:\/\/.+/i.test(config.baseUrl) && (
                <p className="text-xs text-amber-600 mt-1">
                  Sample tests use JSONPlaceholder endpoints. Update API paths for your service.
                </p>
              )}
          </div>
        )}

        {/* Testing-type-specific inputs */}
        {(config.testingType === 'web' || config.testingType === 'api') && (
          <div className="space-y-3 pb-4 border-b border-border/50">
            <Label className="text-sm font-medium">
              {config.testingType === 'api' ? 'API Settings' : 'Test Credentials'}
            </Label>
            {config.testingType === 'web' && (
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <div className="space-y-1">
                  <Label htmlFor="testUsername" className="text-xs text-muted-foreground">
                    Username
                  </Label>
                  <Input
                    id="testUsername"
                    value={config.testUsername || ''}
                    onChange={(e) => updateConfig('testUsername', e.target.value)}
                    placeholder="standard_user"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="testPassword" className="text-xs text-muted-foreground">
                    Password
                  </Label>
                  <Input
                    id="testPassword"
                    type="password"
                    value={config.testPassword || ''}
                    onChange={(e) => updateConfig('testPassword', e.target.value)}
                    placeholder="secret_sauce"
                  />
                </div>
              </div>
            )}
            {config.testingType === 'api' && (
              <div className="space-y-3 max-w-sm">
                <div className="space-y-1">
                  <Label htmlFor="apiAuthType" className="text-xs text-muted-foreground">
                    Authentication
                  </Label>
                  <select
                    id="apiAuthType"
                    value={config.apiAuthType || 'none'}
                    onChange={(e) => updateConfig('apiAuthType', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="none">None (public API)</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api-key">API Key</option>
                  </select>
                </div>
                {config.apiAuthType && config.apiAuthType !== 'none' && (
                  <div className="space-y-1">
                    <Label htmlFor="apiAuthToken" className="text-xs text-muted-foreground">
                      {config.apiAuthType === 'bearer'
                        ? 'Token'
                        : config.apiAuthType === 'basic'
                          ? 'user:pass'
                          : 'API Key'}
                    </Label>
                    <Input
                      id="apiAuthToken"
                      value={config.apiAuthToken || ''}
                      onChange={(e) => updateConfig('apiAuthToken', e.target.value)}
                      placeholder={
                        config.apiAuthType === 'bearer'
                          ? 'your-bearer-token'
                          : config.apiAuthType === 'basic'
                            ? 'username:password'
                            : 'your-api-key'
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {config.testingType === 'mobile' && (
          <div className="space-y-3 pb-4 border-b border-border/50">
            <Label className="text-sm font-medium">Android Config</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              iOS defaults (iPhone 14, v16.0) are pre-set in the generated config.
            </p>
            <div className="space-y-1 max-w-sm">
              <Label htmlFor="appPath" className="text-xs text-muted-foreground">
                Android App Path
              </Label>
              <Input
                id="appPath"
                value={config.appPath || ''}
                onChange={(e) => updateConfig('appPath', e.target.value)}
                placeholder="/path/to/your/app.apk"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div className="space-y-1">
                <Label htmlFor="deviceName" className="text-xs text-muted-foreground">
                  Android Device
                </Label>
                <Input
                  id="deviceName"
                  value={config.deviceName || ''}
                  onChange={(e) => updateConfig('deviceName', e.target.value)}
                  placeholder="Android Emulator"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="platformVersion" className="text-xs text-muted-foreground">
                  Android Version
                </Label>
                <Input
                  id="platformVersion"
                  value={config.platformVersion || ''}
                  onChange={(e) => updateConfig('platformVersion', e.target.value)}
                  placeholder="13.0"
                />
              </div>
            </div>
          </div>
        )}

        {config.testingType === 'desktop' && (
          <div className="space-y-3 pb-4 border-b border-border/50">
            <Label className="text-sm font-medium">Desktop Config</Label>
            <div className="space-y-1 max-w-sm">
              <Label htmlFor="appPath" className="text-xs text-muted-foreground">
                Application Path / App ID
              </Label>
              <Input
                id="appPath"
                value={config.appPath || ''}
                onChange={(e) => updateConfig('appPath', e.target.value)}
                placeholder="Microsoft.WindowsCalculator_8wekyb3d8bbwe!App"
              />
              <p className="text-xs text-muted-foreground">
                Defaults to Windows Calculator — sample tests run green without edits.
              </p>
            </div>
          </div>
        )}

        {/* Advanced Options */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
            <Cog className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Advanced Options</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform ml-auto',
                advancedOpen && 'rotate-180'
              )}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-4">
            {/* CI/CD Tool */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Cog className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">CI/CD Tool</Label>
              </div>
              <OptionButtonGroup
                options={getFilteredOptions('cicdTool')}
                value={config.cicdTool}
                onChange={(value) => updateConfig('cicdTool', value)}
                labels={validationLabels.cicdTools}
              />
            </div>

            {/* Reporting Tool */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Reporting Tool</Label>
              </div>
              <OptionButtonGroup
                options={getFilteredOptions('reportingTool')}
                value={config.reportingTool}
                onChange={(value) => updateConfig('reportingTool', value)}
                labels={validationLabels.reportingTools}
              />
            </div>

            {/* Utilities */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Utilities</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'configReader', label: 'Config Reader' },
                  { key: 'jsonReader', label: 'JSON Reader' },
                  { key: 'screenshotUtility', label: 'Screenshot Utility' },
                  { key: 'logger', label: 'Logger' },
                  { key: 'dataProvider', label: 'Data Provider' },
                  { key: 'includeDocker', label: 'Docker' },
                  { key: 'includeDockerCompose', label: 'Docker Compose' },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                  >
                    <Label htmlFor={`util-${key}`} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                    <Switch
                      id={`util-${key}`}
                      checked={(config.utilities as Record<string, boolean>)?.[key] ?? false}
                      onCheckedChange={(checked: boolean) =>
                        updateConfig('utilities', {
                          ...config.utilities,
                          [key]: checked,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ScrollArea>
  );
}
