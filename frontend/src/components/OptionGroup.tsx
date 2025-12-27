import React from 'react';

interface OptionGroupProps {
  legend: string;
  name: string;
  type: 'radio' | 'checkbox';
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  selectedValues: string[];
  onChange: (value: string, checked: boolean) => void;
  error?: string;
  required?: boolean;
  'aria-describedby'?: string;
}

const OptionGroup: React.FC<OptionGroupProps> = ({
  legend,
  name,
  type,
  options,
  selectedValues,
  onChange,
  error,
  required = false,
  'aria-describedby': ariaDescribedBy,
}) => {
  const groupId = `${name}-group`;
  const errorId = `${groupId}-error`;
  const hasError = Boolean(error);

  const handleChange = (value: string, checked: boolean) => {
    onChange(value, checked);
  };

  return (
    <fieldset
      className="space-y-3"
      aria-invalid={hasError}
      aria-describedby={`${ariaDescribedBy || ''} ${error ? errorId : ''}`.trim()}
    >
      <legend className="text-lg font-medium text-slate-900 dark:text-white mb-3">
        {legend}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </legend>
      
      <div className="space-y-3" role={type === 'radio' ? 'radiogroup' : 'group'}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const optionId = `${name}-${option.value}`;
          
          return (
            <label 
              key={option.value}
              htmlFor={optionId}
              className={`option-card ${
                option.disabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
            >
              <input
                id={optionId}
                type={type}
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={option.disabled}
                onChange={(e) => handleChange(option.value, e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                aria-describedby={option.description ? `${optionId}-desc` : undefined}
              />
              
              <div className="flex-1 min-w-0">
                <div className="text-slate-900 dark:text-white font-medium">
                  {option.label}
                </div>
                {option.description && (
                  <div 
                    id={`${optionId}-desc`}
                    className="text-sm text-slate-600 dark:text-slate-400 mt-1"
                  >
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400 mt-2"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
};

export default OptionGroup; 