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

  const artifactIdError = (() => {
    if (!needsJavaMetadata) return null;
    const artifactId = config.artifactId?.trim() || '';
    if (!artifactId) return null;
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(artifactId)) {
      return 'Must be lowercase with hyphens (e.g., my-project)';
    }
    return null;
  })();

  const isValid =
    config.projectName.trim() &&
    !projectNameError &&
    (!needsJavaMetadata ||
      (config.groupId?.trim() && !groupIdError && config.artifactId?.trim() && !artifactIdError));

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

        {/* Java-specific metadata */}
        {needsJavaMetadata && (
          <>
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

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="artifactId" className="text-sm font-medium">
                  Artifact ID <span className="text-destructive">*</span>
                </Label>
                <HelpTooltip content="Maven/Gradle artifact identifier. Usually matches project name in lowercase." />
              </div>
              <Input
                id="artifactId"
                value={config.artifactId || ''}
                onChange={(e) => updateConfig('artifactId', e.target.value)}
                placeholder="qa-automation"
                className={artifactIdError ? 'border-destructive' : ''}
              />
              {artifactIdError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {artifactIdError}
                </div>
              )}
            </div>
          </>
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
                <>
                  <p>
                    Group ID: <span className="font-mono text-foreground">{config.groupId}</span>
                  </p>
                  <p>
                    Artifact ID:{' '}
                    <span className="font-mono text-foreground">{config.artifactId}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
