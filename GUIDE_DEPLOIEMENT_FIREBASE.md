# Guide de Déploiement Firebase - Projet Blocus

## 🔥 Étape 1 : Connexion à Firebase CLI

### Si Firebase CLI n'est pas installé :
```bash
npm install -g firebase-tools
```

### Connexion à votre compte Firebase :
```bash
firebase login
```
- Une fenêtre de navigateur va s'ouvrir
- Connectez-vous avec votre compte Google lié au projet Firebase
- Autorisez l'accès

### Vérifier que vous êtes connecté au bon projet :
```bash
firebase use
```
Devrait afficher : `Active Project: projet-blocus-v2`

Si ce n'est pas le bon projet :
```bash
firebase use projet-blocus-v2
```

---

## 🛡️ Étape 2 : Déployer les Règles de Sécurité

### Déployer Firestore + Storage en une commande :
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Ou séparément :
```bash
# D'abord Firestore
firebase deploy --only firestore:rules

# Puis Storage
firebase deploy --only storage:rules
```

### Vérification :
Après le déploiement, vous devriez voir :
```
✔  Deploy complete!
```

---

## 🔑 Étape 3 : Configurer la Clé API Gemini

### Vérifier les secrets actuels :
```bash
firebase functions:secrets:access GEMINI_API_KEY
```

### Si la clé n'existe pas, la créer :
```bash
firebase functions:secrets:set GEMINI_API_KEY
```
- Entrez votre clé API Gemini quand demandé
- La clé sera stockée de manière sécurisée

### Redéployer les Functions pour utiliser le secret :
```bash
firebase deploy --only functions
```

---

## 📋 Étape 4 : Vérifications Post-Déploiement

### 1. Vérifier les règles Firestore dans la console :
- Aller sur https://console.firebase.google.com/
- Sélectionner "projet-blocus-v2"
- Firestore Database → Règles
- Vérifier que les règles sont à jour

### 2. Vérifier les règles Storage :
- Storage → Règles
- Vérifier que les règles sont à jour

### 3. Tester les permissions :
- Recharger votre application Netlify
- Vérifier la console : les erreurs de permissions devraient disparaître

---

## 🐛 Problèmes Courants

### Erreur : "Failed to authenticate"
```bash
firebase logout
firebase login
```

### Erreur : "Permission denied"
- Vérifiez que vous êtes propriétaire du projet Firebase
- Vérifiez dans la console Firebase → Paramètres → Utilisateurs et autorisations

### Erreur : "Project not found"
```bash
firebase use --add
# Sélectionnez "projet-blocus-v2" dans la liste
```

---

## 📊 Résumé des Bugs à Corriger

### ✅ Bugs Firebase (priorité haute) :
1. **Firestore permissions** → Déployer firestore.rules
2. **Storage permissions** → Déployer storage.rules
3. **Gemini API 400** → Configurer GEMINI_API_KEY

### 🔍 Bugs Application (priorité moyenne) :
4. **Quiz trouve 0 cours** → Vérifier requête Firestore
5. **Erreurs Storage upload** → Attendre déploiement rules
6. **Warnings CSP** → Nettoyer après fix Firebase

---

## 🚀 Commande Unique (Recommandé)

Pour tout déployer en une fois :
```bash
firebase deploy --only firestore:rules,storage:rules,functions
```

**Note** : Le déploiement des Functions peut prendre 2-3 minutes.
