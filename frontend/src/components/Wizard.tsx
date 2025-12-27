import React, { useState, useEffect, useCallback } from 'react';
import { WizardState, WizardStep, OptionData } from '../types/wizard';
import { getWizardOptions, getFilteredOptions } from '../data/wizardOptions';
import { apiService } from '../services/api';
import { validateProjectName, validateGroupId, validateArtifactId, validatePackageName } from '../utils/validation';
import ProgressIndicator from './ProgressIndicator';
import WizardStepComponent from './WizardStep';
import ProjectPreview from './ProjectPreview';
import FormField from './FormField';
import OptionGroup from './OptionGroup';

interface WizardProps {
  onReset: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const Wizard: React.FC<WizardProps> = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [wizardOptions, setWizardOptions] = useState<OptionData | null>(null);
  const [wizardState, setWizardState] = useState<WizardState>({
    testingType: '',
    methodology: '',
    tool: '',
    language: '',
    buildTool: '',
    testRunner: '',
    scenarios: [],
    config: {
      projectName: 'my-qa-project',
      groupId: 'com.qastarter',
      artifactId: 'my-qa-project',
      packageName: 'com.qastarter.demo'
    },
    integrations: {
      cicd: '',
      reporting: '',
      others: []
    },
    dependencies: []
  });

  const steps: WizardStep[] = [
    { id: 'testing-type', title: 'Testing Type', description: 'Select your testing approach', completed: false },
    { id: 'methodology', title: 'Methodology', description: 'Choose your testing methodology', completed: false },
    { id: 'tool', title: 'Tool', description: 'Select your automation tool', completed: false },
    { id: 'language', title: 'Language', description: 'Choose programming language', completed: false },
    { id: 'build-tool', title: 'Build Tool', description: 'Select your build tool', completed: false },
    { id: 'test-runner', title: 'Test Runner', description: 'Choose your test runner', completed: false },
    { id: 'scenarios', title: 'Scenarios', description: 'Select sample test scenarios', completed: false },
    { id: 'config', title: 'Configuration', description: 'Configure your project', completed: false },
    { id: 'integrations', title: 'Integrations', description: 'Add CI/CD and reporting tools', completed: false },
    { id: 'dependencies', title: 'Dependencies', description: 'Select additional dependencies', completed: false },
    { id: 'review', title: 'Review', description: 'Review and generate', completed: false }
  ];

  // Load wizard options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoading(true);
        const options = await getWizardOptions();
        setWizardOptions(options);
      } catch (error) {
        console.error('Failed to load wizard options:', error);
        // Component will handle null wizardOptions gracefully
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, []);

  const updateWizardState = useCallback((updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
    // Clear validation errors when values change
    if (updates.config) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(updates.config || {}).forEach(key => {
          delete newErrors[key];
        });
        return newErrors;
      });
    }
  }, []);

  const validateCurrentStep = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (currentStep === 7) { // Configuration step
      const projectNameValidation = validateProjectName(wizardState.config.projectName);
      if (!projectNameValidation.isValid) {
        errors.projectName = projectNameValidation.error!;
      }
      
      if (wizardState.language === 'Java') {
        const groupIdValidation = validateGroupId(wizardState.config.groupId);
        if (!groupIdValidation.isValid) {
          errors.groupId = groupIdValidation.error!;
        }
        
        const artifactIdValidation = validateArtifactId(wizardState.config.artifactId);
        if (!artifactIdValidation.isValid) {
          errors.artifactId = artifactIdValidation.error!;
        }
        
        const packageNameValidation = validatePackageName(wizardState.config.packageName);
        if (!packageNameValidation.isValid) {
          errors.packageName = packageNameValidation.error!;
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset dependent fields when parent selections change
  useEffect(() => {
    if (wizardState.testingType && wizardOptions) {
      const loadFilteredTools = async () => {
        const availableTools = await getFilteredOptions('tools', wizardState, wizardOptions);
        if (!availableTools.includes(wizardState.tool)) {
          setWizardState(prev => ({ ...prev, tool: '', language: '', buildTool: '', testRunner: '' }));
        }
      };
      loadFilteredTools();
    }
  }, [wizardState.testingType, wizardState.tool, wizardOptions]);

  useEffect(() => {
    if (wizardState.tool && wizardOptions) {
      const loadFilteredLanguages = async () => {
        const availableLanguages = await getFilteredOptions('languages', wizardState, wizardOptions);
        if (!availableLanguages.includes(wizardState.language)) {
          setWizardState(prev => ({ ...prev, language: '', buildTool: '', testRunner: '' }));
        }
      };
      loadFilteredLanguages();
    }
  }, [wizardState.tool, wizardState.language, wizardOptions]);

  useEffect(() => {
    if (wizardState.language && wizardOptions) {
      const loadFilteredOptions = async () => {
        const availableBuildTools = await getFilteredOptions('buildTools', wizardState, wizardOptions);
        const availableTestRunners = await getFilteredOptions('testRunners', wizardState, wizardOptions);
        
        if (!availableBuildTools.includes(wizardState.buildTool)) {
          setWizardState(prev => ({ ...prev, buildTool: '' }));
        }
        if (!availableTestRunners.includes(wizardState.testRunner)) {
          setWizardState(prev => ({ ...prev, testRunner: '' }));
        }
      };
      loadFilteredOptions();
    }
  }, [wizardState.language, wizardState.buildTool, wizardState.testRunner, wizardOptions]);

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 0: return wizardState.testingType !== '';
      case 1: return wizardState.methodology !== '';
      case 2: return wizardState.tool !== '';
      case 3: return wizardState.language !== '';
      case 4: return wizardState.buildTool !== '';
      case 5: return wizardState.testRunner !== '';
      case 6: return wizardState.scenarios.length > 0;
      case 7: return wizardState.config.projectName !== '' && Object.keys(validationErrors).length === 0;
      case 8: return true; // Integrations are optional
      case 9: return true; // Dependencies are optional
      case 10: return true; // Review step
      default: return false;
    }
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Generate project
      await handleGenerateProject();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with form inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
        return;
      }

      if (event.key === 'ArrowRight' && canGoNext()) {
        event.preventDefault();
        handleNext();
      } else if (event.key === 'ArrowLeft' && currentStep > 0) {
        event.preventDefault();
        handlePrevious();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, canGoNext]);

  const handleGenerateProject = async () => {
    setIsGenerating(true);
    try {
      const result = await apiService.generateProject(wizardState);
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = `${wizardState.config.projectName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      alert(`Project generated successfully! 
      
Project ID: ${result.projectId}
Files: ${result.files.length}
Size: ${(result.size / 1024 / 1024).toFixed(2)} MB
      
The download should start automatically.`);
      
    } catch (error) {
      console.error('Error generating project:', error);
      alert(`Failed to generate project: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionChange = (stepField: keyof WizardState, value: string, checked: boolean) => {
    if (stepField === 'scenarios' || stepField === 'dependencies') {
      const currentArray = wizardState[stepField] as string[];
      const newArray = checked 
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);
      updateWizardState({ [stepField]: newArray });
    } else if (stepField === 'integrations') {
      // Handle integrations.others
      const currentOthers = wizardState.integrations.others;
      const newOthers = checked
        ? [...currentOthers, value]
        : currentOthers.filter(item => item !== value);
      updateWizardState({
        integrations: { ...wizardState.integrations, others: newOthers }
      });
    } else {
      updateWizardState({ [stepField]: value });
    }
  };

  const renderStepContent = () => {
    if (isLoading || !wizardOptions) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading options...</span>
        </div>
      );
    }

    switch (currentStep) {
      case 0: {
        const options = wizardOptions.testingTypes.map(type => ({
          value: type,
          label: type,
          description: getTestingTypeDescription(type)
        }));
        
        return (
          <OptionGroup
            legend="Select Testing Type"
            name="testingType"
            type="radio"
            options={options}
            selectedValues={wizardState.testingType ? [wizardState.testingType] : []}
            onChange={(value) => handleOptionChange('testingType', value, true)}
            required
          />
        );
      }
      
      case 1: {
        const options = wizardOptions.methodologies.map(methodology => ({
          value: methodology,
          label: methodology,
          description: getMethodologyDescription(methodology)
        }));
        
        return (
          <OptionGroup
            legend="Choose Testing Methodology"
            name="methodology"
            type="radio"
            options={options}
            selectedValues={wizardState.methodology ? [wizardState.methodology] : []}
            onChange={(value) => handleOptionChange('methodology', value, true)}
            required
          />
        );
      }
      
      case 2: {
        const [availableTools, setAvailableTools] = useState<string[]>([]);
        
        useEffect(() => {
          const loadTools = async () => {
            const tools = await getFilteredOptions('tools', wizardState, wizardOptions);
            setAvailableTools(tools);
          };
          loadTools();
        }, [wizardState.testingType]);
        
        const options = availableTools.map(tool => ({
          value: tool,
          label: tool,
          description: getToolDescription(tool)
        }));
        
        return (
          <OptionGroup
            legend="Select Automation Tool"
            name="tool"
            type="radio"
            options={options}
            selectedValues={wizardState.tool ? [wizardState.tool] : []}
            onChange={(value) => handleOptionChange('tool', value, true)}
            required
          />
        );
      }
      
      case 3: {
        const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
        
        useEffect(() => {
          const loadLanguages = async () => {
            const languages = await getFilteredOptions('languages', wizardState, wizardOptions);
            setAvailableLanguages(languages);
          };
          loadLanguages();
        }, [wizardState.testingType, wizardState.tool]);
        
        const options = availableLanguages.map(language => ({
          value: language,
          label: language,
          description: getLanguageDescription(language)
        }));
        
        return (
          <OptionGroup
            legend="Choose Programming Language"
            name="language"
            type="radio"
            options={options}
            selectedValues={wizardState.language ? [wizardState.language] : []}
            onChange={(value) => handleOptionChange('language', value, true)}
            required
          />
        );
      }
      
      case 4: {
        const [availableBuildTools, setAvailableBuildTools] = useState<string[]>([]);
        
        useEffect(() => {
          const loadBuildTools = async () => {
            const buildTools = await getFilteredOptions('buildTools', wizardState, wizardOptions);
            setAvailableBuildTools(buildTools);
          };
          loadBuildTools();
        }, [wizardState.language]);
        
        const options = availableBuildTools.map(buildTool => ({
          value: buildTool,
          label: buildTool,
          description: getBuildToolDescription(buildTool)
        }));
        
        return (
          <OptionGroup
            legend="Select Build Tool"
            name="buildTool"
            type="radio"
            options={options}
            selectedValues={wizardState.buildTool ? [wizardState.buildTool] : []}
            onChange={(value) => handleOptionChange('buildTool', value, true)}
            required
          />
        );
      }
      
      case 5: {
        const [availableTestRunners, setAvailableTestRunners] = useState<string[]>([]);
        
        useEffect(() => {
          const loadTestRunners = async () => {
            const testRunners = await getFilteredOptions('testRunners', wizardState, wizardOptions);
            setAvailableTestRunners(testRunners);
          };
          loadTestRunners();
        }, [wizardState.language]);
        
        const options = availableTestRunners.map(testRunner => ({
          value: testRunner,
          label: testRunner,
          description: getTestRunnerDescription(testRunner)
        }));
        
        return (
          <OptionGroup
            legend="Choose Test Runner"
            name="testRunner"
            type="radio"
            options={options}
            selectedValues={wizardState.testRunner ? [wizardState.testRunner] : []}
            onChange={(value) => handleOptionChange('testRunner', value, true)}
            required
          />
        );
      }
      
      case 6: {
        const [availableScenarios, setAvailableScenarios] = useState<string[]>([]);
        
        useEffect(() => {
          const loadScenarios = async () => {
            const scenarios = await getFilteredOptions('scenarios', wizardState, wizardOptions);
            setAvailableScenarios(scenarios);
          };
          loadScenarios();
        }, [wizardState.testingType]);
        
        const options = availableScenarios.map(scenario => ({
          value: scenario,
          label: scenario,
          description: getScenarioDescription(scenario)
        }));
        
        return (
          <OptionGroup
            legend="Select Test Scenarios"
            name="scenarios"
            type="checkbox"
            options={options}
            selectedValues={wizardState.scenarios}
            onChange={(value, checked) => handleOptionChange('scenarios', value, checked)}
            required
          />
        );
      }
      
      case 7: {
        const handleConfigChange = (field: string, value: string) => {
          const newConfig = { ...wizardState.config, [field]: value };
          
          if (wizardState.language === 'Java') {
            if (field === 'groupId' || field === 'artifactId') {
              newConfig.packageName = `${newConfig.groupId}.${newConfig.artifactId.replace(/-/g, '')}`;
            }
            
            if (field === 'projectName') {
              newConfig.artifactId = value;
            } else if (field === 'artifactId') {
              newConfig.projectName = value;
            }
          }
          
          updateWizardState({ config: newConfig });
        };
        
        return (
          <div className="space-y-6">
            <FormField
              label="Project Name"
              id="projectName"
              value={wizardState.config.projectName}
              onChange={(value) => handleConfigChange('projectName', value)}
              placeholder="my-qa-project"
              error={validationErrors.projectName}
              required
              helpText="Name for your project (alphanumeric, underscores, and hyphens only)"
            />
            
            {wizardState.language === 'Java' && (
              <>
                <FormField
                  label="Group ID"
                  id="groupId"
                  value={wizardState.config.groupId}
                  onChange={(value) => handleConfigChange('groupId', value)}
                  placeholder="com.example"
                  error={validationErrors.groupId}
                  required
                  helpText="Maven group identifier (reverse domain name)"
                />
                
                <FormField
                  label="Artifact ID"
                  id="artifactId"
                  value={wizardState.config.artifactId}
                  onChange={(value) => handleConfigChange('artifactId', value)}
                  placeholder="my-qa-project"
                  error={validationErrors.artifactId}
                  required
                  helpText="Maven artifact identifier (lowercase with hyphens)"
                />
                
                <FormField
                  label="Package Name"
                  id="packageName"
                  value={wizardState.config.packageName}
                  onChange={(value) => handleConfigChange('packageName', value)}
                  placeholder="com.example.myqaproject"
                  error={validationErrors.packageName}
                  required
                  helpText="Java package name (auto-generated from group and artifact)"
                />
              </>
            )}
          </div>
        );
      }
      
      case 8: {
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">CI/CD Integration</h3>
              <OptionGroup
                legend="Choose CI/CD Platform (Optional)"
                name="cicd"
                type="radio"
                options={wizardOptions.cicdOptions.map(option => ({
                  value: option,
                  label: option,
                  description: getIntegrationDescription(option)
                }))}
                selectedValues={wizardState.integrations.cicd ? [wizardState.integrations.cicd] : []}
                onChange={(value) => updateWizardState({
                  integrations: { ...wizardState.integrations, cicd: value }
                })}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Reporting</h3>
              <OptionGroup
                legend="Choose Reporting Tool (Optional)"
                name="reporting"
                type="radio"
                options={wizardOptions.reportingOptions.map(option => ({
                  value: option,
                  label: option,
                  description: getIntegrationDescription(option)
                }))}
                selectedValues={wizardState.integrations.reporting ? [wizardState.integrations.reporting] : []}
                onChange={(value) => updateWizardState({
                  integrations: { ...wizardState.integrations, reporting: value }
                })}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Other Integrations</h3>
              <OptionGroup
                legend="Additional Integrations (Optional)"
                name="others"
                type="checkbox"
                options={wizardOptions.otherIntegrations.map(option => ({
                  value: option,
                  label: option,
                  description: getIntegrationDescription(option)
                }))}
                selectedValues={wizardState.integrations.others}
                onChange={(value, checked) => handleOptionChange('integrations', value, checked)}
              />
            </div>
          </div>
        );
      }
      
      case 9: {
        const options = wizardOptions.dependencies.map(dependency => ({
          value: dependency,
          label: dependency,
          description: getDependencyDescription(dependency)
        }));
        
        return (
          <OptionGroup
            legend="Select Additional Dependencies (Optional)"
            name="dependencies"
            type="checkbox"
            options={options}
            selectedValues={wizardState.dependencies}
            onChange={(value, checked) => handleOptionChange('dependencies', value, checked)}
          />
        );
      }
      
      case 10: {
        return (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Project Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">Testing Type:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{wizardState.testingType}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">Methodology:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{wizardState.methodology}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">Tool:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{wizardState.tool}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">Language:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{wizardState.language}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">Build Tool:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{wizardState.buildTool}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">Test Runner:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{wizardState.testRunner}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">Scenarios:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{wizardState.scenarios.join(', ')}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">Project Name:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{wizardState.config.projectName}</span>
                </div>
                {wizardState.integrations.cicd && (
                  <div>
                    <span className="font-medium text-slate-600 dark:text-slate-400">CI/CD:</span>
                    <span className="ml-2 text-slate-900 dark:text-white">{wizardState.integrations.cicd}</span>
                  </div>
                )}
                {wizardState.integrations.reporting && (
                  <div>
                    <span className="font-medium text-slate-600 dark:text-slate-400">Reporting:</span>
                    <span className="ml-2 text-slate-900 dark:text-white">{wizardState.integrations.reporting}</span>
                  </div>
                )}
                {wizardState.dependencies.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Dependencies:</span>
                    <span className="ml-2 text-slate-900 dark:text-white">{wizardState.dependencies.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Ready to Generate!</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Click "Generate Project" to create your test automation framework. 
                The project will be downloaded as a ZIP file containing all necessary files and configurations.
              </p>
            </div>
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-labelledby="wizard-title">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      <h1 id="wizard-title" className="sr-only">QA Project Setup Wizard</h1>
      
      <ProgressIndicator steps={steps} currentStep={currentStep} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div id="main-content">
          <WizardStepComponent
            title={steps[currentStep].title}
            description={steps[currentStep].description}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canGoNext={canGoNext()}
            canGoPrevious={currentStep > 0}
            isLastStep={currentStep === steps.length - 1}
            isLoading={isGenerating}
          >
            {renderStepContent()}
          </WizardStepComponent>
        </div>
        
        <div className="lg:sticky lg:top-8">
          <ProjectPreview wizardState={wizardState} />
        </div>
      </div>
    </main>
  );
};

// Helper functions for descriptions
const getTestingTypeDescription = (type: string): string => {
  const descriptions = {
    'Web': 'Test web applications using browser automation',
    'API': 'Test REST APIs, GraphQL endpoints, and web services',
    'Mobile': 'Test mobile applications on iOS and Android platforms'
  };
  return descriptions[type as keyof typeof descriptions] || '';
};

const getMethodologyDescription = (methodology: string): string => {
  const descriptions = {
    'TDD': 'Test-Driven Development - Write tests before implementation',
    'BDD': 'Behavior-Driven Development - Focus on business behavior',
    'Hybrid': 'Combination of TDD and BDD approaches'
  };
  return descriptions[methodology as keyof typeof descriptions] || '';
};

const getToolDescription = (tool: string): string => {
  const descriptions = {
    'Selenium': 'Cross-browser web automation framework',
    'Playwright': 'Modern web automation with multiple browser support',
    'Cypress': 'JavaScript-based end-to-end testing framework',
    'RestAssured': 'Java library for REST API testing',
    'GraphQL': 'Query language for APIs testing',
    'Requests': 'Python HTTP library for API testing',
    'Appium': 'Cross-platform mobile automation framework',
    'XCUITest': 'Apple\'s native iOS testing framework',
    'Espresso': 'Android UI testing framework'
  };
  return descriptions[tool as keyof typeof descriptions] || '';
};

const getLanguageDescription = (language: string): string => {
  const descriptions = {
    'Java': 'Enterprise-grade, object-oriented programming language',
    'Python': 'Simple, readable language with rich testing ecosystem',
    'JavaScript': 'Dynamic web language with modern testing frameworks',
    'TypeScript': 'JavaScript with static typing for better maintainability',
    'C#': 'Microsoft\'s modern object-oriented language',
    'Swift': 'Apple\'s programming language for iOS development',
    'Kotlin': 'Modern language for Android development'
  };
  return descriptions[language as keyof typeof descriptions] || '';
};

const getBuildToolDescription = (tool: string): string => {
  const descriptions = {
    'Maven': 'Java project management and build automation tool',
    'Gradle': 'Flexible build automation tool for JVM languages',
    'NPM': 'Node.js package manager and build tool',
    'Yarn': 'Fast, reliable package manager for JavaScript',
    'NuGet': '.NET package manager and build system',
    'pip': 'Python package installer and dependency manager',
    'Xcode': 'Apple\'s integrated development environment',
    'Android Studio': 'Google\'s IDE for Android development'
  };
  return descriptions[tool as keyof typeof descriptions] || '';
};

const getTestRunnerDescription = (runner: string): string => {
  const descriptions = {
    'JUnit': 'Popular Java testing framework with annotations',
    'TestNG': 'Advanced Java testing framework with powerful features',
    'Pytest': 'Simple yet powerful Python testing framework',
    'Jest': 'JavaScript testing framework with built-in mocking',
    'Mocha': 'Feature-rich JavaScript test framework',
    'NUnit': '.NET testing framework with extensive assertions',
    'XCTest': 'Apple\'s native testing framework for Swift/Objective-C',
    'Espresso': 'Android UI testing framework for native apps'
  };
  return descriptions[runner as keyof typeof descriptions] || '';
};

const getScenarioDescription = (scenario: string): string => {
  const descriptions = {
    'Login': 'User authentication and login functionality tests',
    'Logout': 'User logout and session management tests',
    'SignUp': 'User registration and account creation tests',
    'API CRUD': 'Create, Read, Update, Delete operations testing',
    'Authentication API': 'API authentication and authorization tests',
    'Error Handling': 'Error response and edge case testing',
    'Rate Limiting': 'API rate limiting and throttling tests',
    'GraphQL Queries': 'GraphQL query and mutation testing',
    'Schema Validation': 'API schema and data validation tests',
    'Navigation': 'Mobile app navigation and screen transition tests',
    'Push Notifications': 'Mobile push notification functionality tests',
    'Offline Mode': 'App behavior when offline or with poor connectivity',
    'Gestures': 'Touch gestures and mobile-specific interactions',
    'Device Rotation': 'Screen orientation and responsive layout tests'
  };
  return descriptions[scenario as keyof typeof descriptions] || '';
};

const getIntegrationDescription = (integration: string): string => {
  const descriptions = {
    'Jenkins': 'Open-source automation server for CI/CD',
    'GitHub Actions': 'GitHub-integrated CI/CD workflows',
    'Azure Pipeline': 'Microsoft Azure DevOps CI/CD service',
    'GitLab CI': 'GitLab-integrated continuous integration',
    'CircleCI': 'Cloud-based continuous integration platform',
    'Extent Reports': 'Interactive HTML reporting for test results',
    'Allure Reports': 'Flexible multi-language test reporting',
    'TestNG Reports': 'Built-in TestNG HTML reporting',
    'Jest Reports': 'JavaScript test result reporting',
    'Mochawesome': 'Beautiful HTML/CSS reporter for Mocha',
    'Docker': 'Containerization for consistent test environments'
  };
  return descriptions[integration as keyof typeof descriptions] || '';
};

const getDependencyDescription = (dependency: string): string => {
  const descriptions = {
    'Logging': 'Comprehensive logging framework integration',
    'Screenshot': 'Automatic screenshot capture on test failures',
    'Config Loader': 'External configuration file management',
    'POM': 'Page Object Model design pattern implementation',
    'Data Provider': 'Test data management and injection utilities',
    'Retry Logic': 'Automatic test retry on failures',
    'Database Utils': 'Database connection and query utilities'
  };
  return descriptions[dependency as keyof typeof descriptions] || '';
};

export default Wizard;