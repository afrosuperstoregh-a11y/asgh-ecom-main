import React from 'react';
import { Check } from 'lucide-react';

const CheckoutSteps = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress" className="relative">
      <ol className="flex items-center justify-between overflow-x-auto">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={`flex items-center ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
            <div className="relative flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium relative z-10
                    ${step.completed 
                      ? 'bg-green-600 text-white' 
                      : step.id === currentStep 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p
                  className={`
                    text-sm font-medium whitespace-nowrap
                    ${step.completed || step.id === currentStep 
                      ? 'text-gray-900' 
                      : 'text-gray-500'
                    }
                  `}
                >
                  {step.name}
                </p>
              </div>
            </div>
            {stepIdx !== steps.length - 1 && (
              <div
                className={`
                  hidden sm:block absolute top-5 left-10 h-0.5 w-full
                  ${step.completed ? 'bg-green-600' : 'bg-gray-200'}
                `}
                style={{ width: 'calc(100% - 2.5rem)' }}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default CheckoutSteps;
