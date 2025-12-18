import { auth, googleProvider } from './config.js';
import { 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile,
    getAdditionalUserInfo // Import nécessaire pour savoir si c'est un nouveau user
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { showMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- FONCTION COMMUNE GOOGLE AUTH ---
    const handleGoogleAuth = async (e) => {
        e.preventDefault(); 
        
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Récupération des infos additionnelles pour savoir si c'est une création de compte
            const { isNewUser } = getAdditionalUserInfo(result);
            console.log("Google User:", user.email, "Nouveau ?", isNewUser);
            
            showMessage('Connexion Google réussie !', 'success');
            
            setTimeout(() => {
                if (isNewUser) {
                    // Si c'est la première fois : Onboarding
                    // On est dans /pages/auth/, donc onboarding.html est juste à côté
                    window.location.href = 'onboarding.html';
                } else {
                    // Sinon : Dashboard
                    window.location.href = '../app/dashboard.html';
                }
            }, 1500);

        } catch (error) {
            console.error("Erreur Auth Google:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                showMessage("Connexion annulée.", 'error');
            } else if (error.code === 'auth/popup-blocked') {
                showMessage("Popup bloqué. Autorisez les popups pour ce site.", 'error');
            } else {
                showMessage(`Erreur Google: ${error.message}`, 'error');
            }
        }
    };

    // --- LISTENERS ---

    // 1. Boutons Google (Login & Register)
    const googleLoginBtn = document.getElementById('google-login');
    const googleRegisterBtn = document.getElementById('google-register');

    if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleAuth);
    if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleAuth);

    // 2. Formulaire de Connexion (Email/Pass)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim(); 
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button[type="submit"]');

            // Feedback visuel
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
            btn.disabled = true;

            try {
                await signInWithEmailAndPassword(auth, email, password);
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
                
                // Reset bouton
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 3. Formulaire d'Inscription (Email/Pass)
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

            // Feedback visuel
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
            btn.disabled = true;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Mise à jour du profil (Pseudo)
                await updateProfile(userCredential.user, {
                    displayName: pseudo
                });

                showMessage('Compte créé avec succès !', 'success');
                setTimeout(() => {
                    // Redirection vers l'onboarding pour compléter le profil
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

                // Reset bouton
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 4. Toggle Password Visibility (UI)
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