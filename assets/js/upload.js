/*
 * Assets/js/upload.js
 * Version Debug : Logs détaillés pour identifier l'erreur
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
    console.log("Upload Page Loaded. Checking Auth...");
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User Authenticated:", user.uid);
            currentUser = user;
            updateHeaderProfile(user);
        } else {
            console.error("User NOT Authenticated. Redirecting...");
            // window.location.href = '/pages/auth/login.html'; // Décommente pour forcer
        }
    });

    fileInput.addEventListener('change', handleFileSelect);
    setupDragAndDrop();
});

function updateHeaderProfile(user) {
    if(headerUsername) headerUsername.textContent = user.displayName || user.email.split('@')[0];
    if(headerAvatar && user.photoURL) headerAvatar.src = user.photoURL;
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        console.log("File selected:", file.name, file.type, file.size);
        
        if (file.type !== 'application/pdf') {
            showMessage("Erreur: Ce n'est pas un PDF (" + file.type + ")", "error");
            fileInput.value = '';
            fileNameContainer.classList.add('hidden');
            return;
        }

        fileNameText.textContent = file.name;
        fileNameContainer.classList.remove('hidden');
        dropZone.classList.add('border-indigo-500/50', 'bg-indigo-500/5');
        messageBox.classList.add('hidden');
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Form submitted. Starting upload process...");

    const file = fileInput.files[0];
    const title = document.getElementById('doc-title').value.trim();

    if (!currentUser) {
        showMessage("Erreur: Vous devez être connecté.", "error");
        return;
    }

    if (!file || !title) {
        showMessage("Titre et fichier requis.", "error");
        return;
    }

    lockForm(true);
    progressContainer.classList.remove('hidden');
    messageBox.classList.add('hidden');

    try {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `uploads/${currentUser.uid}/${Date.now()}_${cleanFileName}`;
        console.log("Target Storage Path:", storagePath);

        const storageRef = ref(storage, storagePath);
        
        // Démarrage Upload
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload Progress: ${progress}%`);
                progressBar.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';
            }, 
            (error) => {
                // ERREUR STORAGE
                console.error("STORAGE ERROR:", error);
                console.error("Code:", error.code);
                console.error("Message:", error.message);
                
                let msg = "Erreur Upload: " + error.code;
                if (error.code === 'storage/unauthorized') {
                    msg = "Non autorisé ! Vérifiez les Règles Storage Firebase.";
                } else if (error.code === 'storage/canceled') {
                    msg = "Upload annulé.";
                } else if (error.code === 'storage/unknown') {
                    msg = "Erreur inconnue (Probablement CORS).";
                }
                
                throw new Error(msg);
            }, 
            async () => {
                // SUCCÈS STORAGE
                console.log("Storage Upload Complete. Getting URL...");
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log("File URL:", downloadURL);

                // SAUVEGARDE FIRESTORE
                console.log("Saving metadata to Firestore...");
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
                    createdAt: serverTimestamp(),
                    likes: 0,
                    downloads: 0
                });

                console.log("Firestore Save Complete!");
                showMessage("Succès ! Fichier publié.", "success");
                resetForm();
                lockForm(false);
            }
        );

    } catch (error) {
        console.error("GLOBAL CATCH ERROR:", error);
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
    if(isLocked) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
    } else {
        submitBtn.textContent = 'Publier le PDF';
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
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if(files.length) {
            fileInput.files = files;
            handleFileSelect({ target: { files: files } });
        }
    });
}