import { env } from '../config/env.js';
import { showToast } from '../../shared/components/ui/Toast.js';

export class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Unhandled Promise Rejection]:', event.reason);
      this.logError(event.reason, 'unhandledrejection');
      event.preventDefault();
    });

    window.addEventListener('error', (event) => {
      console.error('[Global Error]:', event.error);
      this.logError(event.error, 'global');
    });
  }

  handleFirebaseError(error, context = '') {
    console.error(`[Firebase Error - ${context}]:`, error);

    const errorMessages = {
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
      'auth/invalid-email': 'Adresse email invalide.',
      'auth/operation-not-allowed': 'Opération non autorisée.',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/user-disabled': 'Ce compte a été désactivé.',
      'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
      'permission-denied': 'Permission refusée. Vérifiez vos droits d\'accès.',
      'not-found': 'Ressource introuvable.',
      'already-exists': 'Cette ressource existe déjà.',
      'resource-exhausted': 'Quota dépassé. Réessayez plus tard.',
      'unauthenticated': 'Vous devez être connecté.',
      'unavailable': 'Service temporairement indisponible.'
    };

    const errorCode = error.code || 'unknown';
    const message = errorMessages[errorCode] || error.message || 'Une erreur est survenue.';

    showToast(message, 'error', 5000);
    this.logError(error, context);

    return message;
  }

  logError(error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
      userAgent: navigator.userAgent
    };

    if (env.features.debug) {
      console.error('[Error Log]:', logEntry);
    }
  }

  async tryCatch(asyncFn, context = '', showError = true) {
    try {
      return await asyncFn();
    } catch (error) {
      if (showError) {
        this.handleFirebaseError(error, context);
      } else {
        this.logError(error, context);
      }
      throw error;
    }
  }
}

export const errorHandler = new ErrorHandler();

export function handleFirebaseError(error, context) {
  return errorHandler.handleFirebaseError(error, context);
}

export async function tryCatch(asyncFn, context, showError) {
  return errorHandler.tryCatch(asyncFn, context, showError);
}
