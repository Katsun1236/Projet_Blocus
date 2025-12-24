# 🔥 CONFIGURATION FIREBASE COMPLÈTE - Projet Blocus

**Date :** 24 décembre 2024
**Objectif :** Configuration complète de Firebase pour toutes les fonctionnalités

---

## 📋 TABLE DES MATIÈRES

1. [Collections Firestore](#collections-firestore)
2. [Règles de sécurité Firestore](#règles-de-sécurité-firestore)
3. [Storage Firebase](#storage-firebase)
4. [Règles de sécurité Storage](#règles-de-sécurité-storage)
5. [Indices Firestore](#indices-firestore)
6. [Firebase Functions](#firebase-functions)

---

## 1️⃣ COLLECTIONS FIRESTORE

### 🔹 Collection `/users/{userId}`

**Document principal utilisateur**

```javascript
{
  userId: string,           // UID Firebase Auth
  email: string,            // Email de l'utilisateur
  firstName: string,        // Prénom
  lastName: string,         // Nom
  displayName: string,      // Nom complet
  photoURL: string,         // URL photo de profil
  createdAt: timestamp,     // Date de création du compte
  lastLogin: timestamp,     // Dernière connexion
  onboarded: boolean,       // A terminé l'onboarding
  preferences: {            // Préférences utilisateur
    theme: string,
    notifications: boolean,
    language: string
  }
}
```

**Utilisé par :** Toutes les pages (auth, profile, dashboard)

---

### 🔹 Sous-collection `/users/{userId}/courses/{courseId}`

**Fichiers/cours uploadés**

```javascript
{
  courseId: string,         // ID unique du cours
  title: string,            // Titre du cours
  fileName: string,         // Nom du fichier original
  fileURL: string,          // URL Storage Firebase
  fileType: string,         // Type MIME (application/pdf, image/png, etc.)
  size: number,             // Taille en bytes
  folderId: string,         // ID du dossier parent (optionnel)
  createdAt: timestamp,     // Date d'ajout
  updatedAt: timestamp,     // Dernière modification
  tags: array,              // Tags pour recherche
  processed: boolean,       // Traité par l'IA
  metadata: {               // Métadonnées extraites
    pageCount: number,
    hasText: boolean
  }
}
```

**Utilisé par :** courses.html, upload.html, dashboard.html

**Requêtes typiques :**
- Liste des cours : `orderBy('createdAt', 'desc')`
- Cours par dossier : `where('folderId', '==', folderId)`
- Recherche : `where('title', '>=', searchTerm)`

---

### 🔹 Sous-collection `/users/{userId}/folders/{folderId}`

**Dossiers d'organisation**

```javascript
{
  folderId: string,
  name: string,             // Nom du dossier
  color: string,            // Couleur (hex)
  icon: string,             // Icône FontAwesome
  courseCount: number,      // Nombre de cours dans le dossier
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Utilisé par :** courses.html, dashboard.html

---

### 🔹 Sous-collection `/users/{userId}/syntheses/{synthesisId}`

**Synthèses générées par IA**

```javascript
{
  synthesisId: string,
  title: string,
  content: string,          // Contenu Markdown
  courseId: string,         // Référence au cours source
  generatedBy: string,      // "gemini-1.5-flash"
  type: string,             // "summary", "mindmap", "outline"
  createdAt: timestamp,
  shared: boolean,          // Partagé dans community
  wordCount: number,
  readingTime: number       // En minutes
}
```

**Utilisé par :** synthesize.html, dashboard.html, search.html

**Requêtes typiques :**
- Synthèses récentes : `orderBy('createdAt', 'desc').limit(10)`
- Par cours : `where('courseId', '==', courseId)`

---

### 🔹 Sous-collection `/users/{userId}/quizzes/{quizId}`

**Quiz générés ou créés**

```javascript
{
  quizId: string,
  title: string,
  courseId: string,
  questions: [              // Array de questions
    {
      id: string,
      type: string,         // "mcq", "mrq", "truefalse", "fillblank"
      question: string,
      options: array,       // Pour MCQ/MRQ
      correctAnswer: any,   // String ou array
      explanation: string,
      points: number
    }
  ],
  totalQuestions: number,
  totalPoints: number,
  createdAt: timestamp,
  lastAttempt: timestamp,
  attempts: number,
  bestScore: number         // Pourcentage
}
```

**Utilisé par :** quiz.html, dashboard.html

**Requêtes typiques :**
- Quiz récents : `orderBy('createdAt', 'desc')`
- Par cours : `where('courseId', '==', courseId)`

---

### 🔹 Sous-collection `/users/{userId}/flashcards/{deckId}`

**Decks de flashcards (SRS)**

```javascript
{
  deckId: string,
  name: string,
  description: string,
  courseId: string,
  cards: [                  // Array de cartes
    {
      id: string,
      question: string,     // Recto
      answer: string,       // Verso
      easeFactor: number,   // SM-2 algorithm (1.3-2.5)
      interval: number,     // Jours avant prochaine révision
      repetitions: number,  // Nombre de fois révisée
      nextReview: timestamp,
      lastReviewed: timestamp,
      difficulty: string    // "hard", "medium", "easy"
    }
  ],
  totalCards: number,
  dueToday: number,
  createdAt: timestamp,
  lastStudied: timestamp
}
```

**Utilisé par :** flashcards.html, dashboard.html

**Requêtes typiques :**
- Decks à réviser : `where('dueToday', '>', 0)`
- Par cours : `where('courseId', '==', courseId)`

---

### 🔹 Sous-collection `/users/{userId}/notifications/{notificationId}`

**Notifications utilisateur**

```javascript
{
  notificationId: string,
  type: string,             // "success", "info", "warning", "message"
  message: string,
  read: boolean,
  link: string,             // URL de redirection (optionnel)
  createdAt: timestamp,
  expiresAt: timestamp      // Auto-suppression après X jours
}
```

**Utilisé par :** dashboard.html (header), toutes les pages

**Requêtes typiques :**
- Non lues : `where('read', '==', false).orderBy('createdAt', 'desc')`
- Récentes : `orderBy('createdAt', 'desc').limit(10)`

---

### 🔹 Sous-collection `/users/{userId}/plannings/{eventId}`

**Événements du planning**

```javascript
{
  eventId: string,
  title: string,
  description: string,
  start: timestamp,
  end: timestamp,
  type: string,             // "revision", "exam", "cours", "deadline"
  courseId: string,         // Référence (optionnel)
  color: string,
  allDay: boolean,
  recurring: {              // Pour événements récurrents
    enabled: boolean,
    frequency: string,      // "daily", "weekly", "monthly"
    endDate: timestamp
  },
  reminder: {               // Rappels
    enabled: boolean,
    time: number            // Minutes avant
  },
  createdAt: timestamp
}
```

**Utilisé par :** planning.html

**Requêtes typiques :**
- Par mois : `where('start', '>=', startOfMonth).where('start', '<=', endOfMonth)`
- Événements à venir : `where('start', '>=', now).orderBy('start').limit(5)`

---

### 🔹 Collection `/community/{postId}`

**Posts publics de la communauté**

```javascript
{
  postId: string,
  userId: string,           // Auteur
  userName: string,
  userPhoto: string,
  title: string,
  content: string,
  type: string,             // "synthesis", "question", "resource"
  courseTag: string,        // Tag du cours
  synthesisId: string,      // Si partage de synthèse
  likes: number,
  commentsCount: number,
  views: number,
  createdAt: timestamp,
  updatedAt: timestamp,
  pinned: boolean,
  featured: boolean
}
```

**Utilisé par :** community.html

**Requêtes typiques :**
- Posts récents : `orderBy('createdAt', 'desc').limit(20)`
- Posts populaires : `orderBy('likes', 'desc').limit(10)`
- Par tag : `where('courseTag', '==', tag)`

---

### 🔹 Sous-collection `/community/{postId}/comments/{commentId}`

**Commentaires sur les posts**

```javascript
{
  commentId: string,
  userId: string,
  userName: string,
  userPhoto: string,
  content: string,
  likes: number,
  createdAt: timestamp,
  edited: boolean,
  editedAt: timestamp
}
```

**Utilisé par :** community.html

---

### 🔹 Sous-collection `/community/{postId}/likes/{likeId}`

**Likes sur les posts**

```javascript
{
  likeId: string,           // = userId
  userId: string,
  createdAt: timestamp
}
```

**Utilisé par :** community.html

---

### 🔹 Collection `/shared_syntheses/{synthesisId}`

**Synthèses partagées publiquement**

```javascript
{
  synthesisId: string,
  userId: string,           // Auteur
  userName: string,
  title: string,
  content: string,
  courseTag: string,
  downloads: number,
  likes: number,
  views: number,
  createdAt: timestamp,
  updatedAt: timestamp,
  featured: boolean
}
```

**Utilisé par :** community.html, search.html

---

### 🔹 Collection `/gamification/{userId}`

**Données de gamification**

```javascript
{
  userId: string,
  xp: number,               // Points d'expérience totaux
  level: number,            // Niveau (1-10)
  badges: [                 // Badges débloqués
    {
      badgeId: string,
      name: string,
      unlockedAt: timestamp
    }
  ],
  streak: number,           // Jours consécutifs
  lastActivity: timestamp,
  stats: {
    quizzesCompleted: number,
    synthesisGenerated: number,
    flashcardsReviewed: number,
    coursesAdded: number,
    hoursStudied: number
  }
}
```

**Utilisé par :** Toutes les pages (via gamification.js)

---

## 2️⃣ RÈGLES DE SÉCURITÉ FIRESTORE

### 📜 Règles complètes (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidUser() {
      return isAuthenticated() &&
             request.auth.token.email_verified == true;
    }

    // ========================================
    // USERS ET SOUS-COLLECTIONS
    // ========================================

    match /users/{userId} {
      // Lecture : utilisateur lui-même
      allow read: if isOwner(userId);

      // Écriture : utilisateur lui-même
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);

      // --- Sous-collection: courses ---
      match /courses/{courseId} {
        allow read, write: if isOwner(userId);
      }

      // --- Sous-collection: folders ---
      match /folders/{folderId} {
        allow read, write: if isOwner(userId);
      }

      // --- Sous-collection: syntheses ---
      match /syntheses/{synthesisId} {
        allow read, write: if isOwner(userId);
      }

      // --- Sous-collection: quizzes ---
      match /quizzes/{quizId} {
        allow read, write: if isOwner(userId);
      }

      // --- Sous-collection: flashcards ---
      match /flashcards/{deckId} {
        allow read, write: if isOwner(userId);
      }

      // --- Sous-collection: notifications ---
      match /notifications/{notificationId} {
        allow read: if isOwner(userId);
        allow create: if isAuthenticated(); // Les functions peuvent créer
        allow update, delete: if isOwner(userId);
      }

      // --- Sous-collection: plannings ---
      match /plannings/{eventId} {
        allow read, write: if isOwner(userId);
      }
    }

    // ========================================
    // COMMUNITY (PUBLIC AVEC RESTRICTIONS)
    // ========================================

    match /community/{postId} {
      // Lecture : tous les utilisateurs authentifiés
      allow read: if isAuthenticated();

      // Création : utilisateur authentifié
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;

      // Modification/Suppression : propriétaire uniquement
      allow update, delete: if isAuthenticated() &&
                              resource.data.userId == request.auth.uid;

      // --- Sous-collection: comments ---
      match /comments/{commentId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() &&
                        request.resource.data.userId == request.auth.uid;
        allow update, delete: if isAuthenticated() &&
                                resource.data.userId == request.auth.uid;
      }

      // --- Sous-collection: likes ---
      match /likes/{likeId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && likeId == request.auth.uid;
        allow delete: if isAuthenticated() && likeId == request.auth.uid;
      }
    }

    // ========================================
    // SHARED SYNTHESES (PUBLIC EN LECTURE)
    // ========================================

    match /shared_syntheses/{synthesisId} {
      // Lecture : tous les utilisateurs authentifiés
      allow read: if isAuthenticated();

      // Création : utilisateur authentifié
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;

      // Modification/Suppression : propriétaire uniquement
      allow update, delete: if isAuthenticated() &&
                              resource.data.userId == request.auth.uid;
    }

    // ========================================
    // GAMIFICATION
    // ========================================

    match /gamification/{userId} {
      // Lecture : utilisateur lui-même
      allow read: if isOwner(userId);

      // Écriture : utilisateur lui-même ou functions
      allow write: if isOwner(userId);
    }

    // ========================================
    // BLOQUER TOUT LE RESTE
    // ========================================

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3️⃣ STORAGE FIREBASE

### 📁 Structure du Storage

```
/users/{userId}/
  ├── courses/
  │   ├── {filename}.pdf
  │   ├── {filename}.png
  │   └── ...
  ├── profile/
  │   └── avatar.jpg
  └── exports/
      ├── synthesis_{id}.pdf
      └── flashcards_{id}.csv
```

### 📊 Limites de taille

- **PDF de cours :** 50 MB maximum
- **Images :** 10 MB maximum
- **Photos de profil :** 5 MB maximum
- **Exports :** 20 MB maximum

---

## 4️⃣ RÈGLES DE SÉCURITÉ STORAGE

### 📜 Règles complètes (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidFileSize(maxSizeMB) {
      return request.resource.size <= maxSizeMB * 1024 * 1024;
    }

    function isValidImageType() {
      return request.resource.contentType.matches('image/.*');
    }

    function isValidDocType() {
      return request.resource.contentType.matches('application/pdf') ||
             request.resource.contentType.matches('image/.*') ||
             request.resource.contentType.matches('text/.*');
    }

    // ========================================
    // FICHIERS UTILISATEUR
    // ========================================

    match /users/{userId}/{allPaths=**} {
      // Lecture : propriétaire uniquement
      allow read: if isOwner(userId);

      // Écriture : propriétaire avec vérification de taille
      allow write: if isOwner(userId) &&
                      isValidFileSize(50); // 50MB max global
    }

    // Règles spécifiques par type

    // --- Cours (PDFs, images) ---
    match /users/{userId}/courses/{filename} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) &&
                      isValidDocType() &&
                      isValidFileSize(50);
    }

    // --- Photos de profil ---
    match /users/{userId}/profile/{filename} {
      allow read: if isAuthenticated(); // Visible par tous
      allow write: if isOwner(userId) &&
                      isValidImageType() &&
                      isValidFileSize(5);
    }

    // --- Exports ---
    match /users/{userId}/exports/{filename} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) &&
                      isValidFileSize(20);
    }

    // ========================================
    // BLOQUER TOUT LE RESTE
    // ========================================

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 5️⃣ INDICES FIRESTORE

### 📌 Indices composites requis

Créer ces indices dans Firebase Console → Firestore → Indexes :

#### Index 1 : Notifications non lues
```
Collection: users/{userId}/notifications
Fields: read (Ascending), createdAt (Descending)
```

#### Index 2 : Posts communauté par popularité
```
Collection: community
Fields: courseTag (Ascending), likes (Descending)
```

#### Index 3 : Events planning par date
```
Collection: users/{userId}/plannings
Fields: start (Ascending), type (Ascending)
```

#### Index 4 : Recherche de synthèses
```
Collection: users/{userId}/syntheses
Fields: courseId (Ascending), createdAt (Descending)
```

---

## 6️⃣ FIREBASE FUNCTIONS

### 🔧 Functions nécessaires

#### Function 1 : `generateContent`
**Endpoint :** `https://us-central1-projet-blocus-v2.cloudfunctions.net/generateContent`

**Utilisée par :** synthesize.html, quiz.html

**Paramètres :**
```javascript
{
  type: "synthesis" | "quiz" | "flashcards" | "fillblank",
  courseText: string,
  userId: string,
  courseId: string
}
```

**Retour :**
```javascript
{
  success: boolean,
  content: string | array,
  error?: string
}
```

#### Function 2 : `updateGamification`
**Trigger :** onCreate dans collections courses, syntheses, quizzes

**Action :** Met à jour automatiquement le XP et vérifie les badges

---

## 📋 CHECKLIST DE CONFIGURATION

### Dans Firebase Console

- [ ] **Firestore Database**
  - [ ] Copier et publier les règles `firestore.rules`
  - [ ] Créer les 4 indices composites
  - [ ] Activer le mode "Production"

- [ ] **Storage**
  - [ ] Copier et publier les règles `storage.rules`
  - [ ] Configurer CORS si nécessaire

- [ ] **Authentication**
  - [ ] Activer Email/Password
  - [ ] Activer Google Sign-In
  - [ ] Ajouter domaine autorisé (Netlify)

- [ ] **Functions**
  - [ ] Déployer `generateContent`
  - [ ] Déployer `updateGamification`
  - [ ] Vérifier les logs

---

## 🔗 LIENS UTILES

- [Firebase Console](https://console.firebase.google.com)
- [Documentation Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Documentation Storage Rules](https://firebase.google.com/docs/storage/security/start)

---

**Dernière mise à jour :** 24 décembre 2024
