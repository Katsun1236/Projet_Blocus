/**
 * Gère les éléments d'interface communs (Sidebar, Header)
 */

/**
 * Initialise l'état actif de la sidebar en fonction de l'URL actuelle.
 * Cherche les liens avec la classe .sidebar-link et compare leur href.
 */
export function initSidebar() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.sidebar-link');

    links.forEach(link => {
        // On nettoie le chemin du lien (ex: './dashboard.html' -> '/pages/app/dashboard.html')
        // Ici on fait simple : si l'URL contient le href du lien (ex: "dashboard.html")
        const href = link.getAttribute('href');
        
        // Nettoyage basique pour comparaison (retire les ./ ou ../)
        const cleanHref = href.replace(/^(\.\/|\.\.\/)+/, '');

        if (currentPath.includes(cleanHref) && cleanHref !== "") {
            // Style Active : Fond blanc transparent + Texte blanc + Glow
            link.classList.add('bg-white/10', 'text-white', 'border-r-2', 'border-indigo-500');
            link.classList.remove('text-gray-400', 'hover:bg-white/5');
        } else {
            // Style Inactif
            link.classList.add('text-gray-400', 'hover:bg-white/5');
            link.classList.remove('bg-white/10', 'text-white', 'border-r-2', 'border-indigo-500');
        }
    });
}

/**
 * Met à jour les infos du profil dans le header (si les éléments existent).
 * @param {object} user - L'objet utilisateur Firebase
 */
export function initHeaderProfile(user) {
    if (!user) return;

    const nameEl = document.getElementById('header-profile-name');
    const imgEl = document.getElementById('header-profile-img');

    if (nameEl) {
        // Affiche le pseudo ou l'email si pas de pseudo
        nameEl.textContent = user.displayName || user.email.split('@')[0];
    }

    if (imgEl && user.photoURL) {
        imgEl.src = user.photoURL;
    }
}