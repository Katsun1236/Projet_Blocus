/*
 * Assets/js/upload.js
 * Gestion de l'upload de fichiers vers Firebase Storage et 
 * création des métadonnées dans Firestore (Version Modulaire v11)
 */

import { db, storage, auth } from './config.js';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Sélection des éléments du DOM
const form = document.getElementById('upload-form');
const courseSelect = document.getElementById('course-select');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const messageBox = document.getElementById('message-box');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const submitBtn = document.getElementById('submit-btn');
const dropZone = document.getElementById('drop-zone');

let currentUser = null;

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Observer l'état de l'authentification
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadCourses(); // Charger les cours uniquement si connecté
        } else {
            // Redirection gérée par auth-guard.js, mais sécurité supplémentaire ici
            console.warn("Utilisateur non connecté sur la page upload.");
        }
    });

    // 2. Gestion de l'affichage du nom de fichier sélectionné
    fileInput.addEventListener('change', handleFileSelect);

    // 3. Gestion du Drag & Drop visuel
    setupDragAndDrop();
});

/**
 * Charge la liste des cours depuis Firestore pour le select
 */
async function loadCourses() {
    try {
        // On récupère les cours, idéalement triés par nom ou code
        const coursesRef = collection(db, "courses");
        const q = query(coursesRef, orderBy("code")); // Assure-toi que le champ 'code' existe, sinon enlève orderBy
        const querySnapshot = await getDocs(q); // Utilise querySnapshot direct si orderBy pose souci sans index

        // Reset du select
        courseSelect.innerHTML = '<option value="" disabled selected>Choisir un cours...</option>';
        
        if (querySnapshot.empty) {
            const option = document.createElement('option');
            option.text = "Aucun cours disponible";
            option.disabled = true;
            courseSelect.appendChild(option);
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            // Fallback si 'code' ou 'name' n'existent pas
            const code = data.code || "N/A";
            const name = data.name || "Cours sans nom";
            option.textContent = `${code} - ${name}`;
            courseSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Erreur lors du chargement des cours:", error);
        // Fallback en cas d'erreur (ex: permissions ou index manquant)
        try {
             // Tentative sans tri si le premier a échoué (souvent dû aux index Firestore)
            const fallbackSnapshot = await getDocs(collection(db, "courses"));
            courseSelect.innerHTML = '<option value="" disabled selected>Choisir un cours...</option>';
            fallbackSnapshot.forEach((doc) => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = data.name || "Cours";
                courseSelect.appendChild(option);
            });
        } catch (e) {
            showMessage("Impossible de charger la liste des cours. Vérifie ta connexion.", "error");
        }
    }
}

/**
 * Gestionnaire de sélection de fichier (Input & Drop)
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.textContent = `Fichier prêt : ${file.name} (${formatBytes(file.size)})`;
        fileNameDisplay.classList.remove('hidden');
        dropZone.classList.add('border-indigo-500', 'bg-indigo-500/10'); // Feedback visuel actif
    } else {
        fileNameDisplay.classList.add('hidden');
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/10');
    }
}

/**
 * Soumission du formulaire et Upload
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const courseId = courseSelect.value;
    const title = document.getElementById('doc-title').value.trim();
    const type = document.getElementById('doc-type').value;

    // Validation basique
    if (!file || !courseId || !title) {
        showMessage("Merci de remplir tous les champs obligatoires.", "error");
        return;
    }

    // Validation taille (Max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
        showMessage("Le fichier est trop volumineux. La limite est de 10MB.", "error");
        return;
    }

    // Préparation UI
    lockForm(true);
    progressContainer.classList.remove('hidden');
    messageBox.classList.add('hidden');

    try {
        // --- ÉTAPE A : Upload du fichier vers Firebase Storage ---
        
        // Création d'un nom de fichier unique : timestamp_nom-nettoyé
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `uploads/${currentUser.uid}/${Date.now()}_${cleanFileName}`;
        
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Écoute de l'événement 'state_changed' pour la barre de progression
        uploadTask.on('state_changed', 
            (snapshot) => {
                // Calcul du pourcentage
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                
                // Mise à jour UI
                progressBar.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';
            }, 
            (error) => {
                // Gestion des erreurs d'upload (ex: quota, règles de sécurité, cors)
                console.error("Erreur Upload Storage:", error);
                
                let errorMsg = "Erreur lors du transfert.";
                if (error.code === 'storage/unauthorized') errorMsg = "Permission refusée. Vérifiez que vous êtes connecté.";
                if (error.code === 'storage/canceled') errorMsg = "Upload annulé.";
                if (error.code === 'storage/unknown') errorMsg = "Erreur inconnue. Vérifiez votre configuration CORS.";
                
                throw new Error(errorMsg);
            }, 
            async () => {
                // --- ÉTAPE B : Upload terminé, récupération de l'URL et sauvegarde Firestore ---
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Création du document dans Firestore
                    await addDoc(collection(db, "documents"), {
                        title: title,
                        type: type, // synthese, notes, etc.
                        courseId: courseId,
                        fileUrl: downloadURL,
                        storagePath: storagePath, // Utile pour supprimer le fichier plus tard
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        uploadedBy: currentUser.uid,
                        authorName: currentUser.displayName || currentUser.email.split('@')[0] || "Membre",
                        authorPhoto: currentUser.photoURL || null,
                        createdAt: serverTimestamp(),
                        likes: 0,
                        downloads: 0,
                        status: "published" // Pour modération future si besoin
                    });

                    // Succès total
                    showMessage("Document publié avec succès ! Merci pour ta contribution.", "success");
                    resetForm();

                } catch (firestoreError) {
                    console.error("Erreur Firestore:", firestoreError);
                    showMessage("Fichier uploadé, mais erreur lors de l'enregistrement des données. Contactez le support.", "error");
                } finally {
                    lockForm(false);
                }
            }
        );

    } catch (error) {
        console.error("Erreur Globale:", error);
        showMessage(error.message || "Une erreur inattendue est survenue.", "error");
        lockForm(false);
        progressContainer.classList.add('hidden');
    }
});

/**
 * Utilitaires UI
 */

function showMessage(msg, type) {
    messageBox.textContent = msg;
    // Reset classes
    messageBox.className = "p-4 rounded-xl mb-4 text-sm font-medium content-glass border flex items-center gap-2";
    
    if (type === 'error') {
        messageBox.classList.add('border-red-500/50', 'text-red-300', 'bg-red-500/10');
        messageBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    } else {
        messageBox.classList.add('border-green-500/50', 'text-green-300', 'bg-green-500/10');
        messageBox.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    }
    
    messageBox.classList.remove('hidden');
    // Auto-hide après 5s si c'est un succès
    if(type === 'success') {
        setTimeout(() => messageBox.classList.add('hidden'), 5000);
    }
}

function lockForm(isLocked) {
    submitBtn.disabled = isLocked;
    fileInput.disabled = isLocked;
    courseSelect.disabled = isLocked;
    document.getElementById('doc-title').disabled = isLocked;
    
    if(isLocked) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin animate-spin"></i> Traitement...';
        submitBtn.classList.add('opacity-75');
    } else {
        submitBtn.innerHTML = '<span>Publier le document</span><i class="fas fa-paper-plane"></i>';
        submitBtn.classList.remove('opacity-75');
    }
}

function resetForm() {
    form.reset();
    fileNameDisplay.classList.add('hidden');
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/10');
    
    // Reset progress bar après délai
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    }, 2000);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('border-indigo-500', 'bg-white/10');
    }

    function unhighlight(e) {
        dropZone.classList.remove('border-indigo-500', 'bg-white/10');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files; // Assigne le fichier au input caché
        handleFileSelect({ target: { files: files } }); // Déclenche la logique visuelle
    }
}