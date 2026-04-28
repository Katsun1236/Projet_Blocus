import { auth, db, supabase } from './supabase-config.js';
import { initScrollRestoration } from './utils.js';

export function initLayout(activePageId) {
    // ✅ Initialiser la restauration du scroll pour éviter les sauts de page
    initScrollRestoration();

    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar && document.getElementById('app-container')) {
        injectSidebar(activePageId);
    }

    setupMobileMenu();

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            updateHeaderProfile(user);
        }
    });

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

    injectMusicFAB();
}

function injectMusicFAB() {
    // Ne pas injecter sur la page de musique elle-même
    if (window.location.pathname.includes('music.html')) return;
    
    const inAppPages = window.location.pathname.includes('/pages/app/');
    const basePath = inAppPages ? './' : './pages/app/';
    
    const fab = document.createElement('div');
    fab.id = 'music-fab-container';
    fab.className = 'fixed bottom-6 right-6 z-50 animate-fade-in';
    fab.innerHTML = `
        <button id="music-fab-btn" class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center text-white text-xl hover:scale-110 hover:shadow-[0_0_25px_rgba(99,102,241,0.7)] transition-all duration-300 group relative focus:outline-none">
            <i class="fas fa-music"></i>
            <span class="absolute -top-12 right-0 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700 shadow-xl font-medium">
                Lecteur de musique
            </span>
            <span class="absolute inset-0 rounded-full border border-indigo-400 opacity-0 group-hover:animate-ping pointer-events-none"></span>
        </button>
    `;
    
    document.body.appendChild(fab);

    document.getElementById('music-fab-btn').addEventListener('click', () => {
        // Ouvrir dans une mini-fenêtre pour que la musique continue pendant la navigation
        const popup = window.open(
            basePath + 'music.html',
            'BlocusMusicPlayer',
            'width=450,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes'
        );
        
        // Fallback si les popups sont bloquées
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            window.location.href = basePath + 'music.html';
        }
    });
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        // ✅ MEMORY LEAK FIX: Utiliser once pour auto-cleanup au lieu de cloneNode
        // Stocker référence pour pouvoir cleanup manuellement
        const handleClick = (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        };

        // Nettoyer les anciens listeners si présents
        mobileMenuBtn.removeEventListener('click', handleClick);
        mobileMenuBtn.addEventListener('click', handleClick);

        // Ajouter un écouteur pour fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    }

    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

async function updateHeaderProfile(user) {
    const avatarImg = document.getElementById('user-avatar-header');
    const userNameTxt = document.getElementById('user-name-header');

    if (!avatarImg && !userNameTxt) return;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        let photoURL = user.user_metadata?.avatar_url;
        let displayName = user.email?.split('@')[0];

        if (data && !error) {
            if (data.photo_url) photoURL = data.photo_url;
            if (data.first_name) displayName = data.first_name;
        }

        if (!photoURL) {
            photoURL = `https://ui-avatars.com/api/?name=${displayName}&background=random&color=fff`;
        }

        if (avatarImg) avatarImg.src = photoURL;
        if (userNameTxt) userNameTxt.textContent = displayName;

    } catch (e) {
        console.error("Erreur chargement header profil:", e);
        if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?background=random`;
        if (userNameTxt) userNameTxt.textContent = "Étudiant";
    }
}

function injectSidebar(activePageId) {
    const container = document.createElement('div');
    container.id = 'sidebar-container';

    const inAppPages = window.location.pathname.includes('/pages/app/');
    const basePath = inAppPages ? './' : './pages/app/';
    const rootPath = inAppPages ? '../../' : './';

    container.innerHTML = `
        <aside class="fixed top-0 left-0 w-64 h-full bg-[#0a0a0f] border-r border-gray-800/50 z-30 hidden md:flex flex-col transition-transform duration-300">
            <div class="h-20 flex items-center px-8 border-b border-gray-800/50">
                <img src="${rootPath}assets/images/locus-profile-sidebar.png" alt="Projet Blocus" class="w-9 h-9 object-contain mr-3">
                <span class="text-xl font-display font-bold text-white tracking-wide">Blocus<span class="text-indigo-500">.</span></span>
            </div>

            <nav class="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
                ${renderNavLink('dashboard', 'Dashboard', 'fa-th-large', basePath + 'dashboard.html', activePageId)}
                ${renderNavLink('courses', 'Mes Cours', 'fa-folder-open', basePath + 'courses.html', activePageId)}
                ${renderNavLink('quiz', 'Quiz & IA', 'fa-brain', basePath + 'quiz.html', activePageId)}
                ${renderNavLink('synthesize', 'Synthèses', 'fa-magic', basePath + 'synthesize.html', activePageId)}
                ${renderNavLink('spaced-repetition', 'Révisions', 'fa-repeat', basePath + 'spaced-repetition.html', activePageId)}
                ${renderNavLink('music', 'Musique', 'fa-music', basePath + 'music.html', activePageId)}
                ${renderNavLink('community', 'Communauté', 'fa-users', basePath + 'community.html', activePageId)}
                ${renderNavLink('planning', 'Planning', 'fa-calendar-alt', basePath + 'planning.html', activePageId)}
                ${renderNavLink('pomodoro', 'Pomodoro', 'fa-clock', basePath + 'pomodoro.html', activePageId)}
            </nav>

            <div class="p-4 border-t border-gray-800/50">
                ${renderNavLink('profile', 'Mon Profil', 'fa-user-circle', basePath + 'profile.html', activePageId)}
                ${renderNavLink('roadmap', 'Roadmap', 'fa-route', basePath + 'roadmap.html', activePageId)}
                <button id="sidebar-logout-btn" class="w-full mt-2 flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 transition-colors">
                    <i class="fas fa-sign-out-alt w-5"></i>
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>

        <div id="mobile-menu" class="hidden fixed inset-0 z-20 bg-black/95 flex flex-col p-6 md:hidden animate-fade-in">
            <div class="flex justify-between items-center mb-8">
                <span class="text-xl font-bold text-white">Menu</span>
                <button id="close-mobile-menu" class="text-gray-400 hover:text-white"><i class="fas fa-times text-2xl"></i></button>
            </div>
            <nav class="space-y-4">
                <a href="${basePath}dashboard.html" class="block text-lg text-gray-300 hover:text-white">Dashboard</a>
                <a href="${basePath}courses.html" class="block text-lg text-gray-300 hover:text-white">Mes Cours</a>
                <a href="${basePath}quiz.html" class="block text-lg text-gray-300 hover:text-white">Quiz IA</a>
                <a href="${basePath}synthesize.html" class="block text-lg text-gray-300 hover:text-white">Synthèses</a>
                <a href="${basePath}spaced-repetition.html" class="block text-lg text-gray-300 hover:text-white">🧠 Révisions</a>
                <a href="${basePath}music.html" class="block text-lg text-gray-300 hover:text-white">🎵 Musique</a>
                <a href="${basePath}community.html" class="block text-lg text-gray-300 hover:text-white">Communauté</a>
                <a href="${basePath}planning.html" class="block text-lg text-gray-300 hover:text-white">Planning</a>
                <a href="${basePath}pomodoro.html" class="block text-lg text-gray-300 hover:text-white">🍅 Pomodoro</a>
                <a href="${basePath}profile.html" class="block text-lg text-gray-300 hover:text-white">Profil</a>
                <a href="${basePath}roadmap.html" class="block text-lg text-gray-300 hover:text-white">🗺️ Roadmap</a>
            </nav>
        </div>
    `;

    document.body.prepend(container);

    document.getElementById('sidebar-logout-btn')?.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = rootPath + 'pages/auth/login.html';
        } catch (e) {
            console.error("Logout error", e);
        }
    });

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
