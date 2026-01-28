/**
 * Summary Step - Review configuration and generate project
 * Features project preview with file tree and content preview
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import WizardStep from '../../WizardStep';
import ProjectPreview from '../../ProjectPreview';
import { validationLabels } from '../../../../../shared/validationMatrix';
import { useWizard } from '../WizardContext';

export default function SummaryStep() {
  const { config, handleNext, handlePrevious, currentStep, steps, isGenerating } = useWizard();

  const getLabel = (category: string, value: string): string => {
    const labels = validationLabels[category as keyof typeof validationLabels];
    if (labels && typeof labels === 'object') {
      return (labels as Record<string, string>)[value] || value;
    }
    return value;
  };

  const enabledUtilities = Object.entries(config.utilities)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);

  // Prepare configuration for ProjectPreview
  const previewConfig = {
    testingType: config.testingType,
    framework: config.framework,
    language: config.language,
    testingPattern: config.testingPattern,
    testRunner: config.testRunner,
    buildTool: config.buildTool,
    projectName: config.projectName,
    cicdTool: config.cicdTool || '',
    reportingTool: config.reportingTool || '',
    groupId: config.groupId || '',
    artifactId: config.artifactId || '',
    utilities: config.utilities,
  };

  // Configuration items for display
  const configItems = [
    { label: 'Testing Type', value: getLabel('testingTypes', config.testingType) },
    { label: 'Framework', value: getLabel('frameworks', config.framework) },
    { label: 'Language', value: getLabel('languages', config.language) },
    { label: 'Testing Pattern', value: getLabel('testingPatterns', config.testingPattern) },
    { label: 'Test Runner', value: getLabel('testRunners', config.testRunner) },
    { label: 'Build Tool', value: getLabel('buildTools', config.buildTool) },
    { label: 'Project Name', value: config.projectName },
    ...(config.groupId ? [{ label: 'Group Id', value: config.groupId }] : []),
    ...(config.artifactId ? [{ label: 'Artifact Id', value: config.artifactId }] : []),
    ...(config.cicdTool
      ? [{ label: 'Cicd Tool', value: getLabel('cicdTools', config.cicdTool) }]
      : []),
    ...(config.reportingTool
      ? [{ label: 'Reporting Tool', value: getLabel('reportingTools', config.reportingTool) }]
      : []),
  ];

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Summary"
      description="Review your configuration and choose how to get your project"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLastStep={true}
      canGoNext={!isGenerating}
    >
      <div className="space-y-6">
        {/* Project Preview with Stats and File Tree */}
        <ProjectPreview
          projectName={config.projectName}
          configuration={previewConfig}
          onDownload={handleNext}
          isGenerating={isGenerating}
          hideDownloadButton={true}
        />

        {/* Zero-Config Verified Banner */}
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg shadow-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">
              Zero-Config Verified
            </h4>
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
              This template includes Full Source Code, Production-Ready Page Object Model, CI/CD
              workflows, and externalized data configuration.
            </p>
          </div>
        </div>

        {/* Configuration Summary - Compact List Style */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {configItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5 border-b border-muted/30 last:border-0"
                >
                  <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {item.value}
                  </Badge>
                </div>
              ))}

              {/* Utilities as separate row */}
              {enabledUtilities.length > 0 && (
                <div className="flex items-start justify-between py-1.5 pt-3">
                  <span className="text-sm font-medium text-muted-foreground">Utilities</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                    {enabledUtilities.map((util) => (
                      <Badge key={util} variant="secondary" className="text-xs">
                        {util.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generation info */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-center">
            {isGenerating
              ? 'Generating your project...'
              : "Click 'Generate and Download Project' to download your project"}
          </p>
        </div>
      </div>
    </WizardStep>
  );
}
