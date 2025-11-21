import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105",
        secondary:
          "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/30 hover:shadow-lg hover:shadow-gray-500/40 hover:scale-105",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 hover:scale-105",
        success:
          "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30 hover:shadow-lg hover:shadow-green-500/40 hover:scale-105",
        warning:
          "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 hover:scale-105",
        outline: "border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
