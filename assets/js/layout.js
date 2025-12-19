import { auth } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initProfileDropdown();
});

function initSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    // Détermine le chemin racine (si on est dans pages/app/ ou à la racine)
    // Astuce : On regarde combien de niveaux on doit remonter
    const path = window.location.pathname;
    let rootPath = "/";
    if (path.includes('/pages/app/') || path.includes('/pages/auth/') || path.includes('/pages/admin/')) {
        // Sur Netlify ou en prod, les chemins absolus "/" sont préférables
        // Assure-toi que tes assets sont bien à la racine du site publié
        rootPath = "/"; 
    }

    // Le HTML de la sidebar
    const sidebarHTML = `
        <div class="h-full flex flex-col justify-between bg-gray-900/90 backdrop-blur-md border-r border-white/5 w-20 lg:w-64 transition-all duration-300">
            <!-- Logo -->
            <div class="p-6 flex items-center justify-center lg:justify-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                    <i class="fas fa-cube text-white text-lg"></i>
                </div>
                <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden lg:block">Blocus</span>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 px-4 space-y-2 mt-8 overflow-y-auto custom-scrollbar">
                ${createNavLink('/pages/app/dashboard.html', 'fa-home', 'Dashboard')}
                ${createNavLink('/pages/app/courses.html', 'fa-book', 'Mes Cours')}
                ${createNavLink('/pages/app/synthesize.html', 'fa-magic', 'Synthétiser')}
                ${createNavLink('/pages/app/quiz.html', 'fa-brain', 'Quiz IA')}
                ${createNavLink('/pages/app/planning.html', 'fa-calendar-alt', 'Planning')}
                ${createNavLink('/pages/app/community.html', 'fa-users', 'Communauté')}
                
                <div class="pt-4 mt-4 border-t border-white/5">
                    ${createNavLink('/pages/app/upload.html', 'fa-cloud-upload-alt', 'Upload', true)}
                </div>
            </nav>

            <!-- User Footer -->
            <div class="p-4 border-t border-white/5">
                <button id="logout-btn" class="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all group">
                    <i class="fas fa-sign-out-alt transition-transform group-hover:-translate-x-1"></i>
                    <span class="hidden lg:block font-medium">Déconnexion</span>
                </button>
            </div>
        </div>
    `;

    sidebarContainer.innerHTML = sidebarHTML;

    // Gestion Déconnexion
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '/pages/auth/login.html';
        } catch (error) {
            console.error("Erreur déconnexion:", error);
        }
    });
}

// Fonction utilitaire pour créer les liens actifs
function createNavLink(href, icon, text, isSpecial = false) {
    // Vérifie si le lien correspond à la page actuelle
    const currentPath = window.location.pathname;
    const isActive = currentPath.includes(href) || (href === '/' && currentPath === '/index.html');
    
    // Classes de base
    let classes = "flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group relative overflow-hidden ";
    
    if (isActive) {
        classes += "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20";
    } else {
        classes += "text-gray-400 hover:bg-white/5 hover:text-white";
    }

    // Style spécial pour le bouton Upload
    if (isSpecial && !isActive) {
        classes += " border border-indigo-500/30 hover:border-indigo-500/60";
    }

    return `
        <a href="${href}" class="${classes}">
            <i class="fas ${icon} w-6 text-center ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-400'} transition-colors"></i>
            <span class="font-medium hidden lg:block">${text}</span>
            ${isActive ? '<div class="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full"></div>' : ''}
        </a>
    `;
}

function initProfileDropdown() {
    // Si tu as besoin d'injecter le profil dans le header automatiquement
    // Tu peux ajouter cette logique ici plus tard
}