import { auth, db, storage } from '../../core/services/firebase/index.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { showToast } from '../../shared/components/ui/Toast.js';
import { formatDate } from '../../shared/utils/formatters.js';
import { initLayout } from '../../shared/components/Layout.js';

let currentUserId = null;
let currentFolder = 'root';
let coursesData = [];

const ui = {
    grid: document.getElementById('courses-grid'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    loader: document.getElementById('loader'),
    emptyState: document.getElementById('empty-state'),
    folderModal: document.getElementById('folder-modal'),
    folderInput: document.getElementById('folder-name-input'),
    btnCreateFolder: document.getElementById('btn-create-folder'),
    btnOpenFolderModal: document.getElementById('btn-open-folder-modal'),
    btnCloseFolderModal: document.getElementById('btn-close-folder-modal'),
    btnCancelFolder: document.getElementById('btn-cancel-folder')
};

export function initCourses() {
    initLayout('courses');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            loadCourses();
        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
}

function setupEventListeners() {
    if(ui.searchInput) ui.searchInput.addEventListener('input', (e) => filterCourses(e.target.value));
    if(ui.sortSelect) ui.sortSelect.addEventListener('change', () => filterCourses(ui.searchInput.value));

    if (ui.uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            ui.uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            ui.uploadArea.addEventListener(eventName, () => ui.uploadArea.classList.add('border-indigo-500', 'bg-indigo-500/10'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            ui.uploadArea.addEventListener(eventName, () => ui.uploadArea.classList.remove('border-indigo-500', 'bg-indigo-500/10'), false);
        });
        ui.uploadArea.addEventListener('drop', handleDrop, false);
        ui.uploadArea.addEventListener('click', () => ui.fileInput.click());
    }

    if(ui.fileInput) ui.fileInput.addEventListener('change', handleFiles);

    const toggleFolderModal = (show) => ui.folderModal.classList.toggle('hidden', !show);
    if(ui.btnOpenFolderModal) ui.btnOpenFolderModal.onclick = () => toggleFolderModal(true);
    if(ui.btnCloseFolderModal) ui.btnCloseFolderModal.onclick = () => toggleFolderModal(false);
    if(ui.btnCancelFolder) ui.btnCancelFolder.onclick = () => toggleFolderModal(false);

    if(ui.btnCreateFolder) ui.btnCreateFolder.onclick = async () => {
        const name = ui.folderInput.value.trim();
        if(!name) return showToast("Nom du dossier requis", "error");

        try {
            await addDoc(collection(db, 'users', currentUserId, 'courses'), {
                type: 'folder',
                name: name,
                parentId: currentFolder,
                createdAt: serverTimestamp()
            });
            ui.folderInput.value = "";
            toggleFolderModal(false);
            loadCourses();
            showToast("Dossier créé", "success");
        } catch(e) {
            console.error(e);
            showToast("Erreur création dossier", "error");
        }
    };
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

async function loadCourses() {
    if (!currentUserId) return;

    ui.loader.classList.remove('hidden');
    ui.grid.classList.add('hidden');
    ui.emptyState.classList.add('hidden');

    try {
        const q = query(
            collection(db, 'users', currentUserId, 'courses'),
            where('parentId', '==', currentFolder)
        );

        const snapshot = await getDocs(q);
        coursesData = [];

        snapshot.forEach(docSnap => {
            coursesData.push({ id: docSnap.id, ...docSnap.data() });
        });

        updateBreadcrumbs();
        filterCourses(ui.searchInput ? ui.searchInput.value : '');

    } catch (error) {
        console.error("Erreur chargement:", error);
        showToast("Impossible de charger les cours", "error");
    } finally {
        ui.loader.classList.add('hidden');
        ui.grid.classList.remove('hidden');
    }
}

function updateBreadcrumbs() {
    if (currentFolder === 'root') {
        ui.breadcrumbs.innerHTML = `<span class="text-white">Mes Cours</span>`;
    }
}

function filterCourses(searchTerm) {
    const term = searchTerm.toLowerCase();
    const sortType = ui.sortSelect ? ui.sortSelect.value : 'date-desc';

    let filtered = coursesData.filter(item => {
        const name = (item.title || item.name || item.fileName || "").toLowerCase();
        return name.includes(term);
    });

    filtered.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;

        const dateA = a.createdAt ? a.createdAt.seconds : 0;
        const dateB = b.createdAt ? b.createdAt.seconds : 0;
        const nameA = (a.title || a.name || "").toLowerCase();
        const nameB = (b.title || b.name || "").toLowerCase();

        switch (sortType) {
            case 'date-desc': return dateB - dateA;
            case 'date-asc': return dateA - dateB;
            case 'name-asc': return nameA.localeCompare(nameB);
            case 'name-desc': return nameB.localeCompare(nameA);
            default: return 0;
        }
    });

    renderGrid(filtered);
}

function renderGrid(items) {
    ui.grid.innerHTML = '';

    if (items.length === 0) {
        ui.emptyState.classList.remove('hidden');
        return;
    } else {
        ui.emptyState.classList.add('hidden');
    }

    if (currentFolder !== 'root') {
        const backCard = document.createElement('div');
        backCard.className = 'content-glass rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-white/5 border border-dashed border-gray-700 h-[100px] group';
        backCard.innerHTML = `<div class="text-center text-gray-400 group-hover:text-white"><i class="fas fa-reply text-xl mb-1"></i><p class="text-xs">Retour</p></div>`;
        backCard.onclick = goUpLevel;
        ui.grid.appendChild(backCard);
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'content-glass rounded-xl p-4 relative group hover:border-indigo-500/50 transition-all border border-transparent';

        const isFolder = item.type === 'folder';
        const icon = isFolder ? 'fa-folder text-yellow-400' : 'fa-file-pdf text-red-400';
        const title = escapeHtml(item.title || item.name || item.fileName || "Sans titre");
        const date = formatDate(item.createdAt);
        const size = item.size ? (item.size / 1024 / 1024).toFixed(2) + ' MB' : '';

        el.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="p-3 rounded-lg bg-gray-800/50 text-xl ${isFolder ? 'text-yellow-400' : 'text-red-400'}">
                    <i class="fas ${icon}"></i>
                </div>
                <button class="delete-btn opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-opacity" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <h3 class="font-bold text-gray-200 text-sm mb-1 truncate" title="${title}">${title}</h3>
            <div class="flex justify-between items-center text-[10px] text-gray-500">
                <span>${date}</span>
                <span>${size}</span>
            </div>
        `;

        if (isFolder) {
            el.addEventListener('click', (e) => {
                if(!e.target.closest('button')) enterFolder(item.id, title);
            });
        } else {
            el.addEventListener('click', (e) => {
                if(!e.target.closest('button')) window.open(item.url, '_blank');
            });
        }

        const delBtn = el.querySelector('.delete-btn');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteItem(item);
        };

        ui.grid.appendChild(el);
    });
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files: files } });
}

async function handleFiles(e) {
    const files = [...e.target.files];
    if (files.length === 0) return;

    showToast(`Envoi de ${files.length} fichier(s)...`, "info");

    for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
            showToast(`Fichier trop lourd: ${file.name}`, "error");
            continue;
        }

        try {
            const storageRef = ref(storage, `users/${currentUserId}/courses/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await addDoc(collection(db, 'users', currentUserId, 'courses'), {
                type: 'file',
                title: file.name,
                fileName: file.name,
                url: downloadURL,
                storagePath: snapshot.ref.fullPath,
                size: file.size,
                parentId: currentFolder,
                createdAt: serverTimestamp()
            });

        } catch (error) {
            console.error(error);
            showToast(`Erreur envoi: ${file.name}`, "error");
        }
    }

    showToast("Fichiers envoyés avec succès !", "success");
    ui.fileInput.value = '';
    loadCourses();
}

async function deleteItem(item) {
    if (!confirm(`Supprimer "${item.title || item.name}" ?`)) return;

    try {
        if (item.type === 'file' && item.storagePath) {
            await deleteObject(ref(storage, item.storagePath));
        }
        await deleteDoc(doc(db, 'users', currentUserId, 'courses', item.id));

        loadCourses();
        showToast("Élément supprimé", "success");
    } catch (e) {
        console.error(e);
        showToast("Erreur suppression", "error");
    }
}

function enterFolder(folderId, folderName) {
    currentFolder = folderId;
    loadCourses();
    ui.breadcrumbs.innerHTML += ` <span class="mx-2 text-gray-600">/</span> <span class="text-white">${folderName}</span>`;
}

async function goUpLevel() {
    if (currentFolder === 'root') return;

    try {
        const docRef = doc(db, 'users', currentUserId, 'courses', currentFolder);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentFolder = docSnap.data().parentId || 'root';
        } else {
            currentFolder = 'root';
        }

        ui.breadcrumbs.innerHTML = `<span class="cursor-pointer hover:text-white" onclick="location.reload()">Mes Cours</span>`;
        loadCourses();
    } catch(e) {
        currentFolder = 'root';
        loadCourses();
    }
}

function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initCourses);
}
