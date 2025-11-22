/**
 * Frontend Structured Logging - FASE 4 #3
 *
 * Lightweight browser logging system that:
 * - Sends logs to backend for centralized monitoring
 * - Provides console output for development
 * - Batches logs for efficiency
 * - Supports multiple log levels
 * - Automatically captures context (page, user, session)
 *
 * Note: For production, consider upgrading to Pino for better performance.
 * Install with: npm install pino pino-browser
 */

// Log levels enum
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp?: Date;
  context?: Record<string, any>;
}

// Logger configuration
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableBackend: boolean;
  backendUrl: string;
  batchSize: number;
  batchInterval: number; // ms
  appVersion?: string;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: process.env.NODE_ENV !== 'production',
  enableBackend: true,
  backendUrl: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/logs/frontend`
    : 'http://localhost:8000/api/logs/frontend',
  batchSize: 50,
  batchInterval: 5000, // 5 seconds
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
};

// Log level priorities for filtering
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 0,
  [LogLevel.DEBUG]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
  [LogLevel.FATAL]: 5,
};

/**
 * Browser Logger Class
 */
class BrowserLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private userId: number | null = null;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();

    // Start auto-flush timer
    if (this.config.enableBackend) {
      this.startAutoFlush();
    }

    // Flush logs before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // Capture global errors
      this.setupErrorHandlers();
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Set user ID for context
   */
  setUserId(userId: number | null): void {
    this.userId = userId;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  /**
   * Log a message at specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
    };

    // Console output for development
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Add to buffer for backend
    if (this.config.enableBackend) {
      this.logBuffer.push(logEntry);

      // Flush if buffer is full
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush();
      }
    }
  }

  /**
   * Get default context for all logs
   */
  private getDefaultContext(): Record<string, any> {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      url: window.location.href,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer || undefined,
    };
  }

  /**
   * Log to console with appropriate styling
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp?.toISOString() || new Date().toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    const styles: Record<LogLevel, string> = {
      [LogLevel.TRACE]: 'color: #666',
      [LogLevel.DEBUG]: 'color: #3b82f6',
      [LogLevel.INFO]: 'color: #10b981',
      [LogLevel.WARN]: 'color: #f59e0b',
      [LogLevel.ERROR]: 'color: #ef4444',
      [LogLevel.FATAL]: 'color: #dc2626; font-weight: bold',
    };

    console.log(
      `%c${prefix}`,
      styles[entry.level],
      entry.message,
      entry.context || ''
    );
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, this.config.batchInterval);
  }

  /**
   * Flush logs to backend
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const response = await fetch(this.config.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          app_version: this.config.appVersion,
          user_id: this.userId,
          session_id: this.sessionId,
        }),
        // Use keepalive for requests during page unload
        keepalive: true,
      });

      if (!response.ok) {
        // Log to console if backend fails
        console.error('Failed to send logs to backend:', response.status);
      }
    } catch (error) {
      // Silently fail - don't want logging to break the app
      console.error('Error sending logs to backend:', error);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', {
        error: event.error?.message || event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: String(event.promise),
      });
    });
  }

  // Public logging methods
  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

/**
 * Child Logger with inherited context
 */
class ChildLogger {
  constructor(
    private parent: BrowserLogger,
    private context: Record<string, any>
  ) {}

  private mergeContext(additionalContext?: Record<string, any>): Record<string, any> {
    return { ...this.context, ...additionalContext };
  }

  trace(message: string, context?: Record<string, any>): void {
    this.parent.trace(message, this.mergeContext(context));
  }

  debug(message: string, context?: Record<string, any>): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: Record<string, any>): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: Record<string, any>): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, context?: Record<string, any>): void {
    this.parent.error(message, this.mergeContext(context));
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.parent.fatal(message, this.mergeContext(context));
  }

  child(context: Record<string, any>): ChildLogger {
    return new ChildLogger(this.parent, this.mergeContext(context));
  }
}

// Create and export singleton logger instance
export const logger = new BrowserLogger();

// Export logger class for custom instances
export { BrowserLogger };

// Convenience function to create contextual loggers
export function createLogger(context: Record<string, any>): ChildLogger {
  return logger.child(context);
}

// Example usage in components:
// import { logger, createLogger } from '@/lib/logging';
//
// // Simple logging
// logger.info('User logged in', { userId: 123 });
//
// // Component-specific logger with context
// const componentLogger = createLogger({ component: 'UserProfile' });
// componentLogger.debug('Rendering user profile', { userId: 456 });
//
// // Child logger with additional context
// const formLogger = componentLogger.child({ form: 'registration' });
// formLogger.warn('Form validation failed', { errors: [...] });
