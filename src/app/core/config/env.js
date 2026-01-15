export const env = {
  app: {
    name: import.meta.env.VITE_APP_NAME || "Projet Blocus",
    version: import.meta.env.VITE_APP_VERSION || "2.0.0",
    env: import.meta.env.VITE_APP_ENV || "development",
  },

  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  },

  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    debug: import.meta.env.VITE_ENABLE_DEBUG !== "false",
    serviceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === "true",
  },
};

export function validateEnv() {
  // Validation removed - Supabase configuration handled in supabase-config.js
  return true;
}

if (env.features.debug) {
  console.log('[ENV] Configuration loaded:', {
    app: env.app.name,
    version: env.app.version,
    environment: env.app.env,
  });
}
