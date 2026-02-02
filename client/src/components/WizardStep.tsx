import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface WizardStepProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  showSkip?: boolean;
  isLastStep?: boolean;
  stepNumber?: number;
  totalSteps?: number;
}

export default function WizardStep({
  title,
  description,
  children,
  onNext,
  onPrevious,
  onSkip,
  canGoNext = true,
  canGoPrevious = true,
  showSkip = false,
  isLastStep = false,
  stepNumber,
  totalSteps,
}: WizardStepProps) {
  const stepRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: focus the card when step changes
  useEffect(() => {
    if (stepRef.current) {
      stepRef.current.focus();
    }
  }, [stepNumber]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N for Next
      if (e.altKey && e.key === 'n' && canGoNext && onNext) {
        e.preventDefault();
        onNext();
      }
      // Alt+P for Previous
      if (e.altKey && e.key === 'p' && canGoPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      }
      // Alt+S for Skip
      if (e.altKey && e.key === 's' && showSkip && onSkip) {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrevious, showSkip, onNext, onPrevious, onSkip]);

  return (
    <Card
      className="w-full"
      ref={stepRef}
      tabIndex={-1}
      role="region"
      aria-labelledby="wizard-step-title"
      aria-describedby="wizard-step-description"
    >
      <CardHeader>
        <CardTitle id="wizard-step-title" className="text-2xl">
          {title}
          {stepNumber !== undefined && totalSteps !== undefined && (
            <span className="sr-only">
              , Step {stepNumber} of {totalSteps}
            </span>
          )}
        </CardTitle>
        <p id="wizard-step-description" className="text-muted-foreground">
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div role="form" aria-label={`${title} configuration`}>
          {children}
        </div>

        <nav
          className="flex flex-wrap justify-between items-center gap-2 pt-6"
          aria-label="Wizard navigation"
          role="navigation"
        >
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            data-testid="button-previous"
            className="hover-elevate active-elevate-2 border-primary/20 hover:border-primary hover:text-primary transition-colors"
            aria-label="Go to previous step (Alt+P)"
            aria-disabled={!canGoPrevious}
          >
            <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Previous
          </Button>

          <div className="flex flex-wrap gap-2">
            {showSkip && (
              <Button
                variant="ghost"
                onClick={onSkip}
                data-testid="button-skip"
                className="hover-elevate active-elevate-2"
                aria-label="Skip this step (Alt+S)"
              >
                Skip
              </Button>
            )}
            <Button
              ref={nextButtonRef}
              onClick={onNext}
              disabled={!canGoNext}
              data-testid="button-next"
              className="hover-elevate active-elevate-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 text-white shadow-lg shadow-purple-500/20 border-0 transition-all"
              aria-label={
                isLastStep ? 'Generate and download your project' : 'Go to next step (Alt+N)'
              }
              aria-disabled={!canGoNext}
            >
              {isLastStep ? 'Generate and Download Project' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />}
            </Button>
          </div>
        </nav>
      </CardContent>
    </Card>
  );
}
