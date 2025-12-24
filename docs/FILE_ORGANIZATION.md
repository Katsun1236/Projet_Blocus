# 📁 Organisation des Fichiers - Projet Blocus

**Dernière mise à jour :** 24 décembre 2024

---

## 📂 Structure du Projet

```
Projet_Blocus/
├── 📄 Fichiers racine (configuration)
├── 📁 assets/          # Ressources statiques
├── 📁 pages/           # Pages HTML
├── 📁 docs/            # Documentation
├── 📁 scripts/         # Scripts utilitaires
└── 📁 firebase/        # Configuration Firebase (si présent)
```

---

## 🗂️ Détails par Dossier

### 📄 **Racine du Projet**

**Fichiers de configuration :**
- `package.json` - Dépendances npm
- `package-lock.json` - Lockfile npm
- `tailwind.config.js` - Configuration Tailwind CSS
- `netlify.toml` - Configuration Netlify (déploiement)
- `firebase.json` - Configuration Firebase
- `.firebaserc` - Projets Firebase
- `firestore.rules` - Règles de sécurité Firestore
- `storage.rules` - Règles de sécurité Storage

**Fichiers PWA :**
- `manifest.json` - Web App Manifest
- `sw.js` - Service Worker
- `_redirects` - Redirections Netlify (SPA)

**Fichiers SEO/Web :**
- `index.html` - Page d'accueil
- `sitemap.xml` - Plan du site
- `robots.txt` - Instructions robots

**Autres :**
- `README.md` - Documentation principale
- `LICENSE` - Licence du projet
- `.gitignore` - Fichiers ignorés par Git

---

### 📁 **assets/** - Ressources Statiques

#### **assets/css/**
```
assets/css/
└── style.css          # Styles globaux compilés de Tailwind
```

#### **assets/js/** - Scripts JavaScript

**Organisation actuelle (à plat) :**
Tous les fichiers JS sont au même niveau. Voici leur classification logique :

##### 🔧 **Core (Système)**
- `config.js` - Configuration Firebase
- `layout.js` - Navigation et layout global
- `utils.js` - Fonctions utilitaires
- `error-handler.js` - Gestion globale des erreurs
- `suppress-warnings.js` - Suppression warnings console

##### 🔐 **Authentification**
- `auth-guard.js` - Protection des routes
- `index.js` - Page d'accueil (login/register)

##### ⚡ **PWA & Performance**
- `pwa-install.js` - Installation PWA
- `lazy-images.js` - Lazy loading images

##### 🎯 **Features Principales**
- `analytics.js` - Système d'analytics et stats
- `flashcards.js` - Flashcards avec SM-2
- `search.js` - Recherche intelligente
- `gamification.js` - Badges, XP, niveaux
- `export.js` - Export multi-format
- `notifications.js` - Notifications système
- `courses.js` - Gestion des cours
- `quizz.js` - Système de quiz
- `synthesize.js` - Génération de synthèses
- `planning.js` - Planification révisions
- `community.js` - Communauté et partage
- `profile.js` - Profil utilisateur
- `home.js` - Dashboard/home

##### ✅ **Validation & Qualité**
- `validation.js` - Validation formulaires + retry réseau

> **Note :** Les fichiers ne sont PAS organisés en sous-dossiers pour éviter de casser les imports existants. Cette classification est logique uniquement.

#### **assets/images/**
```
assets/images/
├── locus-logo.png             # Logo principal
├── locus-neon-favicon.png     # Favicon néon
├── locus_asset*.png           # Assets marketing (gros fichiers)
├── locus_presentation.png     # Présentation
└── ...
```

**⚠️ Optimisation recommandée :**
- Convertir en WebP pour réduire la taille
- Utiliser `npm run optimize:images`

---

### 📁 **pages/** - Pages HTML

#### **pages/app/** - Application (Zone privée)
```
pages/app/
├── dashboard.html         # Tableau de bord principal
├── courses.html           # Gestion des cours
├── quiz.html              # Interface quiz
├── flashcards.html        # Flashcards SRS
├── search.html            # Recherche multi-cours
├── analytics.html         # Statistiques avancées
├── synthesize.html        # Génération synthèses
├── planning.html          # Planning de révisions
├── profile.html           # Profil utilisateur
├── community.html         # Communauté
└── ...
```

#### **pages/auth/** - Authentification (Zone publique)
```
pages/auth/
├── login.html             # Connexion
├── register.html          # Inscription
└── ...
```

---

### 📁 **docs/** - Documentation

**Fichiers de documentation :**
```
docs/
├── FEATURES_ROADMAP.md        # Roadmap produit 2026
├── IMPLEMENTATION_STATUS.md   # État des implémentations
├── OPTIMIZATIONS.md           # Rapport d'optimisations
├── FILE_ORGANIZATION.md       # Ce fichier (organisation)
├── DEPLOYMENT.md              # Guide de déploiement
├── SECURITY.md                # Sécurité
├── PROJECT_STRUCTURE.md       # Structure projet
├── TAILWIND_MIGRATION.md      # Migration Tailwind
├── GEMINI_FIX.md              # Fix Gemini API
└── IMAGE_NAMING_PLAN.md       # Plan nommage images
```

**Objectif :** Centraliser toute la documentation technique dans `/docs/`

---

### 📁 **scripts/** - Scripts Utilitaires

```
scripts/
└── optimize-images.js     # Conversion images en WebP
```

**Usage :**
```bash
npm run optimize:images
```

---

## 🎯 Principes d'Organisation

### ✅ **Bonnes Pratiques Actuelles**

1. **Séparation claire pages/assets** ✅
   - HTML dans `pages/`
   - JS/CSS/images dans `assets/`

2. **Documentation centralisée** ✅
   - Tous les `.md` dans `docs/` (sauf README racine)

3. **Configuration à la racine** ✅
   - Fichiers de config facilement accessibles

4. **PWA fichiers racine** ✅
   - `manifest.json` et `sw.js` à la racine (requis PWA)

### 📋 **Recommandations Futures**

#### 1. **Organiser assets/js en modules (si refactoring futur)**

**Option A : Par type**
```
assets/js/
├── core/              # config, layout, utils
├── features/          # flashcards, search, analytics, etc.
├── auth/              # auth-guard
└── pwa/               # pwa-install, lazy-images
```

**Option B : Par domaine métier**
```
assets/js/
├── study/             # flashcards, courses, quiz, synthesize
├── social/            # community, profile
├── system/            # config, layout, notifications, etc.
└── shared/            # utils, validation, error-handler
```

> **⚠️ Important :** Cela nécessiterait de mettre à jour TOUS les imports dans les fichiers HTML et JS. À faire uniquement lors d'une refonte majeure.

#### 2. **Créer un dossier assets/fonts/** (si custom fonts)

```
assets/fonts/
└── custom-font.woff2
```

#### 3. **Organiser assets/images par catégorie**

```
assets/images/
├── logos/             # Logos et icônes
├── marketing/         # Assets marketing
├── ui/                # Éléments UI
└── user-uploads/      # (si stockage local)
```

#### 4. **Ajouter tests/**

```
tests/
├── unit/              # Tests unitaires
├── integration/       # Tests d'intégration
└── e2e/               # Tests end-to-end
```

---

## 📊 Statistiques Actuelles

### Fichiers par Type
- **JavaScript :** ~24 fichiers
- **HTML :** ~10+ pages
- **Documentation :** 10 fichiers MD
- **Images :** ~40 fichiers (à optimiser)
- **Configuration :** 8 fichiers

### Taille Projet
- **Total :** ~15-20 MB
- **Images :** ~12 MB (à réduire avec WebP)
- **Code :** ~3-5 MB

---

## 🔄 Maintenance

### Quand ajouter un nouveau fichier ?

| Type de fichier | Emplacement |
|-----------------|-------------|
| Nouvelle feature JS | `assets/js/nom-feature.js` |
| Nouvelle page HTML | `pages/app/nom-page.html` |
| Documentation | `docs/NOM_DOC.md` |
| Script utilitaire | `scripts/nom-script.js` |
| Image | `assets/images/nom-image.png` |
| CSS personnalisé | `assets/css/custom.css` |

### Règles de nommage

- **Fichiers JS :** `kebab-case.js` (ex: `flashcards.js`)
- **Fichiers HTML :** `kebab-case.html` (ex: `analytics.html`)
- **Documentation :** `SCREAMING_SNAKE_CASE.md` (ex: `FEATURES_ROADMAP.md`)
- **Images :** `kebab-case.png` (ex: `locus-logo.png`)

---

## 🚀 Commandes Utiles

```bash
# Compter les fichiers JS
find assets/js -name "*.js" | wc -l

# Trouver les gros fichiers (> 1MB)
find . -type f -size +1M

# Lister tous les fichiers HTML
find pages -name "*.html"

# Voir la taille du projet
du -sh .

# Optimiser les images
npm run optimize:images
```

---

## 📝 Changelog

### 24 décembre 2024
- Déplacement `IMAGE_NAMING_PLAN.md` → `docs/`
- Déplacement `IMPLEMENTATION_STATUS.md` → `docs/`
- Création de `FILE_ORGANIZATION.md`

---

**Dernière révision :** 24/12/2024
**Maintenu par :** Claude Code
