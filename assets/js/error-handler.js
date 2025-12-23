// assets/js/error-handler.js
// Système centralisé de gestion d'erreurs

/**
 * Affiche un message toast à l'utilisateur
 * @param {string} message - Le message à afficher
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Durée en ms (défaut: 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
    // Retirer un éventuel toast existant
    const existingToast = document.getElementById('global-toast');
    if (existingToast) existingToast.remove();

    // Créer le toast
    const toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = `fixed bottom-6 right-6 max-w-md bg-gray-900 border rounded-xl shadow-2xl z-[9999] p-4 flex items-start gap-3 animate-float`;

    // Icônes et couleurs selon le type
    const configs = {
        success: { icon: 'fa-check-circle', color: 'text-green-400', border: 'border-green-500/30' },
        error: { icon: 'fa-exclamation-circle', color: 'text-red-400', border: 'border-red-500/30' },
        warning: { icon: 'fa-exclamation-triangle', color: 'text-yellow-400', border: 'border-yellow-500/30' },
        info: { icon: 'fa-info-circle', color: 'text-indigo-400', border: 'border-indigo-500/30' }
    };

    const config = configs[type] || configs.info;
    toast.classList.add(config.border);

    toast.innerHTML = `
        <div class="${config.color} text-xl flex-shrink-0">
            <i class="fas ${config.icon}"></i>
        </div>
        <div class="flex-1">
            <p class="text-white text-sm leading-relaxed">${message}</p>
        </div>
        <button class="text-gray-500 hover:text-white transition-colors ml-2" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(toast);

    // Auto-remove après duration
    setTimeout(() => {
        if (toast && toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

/**
 * Gestion centralisée des erreurs Firebase
 * @param {Error} error - L'erreur Firebase
 * @param {string} context - Contexte de l'erreur (ex: "connexion", "upload")
 */
export function handleFirebaseError(error, context = '') {
    console.error(`[Firebase Error - ${context}]:`, error);

    // Messages d'erreur traduits et user-friendly
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

    // Logging pour debug (peut être envoyé à un service de monitoring)
    logError(error, context);
}

/**
 * Log les erreurs (console + optionnel: service externe)
 * @param {Error} error
 * @param {string} context
 */
function logError(error, context) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        context,
        code: error.code,
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent
    };

    // Console pour développement
    console.error('[Error Log]:', logEntry);

    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    // if (window.Sentry) {
    //     Sentry.captureException(error, { contexts: { custom: logEntry } });
    // }
}

/**
 * Gestionnaire d'erreurs global pour les promesses non gérées
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    logError(event.reason, 'unhandledrejection');
    event.preventDefault(); // Empêche l'affichage dans la console navigateur
});

/**
 * Gestionnaire d'erreurs global
 */
window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error);
    logError(event.error, 'global');
});

/**
 * Wrapper pour les appels async avec gestion d'erreur automatique
 * @param {Function} asyncFn - Fonction async à exécuter
 * @param {string} context - Contexte pour le logging
 * @param {boolean} showError - Afficher le toast d'erreur (défaut: true)
 */
export async function tryCatch(asyncFn, context = '', showError = true) {
    try {
        return await asyncFn();
    } catch (error) {
        if (showError) {
            handleFirebaseError(error, context);
        } else {
            logError(error, context);
        }
        throw error; // Re-throw pour permettre gestion custom si nécessaire
    }
}
