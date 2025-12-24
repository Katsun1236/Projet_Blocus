# 🔧 Guide de Dépannage - Projet Blocus

Ce guide vous aide à résoudre les problèmes courants.

---

## 🚨 Erreur: Google Auth CSP (Content Security Policy)

### Symptôme

```
Refused to load the script 'https://apis.google.com/js/api.js'
because it violates the following Content Security Policy directive
```

**OU**

```
Erreur Auth Google: FirebaseError: Firebase: Error (auth/internal-error)
```

### Cause

Le Content Security Policy (CSP) bloque les scripts nécessaires à l'authentification Google.

### Solutions

#### ✅ Solution 1 : Utiliser le serveur de dev sans CSP (LOCAL)

Si tu testes **en local**, utilise le serveur Node.js fourni :

```bash
# Au lieu de python -m http.server ou npx http-server
npm start

# Ouvre http://localhost:8000
```

Ce serveur n'applique **PAS** de CSP, donc Google Auth fonctionnera.

⚠️ **IMPORTANT :** Ce serveur est UNIQUEMENT pour le développement. En production, utilise Netlify avec le CSP sécurisé.

#### ✅ Solution 2 : Redéployer sur Netlify (PRODUCTION)

Si l'erreur apparaît sur **Netlify** :

1. **Pull les dernières modifications** (le CSP a été corrigé)
   ```bash
   git pull origin claude/website-help-QSRVH
   ```

2. **Redéployer**
   ```bash
   netlify deploy --prod
   # OU attendre le déploiement auto depuis GitHub
   ```

3. **Vider le cache** du navigateur (Ctrl+Shift+R)

4. **Retester** l'auth Google

#### ✅ Solution 3 : Vérifier le CSP dans netlify.toml

Le `netlify.toml` doit contenir ces domaines :

```toml
Content-Security-Policy = "
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://cdn.tailwindcss.com
    https://cdnjs.cloudflare.com
    https://www.gstatic.com
    https://apis.google.com;  <!-- ✅ Requis pour Google Auth -->

  connect-src 'self'
    https://*.firebaseio.com
    https://*.googleapis.com
    https://identitytoolkit.googleapis.com  <!-- ✅ Firebase Auth API -->
    https://securetoken.googleapis.com      <!-- ✅ Tokens -->
    https://accounts.google.com             <!-- ✅ Google Auth -->
    wss://*.firebaseio.com;

  frame-src 'self'
    https://accounts.google.com             <!-- ✅ Popup Google -->
    https://*.firebaseapp.com;              <!-- ✅ iframes Firebase -->
"
```

---

## 🔥 Erreur: Firebase Configuration

### Symptôme

```
FirebaseError: Firebase: Error (auth/invalid-api-key)
```

**OU**

```
Firebase is not initialized
```

### Cause

Credentials Firebase manquants ou invalides dans `assets/js/config.js`

### Solution

1. **Aller sur** [Firebase Console](https://console.firebase.google.com)

2. **Sélectionner** ton projet

3. **Project Settings** → **Your apps** → **Web app**

4. **Copier** la config Firebase

5. **Coller** dans `assets/js/config.js` :

```javascript
const firebaseConfig = {
    apiKey: "TON_API_KEY",
    authDomain: "ton-projet.firebaseapp.com",
    projectId: "ton-projet",
    storageBucket: "ton-projet.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

6. **Ne jamais commit** ces credentials (déjà dans `.gitignore`)

---

## 📱 Erreur: PWA ne s'installe pas

### Symptôme

Le bouton "Installer l'app" n'apparaît pas

### Causes possibles

1. **HTTPS requis** - PWA nécessite HTTPS (sauf localhost)
2. **Service Worker non enregistré**
3. **Manifest invalide**

### Solutions

#### ✅ Vérifier HTTPS

PWA fonctionne UNIQUEMENT sur :
- `https://` (production)
- `http://localhost` (dev)
- `http://127.0.0.1` (dev)

❌ **Ne fonctionnera PAS** sur `http://192.168.x.x` ou HTTP normal

#### ✅ Tester le Service Worker

1. Ouvrir DevTools (F12)
2. Onglet **Application** → **Service Workers**
3. Vérifier que `sw.js` est activé

Si erreur, check la console pour les détails.

#### ✅ Valider le Manifest

1. DevTools → **Application** → **Manifest**
2. Vérifier que toutes les propriétés sont présentes
3. Vérifier que les icônes sont accessibles

---

## 🌐 Erreur: CORS (Cross-Origin)

### Symptôme

```
CORS policy: No 'Access-Control-Allow-Origin' header
```

### Cause

Requêtes bloquées par la politique CORS

### Solution

#### ✅ Pour Firebase

Firebase gère automatiquement CORS. Si erreur :

1. Vérifier que l'URL Firebase est correcte
2. Vérifier les règles Firestore/Storage
3. Vérifier que le domaine est autorisé dans Firebase Console → Authentication → Settings → Authorized domains

#### ✅ Pour APIs externes

Utiliser Firebase Functions comme proxy :

```javascript
// Dans Firebase Functions
exports.proxyAPI = functions.https.onRequest(async (req, res) => {
    const response = await fetch('https://api-externe.com/data');
    const data = await response.json();
    res.json(data);
});
```

---

## 🐛 Erreur: Console Warnings

### Symptôme

Warnings dans la console (pas d'erreurs critiques)

### Types courants

#### 1. **Tailwind CSS warnings**

```
Some utility class is not recognized
```

**Solution :** Utiliser le CDN Tailwind (déjà configuré) ou construire localement

#### 2. **Firebase deprecation warnings**

```
This method is deprecated, use X instead
```

**Solution :** Mettre à jour vers les nouvelles méthodes (voir Firebase docs)

#### 3. **Service Worker cache warnings**

```
Cache quota exceeded
```

**Solution :** Le SW nettoie automatiquement les vieux caches, rien à faire

---

## 💾 Erreur: LocalStorage Full

### Symptôme

```
QuotaExceededError: DOM Exception 22
```

### Cause

LocalStorage limité à ~5-10MB selon le navigateur

### Solution

1. **Vider localStorage**
   ```javascript
   localStorage.clear()
   ```

2. **Utiliser IndexedDB** pour grandes données (TODO: à implémenter)

3. **Nettoyer régulièrement**
   ```javascript
   // Dans assets/js/utils.js
   function cleanOldData() {
       const keys = Object.keys(localStorage);
       keys.forEach(key => {
           if (key.startsWith('temp_')) {
               localStorage.removeItem(key);
           }
       });
   }
   ```

---

## 🖼️ Images ne chargent pas

### Symptôme

Images cassées (icône cassée ou 404)

### Solutions

#### ✅ Vérifier le chemin

Chemins relatifs depuis le fichier HTML actuel :

```html
<!-- ✅ BON (depuis pages/app/dashboard.html) -->
<img src="../../assets/images/logo.png">

<!-- ❌ MAUVAIS -->
<img src="/assets/images/logo.png">  <!-- Peut ne pas marcher en local -->
```

#### ✅ Vérifier le nom de fichier

- Pas d'espaces (utiliser `-` ou `_`)
- Extensions en minuscules (`.png` pas `.PNG`)
- Caractères spéciaux évités

#### ✅ Optimiser en WebP

```bash
npm run optimize:images
```

---

## 🔐 Problèmes d'authentification

### Email/Password ne fonctionne pas

1. **Vérifier Firebase Auth activé**
   - Console Firebase → Authentication → Sign-in method
   - Email/Password doit être **enabled**

2. **Vérifier validation email**
   - Format email correct
   - Password minimum 8 caractères (voir `validation.js`)

### Google Auth ne fonctionne pas

Voir section CSP au début de ce guide

### Déconnexion automatique

**Cause :** Token expiré ou session perdue

**Solution :** Utiliser `onAuthStateChanged` pour gérer automatiquement :

```javascript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Utilisateur connecté
    } else {
        // Rediriger vers login
        window.location.href = '/pages/auth/login.html';
    }
});
```

---

## 📊 Analytics ne fonctionnent pas

### Données vides dans dashboard

**Causes :**
1. Pas encore de données collectées
2. Utilisateur nouveau
3. Erreurs Firestore

**Solutions :**

1. **Vérifier les règles Firestore**
   ```javascript
   // firestore.rules
   match /users/{userId} {
       allow read, write: if request.auth.uid == userId;
   }
   ```

2. **Tester avec données de test**
   ```javascript
   // Dans console
   await updateDoc(doc(db, 'users', userId), {
       quizzesCompleted: 10,
       studyHours: 5
   });
   ```

---

## 🚀 Déploiement Netlify

### Build fails

**Erreur courante :**
```
npm run build:css failed
```

**Solution :** Vérifier que `tailwindcss` est dans `devDependencies`

```json
"devDependencies": {
    "tailwindcss": "^3.4.1"
}
```

### Headers non appliqués

**Vérifier `netlify.toml`** est à la racine du projet

### Redirects ne fonctionnent pas

**Vérifier `_redirects`** OU utiliser `netlify.toml` (pas les deux)

---

## 📞 Obtenir de l'aide

Si le problème persiste :

1. **Vérifier les issues GitHub** : [Issues existantes](https://github.com/Katsun1236/Projet_Blocus/issues)

2. **Ouvrir une nouvelle issue** avec :
   - Description du problème
   - Étapes de reproduction
   - Messages d'erreur (screenshot de la console)
   - Navigateur et version
   - Environnement (local/Netlify)

3. **Consulter la documentation** :
   - [Firebase Docs](https://firebase.google.com/docs)
   - [Tailwind Docs](https://tailwindcss.com/docs)
   - [PWA Guide](https://web.dev/progressive-web-apps/)

---

**Dernière mise à jour :** 24 décembre 2024
