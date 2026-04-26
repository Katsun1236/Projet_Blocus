/**
 * LOGGER SERVICE - Production-safe logging
 * Logs only in development, silenced in production
 */

const isDev = import.meta.env.MODE === 'development' || import.meta.env.VITE_ENABLE_DEBUG === 'true';

class Logger {
  constructor(namespace = 'App') {
    this.namespace = namespace;
    this.styles = {
      log: 'color: #6366f1; font-weight: bold;',
      warn: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;',
      success: 'color: #10b981; font-weight: bold;',
      info: 'color: #0ea5e9; font-weight: bold;'
    };
  }

  #formatMessage(level, message) {
    return `[${level.toUpperCase()}] ${this.namespace}: ${message}`;
  }

  log(message, data = null) {
    if (!isDev) return;
    console.log(`%c${this.#formatMessage('log', message)}`, this.styles.log, data || '');
  }

  warn(message, data = null) {
    if (!isDev) return;
    console.warn(`%c${this.#formatMessage('warn', message)}`, this.styles.warn, data || '');
  }

  error(message, error = null) {
    if (!isDev) return;
    console.error(`%c${this.#formatMessage('error', message)}`, this.styles.error, error || '');
  }

  success(message, data = null) {
    if (!isDev) return;
    console.log(`%c${this.#formatMessage('success', message)}`, this.styles.success, data || '');
  }

  info(message, data = null) {
    if (!isDev) return;
    console.info(`%c${this.#formatMessage('info', message)}`, this.styles.info, data || '');
  }

  // For production error tracking (send to service)
  trackError(message, error, context = {}) {
    const errorData = {
      timestamp: new Date().toISOString(),
      message,
      error: error?.message || String(error),
      stack: error?.stack || '',
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    if (isDev) {
      this.error(message, errorData);
    } else {
      // Send to error tracking service (Sentry, LogRocket, etc.)
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) })
    }
  }

  // Performance monitoring
  measure(label, fn) {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.log(`⏱️ ${label}`, `${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      this.error(`⏱️ ${label} failed`, error);
      throw error;
    }
  }

  async measureAsync(label, asyncFn) {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const duration = performance.now() - start;
      this.log(`⏱️ ${label}`, `${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      this.error(`⏱️ ${label} failed`, error);
      throw error;
    }
  }
}

export const createLogger = (namespace) => new Logger(namespace);
export const logger = new Logger('Global');
