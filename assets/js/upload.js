import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// ========== DOM Elements ==========
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const submitBtn = document.getElementById('submitBtn');
const messageBox = document.getElementById('message-box');

// ========== Auth State Check ==========
onAuthStateChanged(auth, (user) => {
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        document.getElementById('userName').textContent = displayName;
        
        // Update avatar
        const userAvatar = document.getElementById('userAvatar');
        if (user.photoURL) {
            userAvatar.innerHTML = `<img src="${user.photoURL}" class="w-full h-full rounded-full object-cover" alt="Avatar">`;
        } else {
            userAvatar.textContent = displayName.charAt(0).toUpperCase();
        }
    } else {
        window.location.href = '../auth/login.html';
    }
});

// ========== Logout ==========
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '../auth/login.html';
    } catch (error) {
        console.error("Erreur déconnexion:", error);
        showFeedback("Erreur lors de la déconnexion", "error");
    }
});

// ========== File Selection ==========
fileInput.addEventListener('change', handleFileSelect);

// ========== Drag & Drop ==========
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-indigo-500', 'bg-white/5');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500', 'bg-white/5');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500', 'bg-white/5');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        // Assigner le fichier à l'input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        fileInput.files = dataTransfer.files;
        
        handleFileSelect();
    }
});

// ========== Handle File Selection ==========
function handleFileSelect() {
    const file = fileInput.files[0];
    
    if (!file) {
        fileNameDisplay.classList.add('hidden');
        return;
    }

    // Validation du type
    if (file.type !== 'application/pdf') {
        showFeedback("Seuls les fichiers PDF sont acceptés", "error");
        fileInput.value = '';
        fileNameDisplay.classList.add('hidden');
        return;
    }

    // Validation de la taille (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
        showFeedback("Le fichier ne doit pas dépasser 10 MB", "error");
        fileInput.value = '';
        fileNameDisplay.classList.add('hidden');
        return;
    }

    // Afficher le nom du fichier
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    fileNameDisplay.innerHTML = `
        <i class="fa-solid fa-file-pdf text-red-500 mr-2"></i>
        ${file.name} <span class="text-gray-400">(${fileSize} MB)</span>
    `;
    fileNameDisplay.classList.remove('hidden');
}

// ========== Form Submit ==========
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = fileInput.files[0];
    const title = document.getElementById('docTitle').value.trim();

    // Validations
    if (!file) {
        showFeedback("Veuillez sélectionner un fichier PDF", "error");
        return;
    }

    if (!title) {
        showFeedback("Veuillez entrer un nom pour le document", "error");
        return;
    }

    if (!auth.currentUser) {
        showFeedback("Vous devez être connecté", "error");
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 2000);
        return;
    }

    // Désactiver le bouton et afficher le chargement
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>Upload en cours...`;
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';

    try {
        // 1. Préparer le chemin de stockage
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `users/${auth.currentUser.uid}/${timestamp}_${sanitizedFileName}`;
        
        // 2. Créer la référence et uploader
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // 3. Gérer la progression
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                progressBar.style.width = progress + '%';
                console.log('Upload progress:', progress + '%');
            }, 
            (error) => {
                console.error("Erreur d'upload:", error);
                let errorMessage = "Erreur lors de l'upload du fichier";
                
                // Messages d'erreur plus spécifiques
                if (error.code === 'storage/unauthorized') {
                    errorMessage = "Vous n'avez pas les permissions pour uploader ce fichier";
                } else if (error.code === 'storage/canceled') {
                    errorMessage = "Upload annulé";
                } else if (error.code === 'storage/quota-exceeded') {
                    errorMessage = "Quota de stockage dépassé";
                }
                
                showFeedback(errorMessage, "error");
                resetUI();
            }, 
            async () => {
                try {
                    // 4. Récupérer l'URL de téléchargement
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('File available at', downloadURL);

                    // 5. Sauvegarder les métadonnées dans Firestore
                    await addDoc(collection(db, "files"), {
                        title: title,
                        fileName: file.name,
                        url: downloadURL,
                        storagePath: storagePath,
                        type: file.type,
                        size: file.size,
                        userId: auth.currentUser.uid,
                        userName: auth.currentUser.displayName || auth.currentUser.email,
                        createdAt: serverTimestamp()
                    });

                    // 6. Succès !
                    showFeedback("Document uploadé avec succès ! Redirection...", "success");
                    
                    // Reset le formulaire
                    uploadForm.reset();
                    fileNameDisplay.classList.add('hidden');
                    
                    // Redirection après 2 secondes
                    setTimeout(() => {
                        window.location.href = 'courses.html';
                    }, 2000);

                } catch (firestoreError) {
                    console.error("Erreur Firestore:", firestoreError);
                    showFeedback("Fichier uploadé mais erreur lors de la sauvegarde des métadonnées", "error");
                    resetUI();
                }
            }
        );

    } catch (error) {
        console.error("Erreur globale:", error);
        showFeedback("Une erreur inattendue est survenue: " + error.message, "error");
        resetUI();
    }
});

// ========== Reset UI ==========
function resetUI() {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Envoyer le document</span><i class="fa-solid fa-paper-plane text-sm"></i>`;
    
    setTimeout(() => {
        progressBar.style.width = '0%';
        progressContainer.classList.add('hidden');
    }, 1000);
}

// ========== Show Feedback Message ==========
function showFeedback(message, type) {
    const isSuccess = type === 'success';
    
    messageBox.className = `mb-6 p-4 rounded-xl border text-center transition-all ${
        isSuccess 
        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`;
    
    messageBox.innerHTML = `
        <i class="fa-solid ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
        ${message}
    `;
    
    messageBox.classList.remove('hidden');
    
    // Auto-hide après 5 secondes si erreur
    if (!isSuccess) {
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }
}