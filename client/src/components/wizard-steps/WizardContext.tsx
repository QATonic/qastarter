/**
 * Wizard Context - Centralized state management for the wizard
 */

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfigPersistence } from '@/hooks/useConfigPersistence';
import { WizardValidator } from '../../../../shared/validationMatrix';
import { WizardConfig, DEFAULT_CONFIG, WIZARD_STEPS } from './types';

interface WizardContextType {
  // State
  config: WizardConfig;
  currentStep: number;
  completedSteps: number[];
  isGenerating: boolean;

  // Actions
  updateConfig: (key: string, value: any) => void;
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  setIsGenerating: (value: boolean) => void;

  // Validation
  validateStep: (step: number) => boolean;
  getFilteredOptions: (step: string) => string[];

  // Navigation
  handleNext: () => void;
  handlePrevious: () => void;
  handleStepNavigation: (stepIndex: number) => void;

  // Persistence
  showResumeDialog: boolean;
  savedTimestamp: number;
  handleResume: () => void;
  handleStartFresh: () => void;

  // Constants
  steps: readonly string[];
}

const WizardContext = createContext<WizardContextType | null>(null);

interface WizardProviderProps {
  children: ReactNode;
  onComplete: (config: WizardConfig) => void;
  onBack: () => void;
}

export function WizardProvider({ children, onComplete, onBack }: WizardProviderProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<WizardConfig>(DEFAULT_CONFIG);

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
        hasResumedOrStartedFresh.current = true;
      }
      isInitialMount.current = false;
    }
  }, []);

  // Auto-save configuration on changes (debounced)
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
        title: 'Configuration Restored',
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
      title: 'Starting Fresh',
      description: 'Previous configuration cleared.',
    });
  };

  // Validate step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return config.testingType !== '';
      case 1:
        return config.framework !== '';
      case 2:
        return config.language !== '';
      case 3:
        return config.testingPattern !== '';
      case 4:
        return config.testRunner !== '';
      case 5:
        return config.buildTool !== '';
      case 6: {
        const projectName = config.projectName.trim();
        if (!projectName) return false;
        if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) return false;
        if (projectName.length > 100) return false;

        const isJavaProject = config.language === 'java';
        const needsJavaMetadata =
          isJavaProject && (config.buildTool === 'maven' || config.buildTool === 'gradle');

        if (needsJavaMetadata) {
          const groupId = config.groupId?.trim() || '';
          const artifactId = config.artifactId?.trim() || '';
          if (!groupId || !/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(groupId))
            return false;
          if (!artifactId || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(artifactId)) return false;
        }
        return true;
      }
      case 7:
        return true; // CI/CD is optional
      case 8:
        return true; // Reporting is optional
      default:
        return true;
    }
  };

  // Update config and reset invalid downstream selections
  const updateConfig = (key: string, value: any) => {
    let newConfig = { ...config, [key]: value };

    // Auto-populate Java metadata defaults
    if (key === 'language' && value === 'java') {
      if (!newConfig.groupId) newConfig.groupId = 'com.qastarter';
      if (!newConfig.artifactId) {
        newConfig.artifactId = newConfig.projectName
          ? newConfig.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          : 'qa-automation';
      }
    }

    // Sync artifactId with projectName for Java projects
    if (
      key === 'projectName' &&
      newConfig.language === 'java' &&
      (newConfig.buildTool === 'maven' || newConfig.buildTool === 'gradle')
    ) {
      newConfig.artifactId = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }

    const validatedConfig = WizardValidator.resetInvalidSelections(newConfig);
    setConfig(validatedConfig);

    if (JSON.stringify(newConfig) !== JSON.stringify(validatedConfig)) {
      toast({
        title: 'Selections Updated',
        description:
          'Some selections were automatically updated due to compatibility requirements.',
        variant: 'default',
      });
    }
  };

  // Get filtered options for current step
  const getFilteredOptions = (step: string): string[] => {
    return WizardValidator.getFilteredOptions(step, config);
  };

  // Mark step as completed
  const markStepCompleted = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }
  };

  // Handle next
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all required fields before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    markStepCompleted(currentStep);

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleProjectGeneration();
    }
  };

  // Handle project generation
  const handleProjectGeneration = async () => {
    setIsGenerating(true);
    try {
      await onComplete(config);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle step navigation
  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.includes(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  // Handle previous
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const value: WizardContextType = {
    config,
    currentStep,
    completedSteps,
    isGenerating,
    updateConfig,
    setCurrentStep,
    markStepCompleted,
    setIsGenerating,
    validateStep,
    getFilteredOptions,
    handleNext,
    handlePrevious,
    handleStepNavigation,
    showResumeDialog,
    savedTimestamp,
    handleResume,
    handleStartFresh,
    steps: WIZARD_STEPS,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
