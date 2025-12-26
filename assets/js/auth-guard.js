import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { auth } from "./config.js";

export function requireAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();

            if (user) {
                resolve(user);
            } else {
                console.warn("Accès refusé : Utilisateur non connecté.");
                window.location.href = "/pages/auth/login.html";
                reject(new Error("User not authenticated"));
            }
        });
    });
}