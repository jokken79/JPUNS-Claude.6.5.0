'use client';

/**
 * ProgressIndicator Component
 *
 * Multi-step progress indicator for workflows and processes.
 * Shows completed, current, and pending steps with visual feedback.
 */

import { motion } from 'framer-motion';
import { Check, Circle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  /**
   * Step label
   */
  label: string;

  /**
   * Step description (optional)
   */
  description?: string;

  /**
   * Custom icon (optional)
   */
  icon?: LucideIcon;

  /**
   * Whether step is clickable
   */
  clickable?: boolean;
}

export interface ProgressIndicatorProps {
  /**
   * Array of step labels or step objects
   */
  steps: (string | ProgressStep)[];

  /**
   * Current step index (0-based)
   */
  currentStep: number;

  /**
   * Array of completed step indices
   */
  completedSteps?: number[];

  /**
   * Orientation
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Allow clicking on steps
   */
  clickable?: boolean;

  /**
   * Callback when step is clicked
   */
  onStepClick?: (stepIndex: number) => void;

  /**
   * Show step numbers
   */
  showNumbers?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Custom className
   */
  className?: string;
}

const sizeConfig = {
  sm: {
    circle: 'w-8 h-8 text-xs',
    line: 'h-0.5',
    text: 'text-xs',
  },
  md: {
    circle: 'w-10 h-10 text-sm',
    line: 'h-1',
    text: 'text-sm',
  },
  lg: {
    circle: 'w-12 h-12 text-base',
    line: 'h-1.5',
    text: 'text-base',
  },
};

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps = [],
  orientation = 'horizontal',
  clickable = false,
  onStepClick,
  showNumbers = true,
  size = 'md',
  className,
}: ProgressIndicatorProps) {
  const normalizedSteps: ProgressStep[] = steps.map((step) =>
    typeof step === 'string' ? { label: step } : step
  );

  const isStepCompleted = (index: number) => completedSteps.includes(index);
  const isStepCurrent = (index: number) => index === currentStep;
  const isStepPending = (index: number) => index > currentStep && !completedSteps.includes(index);

  const handleStepClick = (index: number) => {
    const step = normalizedSteps[index];
    const isClickable = clickable || step.clickable;

    if (isClickable && onStepClick) {
      onStepClick(index);
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {normalizedSteps.map((step, index) => {
          const completed = isStepCompleted(index);
          const current = isStepCurrent(index);
          const pending = isStepPending(index);
          const isLast = index === normalizedSteps.length - 1;
          const isClickable = clickable || step.clickable;

          const StepIcon = step.icon;

          return (
            <div key={index} className="relative flex items-start">
              {/* Vertical Line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-5 top-12 w-0.5 -ml-px',
                    'h-full min-h-[40px]',
                    completed || current ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}

              {/* Step Circle */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative z-10 flex-shrink-0 flex items-center justify-center rounded-full',
                  'border-2 font-semibold transition-all duration-200',
                  sizeConfig[size].circle,
                  completed && 'bg-primary border-primary text-primary-foreground',
                  current && 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20',
                  pending && 'bg-background border-muted text-muted-foreground',
                  isClickable && 'cursor-pointer hover:scale-110',
                  !isClickable && 'cursor-default'
                )}
              >
                {completed ? (
                  <Check className="w-4 h-4" />
                ) : StepIcon ? (
                  <StepIcon className="w-4 h-4" />
                ) : showNumbers ? (
                  index + 1
                ) : (
                  <Circle className="w-2 h-2 fill-current" />
                )}
              </motion.button>

              {/* Step Content */}
              <div className="ml-4 flex-1 pb-8">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  <p
                    className={cn(
                      'font-semibold',
                      sizeConfig[size].text,
                      current && 'text-primary',
                      completed && 'text-foreground',
                      pending && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {normalizedSteps.map((step, index) => {
          const completed = isStepCompleted(index);
          const current = isStepCurrent(index);
          const pending = isStepPending(index);
          const isLast = index === normalizedSteps.length - 1;
          const isClickable = clickable || step.clickable;

          const StepIcon = step.icon;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step */}
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex items-center justify-center rounded-full',
                    'border-2 font-semibold transition-all duration-200',
                    sizeConfig[size].circle,
                    completed && 'bg-primary border-primary text-primary-foreground',
                    current && 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20',
                    pending && 'bg-background border-muted text-muted-foreground',
                    isClickable && 'cursor-pointer hover:scale-110',
                    !isClickable && 'cursor-default'
                  )}
                >
                  {completed ? (
                    <Check className="w-4 h-4" />
                  ) : StepIcon ? (
                    <StepIcon className="w-4 h-4" />
                  ) : showNumbers ? (
                    index + 1
                  ) : (
                    <Circle className="w-2 h-2 fill-current" />
                  )}
                </motion.button>

                {/* Step Label */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                  className="mt-3 text-center max-w-[120px]"
                >
                  <p
                    className={cn(
                      'font-semibold',
                      sizeConfig[size].text,
                      current && 'text-primary',
                      completed && 'text-foreground',
                      pending && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </motion.div>
              </div>

              {/* Connection Line */}
              {!isLast && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                  className={cn(
                    'flex-1 mx-2',
                    sizeConfig[size].line,
                    completed || current ? 'bg-primary' : 'bg-muted'
                  )}
                  style={{ originX: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Simple progress bar (alternative to stepped progress)
 */
export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  className,
}: {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>
    </div>
  );
}
