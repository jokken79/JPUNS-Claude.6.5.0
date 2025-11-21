'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface StepConfig {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface MultiStepFormContextValue {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  completedSteps: Set<number>;
  goToStep: (step: number) => void;
  nextStep: () => Promise<void>;
  previousStep: () => void;
  completeStep: (step: number) => void;
}

const MultiStepFormContext = React.createContext<
  MultiStepFormContextValue | undefined
>(undefined);

const useMultiStepForm = () => {
  const context = React.useContext(MultiStepFormContext);
  if (!context) {
    throw new Error(
      'MultiStepForm components must be used within MultiStepForm'
    );
  }
  return context;
};

// Main MultiStepForm Container
export interface MultiStepFormProps {
  children: React.ReactNode;
  onSubmit?: () => void | Promise<void>;
  onStepChange?: (step: number) => void;
  initialStep?: number;
  saveProgress?: boolean;
  storageKey?: string;
  className?: string;
}

const MultiStepForm = React.forwardRef<HTMLDivElement, MultiStepFormProps>(
  (
    {
      children,
      onSubmit,
      onStepChange,
      initialStep = 0,
      saveProgress = false,
      storageKey = 'multiStepFormProgress',
      className,
    },
    ref
  ) => {
    const steps = React.Children.toArray(children);
    const totalSteps = steps.length;

    const [currentStep, setCurrentStep] = React.useState(() => {
      if (saveProgress && typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey);
        return saved ? parseInt(saved, 10) : initialStep;
      }
      return initialStep;
    });

    const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
      new Set()
    );

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    // Save progress to localStorage
    React.useEffect(() => {
      if (saveProgress && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, currentStep.toString());
      }
    }, [currentStep, saveProgress, storageKey]);

    // Notify parent of step change
    React.useEffect(() => {
      onStepChange?.(currentStep);
    }, [currentStep, onStepChange]);

    const goToStep = React.useCallback((step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    }, [totalSteps]);

    const completeStep = React.useCallback((step: number) => {
      setCompletedSteps((prev) => new Set([...prev, step]));
    }, []);

    const nextStep = React.useCallback(async () => {
      if (!isLastStep) {
        // Validate current step if validation function exists
        const currentStepElement = steps[currentStep] as React.ReactElement<StepProps>;
        const validate = currentStepElement.props?.validate;

        if (validate) {
          const isValid = await validate();
          if (!isValid) {
            return; // Don't proceed if validation fails
          }
        }

        completeStep(currentStep);
        setCurrentStep((prev) => prev + 1);
      } else {
        completeStep(currentStep);
        onSubmit?.();
      }
    }, [currentStep, isLastStep, steps, onSubmit, completeStep]);

    const previousStep = React.useCallback(() => {
      if (!isFirstStep) {
        setCurrentStep((prev) => prev - 1);
      }
    }, [isFirstStep]);

    const contextValue: MultiStepFormContextValue = {
      currentStep,
      totalSteps,
      isFirstStep,
      isLastStep,
      completedSteps,
      goToStep,
      nextStep,
      previousStep,
      completeStep,
    };

    return (
      <MultiStepFormContext.Provider value={contextValue}>
        <div ref={ref} className={cn('w-full space-y-6', className)}>
          {children}
        </div>
      </MultiStepFormContext.Provider>
    );
  }
);

MultiStepForm.displayName = 'MultiStepForm';

// Step Component
export interface StepProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
  children: React.ReactNode;
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="w-full">
        {children}
      </div>
    );
  }
);

Step.displayName = 'MultiStepForm.Step';

// Progress Indicator Component
const Progress = React.forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(
  ({ className, children }, ref) => {
    const { currentStep, totalSteps, completedSteps, goToStep } =
      useMultiStepForm();

    const steps = React.Children.toArray(children) as React.ReactElement[];

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {/* Progress Bar */}
        <div className="relative">
          {/* Background Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />

          {/* Progress Line */}
          <motion.div
            className="absolute top-5 left-0 h-0.5 bg-indigo-600"
            initial={{ width: 0 }}
            animate={{
              width: `${(currentStep / (totalSteps - 1)) * 100}%`,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />

          {/* Step Indicators */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const stepProps = step.props as StepProps;
              const isCompleted = completedSteps.has(index);
              const isCurrent = index === currentStep;
              const isPast = index < currentStep;
              const isClickable = isPast || isCompleted;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => isClickable && goToStep(index)}
                  disabled={!isClickable}
                  className={cn(
                    'flex flex-col items-center gap-2 transition-opacity',
                    !isClickable && 'cursor-not-allowed'
                  )}
                >
                  {/* Circle */}
                  <motion.div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10',
                      isCurrent && 'border-indigo-600 bg-white shadow-lg',
                      isCompleted && 'border-indigo-600 bg-indigo-600',
                      !isCurrent && !isCompleted && 'border-gray-300 bg-white'
                    )}
                    initial={false}
                    animate={
                      isCurrent
                        ? {
                            scale: [1, 1.1, 1],
                            boxShadow: [
                              '0 0 0 0 rgba(99, 102, 241, 0.4)',
                              '0 0 0 8px rgba(99, 102, 241, 0)',
                            ],
                          }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.5 }}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-5 h-5 text-white" />
                    ) : stepProps.icon ? (
                      <div
                        className={cn(
                          'w-5 h-5',
                          isCurrent ? 'text-indigo-600' : 'text-gray-400'
                        )}
                      >
                        {stepProps.icon}
                      </div>
                    ) : (
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          isCurrent ? 'text-indigo-600' : 'text-gray-400'
                        )}
                      >
                        {index + 1}
                      </span>
                    )}
                  </motion.div>

                  {/* Label */}
                  <div className="text-center max-w-[100px]">
                    <p
                      className={cn(
                        'text-xs font-medium truncate',
                        isCurrent ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {stepProps.title}
                    </p>
                    {stepProps.description && isCurrent && (
                      <motion.p
                        className="text-xs text-muted-foreground mt-0.5 line-clamp-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {stepProps.description}
                      </motion.p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

Progress.displayName = 'MultiStepForm.Progress';

// Content Component (animated step content)
const Content = React.forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(
  ({ className, children }, ref) => {
    const { currentStep } = useMultiStepForm();
    const steps = React.Children.toArray(children) as React.ReactElement[];

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
);

Content.displayName = 'MultiStepForm.Content';

// Navigation Component
export interface NavigationProps {
  nextLabel?: string;
  previousLabel?: string;
  submitLabel?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  className?: string;
}

const Navigation = React.forwardRef<HTMLDivElement, NavigationProps>(
  (
    {
      nextLabel = '次へ',
      previousLabel = '戻る',
      submitLabel = '送信',
      showPrevious = true,
      showNext = true,
      className,
    },
    ref
  ) => {
    const { isFirstStep, isLastStep, nextStep, previousStep } =
      useMultiStepForm();

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between gap-4', className)}
      >
        {/* Previous Button */}
        {showPrevious && (
          <button
            type="button"
            onClick={previousStep}
            disabled={isFirstStep}
            className={cn(
              'inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium transition-all',
              'text-gray-700 bg-white hover:bg-gray-50',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            {previousLabel}
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Next/Submit Button */}
        {showNext && (
          <motion.button
            type="button"
            onClick={nextStep}
            className={cn(
              'inline-flex items-center px-6 py-2 rounded-lg shadow-sm text-sm font-medium text-white transition-all',
              'bg-indigo-600 hover:bg-indigo-700',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLastStep ? submitLabel : nextLabel}
            {!isLastStep && <ChevronRightIcon className="w-4 h-4 ml-2" />}
          </motion.button>
        )}
      </div>
    );
  }
);

Navigation.displayName = 'MultiStepForm.Navigation';

// Type for compound component
type MultiStepFormComponent = typeof MultiStepForm & {
  Step: typeof Step;
  Progress: typeof Progress;
  Content: typeof Content;
  Navigation: typeof Navigation;
};

// Create compound component
const MultiStepFormWithSubComponents = MultiStepForm as MultiStepFormComponent;
MultiStepFormWithSubComponents.Step = Step;
MultiStepFormWithSubComponents.Progress = Progress;
MultiStepFormWithSubComponents.Content = Content;
MultiStepFormWithSubComponents.Navigation = Navigation;

// Export compound component
export {
  MultiStepFormWithSubComponents as MultiStepForm,
  Step,
  Progress,
  Content,
  Navigation,
};
