export const env = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDmC7x4_bwR3epzhzYkC9xdpkEHO6_E2kY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "projet-blocus-v2.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "projet-blocus-v2",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "projet-blocus-v2.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "12006785680",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:12006785680:web:d1b649979fe0a76b628e15",
  },

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
  const required = [
    'firebase.apiKey',
    'firebase.authDomain',
    'firebase.projectId',
  ];

  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], env);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

if (env.features.debug) {
  console.log('[ENV] Configuration loaded:', {
    app: env.app.name,
    version: env.app.version,
    environment: env.app.env,
  });
}
