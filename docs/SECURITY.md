# Guide de Sécurité - Projet Blocus

## Configuration de Sécurité Firebase

### 1. Règles Firestore (`firestore.rules`)
Les règles Firestore ont été configurées pour :
- ✅ Authentification requise pour toutes les opérations sensibles
- ✅ Isolation des données par utilisateur
- ✅ Validation des données lors de la création
- ✅ Protection contre la modification des champs critiques (email, createdAt)
- ✅ Sous-collections protégées (courses, folders, quizzes, notifications)

**Déploiement :**
```bash
firebase deploy --only firestore:rules
```

### 2. Règles Storage (`storage.rules`)
Les règles Storage protègent :
- ✅ Isolation des fichiers par utilisateur
- ✅ Validation du type MIME (PDF et images uniquement)
- ✅ Limite de taille : 10MB pour les documents, 2MB pour les avatars
- ✅ Lecture publique des avatars, privée pour les autres fichiers

**Déploiement :**
```bash
firebase deploy --only storage
```

### 3. En-têtes de Sécurité HTTP
Configurés dans `firebase.json` :
- `X-Content-Type-Options: nosniff` - Prévient le MIME sniffing
- `X-Frame-Options: SAMEORIGIN` - Protection contre le clickjacking
- `X-XSS-Protection: 1; mode=block` - Protection XSS basique
- `Referrer-Policy: strict-origin-when-cross-origin` - Contrôle des referrers

### 4. Restrictions Firebase Console

⚠️ **Actions Critiques à Effectuer Manuellement :**

1. **Restrictions de Domaine API**
   - Aller dans Google Cloud Console
   - APIs & Services → Credentials
   - Éditer la clé API
   - Ajouter `projet-blocus-v2.web.app` dans les restrictions HTTP

2. **Activer App Check** (Recommandé)
   ```bash
   firebase appcheck:verify
   ```
   - Protège contre les abus d'API
   - reCAPTCHA v3 pour le web

3. **Monitoring et Alertes**
   - Activer les alertes de quota Firebase
   - Surveiller les logs dans Firebase Console

## Gestion d'Erreur

Le fichier `assets/js/error-handler.js` fournit :
- Gestion centralisée des erreurs Firebase
- Messages d'erreur traduits et user-friendly
- Système de toast notifications
- Logging des erreurs (prêt pour Sentry)

**Utilisation :**
```javascript
import { handleFirebaseError, showToast, tryCatch } from './error-handler.js';

// Option 1: Gestion manuelle
try {
  await someFirebaseOperation();
} catch (error) {
  handleFirebaseError(error, 'context-name');
}

// Option 2: Wrapper automatique
await tryCatch(
  async () => await someFirebaseOperation(),
  'context-name'
);
```

## Checklist de Sécurité

### Avant le Déploiement
- [ ] Déployer les règles Firestore et Storage
- [ ] Configurer les restrictions de domaine API
- [ ] Activer Firebase App Check
- [ ] Vérifier les quotas et limites
- [ ] Tester l'authentification en mode navigation privée

### Monitoring
- [ ] Configurer des alertes de quota
- [ ] Surveiller les tentatives d'accès non autorisées
- [ ] Vérifier régulièrement les logs Firebase Functions

### Bonnes Pratiques
- ✅ Ne jamais exposer de clés secrètes côté client
- ✅ Toujours valider les entrées utilisateur
- ✅ Limiter la taille des uploads
- ✅ Utiliser HTTPS uniquement
- ✅ Mettre à jour régulièrement les dépendances

## Signalement de Vulnérabilités

Si vous découvrez une faille de sécurité, veuillez :
1. **NE PAS** créer d'issue publique
2. Contacter l'équipe directement
3. Fournir des détails sur la vulnérabilité
4. Attendre la correction avant divulgation publique

## Ressources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Best Practices](https://web.dev/secure/)
