import { auth } from './config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

export function initLayout(activePageId) {
    // 1. Inject Sidebar if not present
    // (Ta logique existante d'injection sidebar...)
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar && document.getElementById('app-container')) {
        injectSidebar(activePageId);
    }

    // 2. Mobile Menu Logic
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu'); // Assure-toi que l'ID correspond à ton HTML injecté
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }

    // 3. CORRECTIF HEADER PROFIL CLICK
    // On cible le conteneur du profil dans le header
    // Souvent c'est une div qui contient #user-avatar-header et #user-name-header
    const headerProfileContainer = document.getElementById('user-avatar-header')?.parentElement;
    
    if (headerProfileContainer) {
        // On rend le curseur "pointer" pour montrer que c'est cliquable
        headerProfileContainer.style.cursor = 'pointer';
        headerProfileContainer.title = "Voir mon profil"; // Tooltip

        // On ajoute l'event listener
        headerProfileContainer.addEventListener('click', () => {
            // Redirection vers la page profil
            // On gère le chemin relatif selon où on est
            const currentPath = window.location.pathname;
            if (currentPath.includes('/pages/app/')) {
                window.location.href = 'profile.html';
            } else {
                window.location.href = 'pages/app/profile.html';
            }
        });
    }
}

function injectSidebar(activePageId) {
    const container = document.createElement('div');
    container.id = 'sidebar-container';
    
    // Déterminer le chemin relatif pour les liens (selon si on est à la racine ou dans /pages/app/)
    const inAppPages = window.location.pathname.includes('/pages/app/');
    const basePath = inAppPages ? './' : './pages/app/';
    const rootPath = inAppPages ? '../../' : './';

    // HTML de la sidebar
    container.innerHTML = `
        <!-- SIDEBAR DESKTOP -->
        <aside class="fixed top-0 left-0 w-64 h-full bg-[#0a0a0f] border-r border-gray-800/50 z-40 hidden md:flex flex-col transition-transform duration-300">
            <!-- Logo -->
            <div class="h-20 flex items-center px-8 border-b border-gray-800/50">
                <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
                    <i class="fas fa-cube text-white text-lg"></i>
                </div>
                <span class="text-xl font-display font-bold text-white tracking-wide">Blocus<span class="text-indigo-500">.</span></span>
            </div>

            <!-- Nav Links -->
            <nav class="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
                ${renderNavLink('dashboard', 'Dashboard', 'fa-home', basePath + 'dashboard.html', activePageId)}
                ${renderNavLink('courses', 'Mes Cours', 'fa-folder-open', basePath + 'courses.html', activePageId)}
                ${renderNavLink('quiz', 'Quiz & IA', 'fa-brain', basePath + 'quiz.html', activePageId)}
                ${renderNavLink('synthesize', 'Synthèses', 'fa-magic', basePath + 'synthesize.html', activePageId)}
                ${renderNavLink('community', 'Communauté', 'fa-users', basePath + 'community.html', activePageId)}
                ${renderNavLink('planning', 'Planning', 'fa-calendar-alt', basePath + 'planning.html', activePageId)}
            </nav>

            <!-- Bottom Actions -->
            <div class="p-4 border-t border-gray-800/50">
                ${renderNavLink('profile', 'Mon Profil', 'fa-user-circle', basePath + 'profile.html', activePageId)}
                <button id="sidebar-logout-btn" class="w-full mt-2 flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 transition-colors">
                    <i class="fas fa-sign-out-alt w-5"></i>
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>

        <!-- MENU MOBILE OVERLAY (Injecté mais caché) -->
        <div id="mobile-menu" class="hidden fixed inset-0 z-50 bg-black/95 flex flex-col p-6 md:hidden animate-fade-in">
            <div class="flex justify-between items-center mb-8">
                <span class="text-xl font-bold text-white">Menu</span>
                <button id="close-mobile-menu" class="text-gray-400 hover:text-white"><i class="fas fa-times text-2xl"></i></button>
            </div>
            <nav class="space-y-4">
                <a href="${basePath}dashboard.html" class="block text-lg text-gray-300 hover:text-white">Dashboard</a>
                <a href="${basePath}courses.html" class="block text-lg text-gray-300 hover:text-white">Mes Cours</a>
                <a href="${basePath}quiz.html" class="block text-lg text-gray-300 hover:text-white">Quiz IA</a>
                <a href="${basePath}community.html" class="block text-lg text-gray-300 hover:text-white">Communauté</a>
                <a href="${basePath}profile.html" class="block text-lg text-gray-300 hover:text-white">Profil</a>
            </nav>
        </div>
    `;

    document.body.prepend(container);

    // Logout Logic (Sidebar)
    document.getElementById('sidebar-logout-btn')?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = rootPath + 'pages/auth/login.html';
        } catch (e) {
            console.error("Logout error", e);
        }
    });

    // Mobile Menu Close Logic
    const closeMenuBtn = document.getElementById('close-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn'); // Bouton hamburger dans la page

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    }
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.remove('hidden'));
    }
}

function renderNavLink(id, label, icon, href, activeId) {
    const isActive = id === activeId;
    const baseClass = "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group";
    const activeClass = "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20";
    const inactiveClass = "text-gray-400 hover:text-white hover:bg-white/5";
    const iconClass = isActive ? "text-white" : "text-gray-500 group-hover:text-indigo-400 transition-colors";

    return `
        <a href="${href}" class="${baseClass} ${isActive ? activeClass : inactiveClass}">
            <i class="fas ${icon} w-5 ${iconClass}"></i>
            <span>${label}</span>
            ${isActive ? '<i class="fas fa-chevron-right ml-auto text-xs opacity-50"></i>' : ''}
        </a>
    `;
}