# 🚀 PLAN D'ACTION COMPLET - PROJET BLOCUS V2

> **Date :** 27 décembre 2025
> **Objectif :** Débloquer le projet, corriger tous les bugs, améliorer et préparer pour app mobile

---

## 📋 TABLE DES MATIÈRES

1. [Phase 1 : Déblocage Immédiat (30 min)](#phase-1--déblocage-immédiat-30-min)
2. [Phase 2 : Tests & Validation (2-3 jours)](#phase-2--tests--validation-2-3-jours)
3. [Phase 3 : Optimisations & Améliorations (1 semaine)](#phase-3--optimisations--améliorations-1-semaine)
4. [Phase 4 : Migration App Mobile (1 semaine)](#phase-4--migration-app-mobile-1-semaine)
5. [Phase 5 : Production & Lancement (ongoing)](#phase-5--production--lancement-ongoing)

---

## 🔥 PHASE 1 : DÉBLOCAGE IMMÉDIAT (30 min)

**Objectif :** Corriger les 3 bugs critiques qui bloquent 90% des fonctionnalités.

### Étape 1.1 : Déployer les Règles Firestore (5 min)

**Sur ton terminal Windows :**

```cmd
cd C:\Users\basti\OneDrive\Documents\GitHub\Projet_Blocus

firebase deploy --only firestore:rules
```

**Résultat attendu :**
```
✔ firestore: released rules firestore.rules to cloud.firestore
✔ Deploy complete!
```

**Ce que ça débloque :**
- ✅ Lecture/écriture documents users
- ✅ Posts communautaires
- ✅ Groupes et chats
- ✅ Profils utilisateurs
- ✅ Quiz results
- ✅ Événements planning
- ✅ Forum et discussions
- ✅ Friendships
- ✅ Rapports bugs

---

### Étape 1.2 : Déployer les Règles Storage (5 min)

```cmd
firebase deploy --only storage
```

**Résultat attendu :**
```
✔ storage: released rules storage.rules to firebase.storage
✔ Deploy complete!
```

**Ce que ça débloque :**
- ✅ Upload d'avatar
- ✅ Upload de cours (PDF, images)
- ✅ Upload de fichiers dans groupes
- ✅ Stockage documents

---

### Étape 1.3 : Configurer la Clé API Gemini (10 min)

#### A. Obtenir une clé API Gemini

1. Va sur : https://makersuite.google.com/app/apikey
2. Connecte-toi avec ton compte Google
3. Clique sur "Create API Key"
4. Copie la clé (format : `AIza...`)

#### B. Configurer le secret Firebase

```cmd
firebase functions:secrets:set GEMINI_API_KEY
```

Quand demandé, colle ta clé API et appuie sur Entrée.

**Résultat attendu :**
```
✔ Created a new secret version projects/.../secrets/GEMINI_API_KEY
```

---

### Étape 1.4 : Déployer les Cloud Functions (10 min)

```cmd
firebase deploy --only functions
```

**⚠️ Attention :** Cette étape peut prendre 2-5 minutes.

**Résultat attendu :**
```
✔ functions[generateContent(us-central1)]: Successful update operation.
✔ Deploy complete!
```

**Ce que ça débloque :**
- ✅ Génération de quiz AI
- ✅ Génération de synthèses AI
- ✅ Fonctionnalités Gemini

---

### Étape 1.5 : Vérification Post-Déploiement (5 min)

#### Vérifier dans la Console Firebase

**1. Firestore Rules :**
```
https://console.firebase.google.com/project/projet-blocus-v2/firestore/rules
```
- Statut : "Publié"
- Dernière modification : Aujourd'hui

**2. Storage Rules :**
```
https://console.firebase.google.com/project/projet-blocus-v2/storage/rules
```
- Statut : "Publié"
- Dernière modification : Aujourd'hui

**3. Functions :**
```
https://console.firebase.google.com/project/projet-blocus-v2/functions
```
- Fonction `generateContent` : État "Healthy"
- Dernière modification : Aujourd'hui

---

### ✅ Checklist Phase 1

- [ ] Règles Firestore déployées
- [ ] Règles Storage déployées
- [ ] Clé API Gemini obtenue
- [ ] Secret GEMINI_API_KEY configuré
- [ ] Cloud Functions déployées
- [ ] Vérifications console Firebase OK

**Temps total :** ~30 minutes

**Une fois terminé :** Passe à la Phase 2

---

## 🧪 PHASE 2 : TESTS & VALIDATION (2-3 jours)

**Objectif :** Tester toutes les fonctionnalités, identifier et corriger les bugs restants.

### Étape 2.1 : Tests Authentification (30 min)

#### Test 1 : Inscription
1. Aller sur `/pages/auth/register.html`
2. Créer un nouveau compte (email unique)
3. ✅ Vérifier : Email de vérification reçu
4. ✅ Vérifier : Document user créé dans Firestore
5. ✅ Vérifier : Redirection vers onboarding

#### Test 2 : Connexion
1. Aller sur `/pages/auth/login.html`
2. Se connecter avec email/password
3. ✅ Vérifier : Redirection vers dashboard
4. ✅ Vérifier : Profil s'affiche dans header

#### Test 3 : Google OAuth
1. Tester connexion Google
2. ✅ Vérifier : Popup Google s'ouvre
3. ✅ Vérifier : Document user créé
4. ✅ Vérifier : Redirection dashboard

#### Test 4 : Onboarding
1. Compléter onboarding
2. ✅ Vérifier : Données sauvegardées dans Firestore
3. ✅ Vérifier : Avatar uploadé (si choisi)

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.2 : Tests Dashboard (30 min)

1. Aller sur `/pages/app/dashboard.html`
2. ✅ Vérifier : Message de bienvenue s'affiche
3. ✅ Vérifier : Stats utilisateur chargées
4. ✅ Vérifier : Notifications s'affichent
5. ✅ Vérifier : Navigation sidebar fonctionne
6. ✅ Vérifier : Badges achievements visibles

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.3 : Tests Upload & Cours (1 heure)

#### Test 1 : Upload de Cours
1. Aller sur `/pages/app/courses.html`
2. Uploader un PDF (< 10 MB)
3. ✅ Vérifier : Barre de progression
4. ✅ Vérifier : Fichier dans Storage
5. ✅ Vérifier : Document dans Firestore `/users/{uid}/courses`
6. ✅ Vérifier : Fichier s'affiche dans la liste

#### Test 2 : Upload d'Image
1. Uploader une image (JPG/PNG)
2. ✅ Vérifier : Acceptance type correct
3. ✅ Vérifier : Upload réussi
4. ✅ Vérifier : Prévisualisation

#### Test 3 : Organisation Dossiers
1. Créer un dossier "Math"
2. Uploader un fichier dedans
3. ✅ Vérifier : Fichier dans le bon dossier
4. ✅ Vérifier : Navigation breadcrumbs

#### Test 4 : Recherche & Filtres
1. Rechercher un fichier par nom
2. Filtrer par type (PDF/Image)
3. Trier par date/nom
4. ✅ Vérifier : Résultats corrects

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.4 : Tests Quiz AI (1 heure)

#### Test 1 : Quiz depuis Topic
1. Aller sur `/pages/app/quiz.html`
2. Créer nouveau quiz
3. Source : "Topic libre"
4. Entrer : "La Révolution Française"
5. 10 questions, type MCQ
6. Cliquer "Générer"
7. ✅ Vérifier : Loading s'affiche
8. ✅ Vérifier : Quiz généré (10 questions)
9. ✅ Vérifier : Questions pertinentes
10. ✅ Vérifier : Options multiples
11. ✅ Vérifier : Réponses correctes valides

#### Test 2 : Quiz depuis Synthèse
1. Source : "Synthèse"
2. ✅ Vérifier : Liste synthèses chargée
3. Sélectionner une synthèse
4. Générer quiz
5. ✅ Vérifier : Questions basées sur synthèse

#### Test 3 : Quiz depuis Cours
1. Source : "Cours uploadé"
2. ✅ Vérifier : Liste cours chargée
3. Sélectionner un cours PDF
4. Générer quiz
5. ✅ Vérifier : Questions basées sur PDF

#### Test 4 : Player de Quiz
1. Répondre à toutes les questions
2. ✅ Vérifier : Feedback immédiat (correct/incorrect)
3. ✅ Vérifier : Explication affichée
4. ✅ Vérifier : Bonne réponse surlignée
5. ✅ Vérifier : Progression mise à jour
6. ✅ Vérifier : Score final calculé
7. ✅ Vérifier : Résultat sauvegardé dans Firestore

#### Test 5 : Historique Quiz
1. Aller sur dashboard quiz
2. ✅ Vérifier : Derniers quiz affichés
3. ✅ Vérifier : Scores corrects
4. ✅ Vérifier : Dates correctes

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.5 : Tests Synthèse AI (1 heure)

#### Test 1 : Synthèse depuis Topic
1. Aller sur `/pages/app/synthesize.html`
2. Source : "Topic"
3. Entrer : "Le photosynthèse"
4. Format : "Résumé"
5. Longueur : "Moyen"
6. Générer
7. ✅ Vérifier : Synthèse générée
8. ✅ Vérifier : Contenu pertinent
9. ✅ Vérifier : Longueur appropriée

#### Test 2 : Synthèse depuis Texte
1. Source : "Texte"
2. Coller un long texte
3. Format : "Flashcards"
4. Générer
5. ✅ Vérifier : Flashcards générées
6. ✅ Vérifier : Questions/réponses pertinentes

#### Test 3 : Synthèse depuis Fichier
1. Source : "Fichier"
2. Sélectionner un cours PDF
3. Format : "Plan"
4. Générer
5. ✅ Vérifier : Plan structuré généré
6. ✅ Vérifier : Hiérarchie logique

#### Test 4 : Autres Formats
1. Tester format "Glossaire"
2. ✅ Vérifier : Termes clés extraits
3. ✅ Vérifier : Définitions correctes

#### Test 5 : Sauvegarde & Historique
1. Sauvegarder synthèse
2. ✅ Vérifier : Document dans Firestore
3. Voir historique
4. ✅ Vérifier : Synthèses listées
5. Supprimer une synthèse
6. ✅ Vérifier : Suppression OK

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.6 : Tests Communauté (1 heure)

#### Test 1 : Créer un Post
1. Aller sur `/pages/app/community.html`
2. Créer un nouveau post
3. Ajouter texte, tags
4. Publier
5. ✅ Vérifier : Post dans Firestore `/community_posts`
6. ✅ Vérifier : Post s'affiche dans le fil

#### Test 2 : Interactions Posts
1. Liker un post
2. ✅ Vérifier : Like count +1
3. ✅ Vérifier : Icône cœur rempli
4. Unliker
5. ✅ Vérifier : Like count -1

#### Test 3 : Commentaires
1. Commenter un post
2. ✅ Vérifier : Commentaire sauvegardé
3. ✅ Vérifier : Commentaire s'affiche
4. Supprimer commentaire
5. ✅ Vérifier : Suppression OK

#### Test 4 : Filtres
1. Filtrer par type (Question/Partage)
2. ✅ Vérifier : Filtres fonctionnent
3. Rechercher par mot-clé
4. ✅ Vérifier : Résultats pertinents

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.7 : Tests Groupes (1 heure)

#### Test 1 : Créer un Groupe
1. Créer groupe "Groupe Test"
2. Définir visibilité (public/privé)
3. Ajouter description
4. ✅ Vérifier : Groupe créé dans Firestore
5. ✅ Vérifier : User = owner

#### Test 2 : Rejoindre un Groupe
1. Avec un autre compte, rejoindre le groupe
2. ✅ Vérifier : User ajouté aux members
3. ✅ Vérifier : Permissions correctes

#### Test 3 : Chat Groupe
1. Envoyer un message dans le groupe
2. ✅ Vérifier : Message sauvegardé
3. ✅ Vérifier : Message visible par membres
4. ✅ Vérifier : Temps réel (onSnapshot)

#### Test 4 : Partage Fichiers
1. Uploader un fichier dans le groupe
2. ✅ Vérifier : Fichier dans Storage
3. ✅ Vérifier : Document dans `/groups/{id}/files`
4. ✅ Vérifier : Fichier visible par membres

#### Test 5 : Rôles & Permissions
1. Créer un rôle "Modérateur"
2. Assigner permissions
3. Assigner rôle à un membre
4. ✅ Vérifier : Permissions appliquées
5. Tester suppression message (mod only)
6. ✅ Vérifier : RBAC fonctionne

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.8 : Tests Profil (30 min)

#### Test 1 : Voir Profil
1. Aller sur `/pages/app/profile.html`
2. ✅ Vérifier : Infos affichées
3. ✅ Vérifier : Stats (fichiers, quiz, posts, points)
4. ✅ Vérifier : Badges visibles

#### Test 2 : Modifier Profil
1. Cliquer "Éditer profil"
2. Modifier bio, firstName, lastName
3. Sauvegarder
4. ✅ Vérifier : Firestore mis à jour
5. ✅ Vérifier : Changements visibles

#### Test 3 : Upload Avatar
1. Uploader nouvelle photo
2. ✅ Vérifier : Storage upload
3. ✅ Vérifier : photoURL mis à jour
4. ✅ Vérifier : Avatar dans header changé

#### Test 4 : Achievements
1. Vérifier badges
2. ✅ Vérifier : Conditions d'obtention
3. Déclencher un badge (ex: créer 5 posts → "Social")
4. ✅ Vérifier : Badge ajouté

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.9 : Tests Planning (30 min)

1. Aller sur `/pages/app/planning.html`
2. Créer un événement
3. ✅ Vérifier : Événement sauvegardé
4. ✅ Vérifier : Calendrier mis à jour
5. Supprimer événement
6. ✅ Vérifier : Suppression OK

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.10 : Tests Chat (30 min)

1. Aller sur `/pages/app/chat-list.html`
2. Démarrer conversation avec un user
3. ✅ Vérifier : Chat créé dans Firestore
4. Envoyer message
5. ✅ Vérifier : Message sauvegardé
6. ✅ Vérifier : Réception temps réel
7. Supprimer message
8. ✅ Vérifier : Suppression OK

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.11 : Tests Forum (30 min)

1. Aller sur `/pages/app/forum.html`
2. Créer discussion
3. ✅ Vérifier : Discussion sauvegardée
4. Répondre à discussion
5. ✅ Vérifier : Réponse sauvegardée
6. ✅ Vérifier : Fil de discussion affiché

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.12 : Tests Amis (30 min)

1. Aller sur `/pages/app/friends.html`
2. Ajouter un ami
3. ✅ Vérifier : Friendship créée
4. ✅ Vérifier : État "pending"
5. Accepter demande (autre compte)
6. ✅ Vérifier : État "accepted"
7. Retirer ami
8. ✅ Vérifier : Friendship supprimée

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### Étape 2.13 : Tests Admin (30 min)

1. Aller sur `/pages/admin/panel.html`
2. Vérifier accès (admin only)
3. ✅ Vérifier : Non-admins bloqués
4. Tester modération
5. ✅ Vérifier : Fonctions admin

**Bugs identifiés :** _______________

**Actions correctives :** _______________

---

### ✅ Checklist Phase 2

- [ ] Tests authentification OK
- [ ] Tests dashboard OK
- [ ] Tests upload/cours OK
- [ ] Tests quiz AI OK
- [ ] Tests synthèse AI OK
- [ ] Tests communauté OK
- [ ] Tests groupes OK
- [ ] Tests profil OK
- [ ] Tests planning OK
- [ ] Tests chat OK
- [ ] Tests forum OK
- [ ] Tests amis OK
- [ ] Tests admin OK
- [ ] Tous bugs identifiés corrigés
- [ ] Documentation bugs mise à jour

**Temps total :** 2-3 jours (selon bugs trouvés)

**Une fois terminé :** Passe à la Phase 3

---

## ⚡ PHASE 3 : OPTIMISATIONS & AMÉLIORATIONS (1 semaine)

**Objectif :** Améliorer performance, UX, et préparer pour production.

### Étape 3.1 : Gestion d'Erreurs (1 jour)

#### Actions
1. Ajouter try-catch partout
2. Messages d'erreur user-friendly
3. Toast notifications pour erreurs
4. Logging dans console (dev uniquement)
5. Fallbacks pour données manquantes

#### Fichiers à modifier
- Tous les modules `assets/js/*.js`
- Wrapper global d'erreurs

#### Code exemple
```javascript
// Avant
const userDoc = await getDoc(doc(db, 'users', userId));

// Après
try {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    showToast("Utilisateur introuvable", "error");
    return null;
  }
  return userDoc.data();
} catch (error) {
  console.error("Erreur chargement user:", error);
  showToast("Erreur de chargement. Réessayez.", "error");
  return null;
}
```

---

### Étape 3.2 : Loading States (1 jour)

#### Actions
1. Ajouter spinners partout
2. Skeleton screens pour listes
3. Disable buttons pendant operations
4. Progress bars pour uploads

#### Composants à créer
- `Spinner.js` - Spinner réutilisable
- `Skeleton.js` - Skeleton loader
- `ProgressBar.js` - Barre progression

---

### Étape 3.3 : Optimisation Performance (1 jour)

#### Actions
1. **Lazy loading images**
   ```javascript
   <img loading="lazy" src="..." />
   ```

2. **Debounce recherche**
   ```javascript
   const debouncedSearch = debounce(search, 300);
   ```

3. **Pagination Firestore**
   ```javascript
   const q = query(collection(db, 'posts'),
     orderBy('createdAt', 'desc'),
     limit(20),
     startAfter(lastVisible)
   );
   ```

4. **Cache Firebase**
   - Activer cache local Firestore
   - Service worker pour offline

5. **Bundle optimization**
   - Tree-shaking
   - Code splitting amélioré

---

### Étape 3.4 : Migration Architecture Unifiée (2 jours)

#### Objectif
Migrer tous les modules `assets/js` vers `src/app` pour architecture cohérente.

#### Structure cible
```
src/app/
  ├── core/
  │   ├── services/
  │   │   ├── authService.js
  │   │   ├── firestoreService.js
  │   │   ├── storageService.js
  │   │   └── aiService.js (Gemini)
  │   └── config/
  │       ├── firebase.config.js
  │       └── env.js
  ├── features/
  │   ├── auth/
  │   ├── courses/
  │   ├── quiz/
  │   ├── synthesis/
  │   ├── community/
  │   ├── groups/
  │   ├── profile/
  │   └── ...
  └── shared/
      ├── components/
      ├── utils/
      └── constants/
```

#### Migration Steps
1. Créer services centralisés
2. Migrer module par module
3. Tester après chaque migration
4. Supprimer anciens fichiers

---

### Étape 3.5 : PWA Offline Support (1 jour)

#### Actions
1. **Activer Service Worker**
   - Fichier : `public/sw.js`
   - Cache stratégies

2. **Manifest.json**
   - Déjà existant, vérifier config

3. **Offline UI**
   - Afficher message "Hors ligne"
   - Queue operations Firestore

4. **Cache assets**
   - CSS, JS, images
   - Fonts, icônes

---

### Étape 3.6 : Tests Unitaires (1 jour)

#### Framework : Vitest (déjà installé)

#### Tests à écrire
```javascript
// tests/services/authService.test.js
describe('AuthService', () => {
  it('should register user with email/password', async () => {
    const user = await authService.registerWithEmail(
      'test@example.com',
      'password123',
      { firstName: 'Test', lastName: 'User' }
    );
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});

// tests/utils/validators.test.js
describe('Validators', () => {
  it('should validate email correctly', () => {
    expect(Validators.email('test@example.com')).toBe(null);
    expect(Validators.email('invalid')).toBe('Email invalide');
  });
});
```

#### Run tests
```bash
npm run test
```

---

### ✅ Checklist Phase 3

- [ ] Gestion d'erreurs partout
- [ ] Loading states ajoutés
- [ ] Performance optimisée
- [ ] Architecture migrée vers `src/`
- [ ] PWA offline support activé
- [ ] Tests unitaires écrits
- [ ] Documentation mise à jour

**Temps total :** ~1 semaine

**Une fois terminé :** Passe à la Phase 4

---

## 📱 PHASE 4 : MIGRATION APP MOBILE (1 semaine)

**Objectif :** Transformer le site web en app mobile native (Android + iOS).

### Étape 4.1 : Installation Capacitor (1 heure)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

**Configurations :**
- App Name : "Projet Blocus"
- App ID : `com.projetblocus.app`
- Web Dir : `dist`

---

### Étape 4.2 : Ajouter Plateformes (30 min)

```bash
# Android
npx cap add android

# iOS (macOS uniquement)
npx cap add ios
```

---

### Étape 4.3 : Configuration Mobile (1 jour)

#### Plugins Capacitor
```bash
npm install @capacitor/camera
npm install @capacitor/filesystem
npm install @capacitor/push-notifications
npm install @capacitor/share
npm install @capacitor/app
npm install @capacitor/splash-screen
npm install @capacitor/status-bar
```

#### Configuration
- `android/app/src/main/AndroidManifest.xml`
- `ios/App/App/Info.plist`
- Permissions caméra, stockage, notifications

---

### Étape 4.4 : Adaptations UI Mobile (2 jours)

#### Responsive Design
1. Vérifier toutes les pages mobile-first
2. Ajuster breakpoints Tailwind
3. Touch-friendly buttons (min 44x44px)
4. Swipe gestures
5. Bottom navigation (optional)

#### Mobile-specific Features
1. Camera pour upload photos
2. Push notifications
3. Share API natif
4. Splash screen
5. Status bar styling

---

### Étape 4.5 : Build Android (1 jour)

```bash
npm run build
npx cap sync
npx cap open android
```

**Dans Android Studio :**
1. Build > Generate Signed Bundle/APK
2. Créer keystore
3. Build APK de production

**Test :**
- Installer APK sur appareil Android
- Tester toutes fonctionnalités

---

### Étape 4.6 : Build iOS (1 jour - macOS requis)

```bash
npm run build
npx cap sync
npx cap open ios
```

**Dans Xcode :**
1. Configurer signing
2. Build pour device
3. Archive > Distribute

**Test :**
- TestFlight
- Installer sur iPhone

---

### Étape 4.7 : Publication Stores (1-2 jours)

#### Google Play Store
1. Créer compte développeur ($25 one-time)
2. Remplir fiche app
3. Screenshots, description
4. Upload AAB
5. Review (2-7 jours)

#### Apple App Store
1. Apple Developer account ($99/an)
2. App Store Connect
3. Screenshots, description
4. Upload IPA
5. Review (1-3 jours)

---

### ✅ Checklist Phase 4

- [ ] Capacitor installé et configuré
- [ ] Plateformes Android + iOS ajoutées
- [ ] Plugins natifs installés
- [ ] UI adaptée mobile
- [ ] Build Android réussi
- [ ] Build iOS réussi (si macOS)
- [ ] Tests sur appareils physiques
- [ ] APK/IPA signés
- [ ] Soumis aux stores
- [ ] Apps approuvées et publiées

**Temps total :** ~1 semaine

**Une fois terminé :** Passe à la Phase 5

---

## 🚀 PHASE 5 : PRODUCTION & LANCEMENT (ongoing)

### Étape 5.1 : Monitoring & Analytics

#### Firebase Analytics
```javascript
import { analytics } from './config.js';
import { logEvent } from 'firebase/analytics';

// Track events
logEvent(analytics, 'quiz_generated', {
  topic: 'Math',
  questions: 10
});
```

#### Error Tracking (Sentry)
```bash
npm install @sentry/browser
```

```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

---

### Étape 5.2 : Performance Monitoring

#### Firebase Performance
```javascript
import { performance } from './config.js';
import { trace } from 'firebase/performance';

const t = trace(performance, 'quiz_generation');
t.start();
// ... code ...
t.stop();
```

---

### Étape 5.3 : SEO & Metadata

#### Meta Tags
```html
<meta name="description" content="Plateforme d'étude avec IA" />
<meta property="og:title" content="Projet Blocus" />
<meta property="og:image" content="..." />
```

#### Sitemap
Générer `sitemap.xml` pour référencement.

---

### Étape 5.4 : Marketing & Lancement

1. **Beta Testing**
   - Recruter 20-50 beta testers
   - Feedback & corrections

2. **Landing Page**
   - Optimiser `/index.html`
   - Call-to-action clair
   - Démo vidéo

3. **Réseaux Sociaux**
   - Posts de lancement
   - Démos features
   - Témoignages users

4. **PR & Communication**
   - Articles blogs
   - Product Hunt
   - Reddit r/web_design, r/Firebase

---

### Étape 5.5 : Support & Maintenance

1. **Documentation User**
   - Guide d'utilisation
   - FAQ
   - Tutoriels vidéo

2. **Support Client**
   - Email support
   - Chat in-app (optionnel)
   - Bug report système

3. **Updates Régulières**
   - Nouvelles fonctionnalités
   - Corrections bugs
   - Améliorations UX

---

### ✅ Checklist Phase 5

- [ ] Analytics activées
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] SEO optimisé
- [ ] Beta testing effectué
- [ ] Landing page optimisée
- [ ] Lancement sur réseaux sociaux
- [ ] Documentation user créée
- [ ] Support client en place
- [ ] Plan updates défini

---

## 📊 RÉCAPITULATIF TIMELINE

| Phase | Durée | Tâches Principales | Statut |
|-------|-------|-------------------|--------|
| **Phase 1** | 30 min | Déblocage bugs critiques | ⏳ À faire |
| **Phase 2** | 2-3 jours | Tests complets + corrections | ⏳ À faire |
| **Phase 3** | 1 semaine | Optimisations + PWA | ⏳ À faire |
| **Phase 4** | 1 semaine | App mobile (Capacitor) | ⏳ À faire |
| **Phase 5** | Ongoing | Production + lancement | ⏳ À faire |

**TOTAL :** ~3-4 semaines pour projet 100% prêt + app mobile publiée

---

## 🎯 PRIORITÉS

### 🔴 Urgent (Aujourd'hui)
1. Déployer Firestore rules
2. Déployer Storage rules
3. Configurer Gemini API

### 🟡 Important (Cette semaine)
1. Tests complets
2. Corrections bugs
3. Améliorer UX

### 🟢 Souhaitable (Prochaines semaines)
1. Optimisations
2. App mobile
3. Lancement production

---

## 💡 CONSEIL FINAL

**Commence par Phase 1 (30 min) MAINTENANT.**

Une fois les 3 bugs critiques corrigés, ton app sera 100% fonctionnelle et tu pourras tester, améliorer, et migrer vers mobile sereinement.

**Bonne chance ! 🚀**
