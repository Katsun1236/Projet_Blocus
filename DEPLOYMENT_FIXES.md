# 🔧 Corrections et Déploiement

## ✅ Corrections effectuées

### 1. Règles Firestore mises à jour
**Problème** : "Missing or insufficient permissions" sur toutes les nouvelles fonctionnalités

**Solution** : Ajout des règles pour les nouvelles collections dans `firestore.rules` :
- `tutor_messages` - Historique du tuteur IA
- `pomodoro_sessions` - Sessions Pomodoro
- `settings` - Paramètres utilisateur
- `review_cards` - Cartes de révision espacée
- `review_sessions` - Sessions de révision
- `stats` - Statistiques utilisateur

**Toutes utilisent `isOwner(userId)` pour la sécurité.**

### 2. Layout mis à jour
**Changements** :
- ✅ Bouton "Retour à l'accueil" retiré de la sidebar
- ✅ Bouton "Retour à l'accueil" retiré du menu mobile
- ✅ Navigation plus propre

## 🚀 Déploiement REQUIS

### Étape critique : Déployer les nouvelles règles Firestore

```bash
firebase deploy --only firestore:rules
```

**IMPORTANT** : Sans ce déploiement, les erreurs de permissions persisteront !

## ⚠️ Problèmes restants à résoudre

### 1. Content Security Policy (CSP)

**Erreur** : `Refused to connect to '<URL>' because it violates the following Content Security Policy directive`

**Cause** : Les headers CSP bloquent certaines requêtes externes

**Solutions possibles** :

#### Option A : Mettre à jour les headers HTTP (Hosting)
Si tu utilises Firebase Hosting, ajoute dans `firebase.json` :

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://firestore.googleapis.com https://identitytoolkit.googleapis.com; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com;"
          }
        ]
      }
    ]
  }
}
```

#### Option B : Vérifier les meta tags dans les HTML
Cherche dans tes fichiers HTML les balises `<meta http-equiv="Content-Security-Policy">` et mets-les à jour.

### 2. Cloud Function - Génération de synthèse

**Erreur** : `400 Bad Request` sur `generateContent` - "Modèle IA non disponible"

**Causes possibles** :

1. **API Key Gemini manquante ou invalide**
   - Vérifier dans les Cloud Functions environment variables
   - Commande : `firebase functions:config:get`
   - Si manquant : `firebase functions:config:set gemini.api_key="YOUR_API_KEY"`

2. **Quota API épuisé**
   - Vérifier sur [Google AI Studio](https://aistudio.google.com/)
   - Vérifier les quotas Gemini API

3. **Erreur dans la Cloud Function**
   - Vérifier les logs : `firebase functions:log`

**Debug rapide** :
```bash
# Voir la config actuelle
firebase functions:config:get

# Voir les logs d'erreur
firebase functions:log --only generateContent

# Redéployer la fonction si nécessaire
firebase deploy --only functions:generateContent
```

### 3. Groupes ne s'affichent pas

**Cause probable** : Erreur de permissions Firestore (sera résolue après le déploiement des règles)

**Vérifications après déploiement** :
1. Rafraîchir la page communauté
2. Ouvrir la console → Vérifier qu'il n'y a plus d'erreurs Firestore
3. Si le problème persiste, vérifier dans la console Firebase que les groupes existent bien

## 📋 Checklist de déploiement

- [ ] 1. Déployer les règles Firestore : `firebase deploy --only firestore:rules`
- [ ] 2. Vérifier que les erreurs "Missing permissions" ont disparu
- [ ] 3. Configurer la CSP si nécessaire (voir ci-dessus)
- [ ] 4. Vérifier/configurer l'API Key Gemini pour les Cloud Functions
- [ ] 5. Tester chaque nouvelle fonctionnalité :
  - [ ] Tuteur IA
  - [ ] Pomodoro
  - [ ] Révisions espacées
  - [ ] Génération de synthèses
  - [ ] Affichage des groupes

## 🔍 Comment vérifier que tout fonctionne

### 1. Ouvrir la console du navigateur
```
F12 → Console
```

### 2. Vérifier les erreurs
- **Avant** : Beaucoup d'erreurs "permission-denied"
- **Après déploiement** : Aucune erreur Firestore

### 3. Tester les fonctionnalités
1. **Dashboard** : Doit charger sans erreur
2. **Tuteur IA** : Créer un message de test
3. **Pomodoro** : Lancer un timer
4. **Révisions** : Ajouter une carte
5. **Synthèses** : Générer une synthèse (nécessite Gemini API configuré)
6. **Groupes** : Voir la liste des groupes

## 🆘 Si ça ne marche toujours pas

### Commandes de debug utiles

```bash
# Voir l'état de Firebase
firebase projects:list

# Voir la config actuelle
firebase functions:config:get

# Voir les logs en temps réel
firebase functions:log --only generateContent

# Redéployer tout
firebase deploy

# Redéployer uniquement les règles
firebase deploy --only firestore:rules

# Redéployer uniquement les functions
firebase deploy --only functions
```

### Vérifier la console Firebase

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionner le projet "projet-blocus-v2"
3. **Firestore Database** → Rules → Vérifier que les nouvelles règles sont actives
4. **Functions** → Logs → Voir les erreurs de Cloud Functions
5. **Usage** → Vérifier les quotas

## 📝 Résumé des commits

1. **feat: Add Spaced Repetition System with SM-2 algorithm** (79dc17b)
2. **perf: Add Firestore query optimizations and pagination** (6ff0ec6)
3. **feat: Add comprehensive animations and transitions system** (1b6ebd7)
4. **fix: Update Firestore rules and remove home button from layout** (3dad8b5)

Tous les changements sont sur la branche `claude/remove-comments-docs-4eXn9`.
