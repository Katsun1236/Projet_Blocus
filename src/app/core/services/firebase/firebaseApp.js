import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../config/firebase.config.js';
import { env } from '../../config/env.js';

let app = null;

export function getFirebaseApp() {
  if (!app) {
    app = initializeApp(firebaseConfig);

    if (env.features.debug) {
      console.log('[Firebase] App initialized');
    }
  }

  return app;
}

export { app };
