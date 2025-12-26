import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFirebaseApp } from './firebaseApp.js';
import { firestoreSettings } from '../../config/firebase.config.js';
import { env } from '../../config/env.js';

let db = null;
let persistenceEnabled = false;

export function getFirebaseFirestore() {
  if (!db) {
    const app = getFirebaseApp();
    db = getFirestore(app);

    if (env.features.debug) {
      console.log('[Firebase] Firestore initialized');
    }
  }

  return db;
}

export async function enableFirestorePersistence() {
  if (persistenceEnabled) return true;

  const db = getFirebaseFirestore();

  try {
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true
    });
    persistenceEnabled = true;

    if (env.features.debug) {
      console.log('[Firebase] Firestore persistence enabled');
    }

    return true;
  } catch (error) {
    if (error.code === 'failed-precondition') {
      console.warn('[Firebase] Firestore persistence failed: Multiple tabs open');
    } else if (error.code === 'unimplemented') {
      console.warn('[Firebase] Firestore persistence not supported in this browser');
    } else {
      console.error('[Firebase] Firestore persistence error:', error);
    }
    return false;
  }
}

export { db };
