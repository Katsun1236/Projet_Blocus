import { onAuthStateChanged } from '../services/firebase/firebaseAuth.js';
import { ROUTES } from '../../shared/constants/index.js';

export function requireAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged((user) => {
      unsubscribe();

      if (user) {
        resolve(user);
      } else {
        console.warn('[Auth] Accès refusé : Utilisateur non connecté.');
        window.location.href = ROUTES.LOGIN;
        reject(new Error('User not authenticated'));
      }
    });
  });
}

export function redirectIfAuthenticated() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged((user) => {
      unsubscribe();

      if (user) {
        console.log('[Auth] Utilisateur déjà connecté, redirection...');
        window.location.href = ROUTES.DASHBOARD;
        reject(new Error('User already authenticated'));
      } else {
        resolve();
      }
    });
  });
}

export function setupAuthListener(onAuthenticated, onUnauthenticated) {
  return onAuthStateChanged((user) => {
    if (user) {
      onAuthenticated(user);
    } else {
      onUnauthenticated();
    }
  });
}
