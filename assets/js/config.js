import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
// Ajout de l'import Functions
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyDmC7x4_bwR3epzhzYkC9xdpkEHO6_E2kY",
  authDomain: "projet-blocus-v2.firebaseapp.com",
  projectId: "projet-blocus-v2",
  storageBucket: "projet-blocus-v2.firebasestorage.app",
  messagingSenderId: "12006785680",
  appId: "1:12006785680:web:d1b649979fe0a76b628e15"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// Initialisation des Cloud Functions (region par défaut us-central1)
const functions = getFunctions(app); 

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export { auth, db, storage, functions, googleProvider };
