/**
 * Wizard Component - Main orchestrator for the project configuration wizard
 * 
 * This is a refactored version that uses:
 * - WizardContext for state management
 * - Individual step components for each wizard step
 * - Cleaner separation of concerns
 */

import { Card, CardContent } from "@/components/ui/card";
import ProgressBar from "../ProgressBar";
import { ResumeDialog } from "../ResumeDialog";
import { WizardProvider, useWizard } from "./WizardContext";
import { WizardConfig } from "./types";
import {
  TestingTypeStep,
  FrameworkStep,
  LanguageStep,
  TestingPatternStep,
  TestRunnerStep,
  BuildToolStep,
  ProjectMetadataStep,
  CiCdStep,
  ReportingStep,
  UtilitiesStep,
  DependenciesStep,
  SummaryStep,
} from "./steps";

interface WizardProps {
  onComplete: (config: WizardConfig) => void;
  onBack: () => void;
}

function WizardContent() {
  const { 
    currentStep, 
    completedSteps, 
    steps, 
    handleStepNavigation,
    showResumeDialog,
    savedTimestamp,
    handleResume,
    handleStartFresh
  } = useWizard();

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <TestingTypeStep />;
      case 1: return <FrameworkStep />;
      case 2: return <LanguageStep />;
      case 3: return <TestingPatternStep />;
      case 4: return <TestRunnerStep />;
      case 5: return <BuildToolStep />;
      case 6: return <ProjectMetadataStep />;
      case 7: return <CiCdStep />;
      case 8: return <ReportingStep />;
      case 9: return <UtilitiesStep />;
      case 10: return <DependenciesStep />;
      case 11: return <SummaryStep />;
      default: return <TestingTypeStep />;
    }
  };

  return (
    <>
      <ResumeDialog
        open={showResumeDialog}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
        timestamp={savedTimestamp}
      />
      
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Progress Bar */}
        <ProgressBar
          steps={[...steps]}
          currentStep={currentStep}
          totalSteps={steps.length}
          completedSteps={completedSteps}
          onStepClick={handleStepNavigation}
        />

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function Wizard({ onComplete, onBack }: WizardProps) {
  return (
    <WizardProvider onComplete={onComplete} onBack={onBack}>
      <WizardContent />
    </WizardProvider>
  );
}

// Re-export types for external use
export type { WizardConfig } from "./types";
