import { AuthService } from '../../core/services/authService.js';
import { showToast } from '../../shared/components/ui/Toast.js';
import { ROUTES } from '../../shared/constants/index.js';
import { Validators } from '../../shared/utils/validators.js';

const authService = new AuthService();

export function initLogin() {
    setupGoogleLogin();
    setupEmailLogin();
    setupPasswordToggle();
}

function setupGoogleLogin() {
    const googleLoginBtn = document.getElementById('google-login');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                const { user, isNewUser } = await authService.signInWithGoogle();

                showToast('Connexion Google réussie !', 'success');

                setTimeout(() => {
                    if (isNewUser) {
                        window.location.href = 'onboarding.html';
                    } else {
                        window.location.href = '../app/dashboard.html';
                    }
                }, 1500);

            } catch (error) {
                handleAuthError(error);
            }
        });
    }
}

function setupEmailLogin() {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button[type="submit"]');

        const emailError = Validators.email(email);
        if (emailError) {
            showToast(emailError, 'error');
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
        btn.disabled = true;

        try {
            await authService.signInWithEmail(email, password);
            showToast('Connexion réussie !', 'success');
            window.location.href = '../app/dashboard.html';
        } catch (error) {
            handleAuthError(error);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

function setupPasswordToggle() {
    const togglePassword = document.querySelectorAll('.toggle-password');

    togglePassword.forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
}

function handleAuthError(error) {
    let msg = "Une erreur est survenue.";

    switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            msg = "Email ou mot de passe incorrect.";
            break;
        case 'auth/too-many-requests':
            msg = "Trop de tentatives échouées. Réessaie plus tard.";
            break;
        case 'auth/invalid-email':
            msg = "Format d'email invalide.";
            break;
        case 'auth/popup-closed-by-user':
            msg = "Connexion annulée.";
            break;
        case 'auth/popup-blocked':
            msg = "Popup bloqué. Autorisez les popups pour ce site.";
            break;
    }

    showToast(msg, 'error');
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initLogin);
}
