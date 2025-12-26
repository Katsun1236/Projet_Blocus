import { getAuth, GoogleAuthProvider, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { getFirebaseApp } from './firebaseApp.js';
import { env } from '../../config/env.js';

let auth = null;
let googleProvider = null;

export function getFirebaseAuth() {
  if (!auth) {
    const app = getFirebaseApp();
    auth = getAuth(app);

    if (env.features.debug) {
      console.log('[Firebase] Auth initialized');
    }
  }

  return auth;
}

export function getGoogleProvider() {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }

  return googleProvider;
}

export function onAuthStateChanged(callback, errorCallback) {
  const auth = getFirebaseAuth();
  return firebaseOnAuthStateChanged(auth, callback, errorCallback);
}

export function getCurrentUser() {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}

export { auth, googleProvider };
