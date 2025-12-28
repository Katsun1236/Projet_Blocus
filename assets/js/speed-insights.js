/**
 * Speed Insights Integration
 * Initializes Vercel Speed Insights for performance monitoring
 * Note: Only works in production builds with npm packages
 */

/**
 * Initialize Speed Insights
 * This should be called once in your app, and must run in the client
 */
export function initSpeedInsights() {
  // Speed Insights only works in production builds (Vercel)
  // In local dev, this is a no-op to avoid import errors
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Will be bundled by Vercel in production
    import('@vercel/speed-insights')
      .then(({ injectSpeedInsights }) => {
        injectSpeedInsights();
      })
      .catch(() => {
        // Silently fail in local dev
      });
  }
}

export default initSpeedInsights;
