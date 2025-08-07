import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

let currentUserId = null;
let currentFolderId = null; // null signifie à la racine
let currentFolderName = "Mes Cours";
let allCourses = [];
let allFolders = [];

// --- Éléments du DOM ---
const ui = {
    // ... (déclarer tous les éléments du DOM ici pour un accès facile)
    loadingIndicator: document.getElementById('loading-indicator'),
    foldersGrid: document.getElementById('folders-grid'),
    coursesList: document.getElementById('courses-list'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    mainTitle: document.getElementById('main-title'),
    coursesTitle: document.getElementById('courses-title'),
    noContent: document.getElementById('no-content'),
    contextMenu: document.getElementById('context-menu'),
    renameModal: document.getElementById('rename-modal'),
    renameForm: document.getElementById('rename-form'),
    renameTitle: document.getElementById('rename-title'),
    newNameInput: document.getElementById('new-name-input'),
    cancelRenameBtn: document.getElementById('cancel-rename'),
    deleteModal: document.getElementById('delete-modal'),
    confirmDeleteBtn: document.getElementById('confirm-delete'),
    cancelDeleteBtn: document.getElementById('cancel-delete'),
    // ... etc pour toutes les modales et boutons
};

let contextTarget = null; // Élément sur lequel on a fait un clic droit/menu

// --- Fonctions de Rendu ---
function render() {
    renderBreadcrumbs();
    renderFolders();
    renderCourses();
    ui.loadingIndicator.classList.add('hidden');
}

function renderBreadcrumbs() {
    ui.breadcrumbs.innerHTML = `<a href="#" data-folderid="null" class="hover:text-white">Mes Cours</a>`;
    if (currentFolderId) {
        ui.breadcrumbs.innerHTML += ` <span class="mx-2">/</span> ${currentFolderName}`;
    }
    ui.mainTitle.textContent = currentFolderName;
}

function renderFolders() {
    // Affiche les dossiers uniquement à la racine
    document.getElementById('folders-section').style.display = currentFolderId ? 'none' : 'block';
    if (currentFolderId) return;

    ui.foldersGrid.querySelectorAll('.folder-item').forEach(el => el.remove());
    allFolders.forEach(folder => {
        const folderEl = createFolderElement(folder);
        ui.foldersGrid.appendChild(folderEl);
    });
}

function renderCourses() {
    ui.coursesList.innerHTML = '';
    const coursesToDisplay = allCourses.filter(course => course.folderId === currentFolderId);
    
    ui.coursesTitle.textContent = currentFolderId ? 'Cours dans ce dossier' : 'Cours non classés';

    if (coursesToDisplay.length === 0) {
        ui.noContent.classList.remove('hidden');
    } else {
        ui.noContent.classList.add('hidden');
        coursesToDisplay.forEach(course => {
            const courseEl = createCourseElement(course);
            ui.coursesList.appendChild(courseEl);
        });
    }
}

// --- Fonctions de Création d'Éléments ---
function createFolderElement(folder) {
    const el = document.createElement('div');
    el.className = 'folder-item relative bg-gray-800 p-4 rounded-lg flex items-center space-x-3 cursor-pointer hover:bg-gray-700 h-32 flex-col justify-center';
    el.dataset.id = folder.id;
    el.dataset.name = folder.name;
    el.innerHTML = `
        <i class="fas fa-folder text-4xl text-indigo-400"></i>
        <span class="font-semibold truncate mt-2">${folder.name}</span>
        <button class="context-menu-btn absolute top-2 right-2 text-gray-400 hover:text-white w-6 h-6 rounded-full flex items-center justify-center"><i class="fas fa-ellipsis-v"></i></button>
    `;
    el.addEventListener('click', () => navigateToFolder(folder.id, folder.name));
    return el;
}

function createCourseElement(course) {
    const el = document.createElement('div');
    el.className = 'course-item bg-gray-800 p-4 rounded-lg flex items-center justify-between border border-gray-700';
    el.dataset.id = course.id;
    el.dataset.name = course.name;
    el.dataset.fileName = course.fileName; // Important pour la suppression
    const uploadedDate = new Date(course.uploadedAt).toLocaleDateString('fr-FR');
    el.innerHTML = `
        <div class="flex items-center space-x-4 overflow-hidden">
            <i class="fas fa-file-pdf text-3xl text-red-500 flex-shrink-0"></i>
            <div class="overflow-hidden">
                <h3 class="font-bold text-md truncate" title="${course.name}">${course.name}</h3>
                <p class="text-sm text-gray-400">Ajouté le ${uploadedDate}</p>
            </div>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
            <a href="${course.url}" target="_blank" title="Voir le PDF" class="bg-gray-600 hover:bg-gray-500 text-white font-bold p-2 rounded-lg h-10 w-10 flex items-center justify-center"><i class="fas fa-eye"></i></a>
            <button class="context-menu-btn text-gray-400 hover:text-white bg-gray-700 p-2 rounded-lg h-10 w-10 flex items-center justify-center"><i class="fas fa-ellipsis-v"></i></button>
        </div>
    `;
    return el;
}

// --- Logique de Navigation et d'Actions ---
function navigateToFolder(folderId, folderName) {
    currentFolderId = folderId;
    currentFolderName = folderName;
    render();
}

function showContextMenu(e, type) {
    e.preventDefault();
    e.stopPropagation();
    contextTarget = {
        type: type,
        id: e.currentTarget.parentElement.dataset.id,
        name: e.currentTarget.parentElement.dataset.name,
        fileName: e.currentTarget.parentElement.dataset.fileName || null
    };
    ui.contextMenu.style.top = `${e.pageY}px`;
    ui.contextMenu.style.left = `${e.pageX}px`;
    ui.contextMenu.style.display = 'block';
}

function hideContextMenu() {
    ui.contextMenu.style.display = 'none';
    contextTarget = null;
}

async function handleRename() {
    if (!contextTarget) return;
    const { type, id, name } = contextTarget;
    ui.renameTitle.textContent = `Renommer "${name}"`;
    ui.newNameInput.value = name;
    ui.renameModal.classList.remove('hidden');

    ui.renameForm.onsubmit = async (e) => {
        e.preventDefault();
        const newName = ui.newNameInput.value.trim();
        if (newName && newName !== name) {
            const collectionName = type === 'folder' ? 'folders' : 'courses';
            const docRef = doc(db, 'users', currentUserId, collectionName, id);
            await updateDoc(docRef, { name: newName });
        }
        ui.renameModal.classList.add('hidden');
    };
}

function handleDelete() {
    if (!contextTarget) return;
    const { name } = contextTarget;
    document.getElementById('course-name-modal').textContent = name;
    ui.deleteModal.classList.remove('hidden');
}

async function confirmDelete() {
    if (!contextTarget || !currentUserId) return;
    const { type, id, fileName } = contextTarget;
    
    ui.confirmDeleteBtn.disabled = true;
    
    try {
        const collectionName = type === 'folder' ? 'folders' : 'courses';
        const docRef = doc(db, 'users', currentUserId, collectionName, id);
        await deleteDoc(docRef);

        if (type === 'course' && fileName) {
            const fileRef = ref(storage, `users/${currentUserId}/courses/${id}/${fileName}`);
            await deleteObject(fileRef);
        }
        
        // Si on supprime un dossier, on doit aussi mettre à jour les cours qui étaient dedans
        if (type === 'folder') {
            // Cette logique est plus complexe et sera ajoutée plus tard
        }
        
    } catch (error) {
        console.error("Erreur de suppression:", error);
    } finally {
        ui.deleteModal.classList.add('hidden');
        ui.confirmDeleteBtn.disabled = false;
        hideContextMenu();
    }
}


// --- Initialisation et Écouteurs d'Événements ---
onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        currentUserId = user.uid;
        // Écouteurs en temps réel
        onSnapshot(collection(db, 'users', currentUserId, 'folders'), (snapshot) => {
            allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        });
        onSnapshot(collection(db, 'users', currentUserId, 'courses'), (snapshot) => {
            allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        });
    } else {
        window.location.href = '/login.html';
    }
});

// Clic pour naviguer à la racine
ui.breadcrumbs.addEventListener('click', (e) => {
    if (e.target.dataset.folderid === 'null') {
        navigateToFolder(null, "Mes Cours");
    }
});

// Clics pour les menus contextuels
document.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('.context-menu-btn');
    if (menuBtn) {
        const parent = menuBtn.closest('.folder-item, .course-item');
        const type = parent.classList.contains('folder-item') ? 'folder' : 'course';
        showContextMenu(e, type);
    } else if (!e.target.closest('.context-menu')) {
        hideContextMenu();
    }
});

// Actions du menu contextuel
ui.contextMenu.addEventListener('click', (e) => {
    const action = e.target.closest('button').dataset.action;
    if (action === 'rename') handleRename();
    if (action === 'delete') handleDelete();
});

// Boutons des modales
ui.cancelRenameBtn.addEventListener('click', () => ui.renameModal.classList.add('hidden'));
ui.confirmDeleteBtn.addEventListener('click', confirmDelete);
ui.cancelDeleteBtn.addEventListener('click', () => ui.deleteModal.classList.add('hidden'));