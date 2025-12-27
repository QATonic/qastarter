import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Package, Keyboard, RefreshCw, Download, Loader2, Settings, FileJson, Camera, FileText, Database, Monitor, Smartphone, Server, MonitorSmartphone, Code2, Layers, TestTube, Wrench, GitBranch, BarChart3, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ProgressBar from "./ProgressBar";
import WizardStep from "./WizardStep";
import ProjectPreview from "./ProjectPreview";
import HelpTooltip from "./HelpTooltip";
import { ErrorAlert } from "./ErrorAlert";
import { getHelpContent } from "@/lib/helpContent";
import { WizardValidator, validationLabels } from "../../../shared/validationMatrix";
import { useConfigPersistence } from "@/hooks/useConfigPersistence";
import { ResumeDialog } from "./ResumeDialog";
import { ErrorMessages, ErrorTitles, getErrorMessage, getErrorTitle } from "@/lib/errorMessages";

interface WizardConfig {
  testingType: string;
  framework: string;
  language: string;
  testingPattern: string;
  testRunner: string;
  buildTool: string;
  projectName: string;
  groupId?: string;
  artifactId?: string;
  cicdTool: string;
  reportingTool: string;
  utilities: {
    configReader: boolean;
    jsonReader: boolean;
    screenshotUtility: boolean;
    logger: boolean;
    dataProvider: boolean;
  };
  dependencies: string[];
}

interface WizardProps {
  onComplete: (config: WizardConfig) => void;
  onBack: () => void;
}

interface DependenciesStepProps {
  config: WizardConfig;
  onNext: () => void;
  onPrevious: () => void;
  stepNumber: number;
  totalSteps: number;
}

function DependenciesStep({ config, onNext, onPrevious, stepNumber, totalSteps }: DependenciesStepProps) {
  const { data: dependenciesData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/project-dependencies', config],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/project-dependencies', config);
      return await response.json();
    },
    enabled: !!config.testingType && !!config.framework && !!config.language && !!config.testRunner && !!config.buildTool,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const dependencies = dependenciesData?.data?.dependencies || {};
  const buildTool = dependenciesData?.data?.buildTool || config.buildTool;
  const language = dependenciesData?.data?.language || config.language;

  const getBuildToolLabel = (tool: string): string => {
    const labels: Record<string, string> = {
      'maven': 'Maven',
      'gradle': 'Gradle',
      'npm': 'npm',
      'pip': 'pip',
      'nuget': 'NuGet',
      'dotnet-cli': '.NET CLI',
      'spm': 'Swift Package Manager'
    };
    return labels[tool] || tool;
  };

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
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      title="Project Dependencies"
      description={getDescription()}
      onNext={onNext}
      onPrevious={onPrevious}
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
            <p className="text-sm font-medium text-muted-foreground">Dependencies auto-configured</p>
            <p className="text-xs text-muted-foreground mt-1">Dependencies will be automatically set up during project generation</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm">
                Build Tool: <span className="font-semibold text-primary">{getBuildToolLabel(buildTool)}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(dependencies).map(([name, version]) => (
                <div 
                  key={name} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
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
                  These {Object.keys(dependencies).length} {Object.keys(dependencies).length === 1 ? 'dependency' : 'dependencies'} will be automatically included in your {getBuildToolLabel(buildTool)} configuration file
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}

export default function Wizard({ onComplete, onBack }: WizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<WizardConfig>({
    testingType: "",
    framework: "",
    language: "",
    testingPattern: "",
    testRunner: "",
    buildTool: "",
    projectName: "",
    groupId: "",
    artifactId: "",
    cicdTool: "",
    reportingTool: "",
    utilities: {
      configReader: true,
      jsonReader: false,
      screenshotUtility: true,
      logger: true,
      dataProvider: false,
    },
    dependencies: [],
  });

  // Configuration persistence
  const persistence = useConfigPersistence();
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedTimestamp, setSavedTimestamp] = useState(0);
  const isInitialMount = useRef(true);
  const hasResumedOrStartedFresh = useRef(false);

  // Check for saved configuration on mount
  useEffect(() => {
    if (isInitialMount.current) {
      const saved = persistence.loadConfig();
      if (saved) {
        setSavedTimestamp(saved.timestamp);
        setShowResumeDialog(true);
      } else {
        // No saved config, allow auto-save immediately
        hasResumedOrStartedFresh.current = true;
      }
      isInitialMount.current = false;
    }
  }, []);

  // Auto-save configuration on changes (debounced)
  // Only save after user has explicitly resumed or started fresh
  useEffect(() => {
    if (hasResumedOrStartedFresh.current && !showResumeDialog) {
      const timer = setTimeout(() => {
        persistence.saveConfig(config, currentStep);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [config, currentStep, showResumeDialog]);

  // Handle resume configuration
  const handleResume = () => {
    const saved = persistence.loadConfig();
    if (saved) {
      setConfig(saved.config as WizardConfig);
      setCurrentStep(saved.currentStep);
      toast({
        title: "Configuration Restored",
        description: `Your previous configuration has been loaded. Resuming at step ${saved.currentStep + 1}.`,
      });
    }
    hasResumedOrStartedFresh.current = true;
    setShowResumeDialog(false);
  };

  // Handle start fresh
  const handleStartFresh = () => {
    persistence.clearConfig();
    hasResumedOrStartedFresh.current = true;
    setShowResumeDialog(false);
    toast({
      title: "Starting Fresh",
      description: "Previous configuration cleared.",
    });
  };

  const steps = [
    "Testing Type",
    "Framework",
    "Language", 
    "Testing Pattern",
    "Test Runner",
    "Build Tool",
    "Project Metadata",
    "CI/CD",
    "Reporting",
    "Utilities",
    "Dependencies",
    "Summary"
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: return config.testingType !== "";
      case 1: return config.framework !== "";
      case 2: return config.language !== "";
      case 3: return config.testingPattern !== "";
      case 4: return config.testRunner !== "";
      case 5: return config.buildTool !== "";
      case 6: {
        // Project metadata validation with regex enforcement
        const projectName = config.projectName.trim();
        
        // Validate project name
        if (!projectName) return false;
        if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) return false;
        if (projectName.length > 100) return false;
        
        // For Java projects (Maven/Gradle), also validate groupId and artifactId
        const isJavaProject = config.language === "java";
        const needsJavaMetadata = isJavaProject && (config.buildTool === "maven" || config.buildTool === "gradle");
        
        if (needsJavaMetadata) {
          const groupId = config.groupId?.trim() || "";
          const artifactId = config.artifactId?.trim() || "";
          
          if (!groupId || !/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(groupId)) return false;
          if (!artifactId || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(artifactId)) return false;
        }
        
        return true;
      }
      case 7: return true; // CI/CD is optional, so always valid
      case 8: return true; // Reporting is optional, so always valid
      default: return true;
    }
  };

  // Update config and reset invalid downstream selections
  const updateConfig = (key: string, value: any) => {
    let newConfig = { ...config, [key]: value };
    
    // Auto-populate Java metadata defaults when selecting Java language or Maven/Gradle build tool
    if (key === "language" && value === "java") {
      // Set default groupId and artifactId if not already set
      if (!newConfig.groupId) {
        newConfig.groupId = "com.qastarter";
      }
      if (!newConfig.artifactId) {
        newConfig.artifactId = newConfig.projectName 
          ? newConfig.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          : "qa-automation";
      }
    }
    
    // Sync artifactId with projectName for Java projects
    if (key === "projectName" && newConfig.language === "java" && (newConfig.buildTool === "maven" || newConfig.buildTool === "gradle")) {
      newConfig.artifactId = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }
    
    const validatedConfig = WizardValidator.resetInvalidSelections(newConfig);
    setConfig(validatedConfig);

    // Show toast if selections were reset
    if (JSON.stringify(newConfig) !== JSON.stringify(validatedConfig)) {
      toast({
        title: "Selections Updated",
        description: "Some selections were automatically updated due to compatibility requirements.",
        variant: "default",
      });
    }
  };

  // Get filtered options for current step
  const getFilteredOptions = (step: string): string[] => {
    return WizardValidator.getFilteredOptions(step, config);
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleProjectGeneration();
    }
  };

  const handleProjectGeneration = async () => {
    setIsGenerating(true);
    try {
      await onComplete(config);
    } catch (error) {
      const errorTitle = getErrorTitle(error);
      const errorMessage = getErrorMessage(error);
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={handleProjectGeneration}
            className="gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </Button>
        ),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStepNavigation = (stepIndex: number) => {
    // Only allow navigation to completed steps or the next immediate step
    if (stepIndex <= currentStep || completedSteps.includes(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };


  const toggleArrayValue = (array: string[], value: string): string[] => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  const renderStepContent = () => {
    // Icon mapping for testing types
    const testingTypeIcons: Record<string, React.ElementType> = {
      web: Monitor,
      mobile: Smartphone,
      api: Server,
      desktop: MonitorSmartphone,
    };

    // Icon mapping for frameworks
    const frameworkIcons: Record<string, React.ElementType> = {
      selenium: Globe,
      playwright: Layers,
      cypress: Layers,
      appium: Smartphone,
      webdriverio: Globe,
      restassured: Server,
      requests: Server,
      supertest: Server,
      restsharp: Server,
      winappdriver: MonitorSmartphone,
      pyautogui: MonitorSmartphone,
      espresso: Smartphone,
      xcuitest: Smartphone,
    };

    // Icon mapping for languages
    const languageIcons: Record<string, React.ElementType> = {
      java: Code2,
      python: Code2,
      javascript: Code2,
      typescript: Code2,
      csharp: Code2,
      swift: Code2,
    };

    switch (currentStep) {
      case 0: // Testing Type
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Testing Type"
            description="Select the primary type of testing for your project"
            onNext={handleNext}
            onPrevious={currentStep > 0 ? handlePrevious : onBack}
            canGoPrevious={true}
          >
            <div className="space-y-3">
              <RadioGroup 
                value={config.testingType} 
                onValueChange={(value) => updateConfig("testingType", value)}
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
                        ${isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                      `}
                      onClick={() => updateConfig("testingType", key)}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
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
                          <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{label}</Label>
                          <HelpTooltip content={getHelpContent(key)} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
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
                    {getFilteredOptions('framework').map(framework => (
                      <Badge key={framework} variant="secondary" className="text-xs">
                        {validationLabels.frameworks[framework as keyof typeof validationLabels.frameworks]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </WizardStep>
        );

      case 1: { // Framework
        const availableFrameworks = getFilteredOptions('framework');
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Testing Framework"
            description="Choose the testing framework for your project"
            onNext={handleNext}
            onPrevious={handlePrevious}
          >
            <div className="space-y-3">
              {!config.testingType && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please select a testing type first to see available frameworks.
                  </span>
                </div>
              )}
              
              <RadioGroup 
                value={config.framework} 
                onValueChange={(value) => updateConfig("framework", value)}
                disabled={!config.testingType}
                className="grid gap-3"
              >
                {availableFrameworks.map((framework) => {
                  const Icon = frameworkIcons[framework] || Layers;
                  const isSelected = config.framework === framework;
                  return (
                    <div 
                      key={framework} 
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                        ${!config.testingType ? 'opacity-50 pointer-events-none' : ''}
                      `}
                      onClick={() => config.testingType && updateConfig("framework", framework)}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={framework} 
                            id={framework}
                            data-testid={`radio-${framework}`}
                            className="sr-only"
                          />
                          <Label htmlFor={framework} className="text-sm font-medium cursor-pointer">
                            {validationLabels.frameworks[framework as keyof typeof validationLabels.frameworks]}
                          </Label>
                          <HelpTooltip content={getHelpContent(framework)} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
              
              {config.framework && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Available Languages:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getFilteredOptions('language').map(language => (
                      <Badge key={language} variant="secondary" className="text-xs">
                        {validationLabels.languages[language as keyof typeof validationLabels.languages]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </WizardStep>
        );
      }

      case 2: { // Language
        const availableLanguages = getFilteredOptions('language');
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Programming Language"
            description="Select the programming language for your project"
            onNext={handleNext}
            onPrevious={handlePrevious}
          >
            <div className="space-y-3">
              {!config.framework && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please select a testing framework first to see compatible languages.
                  </span>
                </div>
              )}
              
              <RadioGroup
                value={config.language}
                onValueChange={(value) => updateConfig("language", value)}
                disabled={!config.framework}
                className="grid gap-3"
              >
                {availableLanguages.map((language) => {
                  const Icon = languageIcons[language] || Code2;
                  const isSelected = config.language === language;
                  return (
                    <div 
                      key={language} 
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                        ${!config.framework ? 'opacity-50 pointer-events-none' : ''}
                      `}
                      onClick={() => config.framework && updateConfig("language", language)}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={language} 
                            id={language}
                            data-testid={`radio-${language}`}
                            className="sr-only"
                          />
                          <Label htmlFor={language} className="text-sm font-medium cursor-pointer">
                            {validationLabels.languages[language as keyof typeof validationLabels.languages]}
                          </Label>
                          <HelpTooltip content={getHelpContent(language)} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
              
              {config.language && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Available Test Runners:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getFilteredOptions('testRunner').map(runner => (
                      <Badge key={runner} variant="secondary" className="text-xs">
                        {validationLabels.testRunners[runner as keyof typeof validationLabels.testRunners]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </WizardStep>
        );
      }

      case 3: { // Testing Pattern
        const availableTestingPatterns = getFilteredOptions('testingPattern');
        
        // Icon mapping for testing patterns
        const patternIcons: Record<string, React.ElementType> = {
          pom: Layers,
          'page-object': Layers,
          bdd: FileText,
          'data-driven': Database,
        };
        
        // Pattern labels
        const patternLabels: Record<string, string> = {
          pom: 'Page Object Model (POM)',
          'page-object': 'Page Object Model',
          bdd: 'Behavior Driven Development (BDD)',
          'data-driven': 'Data Driven Testing',
        };
        
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Testing Pattern"
            description="Choose your testing architecture pattern"
            onNext={handleNext}
            onPrevious={handlePrevious}
          >
            <div className="space-y-3">
              {!config.framework && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please select a testing framework first to see compatible patterns.
                  </span>
                </div>
              )}
              
              <RadioGroup
                value={config.testingPattern}
                onValueChange={(value) => updateConfig("testingPattern", value)}
                disabled={!config.framework}
                className="grid gap-3"
              >
                {availableTestingPatterns.map((pattern) => {
                  const Icon = patternIcons[pattern] || Layers;
                  const isSelected = config.testingPattern === pattern;
                  return (
                    <div 
                      key={pattern} 
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                        ${!config.framework ? 'opacity-50 pointer-events-none' : ''}
                      `}
                      onClick={() => config.framework && updateConfig("testingPattern", pattern)}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={pattern} 
                            id={pattern}
                            data-testid={`radio-${pattern}`}
                            className="sr-only"
                          />
                          <Label htmlFor={pattern} className="text-sm font-medium cursor-pointer">
                            {patternLabels[pattern] || pattern.replace(/-/g, ' ')}
                          </Label>
                          <HelpTooltip content={getHelpContent(pattern)} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </WizardStep>
        );
      }

      case 4: { // Test Runner
        const availableTestRunners = getFilteredOptions('testRunner');
        
        // Icon mapping for test runners
        const testRunnerIcons: Record<string, React.ElementType> = {
          testng: TestTube,
          junit5: TestTube,
          pytest: TestTube,
          jest: TestTube,
          mocha: TestTube,
          nunit: TestTube,
          xctest: TestTube,
          cypress: TestTube,
        };
        
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Test Runner"
            description="Choose your test runner"
            onNext={handleNext}
            onPrevious={handlePrevious}
          >
            <div className="space-y-3">
              {!config.language && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please select a programming language first to see compatible test runners.
                  </span>
                </div>
              )}
              
              <RadioGroup
                value={config.testRunner}
                onValueChange={(value) => updateConfig("testRunner", value)}
                disabled={!config.language}
                className="grid gap-3"
              >
                {availableTestRunners.map((runner) => {
                  const Icon = testRunnerIcons[runner] || TestTube;
                  const isSelected = config.testRunner === runner;
                  return (
                    <div 
                      key={runner} 
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                        ${!config.language ? 'opacity-50 pointer-events-none' : ''}
                      `}
                      onClick={() => config.language && updateConfig("testRunner", runner)}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={runner} 
                            id={runner}
                            data-testid={`radio-${runner}`}
                            className="sr-only"
                          />
                          <Label htmlFor={runner} className="text-sm font-medium cursor-pointer">
                            {validationLabels.testRunners[runner as keyof typeof validationLabels.testRunners]}
                          </Label>
                          <HelpTooltip content={getHelpContent(runner)} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
              
              {config.testRunner && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Available Build Tools:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getFilteredOptions('buildTool').map(tool => (
                      <Badge key={tool} variant="secondary" className="text-xs">
                        {validationLabels.buildTools[tool as keyof typeof validationLabels.buildTools]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </WizardStep>
        );
      }

      case 5: { // Build Tool
        const availableBuildTools = getFilteredOptions('buildTool');
        
        // Icon mapping for build tools
        const buildToolIcons: Record<string, React.ElementType> = {
          maven: Wrench,
          gradle: Wrench,
          npm: Wrench,
          pip: Wrench,
          nuget: Wrench,
          'dotnet-cli': Wrench,
          spm: Wrench,
        };
        
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Build Tool"
            description="Choose your build tool"
            onNext={handleNext}
            onPrevious={handlePrevious}
          >
            <div className="space-y-3">
              {!config.language && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please select a programming language first to see compatible build tools.
                  </span>
                </div>
              )}
              
              <RadioGroup
                value={config.buildTool}
                onValueChange={(value) => updateConfig("buildTool", value)}
                disabled={!config.language}
                className="grid gap-3"
              >
                {availableBuildTools.map((tool) => {
                  const Icon = buildToolIcons[tool] || Wrench;
                  const isSelected = config.buildTool === tool;
                  return (
                    <div 
                      key={tool} 
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                        ${!config.language ? 'opacity-50 pointer-events-none' : ''}
                      `}
                      onClick={() => config.language && updateConfig("buildTool", tool)}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={tool} 
                            id={tool}
                            data-testid={`radio-${tool}`}
                            className="sr-only"
                          />
                          <Label htmlFor={tool} className="text-sm font-medium cursor-pointer">
                            {validationLabels.buildTools[tool as keyof typeof validationLabels.buildTools]}
                          </Label>
                          <HelpTooltip content={getHelpContent(tool)} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </WizardStep>
        );
      }

      case 6: { // Project Metadata
        const projectNameError = (() => {
          const name = config.projectName.trim();
          if (!name) return "Project name is required";
          if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            return "Project name can only contain letters, numbers, hyphens, and underscores";
          }
          if (name.length > 100) return "Project name must be less than 100 characters";
          return "";
        })();

        // Java projects (Maven/Gradle) need groupId and artifactId
        const isJavaProject = config.language === "java";
        const needsJavaMetadata = isJavaProject && (config.buildTool === "maven" || config.buildTool === "gradle");

        const groupIdError = needsJavaMetadata && (() => {
          const groupId = config.groupId?.trim() || "";
          if (!groupId) return "Group ID is required for Java projects";
          if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(groupId)) {
            return "Group ID must follow reverse domain notation (e.g., com.example.app)";
          }
          return "";
        })();

        const artifactIdError = needsJavaMetadata && (() => {
          const artifactId = config.artifactId?.trim() || "";
          if (!artifactId) return "Artifact ID is required for Java projects";
          if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(artifactId)) {
            return "Artifact ID should be lowercase with hyphens (e.g., my-qa-project)";
          }
          return "";
        })();

        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Project Metadata"
            description="Configure your project details"
            onNext={handleNext}
            onPrevious={handlePrevious}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={config.projectName}
                  onChange={(e) => updateConfig("projectName", e.target.value)}
                  placeholder="my-qa-project"
                  data-testid="input-project-name"
                  className={projectNameError ? "border-destructive" : ""}
                />
                {projectNameError && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1" data-testid="error-project-name">
                    <AlertCircle className="h-3 w-3" />
                    {projectNameError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Name for your project folder and ZIP file
                </p>
              </div>
              {needsJavaMetadata && (
                <>
                  <div>
                    <Label htmlFor="groupId">Group ID *</Label>
                    <Input
                      id="groupId"
                      value={config.groupId}
                      onChange={(e) => updateConfig("groupId", e.target.value)}
                      placeholder="com.company.qa"
                      data-testid="input-group-id"
                      className={groupIdError ? "border-destructive" : ""}
                    />
                    {groupIdError && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1" data-testid="error-group-id">
                        <AlertCircle className="h-3 w-3" />
                        {groupIdError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Java package prefix (reverse domain notation)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="artifactId">Artifact ID *</Label>
                    <Input
                      id="artifactId"
                      value={config.artifactId}
                      onChange={(e) => updateConfig("artifactId", e.target.value)}
                      placeholder="qa-automation"
                      data-testid="input-artifact-id"
                      className={artifactIdError ? "border-destructive" : ""}
                    />
                    {artifactIdError && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1" data-testid="error-artifact-id">
                        <AlertCircle className="h-3 w-3" />
                        {artifactIdError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Maven/Gradle artifact identifier (lowercase with hyphens)
                    </p>
                  </div>
                </>
              )}
            </div>
          </WizardStep>
        );
      }

      case 7: { // CI/CD
        const availableCicdTools = getFilteredOptions('cicdTool');
        
        // Icon mapping for CI/CD tools
        const cicdIcons: Record<string, React.ElementType> = {
          'github-actions': GitBranch,
          jenkins: GitBranch,
          gitlab: GitBranch,
          circleci: GitBranch,
          'azure-devops': GitBranch,
          none: GitBranch,
        };
        
        // CI/CD labels
        const cicdLabels: Record<string, string> = {
          'github-actions': 'GitHub Actions',
          jenkins: 'Jenkins',
          gitlab: 'GitLab CI',
          circleci: 'CircleCI',
          'azure-devops': 'Azure DevOps',
          none: 'None (Skip CI/CD)',
        };
        
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="CI/CD Integration"
            description="Select a CI/CD tool for your project"
            onNext={handleNext}
            onPrevious={handlePrevious}
          >
            <div className="space-y-3">
              {!config.framework && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please select a testing framework first to see compatible CI/CD tools.
                  </span>
                </div>
              )}
              
              <RadioGroup
                value={config.cicdTool}
                onValueChange={(value) => updateConfig("cicdTool", value)}
                disabled={!config.framework}
                className="grid gap-3"
              >
                {availableCicdTools.map((tool) => {
                  const Icon = cicdIcons[tool] || GitBranch;
                  const isSelected = config.cicdTool === tool;
                  return (
                    <div 
                      key={tool} 
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                        ${!config.framework ? 'opacity-50 pointer-events-none' : ''}
                      `}
                      onClick={() => config.framework && updateConfig("cicdTool", tool)}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={tool} 
                            id={tool}
                            data-testid={`radio-${tool}`}
                            className="sr-only"
                          />
                          <Label htmlFor={tool} className="text-sm font-medium cursor-pointer">
                            {cicdLabels[tool] || tool.replace(/-/g, ' ')}
                          </Label>
                          <HelpTooltip content={getHelpContent(tool)} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </WizardStep>
        );
      }

      case 8: { // Reporting
        const availableReportingTools = getFilteredOptions('reportingTool');
        
        // Icon mapping for reporting tools
        const reportingIcons: Record<string, React.ElementType> = {
          allure: BarChart3,
          'extent-reports': BarChart3,
          'html-report': BarChart3,
          'pytest-html': BarChart3,
          mochawesome: BarChart3,
          specflow: BarChart3,
          none: BarChart3,
        };
        
        // Reporting labels
        const reportingLabels: Record<string, string> = {
          allure: 'Allure Report',
          'extent-reports': 'Extent Reports',
          'html-report': 'HTML Report',
          'pytest-html': 'pytest-html',
          mochawesome: 'Mochawesome',
          specflow: 'SpecFlow+ LivingDoc',
          none: 'None (Skip Reporting)',
        };
        
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Reporting Tools"
            description="Select a reporting tool for your project"
            onNext={handleNext}
            onPrevious={handlePrevious}
          >
            <div className="space-y-3">
              {!config.framework && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please select a testing framework first to see compatible reporting tools.
                  </span>
                </div>
              )}
              
              <RadioGroup
                value={config.reportingTool}
                onValueChange={(value) => updateConfig("reportingTool", value)}
                disabled={!config.framework}
                className="grid gap-3"
              >
                {availableReportingTools.map((tool) => {
                  const Icon = reportingIcons[tool] || BarChart3;
                  const isSelected = config.reportingTool === tool;
                  return (
                    <div 
                      key={tool} 
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                        ${!config.framework ? 'opacity-50 pointer-events-none' : ''}
                      `}
                      onClick={() => config.framework && updateConfig("reportingTool", tool)}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={tool} 
                            id={tool}
                            data-testid={`radio-${tool}`}
                            className="sr-only"
                          />
                          <Label htmlFor={tool} className="text-sm font-medium cursor-pointer">
                            {reportingLabels[tool] || tool.replace(/-/g, ' ')}
                          </Label>
                          <HelpTooltip content={getHelpContent(tool)} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </WizardStep>
        );
      }

      case 9: // Utilities
        const utilityItems = [
          { 
            key: 'configReader',
            name: "Configuration Reader", 
            description: "Manage test environment configurations",
            icon: Settings,
            recommended: true
          },
          { 
            key: 'logger',
            name: "Logger", 
            description: "Enhanced logging for debugging",
            icon: FileText,
            recommended: true
          },
          { 
            key: 'screenshotUtility',
            name: "Screenshot Utility", 
            description: "Capture screenshots during test execution",
            icon: Camera,
            recommended: config.testingType === 'web' || config.testingType === 'mobile' || config.testingType === 'desktop'
          },
          { 
            key: 'jsonReader',
            name: "JSON Reader", 
            description: "Parse and read JSON data files",
            icon: FileJson,
            recommended: false
          },
          { 
            key: 'dataProvider',
            name: "Data Provider", 
            description: "Manage test data providers",
            icon: Database,
            recommended: false
          }
        ];

        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Project Utilities"
            description="Select utility components to include in your framework"
            onNext={handleNext}
            onPrevious={handlePrevious}
            showSkip={false}
          >
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Recommended utilities are pre-selected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These utilities enhance your framework with essential functionality
                  </p>
                </div>
              </div>

              {/* Utilities Grid */}
              <div className="grid gap-3">
                {utilityItems.map(({ key, name, description, icon: Icon, recommended }) => {
                  const isEnabled = config.utilities[key as keyof typeof config.utilities];
                  return (
                    <div 
                      key={key} 
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer
                        ${isEnabled 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-muted/30 hover:border-muted-foreground/20'
                        }
                      `}
                      onClick={() => updateConfig("utilities", { ...config.utilities, [key]: !isEnabled })}
                    >
                      {/* Icon */}
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                        ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label 
                            htmlFor={key} 
                            className={`text-sm font-medium cursor-pointer ${isEnabled ? 'text-foreground' : ''}`}
                          >
                            {name}
                          </Label>
                          {recommended && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                              Recommended
                            </Badge>
                          )}
                          <HelpTooltip content={getHelpContent(key)} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      </div>
                      
                      {/* Switch */}
                      <Switch
                        id={key}
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          updateConfig("utilities", { ...config.utilities, [key]: checked })
                        }
                        data-testid={`switch-utility-${key}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <span className="text-sm text-muted-foreground">
                  Selected utilities
                </span>
                <Badge variant="outline" className="font-mono">
                  {Object.values(config.utilities).filter(Boolean).length} / {Object.keys(config.utilities).length}
                </Badge>
              </div>
            </div>
          </WizardStep>
        );

      case 10: // Dependencies
        return <DependenciesStep config={config} onNext={handleNext} onPrevious={handlePrevious} stepNumber={currentStep} totalSteps={steps.length} />;

      case 11: // Summary
        return (
          <WizardStep
            stepNumber={currentStep}
            totalSteps={steps.length}
            title="Summary"
            description="Review your configuration and download your project"
            onNext={handleProjectGeneration}
            onPrevious={handlePrevious}
            isLastStep={true}
            canGoNext={!isGenerating}
          >
            <div className="space-y-6">
              <ProjectPreview
                projectName={config.projectName}
                configuration={config}
                onDownload={handleProjectGeneration}
                isGenerating={isGenerating}
                hideDownloadButton={true}
              />
              
              <div className="border-t pt-6">
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <Download className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Download as ZIP file</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your project will be downloaded as a ZIP archive. Extract it and push to your preferred Git repository (GitHub, GitLab, Azure DevOps, Bitbucket, etc.).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </WizardStep>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <ProgressBar
            currentStep={currentStep}
            totalSteps={steps.length}
            steps={steps}
            onStepClick={handleStepNavigation}
            completedSteps={completedSteps}
          />
          
          {/* Keyboard Shortcuts Helper */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard shortcuts available</span>
              <HelpTooltip 
                content={getHelpContent('keyboardShortcuts')} 
                side="left"
                iconSize="sm"
              />
            </div>
          </div>
          
          {/* Resume Dialog */}
          <ResumeDialog
            open={showResumeDialog}
            onResume={handleResume}
            onStartFresh={handleStartFresh}
            timestamp={savedTimestamp}
          />
          
          <div className="mt-8">
            {isGenerating ? (
              <Card className="w-full">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">Generating Your Project</h3>
                      <p className="text-muted-foreground">
                        Creating project structure, dependencies, and sample code...
                      </p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This usually takes a few seconds. Your download will start automatically.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              renderStepContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}