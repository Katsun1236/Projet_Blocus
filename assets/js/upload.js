/*
 * Assets/js/upload.js
 * Version Finale : Upload PDF + Métadonnées + Redirection Dashboard
 */

import { db, storage, auth } from './config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

let currentUser = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check & Header update
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            updateHeaderProfile(user);
        } else {
            console.warn("Utilisateur non connecté.");
            // Redirection optionnelle si tu veux forcer le login
            // window.location.href = '/pages/auth/login.html';
        }
    });

    // File Input Change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag & Drop
    setupDragAndDrop();
});

// Mise à jour visuelle du header
function updateHeaderProfile(user) {
    if(headerUsername) headerUsername.textContent = user.displayName || user.email.split('@')[0];
    if(headerAvatar && user.photoURL) headerAvatar.src = user.photoURL;
}

// Gestionnaire sélection fichier
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        // Validation Type PDF
        if (file.type !== 'application/pdf') {
            showMessage("Format non supporté. Seuls les fichiers PDF sont acceptés.", "error");
            fileInput.value = ''; // Reset input
            fileNameContainer.classList.add('hidden');
            return;
        }

        fileNameText.textContent = file.name;
        fileNameContainer.classList.remove('hidden');
        dropZone.classList.add('border-indigo-500/50', 'bg-indigo-500/5');
        messageBox.classList.add('hidden'); // Cacher les anciennes erreurs
    } else {
        fileNameContainer.classList.add('hidden');
        dropZone.classList.remove('border-indigo-500/50', 'bg-indigo-500/5');
    }
}

// Soumission Formulaire
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const title = document.getElementById('doc-title').value.trim();

    // Validation
    if (!file || !title) {
        showMessage("Titre et fichier sont requis.", "error");
        return;
    }

    if (file.type !== 'application/pdf') {
        showMessage("Seuls les fichiers PDF sont acceptés.", "error");
        return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
        showMessage("Fichier trop volumineux (Max 10MB).", "error");
        return;
    }

    // UI Loading
    lockForm(true);
    progressContainer.classList.remove('hidden');
    messageBox.classList.add('hidden');

    try {
        // 1. Upload Storage
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
                if (error.code === 'storage/unauthorized') msg = "Non autorisé (vérifiez les règles Firebase).";
                else if (error.code === 'storage/unknown') msg = "Erreur inconnue (vérifiez CORS).";
                
                throw new Error(msg);
            }, 
            async () => {
                // 2. Save Firestore
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    await addDoc(collection(db, "documents"), {
                        title: title,
                        courseId: "general", // Défaut
                        type: "document",    // Défaut
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

                    showMessage("Document partagé avec succès ! Redirection...", "success");
                    
                    // --- REDIRECTION ICI ---
                    setTimeout(() => {
                        window.location.href = '/pages/app/dashboard.html'; // Change le chemin si nécessaire
                    }, 1000); // 1 seconde de délai pour lire "Succès"

                } catch (fsError) {
                    console.error("Erreur Firestore:", fsError);
                    // On ne bloque pas si Firestore échoue mais que le fichier est uploadé, 
                    // mais c'est mieux d'afficher l'erreur.
                    throw new Error("Erreur lors de l'enregistrement en base de données : " + fsError.message);
                } finally {
                    lockForm(false);
                }
            }
        );

    } catch (error) {
        console.error("Erreur:", error);
        showMessage(error.message || "Une erreur est survenue.", "error");
        lockForm(false);
        progressContainer.classList.add('hidden');
    }
});

// Utilitaires
function showMessage(msg, type) {
    messageBox.innerHTML = type === 'error' 
        ? `<i class="fas fa-exclamation-circle text-red-400"></i> <span class="text-red-300">${msg}</span>`
        : `<i class="fas fa-check-circle text-green-400"></i> <span class="text-green-300">${msg}</span>`;
    
    messageBox.className = `p-4 rounded-xl text-sm font-medium border flex items-center gap-3 ${type === 'error' ? 'border-red-500/30 bg-red-500/10' : 'border-green-500/30 bg-green-500/10'}`;
    messageBox.classList.remove('hidden');

    if(type === 'success') {
        // Pas de cache automatique si redirection
    } else {
        // Cache les erreurs après 5s
        setTimeout(() => messageBox.classList.add('hidden'), 5000);
    }
}

function lockForm(isLocked) {
    submitBtn.disabled = isLocked;
    fileInput.disabled = isLocked;
    document.getElementById('doc-title').disabled = isLocked;
    submitBtn.classList.toggle('opacity-50', isLocked);
    submitBtn.classList.toggle('cursor-not-allowed', isLocked);
    if(isLocked) {
         submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin animate-spin"></i> Traitement...';
    } else {
         submitBtn.innerHTML = '<span>Publier le PDF</span><i class="fas fa-arrow-right text-sm"></i>';
    }
}

function resetForm() {
    form.reset();
    fileNameContainer.classList.add('hidden');
    dropZone.classList.remove('border-indigo-500/50', 'bg-indigo-500/5');
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
    }, 2000);
}

function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    ['dragenter', 'dragover'].forEach(evt => dropZone.classList.add('border-indigo-500', 'bg-white/5'));
    ['dragleave', 'drop'].forEach(evt => dropZone.classList.remove('border-indigo-500', 'bg-white/5'));
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if(files.length) {
            fileInput.files = files;
            handleFileSelect({ target: { files: files } });
        }
    });
}