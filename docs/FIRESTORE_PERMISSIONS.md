# 🔥 Guide Permissions Firestore - Projet Blocus

Ce guide t'aide à résoudre les erreurs **"Missing or insufficient permissions"** dans Firestore.

---

## 🚨 Erreur courante

```
FirebaseError: Missing or insufficient permissions.
```

**Cause :** Les règles de sécurité Firestore empêchent l'accès aux données.

---

## ✅ Solution : Mettre à jour les règles Firestore

### 1. **Ouvrir Firebase Console**

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionne ton projet **projet-blocus-v2**
3. **Firestore Database** (menu de gauche)
4. Onglet **Règles** (Rules)

### 2. **Règles actuelles vs Règles requises**

#### ❌ Règles trop restrictives (PROBLÈME)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tout est bloqué par défaut
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### ✅ Règles correctes (SOLUTION)

Remplace par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ✅ Collection users - Chaque utilisateur peut lire/écrire ses propres données
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Sous-collections de l'utilisateur
      match /courses/{courseId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /syntheses/{synthesisId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /flashcards/{flashcardId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /quizzes/{quizId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /plannings/{planningId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // ✅ Collection community - Posts publics en lecture, authentifié pour écriture
    match /community/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                              request.auth.uid == resource.data.userId;

      // Commentaires
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null &&
                                request.auth.uid == resource.data.userId;
      }

      // Likes
      match /likes/{likeId} {
        allow read, write: if request.auth != null;
      }
    }

    // ✅ Collection shared_syntheses - Synthèses partagées publiquement
    match /shared_syntheses/{synthesisId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                              request.auth.uid == resource.data.userId;
    }

    // ✅ Collection notifications - Notifications utilisateur
    match /notifications/{notificationId} {
      allow read: if request.auth != null &&
                    request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                              request.auth.uid == resource.data.userId;
    }

    // ✅ Collection gamification - Données de gamification
    match /gamification/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ❌ Bloquer tout le reste
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. **Publier les règles**

1. Copie les règles ci-dessus
2. Colle dans l'éditeur Firebase Console
3. Clique sur **"Publier"** (Publish)
4. Attends la confirmation (~10 secondes)

---

## 📊 Explication des règles

### **Principe de base**

```javascript
allow read, write: if request.auth != null && request.auth.uid == userId;
```

- `request.auth != null` → L'utilisateur doit être **connecté**
- `request.auth.uid == userId` → L'utilisateur peut accéder **uniquement à SES données**

### **Structure des données**

```
firestore/
├── users/
│   └── {userId}/                    # Document utilisateur principal
│       ├── courses/                 # Sous-collection
│       ├── syntheses/              # Sous-collection
│       ├── flashcards/             # Sous-collection
│       ├── quizzes/                # Sous-collection
│       └── plannings/              # Sous-collection
├── community/                       # Posts publics (lecture seule)
│   └── {postId}/
│       ├── comments/
│       └── likes/
├── shared_syntheses/                # Synthèses partagées
├── notifications/                   # Notifications
└── gamification/                    # Données gamification
```

---

## 🔍 Tester les règles

### Dans Firebase Console

1. **Firestore Database** → **Règles** → Onglet **Simulateur de règles**
2. Sélectionne le type : `get`, `list`, `create`, `update`, `delete`
3. Chemin : `/users/{userId}/courses/{courseId}`
4. **Authentifié comme :** Ton UID utilisateur
5. **Simuler** → Doit afficher ✅ **Autorisé**

### Dans la console navigateur

```javascript
// Tester la lecture
const userId = auth.currentUser.uid;
const userDoc = await getDoc(doc(db, 'users', userId));
console.log('User data:', userDoc.data()); // ✅ Doit fonctionner

// Tester une collection
const coursesSnap = await getDocs(collection(db, `users/${userId}/courses`));
console.log('Courses:', coursesSnap.docs.map(d => d.data())); // ✅ Doit fonctionner
```

---

## ⚠️ Erreurs fréquentes

### 1. **Sous-collections mal configurées**

❌ **Mauvais** (bloque l'accès) :
```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
  // Manque la règle pour les sous-collections !
}
```

✅ **Bon** :
```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;

  match /courses/{courseId} {
    allow read, write: if request.auth.uid == userId;
  }
}
```

### 2. **Accès à la collection community**

**Problème :** `Missing or insufficient permissions` sur `/community`

**Cause :** Lecture non autorisée pour tous

**Solution :** Ajouter `allow read: if request.auth != null;`

### 3. **Wildcard trop large**

❌ **Dangereux** (tout le monde peut tout lire) :
```javascript
match /{document=**} {
  allow read, write: if true;
}
```

✅ **Sécurisé** :
```javascript
match /{document=**} {
  allow read, write: if false; // Bloque tout sauf ce qui est explicitement autorisé
}
```

---

## 🧪 Tester en environnement de développement

### Mode test (TEMPORAIRE, 30 jours max)

⚠️ **ATTENTION :** À utiliser UNIQUEMENT pour le développement !

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // ⚠️ TEMPORAIRE : Expire dans 30 jours
      allow read, write: if request.time < timestamp.date(2025, 2, 1);
    }
  }
}
```

**NE JAMAIS utiliser en production !**

---

## 📝 Checklist de débogage

Si tu as toujours des erreurs de permissions :

- [ ] ✅ Vérifié que les règles sont **publiées** dans Firebase Console
- [ ] ✅ Vérifié que `request.auth.uid` correspond au chemin `/users/{userId}`
- [ ] ✅ Testé avec le **Simulateur de règles** dans Firebase
- [ ] ✅ Vérifié que l'utilisateur est **authentifié** (`auth.currentUser` non null)
- [ ] ✅ Vidé le cache du navigateur (Ctrl+Shift+R)
- [ ] ✅ Vérifié la structure du chemin dans le code (ex: `users/${userId}/courses`)

---

## 🔗 Ressources

- [Documentation Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Guide des règles avancées](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Simulateur de règles](https://firebase.google.com/docs/firestore/security/test-rules-emulator)

---

## 📞 Besoin d'aide ?

Si le problème persiste après avoir appliqué ces règles :

1. Vérifie dans la **console navigateur** l'erreur exacte
2. Note le **chemin Firestore** qui pose problème
3. Ouvre une issue GitHub avec :
   - Le chemin de la collection/document
   - Le code qui génère l'erreur
   - Les règles actuelles

---

**Dernière mise à jour :** 24 décembre 2024
