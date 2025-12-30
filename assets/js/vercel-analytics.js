// Vercel Web Analytics initialization
// This module initializes Vercel Web Analytics for tracking
// Import this module in your main app entry point

import { inject } from '@vercel/analytics';

// Initialize analytics (safe to call multiple times)
try {
  inject();
} catch (error) {
  console.error('Failed to initialize Vercel Web Analytics:', error);
}
