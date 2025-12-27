import { auth, db } from '../../core/services/firebase/index.js';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function initLayout(activePageId) {
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar && document.getElementById('app-container')) {
        injectSidebar(activePageId);
    }

    addHomeButton();

    setupMobileMenu();

    onAuthStateChanged(auth, async (user) => {
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
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
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

    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

function addHomeButton() {
    const header = document.querySelector('header');
    if (!header) {
        return;
    }

    if (document.getElementById('home-btn-header')) return;

    const homeBtn = document.createElement('a');
    homeBtn.id = 'home-btn-header';
    homeBtn.href = '/';
    homeBtn.className = 'hidden md:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-300 hover:text-white text-sm font-medium absolute right-8';
    homeBtn.title = "Retour à l'accueil";
    homeBtn.innerHTML = '<i class="fas fa-home mr-2"></i> Accueil';

    header.appendChild(homeBtn);
}

async function updateHeaderProfile(user) {
    const avatarImg = document.getElementById('user-avatar-header');
    const userNameTxt = document.getElementById('user-name-header');

    if (!avatarImg && !userNameTxt) return;

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);

        let photoURL = user.photoURL;
        let displayName = user.displayName || user.email.split('@')[0];

        if (userSnapshot.exists()) {
            const data = userSnapshot.data();
            if (data.photoURL) photoURL = data.photoURL;
            if (data.firstName) displayName = data.firstName;
        }

        if (!photoURL) {
            photoURL = `https://ui-avatars.com/api/?name=${displayName}&background=random&color=fff`;
        }

        if (avatarImg) avatarImg.src = photoURL;
        if (userNameTxt) userNameTxt.textContent = displayName;

    } catch (e) {
        console.error("Erreur chargement header profil:", e);
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
        <aside class="fixed top-0 left-0 w-64 h-full bg-[#0a0a0f] border-r border-gray-800/50 z-30 hidden md:flex flex-col transition-transform duration-300">
            <div class="h-20 flex items-center px-8 border-b border-gray-800/50">
                <img src="${rootPath}assets/images/locus-profile-sidebar.png" alt="Projet Blocus" class="w-9 h-9 object-contain mr-3">
                <span class="text-xl font-display font-bold text-white tracking-wide">Blocus<span class="text-indigo-500">.</span></span>
            </div>

            <nav class="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
                <a href="${rootPath}index.html" id="home-link" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group text-gray-400 hover:text-white hover:bg-white/5 border-b border-gray-800/50 mb-2">
                    <i class="fas fa-arrow-left w-5 text-gray-500 group-hover:text-indigo-400 transition-colors"></i>
                    <span>Retour à l'accueil</span>
                </a>
                ${renderNavLink('dashboard', 'Dashboard', 'fa-th-large', basePath + 'dashboard.html', activePageId)}
                ${renderNavLink('courses', 'Mes Cours', 'fa-folder-open', basePath + 'courses.html', activePageId)}
                ${renderNavLink('quiz', 'Quiz & IA', 'fa-brain', basePath + 'quiz.html', activePageId)}
                ${renderNavLink('synthesize', 'Synthèses', 'fa-magic', basePath + 'synthesize.html', activePageId)}
                ${renderNavLink('community', 'Communauté', 'fa-users', basePath + 'community.html', activePageId)}
                ${renderNavLink('planning', 'Planning', 'fa-calendar-alt', basePath + 'planning.html', activePageId)}
            </nav>

            <div class="p-4 border-t border-gray-800/50">
                ${renderNavLink('profile', 'Mon Profil', 'fa-user-circle', basePath + 'profile.html', activePageId)}
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
                <a href="${rootPath}index.html" class="block text-lg text-indigo-400 hover:text-indigo-300 border-b border-gray-800 pb-4 mb-4">
                    <i class="fas fa-arrow-left mr-2"></i> Retour à l'accueil
                </a>
                <a href="${basePath}dashboard.html" class="block text-lg text-gray-300 hover:text-white">Dashboard</a>
                <a href="${basePath}courses.html" class="block text-lg text-gray-300 hover:text-white">Mes Cours</a>
                <a href="${basePath}quiz.html" class="block text-lg text-gray-300 hover:text-white">Quiz IA</a>
                <a href="${basePath}synthesize.html" class="block text-lg text-gray-300 hover:text-white">Synthèses</a>
                <a href="${basePath}community.html" class="block text-lg text-gray-300 hover:text-white">Communauté</a>
                <a href="${basePath}planning.html" class="block text-lg text-gray-300 hover:text-white">Planning</a>
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
