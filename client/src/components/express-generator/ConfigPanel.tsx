import { useMemo, useState } from 'react';
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
import type { EnvironmentConfig } from '@/components/wizard-steps/types';
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
  Plus,
  X,
  Layers,
  Cloud,
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

  // Memoize filtered option lists so we only re-run the validation-matrix lookup
  // when an *upstream* choice changes — not on every re-render (e.g. keystrokes
  // in the project name input trigger a full ConfigPanel render without these deps
  // actually changing).
  const frameworkOptions = useMemo(
    () => getFilteredOptions('framework'),
    [getFilteredOptions, config.testingType]
  );
  const languageOptions = useMemo(
    () => getFilteredOptions('language'),
    [getFilteredOptions, config.testingType, config.framework]
  );
  const testRunnerOptions = useMemo(
    () => getFilteredOptions('testRunner'),
    [getFilteredOptions, config.framework, config.language]
  );
  const buildToolOptions = useMemo(
    () => getFilteredOptions('buildTool'),
    [getFilteredOptions, config.framework, config.language]
  );
  const testingPatternOptions = useMemo(
    () => getFilteredOptions('testingPattern'),
    [getFilteredOptions, config.framework, config.language]
  );
  const cicdToolOptions = useMemo(
    () => getFilteredOptions('cicdTool'),
    [getFilteredOptions, config.framework]
  );
  const reportingToolOptions = useMemo(
    () => getFilteredOptions('reportingTool'),
    [getFilteredOptions, config.framework, config.language]
  );
  const cloudDeviceFarmOptions = useMemo(
    () => ['none', ...getFilteredOptions('cloudDeviceFarm')],
    [getFilteredOptions, config.testingType, config.framework]
  );

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
            options={frameworkOptions}
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
            options={languageOptions}
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
            options={testRunnerOptions}
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
            options={buildToolOptions}
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
            options={testingPatternOptions}
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
                <div className="space-y-1 pt-2 border-t border-border/30">
                  <Label htmlFor="openApiSpecUrl" className="text-xs text-muted-foreground">
                    OpenAPI / Swagger Spec URL{' '}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Input
                    id="openApiSpecUrl"
                    value={config.openApiSpecUrl || ''}
                    onChange={(e) => updateConfig('openApiSpecUrl', e.target.value)}
                    placeholder="https://petstore3.swagger.io/api/v3/openapi.json"
                    maxLength={2000}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Paste a URL to auto-generate test stubs for each endpoint. HTTPS only.
                  </p>
                </div>
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
                options={cicdToolOptions}
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
                options={reportingToolOptions}
                value={config.reportingTool}
                onChange={(value) => updateConfig('reportingTool', value)}
                labels={validationLabels.reportingTools}
              />
            </div>

            {/* Cloud Device Farm — only for web and mobile testing */}
            {(config.testingType === 'web' || config.testingType === 'mobile') && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <Cloud className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Cloud Device Farm</Label>
                </div>
                <OptionButtonGroup
                  options={cloudDeviceFarmOptions}
                  value={config.cloudDeviceFarm || 'none'}
                  onChange={(value) => updateConfig('cloudDeviceFarm', value)}
                  labels={validationLabels.cloudDeviceFarms}
                />
              </div>
            )}

            {/* Environments */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Environments</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    const envs: EnvironmentConfig[] = config.environments ?? [];
                    if (envs.length >= 10) return;
                    const names = ['dev', 'staging', 'prod', 'qa', 'uat'];
                    const usedNames = new Set(envs.map((e) => e.name));
                    const nextName = names.find((n) => !usedNames.has(n)) || `env-${envs.length + 1}`;
                    updateConfig('environments', [
                      ...envs,
                      { name: nextName, baseUrl: 'https://example.com' },
                    ]);
                  }}
                  disabled={(config.environments ?? []).length >= 10}
                  aria-label="Add environment"
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
              {(config.environments ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">
                  Add environments to generate multi-env config files (e.g. dev, staging, prod).
                </p>
              ) : (
                <div className="space-y-2">
                  {(config.environments ?? []).map((env: EnvironmentConfig, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-md border border-border/50 p-3 space-y-2 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const envs = [...(config.environments ?? [])];
                          envs.splice(idx, 1);
                          updateConfig('environments', envs);
                        }}
                        aria-label={`Remove ${env.name} environment`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <div className="grid grid-cols-2 gap-2 pr-8">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Name</Label>
                          <Input
                            value={env.name}
                            onChange={(e) => {
                              const envs = [...(config.environments ?? [])];
                              envs[idx] = { ...envs[idx], name: e.target.value };
                              updateConfig('environments', envs);
                            }}
                            placeholder="dev"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Base URL</Label>
                          <Input
                            value={env.baseUrl}
                            onChange={(e) => {
                              const envs = [...(config.environments ?? [])];
                              envs[idx] = { ...envs[idx], baseUrl: e.target.value };
                              updateConfig('environments', envs);
                            }}
                            placeholder="https://dev.example.com"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  { key: 'faker', label: 'Test Data (Faker)' },
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
