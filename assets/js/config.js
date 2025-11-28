// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";

// Ta configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmC7x4_bwR3epzhzYkC9xdpkEHO6_E2kY",
  authDomain: "projet-blocus-v2.firebaseapp.com",
  projectId: "projet-blocus-v2",
  storageBucket: "projet-blocus-v2.firebasestorage.app",
  messagingSenderId: "12006785680",
  appId: "1:12006785680:web:d1b649979fe0a76b628e15"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west1');

// Exports essentiels
export { app, auth, db, storage, functions };

// ATTENTION : Cette clé est exposée côté client. 
// Pour une sécurité optimale, les appels à l'IA devraient passer par un backend (Firebase Functions).
export const GEMINI_API_KEY = "AIzaSyAaeATbGjXfsYLxprAJWwxIBgS3-JO8ITQ"; 