import { AuthService } from '../../core/services/authService.js';
import { showToast } from '../../shared/components/ui/Toast.js';
import { ROUTES } from '../../shared/constants/index.js';
import { Validators } from '../../shared/utils/validators.js';

const authService = new AuthService();

export function initRegister() {
    setupGoogleRegister();
    setupEmailRegister();
    setupPasswordToggle();
}

function setupGoogleRegister() {
    const googleRegisterBtn = document.getElementById('google-register');

    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                const { user, isNewUser } = await authService.signInWithGoogle();

                showToast('Inscription Google réussie !', 'success');

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

function setupEmailRegister() {
    const registerForm = document.getElementById('register-form');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pseudo = document.getElementById('pseudo').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const btn = registerForm.querySelector('button[type="submit"]');

        const emailError = Validators.email(email);
        if (emailError) {
            showToast(emailError, 'error');
            return;
        }

        const passwordError = Validators.password(password);
        if (passwordError) {
            showToast(passwordError, 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast("Les mots de passe ne correspondent pas.", 'error');
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
        btn.disabled = true;

        try {
            await authService.registerWithEmail(email, password, {
                displayName: pseudo
            });

            showToast('Compte créé avec succès !', 'success');

            setTimeout(() => {
                window.location.href = 'onboarding.html';
            }, 1500);

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
    let msg = "Erreur lors de l'inscription.";

    switch (error.code) {
        case 'auth/email-already-in-use':
            msg = "Cet email est déjà utilisé. Essaie de te connecter.";
            break;
        case 'auth/weak-password':
            msg = "Le mot de passe est trop faible.";
            break;
        case 'auth/invalid-email':
            msg = "L'adresse email est invalide.";
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
    document.addEventListener('DOMContentLoaded', initRegister);
}
