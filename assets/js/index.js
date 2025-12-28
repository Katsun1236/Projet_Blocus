import { auth, supabase } from './supabase-config.js';
import { showMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {

    const handleGoogleAuth = async (e) => {
        e.preventDefault();

        try {
            showMessage('Ouverture de Google...', 'info');

            // Créer l'URL d'authentification OAuth
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/pages/auth/callback.html`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account'
                    },
                    skipBrowserRedirect: true // On gère la redirection nous-mêmes
                }
            });

            if (error) throw error;

            // Ouvrir une popup au lieu d'une redirection complète
            const authUrl = data.url;
            const width = 500;
            const height = 600;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            const popup = window.open(
                authUrl,
                'Google Sign In',
                `width=${width},height=${height},left=${left},top=${top},toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0`
            );

            if (!popup) {
                showMessage('Popup bloquée. Autorise les popups pour ce site.', 'error');
                return;
            }

            // Écouter le message de la popup quand l'auth est terminée
            const handleAuthMessage = async (event) => {
                // Vérifier l'origine pour la sécurité
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'supabase-auth-success') {
                    window.removeEventListener('message', handleAuthMessage);
                    popup.close();

                    showMessage('Connexion réussie !', 'success');

                    // Petit délai pour laisser la session se propager
                    setTimeout(() => {
                        // Vérifier où rediriger (callback.html le fera)
                        window.location.href = '/pages/auth/callback.html';
                    }, 500);
                }
            };

            window.addEventListener('message', handleAuthMessage);

            // Vérifier si la popup est fermée manuellement
            const checkPopup = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkPopup);
                    window.removeEventListener('message', handleAuthMessage);
                }
            }, 500);

        } catch (error) {
            console.error("Erreur Auth Google:", error);
            showMessage(`Erreur de connexion: ${error.message}`, 'error');
        }
    };

    const googleLoginBtn = document.getElementById('google-login');
    const googleRegisterBtn = document.getElementById('google-register');

    if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleAuth);
    if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleAuth);

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button[type="submit"]');

            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
            btn.disabled = true;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                showMessage('Connexion réussie !', 'success');
                window.location.href = '../app/dashboard.html';
            } catch (error) {
                console.error("Login Error:", error);

                let msg = "Une erreur est survenue.";

                if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    msg = "Email ou mot de passe incorrect.";
                } else if (error.code === 'auth/too-many-requests') {
                    msg = "Trop de tentatives échouées. Réessaie plus tard.";
                } else if (error.code === 'auth/invalid-email') {
                    msg = "Format d'email invalide.";
                }

                showMessage(msg, 'error');

                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pseudo = document.getElementById('pseudo').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const btn = registerForm.querySelector('button[type="submit"]');

            if (password !== confirmPassword) {
                showMessage("Les mots de passe ne correspondent pas.", 'error');
                return;
            }

            if (password.length < 6) {
                showMessage("Le mot de passe doit faire au moins 6 caractères.", 'error');
                return;
            }

            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
            btn.disabled = true;

            try {
                const { user } = await auth.createUserWithEmailAndPassword(email, password);

                // Mettre à jour le profil avec le pseudo
                await supabase.from('users').update({
                    first_name: pseudo
                }).eq('id', user.id);

                showMessage('Compte créé avec succès !', 'success');
                setTimeout(() => {
                    window.location.href = 'onboarding.html';
                }, 1500);

            } catch (error) {
                console.error("Register Error:", error);
                let msg = "Erreur lors de l'inscription.";

                if (error.code === 'auth/email-already-in-use') {
                    msg = "Cet email est déjà utilisé. Essaie de te connecter.";
                } else if (error.code === 'auth/weak-password') {
                    msg = "Le mot de passe est trop faible.";
                } else if (error.code === 'auth/invalid-email') {
                    msg = "L'adresse email est invalide.";
                }

                showMessage(msg, 'error');

                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

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
});
