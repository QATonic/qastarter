import React from 'react';
import { Check, Circle } from 'lucide-react';

interface ProgressIndicatorProps {
  steps: Array<{ id: string; title: string; completed: boolean }>;
  currentStep: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-12 animate-fade-in">
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-0 flex-shrink-0">
              <div
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500 text-white shadow-lg'
                    : index === currentStep
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                } ${index <= currentStep ? 'scale-110' : 'scale-100'}`}
              >
                {index < currentStep ? (
                  <Check size={20} className="animate-bounce-in" />
                ) : index === currentStep ? (
                  <Circle size={20} className="animate-pulse" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
                
                {index === currentStep && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-30 animate-pulse"></div>
                )}
              </div>
              
              <div className="mt-3 text-center max-w-24">
                <span className={`text-xs font-semibold transition-colors duration-200 ${
                  index <= currentStep 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {step.title}
                </span>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4 min-w-8">
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index < currentStep 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;