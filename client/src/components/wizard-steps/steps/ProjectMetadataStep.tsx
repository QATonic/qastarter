/**
 * Project Metadata Step - Enter project name and Java-specific metadata
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import WizardStep from '../../WizardStep';
import HelpTooltip from '../../HelpTooltip';
import { useWizard } from '../WizardContext';

export default function ProjectMetadataStep() {
  const { config, updateConfig, handleNext, handlePrevious, currentStep, steps } = useWizard();

  const isJavaProject = config.language === 'java';
  const needsJavaMetadata =
    isJavaProject && (config.buildTool === 'maven' || config.buildTool === 'gradle');

  // Validation helpers
  const projectNameError = (() => {
    const name = config.projectName.trim();
    if (!name) return null;

    // Dart specific validation (snake_case required, no hyphens)
    if (config.language === 'dart') {
      if (!/^[a-z0-9_]+$/.test(name)) {
        return 'Dart projects require lowercase snake_case (e.g., my_project)';
      }
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name))
      return 'Only letters, numbers, hyphens, and underscores allowed';
    if (name.length > 100) return 'Maximum 100 characters';
    return null;
  })();

  const groupIdError = (() => {
    if (!needsJavaMetadata) return null;
    const groupId = config.groupId?.trim() || '';
    if (!groupId) return null;
    if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(groupId)) {
      return 'Must be valid Java package format (e.g., com.example)';
    }
    return null;
  })();

  const baseUrlError = (() => {
    const baseUrl = config.baseUrl?.trim() || '';
    if (!baseUrl) return null;
    try {
      const parsed = new URL(baseUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'Must start with http:// or https://';
      }
    } catch {
      return 'Must be a valid URL starting with http:// or https://';
    }
    return null;
  })();

  const isValid =
    config.projectName.trim() &&
    !projectNameError &&
    !baseUrlError &&
    (!needsJavaMetadata || (config.groupId?.trim() && !groupIdError));

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Project Metadata"
      description="Configure your project name and identifiers"
      onNext={handleNext}
      onPrevious={handlePrevious}
    >
      <div className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="projectName" className="text-sm font-medium">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <HelpTooltip content="The name of your project. Used for folder name and configuration files." />
          </div>
          <Input
            id="projectName"
            value={config.projectName}
            onChange={(e) => updateConfig('projectName', e.target.value)}
            placeholder="my-qa-project"
            className={projectNameError ? 'border-destructive' : ''}
          />
          {projectNameError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {projectNameError}
            </div>
          )}
          {config.projectName && !projectNameError && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Valid project name
            </div>
          )}
        </div>

        {/* Base URL — shown for web and API testing types */}
        {(config.testingType === 'web' || config.testingType === 'api') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="baseUrl" className="text-sm font-medium">
                Base URL
              </Label>
              <HelpTooltip
                content={
                  config.testingType === 'api'
                    ? 'API endpoint the generated tests will target. Defaults to JSONPlaceholder so the starter project runs green without any edits.'
                    : 'URL the generated sample tests will target. Defaults to the SauceDemo site so the starter project runs green without any edits.'
                }
              />
            </div>
            <Input
              id="baseUrl"
              value={config.baseUrl || ''}
              onChange={(e) => updateConfig('baseUrl', e.target.value)}
              placeholder={
                config.testingType === 'api'
                  ? 'https://jsonplaceholder.typicode.com'
                  : 'https://www.saucedemo.com/'
              }
              className={baseUrlError ? 'border-destructive' : ''}
            />
            {baseUrlError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {baseUrlError}
              </div>
            )}
            {config.testingType === 'web' &&
              config.baseUrl &&
              !/saucedemo\.com/i.test(config.baseUrl) &&
              !baseUrlError && (
                <p className="text-xs text-amber-600">
                  Sample tests use SauceDemo-specific locators. Update page objects and selectors
                  for your site after generation.
                </p>
              )}
            {config.testingType === 'api' &&
              config.baseUrl &&
              !/jsonplaceholder/i.test(config.baseUrl) &&
              !baseUrlError && (
                <p className="text-xs text-amber-600">
                  Sample tests use JSONPlaceholder endpoints (/posts, /users). Update API paths for
                  your service after generation.
                </p>
              )}
          </div>
        )}

        {/* Web test credentials */}
        {config.testingType === 'web' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="testUsername" className="text-sm font-medium">
                  Test Username
                </Label>
                <HelpTooltip content="Username for sample login tests. Auto-filled for SauceDemo." />
              </div>
              <Input
                id="testUsername"
                value={config.testUsername || ''}
                onChange={(e) => updateConfig('testUsername', e.target.value)}
                placeholder="standard_user"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="testPassword" className="text-sm font-medium">
                  Test Password
                </Label>
                <HelpTooltip content="Password for sample login tests. Auto-filled for SauceDemo." />
              </div>
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

        {/* Mobile config — app path, device, platform (Android-focused; iOS defaults are static in templates) */}
        {config.testingType === 'mobile' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="appPath" className="text-sm font-medium">
                  Android App Path
                </Label>
                <HelpTooltip content="Path to the .apk file on the machine running tests. iOS config uses a separate placeholder you can edit after generation." />
              </div>
              <Input
                id="appPath"
                value={config.appPath || ''}
                onChange={(e) => updateConfig('appPath', e.target.value)}
                placeholder="/path/to/your/app.apk"
              />
              {!config.appPath?.trim() && (
                <p className="text-xs text-amber-600">
                  Leave empty to get a placeholder — you can set it in the generated config before
                  running tests.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="deviceName" className="text-sm font-medium">
                    Android Device
                  </Label>
                  <HelpTooltip content="Android device or emulator name (e.g., 'Android Emulator', 'Pixel 7'). iOS defaults to 'iPhone 14' in the generated config." />
                </div>
                <Input
                  id="deviceName"
                  value={config.deviceName || ''}
                  onChange={(e) => updateConfig('deviceName', e.target.value)}
                  placeholder="Android Emulator"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="platformVersion" className="text-sm font-medium">
                    Android Version
                  </Label>
                  <HelpTooltip content="Android OS version (e.g., '13.0' for Android 13). iOS defaults to '16.0' in the generated config." />
                </div>
                <Input
                  id="platformVersion"
                  value={config.platformVersion || ''}
                  onChange={(e) => updateConfig('platformVersion', e.target.value)}
                  placeholder="13.0"
                />
              </div>
            </div>
          </>
        )}

        {/* Desktop config — app path */}
        {config.testingType === 'desktop' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="appPath" className="text-sm font-medium">
                Application Path
              </Label>
              <HelpTooltip content="Full path or App ID of the desktop application. Defaults to Windows Calculator so sample tests run out of the box." />
            </div>
            <Input
              id="appPath"
              value={config.appPath || ''}
              onChange={(e) => updateConfig('appPath', e.target.value)}
              placeholder="Microsoft.WindowsCalculator_8wekyb3d8bbwe!App"
            />
            <p className="text-xs text-muted-foreground">
              Defaults to Windows Calculator — sample tests run green without any edits.
            </p>
          </div>
        )}

        {/* API auth config */}
        {config.testingType === 'api' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="apiAuthType" className="text-sm font-medium">
                  Authentication
                </Label>
                <HelpTooltip content="Choose the authentication method your API requires. Select 'None' for public APIs." />
              </div>
              <select
                id="apiAuthType"
                value={config.apiAuthType || 'none'}
                onChange={(e) => updateConfig('apiAuthType', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="none">None (public API)</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="api-key">API Key</option>
              </select>
            </div>
            {config.apiAuthType && config.apiAuthType !== 'none' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="apiAuthToken" className="text-sm font-medium">
                    {config.apiAuthType === 'bearer'
                      ? 'Bearer Token'
                      : config.apiAuthType === 'basic'
                        ? 'Credentials (user:pass)'
                        : 'API Key'}
                  </Label>
                  <HelpTooltip
                    content={
                      config.apiAuthType === 'bearer'
                        ? "The Bearer token value (without the 'Bearer ' prefix)."
                        : config.apiAuthType === 'basic'
                          ? 'Basic auth credentials in user:password format.'
                          : 'Your API key value.'
                    }
                  />
                </div>
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
          </>
        )}

        {/* Java-specific metadata — only Group ID; Artifact ID is auto-derived from Project Name */}
        {needsJavaMetadata && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="groupId" className="text-sm font-medium">
                Group ID <span className="text-destructive">*</span>
              </Label>
              <HelpTooltip content="Java package identifier (e.g., com.company.project). Used in Maven/Gradle configuration." />
            </div>
            <Input
              id="groupId"
              value={config.groupId || ''}
              onChange={(e) => updateConfig('groupId', e.target.value)}
              placeholder="com.qastarter"
              className={groupIdError ? 'border-destructive' : ''}
            />
            {groupIdError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {groupIdError}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {isValid && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Project Configuration</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Project: <span className="font-mono text-foreground">{config.projectName}</span>
              </p>
              {needsJavaMetadata && (
                <p>
                  Group ID: <span className="font-mono text-foreground">{config.groupId}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
