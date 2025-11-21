'use client';

/**
 * InlineLoading Component
 *
 * Small loading spinner for buttons and inline actions.
 * Can be used inside buttons, cards, or any inline context.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InlineLoadingSize = 'xs' | 'sm' | 'md' | 'lg';
export type InlineLoadingVariant = 'spinner' | 'dots' | 'pulse';

export interface InlineLoadingProps {
  /**
   * Whether the loading indicator is visible
   */
  visible?: boolean;

  /**
   * Size of the loading indicator
   */
  size?: InlineLoadingSize;

  /**
   * Visual variant
   */
  variant?: InlineLoadingVariant;

  /**
   * Color (CSS color or Tailwind class)
   */
  color?: string;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Loading text (optional)
   */
  text?: string;
}

const sizeConfig = {
  xs: {
    spinner: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
    text: 'text-xs',
  },
  sm: {
    spinner: 'w-4 h-4',
    dot: 'w-2 h-2',
    text: 'text-sm',
  },
  md: {
    spinner: 'w-5 h-5',
    dot: 'w-2.5 h-2.5',
    text: 'text-base',
  },
  lg: {
    spinner: 'w-6 h-6',
    dot: 'w-3 h-3',
    text: 'text-lg',
  },
};

/**
 * Spinner variant
 */
function SpinnerVariant({ size, color }: { size: InlineLoadingSize; color?: string }) {
  return (
    <Loader2
      className={cn(
        sizeConfig[size].spinner,
        'animate-spin',
        color || 'text-current'
      )}
    />
  );
}

/**
 * Dots variant
 */
function DotsVariant({ size, color }: { size: InlineLoadingSize; color?: string }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            sizeConfig[size].dot,
            'rounded-full',
            color || 'bg-current'
          )}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Pulse variant
 */
function PulseVariant({ size, color }: { size: InlineLoadingSize; color?: string }) {
  return (
    <motion.div
      className={cn(
        sizeConfig[size].dot,
        'rounded-full',
        color || 'bg-current'
      )}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
      }}
    />
  );
}

export function InlineLoading({
  visible = true,
  size = 'sm',
  variant = 'spinner',
  color,
  className,
  text,
}: InlineLoadingProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className={cn('inline-flex items-center gap-2', className)}
        >
          {/* Loading indicator */}
          {variant === 'spinner' && <SpinnerVariant size={size} color={color} />}
          {variant === 'dots' && <DotsVariant size={size} color={color} />}
          {variant === 'pulse' && <PulseVariant size={size} color={color} />}

          {/* Optional text */}
          {text && (
            <span className={cn(sizeConfig[size].text, color || 'text-current')}>
              {text}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Pre-configured inline loading for common scenarios
 */

export function ButtonLoading({ visible = true }: { visible?: boolean }) {
  return <InlineLoading visible={visible} size="sm" variant="spinner" />;
}

export function CardLoading({ visible = true }: { visible?: boolean }) {
  return <InlineLoading visible={visible} size="md" variant="dots" />;
}

export function TextLoading({ visible = true, text = 'Loading...' }: { visible?: boolean; text?: string }) {
  return <InlineLoading visible={visible} size="sm" variant="dots" text={text} />;
}
