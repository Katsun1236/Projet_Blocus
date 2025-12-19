import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// --- DOM Elements ---
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const submitBtn = document.getElementById('submitBtn');
const messageBox = document.getElementById('message-box');

// --- Auth State & UI Init ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
        // Avatar setup si dispo
        if(user.photoURL) {
            document.getElementById('userAvatar').innerHTML = `<img src="${user.photoURL}" class="w-full h-full rounded-full object-cover">`;
        }
    } else {
        window.location.href = '../auth/login.html';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '../auth/login.html';
    } catch (error) {
        console.error("Erreur déconnexion:", error);
    }
});

// --- File Selection Handling ---
fileInput.addEventListener('change', handleFileSelect);

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-indigo-500', 'bg-white/5');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-indigo-500', 'bg-white/5');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500', 'bg-white/5');
    
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});

function handleFileSelect() {
    const file = fileInput.files[0];
    if (file) {
        fileNameDisplay.textContent = `Fichier sélectionné : ${file.name}`;
        fileNameDisplay.classList.remove('hidden');
        fileNameDisplay.classList.add('text-indigo-400');
    }
}

// --- Upload Logic ---
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = fileInput.files[0];
    const title = document.getElementById('docTitle').value;
    const course = document.getElementById('docCourse').value;

    if (!file) {
        showFeedback("Veuillez sélectionner un fichier.", "error");
        return;
    }

    if (!auth.currentUser) {
        showFeedback("Vous devez être connecté.", "error");
        return;
    }

    // UI Updates
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Envoi en cours...`;
    progressContainer.classList.remove('hidden');

    try {
        // 1. Upload vers Firebase Storage
        // Chemin: users/{uid}/{timestamp_filename}
        const storagePath = `users/${auth.currentUser.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = progress + '%';
            }, 
            (error) => {
                console.error("Upload Error:", error);
                showFeedback("Erreur lors de l'upload du fichier.", "error");
                resetUI();
            }, 
            async () => {
                // 2. Upload terminé -> Récupération URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // 3. Sauvegarde métadonnées dans Firestore
                await addDoc(collection(db, "files"), {
                    title: title,
                    course: course,
                    url: downloadURL,
                    storagePath: storagePath,
                    type: file.type,
                    userId: auth.currentUser.uid,
                    userName: auth.currentUser.displayName || "Anonyme",
                    createdAt: serverTimestamp()
                });

                showFeedback("Document ajouté avec succès !", "success");
                uploadForm.reset();
                fileNameDisplay.classList.add('hidden');
                setTimeout(() => {
                    progressBar.style.width = '0%';
                    progressContainer.classList.add('hidden');
                }, 2000);
                resetUI();
            }
        );

    } catch (error) {
        console.error("Global Error:", error);
        showFeedback("Une erreur inattendue est survenue: " + error.message, "error");
        resetUI();
    }
});

function resetUI() {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Envoyer le document</span><i class="fa-solid fa-paper-plane text-sm"></i>`;
}

function showFeedback(message, type) {
    messageBox.textContent = message;
    messageBox.className = `mb-6 p-4 rounded-xl border text-center ${
        type === 'success' 
        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`;
    messageBox.classList.remove('hidden');
}