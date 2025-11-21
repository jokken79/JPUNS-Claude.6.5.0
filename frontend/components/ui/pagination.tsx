'use client';

/**
 * Pagination Component
 *
 * A flexible pagination component with various display modes and customization options.
 * Based on Shadcn/ui design patterns.
 */

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationProps extends React.ComponentPropsWithoutRef<'nav'> {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;

  /**
   * Number of page buttons to show around current page
   * @default 1
   */
  siblingCount?: number;

  /**
   * Show first/last page buttons
   * @default true
   */
  showFirstLast?: boolean;

  /**
   * Show previous/next buttons
   * @default true
   */
  showPrevNext?: boolean;

  /**
   * Show ellipsis when pages are truncated
   * @default true
   */
  showEllipsis?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'default' | 'lg';
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate array of page numbers to display
 */
const generatePagination = (
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | string)[] => {
  const totalPageNumbers = siblingCount * 2 + 5; // siblings + current + first + last + 2 ellipsis

  // If total pages is less than page numbers to show, return all pages
  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  // No ellipsis on either side
  if (!shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    return range(1, totalPages);
  }

  // Right ellipsis only
  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftRange = range(1, 3 + 2 * siblingCount);
    return [...leftRange, 'ellipsis-right', totalPages];
  }

  // Left ellipsis only
  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightRange = range(totalPages - (3 + 2 * siblingCount - 1), totalPages);
    return [firstPageIndex, 'ellipsis-left', ...rightRange];
  }

  // Both ellipsis
  const middleRange = range(leftSiblingIndex, rightSiblingIndex);
  return [firstPageIndex, 'ellipsis-left', ...middleRange, 'ellipsis-right', lastPageIndex];
};

/**
 * Generate range of numbers
 */
const range = (start: number, end: number): number[] => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

// ============================================================================
// COMPONENT
// ============================================================================

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  showEllipsis = true,
  size = 'default',
  className,
  ...props
}: PaginationProps) {
  const pages = generatePagination(currentPage, totalPages, siblingCount);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-xs',
    default: 'h-9 text-sm',
    lg: 'h-10 text-base',
  };

  const iconSizes = {
    sm: 14,
    default: 16,
    lg: 18,
  };

  const iconSize = iconSizes[size];

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
      {...props}
    >
      {/* First page button */}
      {showFirstLast && (
        <Button
          variant="outline"
          size="icon"
          className={sizeClasses[size]}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
        >
          <ChevronsLeft size={iconSize} />
        </Button>
      )}

      {/* Previous page button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="icon"
          className={sizeClasses[size]}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={iconSize} />
        </Button>
      )}

      {/* Page number buttons */}
      {pages.map((page, index) => {
        // Ellipsis
        if (typeof page === 'string') {
          if (!showEllipsis) return null;
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex items-center justify-center px-2"
              aria-hidden="true"
            >
              <MoreHorizontal size={iconSize} className="text-muted-foreground" />
            </span>
          );
        }

        // Page number button
        const isActive = page === currentPage;
        return (
          <Button
            key={`page-${page}`}
            variant={isActive ? 'default' : 'outline'}
            size="icon"
            className={cn(
              sizeClasses[size],
              isActive && 'pointer-events-none'
            )}
            onClick={() => handlePageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </Button>
        );
      })}

      {/* Next page button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="icon"
          className={sizeClasses[size]}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          <ChevronRight size={iconSize} />
        </Button>
      )}

      {/* Last page button */}
      {showFirstLast && (
        <Button
          variant="outline"
          size="icon"
          className={sizeClasses[size]}
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
        >
          <ChevronsRight size={iconSize} />
        </Button>
      )}
    </nav>
  );
}

// ============================================================================
// ALTERNATIVE: SIMPLE PAGINATION
// ============================================================================

export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Simple pagination with just prev/next buttons and page indicator
 */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: SimplePaginationProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// ============================================================================
// ALTERNATIVE: COMPACT PAGINATION
// ============================================================================

export interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Compact pagination with item count and select dropdown
 */
export function CompactPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
}: CompactPaginationProps) {
  const startItem = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {totalItems && startItem && endItem ? (
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} results
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
