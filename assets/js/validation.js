/**
 * Form Validation Helpers
 * Amélioration de la validation côté client
 */

// Validators
export const Validators = {
    email: (value) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(value) ? null : 'Email invalide';
    },

    password: (value) => {
        if (value.length < 8) return 'Minimum 8 caractères';
        if (!/[A-Z]/.test(value)) return 'Au moins une majuscule';
        if (!/[a-z]/.test(value)) return 'Au moins une minuscule';
        if (!/[0-9]/.test(value)) return 'Au moins un chiffre';
        return null;
    },

    required: (value) => {
        return value && value.trim() ? null : 'Champ requis';
    },

    minLength: (min) => (value) => {
        return value.length >= min ? null : `Minimum ${min} caractères`;
    },

    maxLength: (max) => (value) => {
        return value.length <= max ? null : `Maximum ${max} caractères`;
    },

    match: (fieldName, otherValue) => (value) => {
        return value === otherValue ? null : `Les ${fieldName} ne correspondent pas`;
    }
};

// Validate form field
export function validateField(input, validators) {
    const value = input.value.trim();
    const errors = [];

    for (const validator of validators) {
        const error = validator(value);
        if (error) errors.push(error);
    }

    return errors;
}

// Show field errors
export function showFieldErrors(input, errors) {
    const container = input.closest('.form-field') || input.parentElement;

    // Remove existing errors
    const existingError = container.querySelector('.field-error');
    if (existingError) existingError.remove();

    // Add red border
    input.classList.toggle('border-red-500', errors.length > 0);
    input.classList.toggle('border-gray-700', errors.length === 0);

    // Show first error
    if (errors.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-500 text-sm mt-1';
        errorDiv.textContent = errors[0];
        container.appendChild(errorDiv);
    }
}

// Validate entire form
export function validateForm(form, validationRules) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, validators] of Object.entries(validationRules)) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (!input) continue;

        const fieldErrors = validateField(input, validators);
        if (fieldErrors.length > 0) {
            errors[fieldName] = fieldErrors;
            isValid = false;
            showFieldErrors(input, fieldErrors);
        } else {
            showFieldErrors(input, []);
        }
    }

    return { isValid, errors };
}

// Real-time validation
export function setupRealTimeValidation(form, validationRules) {
    for (const [fieldName, validators] of Object.entries(validationRules)) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (!input) continue;

        input.addEventListener('blur', () => {
            const errors = validateField(input, validators);
            showFieldErrors(input, errors);
        });

        input.addEventListener('input', () => {
            // Clear errors on input
            if (input.classList.contains('border-red-500')) {
                const errors = validateField(input, validators);
                if (errors.length === 0) {
                    showFieldErrors(input, []);
                }
            }
        });
    }
}

// Network error handler avec retry
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}

// Network status detector
export class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showStatus('Connexion rétablie', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showStatus('Connexion perdue', 'error');
        });
    }

    showStatus(message, type) {
        const statusBar = document.getElementById('network-status');
        if (!statusBar) {
            const bar = document.createElement('div');
            bar.id = 'network-status';
            bar.className = `fixed top-0 left-0 right-0 z-[101] text-center py-2 text-sm font-bold ${
                type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white`;
            bar.textContent = message;
            document.body.prepend(bar);

            if (type === 'success') {
                setTimeout(() => bar.remove(), 3000);
            }
        }
    }
}

console.log('✅ Validation module loaded');
