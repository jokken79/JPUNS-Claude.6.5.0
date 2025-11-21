'use client';

import React from 'react';

/**
 * Loading Skeleton Components
 *
 * Provides reusable skeleton loaders for different UI elements
 * to improve perceived performance during data loading.
 */

// Base Skeleton Component
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  circle?: boolean;
  count?: number;
}

export function Skeleton({
  className = '',
  width = '100%',
  height = '1rem',
  circle = false,
  count = 1
}: SkeletonProps) {
  const skeletonClass = `animate-pulse bg-gray-200 ${circle ? 'rounded-full' : 'rounded'} ${className}`;

  if (count === 1) {
    return <div className={skeletonClass} style={{ width, height }} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={skeletonClass} style={{ width, height }} />
      ))}
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height="1rem" />
          ))}
        </div>
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-200 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height="1rem" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Card Skeleton
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton circle width="3rem" height="3rem" />
            <div className="flex-1">
              <Skeleton height="1rem" width="60%" className="mb-2" />
              <Skeleton height="0.75rem" width="40%" />
            </div>
          </div>
          <Skeleton height="4rem" className="mb-4" />
          <div className="flex gap-2">
            <Skeleton height="2rem" className="flex-1" />
            <Skeleton height="2rem" className="flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <Skeleton height="1.5rem" width="40%" className="mb-6" />
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <Skeleton height="0.875rem" width="25%" className="mb-2" />
            <Skeleton height="2.5rem" />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-6">
        <Skeleton height="2.5rem" width="8rem" />
        <Skeleton height="2.5rem" width="8rem" />
      </div>
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <Skeleton circle width="2.5rem" height="2.5rem" />
            <div className="flex-1">
              <Skeleton height="1rem" width="60%" className="mb-2" />
              <Skeleton height="0.75rem" width="40%" />
            </div>
            <Skeleton width="5rem" height="1.5rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <Skeleton height="0.875rem" width="50%" />
            <Skeleton circle width="2.5rem" height="2.5rem" />
          </div>
          <Skeleton height="2rem" width="70%" className="mb-2" />
          <Skeleton height="0.75rem" width="40%" />
        </div>
      ))}
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="mb-4">
        <Skeleton height="1.25rem" width="40%" className="mb-2" />
        <Skeleton height="0.875rem" width="60%" />
      </div>
      <div className="h-64 bg-gray-200 rounded flex items-end justify-around gap-2 p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-300 rounded-t w-full"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Detail Page Skeleton
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Skeleton height="2rem" width="50%" />
          <Skeleton height="2.5rem" width="8rem" />
        </div>
        <Skeleton height="1rem" width="70%" />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <Skeleton height="1rem" width="40%" className="mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j}>
                  <Skeleton height="0.75rem" width="30%" className="mb-1" />
                  <Skeleton height="1rem" width="60%" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <Skeleton height="1.25rem" width="30%" className="mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton circle width="2rem" height="2rem" />
              <div className="flex-1">
                <Skeleton height="1rem" width="40%" className="mb-2" />
                <Skeleton height="0.75rem" width="60%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <Skeleton height="2rem" width="40%" className="mb-2" />
          <Skeleton height="1rem" width="60%" />
        </div>

        {/* Stats Cards */}
        <StatsCardSkeleton count={4} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableSkeleton rows={8} columns={4} />
          </div>
          <div>
            <ChartSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export all skeletons
export const LoadingSkeletons = {
  Skeleton,
  Table: TableSkeleton,
  Card: CardSkeleton,
  Form: FormSkeleton,
  List: ListSkeleton,
  StatsCard: StatsCardSkeleton,
  Chart: ChartSkeleton,
  DetailPage: DetailPageSkeleton,
  Page: PageLoadingSkeleton
};

export default LoadingSkeletons;
