/**
 * Vercel Web Analytics Integration
 * Initializes Vercel Web Analytics for tracking page views and user interactions
 * Note: This module dynamically imports @vercel/analytics for production builds
 */

/**
 * Initialize Vercel Web Analytics
 * This should be called once in your app, and must run in the client
 * Uses the inject() function from @vercel/analytics which works for vanilla JS/HTML
 */
export async function initWebAnalytics() {
  // Web Analytics works in production builds (Vercel)
  // In local dev, this is a no-op to avoid import errors
  if (typeof window !== 'undefined') {
    try {
      // Dynamically import the analytics package
      const { inject } = await import('@vercel/analytics');
      
      // Initialize the tracking script
      inject();
      
      console.log('Vercel Web Analytics initialized successfully');
    } catch (error) {
      // Silently fail in local dev or if package is not available
      console.debug('Web Analytics not available in this environment:', error.message);
    }
  }
}

export default initWebAnalytics;
