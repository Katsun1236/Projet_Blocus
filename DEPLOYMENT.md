# Guide de Déploiement - Projet Blocus

## Prérequis

- Node.js 20+ installé
- Firebase CLI installé : `npm install -g firebase-tools`
- Compte Firebase actif
- Clé API Gemini configurée

---

## 1. Configuration Initiale

### A. Variables d'Environnement Firebase Functions

Configurer la clé API Gemini :
```bash
firebase functions:secrets:set GEMINI_API_KEY
# Entrer votre clé API Gemini quand demandé
```

Vérifier :
```bash
firebase functions:secrets:access GEMINI_API_KEY
```

### B. Installer les Dépendances Functions

```bash
cd functions
npm install
cd ..
```

---

## 2. Déploiement des Règles de Sécurité

⚠️ **CRITIQUE : Déployer en premier**

```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les règles Storage
firebase deploy --only storage
```

Vérifier dans la console Firebase que les règles sont actives.

---

## 3. Mise à Jour des Cloud Functions

### A. Build et Test Localement (Optionnel)

```bash
cd functions
npm run lint
npm run serve  # Émulateurs locaux
```

### B. Déploiement

```bash
# Depuis la racine du projet
firebase deploy --only functions

# Ou déployer une fonction spécifique
firebase deploy --only functions:generateContent
```

⚠️ **Si l'erreur 404 Gemini persiste après déploiement :**
1. Vérifier que la nouvelle version est déployée
2. Attendre 2-3 minutes (propagation)
3. Vérifier les logs : `firebase functions:log`

---

## 4. Déploiement du Frontend

### A. Avant le Premier Déploiement

Vérifier `firebase.json` :
```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

### B. Déployer

```bash
firebase deploy --only hosting
```

---

## 5. Déploiement Complet

Pour tout déployer en une fois :
```bash
firebase deploy
```

Ordre de déploiement :
1. Firestore rules
2. Storage rules
3. Functions
4. Hosting

---

## 6. Vérification Post-Déploiement

### Checklist

- [ ] **Rules** : Tester que les utilisateurs non connectés ne peuvent pas accéder aux données
- [ ] **Functions** : Tester la génération de synthèse/quiz
- [ ] **Hosting** : Vérifier que le site est accessible
- [ ] **Auth** : Tester connexion/inscription
- [ ] **Upload** : Tester upload de fichier PDF
- [ ] **Console** : Vérifier aucune erreur dans la console navigateur

### Commandes de Vérification

```bash
# Voir l'URL du site déployé
firebase hosting:channel:open live

# Voir les logs Functions
firebase functions:log --only generateContent

# Voir les erreurs Firestore
# Aller dans Console Firebase → Firestore → Monitoring
```

---

## 7. Rollback en Cas de Problème

### Fonctions
```bash
# Lister les déploiements
firebase functions:list

# Rollback vers une version précédente
# (Redéployer le commit précédent)
git checkout <commit-hash>
firebase deploy --only functions
```

### Hosting
```bash
# Voir les versions
firebase hosting:releases:list

# Rollback
firebase hosting:rollback
```

---

## 8. Configuration Sécurité Additionnelle

### A. Restrictions API Firebase (Console Google Cloud)

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionner le projet `projet-blocus-v2`
3. APIs & Services → Credentials
4. Éditer la clé API
5. Application restrictions → HTTP referrers
6. Ajouter :
   - `https://projet-blocus-v2.web.app/*`
   - `https://projet-blocus-v2.firebaseapp.com/*`
   - `localhost` (pour dev)

### B. Activer App Check (Recommandé)

```bash
firebase appcheck:verify
```

Configuration dans Firebase Console :
- reCAPTCHA v3 pour web
- Seuil de score : 0.5

---

## 9. Monitoring et Maintenance

### Logs en Temps Réel
```bash
firebase functions:log --only generateContent --follow
```

### Quotas et Limites
- **Firestore** : Console Firebase → Firestore → Usage
- **Functions** : Console Firebase → Functions → Usage
- **Gemini API** : [Google AI Studio](https://aistudio.google.com/)

### Alertes Recommandées
- Quota Firestore > 80%
- Erreurs Functions > 5% du trafic
- Quota Gemini approche limite

---

## 10. Dépannage Rapide

### Erreur : "GEMINI_API_KEY is not defined"
```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```

### Erreur : "Permission denied" Firestore
```bash
# Vérifier les règles
firebase firestore:rules:get

# Redéployer
firebase deploy --only firestore:rules
```

### Erreur 404 Gemini (comme dans votre cas)
```bash
cd functions
npm install @google/generative-ai@latest
cd ..
firebase deploy --only functions
```

### Site ne se charge pas
```bash
# Vérifier firebase.json
cat firebase.json

# Nettoyer le cache
firebase hosting:channel:delete <channel-name>
firebase deploy --only hosting
```

---

## Commandes Rapides

```bash
# Développement local
firebase emulators:start

# Deploy rapide (tout)
firebase deploy

# Deploy sélectif
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules

# Logs
firebase functions:log --only generateContent --limit 50

# Open site
firebase open hosting:site
```

---

## Support

- [Documentation Firebase](https://firebase.google.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
