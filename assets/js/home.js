import { auth, db, onAuthStateChanged, signOut, doc, getDoc, collection, getDocs } from './supabase-config.js';
import { initSpeedInsights } from './speed-insights.js';

initSpeedInsights();

const dom = {
    navLoggedOut: document.getElementById('nav-logged-out'),
    navLoggedIn: document.getElementById('nav-logged-in'),
    userMenuButton: document.getElementById('user-menu-button'),
    userMenu: document.getElementById('user-menu'),
    logoutButton: document.getElementById('logout-button'),
    heroLoggedOut: document.getElementById('hero-logged-out'),
    heroLoggedIn: document.getElementById('hero-logged-in'),
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenu: document.getElementById('mobile-menu'),
    userCountDisplay: document.getElementById('user-count-display'),
    heroRotator: document.getElementById('hero-rotator')
};

const heroPhrases = ['Synthèses IA', 'Quiz instantanés', 'Fiches personnalisées'];

function toggleVisibility(isLoggedIn) {
    if (dom.navLoggedOut) dom.navLoggedOut.classList.toggle('hidden', isLoggedIn);
    if (dom.navLoggedIn) dom.navLoggedIn.classList.toggle('hidden', !isLoggedIn);
    if (dom.heroLoggedOut) dom.heroLoggedOut.classList.toggle('hidden', isLoggedIn);
    if (dom.heroLoggedIn) dom.heroLoggedIn.classList.toggle('hidden', !isLoggedIn);
}

async function updateUserCount() {
    if (!dom.userCountDisplay) return;

    try {
        const usersRef = collection(db, 'users');
        const users = await getDocs(usersRef);
        const count = Array.isArray(users) ? users.length : (users?.length || 0);
        dom.userCountDisplay.textContent = count > 0 ? `Rejoint par +${count} étudiants` : 'Rejoins la communauté d’étudiants';
    } catch {
        dom.userCountDisplay.textContent = 'Rejoins la communauté d’étudiants';
    }
}

function animateHeroText() {
    if (!dom.heroRotator) return;
    let index = 0;
    dom.heroRotator.textContent = heroPhrases[index];
    setInterval(() => {
        index = (index + 1) % heroPhrases.length;
        dom.heroRotator.textContent = heroPhrases[index];
    }, 3200);
}

function initScrollReveal() {
    const elements = document.querySelectorAll('.scroll-reveal');
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    elements.forEach((element) => observer.observe(element));
}

onAuthStateChanged(async (user) => {
    if (user) {
        toggleVisibility(true);
        try {
            const userRef = doc(db, 'users', user.id);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (dom.userName) dom.userName.textContent = data.firstName || 'Étudiant';
                if (dom.userAvatar) dom.userAvatar.src = data.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'Etudiant')}&background=6366f1&color=fff`;
            }
        } catch (e) {
            console.warn('Erreur récupération profil:', e);
        }
    } else {
        toggleVisibility(false);
    }
});

if (dom.userMenuButton && dom.userMenu) {
    dom.userMenuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isHidden = dom.userMenu.classList.toggle('hidden');
        dom.userMenuButton.setAttribute('aria-expanded', String(!isHidden));
    });
}

window.addEventListener('click', () => {
    if (dom.userMenu && !dom.userMenu.classList.contains('hidden')) {
        dom.userMenu.classList.add('hidden');
        if (dom.userMenuButton) dom.userMenuButton.setAttribute('aria-expanded', 'false');
    }
});

if (dom.logoutButton) {
    dom.logoutButton.addEventListener('click', async () => {
        try {
            await signOut();
            window.location.reload();
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    });
}

if (dom.mobileMenuBtn && dom.mobileMenu) {
    dom.mobileMenuBtn.addEventListener('click', () => {
        const isHidden = dom.mobileMenu.classList.toggle('hidden');
        dom.mobileMenuBtn.setAttribute('aria-expanded', String(!isHidden));
    });
}

updateUserCount();
animateHeroText();
initScrollReveal();
