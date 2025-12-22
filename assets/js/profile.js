import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// --- STATE ---
let currentUserId = null;
let currentUserData = null;

// Storage Init
const storage = getStorage();

// --- DOM ELEMENTS ---
const ui = {
    // Header Info
    avatar: document.getElementById('profile-avatar'),
    name: document.getElementById('profile-name'),
    email: document.getElementById('profile-email'),
    points: document.getElementById('profile-points'),
    bio: document.getElementById('profile-bio'),
    // Stats
    statFiles: document.getElementById('stat-files'),
    statQuiz: document.getElementById('stat-quiz'),
    statGroups: document.getElementById('stat-groups'),
    // Activity
    activityList: document.getElementById('activity-list'),
    // Actions / Forms
    btnEdit: document.getElementById('btn-edit-profile'),
    btnChangeAvatar: document.getElementById('btn-change-avatar'),
    avatarUpload: document.getElementById('avatar-upload'),
    btnLogout: document.getElementById('btn-logout'),
    // Views
    viewMode: document.getElementById('view-mode-content'),
    editMode: document.getElementById('edit-mode-content'),
    // Edit Form
    editFirstname: document.getElementById('edit-firstname'),
    editLastname: document.getElementById('edit-lastname'),
    editBio: document.getElementById('edit-bio'),
    btnSave: document.getElementById('btn-save-profile'),
    btnCancel: document.getElementById('btn-cancel-edit')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initLayout(''); // Pas d'onglet actif spécifique ou 'profile' si tu ajoutes l'ID dans layout.js

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            await loadProfileData();
            loadUserStats();
            loadRecentActivity();
        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
});

// --- LOAD DATA ---

async function loadProfileData() {
    try {
        const docRef = doc(db, 'users', currentUserId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentUserData = docSnap.data();
            renderProfile(currentUserData);
        } else {
            console.error("Aucun document user trouvé !");
        }
    } catch (e) {
        console.error("Erreur chargement profil:", e);
        showMessage("Erreur de chargement du profil", "error");
    }
}

function renderProfile(data) {
    // Avatar (Fallback UI Avatars)
    const avatarUrl = data.photoURL || `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=random&color=fff`;
    ui.avatar.src = avatarUrl;

    // Infos textuelles
    ui.name.textContent = `${data.firstName || ''} ${data.lastName || ''}`;
    ui.email.textContent = auth.currentUser.email;
    ui.points.textContent = data.points || 0;
    
    // Bio
    if (data.bio && data.bio.trim() !== "") {
        ui.bio.textContent = data.bio;
        ui.bio.classList.remove('italic');
    } else {
        ui.bio.textContent = "Aucune biographie renseignée. Cliquez sur Modifier pour vous présenter !";
        ui.bio.classList.add('italic');
    }

    // Pré-remplir le formulaire d'édition
    ui.editFirstname.value = data.firstName || "";
    ui.editLastname.value = data.lastName || "";
    ui.editBio.value = data.bio || "";
}

async function loadUserStats() {
    // Note: Firestore n'a pas de "count()" natif bon marché sur des collections énormes sans agrégation.
    // Ici on fait des requêtes simples car on suppose que l'user n'a pas 10k items.
    
    try {
        // 1. Files
        const qFiles = query(collection(db, 'files'), where('userId', '==', currentUserId));
        const snapFiles = await getDocs(qFiles);
        ui.statFiles.textContent = snapFiles.size;

        // 2. Quiz (Résultats)
        const qQuiz = query(collection(db, 'quiz_results'), where('userId', '==', currentUserId));
        const snapQuiz = await getDocs(qQuiz);
        ui.statQuiz.textContent = snapQuiz.size;

        // 3. Groups (Membres contains user)
        // Firestore ne permet pas facilement de compter "où je suis membre" si members est un array, 
        // sans lire tous les groupes. 
        // Optimisation : On regarde si l'user a un array 'groupsJoined' dans son profil (optionnel)
        // Sinon on fait une query simple (attention performance si bcp de groupes)
        const qGroups = query(collection(db, 'groups'), where('members', 'array-contains', currentUserId));
        const snapGroups = await getDocs(qGroups);
        ui.statGroups.textContent = snapGroups.size;

    } catch (e) {
        console.error("Erreur stats:", e);
    }
}

async function loadRecentActivity() {
    // Pour l'instant, on simule ou on récupère les derniers posts de l'user
    ui.activityList.innerHTML = '';
    
    try {
        const q = query(collection(db, 'community_posts'), where('authorId', '==', currentUserId), orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            ui.activityList.innerHTML = `<div class="text-center py-6 text-gray-500 text-xs italic pl-6">Aucune activité récente.</div>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = "relative pl-6 pb-2";
            div.innerHTML = `
                <div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-indigo-500"></div>
                <div class="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors cursor-pointer">
                    <p class="text-sm text-gray-200 font-medium truncate">${data.title}</p>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">${data.type === 'question' ? 'Question' : 'Post'}</span>
                        <span class="text-[10px] text-gray-500">${data.createdAt ? formatDate(data.createdAt.toDate()) : ''}</span>
                    </div>
                </div>
            `;
            ui.activityList.appendChild(div);
        });

    } catch (e) {
        // Souvent une erreur d'index manquant au début pour les queries composées
        console.warn("Activité non chargée (Index manquant ?)", e);
        ui.activityList.innerHTML = `<div class="text-center py-6 text-gray-500 text-xs pl-6">Activité indisponible.</div>`;
    }
}

// --- ACTIONS ---

async function saveProfile() {
    const firstName = ui.editFirstname.value.trim();
    const lastName = ui.editLastname.value.trim();
    const bio = ui.editBio.value.trim();

    if (!firstName || !lastName) {
        return showMessage("Nom et prénom requis.", "error");
    }

    ui.btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    ui.btnSave.disabled = true;

    try {
        const userRef = doc(db, 'users', currentUserId);
        await updateDoc(userRef, {
            firstName: firstName,
            lastName: lastName,
            bio: bio
        });

        showMessage("Profil mis à jour !", "success");
        
        // Update local state
        currentUserData.firstName = firstName;
        currentUserData.lastName = lastName;
        currentUserData.bio = bio;
        renderProfile(currentUserData);
        
        toggleEditMode(false);

    } catch (e) {
        console.error(e);
        showMessage("Erreur lors de la sauvegarde.", "error");
    } finally {
        ui.btnSave.innerHTML = `<i class="fas fa-save"></i> Enregistrer`;
        ui.btnSave.disabled = false;
    }
}

async function uploadAvatar(file) {
    showMessage("Upload de l'avatar...", "info");
    
    try {
        // 1. Upload to Storage
        // Path: users/{userId}/avatar_{timestamp}
        const storageRef = ref(storage, `users/${currentUserId}/avatar_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 2. Update Firestore User Document
        const userRef = doc(db, 'users', currentUserId);
        await updateDoc(userRef, {
            photoURL: downloadURL
        });

        // 3. Update UI
        ui.avatar.src = downloadURL;
        showMessage("Avatar mis à jour !", "success");

    } catch (e) {
        console.error("Avatar Upload Error:", e);
        if (e.code === 'storage/unauthorized') {
            showMessage("Permission refusée (Storage Rules).", "error");
        } else {
            showMessage("Erreur lors de l'upload.", "error");
        }
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = '../auth/login.html';
    } catch (e) {
        console.error(e);
        showMessage("Erreur déconnexion", "error");
    }
}

// --- UI HELPERS ---

function toggleEditMode(show) {
    if (show) {
        ui.viewMode.classList.add('hidden');
        ui.editMode.classList.remove('hidden');
        ui.btnEdit.classList.add('hidden');
    } else {
        ui.viewMode.classList.remove('hidden');
        ui.editMode.classList.add('hidden');
        ui.btnEdit.classList.remove('hidden');
    }
}

function setupEventListeners() {
    // Edit Toggle
    ui.btnEdit.addEventListener('click', () => toggleEditMode(true));
    ui.btnCancel.addEventListener('click', () => toggleEditMode(false));
    
    // Save Form
    ui.btnSave.addEventListener('click', saveProfile);

    // Logout
    ui.btnLogout.addEventListener('click', handleLogout);

    // Avatar Upload
    ui.btnChangeAvatar.addEventListener('click', () => ui.avatarUpload.click());
    ui.avatarUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadAvatar(e.target.files[0]);
        }
    });
}