// ⚠️ DEPRECATED: Firebase configuration removed
// This project uses Supabase exclusively. Firebase is no longer used.
// All Firebase references should be migrated to use Supabase instead.

export const env = {
  // Firebase is deprecated and should not be used
  // firebase: { ... },

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
  const isDev = import.meta.env.DEV;
  
  // Validate Supabase environment variables
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  for (const key of required) {
    const value = import.meta.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  if (isDev && env.features.debug) {
    console.log('[ENV] Configuration loaded:', {
      app: env.app.name,
      version: env.app.version,
      environment: env.app.env,
    });
  }
}
