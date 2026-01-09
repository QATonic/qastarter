import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  onStepClick?: (stepIndex: number) => void;
  completedSteps?: number[];
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  completedSteps = [],
}: ProgressBarProps) {
  const isStepClickable = (stepIndex: number) => {
    return onStepClick && (stepIndex <= currentStep || completedSteps.includes(stepIndex));
  };

  const handleStepClick = (stepIndex: number) => {
    if (isStepClickable(stepIndex)) {
      onStepClick?.(stepIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, stepIndex: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStepClick(stepIndex);
    }
  };

  const progressPercentage = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <nav className="w-full py-6" aria-label="Progress indicator" role="navigation">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" id="progress-heading" aria-live="polite">
          Step {currentStep + 1} of {totalSteps}
        </h2>
        <span
          className="text-sm text-muted-foreground"
          aria-label={`${progressPercentage} percent complete`}
        >
          {progressPercentage}% Complete
        </span>
      </div>

      <div
        className="relative -mx-4 px-4 md:mx-0 md:px-0"
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <ol
            className="flex items-center gap-2 md:gap-0 md:justify-between min-w-max md:min-w-0"
            aria-label="Wizard steps"
          >
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isClickable = isStepClickable(index);

              const getStepStatus = () => {
                if (isCompleted) return 'completed';
                if (isCurrent) return 'current';
                return 'upcoming';
              };

              const status = getStepStatus();

              return (
                <li
                  key={index}
                  className="flex flex-col items-center flex-shrink-0"
                  data-testid={`step-${index}`}
                >
                  <button
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2',
                      isCompleted
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 animate-pulse'
                          : 'bg-muted text-muted-foreground border-muted',
                      isClickable
                        ? 'cursor-pointer hover:scale-110 hover:shadow-xl hover:shadow-primary/30 hover-elevate'
                        : 'cursor-default'
                    )}
                    onClick={() => handleStepClick(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    disabled={!isClickable}
                    aria-label={`${step}: ${status}${isClickable ? ', click to navigate' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    tabIndex={isClickable ? 0 : -1}
                    type="button"
                  >
                    {isCompleted ? (
                      <CheckCircle
                        className="w-5 h-5 animate-in zoom-in duration-200"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className={cn('font-bold', isCurrent ? 'animate-pulse' : '')}>
                        {index + 1}
                      </span>
                    )}
                  </button>
                  <span
                    className={cn(
                      'text-xs mt-2 text-center max-w-20 leading-tight font-medium transition-colors duration-300',
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    aria-hidden="true"
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="absolute top-4 left-4 right-4 -z-10 hidden md:block" aria-hidden="true">
          <div className="h-0.5 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {`Currently on step ${currentStep + 1} of ${totalSteps}: ${steps[currentStep]}`}
      </div>
    </nav>
  );
}
