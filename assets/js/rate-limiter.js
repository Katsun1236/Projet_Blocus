/**
 * Client-side Rate Limiting Utility
 * Prevents brute force attacks on auth endpoints
 */

class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Unique identifier (email, IP, etc)
   * @returns {object} - { allowed: boolean, remaining: number, resetTime: Date }
   */
  check(key) {
    const now = Date.now();
    const record = this.attempts.get(key) || { count: 0, resetTime: now + this.windowMs };

    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + this.windowMs;
    }

    record.count++;
    this.attempts.set(key, record);

    return {
      allowed: record.count <= this.maxAttempts,
      remaining: Math.max(0, this.maxAttempts - record.count),
      resetTime: new Date(record.resetTime),
      attemptNumber: record.count
    };
  }

  /**
   * Reset rate limit for a key
   * @param {string} key - Unique identifier
   */
  reset(key) {
    this.attempts.delete(key);
  }

  /**
   * Clear all attempts (use carefully!)
   */
  clear() {
    this.attempts.clear();
  }
}

// Create instances for different operations
export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 min
export const registrationLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 per hour
export const passwordResetLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 per hour
export const apiLimiter = new RateLimiter(100, 60 * 1000); // 100 per minute

/**
 * Check if login attempt is allowed
 * @param {string} email - User email
 * @returns {object} - Limit status
 */
export function checkLoginAttempt(email) {
  return loginLimiter.check(email.toLowerCase());
}

/**
 * Check if registration is allowed
 * @param {string} email - User email
 * @returns {object} - Limit status
 */
export function checkRegistrationAttempt(email) {
  return registrationLimiter.check(email.toLowerCase());
}

/**
 * Check if password reset is allowed
 * @param {string} email - User email
 * @returns {object} - Limit status
 */
export function checkPasswordResetAttempt(email) {
  return passwordResetLimiter.check(email.toLowerCase());
}

/**
 * Check if API call is allowed
 * @param {string} endpoint - API endpoint
 * @returns {object} - Limit status
 */
export function checkApiCall(endpoint) {
  return apiLimiter.check(endpoint);
}

/**
 * Clear rate limit for email (after successful login)
 * @param {string} email - User email
 */
export function clearLoginAttempt(email) {
  loginLimiter.reset(email.toLowerCase());
}

/**
 * Clear all rate limits (admin use only)
 */
export function clearAllLimits() {
  loginLimiter.clear();
  registrationLimiter.clear();
  passwordResetLimiter.clear();
  apiLimiter.clear();
}

export default RateLimiter;
