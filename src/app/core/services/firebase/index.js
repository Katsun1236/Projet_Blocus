export * from './firebaseApp.js';
export * from './firebaseAuth.js';
export * from './firebaseFirestore.js';
export * from './firebaseStorage.js';
export * from './firebaseFunctions.js';

import { getFirebaseApp } from './firebaseApp.js';
import { getFirebaseAuth, getGoogleProvider } from './firebaseAuth.js';
import { getFirebaseFirestore, enableFirestorePersistence } from './firebaseFirestore.js';
import { getFirebaseStorage } from './firebaseStorage.js';
import { getFirebaseFunctions } from './firebaseFunctions.js';

export async function initializeFirebase() {
  const app = getFirebaseApp();
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();
  const storage = getFirebaseStorage();
  const functions = getFirebaseFunctions();

  await enableFirestorePersistence();

  return { app, auth, db, storage, functions };
}

export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const storage = getFirebaseStorage();
export const functions = getFirebaseFunctions();
export const googleProvider = getGoogleProvider();
