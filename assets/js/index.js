import { auth, googleProvider } from './config.js';
import { 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { showMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- FONCTION COMMUNE GOOGLE AUTH ---
    const handleGoogleAuth = async (e) => {
        e.preventDefault(); // Empêche le submit classique
        
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log("Google User:", user);
            
            showMessage('Connexion Google réussie !', 'success');
            
            // Redirection intelligente (on pourrait vérifier si c'est une 1ère connexion pour onboarding)
            setTimeout(() => {
                window.location.href = '../app/dashboard.html';
            }, 1500);

        } catch (error) {
            console.error("Erreur Auth Google:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                showMessage("Connexion annulée (fenêtre fermée).", 'error');
            } else if (error.code === 'auth/popup-blocked') {
                showMessage("Le popup a été bloqué par le navigateur.", 'error');
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
            const email = document.getElementById('email').value;
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
                let msg = "Email ou mot de passe incorrect.";
                if (error.code === 'auth/user-not-found') msg = "Aucun compte trouvé avec cet email.";
                if (error.code === 'auth/wrong-password') msg = "Mot de passe incorrect.";
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
            const pseudo = document.getElementById('pseudo').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const btn = registerForm.querySelector('button[type="submit"]');

            if (password !== confirmPassword) {
                showMessage("Les mots de passe ne correspondent pas.", 'error');
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
                    window.location.href = '../auth/onboarding.html';
                }, 1500);

            } catch (error) {
                console.error("Register Error:", error);
                let msg = "Erreur lors de l'inscription.";
                if (error.code === 'auth/email-already-in-use') msg = "Cet email est déjà utilisé.";
                if (error.code === 'auth/weak-password') msg = "Le mot de passe doit faire au moins 6 caractères.";
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