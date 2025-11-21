'use client';

import { useEffect } from 'react';

let telemetryStarted = false;

/**
 * Initialize OpenTelemetry for frontend tracing
 * Exports traces to OTEL Collector via HTTP
 */
function initializeTelemetry() {
  if (typeof window === 'undefined') {
    return;
  }

  // Dynamic imports to avoid SSR issues
  import('@opentelemetry/api').then(({ trace }) => {
    import('@opentelemetry/sdk-trace-web').then(({ WebTracerProvider }) => {
      import('@opentelemetry/exporter-trace-otlp-http').then(({ OTLPTraceExporter }) => {
        import('@opentelemetry/resources').then(({ Resource }) => {
          import('@opentelemetry/instrumentation-fetch').then(({ FetchInstrumentation }) => {
            import('@opentelemetry/sdk-trace-base').then(({ BatchSpanProcessor }) => {
              try {
                // Create resource with service information
                const resource = Resource.default().merge(
                  new Resource({
                    'service.name': 'uns-claudejp-frontend',
                    'service.version': '5.4.1',
                    'deployment.environment': process.env.NODE_ENV || 'development',
                  })
                );

                // Create OTLP exporter targeting the collector
                const exporter = new OTLPTraceExporter({
                  url: process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
                  headers: {},
                });

                // Create tracer provider
                const provider = new WebTracerProvider({
                  resource,
                });

                // Add batch span processor
                provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
                  maxQueueSize: 100,
                  scheduledDelayMillis: 500,
                }));

                // Register the provider
                provider.register();

                // Register instrumentation for fetch API
                const fetchInstrumentation = new FetchInstrumentation({
                  propagateTraceHeaderCorsUrls: [
                    /localhost:8000/,  // Backend API
                    /\/api\//,          // Any API routes
                  ],
                  clearTimingResources: true,
                  applyCustomAttributesOnSpan: (span, request, result) => {
                    // Add custom attributes to fetch spans
                    if (request instanceof Request) {
                      span.setAttribute('http.url', request.url);
                      span.setAttribute('http.method', request.method);
                    }
                    if (result instanceof Response) {
                      span.setAttribute('http.status_code', result.status);
                    }
                  },
                });

                // Initialize instrumentation
                fetchInstrumentation.enable();
              } catch (error) {
                // Silent failure - telemetry is optional
              }
            });
          });
        });
      });
    });
  });
}

/**
 * Telemetry hook for OpenTelemetry integration
 *
 * Initializes OpenTelemetry Web SDK with:
 * - OTLP HTTP exporter to collector
 * - Automatic fetch instrumentation
 * - Trace propagation to backend
 */
export const useTelemetry = () => {
  useEffect(() => {
    if (telemetryStarted || typeof window === 'undefined') {
      return;
    }

    // Check if telemetry is enabled via environment variable
    const telemetryEnabled = process.env.NEXT_PUBLIC_OTEL_ENABLED !== 'false';

    if (!telemetryEnabled) {
      return;
    }

    initializeTelemetry();
    telemetryStarted = true;

    return () => {
      // Cleanup if needed
      telemetryStarted = false;
    };
  }, []);
};

/**
 * Get the current tracer instance
 * Use this to create custom spans in your components
 */
export function getTracer() {
  if (typeof window === 'undefined') {
    return null;
  }

  return import('@opentelemetry/api').then(({ trace }) => {
    return trace.getTracer('uns-claudejp-frontend', '5.4.1');
  });
}

/**
 * Create a custom span for manual instrumentation
 * @param name Span name
 * @param fn Function to execute within the span
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const tracer = await getTracer();

  if (!tracer) {
    return fn();
  }

  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.setStatus({
        code: 2, // ERROR
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}
