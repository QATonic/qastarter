import React from 'react';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface WizardStepProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
}

const WizardStep: React.FC<WizardStepProps> = ({
  title,
  description,
  children,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  isLastStep = false,
  isLoading = false
}) => {
  return (
    <div className="card card-hover animate-slide-up">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-2 h-8 gradient-primary rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{description}</p>
        </div>
        
        <div className="mb-10">
          {children}
        </div>
        
        <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
              canGoPrevious
                ? 'btn-secondary'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
            aria-label="Previous Step"
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>
          
          <button
            onClick={onNext}
            disabled={!canGoNext || isLoading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
              canGoNext && !isLoading
                ? 'btn-primary'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
            aria-label={isLastStep ? 'Generate Project' : 'Next Step'}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>{isLastStep ? 'Generate Project' : 'Next'}</span>
                {isLastStep ? <Sparkles size={18} /> : <ChevronRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WizardStep;