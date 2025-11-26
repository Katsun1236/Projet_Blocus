import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// --- State Management ---
let currentUserId = null;
let currentFolderId = null;
let currentFolderName = "Mes Cours";

// Variables globales pour le debug console
window.allCourses = [];
window.allFolders = [];

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
    statsQuizCount: document.getElementById('stats-quiz-count'),
    notifBadge: document.getElementById('notif-badge'),
    notifList: document.getElementById('notifications-list'),
    noNotifMsg: document.getElementById('no-notif-msg'),
    markAllReadBtn: document.getElementById('mark-all-read'),
};

// --- Render Functions ---
function render() {
    if (!currentUserId) return;
    renderHeader();
    renderBreadcrumbs();
    renderFolders();
    renderCourses();
    updateStats();
    if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
}

function updateStats() {
    if(ui.statsCoursesCount) ui.statsCoursesCount.textContent = window.allCourses.length;
    if(ui.statsQuizCount) ui.statsQuizCount.textContent = "0"; 
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
        console.error("Erreur header:", e);
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
    
    if (currentFolderId) {
        ui.foldersGrid.innerHTML = '';
        ui.foldersGrid.classList.add('hidden');
        return; 
    } else {
        ui.foldersGrid.classList.remove('hidden');
    }

    ui.foldersGrid.innerHTML = window.allFolders.map(folder => `
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
        </div>
    `).join('');
}

function renderCourses() {
    if (!ui.coursesList) return;
    
    console.log("🔍 FILTRE ACTIVÉ : Affichage de TOUS les cours sans distinction de dossier.");
    
    // DEBUG : On désactive temporairement le filtre de dossier pour voir si les fichiers apparaissent
    // const coursesToShow = window.allCourses.filter(c => ...); 
    const coursesToShow = window.allCourses; // Affiche tout ce qu'on a reçu

    if (coursesToShow.length === 0) {
        if(ui.noContent) ui.noContent.classList.remove('hidden');
        ui.coursesList.innerHTML = '';
    } else {
        if(ui.noContent) ui.noContent.classList.add('hidden');
        
        ui.coursesList.innerHTML = coursesToShow.map(course => {
            let iconClass = "fa-file-alt";
            let colorClass = "text-blue-400 bg-blue-400/10";
            
            if (course.fileName && course.fileName.toLowerCase().endsWith('.pdf')) {
                iconClass = "fa-file-pdf";
                colorClass = "text-red-400 bg-red-400/10";
            }
            
            let dateStr = 'Date inconnue';
            if (course.createdAt) {
                // Gestion robuste des dates (Timestamp Firestore ou String ISO)
                const d = course.createdAt.toDate ? course.createdAt.toDate() : new Date(course.createdAt);
                if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString('fr-FR');
                }
            }

            // Pour le debug, on affiche le folderId à côté du nom
            const debugFolderInfo = course.folderId ? `(Dossier: ${course.folderId})` : '(Racine)';
            const link = course.fileURL || course.url || '#';

            return `
            <div class="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group border-b border-gray-800/50 cursor-pointer" onclick="window.open('${link}', '_blank')">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-white group-hover:text-indigo-300 transition-colors">${course.title || course.fileName} <span class="text-xs text-gray-600">${debugFolderInfo}</span></h4>
                        <div class="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>${course.fileName || 'Fichier'}</span>
                            <span class="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </div>
                <button class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Supprimer" onclick="event.stopPropagation(); deleteCourse('${course.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>`;
        }).join('');
    }
}

// --- Global Functions ---
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

window.deleteCourse = async (courseId) => {
    if(confirm("Supprimer ?")) {
        await deleteDoc(doc(db, 'users', currentUserId, 'courses', courseId));
    }
};

if(ui.newFolderBtn) {
    ui.newFolderBtn.addEventListener('click', async () => {
        const folderName = prompt("Nom du dossier :");
        if (folderName && currentUserId) {
            await addDoc(collection(db, 'users', currentUserId, 'folders'), {
                name: folderName,
                createdAt: serverTimestamp(),
                courseCount: 0
            });
        }
    });
}

// --- Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        currentUserId = user.uid;
        console.log("🔑 LOGIN OK. User ID:", currentUserId);
        
        renderHeader();

        // 1. Dossiers
        // J'ai retiré le orderBy pour être sûr de tout voir, même si le champ date manque
        const foldersQuery = collection(db, 'users', currentUserId, 'folders');
        onSnapshot(foldersQuery, (snapshot) => {
            window.allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFolders(); 
        });

        // 2. Cours (VERSION SIMPLIFIÉE)
        // J'ai retiré orderBy('createdAt') -> Si tes documents n'ont pas ce champ, ils n'apparaissent pas avec orderBy !
        console.log("📡 Lancement de la requête Firestore...");
        const coursesQuery = collection(db, 'users', currentUserId, 'courses');
        
        onSnapshot(coursesQuery, (snapshot) => {
            window.allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("📦 SNAPSHOT REÇU ! Cours trouvés:", window.allCourses);
            render();
        }, (error) => {
            console.error("❌ ERREUR FIRESTORE:", error);
            if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
        });

    } else {
        if (window.location.pathname.includes('/app/')) {
             window.location.href = '../auth/login.html';
        }
    }
});

if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = '../auth/login.html';
    });
}