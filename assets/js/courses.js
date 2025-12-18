import { auth, db, storage } from './config.js';
import { showToast, timeAgo } from './utils.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Références DOM
const coursesGrid = document.getElementById('courses-grid');
const loader = document.getElementById('loader');

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
};

async function render() {
    if (!currentUserId) return;
    renderHeader();
    renderBreadcrumbs();
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        const profileData = docSnap.data();
        const nameEl = document.getElementById('user-name-header');
        const avatarEl = document.getElementById('user-avatar-header');

        if (nameEl) nameEl.textContent = profileData.firstName;
        if (avatarEl) avatarEl.src = profileData.photoURL || 'https://ui-avatars.com/api/?background=random';
        if (ui.navLoggedIn) ui.navLoggedIn.classList.remove('hidden');
    }
}


function renderBreadcrumbs() {
    if (!ui.breadcrumbs) return;
    if (!currentFolderId) {
        ui.breadcrumbs.innerHTML = `<span class="text-indigo-400 font-medium">Accueil</span>`;
        if (ui.mainTitle) ui.mainTitle.textContent = "Mes Dossiers";
    } else {
        ui.breadcrumbs.innerHTML = `
            <span class="cursor-pointer hover:text-white transition-colors" onclick="resetView()">Accueil</span>
            <i class="fas fa-chevron-right text-xs mx-2"></i>
            <span class="text-indigo-400 font-medium">${currentFolderName}</span>
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
}

// Fonction de chargement des cours depuis Firestore
async function loadCourses(userId) {
    if(loader) loader.classList.remove('hidden');
    coursesGrid.innerHTML = ''; // Reset

    try {
        // Requête : Prendre les cours créés par l'user (ou publics, selon ta logique)
        const q = query(
            collection(db, "courses"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            coursesGrid.innerHTML = `
                <div class="col-span-full text-center py-10 text-gray-400">
                    <p class="text-xl">Aucun cours trouvé 📚</p>
                    <a href="upload.html" class="mt-4 inline-block text-indigo-400 hover:text-indigo-300">Ajouter mon premier cours</a>
                </div>
            `;
            return;
        }

        // Génération des cartes
        querySnapshot.forEach((doc) => {
            const course = doc.data();
            const card = createCourseCard(doc.id, course);
            coursesGrid.appendChild(card);
        });

    } catch (err) {
        console.error("Erreur chargement cours :", err);
        coursesGrid.innerHTML = `<p class="text-red-400">Erreur lors du chargement des cours.</p>`;
    } finally {
        if(loader) loader.classList.add('hidden');
    }
}


// Création HTML d'une carte (Template String)
function createCourseCard(id, data) {
    const div = document.createElement('div');
    // Classes Tailwind pour l'effet Glassmorphism
    div.className = "content-glass p-5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden";
    
    // Fallback si pas d'image
    const bgImage = data.thumbnailUrl || 'https://via.placeholder.com/400x200/3730a3/ffffff?text=Cours';

    div.innerHTML = `
        <div class="h-32 rounded-lg bg-cover bg-center mb-4" style="background-image: url('${bgImage}')"></div>
        <h3 class="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">${data.title || 'Sans titre'}</h3>
        <p class="text-sm text-gray-400 mb-3">${data.subject || 'Matière inconnue'} • ${data.year || 'N/A'}</p>
        
        <div class="flex gap-2 mt-4">
            <a href="synthesize.html?id=${id}" class="flex-1 text-center py-2 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 text-sm transition">
                <i class="fas fa-magic mr-1"></i> Synthèse
            </a>
            <a href="quiz.html?id=${id}" class="flex-1 text-center py-2 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 text-sm transition">
                <i class="fas fa-question-circle mr-1"></i> Quiz
            </a>
        </div>
    `;
    return div;
}

function renderCourses() {
    if (!ui.coursesList) return;

    const coursesToShow = window.allCourses.filter(c => {
        if (currentFolderId) {
            return c.folderId === currentFolderId;
        } else {
            return !c.folderId || c.folderId === 'null';
        }
    });

    if (coursesToShow.length === 0) {
        if (ui.noContent) ui.noContent.classList.remove('hidden');
        ui.coursesList.innerHTML = '';
    } else {
        if (ui.noContent) ui.noContent.classList.add('hidden');

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

            const displayTitle = course.title || course.name || course.fileName || 'Sans titre';
            const link = course.fileURL || course.url || '#';

            return `
            <div class="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group border-b border-gray-800/50 cursor-pointer draggable-course" 
                 draggable="true"
                 data-course-id="${course.id}"
                 ondragstart="handleDragStart(event, '${course.id}')"
                 onclick="window.open('${link}', '_blank')">
                <div class="flex items-center gap-4 pointer-events-none">
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
                    <button class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Télécharger" onclick="event.stopPropagation(); window.open('${link}', '_blank')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Supprimer" onclick="event.stopPropagation(); deleteCourse('${course.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    }
}

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
    if (confirm("Supprimer ce cours ?")) {
        try {
            const courseRef = doc(db, 'users', currentUserId, 'courses', courseId);
            const courseSnap = await getDoc(courseRef);
            if (courseSnap.exists()) {
                const fileRef = ref(storage, courseSnap.data().fileURL);
                await deleteObject(fileRef).catch(e => console.log("Fichier déjà supprimé ou introuvable"));
                await deleteDoc(courseRef);
                showToast("Fichier supprimé.");
            }
        } catch (e) {
            console.error(e);
            showToast("Erreur suppression.", true);
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
            if (ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');
        });

    } else {
        if (window.location.pathname.includes('/app/')) {
            window.location.href = '../auth/login.html';
        }
    }
});
