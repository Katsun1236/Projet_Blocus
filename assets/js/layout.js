import { auth } from './config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/**
 * Génère et injecte la Sidebar et la Topbar dans la page
 * @param {string} activePage - L'identifiant de la page active (ex: 'dashboard', 'courses')
 */
export function initLayout(activePage) {
    const appContainer = document.getElementById('app-container');
    
    if (!appContainer) {
        console.error("Erreur: L'élément #app-container est introuvable.");
        return;
    }

    // --- 1. Définition des liens du menu ---
    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'fa-home', link: 'dashboard.html' },
        { id: 'courses', label: 'Mes Cours', icon: 'fa-book', link: 'courses.html' },
        { id: 'quiz', label: 'Quiz IA', icon: 'fa-brain', link: 'quiz.html' },
        { id: 'synthesize', label: 'Synthèses', icon: 'fa-file-alt', link: 'synthesize.html' },
        { id: 'planning', label: 'Planning', icon: 'fa-calendar-alt', link: 'planning.html' },
        { id: 'community', label: 'Communauté', icon: 'fa-users', link: 'community.html' },
        { id: 'profile', label: 'Mon Profil', icon: 'fa-user', link: 'profile.html' }
    ];

    // --- 2. Construction du HTML de la Sidebar ---
    const sidebarHTML = `
        <aside class="fixed inset-y-0 left-0 w-64 bg-[#0f1115]/90 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 -translate-x-full md:translate-x-0" id="sidebar">
            
            <!-- Logo -->
            <div class="h-20 flex items-center px-8 border-b border-white/5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <i class="fas fa-graduation-cap text-white text-sm"></i>
                    </div>
                    <span class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Projet Blocus
                    </span>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="p-4 space-y-2 mt-4">
                ${menuItems.map(item => {
                    const isActive = item.id === activePage;
                    const activeClass = isActive 
                        ? 'bg-indigo-600/10 text-indigo-400 border-indigo-600/50 shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent';
                    
                    return `
                        <a href="${item.link}" class="flex items-center gap-3 px-4 py-3 rounded-xl border ${activeClass} transition-all duration-200 group">
                            <i class="fas ${item.icon} w-5 text-center ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-white'} transition-colors"></i>
                            <span class="font-medium text-sm">${item.label}</span>
                            ${isActive ? '<div class="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_currentColor]"></div>' : ''}
                        </a>
                    `;
                }).join('')}
            </nav>

            <!-- Bottom Actions -->
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#0f1115]/50">
                <button id="logout-btn" class="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group">
                    <i class="fas fa-sign-out-alt w-5 text-center text-gray-500 group-hover:text-red-400 transition-colors"></i>
                    <span class="font-medium text-sm">Déconnexion</span>
                </button>
            </div>
        </aside>

        <!-- Mobile Overlay -->
        <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden backdrop-blur-sm transition-opacity"></div>
    `;

    // --- 3. Injection dans le DOM ---
    // On crée une div wrapper pour ne pas écraser le contenu existant
    const layoutWrapper = document.createElement('div');
    layoutWrapper.innerHTML = sidebarHTML;
    
    // On insère la sidebar AU DÉBUT du container
    appContainer.prepend(layoutWrapper);

    // --- 4. Gestion Mobile (Menu Burger) ---
    // On injecte aussi un bouton menu pour mobile s'il n'existe pas déjà dans le header de la page
    const existingHeader = document.querySelector('header');
    if (existingHeader && !document.getElementById('mobile-menu-btn')) {
        const mobileBtnHTML = `
            <button id="mobile-menu-btn" class="md:hidden p-2 text-gray-400 hover:text-white mr-4">
                <i class="fas fa-bars text-xl"></i>
            </button>
        `;
        existingHeader.insertAdjacentHTML('afterbegin', mobileBtnHTML);
    }

    // Logique d'ouverture/fermeture mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const mobileBtn = document.getElementById('mobile-menu-btn');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }

    // --- 5. Gestion Déconnexion ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = '../auth/login.html';
            } catch (error) {
                console.error("Erreur lors de la déconnexion:", error);
                alert("Erreur lors de la déconnexion");
            }
        });
    }
}