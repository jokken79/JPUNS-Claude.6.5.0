/**
 * Navigation Progress Bar
 *
 * Displays a top loading bar during route navigation.
 * Similar to YouTube, LinkedIn, and other modern web applications.
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface NavigationProgressProps {
  color?: string;
  height?: number;
  showSpinner?: boolean;
  delay?: number; // Delay before showing (to avoid flash on fast navigation)
  className?: string;
}

export function NavigationProgress({
  color = 'hsl(var(--primary))',
  height = 2,
  showSpinner = false,
  delay = 200,
  className,
}: NavigationProgressProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);

  // Track route changes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    let delayTimer: NodeJS.Timeout;

    const startLoading = () => {
      // Reset state
      setProgress(0);
      setShouldShow(false);

      // Delay showing the progress bar
      delayTimer = setTimeout(() => {
        setShouldShow(true);
        setIsLoading(true);

        // Simulate progress
        let currentProgress = 0;
        const increment = () => {
          currentProgress += Math.random() * 30;
          if (currentProgress > 90) currentProgress = 90;
          setProgress(currentProgress);

          if (currentProgress < 90) {
            progressTimer = setTimeout(increment, 300);
          }
        };

        increment();
      }, delay);
    };

    const stopLoading = () => {
      clearTimeout(delayTimer);
      clearTimeout(progressTimer);

      if (shouldShow) {
        // Complete the progress
        setProgress(100);

        // Hide after completion
        timer = setTimeout(() => {
          setIsLoading(false);
          setShouldShow(false);
          setProgress(0);
        }, 200);
      } else {
        setIsLoading(false);
        setShouldShow(false);
        setProgress(0);
      }
    };

    startLoading();

    // Simulate route change completion
    const completeTimer = setTimeout(stopLoading, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(progressTimer);
      clearTimeout(delayTimer);
      clearTimeout(completeTimer);
      stopLoading();
    };
  }, [pathname, searchParams, delay, shouldShow]);

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          {/* Progress Bar */}
          <motion.div
            className={cn(
              'fixed top-0 left-0 right-0 z-[9999] overflow-hidden',
              className
            )}
            style={{ height: `${height}px` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full shadow-lg"
              style={{
                background: color,
                boxShadow: `0 0 10px ${color}, 0 0 5px ${color}`,
              }}
              initial={{ width: '0%' }}
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.3,
                ease: 'easeOut',
              }}
            />
          </motion.div>

          {/* Optional Spinner */}
          {showSpinner && (
            <motion.div
              className="fixed top-4 right-4 z-[9999]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div
                className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: color, borderTopColor: 'transparent' }}
              />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Simplified version with preset styles
 */
export function SimpleNavigationProgress() {
  return (
    <NavigationProgress
      color="hsl(var(--primary))"
      height={2}
      delay={150}
    />
  );
}
