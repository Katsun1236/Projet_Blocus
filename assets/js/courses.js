import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// --- State Management ---
let currentUserId = null;
let currentFolderId = null;
let currentFolderName = "Mes Cours";
let allCourses = [];
let allFolders = [];

// --- DOM Elements ---
const ui = {
    navLoggedIn: document.getElementById('nav-logged-in'),
    userMenuButton: document.getElementById('user-menu-button'),
    logoutButton: document.getElementById('logout-button'),
    loadingIndicator: document.getElementById('loading-indicator'),
    foldersGrid: document.getElementById('folders-grid'),
    coursesList: document.getElementById('courses-list'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    mainTitle: document.getElementById('main-title'),
    coursesTitle: document.getElementById('courses-title'),
    noContent: document.getElementById('no-content'),
    newFolderBtn: document.getElementById('new-folder-button'),
    statsCoursesCount: document.getElementById('stats-courses-count'),
    statsQuizCount: document.getElementById('stats-quiz-count')
};

// --- Helper Functions ---
function showMessage(message, isError = false) {
    const box = document.getElementById('message-box');
    if (!box) return;
    
    // Reset content
    box.innerHTML = '';
    
    // Icon
    const icon = document.createElement('div');
    icon.className = isError ? 'text-red-400' : 'text-indigo-400';
    icon.innerHTML = isError ? '<i class="fas fa-exclamation-circle"></i>' : '<i class="fas fa-check-circle"></i>';
    
    // Text
    const text = document.createElement('span');
    text.textContent = message;
    
    box.appendChild(icon);
    box.appendChild(text);
    
    // Styling box based on type
    if (isError) {
        box.className = "fixed bottom-6 right-6 bg-gray-900 border border-red-500/30 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-float";
    } else {
        box.className = "fixed bottom-6 right-6 bg-gray-900 border border-green-500/30 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-float";
    }

    box.classList.remove('hidden');
    setTimeout(() => { box.classList.add('hidden'); }, 3000);
}

// --- Render Functions ---
function render() {
    if (!currentUserId) return;
    renderHeader(); // Appelé aussi au changement de dossier pour le fil d'ariane
    renderBreadcrumbs();
    renderFolders();
    renderCourses();
    updateStats();
    if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
}

function updateStats() {
    if(ui.statsCoursesCount) ui.statsCoursesCount.textContent = allCourses.length;
    // Placeholder pour les quiz (à connecter plus tard)
    if(ui.statsQuizCount) ui.statsQuizCount.textContent = "0"; 
}

async function renderHeader() {
    // Le header utilisateur est géré par le fichier HTML principal ou home.js s'il est chargé, 
    // mais on peut forcer la mise à jour ici si besoin.
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
    if (!ui.breadcrumbs) return;
    
    if (!currentFolderId) {
        ui.breadcrumbs.innerHTML = `<span class="text-indigo-400 font-medium">Accueil</span>`;
        if(ui.mainTitle) ui.mainTitle.textContent = "Mes Dossiers";
    } else {
        ui.breadcrumbs.innerHTML = `
            <span class="cursor-pointer hover:text-white transition-colors" onclick="resetView()">Accueil</span>
            <i class="fas fa-chevron-right text-xs mx-2"></i>
            <span class="text-indigo-400 font-medium">${currentFolderName}</span>
        `;
        if(ui.mainTitle) ui.mainTitle.textContent = currentFolderName;
    }
}

function renderFolders() {
    if (!ui.foldersGrid) return;
    
    // Filtrage : on ne montre que les dossiers à la racine si on est à la racine
    // Si on est DANS un dossier, on pourrait montrer des sous-dossiers (non implémenté ici pour simplifier)
    // Pour l'instant, on affiche tous les dossiers quand on est à la racine
    
    if (currentFolderId) {
        ui.foldersGrid.innerHTML = ''; // Pas de dossiers dans un dossier (structure plate pour l'instant)
        ui.foldersGrid.parentElement.classList.add('hidden'); // Cache la section dossiers
        return; 
    } else {
        if(ui.foldersGrid.parentElement) ui.foldersGrid.parentElement.classList.remove('hidden');
    }

    ui.foldersGrid.innerHTML = allFolders.map(folder => `
        <div class="content-glass p-5 rounded-xl cursor-pointer hover:bg-white/5 transition-all duration-300 group border border-white/5 hover:border-indigo-500/30 relative" 
             onclick="openFolder('${folder.id}', '${folder.name}')">
            
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas fa-folder text-xl"></i>
                </div>
                <button class="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1" onclick="event.stopPropagation(); deleteFolder('${folder.id}')">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
            </div>
            
            <h3 class="font-bold text-white text-lg truncate mb-1 group-hover:text-indigo-300 transition-colors">${folder.name}</h3>
            <p class="text-xs text-gray-400 font-medium">${folder.courseCount || 0} fichiers</p>
            
            <!-- Glow effect on hover -->
            <div class="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
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
        
        ui.coursesList.innerHTML = coursesToShow.map(course => {
            // Détermination de l'icône selon le type (simple)
            let iconClass = "fa-file-alt";
            let colorClass = "text-blue-400 bg-blue-400/10";
            
            if (course.fileName && course.fileName.endsWith('.pdf')) {
                iconClass = "fa-file-pdf";
                colorClass = "text-red-400 bg-red-400/10";
            } else if (course.type && course.type.startsWith('image/')) {
                iconClass = "fa-file-image";
                colorClass = "text-purple-400 bg-purple-400/10";
            }

            const dateStr = course.createdAt ? new Date(course.createdAt.toDate()).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Récemment';

            return `
            <div class="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group animate-fade-in-up">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-white group-hover:text-indigo-300 transition-colors cursor-pointer" onclick="window.open('${course.fileURL}', '_blank')">${course.title}</h4>
                        <div class="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>${course.fileName || 'Document'}</span>
                            <span class="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Télécharger" onclick="window.open('${course.fileURL}', '_blank')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Supprimer" onclick="deleteCourse('${course.id}', '${course.fileName}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }
}

// --- Global Functions (exposed for HTML onClick) ---
window.openFolder = (id, name) => {
    currentFolderId = id;
    currentFolderName = name;
    render();
};

window.resetView = () => {
    currentFolderId = null;
    currentFolderName = "Mes Cours";
    render();
};

// Fonction pour créer un nouveau dossier (simple prompt pour l'instant)
// Dans une version avancée, on ferait une vraie modale "Deep Nebula"
if(ui.newFolderBtn) {
    ui.newFolderBtn.addEventListener('click', async () => {
        const folderName = prompt("Nom du nouveau dossier :");
        if (folderName && currentUserId) {
            try {
                await addDoc(collection(db, 'users', currentUserId, 'folders'), {
                    name: folderName,
                    createdAt: serverTimestamp(),
                    courseCount: 0
                });
                showMessage("Dossier créé avec succès !");
            } catch (e) {
                console.error(e);
                showMessage("Erreur lors de la création.", true);
            }
        }
    });
}

window.deleteFolder = async (folderId) => {
    if(confirm("Supprimer ce dossier ? Les fichiers à l'intérieur ne seront pas supprimés mais deviendront orphelins.")) {
        try {
            await deleteDoc(doc(db, 'users', currentUserId, 'folders', folderId));
            showMessage("Dossier supprimé.");
        } catch (e) {
            console.error(e);
            showMessage("Erreur suppression.", true);
        }
    }
};

window.deleteCourse = async (courseId, fileName) => {
    if(confirm("Voulez-vous vraiment supprimer ce fichier ?")) {
        try {
            // 1. Supprimer de Firestore
            await deleteDoc(doc(db, 'users', currentUserId, 'courses', courseId));
            
            // 2. Supprimer de Storage (Optionnel mais recommandé pour nettoyer)
            // Note: Il faudrait stocker le chemin complet du fichier dans Firestore pour être sûr
            // Ici on suppose un chemin standard, risque d'erreur si le nom a changé
            // const fileRef = ref(storage, `users/${currentUserId}/courses/${fileName}`); // À adapter selon ta logique d'upload
            // await deleteObject(fileRef).catch(e => console.log("Fichier storage introuvable ou déjà supprimé"));

            showMessage("Fichier supprimé.");
        } catch (e) {
            console.error(e);
            showMessage("Erreur suppression.", true);
        }
    }
};


// --- Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        currentUserId = user.uid;
        renderHeader();

        // Écouteurs temps réel Dossiers
        onSnapshot(query(collection(db, 'users', currentUserId, 'folders')), (snapshot) => {
            allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        }, (error) => {
            console.error("Erreur dossiers:", error);
            if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
        });

        // Écouteurs temps réel Cours
        onSnapshot(query(collection(db, 'users', currentUserId, 'courses')), (snapshot) => {
            allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        }, (error) => {
            console.error("Erreur cours:", error);
            if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
        });

    } else {
        // Redirection vers la page de login (chemin relatif depuis /pages/app/ vers /pages/auth/)
        window.location.href = '../auth/login.html';
    }
});

// Gestion Déconnexion
if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '../auth/login.html';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    });
}