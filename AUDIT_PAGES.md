# 🔍 AUDIT COMPLET DES PAGES - Projet Blocus

**Date :** 24 décembre 2024
**Objectif :** Vérifier chaque page HTML et corriger tous les problèmes

---

## 📋 PAGES À VÉRIFIER (18 pages)

### Pages Principales (Priorité HAUTE)
1. ✅ dashboard.html - Tableau de bord
2. ⏳ courses.html - Gestion des cours
3. ⏳ quiz.html - Quiz IA
4. ⏳ synthesize.html - Génération de synthèses
5. ⏳ flashcards.html - Flashcards SRS
6. ⏳ search.html - Recherche intelligente
7. ⏳ analytics.html - Statistiques
8. ⏳ profile.html - Profil utilisateur
9. ⏳ planning.html - Planning
10. ⏳ community.html - Communauté

### Pages Secondaires (Priorité MOYENNE)
11. ⏳ upload.html - Upload de fichiers
12. ⏳ forum.html - Forum
13. ⏳ discussion.html - Discussions
14. ⏳ chat.html - Chat
15. ⏳ chat-list.html - Liste des chats
16. ⏳ friends.html - Amis
17. ⏳ view-profile.html - Voir profil
18. ⏳ bug-report.html - Rapport de bug

---

## ✅ TEMPLATE STANDARD

Toutes les pages doivent suivre ce template :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NOM PAGE - Projet Blocus</title>
    <link rel="icon" type="image/png" href="../../assets/images/locus-neon-favicon.png">

    <!-- Tailwind CSS + Custom CSS -->
    <link rel="stylesheet" href="../../assets/css/style.css">
    <!-- Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body id="app-container" class="relative selection:bg-indigo-500 selection:text-white overflow-hidden h-screen flex bg-[#050505]">

    <!-- FOND ANIMÉ -->
    <div class="noise-overlay"></div>
    <div class="glow-bg" style="top: -20%; left: -10%; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);"></div>
    <div class="glow-bg" style="bottom: -20%; right: -10%; background: radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%);"></div>

    <!-- MAIN CONTENT -->
    <div class="flex-grow flex flex-col min-w-0 relative z-10 md:ml-64 transition-all duration-300">

        <!-- HEADER -->
        <header class="h-20 border-b border-gray-800/50 flex items-center justify-between px-8 bg-gray-900/30 backdrop-blur-sm z-30 relative">
            <!-- Mobile menu button -->
            <div class="flex items-center gap-4 md:hidden">
                <button id="mobile-menu-btn" class="relative z-50 text-gray-400 hover:text-white">
                    <i class="fas fa-bars text-xl"></i>
                </button>
                <span class="font-bold text-lg text-white">NOM PAGE</span>
            </div>

            <!-- Desktop title -->
            <div class="hidden md:block">
                <h1 class="text-xl font-display font-bold text-white">Titre Page</h1>
            </div>

            <!-- User profile -->
            <div id="nav-logged-in" class="flex items-center gap-6">
                <a href="profile.html" class="flex items-center gap-3 group cursor-pointer">
                    <div class="text-right hidden sm:block">
                        <p id="user-name-header" class="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">...</p>
                        <p class="text-xs text-gray-500">Voir mon profil</p>
                    </div>
                    <img id="user-avatar-header" src="" alt="Avatar" class="w-10 h-10 rounded-full border-2 border-gray-700 group-hover:border-indigo-500 transition-colors object-cover bg-gray-800">
                </a>
            </div>
        </header>

        <!-- SCROLLABLE CONTENT -->
        <main class="flex-grow p-8 overflow-y-auto custom-scrollbar">
            <!-- CONTENU ICI -->
        </main>
    </div>

    <!-- SCRIPTS -->
    <script type="module">
        import { auth, db } from '../../assets/js/config.js';
        import { initLayout } from '../../assets/js/layout.js';
        import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

        // Initialiser le layout
        document.addEventListener('DOMContentLoaded', () => {
            initLayout('PAGE_ID');
        });

        // Vérifier l'authentification
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User connecté - charger les données
            } else {
                window.location.href = '../auth/login.html';
            }
        });
    </script>
</body>
</html>
```

---

## 🔍 CHECKLIST PAR PAGE

Pour chaque page, vérifier :

### ✅ HEAD
- [ ] Charset UTF-8
- [ ] Viewport responsive
- [ ] Title correct
- [ ] Favicon (../../assets/images/locus-neon-favicon.png)
- [ ] CSS dans le bon ordre :
  1. style.css (../../assets/css/style.css)
  2. Font Awesome (CDN)
- [ ] Pas de Tailwind CDN
- [ ] Pas de doublons CSS

### ✅ BODY
- [ ] id="app-container"
- [ ] Classes: relative selection:bg-indigo-500 selection:text-white overflow-hidden h-screen flex bg-[#050505]
- [ ] Fond animé (noise-overlay + 2 glow-bg)

### ✅ STRUCTURE
- [ ] div.flex-grow avec md:ml-64
- [ ] header avec mobile-menu-btn
- [ ] main avec custom-scrollbar

### ✅ SCRIPTS
- [ ] Import config.js
- [ ] Import layout.js
- [ ] initLayout('page-id') appelé
- [ ] onAuthStateChanged configuré
- [ ] Chemins relatifs (../../assets/js/...)

---

## 📝 NOTES FIREBASE

### Collections Firestore Requises

```
/users/{userId}
  - firstName: string
  - lastName: string
  - email: string
  - photoURL: string
  - createdAt: timestamp
  - lastLogin: timestamp

  /courses/{courseId}
    - title: string
    - fileName: string
    - fileURL: string
    - size: number
    - createdAt: timestamp
    - folderId: string (optionnel)

  /syntheses/{synthesisId}
    - title: string
    - content: string
    - courseId: string
    - createdAt: timestamp

  /quizzes/{quizId}
    - title: string
    - questions: array
    - createdAt: timestamp

  /flashcards/{deckId}
    - name: string
    - cards: array
    - createdAt: timestamp

  /folders/{folderId}
    - name: string
    - courseCount: number
    - createdAt: timestamp

  /notifications/{notifId}
    - message: string
    - type: string
    - read: boolean
    - createdAt: timestamp

  /plannings/{planningId}
    - events: array
    - createdAt: timestamp

/community/{postId}
  - userId: string
  - title: string
  - content: string
  - likes: number
  - createdAt: timestamp

  /comments/{commentId}
    - userId: string
    - content: string
    - createdAt: timestamp

  /likes/{likeId}
    - userId: string
    - createdAt: timestamp

/shared_syntheses/{synthesisId}
  - userId: string
  - title: string
  - content: string
  - downloads: number
  - createdAt: timestamp

/gamification/{userId}
  - xp: number
  - level: number
  - badges: array
  - streak: number
  - lastActivity: timestamp
```

### Storage Requis

```
/users/{userId}/courses/{filename}
  - PDFs, images, documents

/users/{userId}/profile/{filename}
  - Photos de profil
```

---

## 🔐 RÈGLES FIRESTORE REQUISES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users et sous-collections
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /courses/{courseId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /syntheses/{synthesisId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /quizzes/{quizId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /flashcards/{deckId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /folders/{folderId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /notifications/{notifId} {
        allow read, write: if request.auth.uid == userId;
      }

      match /plannings/{planningId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Community (lecture publique, écriture propriétaire)
    match /community/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                              request.auth.uid == resource.data.userId;

      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null &&
                                request.auth.uid == resource.data.userId;
      }

      match /likes/{likeId} {
        allow read, write: if request.auth != null;
      }
    }

    // Shared syntheses
    match /shared_syntheses/{synthesisId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                              request.auth.uid == resource.data.userId;
    }

    // Gamification
    match /gamification/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Bloquer tout le reste
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### RÈGLES STORAGE REQUISES

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Fichiers utilisateur
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null &&
                      request.auth.uid == userId &&
                      request.resource.size < 50 * 1024 * 1024; // 50MB max
    }

    // Bloquer tout le reste
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 📊 PROGRESSION

- [ ] 0/18 pages auditées
- [ ] 0/18 pages corrigées
- [ ] Règles Firebase documentées ✅
- [ ] Template créé ✅

---

**Prochaine étape :** Auditer et corriger chaque page une par une
