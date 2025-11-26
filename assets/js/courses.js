import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- State Management ---
let currentUserId = null;
let currentFolderId = null;
let currentFolderName = "Mes Cours";
let allCourses = [];
let allFolders = [];

// --- DOM Elements ---
const ui = {
    userAvatar: document.getElementById('user-avatar-header'),
    userName: document.getElementById('user-name-header'),
    logoutButton: document.getElementById('logout-button'),
    loadingIndicator: document.getElementById('loading-indicator'),
    foldersGrid: document.getElementById('folders-grid'),
    foldersGridWrapper: document.getElementById('folders-grid-wrapper'),
    coursesList: document.getElementById('courses-list'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    mainTitle: document.getElementById('main-title'),
    coursesTitle: document.getElementById('courses-title'),
    noContent: document.getElementById('no-content'),
    newFolderBtn: document.getElementById('new-folder-button'),
};

// --- Helper Functions ---
function showMessage(message, isError = false) {
    const box = document.getElementById('message-box');
    if (!box) return;
    
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-2xl text-white flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-500 pointer-events-auto border ${isError ? 'bg-gray-900 border-red-500/30' : 'bg-gray-900 border-green-500/30'}`;
    toast.innerHTML = `
        <div class="${isError ? 'text-red-400' : 'text-green-400'} text-xl"><i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i></div>
        <p class="font-medium text-sm">${message}</p>
    `;
    box.appendChild(toast);
    box.classList.remove('hidden');
    
    requestAnimationFrame(() => { toast.classList.remove('translate-y-10', 'opacity-0'); });
    setTimeout(() => { 
        toast.classList.add('translate-y-10', 'opacity-0'); 
        setTimeout(() => {
            toast.remove();
            if(box.children.length === 0) box.classList.add('hidden');
        }, 500); 
    }, 4000);
}

// --- Drag & Drop Logic ---

// Démarrage du drag (Fichier)
window.handleDragStart = (e, courseId) => {
    e.dataTransfer.setData("text/plain", courseId);
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add('draggable-source');
};

// Fin du drag (Nettoyage style)
window.handleDragEnd = (e) => {
    e.target.classList.remove('draggable-source');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
};

// Survol d'une zone de drop (Dossier)
window.handleDragOver = (e) => {
    e.preventDefault(); // Nécessaire pour autoriser le drop
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add('drag-over');
};

// Sortie de zone (Dossier)
window.handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
};

// Drop (Action finale)
window.handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const courseId = e.dataTransfer.getData("text/plain");
    if (!courseId) return;

    // Empêcher de drop dans le dossier courant (inutile)
    if (targetFolderId === currentFolderId) return;
    // Si targetFolderId est 'root' (ex: retour accueil), on le met à null
    const finalFolderId = targetFolderId === 'root' ? null : targetFolderId;

    try {
        const courseRef = doc(db, 'users', currentUserId, 'courses', courseId);
        await updateDoc(courseRef, { folderId: finalFolderId });
        showMessage("Fichier déplacé avec succès !");
        // Le snapshot listener rechargera l'UI automatiquement
    } catch (error) {
        console.error("Erreur déplacement:", error);
        showMessage("Erreur lors du déplacement.", true);
    }
};

// --- Render Functions ---
function render() {
    if (!currentUserId) return;
    if(ui.loadingIndicator) ui.loadingIndicator.classList.add('hidden');

    renderBreadcrumbs();
    renderFolders();
    renderCourses();
}

async function renderHeader(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const profileData = docSnap.data();
            if (ui.userName) ui.userName.textContent = profileData.firstName;
            if (ui.userAvatar) ui.userAvatar.src = profileData.photoURL || 'https://ui-avatars.com/api/?background=random';
            
            // Admin check
            const adminLink = document.getElementById('admin-link');
            if (profileData.role === 'admin' && adminLink) {
                adminLink.classList.remove('hidden');
            }
        }
    } catch (e) {
        console.error("Erreur chargement header:", e);
    }
}

function renderBreadcrumbs() {
    if (!ui.breadcrumbs) return;
    
    // Zone de drop "Retour à l'accueil" si on est dans un dossier
    const dropAttr = currentFolderId 
        ? `ondragover="window.handleDragOver(event)" ondragleave="window.handleDragLeave(event)" ondrop="window.handleDrop(event, 'root')"` 
        : '';

    if (!currentFolderId) {
        ui.breadcrumbs.innerHTML = `<span class="text-indigo-400 font-medium">Accueil</span>`;
        if(ui.mainTitle) ui.mainTitle.textContent = "Mes Dossiers";
    } else {
        ui.breadcrumbs.innerHTML = `
            <span class="cursor-pointer hover:text-white transition-colors p-2 rounded-lg border border-transparent hover:border-indigo-500/50" onclick="window.resetView()" ${dropAttr}>
                <i class="fas fa-home mr-1"></i> Accueil
            </span>
            <i class="fas fa-chevron-right text-xs mx-2 text-gray-600"></i>
            <span class="text-indigo-400 font-medium">${currentFolderName}</span>
        `;
        if(ui.mainTitle) ui.mainTitle.textContent = currentFolderName;
    }
}

function renderFolders() {
    if (!ui.foldersGrid) return;

    if (currentFolderId) {
        // En mode dossier, on cache la grille des dossiers pour l'instant
        // (Amélioration possible: afficher les sous-dossiers si on en avait)
        ui.foldersGridWrapper.classList.add('hidden');
        return; 
    } else {
        ui.foldersGridWrapper.classList.remove('hidden');
    }

    ui.foldersGrid.innerHTML = allFolders.map(folder => `
        <div class="content-glass p-5 rounded-xl cursor-pointer hover:bg-white/5 transition-all duration-300 group border border-white/5 hover:border-indigo-500/30 relative" 
             onclick="window.openFolder('${folder.id}', '${folder.name}')"
             ondragover="window.handleDragOver(event)"
             ondragleave="window.handleDragLeave(event)"
             ondrop="window.handleDrop(event, '${folder.id}')">
            
            <div class="flex justify-between items-start mb-4 pointer-events-none">
                <div class="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas fa-folder text-xl"></i>
                </div>
                <button class="pointer-events-auto text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1" onclick="event.stopPropagation(); window.deleteFolder('${folder.id}')" title="Supprimer le dossier">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
            </div>
            <h3 class="font-bold text-white text-lg truncate mb-1 group-hover:text-indigo-300 transition-colors pointer-events-none">${folder.name}</h3>
            <p class="text-xs text-gray-400 font-medium pointer-events-none">${folder.courseCount || 0} fichiers</p>
            
            <!-- Feedback visuel pour le drop -->
            <div class="absolute inset-0 rounded-xl bg-indigo-500/10 border-2 border-indigo-500 opacity-0 transition-opacity pointer-events-none drag-overlay"></div>
        </div>
    `).join('');
}

function renderCourses() {
    if (!ui.coursesList) return;
    
    const coursesToShow = currentFolderId 
        ? allCourses.filter(c => c.folderId === currentFolderId)
        : allCourses.filter(c => !c.folderId);

    ui.coursesList.innerHTML = '';
    
    if (coursesToShow.length === 0) {
        if(ui.noContent) ui.noContent.classList.remove('hidden');
        ui.coursesTitle.textContent = currentFolderId ? `Contenu: ${currentFolderName}` : "Fichiers & Synthèses";
    } else {
        if(ui.noContent) ui.noContent.classList.add('hidden');
        ui.coursesTitle.textContent = currentFolderId ? `Contenu: ${currentFolderName}` : "Fichiers & Synthèses (Hors Dossier)";
        
        const sortedCourses = coursesToShow.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        ui.coursesList.innerHTML = sortedCourses.map(course => {
            let iconClass = "fa-file-alt";
            let colorClass = "text-blue-400 bg-blue-400/10";
            
            if (course.type === 'synthesis') {
                iconClass = "fa-magic";
                colorClass = "text-pink-400 bg-pink-400/10";
            } else if (course.fileName && course.fileName.toLowerCase().endsWith('.pdf')) {
                iconClass = "fa-file-pdf";
                colorClass = "text-red-400 bg-red-400/10";
            }
            
            const displayTitle = course.title || course.name || course.fileName || 'Sans titre';
            let dateStr = 'Récemment';
            if (course.createdAt && course.createdAt.toDate) {
                dateStr = course.createdAt.toDate().toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'});
            }

            // Ajout des attributs draggable
            return `
            <div class="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group animate-fade-in-up border-b border-gray-800/50 cursor-pointer draggable-item"
                 draggable="true"
                 ondragstart="window.handleDragStart(event, '${course.id}')"
                 ondragend="window.handleDragEnd(event)"
                 onclick="event.stopPropagation(); window.open('${course.fileURL || course.url || 'synthesize.html?id=' + course.id}', '_blank')">
                
                <div class="flex items-center gap-4 pointer-events-none">
                    <div class="w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-medium text-white truncate group-hover:text-indigo-300 transition-colors">${displayTitle}</h4>
                        <div class="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>${course.fileName || 'Document IA'}</span>
                            <span class="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                    <button class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Déplacer manuellement" onclick="event.stopPropagation(); window.promptMove('${course.id}')">
                        <i class="fas fa-folder-open"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Supprimer" onclick="event.stopPropagation(); window.deleteCourse('${course.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    }
}

// --- Global Actions (exposed) ---

window.openFolder = (id, name) => {
    const url = new URL(window.location.href);
    url.searchParams.set('folder', id);
    history.pushState(null, '', url.toString());

    currentFolderId = id;
    currentFolderName = name;
    render();
};

window.resetView = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('folder');
    history.pushState(null, '', url.toString());

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
                showMessage("Dossier créé !");
            } catch (e) {
                console.error(e);
                showMessage("Erreur création.", true);
            }
        }
    });
}

window.deleteFolder = async (folderId) => {
    if(confirm("Supprimer ce dossier va détacher les cours (retour racine). Confirmer ?")) {
        try {
            // 1. Détacher les cours
            const coursesToUpdate = allCourses.filter(c => c.folderId === folderId);
            coursesToUpdate.forEach(course => {
                const courseRef = doc(db, 'users', currentUserId, 'courses', course.id);
                updateDoc(courseRef, { folderId: null });
            });

            // 2. Supprimer le dossier
            await deleteDoc(doc(db, 'users', currentUserId, 'folders', folderId));
            showMessage("Dossier supprimé.");
        } catch (e) {
            console.error(e);
            showMessage("Erreur suppression.", true);
        }
    }
};

window.deleteCourse = async (courseId) => {
    if(confirm("Supprimer définitivement ?")) {
        try {
            await deleteDoc(doc(db, 'users', currentUserId, 'courses', courseId));
            showMessage("Fichier supprimé.");
        } catch (e) {
            console.error(e);
            showMessage("Erreur suppression.", true);
        }
    }
};

window.promptMove = async (courseId) => {
    if (allFolders.length === 0) {
        showMessage("Créez d'abord un dossier.", true);
        return;
    }
    const course = allCourses.find(c => c.id === courseId);
    let promptMessage = "Déplacer '" + (course.title || course.fileName) + "' vers :\n0: Racine\n";
    let folderMap = {};
    allFolders.forEach((f, index) => {
        promptMessage += `${index + 1}: ${f.name}\n`;
        folderMap[index + 1] = f.id;
    });
    const input = prompt(promptMessage);
    if (input === null) return; 

    const choice = parseInt(input);
    let newFolderId = null;
    if (choice !== 0 && folderMap[choice]) newFolderId = folderMap[choice];
    else if (choice !== 0) { showMessage("Choix invalide.", true); return; }

    try {
        const courseRef = doc(db, 'users', currentUserId, 'courses', courseId);
        await updateDoc(courseRef, { folderId: newFolderId });
        showMessage("Cours déplacé !");
    } catch (e) { console.error(e); showMessage("Erreur déplacement.", true); }
};

// --- Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        currentUserId = user.uid;
        
        const urlParams = new URLSearchParams(window.location.search);
        const urlFolderId = urlParams.get('folder');
        if (urlFolderId) currentFolderId = urlFolderId;
        
        renderHeader(user);

        // Listeners
        const foldersQuery = query(collection(db, 'users', currentUserId, 'folders'), orderBy('createdAt', 'desc'));
        onSnapshot(foldersQuery, (snapshot) => {
            allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (currentFolderId) {
                const currentFolder = allFolders.find(f => f.id === currentFolderId);
                if (currentFolder) currentFolderName = currentFolder.name;
                else window.resetView();
            }
            render();
        });

        const coursesQuery = query(collection(db, 'users', currentUserId, 'courses'), orderBy('createdAt', 'desc'));
        onSnapshot(coursesQuery, (snapshot) => {
            allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Update Folder Counts (Local only for display speed)
            allFolders.forEach(folder => {
                folder.courseCount = allCourses.filter(c => c.folderId === folder.id).length;
            });
            render();
        });

    } else {
        window.location.href = '../auth/login.html';
    }
});

if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = '../../index.html';
    });
}