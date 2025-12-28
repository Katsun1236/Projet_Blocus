import { auth, db, storage, supabase, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, deleteField, ref, uploadBytesResumable, getDownloadURL } from './supabase-config.js';
import { initSpeedInsights } from './speed-insights.js';

// Initialize Speed Insights for performance monitoring
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
    userCountDisplay: document.getElementById('user-count-display')
};

async function updateUserCount() {
    if (!dom.userCountDisplay) return;

    try {
        const coll = collection(db, "users");
        const snapshot = await getCountFromServer(coll);
        const count = snapshot.data().count;

        dom.userCountDisplay.textContent = count > 0 ? `Rejoint par +${count} étudiants` : "Rejoins la communauté d'étudiants";
    } catch (error) {
        console.error("Erreur comptage utilisateurs:", error);
        dom.userCountDisplay.textContent = "Rejoint par des étudiants motivés";
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        toggleVisibility(true);

        try {
            const userRef = doc(db, 'users', user.id);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if(dom.userName) dom.userName.textContent = data.firstName || 'Étudiant';
                if(dom.userAvatar) dom.userAvatar.src = data.photoURL || `https://ui-avatars.com/api/?name=${data.firstName}&background=6366f1&color=fff`;
            }
        } catch (e) {
            console.error("Erreur récupération profil:", e);
        }

    } else {
        toggleVisibility(false);
    }
});

function toggleVisibility(isLoggedIn) {
    if (isLoggedIn) {
        if(dom.navLoggedOut) dom.navLoggedOut.classList.add('hidden');
        if(dom.navLoggedIn) dom.navLoggedIn.classList.remove('hidden');
        if(dom.navLoggedIn) dom.navLoggedIn.classList.add('flex');

        if(dom.heroLoggedOut) dom.heroLoggedOut.classList.add('hidden');
        if(dom.heroLoggedIn) dom.heroLoggedIn.classList.remove('hidden');
    } else {
        if(dom.navLoggedIn) dom.navLoggedIn.classList.add('hidden');
        if(dom.navLoggedOut) dom.navLoggedOut.classList.remove('hidden');

        if(dom.heroLoggedIn) dom.heroLoggedIn.classList.add('hidden');
        if(dom.heroLoggedOut) dom.heroLoggedOut.classList.remove('hidden');
    }
}

if (dom.userMenuButton) {
    dom.userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.userMenu.classList.toggle('hidden');
    });
}

window.addEventListener('click', () => {
    if (dom.userMenu && !dom.userMenu.classList.contains('hidden')) {
        dom.userMenu.classList.add('hidden');
    }
});

if (dom.logoutButton) {
    dom.logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (error) {
            console.error("Erreur déconnexion:", error);
        }
    });
}

if (dom.mobileMenuBtn) {
    dom.mobileMenuBtn.addEventListener('click', () => {
        dom.mobileMenu.classList.toggle('hidden');
    });
}

updateUserCount();
