import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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
    statsQuizCount: document.getElementById('stats-quiz-count'),
    notifBadge: document.getElementById('notif-badge'),
    notifList: document.getElementById('notifications-list'),
    noNotifMsg: document.getElementById('no-notif-msg'),
    markAllReadBtn: document.getElementById('mark-all-read'),
};

// --- Helper Functions ---
function showMessage(message, isError = false) {
    const box = document.getElementById('message-box');
    if (!box) return;
    
    box.innerHTML = '';
    const icon = document.createElement('div');
    icon.className = isError ? 'text-red-400' : 'text-indigo-400';
    icon.innerHTML = isError ? '<i class="fas fa-exclamation-circle"></i>' : '<i class="fas fa-check-circle"></i>';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    box.appendChild(icon);
    box.appendChild(text);
    
    if (isError) {
        box.className = "fixed bottom-6 right-6 bg-gray-900 border border-red-500/30 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-float";
    } else {
        box.className = "fixed bottom-6 right-6 bg-gray-900 border border-green-500/30 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-float";
    }

    box.classList.remove('hidden');
    setTimeout(() => { box.classList.add('hidden'); }, 3000);
}

function timeAgo(date) {
    if (!date) return 'récemment';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "à l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} j`;
}

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
    if(ui.statsCoursesCount) ui.statsCoursesCount.textContent = allCourses.length;
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
    
    // CORRECTION: On ne cache plus le parentElement (qui est <main> !), on vide juste la grille ou on la cache elle-même.
    if (currentFolderId) {
        ui.foldersGrid.innerHTML = '';
        ui.foldersGrid.classList.add('hidden');
        return; 
    } else {
        ui.foldersGrid.classList.remove('hidden');
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
            <div class="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>
    `).join('');
}

function renderCourses() {
    if (!ui.coursesList) return;
    
    // Debug log pour vérifier les données
    console.log("Render Courses. Total:", allCourses.length, "Current Folder:", currentFolderId);

    const coursesToShow = currentFolderId 
        ? allCourses.filter(c => c.folderId === currentFolderId)
        : allCourses.filter(c => !c.folderId); // !c.folderId inclut null, undefined, false

    console.log("Courses to show:", coursesToShow.length);

    if (coursesToShow.length === 0) {
        if(ui.noContent) ui.noContent.classList.remove('hidden');
        ui.coursesList.innerHTML = '';
    } else {
        if(ui.noContent) ui.noContent.classList.add('hidden');
        
        // CORRECTION: Suppression de animate-fade-in-up qui pouvait causer des problèmes de visibilité si non défini
        ui.coursesList.innerHTML = coursesToShow.map(course => {
            let iconClass = "fa-file-alt";
            let colorClass = "text-blue-400 bg-blue-400/10";
            if (course.fileName && course.fileName.toLowerCase().endsWith('.pdf')) {
                iconClass = "fa-file-pdf";
                colorClass = "text-red-400 bg-red-400/10";
            } else if (course.type && course.type.startsWith('image/')) {
                iconClass = "fa-file-image";
                colorClass = "text-purple-400 bg-purple-400/10";
            }
            
            let dateStr = 'Récemment';
            if (course.createdAt) {
                const d = course.createdAt.toDate ? course.createdAt.toDate() : new Date(course.createdAt);
                if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'});
                }
            }

            const displayTitle = course.title || course.name || course.fileName || 'Sans titre';

            return `
            <div class="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group border-b border-gray-800/50 cursor-pointer" onclick="window.open('${course.fileURL || course.url}', '_blank')">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-white group-hover:text-indigo-300 transition-colors">${displayTitle}</h4>
                        <div class="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>${course.fileName || 'Document'}</span>
                            <span class="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Télécharger" onclick="event.stopPropagation(); window.open('${course.fileURL || course.url}', '_blank')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Supprimer" onclick="event.stopPropagation(); deleteCourse('${course.id}', '${course.fileName}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    }
}

// --- Notification Logic ---
function setupNotifications(userId) {
    const notifRef = collection(db, 'users', userId, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'), limit(10));

    onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));
        renderNotifications(notifications);
    });
}

function renderNotifications(notifications) {
    if (!ui.notifList) return;
    
    if (notifications.length > 0) {
        ui.notifBadge.textContent = notifications.length;
        ui.notifBadge.classList.remove('hidden');
        if(ui.noNotifMsg) ui.noNotifMsg.classList.add('hidden');
    } else {
        ui.notifBadge.classList.add('hidden');
        ui.notifList.innerHTML = '';
        if(ui.noNotifMsg) ui.noNotifMsg.classList.remove('hidden');
        return;
    }

    ui.notifList.innerHTML = notifications.map(notif => {
        let icon = 'fa-bell';
        let color = 'text-gray-400 bg-gray-800';
        
        if (notif.type === 'friend_request') { icon = 'fa-user-plus'; color = 'text-indigo-400 bg-indigo-400/20'; }
        if (notif.type === 'message') { icon = 'fa-comment-alt'; color = 'text-blue-400 bg-blue-400/20'; }
        if (notif.type === 'success') { icon = 'fa-trophy'; color = 'text-yellow-400 bg-yellow-400/20'; }

        const dateNotif = notif.createdAt ? (notif.createdAt.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt)) : new Date();

        return `
        <div class="p-4 border-b border-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer flex justify-between items-start group">
            <div class="flex gap-3">
                <div class="w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0">
                    <i class="fas ${icon} text-xs"></i>
                </div>
                <div>
                    <p class="text-sm text-gray-300">${notif.message}</p>
                    <p class="text-xs text-gray-500 mt-1">${timeAgo(dateNotif)}</p>
                </div>
            </div>
            <button onclick="deleteNotification('${notif.id}')" class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    }).join('');
}

window.deleteNotification = async (id) => {
    if (!currentUserId) return;
    await deleteDoc(doc(db, 'users', currentUserId, 'notifications', id));
};

if (ui.markAllReadBtn) {
    ui.markAllReadBtn.addEventListener('click', async () => {
        if (!currentUserId) return;
        const notifRef = collection(db, 'users', currentUserId, 'notifications');
        const snapshot = await getDocs(notifRef);
        snapshot.forEach(async (d) => await deleteDoc(doc(db, 'users', currentUserId, 'notifications', d.id)));
    });
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
    if(confirm("Supprimer ce dossier ?")) {
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
            await deleteDoc(doc(db, 'users', currentUserId, 'courses', courseId));
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
        setupNotifications(currentUserId);

        // Ecouteurs Dossiers
        const foldersQuery = query(collection(db, 'users', currentUserId, 'folders'), orderBy('createdAt', 'desc'));
        onSnapshot(foldersQuery, (snapshot) => {
            allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        }, (error) => {
            console.log("Info folders: Pas encore de données ou erreur", error);
        });

        // Ecouteurs Cours
        const coursesQuery = query(collection(db, 'users', currentUserId, 'courses'), orderBy('createdAt', 'desc'));
        onSnapshot(coursesQuery, (snapshot) => {
            allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Log pour le debug
            console.log("Données Firestore reçues :", allCourses);
            render();
        }, (error) => {
            if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
            console.error("Erreur fetch cours:", error);
        });

    } else {
        // Gestion redirection selon où on est
        if (window.location.pathname.includes('/app/')) {
             window.location.href = '../auth/login.html';
        }
    }
});

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