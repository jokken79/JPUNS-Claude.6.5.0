/**
 * Animation Utilities for Framer Motion
 *
 * Comprehensive animation variants, spring configs, and utilities
 * for creating smooth, performant micro-interactions throughout the app.
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

export const springConfigs = {
  stiff: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  smooth: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
  },
};

// ============================================================================
// DURATION PRESETS
// ============================================================================

export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
};

// ============================================================================
// EASING CURVES
// ============================================================================

export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

/**
 * Simple fade in from opacity 0 to 1
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal },
  },
};

/**
 * Fade in with slide up effect
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
};

/**
 * Fade in with slide down effect
 */
export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
};

/**
 * Fade in from left
 */
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
};

/**
 * Fade in from right
 */
export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
};

/**
 * Scale in from 0.8 to 1
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
};

/**
 * Slide up with spring animation
 */
export const slideInUp: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springConfigs.smooth,
  },
};

/**
 * Slide in from bottom (alias for slideInUp for clarity)
 */
export const slideInBottom: Variants = {
  hidden: {
    y: 60,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
};

/**
 * Stagger children animations
 */
export const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

/**
 * Stagger with faster timing
 */
export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

/**
 * Stagger container animation (alias for stagger)
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// ============================================================================
// INTERACTION ANIMATIONS
// ============================================================================

/**
 * Lift effect on hover
 */
export const hover = {
  scale: 1.02,
  y: -2,
  transition: springConfigs.stiff,
};

/**
 * Press down on tap
 */
export const tap = {
  scale: 0.98,
  y: 1,
  transition: springConfigs.stiff,
};

/**
 * Card hover with elevation
 */
export const cardHover = {
  y: -4,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  transition: springConfigs.smooth,
};

/**
 * Button hover effect
 */
export const buttonHover = {
  scale: 1.05,
  transition: springConfigs.bouncy,
};

/**
 * Button tap effect
 */
export const buttonTap = {
  scale: 0.95,
  transition: springConfigs.stiff,
};

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

/**
 * Shimmer loading effect
 */
export const shimmer: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Pulse animation
 */
export const pulse: Variants = {
  initial: {
    opacity: 1,
    scale: 1,
  },
  animate: {
    opacity: [1, 0.7, 1],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Bounce effect
 */
export const bounce: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Rotation animation
 */
export const rotate: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

/**
 * Page transition - fade and slide
 */
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: durations.fast,
      ease: easings.easeIn,
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get reduced motion preference
 */
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get transition with reduced motion support
 */
export const getTransition = (transition: Transition): Transition => {
  if (shouldReduceMotion()) {
    return { duration: 0 };
  }
  return transition;
};

/**
 * Get variants with reduced motion support
 */
export const getVariants = (variants: Variants): Variants => {
  if (shouldReduceMotion()) {
    return {
      hidden: variants.hidden,
      visible: { ...variants.visible, transition: { duration: 0 } },
    };
  }
  return variants;
};

// ============================================================================
// NUMBER COUNTER ANIMATION
// ============================================================================

/**
 * Animation configuration for counting numbers
 */
export const counterTransition = {
  duration: 1,
  ease: easings.easeOut,
};

/**
 * Create a count-up animation
 */
export const createCounterAnimation = (from: number, to: number) => ({
  from,
  to,
  transition: counterTransition,
});
