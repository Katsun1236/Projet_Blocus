/**
 * 🛡️ ERROR HANDLER - Robust error management & recovery
 * Production-safe error tracking with graceful degradation
 */

import { logger } from './logger.js';
import { Alert } from './components.js';

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.isProduction = import.meta.env.PROD;
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handle(event.reason, 'UnhandledPromiseRejection');
      event.preventDefault();
    });

    // Global errors
    window.addEventListener('error', (event) => {
      this.handle(event.error || event.message, 'GlobalError', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  /**
   * Main error handler
   */
  handle(error, type = 'Error', context = {}) {
    const errorObj = this.normalizeError(error, type, context);
    this.log(errorObj);
    this.track(errorObj);
    this.display(errorObj);
    return errorObj;
  }

  /**
   * Normalize various error types
   */
  normalizeError(error, type, context) {
    let message, stack, code;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      code = error.code || error.name;
    } else if (typeof error === 'string') {
      message = error;
      stack = new Error().stack;
      code = 'StringError';
    } else if (error?.response) {
      // API/Fetch error
      message = error.message || `API Error: ${error.response.status}`;
      stack = error.stack;
      code = `HTTP_${error.response.status}`;
    } else {
      message = String(error);
      stack = new Error().stack;
      code = 'UnknownError';
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      type,
      code,
      message,
      stack,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context
      },
      status: 'new'
    };
  }

  /**
   * Log error (dev only)
   */
  log(errorObj) {
    logger.error(`[${errorObj.code}] ${errorObj.message}`, errorObj.context);
  }

  /**
   * Store and track errors
   */
  track(errorObj) {
    this.errors.push(errorObj);

    // Keep array size bounded
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Save to localStorage for debugging
    try {
      const stored = JSON.parse(localStorage.getItem('app-errors') || '[]').slice(-50);
      stored.push(errorObj);
      localStorage.setItem('app-errors', JSON.stringify(stored));
    } catch (e) {
      // Storage error, silently ignore
    }

    // Send to error tracking service (production)
    if (this.isProduction) {
      this.sendToService(errorObj);
    }
  }

  /**
   * Display error to user
   */
  display(errorObj) {
    if (this.isProduction) {
      // User-friendly message
      const message = this.getUserMessage(errorObj.code);
      Alert.create(message, 'error', 5000);
    } else {
      // Developer message
      const message = `${errorObj.type}: ${errorObj.message}`;
      Alert.create(message, 'error', 10000);
    }
  }

  /**
   * User-friendly error messages
   */
  getUserMessage(code) {
    const messages = {
      'HTTP_401': 'Session expired. Please log in again.',
      'HTTP_403': 'You don\'t have permission to do this.',
      'HTTP_404': 'Resource not found.',
      'HTTP_500': 'Server error. Please try again later.',
      'HTTP_503': 'Service unavailable. Please try again later.',
      'NetworkError': 'Network connection error. Check your internet.',
      'TimeoutError': 'Request took too long. Please try again.',
      'ValidationError': 'Invalid input. Please check your data.',
      'StorageError': 'Failed to save data. Check your storage.',
      'AuthError': 'Authentication failed. Please log in.',
      'SUPABASE_ERROR': 'Database error. Please try again later.'
    };

    return messages[code] || 'Something went wrong. Please try again.';
  }

  /**
   * Send to error tracking service
   */
  sendToService(errorObj) {
    // TODO: Implement error tracking service integration
    // Examples: Sentry, LogRocket, Rollbar, etc.
    /*
    fetch('https://your-error-tracking-service.com/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorObj)
    }).catch(() => { /* silent fail */ /*});
    */
  }

  /**
   * Get all tracked errors
   */
  getErrors(filter = {}) {
    return this.errors.filter(err => {
      if (filter.type && err.type !== filter.type) return false;
      if (filter.code && err.code !== filter.code) return false;
      if (filter.status && err.status !== filter.status) return false;
      return true;
    });
  }

  /**
   * Clear specific error
   */
  clearError(id) {
    this.errors = this.errors.filter(err => err.id !== id);
  }

  /**
   * Clear all errors
   */
  clearAll() {
    this.errors = [];
    try {
      localStorage.removeItem('app-errors');
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Export errors for debugging
   */
  export() {
    return JSON.stringify(this.errors, null, 2);
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Try-catch wrapper with error handling
 */
export function tryAsync(asyncFn, fallbackValue = null) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      errorHandler.handle(error, 'AsyncError', { fn: asyncFn.name });
      return fallbackValue;
    }
  };
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${attempt}/${maxAttempts} failed`, error.message);

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper
 */
export function timeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    errorHandler.handle(error, 'JsonParseError', { input: jsonString.slice(0, 100) });
    return fallback;
  }
}

/**
 * Safe property access
 */
export function safeGet(obj, path, fallback = null) {
  try {
    return path.split('.').reduce((current, prop) => current?.[prop], obj) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

export default errorHandler;
