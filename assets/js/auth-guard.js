import { supabase } from "./supabase-config.js";

/**
 * Requires user to be authenticated before proceeding
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000ms)
 * @returns {Promise<User>} - Resolves with authenticated user
 * @throws {Error} - If not authenticated or timeout
 */
export function requireAuth(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        let isSettled = false;
        let unsubscribe = null;

        // Timeout safeguard
        const timeoutId = setTimeout(() => {
            if (!isSettled) {
                isSettled = true;
                if (unsubscribe) unsubscribe();
                reject(new Error('Authentication check timeout - service unavailable'));
            }
        }, timeoutMs);

        // Watch authentication state
        try {
            unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
                if (!isSettled) {
                    if (session?.user) {
                        isSettled = true;
                        clearTimeout(timeoutId);
                        unsubscribe?.();
                        resolve(session.user);
                    } else if (event === 'SIGNED_OUT' || !session) {
                        isSettled = true;
                        clearTimeout(timeoutId);
                        unsubscribe?.();
                        window.location.href = "/pages/auth/login.html";
                        reject(new Error("Not authenticated"));
                    }
                }
            });
        } catch (error) {
            if (!isSettled) {
                isSettled = true;
                clearTimeout(timeoutId);
                reject(error);
            }
        }
    });
}

/**
 * Check if user is authenticated without redirecting
 * @returns {Promise<boolean>} - true if authenticated, false otherwise
 */
export async function isAuthenticated() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    } catch {
        return false;
    }
}

/**
 * Get current authenticated user
 * @returns {Promise<User|null>} - User object or null if not authenticated
 */
export async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch {
        return null;
    }
}