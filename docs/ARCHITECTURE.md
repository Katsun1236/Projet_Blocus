# 🏗️ ARCHITECTURE - PROJET BLOCUS

**Version:** 2.0
**Date:** 26 Décembre 2025
**Status:** En cours de refactorisation

---

## 📐 VUE D'ENSEMBLE

Projet Blocus est une Progressive Web App (PWA) d'aide aux révisions pour étudiants, utilisant l'IA Gemini pour générer des contenus pédagogiques (quiz, synthèses, flashcards).

### Stack Technologique

**Frontend:**
- Vanilla JavaScript (ES6 modules)
- Tailwind CSS (utility-first)
- HTML5 & CSS3

**Backend:**
- Firebase Authentication
- Cloud Firestore (NoSQL database)
- Firebase Storage (files)
- Firebase Functions (serverless)

**IA:**
- Google Gemini 1.5 Flash (via API)
- Fallback sur multiples modèles

**Déploiement:**
- Netlify (hosting)
- GitHub (version control)

---

## 🎯 ARCHITECTURE ACTUELLE

### Structure des fichiers (En cours de migration)

```
Projet_Blocus/
├── assets/                    # À migrer vers src/
│   ├── css/
│   │   ├── input.css
│   │   └── style.css
│   └── js/                    # 19 fichiers (à réorganiser)
│
├── pages/                     # À migrer vers public/
│   ├── app/                   # 14 pages application
│   ├── auth/                  # 3 pages authentification
│   ├── legal/                 # 3 pages légales
│   └── admin/                 # 1 page admin
│
├── functions/                 # Firebase Cloud Functions
│   ├── index.js              # ✅ Nettoyé (duplication supprimée)
│   └── .eslintrc.js
│
├── index.html                # Page d'accueil
├── firestore.rules           # ✅ Sécurisé
├── storage.rules
├── firebase.json
└── package.json
```

### Problèmes identifiés

**Sécurité:**
- ✅ CORRIGÉ: Règles Firestore trop permissives
- ⚠️  Firebase credentials en clair dans config.js
- ⚠️  Pas de validation/sanitization inputs

**Architecture:**
- ⚠️  Pas de séparation des concerns
- ⚠️  Fichiers monolithiques (community.js = 585 lignes)
- ⚠️  Pas de module bundler
- ✅ CORRIGÉ: Code dupliqué dans functions/index.js

**Performance:**
- ⚠️  CDN dependencies (pas de bundling)
- ⚠️  Pas de code splitting
- ⚠️  Requêtes Firestore non optimisées
- ⚠️  Listeners real-time non nettoyés

---

## 🎯 ARCHITECTURE CIBLE

### Nouvelle structure (En cours)

```
Projet_Blocus/
├── src/                          # Code source
│   ├── app/
│   │   ├── features/             # Modules par feature
│   │   │   ├── auth/             # Authentification
│   │   │   ├── courses/          # Gestion cours
│   │   │   ├── quiz/             # Quiz & IA
│   │   │   ├── synthesis/        # Synthèses
│   │   │   ├── community/        # Posts & groupes
│   │   │   ├── planning/         # Calendrier
│   │   │   ├── profile/          # Profil utilisateur
│   │   │   ├── gamification/     # XP, badges
│   │   │   └── dashboard/        # Tableau de bord
│   │   │
│   │   ├── core/                 # Services core
│   │   │   ├── services/         # Services globaux
│   │   │   │   ├── firebase/     # Config Firebase
│   │   │   │   ├── api/          # API client
│   │   │   │   └── storage/      # LocalStorage
│   │   │   ├── config/           # Configuration
│   │   │   └── middleware/       # Middlewares
│   │   │
│   │   ├── shared/               # Partagé
│   │   │   ├── components/       # UI components
│   │   │   │   ├── layout/       # Layout (navbar, sidebar)
│   │   │   │   ├── ui/           # UI atoms (button, modal)
│   │   │   │   └── feedback/     # Feedback (toast, loader)
│   │   │   ├── utils/            # Utilities
│   │   │   └── constants/        # Constantes
│   │   │
│   │   └── pages/                # Pages landing/legal
│   │
│   └── assets/                   # Assets statiques
│       ├── images/
│       ├── fonts/
│       └── styles/
│
├── public/                       # Build output
│   ├── pages/
│   │   ├── app/
│   │   ├── auth/
│   │   └── legal/
│   └── index.html
│
├── functions/                    # Cloud Functions
│   ├── src/
│   │   ├── api/
│   │   ├── utils/
│   │   └── index.js
│   └── package.json
│
├── config/                       # Build config
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── tests/                        # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example                  # ✅ Créé
├── firestore.rules               # ✅ Sécurisé
├── ROADMAP.md                    # ✅ Créé
└── ARCHITECTURE.md               # Ce fichier
```

---

## 🔀 ARCHITECTURE EN COUCHES

### 1. Présentation Layer (Pages & Components)

**Responsabilité:** Affichage UI, gestion événements utilisateur

**Technologies:** Vanilla JS, Tailwind CSS

**Localisation:** `src/app/features/*/pages/*.js` + `src/app/features/*/components/*.js`

**Exemples:**
- `/quiz/pages/quiz.js` - Page principale quiz
- `/quiz/components/QuizPlayer.js` - Composant player
- `/shared/components/ui/Modal.js` - Modal réutilisable

### 2. Service Layer (Business Logic)

**Responsabilité:** Logique métier, orchestration, transformation données

**Localisation:** `src/app/features/*/services/*.js`

**Exemples:**
```javascript
// src/app/features/quiz/services/quizService.js
export class QuizService {
  async generateQuiz(topic, options) {
    const quiz = await aiQuizGenerator.generate(topic, options);
    const quizId = await quizRepository.create(quiz);
    await gamificationService.addXP(10);
    return { ...quiz, id: quizId };
  }

  calculateScore(answers) {
    // Business logic
  }
}
```

### 3. Repository Layer (Data Access)

**Responsabilité:** Accès données, requêtes Firestore/Storage

**Localisation:** `src/app/features/*/repositories/*.js`

**Exemples:**
```javascript
// src/app/features/quiz/repositories/quizRepository.js
export class QuizRepository {
  async create(quizData) {
    return await addDoc(collection(db, 'quizzes'), quizData);
  }

  async findByUser(userId) {
    const q = query(
      collection(db, 'quizzes'),
      where('userId', '==', userId)
    );
    return await getDocs(q);
  }
}
```

### 4. Data Layer (Firebase)

**Responsabilité:** Stockage, authentification, hosting

**Services:**
- **Firestore:** Base NoSQL
- **Storage:** Fichiers (PDF, images)
- **Auth:** Authentification users
- **Functions:** Backend serverless

---

## 🔐 SÉCURITÉ

### Règles Firestore (✅ Sécurisées)

**Principes appliqués:**
1. **Principe du moindre privilège**
2. **Vérification de propriété**
3. **Validation côté serveur**
4. **Fonctions helper réutilisables**

**Exemple:**
```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isAuthor() {
  return isAuthenticated() &&
         request.auth.uid == resource.data.authorId;
}

match /community_posts/{postId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && willBeAuthor();
  allow update, delete: if isAuthor();
}
```

### Variables d'environnement

**Fichier:** `.env.example` (✅ créé)

**Usage:**
```bash
# Development
VITE_APP_ENV=development
VITE_ENABLE_DEBUG=true

# Production
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
```

### Sanitization (⚠️ À implémenter)

**Problème:** XSS possible via user-generated content

**Solution:** DOMPurify
```javascript
import DOMPurify from 'dompurify';

function renderPost(post) {
  const clean = DOMPurify.sanitize(post.content);
  return `<p>${clean}</p>`;
}
```

---

## ⚡ PERFORMANCE

### Stratégies d'optimisation

**1. Code Splitting (À implémenter)**
```javascript
// Lazy load features
const loadCommunity = () => import('./features/community/pages/community.js');
```

**2. Caching**
- Firestore offline persistence
- LocalStorage pour données statiques
- Service Worker pour assets

**3. Pagination**
```javascript
// Cursor-based pagination
const q = query(
  collection(db, 'posts'),
  orderBy('createdAt', 'desc'),
  startAfter(lastDoc),
  limit(10)
);
```

**4. Real-time Listeners Cleanup**
```javascript
let unsubscribe = null;

function setupListener() {
  unsubscribe = onSnapshot(query, callback);
}

function cleanup() {
  if (unsubscribe) unsubscribe();
}
```

---

## 🧪 TESTING

### Stratégie de test

**Unit Tests:** Services & Utilities
```javascript
// tests/unit/services/quizService.test.js
import { quizService } from '@features/quiz/services/quizService';

test('calculateScore returns correct percentage', () => {
  const score = quizService.calculateScore(answers);
  expect(score.percentage).toBe(75);
});
```

**Integration Tests:** Feature flows

**E2E Tests:** Critical user paths
- Inscription → Onboarding → Dashboard
- Upload cours → Génération synthèse
- Création quiz → Passage → Résultats

---

## 📊 DATA MODELS

### User
```javascript
{
  uid: string,
  firstName: string,
  lastName: string,
  email: string,
  photoURL: string,
  level: number,
  xp: number,
  badges: string[],
  createdAt: Timestamp
}
```

### Community Post
```javascript
{
  id: string,
  authorId: string,
  title: string,
  content: string,
  tag: string,
  images: string[],
  likes: string[],
  commentsCount: number,
  createdAt: Timestamp
}
```

### Quiz
```javascript
{
  id: string,
  userId: string,
  title: string,
  questions: [{
    question: string,
    type: 'qcm' | 'vrai-faux' | 'ouverte',
    options: string[],
    correctAnswer: string | string[]
  }],
  createdAt: Timestamp
}
```

---

## 🚀 DÉPLOIEMENT

### Workflow

```bash
# Development
npm run dev           # Vite dev server

# Build
npm run build         # Vite build → dist/

# Deploy
npm run deploy        # Build + Firebase deploy
```

### Environnements

**Development:**
- Local dev server (Vite)
- Firebase emulators (optionnel)
- Debug activé

**Production:**
- Netlify hosting
- Firebase production
- Analytics activé
- Debug désactivé

---

## 📈 MONITORING

### Métriques clés

**Performance:**
- Lighthouse score > 90
- FCP < 1.5s
- TTI < 3s

**Sécurité:**
- 0 vulnérabilités critiques
- Firestore rules testées
- Inputs validés

**Qualité:**
- Test coverage > 60%
- 0 erreurs ESLint
- Bundle < 500KB

---

## 🔄 PROCESSUS DE MIGRATION

### État actuel

✅ **Phase 1 terminée:**
- Analyse complète (42 issues identifiées)
- Roadmap créée
- Règles Firestore sécurisées
- Code dupliqué supprimé
- `.env.example` créé

⏳ **En cours:**
- Migration vers nouvelle structure
- Setup Vite
- Refactoring features

📋 **À venir:**
- Tests unitaires
- TypeScript migration
- PWA complète

---

## 📚 RÉFÉRENCES

### Documentation
- [Firebase Best Practices](https://firebase.google.com/docs/rules/rules-and-auth)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Fichiers clés
- `ROADMAP.md` - Plan détaillé d'amélioration
- `firestore.rules` - Règles sécurité Firestore
- `.env.example` - Template configuration

---

**Dernière mise à jour:** 26 Décembre 2025
**Maintenu par:** Équipe Projet Blocus
