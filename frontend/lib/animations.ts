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

// ============================================================================
// FORM ANIMATIONS (Consolidated from form-animations.ts)
// ============================================================================

/**
 * Form-specific animation utilities
 * Includes animations for error states, success states, and form interactions
 */
export const form = {
  animations: {
    // Error shake animation
    shake: {
      initial: { x: 0 },
      animate: {
        x: [0, -10, 10, -10, 10, -5, 5, 0],
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
      },
    },

    // Success pulse animation
    pulse: {
      initial: { scale: 1 },
      animate: {
        scale: [1, 1.02, 1],
        transition: {
          duration: 0.5,
          ease: 'easeInOut',
        },
      },
    },

    // Submit button bounce
    bounce: {
      initial: { y: 0 },
      animate: {
        y: [0, -5, 0],
        transition: {
          duration: 0.4,
          ease: 'easeOut',
        },
      },
    },

    // Error message slide down
    slideDown: {
      initial: { opacity: 0, height: 0, y: -10 },
      animate: {
        opacity: 1,
        height: 'auto',
        y: 0,
        transition: {
          duration: 0.2,
          ease: 'easeOut',
        },
      },
      exit: {
        opacity: 0,
        height: 0,
        y: -10,
        transition: {
          duration: 0.2,
          ease: 'easeIn',
        },
      },
    },

    // Error message slide up
    slideUp: {
      initial: { opacity: 0, height: 0, y: 10 },
      animate: {
        opacity: 1,
        height: 'auto',
        y: 0,
        transition: {
          duration: 0.2,
          ease: 'easeOut',
        },
      },
      exit: {
        opacity: 0,
        height: 0,
        y: 10,
        transition: {
          duration: 0.2,
          ease: 'easeIn',
        },
      },
    },

    // Fade in animation
    fadeIn: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      },
    },

    // Fade out animation
    fadeOut: {
      initial: { opacity: 1 },
      animate: {
        opacity: 0,
        transition: {
          duration: 0.3,
          ease: 'easeIn',
        },
      },
    },

    // Wiggle animation for attention
    wiggle: {
      initial: { rotate: 0 },
      animate: {
        rotate: [0, -5, 5, -5, 5, 0],
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
    },

    // Focus glow effect
    glow: {
      initial: { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
      animate: {
        boxShadow: [
          '0 0 0 0 rgba(99, 102, 241, 0)',
          '0 0 0 4px rgba(99, 102, 241, 0.2)',
          '0 0 0 0 rgba(99, 102, 241, 0)',
        ],
        transition: {
          duration: 1,
          ease: 'easeOut',
        },
      },
    },

    // Float label animation
    floatLabel: {
      initial: {
        y: 0,
        scale: 1,
        opacity: 0.7,
      },
      float: {
        y: -24,
        scale: 0.85,
        opacity: 1,
        transition: {
          duration: 0.15,
          ease: 'easeOut',
        },
      },
      rest: {
        y: 0,
        scale: 1,
        opacity: 0.7,
        transition: {
          duration: 0.15,
          ease: 'easeOut',
        },
      },
    },
  },

  /**
   * CSS Keyframes for non-framer-motion animations
   */
  keyframes: `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    50% { transform: rotate(5deg); }
    75% { transform: rotate(-5deg); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
    50% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2); }
  }
`,

  /**
   * Status colors for form feedback
   */
  statusColors: {
    success: {
      border: 'border-green-500',
      text: 'text-green-600',
      bg: 'bg-green-50',
      ring: 'ring-green-500',
      glow: 'shadow-green-500/20',
    },
    error: {
      border: 'border-red-500',
      text: 'text-red-600',
      bg: 'bg-red-50',
      ring: 'ring-red-500',
      glow: 'shadow-red-500/20',
    },
    warning: {
      border: 'border-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      ring: 'ring-amber-500',
      glow: 'shadow-amber-500/20',
    },
    info: {
      border: 'border-blue-500',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      ring: 'ring-blue-500',
      glow: 'shadow-blue-500/20',
    },
  },

  /**
   * Timing constants for form animations
   */
  timings: {
    fast: 150,
    normal: 200,
    slow: 300,
    verySlow: 500,
  },
};

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Backward compatibility exports for form animations
 * These maintain the old import paths: import { formAnimations } from '@/lib/form-animations'
 */
export const formAnimations = form.animations;
export const cssKeyframes = form.keyframes;
export const statusColors = form.statusColors;
export const animationTimings = form.timings;
