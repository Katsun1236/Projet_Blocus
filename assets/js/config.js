
// firebase-config.js
// Version optimisée pour Projet Blocus
// Stack : Auth, Firestore, Storage, Functions

// 1. Importations CORRIGÉES
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// Suppression de enableIndexedDbPersistence car nous utilisons la nouvelle syntaxe
import { getFirestore, initializeFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js"; 

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDmC7x4_bwR3epzhzYkC9xdpkEHO6_E2kY", 
  authDomain: "projet-blocus-v2.firebaseapp.com",
  projectId: "projet-blocus-v2",
  storageBucket: "projet-blocus-v2.firebasestorage.app",
  messagingSenderId: "12006785680",
  appId: "1:12006785680:web:d1b649979fe0a76b628e15"
};

// 1. Initialisation de l'App
const app = initializeApp(firebaseConfig);

// 2. Initialisation des Services
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west1'); 

// 3. Initialisation de Firestore avec Persistance (Nouvelle Syntaxe)
// On utilise initializeFirestore à la place de getFirestore suivi de enableIndexedDbPersistence
let db;
try {
    db = initializeFirestore(app, {
        // Nouvelle syntaxe pour la persistance locale (remplace enableIndexedDbPersistence)
        cache: {
            // Configuration de la persistance via IndexedDB
            persistence: 'indexedDB' 
        }
    });
} catch (err) {
    // Si la persistance est déjà initialisée (multi-onglet) ou non supportée, on retombe sur getFirestore par sécurité
    db = getFirestore(app);
    console.warn("Erreur lors de l'initialisation de la persistance. Utilisation du cache mémoire. Détails:", err.code);
}


// 4. Exports
// Remarque: L'export de 'db' doit se faire après son initialisation.
export { app, auth, db, storage, functions };