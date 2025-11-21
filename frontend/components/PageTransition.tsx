'use client';

/**
 * Page Transition Component (Enhanced)
 *
 * Wrapper component for smooth page transitions in Next.js App Router.
 * Provides multiple transition variants with intelligent direction detection.
 */

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { pageTransition, getVariants, shouldReduceMotion, easings, durations } from '@/lib/animations';
import * as React from 'react';
import { type TransitionVariant, getNavigationDirection } from '@/lib/route-transitions';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: TransitionVariant;
  duration?: number;
  skipInitial?: boolean;
}

/**
 * Transition variants for different animation types
 */
const transitionVariants: Record<TransitionVariant, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  rotate: {
    hidden: { opacity: 0, rotate: -5, scale: 0.95 },
    visible: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 5, scale: 0.95 },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
  },
  reveal: {
    hidden: { opacity: 0, scale: 1.1, filter: 'blur(5px)' },
    visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.9, filter: 'blur(5px)' },
  },
};

/**
 * Get transition configuration with duration and easing
 */
function getTransitionConfig(duration: number = durations.normal) {
  return {
    duration,
    ease: easings.easeInOut,
  };
}

/**
 * Enhanced PageTransition component with multiple variants
 *
 * @example
 * ```tsx
 * <PageTransition variant="slide" duration={0.3}>
 *   <div>My content</div>
 * </PageTransition>
 * ```
 */
export function PageTransition({
  children,
  className,
  variant = 'fade',
  duration = 0.3,
  skipInitial = true,
}: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = shouldReduceMotion();
  const previousPathRef = React.useRef<string | null>(null);

  // Detect navigation direction
  const direction = React.useMemo(() => {
    if (previousPathRef.current) {
      return getNavigationDirection(previousPathRef.current, pathname);
    }
    return 'forward';
  }, [pathname]);

  // Update previous path ref
  React.useEffect(() => {
    previousPathRef.current = pathname;
  }, [pathname]);

  // Adjust variant based on direction for slide transitions
  const effectiveVariant = React.useMemo(() => {
    if (variant === 'slide') {
      return direction === 'backward' ? 'slideDown' : 'slideUp';
    }
    return variant;
  }, [variant, direction]);

  // If reduced motion is enabled, just render children without animation
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = transitionVariants[effectiveVariant];
  const transition = getTransitionConfig(duration);

  return (
    <AnimatePresence mode="wait" initial={!skipInitial}>
      <motion.div
        key={pathname}
        className={className}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Simple fade transition (no slide)
 */
export function FadeTransition({ children, className, duration = 0.2 }: PageTransitionProps) {
  return (
    <PageTransition variant="fade" duration={duration} className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * Slide transition
 */
export function SlideTransition({ children, className, duration = 0.3 }: PageTransitionProps) {
  return (
    <PageTransition variant="slide" duration={duration} className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * Scale transition
 */
export function ScaleTransition({ children, className, duration = 0.3 }: PageTransitionProps) {
  return (
    <PageTransition variant="scale" duration={duration} className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * Blur transition
 */
export function BlurTransition({ children, className, duration = 0.4 }: PageTransitionProps) {
  return (
    <PageTransition variant="blur" duration={duration} className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * Reveal transition (for modals/settings)
 */
export function RevealTransition({ children, className, duration = 0.3 }: PageTransitionProps) {
  return (
    <PageTransition variant="reveal" duration={duration} className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * Animated page wrapper (alias for PageTransition)
 */
export function AnimatedPage(props: PageTransitionProps) {
  return <PageTransition {...props} />;
}
