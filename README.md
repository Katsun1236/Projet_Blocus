# 🎓 Projet Blocus v2.0

Plateforme d'aide aux révisions pour étudiants utilisant l'IA Gemini pour générer des contenus pédagogiques (quiz, synthèses, flashcards).

## 🚀 Technologies

- **Frontend:** Vanilla JavaScript (ES6 modules), Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage, Functions)
- **IA:** Google Gemini 1.5 Flash
- **Build:** Vite
- **Déploiement:** Netlify (test) + Firebase (production)

## 📦 Installation

### Prérequis

- Node.js >= 20.x
- npm ou yarn
- Compte Firebase
- Compte Netlify (pour déploiement test)

### Installation des dépendances

```bash
npm install
```

### Configuration

1. **Créer le fichier `.env.local` :**

```bash
cp .env.example .env.local
```

2. **Compléter avec vos credentials Firebase :**

Obtenir les credentials depuis : https://console.firebase.google.com/

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

3. **Configurer Firebase Functions :**

```bash
cd functions
npm install
firebase functions:secrets:set GEMINI_API_KEY
# Entrer votre clé API Gemini
```

4. **Déployer les règles Firestore (IMPORTANT) :**

```bash
firebase deploy --only firestore:rules,storage:rules
```

## 🛠️ Développement

### Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:8000`

### Build de production

```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `dist/`

### Tests

```bash
# Lancer les tests
npm test

# Tests avec UI
npm test:ui

# Coverage
npm test:coverage
```

## 📁 Structure du projet

```
Projet_Blocus/
├── src/                          # Code source
│   ├── app/
│   │   ├── core/                 # Services et config core
│   │   │   ├── config/           # Configuration (env, Firebase)
│   │   │   ├── services/         # Services Firebase
│   │   │   └── middleware/       # Middleware (authGuard)
│   │   ├── shared/               # Code partagé
│   │   │   ├── components/       # Composants réutilisables
│   │   │   ├── utils/            # Utilitaires
│   │   │   └── constants/        # Constantes
│   │   └── features/             # Features (à venir)
│   └── assets/                   # Assets statiques
├── pages/                        # Pages HTML
│   ├── app/                      # Pages application
│   ├── auth/                     # Pages authentification
│   └── legal/                    # Pages légales
├── functions/                    # Firebase Cloud Functions
├── tests/                        # Tests
├── vite.config.js               # Configuration Vite
├── tailwind.config.js           # Configuration Tailwind
└── firestore.rules              # Règles sécurité Firestore
```

## 🔐 Sécurité

### Règles Firestore

Les règles Firestore sont maintenant sécurisées avec :
- ✅ Vérification de propriété pour tous les documents
- ✅ RBAC pour les groupes
- ✅ Validation côté serveur
- ✅ Principe du moindre privilège

**IMPORTANT:** Toujours déployer les règles après modification :

```bash
firebase deploy --only firestore:rules
```

### Variables d'environnement

**NE JAMAIS** committer le fichier `.env.local`

Les secrets sensibles (API keys) doivent être dans Firebase Secrets :

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

## 🚀 Déploiement

### Netlify (Environnement de test)

```bash
npm run deploy:netlify
```

### Firebase (Production)

```bash
# Tout déployer
npm run deploy:firebase

# Ou séparément
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only functions
```

### Déploiement complet

```bash
npm run deploy
```

Cela va :
1. Build l'application avec Vite
2. Déployer sur Netlify
3. Déployer sur Firebase

## 📊 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run build` | Build de production optimisé |
| `npm run preview` | Preview du build de production |
| `npm test` | Lance les tests avec Vitest |
| `npm run lint` | Lint du code avec ESLint |
| `npm run format` | Format du code avec Prettier |
| `npm run deploy` | Déploiement complet (build + Netlify + Firebase) |

## 🔄 Migration depuis v1.0

Si vous utilisez l'ancienne version avec `assets/js/config.js` :

1. Les imports ont changé :

**Avant :**
```javascript
import { auth, db } from './config.js';
```

**Après :**
```javascript
import { auth, db } from '@core/services/firebase/index.js';
// ou
import { authService } from '@core/services/authService.js';
```

2. Les alias Vite sont configurés :
- `@` → `src/app`
- `@core` → `src/app/core`
- `@shared` → `src/app/shared`
- `@features` → `src/app/features`

## 📚 Documentation

- [ROADMAP.md](./ROADMAP.md) - Plan d'amélioration détaillé
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture du système
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)

## 🐛 Problèmes connus

### Firestore persistence warning

Si vous voyez l'avertissement "Multiple tabs", c'est normal. La persistence Firestore fonctionne uniquement dans un seul onglet à la fois.

### Build errors

Si vous rencontrez des erreurs de build, assurez-vous que :
1. Node.js >= 20.x est installé
2. Toutes les dépendances sont installées : `npm install`
3. Le fichier `.env.local` existe et est correctement configuré

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Changelog

### v2.0.0 (Décembre 2025)

- ✅ Migration vers Vite
- ✅ Architecture modulaire
- ✅ Sécurisation Firestore rules
- ✅ Variables d'environnement
- ✅ Services Firebase refactorisés
- ✅ Composants partagés
- ✅ Configuration Netlify + Firebase
- ✅ Tests avec Vitest
- ✅ Documentation complète

### v1.0.0 (Novembre 2025)

- Version initiale avec vanilla JS
- Intégration Firebase
- IA Gemini pour quiz/synthèses
- Features communauté, planning, gamification

## 📄 Licence

MIT

## 👨‍💻 Auteur

Projet Blocus Team

---

**Note:** Ce projet est en cours de refactorisation. Voir [ROADMAP.md](./ROADMAP.md) pour le plan complet.
