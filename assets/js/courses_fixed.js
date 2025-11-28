import { auth, db, storage } from './config.js';
import { showToast, timeAgo } from './utils.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

let currentUserId = null;
let currentFolderId = null;
let currentFolderName = "Mes Cours";
let currentView = 'grid';
let sortBy = 'date-desc';
let searchQuery = '';

window.allCourses = [];
window.allFolders = [];

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
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    viewGridBtn: document.getElementById('view-grid-btn'),
    viewListBtn: document.getElementById('view-list-btn'),
};

// Helper to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function render() {
    if (!currentUserId) return;
    renderHeader();
    renderBreadcrumbs();
    renderFolders();
    renderCourses();
    updateStats();
    if (ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
}

function updateStats() {
    if (ui.statsCoursesCount) ui.statsCoursesCount.textContent = window.allCourses.length;
    if (ui.statsQuizCount) ui.statsQuizCount.textContent = "0"; // TODO: Implement quiz count
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
        console.error(e);
    }
}

function renderBreadcrumbs() {
    if (!ui.breadcrumbs) return;
    if (!currentFolderId) {
        ui.breadcrumbs.innerHTML = `<span class="text-indigo-400 font-medium">Accueil</span>`;
        if (ui.mainTitle) ui.mainTitle.textContent = "Mes Dossiers";
    } else {
        // Safe because we use escapeHtml for folder name in other places, 
        // but here we should also be careful if currentFolderName comes from user input
        const safeFolderName = escapeHtml(currentFolderName);
        ui.breadcrumbs.innerHTML = `
            <span class="cursor-pointer hover:text-white transition-colors" onclick="resetView()">Accueil</span>
            <i class="fas fa-chevron-right text-xs mx-2"></i>
            <span class="text-indigo-400 font-medium">${safeFolderName}</span>
        `;
        if (ui.mainTitle) ui.mainTitle.textContent = currentFolderName;
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

    ui.foldersGrid.innerHTML = window.allFolders.map(folder => {
        const safeName = escapeHtml(folder.name);
        // We pass ID and Name to openFolder. Name needs to be escaped for JS string context too if it contains quotes
        const safeNameForJs = folder.name.replace(/'/g, "\\'");

        return `
        <div class="content-glass p-5 rounded-xl cursor-pointer hover:bg-white/5 transition-all duration-300 group border border-white/5 hover:border-indigo-500/30 relative folder-dropzone" 
             data-folder-id="${folder.id}"
             onclick="openFolder('${folder.id}', '${safeNameForJs}')"
             ondragover="handleDragOver(event)"
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event, '${folder.id}')">
            <div class="flex justify-between items-start mb-4 pointer-events-none">
                <div class="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas fa-folder text-xl"></i>
                </div>
                <button class="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 pointer-events-auto" onclick="event.stopPropagation(); deleteFolder('${folder.id}')">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
            </div>
            <h3 class="font-bold text-white text-lg truncate mb-1 group-hover:text-indigo-300 transition-colors pointer-events-none">${safeName}</h3>
            <p class="text-xs text-gray-400 font-medium pointer-events-none">${folder.courseCount || 0} fichiers</p>
            <div class="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-indicator"></div>
        </div>
    `}).join('');
}

function renderCourses() {
    if (!ui.coursesList) return;

    // 1. Filter
    let coursesToShow = window.allCourses.filter(c => {
        // Folder Filter
        const inFolder = currentFolderId ? c.folderId === currentFolderId : (!c.folderId || c.folderId === 'null');

        // Search Filter
        const matchesSearch = searchQuery
            ? (c.title || c.name || c.fileName || '').toLowerCase().includes(searchQuery)
            : true;

        return inFolder && matchesSearch;
    });

    // 2. Sort
    coursesToShow.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        const nameA = (a.title || a.fileName || '').toLowerCase();
        const nameB = (b.title || b.fileName || '').toLowerCase();
        const sizeA = a.size || 0;
        const sizeB = b.size || 0;

        switch (sortBy) {
            case 'date-desc': return dateB - dateA;
            case 'date-asc': return dateA - dateB;
            case 'name-asc': return nameA.localeCompare(nameB);
            case 'name-desc': return nameB.localeCompare(nameA);
            case 'size-desc': return sizeB - sizeA;
            default: return dateB - dateA;
        }
    });

    // 3. Render
    if (coursesToShow.length === 0) {
        if (ui.noContent) {
            ui.noContent.classList.remove('hidden');
            // Update empty state message based on context
            const msg = ui.noContent.querySelector('p.font-medium');
            if (msg) msg.textContent = searchQuery ? "Aucun résultat pour cette recherche." : "Ce dossier est vide.";
        }
        ui.coursesList.innerHTML = '';
    } else {
        if (ui.noContent) ui.noContent.classList.add('hidden');

        // Apply View Layout
        if (currentView === 'grid') {
            ui.coursesList.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
        } else {
            ui.coursesList.className = 'flex flex-col gap-2';
        }

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
                    dateStr = d.toLocaleDateString('fr-FR');
                }
            }

            const displayTitle = escapeHtml(course.title || course.name || course.fileName || 'Sans titre');
            const safeFileName = escapeHtml(course.fileName || 'Document');
            const link = course.fileURL || course.url || '#';
            const sizeStr = course.size ? `${(course.size / 1024 / 1024).toFixed(2)} MB` : '';

            // Grid View Card
            if (currentView === 'grid') {
                return `
                <div class="content-glass p-4 rounded-xl hover:bg-white/5 transition-all group border border-white/5 hover:border-indigo-500/30 cursor-pointer draggable-course flex flex-col justify-between h-full"
                     draggable="true"
                     data-course-id="${course.id}"
                     ondragstart="handleDragStart(event, '${course.id}')"
                     onclick="window.open('${link}', '_blank')">
                    
                    <div class="flex justify-between items-start mb-3">
                        <div class="w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center">
                            <i class="fas ${iconClass} text-lg"></i>
                        </div>
                        <button class="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1" onclick="event.stopPropagation(); deleteCourse('${course.id}')">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                    </div>
                    
                    <div>
                        <h4 class="font-bold text-white text-sm truncate mb-1 group-hover:text-indigo-300 transition-colors" title="${displayTitle}">${displayTitle}</h4>
                        <div class="flex justify-between items-center text-xs text-gray-500">
                            <span>${dateStr}</span>
                            <span>${sizeStr}</span>
                        </div>
                    </div>
                </div>`;
            }
            // List View Row
            else {
                return `
                <div class="p-3 hover:bg-white/5 transition-colors flex items-center justify-between group border-b border-gray-800/50 cursor-pointer draggable-course rounded-lg" 
                     draggable="true"
                     data-course-id="${course.id}"
                     ondragstart="handleDragStart(event, '${course.id}')"
                     onclick="window.open('${link}', '_blank')">
                    <div class="flex items-center gap-4 pointer-events-none overflow-hidden">
                        <div class="w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="min-w-0">
                            <h4 class="font-medium text-white group-hover:text-indigo-300 transition-colors truncate">${displayTitle}</h4>
                            <div class="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                <span class="truncate">${safeFileName}</span>
                                <span class="w-1 h-1 rounded-full bg-gray-600 flex-shrink-0"></span>
                                <span class="flex-shrink-0">${dateStr}</span>
                                ${sizeStr ? `<span class="w-1 h-1 rounded-full bg-gray-600 flex-shrink-0"></span><span class="flex-shrink-0">${sizeStr}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Télécharger" onclick="event.stopPropagation(); window.open('${link}', '_blank')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Supprimer" onclick="event.stopPropagation(); deleteCourse('${course.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>`;
            }
        }).join('');
    }
}

function toggleView(view) {
    currentView = view;
    if (ui.viewGridBtn && ui.viewListBtn) {
        if (view === 'grid') {
            ui.viewGridBtn.classList.add('text-indigo-400', 'bg-gray-800');
            ui.viewGridBtn.classList.remove('text-gray-400');
            ui.viewListBtn.classList.remove('text-indigo-400', 'bg-gray-800');
            ui.viewListBtn.classList.add('text-gray-400');
        } else {
            ui.viewListBtn.classList.add('text-indigo-400', 'bg-gray-800');
            ui.viewListBtn.classList.remove('text-gray-400');
            ui.viewGridBtn.classList.remove('text-indigo-400', 'bg-gray-800');
            ui.viewGridBtn.classList.add('text-gray-400');
        }
    }
    renderCourses();
}

// --- Event Listeners ---
if (ui.searchInput) {
    ui.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderCourses();
    });
}

if (ui.sortSelect) {
    ui.sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderCourses();
    });
}

if (ui.viewGridBtn) ui.viewGridBtn.addEventListener('click', () => toggleView('grid'));
if (ui.viewListBtn) ui.viewListBtn.addEventListener('click', () => toggleView('list'));

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
        if (ui.noNotifMsg) ui.noNotifMsg.classList.add('hidden');
    } else {
        ui.notifBadge.classList.add('hidden');
        ui.notifList.innerHTML = '';
        if (ui.noNotifMsg) ui.noNotifMsg.classList.remove('hidden');
        return;
    }

    ui.notifList.innerHTML = notifications.map(notif => {
        let icon = 'fa-bell';
        let color = 'text-gray-400 bg-gray-800';

        if (notif.type === 'friend_request') { icon = 'fa-user-plus'; color = 'text-indigo-400 bg-indigo-400/20'; }
        if (notif.type === 'message') { icon = 'fa-comment-alt'; color = 'text-blue-400 bg-blue-400/20'; }
        if (notif.type === 'success') { icon = 'fa-trophy'; color = 'text-yellow-400 bg-yellow-400/20'; }

        const dateNotif = notif.createdAt ? (notif.createdAt.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt)) : new Date();
        const safeMessage = escapeHtml(notif.message);

        return `
        <div class="p-4 border-b border-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer flex justify-between items-start group">
            <div class="flex gap-3">
                <div class="w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0">
                    <i class="fas ${icon} text-xs"></i>
                </div>
                <div>
                    <p class="text-sm text-gray-300">${safeMessage}</p>
                    <p class="text-xs text-gray-500 mt-1">${timeAgo(dateNotif)}</p>
                </div>
            </div>
            <button onclick="deleteNotification('${notif.id}')" class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    }).join('');
}

// --- Window Scoped Functions for HTML Event Handlers ---

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

window.deleteFolder = async (folderId) => {
    if (confirm("Supprimer ce dossier ?")) {
        try {
            await deleteDoc(doc(db, 'users', currentUserId, 'folders', folderId));
            showToast("Dossier supprimé.");
        } catch (e) {
            console.error(e);
            showToast("Erreur suppression.", true);
        }
    }
};

window.deleteCourse = async (courseId) => {
    const course = window.allCourses.find(c => c.id === courseId);
    if (!course) return;

    if (confirm("Supprimer ce cours ?")) {
        try {
            // 1. Delete from Storage first if URL exists
            if (course.fileURL) {
                const fileRef = ref(storage, course.fileURL);
                await deleteObject(fileRef).catch(e => console.log("Fichier déjà supprimé ou introuvable dans Storage:", e));
            }

            // 2. Delete from Firestore
            const courseRef = doc(db, 'users', currentUserId, 'courses', courseId);
            await deleteDoc(courseRef);

            showToast("Fichier supprimé.");
        } catch (e) {
            console.error("Erreur suppression:", e);
            showToast("Erreur lors de la suppression.", true);
        }
    }
};

window.deleteNotification = async (notifId) => {
    try {
        await deleteDoc(doc(db, 'users', currentUserId, 'notifications', notifId));
    } catch (e) {
        console.error(e);
    }
};

window.handleDragStart = (e, courseId) => {
    e.dataTransfer.setData("text/plain", courseId);
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = '0.5';
};

window.handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add('bg-indigo-500/20', 'border-indigo-500');
};

window.handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-indigo-500/20', 'border-indigo-500');
};

window.handleDrop = async (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-indigo-500/20', 'border-indigo-500');

    const courseId = e.dataTransfer.getData("text/plain");

    document.querySelectorAll('.draggable-course').forEach(el => el.style.opacity = '1');

    if (courseId && folderId) {
        try {
            await updateDoc(doc(db, 'users', currentUserId, 'courses', courseId), {
                folderId: folderId
            });
            showToast("Cours déplacé !");
        } catch (error) {
            console.error(error);
            showToast("Erreur lors du déplacement.", true);
        }
    }
};

// --- Auth State Listener ---

onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        currentUserId = user.uid;
        renderHeader();
        setupNotifications(currentUserId);

        const foldersQuery = collection(db, 'users', currentUserId, 'folders');
        onSnapshot(foldersQuery, (snapshot) => {
            window.allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFolders();
        });

        const coursesQuery = collection(db, 'users', currentUserId, 'courses');
        onSnapshot(coursesQuery, (snapshot) => {
            window.allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        }, (error) => {
            console.error("Error fetching courses:", error);
            if (ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
        });

    } else {
        if (window.location.pathname.includes('/app/')) {
            window.location.href = '../auth/login.html';
        }
    }
});
