/**
 * Performance Monitoring - Core Web Vitals (FASE 4 #3)
 *
 * Monitors and logs Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - TTFB (Time to First Byte): Server response time
 * - FCP (First Contentful Paint): Initial render
 * - INP (Interaction to Next Paint): Responsiveness (replaces FID)
 *
 * Sends metrics to backend for centralized monitoring and alerting.
 */

import { logger } from '@/lib/logging';

// Web Vitals metric types
export interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// Thresholds for Core Web Vitals (from web.dev)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // ms
  FID: { good: 100, poor: 300 }, // ms
  CLS: { good: 0.1, poor: 0.25 }, // score
  TTFB: { good: 800, poor: 1800 }, // ms
  FCP: { good: 1800, poor: 3000 }, // ms
  INP: { good: 200, poor: 500 }, // ms
};

/**
 * Determine rating based on value and thresholds
 */
function getRating(
  metricName: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];

  if (!threshold) {
    return 'good';
  }

  if (value <= threshold.good) {
    return 'good';
  } else if (value <= threshold.poor) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Report metric to backend via logger
 */
function reportMetric(metric: Metric): void {
  const logLevel = metric.rating === 'poor' ? 'warn' : 'info';

  logger[logLevel]('Core Web Vital metric', {
    metric_name: metric.name,
    metric_value: metric.value,
    metric_rating: metric.rating,
    metric_delta: metric.delta,
    metric_id: metric.id,
    navigation_type: metric.navigationType,
  });
}

/**
 * Observe Largest Contentful Paint (LCP)
 * Measures loading performance - should be < 2.5s
 */
function observeLCP(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;

      if (lastEntry) {
        const metric: Metric = {
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
          delta: lastEntry.renderTime || lastEntry.loadTime,
          id: `v3-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          navigationType:
            (performance.getEntriesByType('navigation')[0] as any)?.type ||
            'navigate',
        };

        reportMetric(metric);
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    logger.debug('LCP observation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Observe First Input Delay (FID)
 * Measures interactivity - should be < 100ms
 */
function observeFID(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      for (const entry of entries) {
        const fidEntry = entry as any;

        const metric: Metric = {
          name: 'FID',
          value: fidEntry.processingStart - fidEntry.startTime,
          rating: getRating(
            'FID',
            fidEntry.processingStart - fidEntry.startTime
          ),
          delta: fidEntry.processingStart - fidEntry.startTime,
          id: `v3-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          navigationType:
            (performance.getEntriesByType('navigation')[0] as any)?.type ||
            'navigate',
        };

        reportMetric(metric);
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    logger.debug('FID observation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 * Measures visual stability - should be < 0.1
 */
function observeCLS(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    let clsValue = 0;
    let clsEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      for (const entry of entries) {
        const layoutShift = entry as any;

        // Only count layout shifts without recent user input
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
          clsEntries.push(layoutShift);
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Report CLS when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        const metric: Metric = {
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          delta: clsValue,
          id: `v3-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          navigationType:
            (performance.getEntriesByType('navigation')[0] as any)?.type ||
            'navigate',
        };

        reportMetric(metric);
      }
    });
  } catch (error) {
    logger.debug('CLS observation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Measure Time to First Byte (TTFB)
 * Measures server response time - should be < 800ms
 */
function measureTTFB(): void {
  if (typeof window === 'undefined' || !performance.getEntriesByType) {
    return;
  }

  try {
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;

      const metric: Metric = {
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        delta: ttfb,
        id: `v3-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        navigationType: navigationEntry.type || 'navigate',
      };

      reportMetric(metric);
    }
  } catch (error) {
    logger.debug('TTFB measurement failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Measure First Contentful Paint (FCP)
 * Measures when first content is painted - should be < 1.8s
 */
function measureFCP(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          const metric: Metric = {
            name: 'FCP',
            value: entry.startTime,
            rating: getRating('FCP', entry.startTime),
            delta: entry.startTime,
            id: `v3-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            navigationType:
              (performance.getEntriesByType('navigation')[0] as any)?.type ||
              'navigate',
          };

          reportMetric(metric);
          observer.disconnect();
        }
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    logger.debug('FCP measurement failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Observe Interaction to Next Paint (INP)
 * Measures overall responsiveness - should be < 200ms
 * This is the newer metric replacing FID
 */
function observeINP(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    // INP requires newer API, fallback gracefully
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let maxDuration = 0;

      for (const entry of entries) {
        const eventEntry = entry as any;
        if (eventEntry.duration > maxDuration) {
          maxDuration = eventEntry.duration;
        }
      }

      if (maxDuration > 0) {
        const metric: Metric = {
          name: 'INP',
          value: maxDuration,
          rating: getRating('INP', maxDuration),
          delta: maxDuration,
          id: `v3-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          navigationType:
            (performance.getEntriesByType('navigation')[0] as any)?.type ||
            'navigate',
        };

        reportMetric(metric);
      }
    });

    // Use event timing if available
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch (error) {
    logger.debug('INP observation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Initialize performance monitoring
 * Call this once at app startup
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Wait for page to load
  if (document.readyState === 'complete') {
    startMonitoring();
  } else {
    window.addEventListener('load', startMonitoring);
  }
}

/**
 * Start all performance observers
 */
function startMonitoring(): void {
  logger.debug('Initializing performance monitoring');

  // Core Web Vitals
  observeLCP();
  observeFID();
  observeCLS();
  observeINP();

  // Additional metrics
  measureTTFB();
  measureFCP();

  // Log navigation timing
  logNavigationTiming();
}

/**
 * Log detailed navigation timing information
 */
function logNavigationTiming(): void {
  if (typeof window === 'undefined' || !performance.getEntriesByType) {
    return;
  }

  try {
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    if (navigationEntry) {
      logger.debug('Navigation timing', {
        dns_lookup: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
        tcp_connect: navigationEntry.connectEnd - navigationEntry.connectStart,
        request_time: navigationEntry.responseStart - navigationEntry.requestStart,
        response_time: navigationEntry.responseEnd - navigationEntry.responseStart,
        dom_processing:
          navigationEntry.domContentLoadedEventEnd -
          navigationEntry.domContentLoadedEventStart,
        total_load_time: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
        navigation_type: navigationEntry.type,
      });
    }
  } catch (error) {
    logger.debug('Navigation timing measurement failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Manually report a custom performance metric
 */
export function reportCustomMetric(name: string, value: number, unit: string = 'ms'): void {
  logger.info('Custom performance metric', {
    metric_name: name,
    metric_value: value,
    metric_unit: unit,
  });
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
}
