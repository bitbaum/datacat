import React from 'react';

interface ProgressIndicatorProps {
  steps: { id: string; title: string; isOptional?: boolean }[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className = '',
}: ProgressIndicatorProps) {
  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'upcoming';
  };

  const getStepClasses = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const baseClasses =
      'relative flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-200';

    switch (status) {
      case 'completed':
        return `${baseClasses} bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg`;
      case 'current':
        return `${baseClasses} bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ring-4 ring-blue-200 dark:ring-blue-800/50`;
      default:
        return `${baseClasses} bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400`;
    }
  };

  const getConnectorClasses = (stepIndex: number) => {
    const isCompleted = completedSteps.includes(stepIndex) || stepIndex < currentStep;
    return `flex-1 h-1 mx-2 transition-all duration-300 ${
      isCompleted
        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
        : 'bg-gray-200 dark:bg-gray-700'
    }`;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Progress Bar */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-0">
              <button
                onClick={() => onStepClick?.(index)}
                disabled={!onStepClick}
                className={`${getStepClasses(index)} ${
                  onStepClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default'
                } group`}
              >
                {completedSteps.includes(index) ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    getStepStatus(index) === 'current'
                      ? 'text-blue-600 dark:text-blue-400'
                      : getStepStatus(index) === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step.title}
                </p>
                {step.isOptional && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">(Optional)</p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && <div className={getConnectorClasses(index)} />}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={getStepClasses(currentStep)}>
              {completedSteps.includes(currentStep) ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                currentStep + 1
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {steps[currentStep]?.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Schritt {currentStep + 1} von {steps.length}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
