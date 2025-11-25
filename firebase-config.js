// firebase-config.js

// 1. Importations CORRIGÉES (Version 11.0.1 au lieu de 12.0.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// 2. Objet de configuration Firebase
// ⚠️ REMETS TES CLÉS ICI (copie-les depuis la console Firebase)
const firebaseConfig = {
    apiKey: "AIzaSy...",          // <--- Ta clé API
    authDomain: "...",            // <--- Ton authDomain
    projectId: "...",             // <--- Ton projectId
    storageBucket: "...",         // <--- Ton storageBucket
    messagingSenderId: "...",     
    appId: "...",                 
    measurementId: "..."          
};

// 3. Initialisation des services Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 4. Exportation des services
export { app, auth, db, storage };