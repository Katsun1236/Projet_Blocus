import { auth, db, storage } from './config.js';
// CORRECTION : Version 11.0.1 partout
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// --- State Management ---
let currentUserId = null;
let currentFolderId = null;
let currentFolderName = "Mes Cours";
let allCourses = [];
let allFolders = [];
let contextTarget = null;

// --- DOM Elements ---
const ui = {
    navLoggedIn: document.getElementById('nav-logged-in'),
    userMenuButton: document.getElementById('user-menu-button'),
    userMenu: document.getElementById('user-menu'),
    logoutButton: document.getElementById('logout-button'),
    loadingIndicator: document.getElementById('loading-indicator'),
    foldersGrid: document.getElementById('folders-grid'),
    coursesList: document.getElementById('courses-list'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    mainTitle: document.getElementById('main-title'),
    coursesTitle: document.getElementById('courses-title'),
    noContent: document.getElementById('no-content'),
    contextMenu: document.getElementById('context-menu'),
    newFolderBtn: document.getElementById('new-folder-button'),
    // Modals will be dynamically created to simplify HTML
};

// --- Helper Functions ---
function showMessage(message, isError = false) {
    const box = document.getElementById('message-box');
    if (!box) return; // Sécurité si l'élément n'existe pas
    box.textContent = message;
    box.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-xl z-50 ${isError ? 'bg-red-600' : 'bg-green-600'} text-white`;
    box.classList.remove('hidden');
    setTimeout(() => { box.classList.add('hidden'); }, 3000);
}

// --- Render Functions ---
function render() {
    if (!currentUserId) return;
    renderHeader();
    renderBreadcrumbs();
    renderFolders();
    renderCourses();
    if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
}

async function renderHeader() {
    try {
        const userRef = doc(db, 'users', currentUserId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const profileData = docSnap.data();
            const nameEl = document.getElementById('user-name-header');
            const avatarEl = document.getElementById('user-avatar-header');
            
            if (nameEl) nameEl.textContent = profileData.firstName;
            if (avatarEl) avatarEl.src = profileData.photoURL || 'https://ui-avatars.com/api/?background=random';
            if (ui.navLoggedIn) ui.navLoggedIn.classList.remove('hidden');
        }
    } catch (e) {
        console.error("Erreur chargement header:", e);
    }
}

function renderBreadcrumbs() {
    // Implémentation simplifiée pour l'exemple
    if (!ui.breadcrumbs) return;
    ui.breadcrumbs.innerHTML = `
        <span class="cursor-pointer hover:text-indigo-400" onclick="resetView()">Accueil</span>
        ${currentFolderId ? ` <span class="mx-2">/</span> <span class="font-bold text-white">${currentFolderName}</span>` : ''}
    `;
}

function renderFolders() {
    if (!ui.foldersGrid) return;
    // Filtrer les dossiers (ici on affiche tout pour simplifier, ou filtrer par parent si hiérarchie)
    const foldersToShow = allFolders; 
    
    ui.foldersGrid.innerHTML = foldersToShow.map(folder => `
        <div class="folder-item bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors relative group" data-id="${folder.id}" onclick="openFolder('${folder.id}', '${folder.name}')">
            <div class="flex items-center justify-between mb-2">
                <i class="fas fa-folder text-3xl text-indigo-500"></i>
                <button class="context-menu-btn text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            <h3 class="font-bold text-white truncate">${folder.name}</h3>
            <p class="text-xs text-gray-400">${folder.courseCount || 0} cours</p>
        </div>
    `).join('');
}

function renderCourses() {
    if (!ui.coursesList) return;
    // Filtrer les cours par dossier courant
    const coursesToShow = currentFolderId 
        ? allCourses.filter(c => c.folderId === currentFolderId)
        : allCourses.filter(c => !c.folderId); // Cours à la racine

    if (coursesToShow.length === 0) {
        if(ui.noContent) ui.noContent.classList.remove('hidden');
        ui.coursesList.innerHTML = '';
    } else {
        if(ui.noContent) ui.noContent.classList.add('hidden');
        ui.coursesList.innerHTML = coursesToShow.map(course => `
            <div class="course-item bg-gray-700 p-4 rounded-lg mb-2 flex justify-between items-center group" data-id="${course.id}">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center mr-3">
                        <i class="fas fa-book text-indigo-400"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white">${course.title}</h4>
                        <p class="text-xs text-gray-400">Ajouté le ${new Date(course.createdAt?.toDate()).toLocaleDateString()}</p>
                    </div>
                </div>
                <button class="context-menu-btn text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        `).join('');
    }
}

// --- Global Functions (exposed for HTML onClick) ---
window.openFolder = (id, name) => {
    currentFolderId = id;
    currentFolderName = name;
    if(ui.mainTitle) ui.mainTitle.textContent = name;
    render();
};

window.resetView = () => {
    currentFolderId = null;
    currentFolderName = "Mes Cours";
    if(ui.mainTitle) ui.mainTitle.textContent = "Mes Cours";
    render();
};

// --- Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        currentUserId = user.uid;
        // renderHeader appelé via le snapshot ou manuellement
        renderHeader();

        // Écouteurs temps réel
        onSnapshot(collection(db, 'users', currentUserId, 'folders'), (snapshot) => {
            allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        }, (error) => {
            console.error("Erreur dossiers:", error);
            if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
        });

        onSnapshot(collection(db, 'users', currentUserId, 'courses'), (snapshot) => {
            allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        }, (error) => {
            console.error("Erreur cours:", error);
            if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
        });

    } else {
        window.location.href = '/login.html';
    }
});

// Gestion Déconnexion
if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    });
}