# 🗺️ PROJET BLOCUS - ROADMAP D'AMÉLIORATION

**Date:** 26 Décembre 2025
**Version:** 2.0
**Statut:** En cours de refactorisation

---

## 📊 RÉSUMÉ EXÉCUTIF

Cette roadmap détaille le plan d'amélioration complet pour Projet Blocus basé sur l'analyse approfondie du code actuel.

**Problèmes identifiés:** 42 issues (4 critiques, 18 hautes, 17 moyennes)
**Score de santé du code:** 4.2/10
**Effort estimé:** 6-8 semaines avec 2 développeurs

---

## 🎯 OBJECTIFS STRATÉGIQUES

### Court terme (1 mois)
- ✅ Sécuriser l'application (règles Firestore, validation inputs)
- ✅ Éliminer les vulnérabilités critiques
- ✅ Mettre en place une architecture modulaire

### Moyen terme (3 mois)
- ✅ Optimiser les performances
- ✅ Implémenter un système de build moderne
- ✅ Améliorer la qualité du code
- ✅ Ajouter des tests

### Long terme (6 mois)
- ✅ Migration vers TypeScript
- ✅ Scalabilité et optimisations avancées
- ✅ Monitoring et analytics
- ✅ PWA complète

---

## 🔴 PHASE 1: CORRECTIONS CRITIQUES (Semaine 1)

### Priorité CRITIQUE

#### 1.1 Sécurité Firestore (SEC-002)

**Problème:** Règles Firestore trop permissives permettant à n'importe quel utilisateur authentifié de modifier/supprimer les données des autres.

**Actions:**
- [ ] Ajouter vérification de propriété pour posts
- [ ] Restreindre accès aux données utilisateur
- [ ] Implémenter RBAC pour groupes
- [ ] Ajouter validation côté serveur

**Fichier:** `firestore.rules`

**Règles corrigées:**
```javascript
match /community_posts/{postId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null &&
                request.resource.data.authorId == request.auth.uid;
  allow update, delete: if request.auth != null &&
                         resource.data.authorId == request.auth.uid;
}

match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

#### 1.2 Suppression du code dupliqué (ARCH-002)

**Problème:** Le fichier `functions/index.js` contient le code en double (lignes 1-206 = lignes 207-422).

**Actions:**
- [ ] Supprimer la duplication
- [ ] Résoudre les marqueurs de merge conflict
- [ ] Tester les Cloud Functions

**Fichier:** `functions/index.js`

#### 1.3 Validation et sanitization des inputs (SEC-003)

**Problème:** XSS possible via injection de contenu malicieux dans posts/commentaires.

**Actions:**
- [ ] Installer DOMPurify: `npm install dompurify`
- [ ] Sanitizer tout contenu utilisateur avant affichage
- [ ] Valider côté serveur (Firebase Functions)

**Exemple:**
```javascript
import DOMPurify from 'dompurify';

function renderPost(post) {
  const cleanContent = DOMPurify.sanitize(post.content);
  return `<p>${cleanContent}</p>`;
}
```

#### 1.4 Suppression des console.log (SEC-005)

**Problème:** 71 console.log exposant des informations sensibles.

**Actions:**
- [ ] Remplacer par logger conditionnel
- [ ] Configurer build pour supprimer logs en production
- [ ] Utiliser les outils de monitoring à la place

**Fichiers:** Tous les `.js`

---

## 🟠 PHASE 2: RESTRUCTURATION ARCHITECTURALE (Semaines 2-3)

### Priorité HAUTE

#### 2.1 Setup du système de build (ARCH-004)

**Actions:**
- [ ] Installer Vite: `npm install -D vite`
- [ ] Créer `vite.config.js`
- [ ] Configurer Tailwind avec PostCSS
- [ ] Tester build local

**Bénéfices:**
- Bundling optimisé
- Code splitting automatique
- HMR pour dev
- Minification production

#### 2.2 Variables d'environnement (MAINT-001)

**Actions:**
- [ ] Créer `.env.example`
- [ ] Créer `.env.local` (gitignored)
- [ ] Migrer config Firebase vers env vars
- [ ] Mettre à jour `.gitignore`

**Fichiers:**
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

#### 2.3 Séparation des concerns (ARCH-001)

**Actions:**
- [ ] Créer nouvelle structure de dossiers
- [ ] Séparer en couches: Présentation / Service / Repository
- [ ] Migrer fichier par fichier
- [ ] Tester chaque migration

**Nouvelle structure:**
```
src/
├── app/
│   ├── features/      (auth, quiz, courses, etc.)
│   ├── core/          (services, config)
│   └── shared/        (composants réutilisables)
```

---

## 🟡 PHASE 3: OPTIMISATIONS PERFORMANCE (Semaines 3-4)

### Priorité MOYENNE

#### 3.1 Migration CDN → NPM (PERF-001)

**Actions:**
- [ ] Installer Firebase SDK: `npm install firebase`
- [ ] Remplacer imports CDN par imports NPM
- [ ] Bundler avec Vite
- [ ] Configurer tree-shaking

**Avant:**
```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
```

**Après:**
```javascript
import { initializeApp } from 'firebase/app';
```

#### 3.2 Code splitting (PERF-002)

**Actions:**
- [ ] Identifier points de split (routes, features lourdes)
- [ ] Implémenter dynamic imports
- [ ] Lazy load features secondaires
- [ ] Monitorer taille des bundles

**Exemple:**
```javascript
// Lazy load community (43KB)
const loadCommunity = () => import('./features/community/pages/community.js');
```

#### 3.3 Optimisation des requêtes Firestore (PERF-003)

**Actions:**
- [ ] Implémenter pagination cursor-based
- [ ] Créer indexes composites
- [ ] Dénormaliser données fréquentes
- [ ] Cacher données statiques

**Avant:**
```javascript
const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
```

**Après:**
```javascript
// Avec pagination
const q = query(
  collection(db, 'posts'),
  orderBy('createdAt', 'desc'),
  startAfter(lastDoc),
  limit(10)
);
```

#### 3.4 Cleanup des listeners (PERF-004)

**Actions:**
- [ ] Tracker tous les `onSnapshot`
- [ ] Appeler `unsubscribe()` au démontage
- [ ] Implémenter pattern cleanup

**Pattern:**
```javascript
let unsubscribe = null;

function setupListener() {
  unsubscribe = onSnapshot(query, (snapshot) => {
    // ...
  });
}

function cleanup() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
```

---

## 🔧 PHASE 4: QUALITÉ DU CODE (Semaines 4-5)

### Priorité MOYENNE

#### 4.1 Gestion d'erreurs cohérente (QUAL-001)

**Actions:**
- [ ] Standardiser try/catch
- [ ] Logger erreurs avec contexte
- [ ] Afficher messages user-friendly
- [ ] Supprimer catch blocks vides

**Pattern:**
```javascript
try {
  await riskyOperation();
} catch (error) {
  logError(error, 'context');
  showToast(getErrorMessage(error), 'error');
  throw error; // ou gérer gracieusement
}
```

#### 4.2 Extraction des constantes (QUAL-002)

**Actions:**
- [ ] Créer `src/app/shared/constants/`
- [ ] Extraire magic numbers
- [ ] Extraire magic strings
- [ ] Documenter constantes

**Fichier:** `src/app/shared/constants/index.js`
```javascript
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  QUIZZES: 'quizzes',
};

export const FILE_SIZE_LIMITS = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PDF_SIZE: 20 * 1024 * 1024,   // 20MB
};
```

#### 4.3 Refactoring des longues fonctions (QUAL-003)

**Actions:**
- [ ] Identifier fonctions > 30 lignes
- [ ] Décomposer en sous-fonctions
- [ ] Appliquer Single Responsibility Principle
- [ ] Améliorer lisibilité

**Cible:** `community.js` (585 lignes), fonctions setup

#### 4.4 Tests unitaires (QUAL-005)

**Actions:**
- [ ] Installer Vitest: `npm install -D vitest`
- [ ] Créer `tests/unit/`
- [ ] Tester services en priorité
- [ ] Viser 60%+ coverage

**Priorité tests:**
1. Services (quiz, auth, courses)
2. Utilities (validators, formatters)
3. Repositories (data access)

---

## 📈 PHASE 5: SCALABILITÉ (Semaines 5-6)

### Priorité MOYENNE

#### 5.1 Pagination (SCALE-001)

**Actions:**
- [ ] Implémenter pagination pour posts
- [ ] Implémenter pagination pour quiz results
- [ ] Implémenter pagination pour course files
- [ ] Ajouter UI "Load More"

#### 5.2 Optimisation real-time (SCALE-002)

**Actions:**
- [ ] Limiter listeners aux données visibles
- [ ] Implémenter virtual scrolling pour longues listes
- [ ] Considérer polling pour données non-critiques
- [ ] Monitorer coûts Firebase

#### 5.3 Indexes Firestore (SCALE-003)

**Actions:**
- [ ] Créer `firestore.indexes.json`
- [ ] Définir indexes composites
- [ ] Tester requêtes complexes
- [ ] Déployer indexes

**Exemple:**
```json
{
  "indexes": [
    {
      "collectionGroup": "community_posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tag", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### 5.4 Dénormalisation (SCALE-006)

**Actions:**
- [ ] Identifier données fréquemment jointes
- [ ] Dénormaliser author info dans posts
- [ ] Dénormaliser stats utilisateur
- [ ] Maintenir cohérence avec Cloud Functions

---

## 🚀 PHASE 6: FEATURES AVANCÉES (Semaines 6-8)

### Priorité BASSE

#### 6.1 TypeScript Migration

**Actions:**
- [ ] Installer TypeScript: `npm install -D typescript`
- [ ] Créer `tsconfig.json`
- [ ] Migrer fichier par fichier (.js → .ts)
- [ ] Définir types pour modèles

**Bénéfices:**
- Type safety
- Meilleur autocomplete
- Catch errors at build time
- Facilite refactoring

#### 6.2 Error Monitoring

**Actions:**
- [ ] Créer compte Sentry
- [ ] Installer SDK: `npm install @sentry/browser`
- [ ] Configurer DSN
- [ ] Tester error tracking

#### 6.3 Analytics

**Actions:**
- [ ] Setup Firebase Analytics
- [ ] Tracker événements clés (quiz complete, post create, etc.)
- [ ] Créer dashboard analytics
- [ ] Monitorer adoption features

#### 6.4 PWA Complète

**Actions:**
- [ ] Activer service worker (sw.js.disabled)
- [ ] Implémenter offline support
- [ ] Ajouter cache strategies
- [ ] Tester install prompt

#### 6.5 Tests E2E

**Actions:**
- [ ] Installer Playwright: `npm install -D @playwright/test`
- [ ] Écrire tests critiques (login, quiz, synthesis)
- [ ] Intégrer dans CI/CD
- [ ] Monitorer flakiness

---

## 📋 MIGRATIONS DE FICHIERS

### Mapping Ancien → Nouveau

| Fichier actuel | Nouvelle localisation | Priorité |
|----------------|----------------------|----------|
| `assets/js/config.js` | `src/app/core/services/firebase/` | 🔴 HAUTE |
| `assets/js/auth-guard.js` | `src/app/features/auth/services/` | 🔴 HAUTE |
| `assets/js/error-handler.js` | `src/app/core/services/` | 🔴 HAUTE |
| `assets/js/utils.js` | `src/app/shared/utils/` | 🔴 HAUTE |
| `assets/js/validation.js` | `src/app/shared/utils/` | 🔴 HAUTE |
| `assets/js/layout.js` | `src/app/shared/components/layout/` | 🔴 HAUTE |
| `assets/js/courses.js` | `src/app/features/courses/` | 🟠 MOYENNE |
| `assets/js/quizz.js` | `src/app/features/quiz/` | 🟠 MOYENNE |
| `assets/js/synthesize.js` | `src/app/features/synthesis/` | 🟠 MOYENNE |
| `assets/js/planning.js` | `src/app/features/planning/` | 🟠 MOYENNE |
| `assets/js/profile.js` | `src/app/features/profile/` | 🟠 MOYENNE |
| `assets/js/community.js` | `src/app/features/community/` | 🟡 COMPLEXE |
| `assets/js/gamification.js` | `src/app/features/gamification/` | 🟢 BASSE |
| `assets/js/onboarding.js` | `src/app/features/auth/pages/` | 🟢 BASSE |
| `assets/js/home.js` | `src/app/pages/` | 🟢 BASSE |

---

## 📊 MÉTRIQUES DE SUCCÈS

### Sécurité
- [ ] 0 vulnérabilités critiques
- [ ] 0 secrets exposés dans le repo
- [ ] 100% des inputs validés/sanitizés
- [ ] Firestore rules testées

### Performance
- [ ] Lighthouse score > 90
- [ ] FCP < 1.5s
- [ ] TTI < 3s
- [ ] Bundle size < 500KB (gzipped)

### Qualité
- [ ] 0 console.log en production
- [ ] 60%+ test coverage
- [ ] 0 erreurs ESLint
- [ ] Code review approuvé

### Architecture
- [ ] Séparation claire des layers
- [ ] Modularité (features isolées)
- [ ] Configuration externalisée
- [ ] Build system fonctionnel

---

## ⚠️ RISQUES & MITIGATION

### Risque: Breaking changes pendant migration

**Mitigation:**
- Travailler sur branche séparée
- Tester chaque phase
- Garder backup de l'ancien code
- Migration incrémentale

### Risque: Community.js trop complexe à refactorer

**Mitigation:**
- Allouer 2x temps estimé
- Créer tests avant refactoring
- Split en petits PRs
- Demander code review

### Risque: Coûts Firebase en hausse

**Mitigation:**
- Monitorer usage quotidiennement
- Implémenter caching
- Optimiser requêtes
- Setup alertes budgétaires

### Risque: Régression utilisateur

**Mitigation:**
- Tests E2E complets
- Beta testing avec users
- Rollback plan
- Monitoring erreurs

---

## 📅 TIMELINE DÉTAILLÉE

### Semaine 1: Critiques
- **Jour 1-2:** Firestore rules + Validation
- **Jour 3:** Suppression duplicates functions
- **Jour 4:** Suppression console.log
- **Jour 5:** Tests et validation

### Semaine 2: Architecture - Setup
- **Jour 1-2:** Setup Vite + env vars
- **Jour 3-4:** Structure folders + core services
- **Jour 5:** Tests build

### Semaine 3: Architecture - Features
- **Jour 1-2:** Migration auth
- **Jour 3:** Migration dashboard
- **Jour 4-5:** Migration courses + quiz

### Semaine 4: Architecture - Features (suite)
- **Jour 1-2:** Migration synthesis + planning
- **Jour 3-5:** Migration community (complexe)

### Semaine 5: Performance
- **Jour 1-2:** CDN → NPM + code splitting
- **Jour 3:** Optimisation Firestore
- **Jour 4-5:** Cleanup listeners + caching

### Semaine 6: Qualité
- **Jour 1-2:** Error handling + constantes
- **Jour 3-5:** Tests unitaires + refactoring

### Semaines 7-8: Scalabilité + Avancé
- **Semaine 7:** Pagination, indexes, dénormalisation
- **Semaine 8:** TypeScript prep, monitoring, tests E2E

---

## 🎓 APPRENTISSAGES & BEST PRACTICES

### À faire
✅ Séparer les concerns (UI, logique, data)
✅ Utiliser un bundler moderne
✅ Valider côté client ET serveur
✅ Externaliser la configuration
✅ Écrire des tests
✅ Documenter les décisions
✅ Monitorer les erreurs
✅ Optimiser dès le début

### À éviter
❌ Hardcoder les credentials
❌ Règles Firestore permissives
❌ Fichiers monolithiques (>500 lignes)
❌ Console.log en production
❌ Imports CDN en production
❌ Pas de tests
❌ Ignorer les performances
❌ Code dupliqué

---

## 🔗 RESSOURCES

### Documentation
- [Firebase Best Practices](https://firebase.google.com/docs/rules/rules-and-auth)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)

### Outils
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Bundle Analyzer](https://www.npmjs.com/package/rollup-plugin-visualizer)
- [Sentry](https://sentry.io/)
- [Firebase Console](https://console.firebase.google.com/)

---

## ✅ CHECKLIST DE PRODUCTION

Avant de déployer en production:

### Sécurité
- [ ] Firestore rules restrictives
- [ ] Storage rules restrictives
- [ ] Firebase App Check activé
- [ ] Domaines autorisés configurés
- [ ] Pas de secrets dans le code
- [ ] HTTPS forcé
- [ ] CORS configuré

### Performance
- [ ] Bundle optimisé (<500KB)
- [ ] Images optimisées
- [ ] Code splitting actif
- [ ] Cache configuré
- [ ] CDN pour assets statiques
- [ ] Service worker actif

### Qualité
- [ ] Tests passent (80%+ coverage)
- [ ] 0 erreurs ESLint
- [ ] 0 warnings console
- [ ] Lighthouse score > 90
- [ ] Cross-browser testé
- [ ] Mobile responsive

### Monitoring
- [ ] Sentry configuré
- [ ] Analytics configuré
- [ ] Alertes erreurs setup
- [ ] Budget Firebase alertes
- [ ] Uptime monitoring

### Documentation
- [ ] README à jour
- [ ] Variables env documentées
- [ ] Architecture documentée
- [ ] API documentée
- [ ] Guide contributeur

---

## 🚦 STATUT ACTUEL

**Phase en cours:** Phase 1 - Corrections critiques
**Dernière mise à jour:** 26 Décembre 2025
**Progression globale:** 5% (Analyse terminée)

---

**Notes:** Cette roadmap est un document vivant. Mettre à jour régulièrement avec les progrès et ajuster selon les retours utilisateurs et les contraintes découvertes.
