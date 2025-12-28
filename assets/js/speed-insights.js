/**
 * Speed Insights Integration
 * Initializes Vercel Speed Insights for performance monitoring
 */

import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Initialize Speed Insights
 * This should be called once in your app, and must run in the client
 */
export function initSpeedInsights() {
  try {
    injectSpeedInsights();
  } catch (error) {
    console.warn('Speed Insights initialization warning:', error);
  }
}

export default initSpeedInsights;
