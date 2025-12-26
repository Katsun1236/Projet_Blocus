import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getGoogleProvider } from './firebase/firebaseAuth.js';
import { getFirebaseFirestore } from './firebase/firebaseFirestore.js';
import { firestoreCollections } from '../config/firebase.config.js';

export class AuthService {
  constructor() {
    this.auth = getFirebaseAuth();
    this.db = getFirebaseFirestore();
    this.googleProvider = getGoogleProvider();
  }

  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async registerWithEmail(email, password, userData = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;

      if (userData.firstName || userData.lastName) {
        await updateProfile(user, {
          displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        });
      }

      await this.createUserDocument(user.uid, {
        email: user.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${userData.firstName || 'User'}&background=6366f1&color=fff`,
        createdAt: new Date(),
        level: 1,
        xp: 0,
        badges: [],
      });

      await sendEmailVerification(user);

      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(this.db, firestoreCollections.USERS, user.uid));

      if (!userDoc.exists()) {
        const nameParts = user.displayName?.split(' ') || ['', ''];
        await this.createUserDocument(user.uid, {
          email: user.email,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' '),
          photoURL: user.photoURL,
          createdAt: new Date(),
          level: 1,
          xp: 0,
          badges: [],
        });
      }

      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signOut() {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async createUserDocument(userId, data) {
    const userRef = doc(this.db, firestoreCollections.USERS, userId);
    await setDoc(userRef, data);
  }

  async getUserData(userId) {
    const userRef = doc(this.db, firestoreCollections.USERS, userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() : null;
  }

  async updateUserData(userId, data) {
    const userRef = doc(this.db, firestoreCollections.USERS, userId);
    await updateDoc(userRef, data);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
      'auth/invalid-email': 'Adresse email invalide.',
      'auth/operation-not-allowed': 'Opération non autorisée.',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/user-disabled': 'Ce compte a été désactivé.',
      'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
      'auth/popup-closed-by-user': 'La fenêtre de connexion a été fermée.',
    };

    const message = errorMessages[error.code] || error.message || 'Une erreur est survenue.';

    return new Error(message);
  }
}

export const authService = new AuthService();
