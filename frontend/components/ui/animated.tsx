'use client';

/**
 * Animated Components Wrapper
 *
 * Pre-configured Framer Motion components with default animations
 * for common use cases throughout the application.
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import * as React from 'react';
import {
  fadeIn,
  slideInBottom,
  cardHover,
  buttonHover,
  buttonTap,
  staggerContainer,
  shouldReduceMotion,
} from '@/lib/animations';
import { cn } from '@/lib/utils';

// ============================================================================
// ANIMATED DIV
// ============================================================================

interface AnimatedDivProps extends HTMLMotionProps<'div'> {
  /**
   * Use a custom animation variant
   */
  variant?: 'fadeIn' | 'slideInBottom' | 'none';
  /**
   * Delay before animation starts (in seconds)
   */
  delay?: number;
}

export const AnimatedDiv = React.forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ variant = 'fadeIn', delay = 0, className, children, ...props }, ref) => {
    const variants = variant === 'slideInBottom' ? slideInBottom : variant === 'fadeIn' ? fadeIn : undefined;

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={variants ? 'hidden' : undefined}
        animate={variants ? 'visible' : undefined}
        variants={variants}
        transition={delay ? { delay } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedDiv.displayName = 'AnimatedDiv';

// ============================================================================
// ANIMATED CARD
// ============================================================================

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  /**
   * Enable hover effect
   */
  enableHover?: boolean;
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ enableHover = true, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial="hidden"
        animate="visible"
        variants={slideInBottom}
        whileHover={enableHover ? cardHover : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

// ============================================================================
// ANIMATED BUTTON
// ============================================================================

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  /**
   * Enable tap effect
   */
  enableTap?: boolean;
  /**
   * Enable hover effect
   */
  enableHover?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ enableTap = true, enableHover = true, className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={className}
        whileHover={enableHover ? buttonHover : undefined}
        whileTap={enableTap ? buttonTap : undefined}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
AnimatedButton.displayName = 'AnimatedButton';

// ============================================================================
// ANIMATED LIST
// ============================================================================

interface AnimatedListProps extends HTMLMotionProps<'div'> {
  /**
   * Stagger delay between children (in seconds)
   */
  staggerDelay?: number;
}

export const AnimatedList = React.forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ staggerDelay = 0.1, className, children, ...props }, ref) => {
    const customStagger = {
      ...staggerContainer,
      visible: {
        ...staggerContainer.visible,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.05,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={className}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedList.displayName = 'AnimatedList';

// ============================================================================
// ANIMATED LIST ITEM
// ============================================================================

export const AnimatedListItem = React.forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={slideInBottom}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedListItem.displayName = 'AnimatedListItem';

// ============================================================================
// ANIMATED PAGE
// ============================================================================

interface AnimatedPageProps extends HTMLMotionProps<'div'> {
  /**
   * Additional class name
   */
  className?: string;
}

export const AnimatedPage = React.forwardRef<HTMLDivElement, AnimatedPageProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('w-full', className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0, 0, 0.2, 1],
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedPage.displayName = 'AnimatedPage';

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

interface AnimatedCounterProps {
  /**
   * Target value to count to
   */
  value: number;
  /**
   * Starting value
   */
  from?: number;
  /**
   * Duration of animation in seconds
   */
  duration?: number;
  /**
   * Number of decimal places
   */
  decimals?: number;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Suffix to append (e.g., '%', '円')
   */
  suffix?: string;
  /**
   * Prefix to prepend (e.g., '$', '¥')
   */
  prefix?: string;
}

export function AnimatedCounter({
  value,
  from = 0,
  duration = 1,
  decimals = 0,
  className,
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    // Animación desactivada para evitar bucle infinito
    const timer = process.env.NODE_ENV === 'development' ? setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setCount(value);
        clearInterval(timer);
      } else {
        const progress = 1 - remaining / (duration * 1000);
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const currentCount = from + (value - from) * easeOutQuad;
        setCount(currentCount);
      }
    }, 16) : null; // ~60fps

    return () => timer ? clearInterval(timer) : null;
  }, [value, from, duration]);

  const displayValue = count.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

// ============================================================================
// ANIMATED PRESENCE WRAPPER
// ============================================================================

interface FadePresenceProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Simple wrapper for AnimatePresence with fade effect
 */
export function FadePresence({ children, className }: FadePresenceProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SLIDE IN FROM SIDE
// ============================================================================

interface SlideInProps extends HTMLMotionProps<'div'> {
  /**
   * Direction to slide from
   */
  direction?: 'left' | 'right' | 'top' | 'bottom';
  /**
   * Distance to slide (in pixels)
   */
  distance?: number;
}

export const SlideIn = React.forwardRef<HTMLDivElement, SlideInProps>(
  ({ direction = 'left', distance = 50, className, children, ...props }, ref) => {
    const getInitialPosition = () => {
      switch (direction) {
        case 'left':
          return { x: -distance, opacity: 0 };
        case 'right':
          return { x: distance, opacity: 0 };
        case 'top':
          return { y: -distance, opacity: 0 };
        case 'bottom':
          return { y: distance, opacity: 0 };
      }
    };

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={getInitialPosition()}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
SlideIn.displayName = 'SlideIn';
