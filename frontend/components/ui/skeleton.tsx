'use client';

/**
 * Skeleton Component
 *
 * Loading skeleton with shimmer animation for better UX during data fetching.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { shimmer, pulse } from '@/lib/animations';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Animation variant
   */
  variant?: 'shimmer' | 'pulse' | 'none';
}

/**
 * Base Skeleton component
 */
export function Skeleton({
  className,
  variant = 'shimmer',
  ...props
}: SkeletonProps) {
  // Separate HTML events from motion props to avoid type conflicts
  const { 
    onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver,
    onAnimationStart, onAnimationEnd, onAnimationIteration,
    ...restProps 
  } = props;

  if (variant === 'shimmer') {
    return (
      <motion.div
        className={cn(
          'relative overflow-hidden rounded-md bg-muted',
          className
        )}
        {...restProps}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }}
          variants={shimmer}
          initial="initial"
          animate="animate"
        />
      </motion.div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn('rounded-md bg-muted', className)}
        variants={pulse}
        initial="initial"
        animate="animate"
        {...restProps}
      />
    );
  }

  return (
    <div
      className={cn('rounded-md bg-muted', className)}
      {...props}
    />
  );
}

/**
 * Text skeleton
 */
export function SkeletonText({
  className,
  lines = 3,
  variant = 'shimmer',
}: {
  className?: string;
  lines?: number;
  variant?: 'shimmer' | 'pulse' | 'none';
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-4/5' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton
 */
export function SkeletonCard({
  className,
  variant = 'shimmer',
}: {
  className?: string;
  variant?: 'shimmer' | 'pulse' | 'none';
}) {
  return (
    <div className={cn('rounded-lg border p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant={variant} className="h-4 w-32" />
        <Skeleton variant={variant} className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton variant={variant} className="h-8 w-20" />
      <Skeleton variant={variant} className="h-3 w-48" />
    </div>
  );
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({
  className,
  size = 'md',
  variant = 'shimmer',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'shimmer' | 'pulse' | 'none';
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton
      variant={variant}
      className={cn('rounded-full', sizeClasses[size], className)}
    />
  );
}

/**
 * Table row skeleton
 */
export function SkeletonTableRow({
  columns = 5,
  variant = 'shimmer',
}: {
  columns?: number;
  variant?: 'shimmer' | 'pulse' | 'none';
}) {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          className={cn(
            'h-4',
            i === 0 ? 'w-12' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Table skeleton
 */
export function SkeletonTable({
  rows = 5,
  columns = 5,
  variant = 'shimmer',
  className,
}: {
  rows?: number;
  columns?: number;
  variant?: 'shimmer' | 'pulse' | 'none';
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            variant={variant}
            className={cn('h-4', i === 0 ? 'w-12' : 'flex-1')}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} variant={variant} />
      ))}
    </div>
  );
}

/**
 * Form skeleton
 */
export function SkeletonForm({
  fields = 4,
  variant = 'shimmer',
  className,
}: {
  fields?: number;
  variant?: 'shimmer' | 'pulse' | 'none';
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant={variant} className="h-4 w-24" />
          <Skeleton variant={variant} className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2">
        <Skeleton variant={variant} className="h-10 w-24" />
        <Skeleton variant={variant} className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Dashboard metric card skeleton
 */
export function SkeletonMetricCard({
  variant = 'shimmer',
  className,
}: {
  variant?: 'shimmer' | 'pulse' | 'none';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-6 space-y-4',
        className
      )}
      style={{
        borderRadius: 'var(--layout-card-radius, 1rem)',
        boxShadow: 'var(--layout-card-shadow, 0 20px 45px rgba(15, 23, 42, 0.12))',
      }}
    >
      <div className="flex items-center justify-between">
        <Skeleton variant={variant} className="h-4 w-24" />
        <SkeletonAvatar size="md" variant={variant} />
      </div>
      <Skeleton variant={variant} className="h-8 w-16" />
      <Skeleton variant={variant} className="h-3 w-32" />
    </div>
  );
}

/**
 * List item skeleton
 */
export function SkeletonListItem({
  variant = 'shimmer',
  withAvatar = true,
  className,
}: {
  variant?: 'shimmer' | 'pulse' | 'none';
  withAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      {withAvatar && <SkeletonAvatar variant={variant} />}
      <div className="flex-1 space-y-2">
        <Skeleton variant={variant} className="h-4 w-3/4" />
        <Skeleton variant={variant} className="h-3 w-1/2" />
      </div>
    </div>
  );
}
