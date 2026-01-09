/**
 * Dependencies Step - Review project dependencies
 */

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, CheckCircle2 } from 'lucide-react';
import WizardStep from '../../WizardStep';
import { ErrorAlert } from '../../ErrorAlert';
import { ErrorMessages, ErrorTitles } from '@/lib/errorMessages';
import { apiRequest } from '@/lib/queryClient';
import { useWizard } from '../WizardContext';

const buildToolLabels: Record<string, string> = {
  maven: 'Maven',
  gradle: 'Gradle',
  npm: 'npm',
  pip: 'pip',
  nuget: 'NuGet',
  'dotnet-cli': '.NET CLI',
  spm: 'Swift Package Manager',
};

export default function DependenciesStep() {
  const { config, handleNext, handlePrevious, currentStep, steps } = useWizard();

  const {
    data: dependenciesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/project-dependencies', config],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/project-dependencies', config);
      return await response.json();
    },
    enabled:
      !!config.testingType &&
      !!config.framework &&
      !!config.language &&
      !!config.testRunner &&
      !!config.buildTool,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const dependencies = dependenciesData?.data?.dependencies || {};
  const buildTool = dependenciesData?.data?.buildTool || config.buildTool;

  // Generate dynamic description based on user selections
  const getDescription = (): string => {
    const parts = [];
    if (config.framework) parts.push(config.framework);
    if (config.language) parts.push(config.language);
    if (config.testRunner) parts.push(config.testRunner);
    if (config.reportingTool) parts.push(config.reportingTool.replace('-', ' '));
    if (config.testingPattern === 'bdd') parts.push('BDD/Cucumber');

    return parts.length > 0
      ? `Dependencies for your ${parts.join(' + ')} setup`
      : 'Review the dependencies that will be included in your project';
  };

  return (
    <WizardStep
      stepNumber={currentStep}
      totalSteps={steps.length}
      title="Project Dependencies"
      description={getDescription()}
      onNext={handleNext}
      onPrevious={handlePrevious}
      showSkip={false}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : error ? (
          <ErrorAlert
            title={ErrorTitles.DEPENDENCIES}
            message={ErrorMessages.DEPENDENCIES_LOAD_FAILED}
            onRetry={() => refetch()}
            showRetry={true}
          />
        ) : Object.keys(dependencies).length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Dependencies auto-configured
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Dependencies will be automatically set up during project generation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm">
                Build Tool:{' '}
                <span className="font-semibold text-primary">
                  {buildToolLabels[buildTool] || buildTool}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(dependencies).map(([name, version]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  data-testid={`dependency-${name}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">
                    v{version as string}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Auto-configured dependencies</p>
                <p className="text-xs text-muted-foreground mt-1">
                  These {Object.keys(dependencies).length}{' '}
                  {Object.keys(dependencies).length === 1 ? 'dependency' : 'dependencies'} will be
                  automatically included in your {buildToolLabels[buildTool] || buildTool}{' '}
                  configuration file
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
