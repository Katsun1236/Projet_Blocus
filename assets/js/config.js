// firebase-config.js
// Version optimisée pour Projet Blocus
// Stack : Auth, Firestore, Storage, Functions

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";

// Configuration Firebase
// ⚠️ Note : Pour la prod, assure-toi que ces clés sont sécurisées via les règles Firestore/Storage
const firebaseConfig = {
  apiKey: "AIzaSyDmC7x4_bwR3epzhzYkC9xdpkEHO6_E2kY", // Ta clé actuelle
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
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west1'); // On force une région proche (ex: Belgique/Paris) pour la latence

// 3. Persistance Offline (Optionnel mais recommandé pour l'UX étudiante)
// Permet à l'app de charger le cache si le wifi de l'unif saute
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.warn('Persistance Firestore désactivée (multi-onglets).');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Persistance non supportée par ce navigateur.');
    }
});

// 4. Exports
export { app, auth, db, storage, functions };