import { getStorage } from 'firebase/storage';
import { getFirebaseApp } from './firebaseApp.js';
import { env } from '../../config/env.js';

let storage = null;

export function getFirebaseStorage() {
  if (!storage) {
    const app = getFirebaseApp();
    storage = getStorage(app);

    if (env.features.debug) {
      console.log('[Firebase] Storage initialized');
    }
  }

  return storage;
}

export { storage };
