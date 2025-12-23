import { auth, db } from './config.js'; // Import db ajouté
console.debug('[debug] /assets/js/layout.js loaded');
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"; // Import Firestore ajouté

export function initLayout(activePageId) {
    console.debug('[debug] initLayout called', activePageId, 'location=', window.location.pathname);
    // 1. Inject Sidebar if not present
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar && document.getElementById('app-container')) {
        injectSidebar(activePageId);
    }

    // 1.5 Add Home Button
    addHomeButton();

    // 2. Mobile Menu Logic - Configuration après injection ou si existant
    setupMobileMenu();

    // 3. HEADER PROFIL LOGIC (Chargement Auto)
    // On écoute l'auth ici pour mettre à jour le header globalement
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            updateHeaderProfile(user);
        }
    });

    // 4. HEADER CLICK EVENT
    const headerProfileContainer = document.getElementById('user-avatar-header')?.parentElement;
    if (headerProfileContainer) {
        headerProfileContainer.style.cursor = 'pointer';
        headerProfileContainer.title = "Voir mon profil";
        headerProfileContainer.addEventListener('click', () => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/pages/app/')) {
                window.location.href = 'profile.html';
            } else {
                window.location.href = 'pages/app/profile.html';
            }
        });
    }
}

// Fonction pour configurer le menu mobile
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        // Retirer les listeners existants
        mobileMenuBtn.replaceWith(mobileMenuBtn.cloneNode(true));
        const newBtn = document.getElementById('mobile-menu-btn');

        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    }

    // Fermer le menu en cliquant en dehors
    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

// Fonction pour ajouter le bouton retour à l'accueil
function addHomeButton() {
    const headerNav = document.querySelector('header .max-w-7xl');
    if (!headerNav) return;

    // Vérifier si le bouton existe déjà
    if (document.getElementById('home-btn-header')) return;

    const homeBtn = document.createElement('a');
    homeBtn.id = 'home-btn-header';
    homeBtn.href = '/';
    homeBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-300 hover:text-white text-sm font-medium';
    homeBtn.title = "Retour à l'accueil";
    homeBtn.innerHTML = '<i class="fas fa-home mr-2"></i> Accueil';

    // Insérer dans la section de navigation
    const navLinksContainer = headerNav.querySelector('[class*="justify"]');
    if (navLinksContainer) {
        navLinksContainer.insertBefore(homeBtn, navLinksContainer.firstChild);
    }
}

// Fonction dédiée à la mise à jour du header
async function updateHeaderProfile(user) {
    console.debug('[debug] updateHeaderProfile user', user && user.uid);
    const avatarImg = document.getElementById('user-avatar-header');
    const userNameTxt = document.getElementById('user-name-header');

    if (!avatarImg && !userNameTxt) return;

    try {
        // Essayer de récupérer les données Firestore pour avoir le prénom/photo custom
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);

        let photoURL = user.photoURL;
        let displayName = user.displayName || user.email.split('@')[0];

        if (userSnapshot.exists()) {
            const data = userSnapshot.data();
            if (data.photoURL) photoURL = data.photoURL;
            if (data.firstName) displayName = data.firstName;
        }

        // Fallback UI Avatars si pas de photo
        if (!photoURL) {
            photoURL = `https://ui-avatars.com/api/?name=${displayName}&background=random&color=fff`;
        }

        if (avatarImg) avatarImg.src = photoURL;
        if (userNameTxt) userNameTxt.textContent = displayName;

    } catch (e) {
        console.error("Erreur chargement header profil:", e);
        // Fallback Auth simple en cas d'erreur Firestore
        if (avatarImg) avatarImg.src = user.photoURL || `https://ui-avatars.com/api/?background=random`;
        if (userNameTxt) userNameTxt.textContent = user.displayName || "Étudiant";
    }
}

function injectSidebar(activePageId) {
    const container = document.createElement('div');
    container.id = 'sidebar-container';
    
    const inAppPages = window.location.pathname.includes('/pages/app/');
    const basePath = inAppPages ? './' : './pages/app/';
    const rootPath = inAppPages ? '../../' : './';

    container.innerHTML = `
        <!-- SIDEBAR DESKTOP -->
        <aside class="fixed top-0 left-0 w-64 h-full bg-[#0a0a0f] border-r border-gray-800/50 z-40 hidden md:flex flex-col transition-transform duration-300">
            <!-- Logo -->
            <div class="h-20 flex items-center px-8 border-b border-gray-800/50">
                <img src="${rootPath}assets/images/owl-logo.png" alt="Projet Blocus" class="w-9 h-9 object-contain mr-3">
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

        <!-- MENU MOBILE OVERLAY -->
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

    document.getElementById('sidebar-logout-btn')?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = rootPath + 'pages/auth/login.html';
        } catch (e) {
            console.error("Logout error", e);
        }
    });

    // Configuration du menu mobile après injection
    setupMobileMenu();
}

function renderNavLink(id, label, icon, href, activeId) {
    const isActive = id === activeId;
    const baseClass = "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group";
    const activeClass = "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20";
    const inactiveClass = "text-gray-400 hover:text-white hover:bg-white/5";
    const iconClass = isActive ? "text-white" : "text-gray-500 group-hover:text-indigo-400 transition-colors";

    return `
        <a id="${id}-link" href="${href}" class="${baseClass} ${isActive ? activeClass : inactiveClass}">
            <i class="fas ${icon} w-5 ${iconClass}"></i>
            <span>${label}</span>
            ${isActive ? '<i class="fas fa-chevron-right ml-auto text-xs opacity-50"></i>' : ''}
        </a>
    `;
}