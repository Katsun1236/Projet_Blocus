# 📂 Structure du Projet Blocus

## 🎯 Structure Actuelle

```
Projet_Blocus/
├── 📄 index.html                 # Page d'accueil
├── 📄 robots.txt                 # SEO - Directives robots
├── 📄 sitemap.xml                # SEO - Plan du site
├── 📄 firebase.json              # Config Firebase Hosting
├── 📄 .firebaserc                # Projets Firebase
├── 📄 package.json               # Dépendances racine
├── 📄 README.md                  # Documentation principale
│
├── 📁 assets/                    # Assets statiques
│   ├── 📁 css/
│   │   └── style.css             # Styles personnalisés
│   ├── 📁 js/                    # Scripts JavaScript
│   │   ├── config.js             # Config Firebase client
│   │   ├── auth-guard.js         # Protection routes auth
│   │   ├── error-handler.js      # Gestion erreurs centralisée
│   │   ├── layout.js             # Layout/sidebar partagé
│   │   ├── utils.js              # Fonctions utilitaires
│   │   ├── home.js               # Page d'accueil
│   │   ├── courses.js            # Gestion cours
│   │   ├── community.js          # Fonctionnalités communauté
│   │   ├── planning.js           # Calendrier/planning
│   │   ├── profile.js            # Profil utilisateur
│   │   ├── quizz.js              # Quiz/QCM
│   │   └── synthesize.js         # Génération synthèses IA
│   └── 📁 images/
│       └── logo.png              # Logo de l'app
│
├── 📁 pages/                     # Pages HTML
│   ├── 📁 auth/                  # Authentification
│   │   ├── login.html
│   │   ├── register.html
│   │   └── onboarding.html
│   ├── 📁 app/                   # Application (protégé)
│   │   ├── dashboard.html        # Tableau de bord
│   │   ├── courses.html          # Gestion cours/dossiers
│   │   ├── upload.html           # Upload fichiers
│   │   ├── quiz.html             # Quiz générés
│   │   ├── synthesize.html       # Synthèses IA
│   │   ├── planning.html         # Planning de révision
│   │   ├── profile.html          # Profil utilisateur
│   │   ├── community.html        # Communauté/groupes
│   │   ├── chat.html             # Chat/messagerie
│   │   ├── chat-list.html        # Liste conversations
│   │   ├── friends.html          # Amis
│   │   ├── forum.html            # Forum discussions
│   │   ├── discussion.html       # Discussion spécifique
│   │   ├── view-profile.html     # Voir profil autre user
│   │   └── bug-report.html       # Signaler un bug
│   └── 📁 admin/
│       └── panel.html            # Panel admin
│
├── 📁 functions/                 # Firebase Cloud Functions
│   ├── index.js                  # Point d'entrée
│   ├── package.json              # Dépendances Functions
│   ├── .eslintrc.js              # Config ESLint
│   └── node_modules/
│
├── 📁 docs/                      # Documentation
│   ├── SECURITY.md               # Guide sécurité
│   ├── DEPLOYMENT.md             # Guide déploiement
│   ├── TAILWIND_MIGRATION.md     # Guide migration Tailwind
│   └── PROJECT_STRUCTURE.md      # Ce fichier
│
├── 📄 firestore.rules            # Règles sécurité Firestore
├── 📄 storage.rules              # Règles sécurité Storage
└── 📄 .gitignore                 # Fichiers ignorés par Git
```

---

## 🎨 Organisation des Fichiers par Fonctionnalité

### 🔐 Authentification
- **Frontend** : `pages/auth/*.html`
- **JS** : `assets/js/auth-guard.js`
- **Backend** : Firebase Auth (pas de code custom)

### 📚 Gestion de Cours
- **Frontend** : `pages/app/courses.html`, `pages/app/upload.html`
- **JS** : `assets/js/courses.js`
- **Backend** : Firestore `users/{uid}/courses`, `users/{uid}/folders`

### 🧠 IA (Synthèses & Quiz)
- **Frontend** : `pages/app/synthesize.html`, `pages/app/quiz.html`
- **JS** : `assets/js/synthesize.js`, `assets/js/quizz.js`
- **Backend** : Cloud Function `generateContent` (functions/index.js)

### 👥 Communauté
- **Frontend** : `pages/app/community.html`, `pages/app/chat.html`, `pages/app/forum.html`
- **JS** : `assets/js/community.js`
- **Backend** : Firestore `communities/*`, `messages/*`

### 📅 Planning
- **Frontend** : `pages/app/planning.html`
- **JS** : `assets/js/planning.js`

### 👤 Profil
- **Frontend** : `pages/app/profile.html`, `pages/app/view-profile.html`
- **JS** : `assets/js/profile.js`

---

## 🔧 Fichiers de Configuration

| Fichier | Description |
|---------|-------------|
| `firebase.json` | Configuration Hosting, Functions, Rules |
| `.firebaserc` | Projets Firebase associés |
| `firestore.rules` | Règles de sécurité Firestore |
| `storage.rules` | Règles de sécurité Storage |
| `package.json` | Dépendances npm (si migration Tailwind) |
| `.gitignore` | Fichiers à ignorer par Git |

---

## 📝 Conventions de Nommage

### Fichiers HTML
- Kebab-case : `bug-report.html`, `chat-list.html`
- Un fichier = Une page

### Fichiers JavaScript
- Kebab-case : `auth-guard.js`, `error-handler.js`
- Un fichier = Un module/fonctionnalité

### Fichiers CSS
- Kebab-case : `style.css`
- Tailwind via CDN (migration recommandée)

---

## 🚀 Structure Recommandée (Migration Future)

Pour améliorer l'organisation à long terme :

```
Projet_Blocus/
├── 📁 src/                       # Code source
│   ├── 📁 components/            # Composants réutilisables
│   ├── 📁 pages/                 # Pages
│   ├── 📁 lib/                   # Bibliothèques/utils
│   ├── 📁 styles/                # Styles
│   └── 📁 assets/                # Images, fonts
│
├── 📁 functions/                 # Cloud Functions
│   ├── 📁 src/
│   │   ├── generateContent.js
│   │   ├── utils.js
│   │   └── index.js
│   └── package.json
│
├── 📁 docs/                      # Documentation
├── 📁 scripts/                   # Scripts de build/deploy
└── 📁 config/                    # Configs diverses
```

**Avantages :**
- Meilleure séparation des responsabilités
- Plus facile à maintenir
- Prêt pour un build system (Vite, Webpack)

---

## 🔄 Migrations Recommandées

### Court terme (facile)
1. ✅ Déplacer docs dans `docs/`
2. ✅ Améliorer `.gitignore`
3. Créer `scripts/deploy.sh` pour automatiser

### Moyen terme (effort moyen)
1. Migrer Tailwind CDN → Build system
2. Séparer `functions/index.js` en modules
3. Ajouter tests unitaires

### Long terme (refactoring)
1. Migrer vers un framework (React/Vue)
2. Monorepo avec pnpm workspaces
3. CI/CD avec GitHub Actions

---

## 📚 Documentation Associée

- [SECURITY.md](./SECURITY.md) - Guide de sécurité
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement
- [TAILWIND_MIGRATION.md](./TAILWIND_MIGRATION.md) - Migration Tailwind
- [README.md](../README.md) - Documentation principale

---

## 🤝 Contribution

Pour ajouter une nouvelle fonctionnalité :
1. Créer la page HTML dans `pages/app/`
2. Créer le JS associé dans `assets/js/`
3. Ajouter les règles Firestore si besoin
4. Documenter dans ce fichier
5. Mettre à jour le sitemap.xml si page publique

---

## ⚠️ Notes Importantes

- **Ne jamais commiter** : `.env`, `node_modules/`, fichiers de config Firebase locaux
- **Toujours tester** : Localement avant de déployer
- **Respecter les règles** : ESLint pour JavaScript
- **Documentation** : Maintenir ce fichier à jour
