/**
 * Form Animation Utilities
 *
 * Provides consistent animation presets for form components
 * including error states, success states, and transitions.
 */

export const formAnimations = {
  // Error shake animation
  shake: {
    initial: { x: 0 },
    animate: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: {
        duration: 0.3,
        ease: "easeInOut",
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
        ease: "easeInOut",
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
        ease: "easeOut",
      },
    },
  },

  // Error message slide down
  slideDown: {
    initial: { opacity: 0, height: 0, y: -10 },
    animate: {
      opacity: 1,
      height: "auto",
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  },

  // Error message slide up
  slideUp: {
    initial: { opacity: 0, height: 0, y: 10 },
    animate: {
      opacity: 1,
      height: "auto",
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      y: 10,
      transition: {
        duration: 0.2,
        ease: "easeIn",
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
        ease: "easeOut",
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
        ease: "easeIn",
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
        ease: "easeInOut",
      },
    },
  },

  // Focus glow effect
  glow: {
    initial: { boxShadow: "0 0 0 0 rgba(99, 102, 241, 0)" },
    animate: {
      boxShadow: [
        "0 0 0 0 rgba(99, 102, 241, 0)",
        "0 0 0 4px rgba(99, 102, 241, 0.2)",
        "0 0 0 0 rgba(99, 102, 241, 0)",
      ],
      transition: {
        duration: 1,
        ease: "easeOut",
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
        ease: "easeOut",
      },
    },
    rest: {
      y: 0,
      scale: 1,
      opacity: 0.7,
      transition: {
        duration: 0.15,
        ease: "easeOut",
      },
    },
  },
};

// CSS Keyframes for non-framer-motion animations
export const cssKeyframes = `
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
`;

// Status colors
export const statusColors = {
  success: {
    border: "border-green-500",
    text: "text-green-600",
    bg: "bg-green-50",
    ring: "ring-green-500",
    glow: "shadow-green-500/20",
  },
  error: {
    border: "border-red-500",
    text: "text-red-600",
    bg: "bg-red-50",
    ring: "ring-red-500",
    glow: "shadow-red-500/20",
  },
  warning: {
    border: "border-amber-500",
    text: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-500",
    glow: "shadow-amber-500/20",
  },
  info: {
    border: "border-blue-500",
    text: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-500",
    glow: "shadow-blue-500/20",
  },
};

// Timing constants
export const animationTimings = {
  fast: 150,
  normal: 200,
  slow: 300,
  verySlow: 500,
};
