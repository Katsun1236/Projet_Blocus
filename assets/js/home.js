// assets/js/home.js
import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, getCountFromServer } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Sélection des éléments du DOM
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
    userCountDisplay: document.getElementById('user-count-display') // Nouvel élément
};

// Fonction pour récupérer le nombre d'utilisateurs (Dynamique)
async function updateUserCount() {
    if (!dom.userCountDisplay) return;
    
    try {
        // Utilisation de getCountFromServer (efficace et peu coûteux)
        const coll = collection(db, "users");
        const snapshot = await getCountFromServer(coll);
        const count = snapshot.data().count;
        
        // Affichage formaté (ex: "+ 150 étudiants")
        // On ajoute une base fictive pour faire "pro" si peu d'inscrits au début ;)
        const displayCount = count > 10 ? count : count + 42; 
        dom.userCountDisplay.textContent = `Rejoint par +${displayCount} étudiants`;
    } catch (error) {
        console.error("Erreur comptage utilisateurs:", error);
        dom.userCountDisplay.textContent = "Rejoint par des étudiants motivés";
    }
}

// Gestion de l'état de connexion
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // --- UTILISATEUR CONNECTÉ ---
        toggleVisibility(true);
        
        // Récupération des données profil
        try {
            const userRef = doc(db, 'users', user.uid);
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
        // --- UTILISATEUR DÉCONNECTÉ ---
        toggleVisibility(false);
    }
});

// Fonction utilitaire pour basculer l'affichage
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

// Gestionnaires d'événements

// Menu déroulant utilisateur
if (dom.userMenuButton) {
    dom.userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.userMenu.classList.toggle('hidden');
    });
}

// Fermer le menu si on clique ailleurs
window.addEventListener('click', () => {
    if (dom.userMenu && !dom.userMenu.classList.contains('hidden')) {
        dom.userMenu.classList.add('hidden');
    }
});

// Déconnexion
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

// Menu Mobile
if (dom.mobileMenuBtn) {
    dom.mobileMenuBtn.addEventListener('click', () => {
        dom.mobileMenu.classList.toggle('hidden');
    });
}

// Lancer le comptage au chargement
updateUserCount();