import { auth, onAuthStateChanged } from "./supabase-config.js";

export function requireAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged((user) => {
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