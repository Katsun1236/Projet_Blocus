import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { auth } from "./config.js";

/**
 * Vérifie si l'utilisateur est connecté.
 * @returns {Promise<User>} Une promesse qui contient l'objet User si connecté.
 * Redirige vers login.html si non connecté.
 */
export function requireAuth() {
    return new Promise((resolve, reject) => {
        // On écoute l'état de l'auth
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // On se désabonne tout de suite, on veut juste une vérification ponctuelle
            
            if (user) {
                // Utilisateur connecté, on renvoie ses infos
                resolve(user);
            } else {
                // Pas connecté -> Oust !
                console.warn("Accès refusé : Utilisateur non connecté.");
                window.location.href = "/pages/auth/login.html";
                reject(new Error("User not authenticated"));
            }
        });
    });
}