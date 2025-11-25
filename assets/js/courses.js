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
    foldersGridWrapper: document.getElementById('folders-grid-wrapper'), // Pour masquer/afficher
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
    
    // Simple toast logic adapted for generic use
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-2xl text-white flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-500 pointer-events-auto border ${isError ? 'bg-gray-900 border-red-500/30' : 'bg-gray-900 border-green-500/30'}`;
    toast.innerHTML = `
        <div class="${isError ? 'text-red-400' : 'text-green-400'} text-xl"><i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i></div>
        <p class="font-medium text-sm">${message}</p>
    `;
    document.getElementById('message-box').appendChild(toast);
    
    requestAnimationFrame(() => { toast.classList.remove('translate-y-10', 'opacity-0'); });
    setTimeout(() => { toast.classList.add('translate-y-10', 'opacity-0'); setTimeout(() => toast.remove(), 500); }, 4000);
}

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
            <span class="cursor-pointer hover:text-white transition-colors" onclick="window.resetView()">Accueil</span>
            <i class="fas fa-chevron-right text-xs mx-2"></i>
            <span class="text-indigo-400 font-medium">${currentFolderName}</span>
        `;
        if(ui.mainTitle) ui.mainTitle.textContent = currentFolderName;
    }
}

function renderFolders() {
    if (!ui.foldersGrid) return;

    if (currentFolderId) {
        // En mode dossier, on cache la grille des dossiers
        ui.foldersGridWrapper.classList.add('hidden');
        return; 
    } else {
        // En mode racine, on affiche tous les dossiers
        ui.foldersGridWrapper.classList.remove('hidden');
    }

    ui.foldersGrid.innerHTML = allFolders.map(folder => `
        <div class="content-glass p-5 rounded-xl cursor-pointer hover:bg-white/5 transition-all duration-300 group border border-white/5 hover:border-indigo-500/30 relative" 
             onclick="window.openFolder('${folder.id}', '${folder.name}')">
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas fa-folder text-xl"></i>
                </div>
                <button class="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1" onclick="event.stopPropagation(); window.deleteFolder('${folder.id}')" title="Supprimer le dossier">
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
    
    // Filtrer les cours : soit ceux sans folderId (racine), soit ceux avec le folderId actuel
    const coursesToShow = currentFolderId 
        ? allCourses.filter(c => c.folderId === currentFolderId)
        : allCourses.filter(c => !c.folderId);

    ui.coursesList.innerHTML = '';
    
    if (coursesToShow.length === 0 && allFolders.length === 0) {
        if(ui.noContent) ui.noContent.classList.remove('hidden');
        ui.coursesTitle.textContent = "Fichiers & Synthèses"; // Retour au titre générique
    } else if (coursesToShow.length === 0 && currentFolderId) {
        // Dossier vide
        if(ui.noContent) ui.noContent.classList.remove('hidden');
        ui.coursesTitle.textContent = `Contenu du dossier: ${currentFolderName}`;
    } else {
        if(ui.noContent) ui.noContent.classList.add('hidden');
        ui.coursesTitle.textContent = currentFolderId ? `Contenu du dossier: ${currentFolderName}` : "Fichiers & Synthèses (Hors Dossier)";
        
        // Trie par date de création inverse (plus récent en premier)
        const sortedCourses = coursesToShow.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        ui.coursesList.innerHTML = sortedCourses.map(course => {
            let iconClass = "fa-file-alt";
            let colorClass = "text-blue-400 bg-blue-400/10";
            
            // Déterminer l'icône/couleur par type
            if (course.type === 'synthesis') { // Hypothèse: les synthèses ont un champ 'type'
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

            return `
            <div class="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group animate-fade-in-up border-b border-gray-800/50 cursor-pointer">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-medium text-white truncate group-hover:text-indigo-300 transition-colors" onclick="event.stopPropagation(); window.open('${course.fileURL || course.url || 'synthesize.html?id=' + course.id}', '_blank')">${displayTitle}</h4>
                        <div class="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>${course.fileName || 'Document IA'}</span>
                            <span class="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Déplacer" onclick="event.stopPropagation(); window.promptMove('${course.id}')">
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

// --- Global Actions (exposed to the window for onclick events) ---

window.openFolder = (id, name) => {
    // Mise à jour de l'URL pour un lien partagé/actualisable
    const url = new URL(window.location.href);
    url.searchParams.set('folder', id);
    history.pushState(null, '', url.toString());

    currentFolderId = id;
    currentFolderName = name;
    render();
};

window.resetView = () => {
    // Mise à jour de l'URL pour un lien partagé/actualisable
    const url = new URL(window.location.href);
    url.searchParams.delete('folder');
    history.pushState(null, '', url.toString());

    currentFolderId = null;
    currentFolderName = "Mes Cours";
    render();
};

// Logique de création de dossier
if(ui.newFolderBtn) {
    ui.newFolderBtn.addEventListener('click', async () => {
        const folderName = prompt("Nom du nouveau dossier :");
        if (folderName && currentUserId) {
            try {
                // Création du dossier
                const newFolderData = {
                    name: folderName,
                    createdAt: serverTimestamp(),
                    courseCount: 0
                };
                
                await addDoc(collection(db, 'users', currentUserId, 'folders'), newFolderData);
                showMessage("Dossier créé avec succès !");
            } catch (e) {
                console.error(e);
                showMessage("Erreur lors de la création du dossier.", true);
            }
        }
    });
}

// Logique de suppression de dossier
window.deleteFolder = async (folderId) => {
    if(confirm("ATTENTION : Supprimer ce dossier va détacher tous les cours qu'il contient (ils reviendront à la racine). Confirmez-vous ?")) {
        try {
            // 1. Détacher les cours (mettre folderId à null)
            const coursesToUpdate = allCourses.filter(c => c.folderId === folderId);
            const batch = db.batch();
            coursesToUpdate.forEach(course => {
                const courseRef = doc(db, 'users', currentUserId, 'courses', course.id);
                // Utilisation de updateDoc car on ne veut pas écraser tout le document
                updateDoc(courseRef, { folderId: null });
            });
            await batch.commit();

            // 2. Supprimer le dossier lui-même
            await deleteDoc(doc(db, 'users', currentUserId, 'folders', folderId));

            showMessage("Dossier supprimé et cours déplacés à la racine.");
        } catch (e) {
            console.error(e);
            showMessage("Erreur lors de la suppression du dossier.", true);
        }
    }
};

// Logique de suppression de cours
window.deleteCourse = async (courseId) => {
    if(confirm("Voulez-vous vraiment supprimer ce fichier définitivement ?")) {
        try {
            await deleteDoc(doc(db, 'users', currentUserId, 'courses', courseId));
            showMessage("Fichier supprimé.");
        } catch (e) {
            console.error(e);
            showMessage("Erreur suppression.", true);
        }
    }
};

// Logique de déplacement de cours (simple prompt pour l'instant)
window.promptMove = async (courseId) => {
    if (allFolders.length === 0) {
        showMessage("Créez d'abord un dossier pour pouvoir déplacer des fichiers.", true);
        return;
    }

    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;

    let promptMessage = "Déplacer le cours '" + (course.title || course.fileName) + "' vers :\n\n";
    let folderMap = {};
    allFolders.forEach((f, index) => {
        promptMessage += `${index + 1}: ${f.name}\n`;
        folderMap[index + 1] = f.id;
    });
    promptMessage += "\nEntrez le numéro du dossier (ou '0' pour la racine) :";

    const input = prompt(promptMessage);
    if (input === null) return; 

    const choice = parseInt(input);
    let newFolderId = null;

    if (choice === 0) {
        newFolderId = null; // Racine
    } else if (folderMap[choice]) {
        newFolderId = folderMap[choice];
    } else {
        showMessage("Choix invalide.", true);
        return;
    }

    try {
        const courseRef = doc(db, 'users', currentUserId, 'courses', courseId);
        await updateDoc(courseRef, { folderId: newFolderId });
        showMessage("Cours déplacé !");
    } catch (e) {
        console.error(e);
        showMessage("Erreur lors du déplacement.", true);
    }
};


// --- Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        currentUserId = user.uid;
        
        // Récupérer le folderId depuis l'URL au chargement initial
        const urlParams = new URLSearchParams(window.location.search);
        const urlFolderId = urlParams.get('folder');
        
        if (urlFolderId) {
            currentFolderId = urlFolderId;
            // On aura besoin de set currentFolderName plus tard si on ne l'a pas en cache
        }
        
        renderHeader(user);

        // Ecouteur pour la collection de Dossiers (nécessaire pour le comptage de cours)
        const foldersQuery = query(collection(db, 'users', currentUserId, 'folders'), orderBy('createdAt', 'desc'));
        onSnapshot(foldersQuery, (snapshot) => {
            allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Si on est dans un dossier spécifique, met à jour son nom
            if (currentFolderId) {
                const currentFolder = allFolders.find(f => f.id === currentFolderId);
                if (currentFolder) {
                    currentFolderName = currentFolder.name;
                } else {
                    // Si le dossier a été supprimé, on reset la vue
                    window.resetView();
                    return;
                }
            }
            render();
        }, (error) => {
            console.warn("Info: Pas encore de dossiers.", error);
        });

        // Ecouteur pour la collection de Cours (Toutes les données)
        const coursesQuery = query(collection(db, 'users', currentUserId, 'courses'), orderBy('createdAt', 'desc'));
        onSnapshot(coursesQuery, (snapshot) => {
            allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Mise à jour du compteur de cours pour chaque dossier
            allFolders.forEach(folder => {
                const count = allCourses.filter(c => c.folderId === folder.id).length;
                if (folder.courseCount !== count) {
                    // Mettre à jour le compteur dans Firestore (peut être coûteux en écritures!)
                    // OPTIMISATION: Ceci pourrait être fait via une Cloud Function après chaque upload/déplacement
                    // Mais pour le frontend démo, on le met à jour pour l'affichage :
                    const folderRef = doc(db, 'users', currentUserId, 'folders', folder.id);
                    updateDoc(folderRef, { courseCount: count }).catch(e => console.error("Erreur update count:", e));
                }
            });

            render();
        }, (error) => {
            console.warn("Info: Pas encore de cours.", error);
        });

    } else {
        // Redirection si déconnecté
        window.location.href = '../auth/login.html';
    }
});

if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '../../index.html';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    });
}