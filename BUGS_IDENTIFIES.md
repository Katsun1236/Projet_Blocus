# 🐛 Bugs Identifiés - Projet Blocus

## 🔴 CRITIQUE - Erreurs Firebase (Bloquent l'application)

### 1. Erreurs de Permissions Firestore
**Localisation :**
- `assets/js/layout.js:92` - `updateHeaderProfile()`
- `assets/js/community.js:110` - `subscribeToPosts()`
- `assets/js/profile.js:140` - `loadUserStats()`

**Erreur :**
```
FirebaseError: Missing or insufficient permissions
```

**Cause :** Règles Firestore non déployées sur Firebase
**Solution :** `firebase deploy --only firestore:rules`
**Statut :** 🔴 À corriger (priorité 1)

---

### 2. Erreurs de Permissions Storage
**Localisation :**
- Upload d'avatar utilisateur
- Upload de fichiers de cours

**Erreur :**
```
FirebaseError: User does not have permission to access this object
```

**Cause :** Règles Storage non déployées sur Firebase
**Solution :** `firebase deploy --only storage:rules`
**Statut :** 🔴 À corriger (priorité 1)

---

### 3. Erreur API Gemini (generateContent)
**Localisation :**
- Fonctions Firebase utilisant Gemini AI
- Génération de quiz/synthèses

**Erreur :**
```
POST https://us-central1-projet-blocus-v2.cloudfunctions.net/generateContent 400
```

**Cause :** Clé API Gemini non configurée dans Firebase Functions
**Solution :** `firebase functions:secrets:set GEMINI_API_KEY`
**Statut :** 🔴 À corriger (priorité 1)

---

## 🟡 IMPORTANT - Erreurs Fonctionnelles

### 4. Quiz Trouve 0 Cours
**Localisation :**
- Page Quiz : `assets/js/quiz.js`

**Erreur :**
```
Cours trouvés: 0
```

**Cause possible :**
- Collection `users/{userId}/courses` vide dans Firestore
- Requête Firestore mal configurée
- Problème de permissions (voir bug #1)

**À investiguer :**
- Vérifier si des cours existent dans Firestore
- Vérifier la requête dans `quiz.js`
- Vérifier les chemins de collection

**Statut :** 🟡 À investiguer (priorité 2)

---

### 5. Erreurs Upload Fichiers
**Localisation :**
- Upload de documents de cours
- Modification d'avatar

**Erreur :**
```
Storage permission denied
```

**Cause :** Lié au bug #2 (règles Storage)
**Solution :** Sera corrigé après déploiement des règles Storage
**Statut :** 🟡 En attente du fix #2

---

## 🟢 MINEUR - Avertissements Console

### 6. Warnings CSP (Content Security Policy)
**Localisation :**
- Console browser (répétitif)

**Avertissement :**
```
Refused to connect to 'https://...' because it violates the following Content Security Policy directive
```

**Cause :**
- Headers CSP trop restrictifs
- Scripts/ressources externes non autorisés

**Impact :** Visuel uniquement, pas de blocage fonctionnel
**Statut :** 🟢 À nettoyer (priorité 3)

---

## 📋 Plan d'Action

### Phase 1 : Déploiement Firebase (🔴 URGENT)
1. ✅ Installer Firebase CLI
2. ⏳ Se connecter : `firebase login`
3. ⏳ Déployer règles : `firebase deploy --only firestore:rules,storage:rules`
4. ⏳ Configurer Gemini : `firebase functions:secrets:set GEMINI_API_KEY`
5. ⏳ Déployer Functions : `firebase deploy --only functions`

### Phase 2 : Tests et Corrections (🟡)
1. ⏳ Tester permissions Firestore (bugs #1)
2. ⏳ Tester upload Storage (bug #2)
3. ⏳ Tester génération Gemini (bug #3)
4. ⏳ Investiguer quiz vide (bug #4)

### Phase 3 : Nettoyage (🟢)
1. ⏳ Nettoyer warnings CSP
2. ⏳ Tests complets de toutes les fonctionnalités
3. ⏳ Redéploiement Netlify

---

## 🔍 Détails Techniques

### Structure Firestore Attendue :
```
users/{userId}/
  ├── (document utilisateur)
  ├── courses/{courseId}
  ├── quizzes/{quizId}
  └── syntheses/{synthesisId}

community_posts/{postId}
groups/{groupId}
quiz_results/{resultId}
```

### Règles Firestore Actuelles :
- ✅ `/users/{userId}` → read si authentifié, write si propriétaire
- ✅ `/users/{userId}/courses` → read/write si propriétaire
- ✅ `/community_posts` → read si authentifié
- ✅ Toutes les règles sont correctes dans le code local

### Règles Storage Actuelles :
- ✅ `/users/{userId}/**` → read/write si propriétaire
- ✅ `/avatars/{userId}` → read public, write si propriétaire
- ✅ Validation : max 10MB pour fichiers, 2MB pour avatars
- ✅ Types autorisés : PDF et images

---

## 📞 Support

Si problèmes lors du déploiement :
1. Vérifier console Firebase : https://console.firebase.google.com/
2. Vérifier les logs Functions : Firebase Console → Functions → Logs
3. Vérifier Netlify deploy logs : https://app.netlify.com/

**Projet Firebase :** `projet-blocus-v2`
**Projet Netlify :** `projetblocus`
