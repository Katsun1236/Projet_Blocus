import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, updateDoc, serverTimestamp, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

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
    box.textContent = message;
    box.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-xl z-50 ${isError ? 'bg-red-600' : 'bg-green-600'} text-white`;
    setTimeout(() => { box.className += ' hidden'; }, 3000);
}

// --- Render Functions ---
function render() {
    if (!currentUserId) return;
    renderHeader();
    renderBreadcrumbs();
    renderFolders();
    renderCourses();
    ui.loadingIndicator.classList.add('hidden');
}

async function renderHeader() {
    const userRef = doc(db, 'users', currentUserId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        const profileData = docSnap.data();
        document.getElementById('user-name-header').textContent = profileData.firstName;
        document.getElementById('user-avatar-header').src = profileData.photoURL;
        ui.navLoggedIn.classList.remove('hidden');
    }
}

function renderBreadcrumbs() { /* ... */ }
function renderFolders() { /* ... */ }
function renderCourses() { /* ... */ }

// --- Element Creation ---
function createFolderElement(folder) { /* ... */ }
function createCourseElement(course) { /* ... */ }

// --- Actions & Modals ---
function showContextMenu(e, type) { /* ... */ }
function hideContextMenu() { /* ... */ }

function openRenameModal() { /* ... */ }
function openDeleteModal() { /* ... */ }
function openMoveModal() { /* ... */ }
function openNewFolderModal() { /* ... */ }

async function handleRename(newName) { /* ... */ }
async function handleDelete() { /* ... */ }
async function handleMove(targetFolderId) { /* ... */ }
async function handleNewFolder(folderName) { /* ... */ }

// --- Event Listeners ---
function setupEventListeners() {
    // Header menu
    ui.userMenuButton.addEventListener('click', (e) => { /* ... */ });
    window.addEventListener('click', (e) => { /* ... */ });
    ui.logoutButton.addEventListener('click', async () => { /* ... */ });

    // Breadcrumbs
    ui.breadcrumbs.addEventListener('click', (e) => { /* ... */ });

    // New Folder
    ui.newFolderBtn.addEventListener('click', openNewFolderModal);

    // Context Menu activation
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

    // Context Menu actions
    ui.contextMenu.addEventListener('click', (e) => {
        const action = e.target.closest('button')?.dataset.action;
        if (action === 'rename') openRenameModal();
        if (action === 'delete') openDeleteModal();
        if (action === 'move') openMoveModal();
        hideContextMenu();
    });
}

// --- Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        currentUserId = user.uid;
        setupEventListeners();
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