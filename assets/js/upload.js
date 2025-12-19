/*
 * Assets/js/upload.js
 * Version Finale Autonome : Sidebar intégrée + Redirection
 */

import { db, storage, auth } from './config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// DOM Elements
const form = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const fileNameContainer = document.getElementById('file-name');
const fileNameText = document.getElementById('file-name-text');
const messageBox = document.getElementById('message-box');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const submitBtn = document.getElementById('submit-btn');
const dropZone = document.getElementById('drop-zone');
const headerUsername = document.getElementById('header-username');
const headerAvatar = document.getElementById('header-avatar');
const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth & Header
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            if(headerUsername) headerUsername.textContent = user.displayName || user.email.split('@')[0];
            if(headerAvatar && user.photoURL) headerAvatar.src = user.photoURL;
        } else {
            console.warn("Utilisateur non connecté.");
        }
    });

    // 2. Events Fichier
    fileInput.addEventListener('change', handleFileSelect);
    setupDragAndDrop();

    // 3. Gestion Déconnexion (Spécifique à la sidebar intégrée)
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = '/pages/auth/login.html';
            } catch (error) {
                console.error("Erreur déconnexion:", error);
            }
        });
    }
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            showMessage("Format non supporté. PDF uniquement.", "error");
            fileInput.value = '';
            fileNameContainer.classList.add('hidden');
            return;
        }
        fileNameText.textContent = file.name;
        fileNameContainer.classList.remove('hidden');
        dropZone.classList.add('border-indigo-500', 'bg-white/5');
        messageBox.classList.add('hidden');
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const title = document.getElementById('doc-title').value.trim();

    if (!file || !title) {
        showMessage("Titre et fichier sont requis.", "error");
        return;
    }

    if (file.type !== 'application/pdf') {
        showMessage("PDF uniquement.", "error");
        return;
    }

    if (file.size > 10 * 1024 * 1024) { 
        showMessage("Fichier trop volumineux (Max 10MB).", "error");
        return;
    }

    lockForm(true);
    progressContainer.classList.remove('hidden');
    messageBox.classList.add('hidden');

    try {
        // Upload Storage
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `uploads/${currentUser.uid}/${Date.now()}_${cleanFileName}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';
            }, 
            (error) => {
                console.error("Erreur Upload:", error);
                let msg = "Erreur lors de l'upload.";
                if (error.code === 'storage/unauthorized') msg = "Non autorisé (vérifiez Règles Storage).";
                else if (error.code === 'storage/unknown') msg = "Erreur réseau (vérifiez CORS).";
                throw new Error(msg);
            }, 
            async () => {
                // Save Firestore
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    await addDoc(collection(db, "documents"), {
                        title: title,
                        courseId: "general",
                        type: "document",
                        fileUrl: downloadURL,
                        storagePath: storagePath,
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        uploadedBy: currentUser.uid,
                        authorName: currentUser.displayName || "Anonyme",
                        authorPhoto: currentUser.photoURL || null,
                        createdAt: serverTimestamp(),
                        likes: 0,
                        downloads: 0
                    });

                    showMessage("Succès ! Redirection...", "success");
                    
                    // REDIRECTION VERS DASHBOARD
                    setTimeout(() => {
                        window.location.href = '/pages/app/dashboard.html';
                    }, 1000);

                } catch (fsError) {
                    console.error("Erreur Firestore:", fsError);
                    throw new Error("Erreur base de données: " + fsError.message);
                } finally {
                    lockForm(false);
                }
            }
        );

    } catch (error) {
        console.error("Erreur:", error);
        showMessage(error.message, "error");
        lockForm(false);
        progressContainer.classList.add('hidden');
    }
});

function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.className = `p-4 rounded-xl text-sm font-medium border ${type === 'error' ? 'border-red-500/50 text-red-300 bg-red-500/10' : 'border-green-500/50 text-green-300 bg-green-500/10'}`;
    messageBox.classList.remove('hidden');
}

function lockForm(isLocked) {
    submitBtn.disabled = isLocked;
    fileInput.disabled = isLocked;
    document.getElementById('doc-title').disabled = isLocked;
    if(isLocked) {
         submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
         submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
         submitBtn.innerHTML = 'Publier le PDF';
         submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if(files.length) {
            fileInput.files = files;
            handleFileSelect({ target: { files: files } });
        }
    });
}