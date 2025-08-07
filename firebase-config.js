// firebase-config.js

// Ce fichier centralise l'initialisation de Firebase pour tout le projet.

// 1. Importations des modules Firebase nécessaires
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// 2. Objet de configuration Firebase
// IMPORTANT : Ces informations sont sensibles. Dans un projet en production,
// il ne faudrait jamais les laisser visibles dans le code côté client.
// Pour notre projet, c'est acceptable, mais garde cette bonne pratique en tête.
const firebaseConfig = {
    apiKey: "AIzaSyDz8qDCTZIkrIVBTw58nSgEG_xXCG_mXxw",
    authDomain: "projetblocus1.firebaseapp.com",
    projectId: "projetblocus1",
    storageBucket: "projetblocus1.appspot.com",
    messagingSenderId: "536093956243",
    appId: "1:536093956243:web:4fa7310f49cbf8db1f5566",
    measurementId: "G-W5WZXDHNTC"
};

// 3. Initialisation des services Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 4. Exportation des services pour les rendre disponibles dans les autres fichiers
// N'importe quel autre script pourra maintenant faire 'import { auth, db } from "./firebase-config.js"'
export { app, auth, db, storage };
