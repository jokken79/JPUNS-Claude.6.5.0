'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Enable hover animation
   */
  enableHover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, style, enableHover = false, ...props }, ref) => {
    const baseStyle = {
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--card-shadow, 0 10px 40px rgba(0, 0, 0, 0.08))',
      borderColor: 'var(--border)',
      background: 'var(--card)',
      backdropFilter: 'blur(calc(var(--layout-panel-blur, 18px) * 0.35))',
      ...style,
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden border-2 text-card-foreground transition-all duration-500 backdrop-blur-sm",
          enableHover && "hover:shadow-lg hover:-translate-y-1",
          className
        )}
        style={baseStyle}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xl font-bold leading-tight tracking-tight text-foreground", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-3 p-6 pt-4 border-t border-border", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
