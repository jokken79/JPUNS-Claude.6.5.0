// @ts-nocheck - Temporary fix for framer-motion type conflicts
'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { buttonHover, buttonTap, shouldReduceMotion } from "@/lib/animations"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:scale-105 active:scale-100 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md shadow-destructive/25 hover:shadow-lg hover:shadow-destructive/35 hover:scale-105 active:scale-100",
        outline:
          "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md hover:scale-105 active:scale-100",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md shadow-secondary/25 hover:shadow-lg hover:shadow-secondary/35 hover:scale-105 active:scale-100",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline font-semibold",
        success:
          "bg-success text-success-foreground shadow-md shadow-success/20 hover:shadow-lg hover:shadow-success/30 hover:scale-105 active:scale-100",
        warning:
          "bg-warning text-warning-foreground shadow-md shadow-warning/20 hover:shadow-lg hover:shadow-warning/30 hover:scale-105 active:scale-100",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * Disable animations (for reduced motion or performance)
   */
  disableAnimations?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disableAnimations = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const reducedMotion = shouldReduceMotion()
    const shouldAnimate = !disableAnimations && !reducedMotion

    // If using asChild or animations disabled, use original component
    if (asChild || !shouldAnimate) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }

    // Use motion.button for animations
    // Separate HTML drag events from motion props to avoid type conflicts
    const { onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, ...restProps } = props;

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={buttonHover}
        whileTap={buttonTap}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        {...restProps}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
