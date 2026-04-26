# Projet Blocus

✨ **L'outil ultime pour réviser efficacement avec l'IA** - Transforme tes notes en synthèses IA, quiz instantanés et fiches de révision.

**[🚀 Accès au site](https://projet-blocus.vercel.app/)**

---

## 📋 Contenu

- [Stack Technique](#stack-technique)
- [Installation Locale](#installation-locale)
- [Déploiement](#déploiement)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Base de Données](#base-de-données)
- [Variables d'Environnement](#variables-denvironnement)

---

## 🛠️ Stack Technique

| Domaine | Technologie |
|---------|-------------|
| **Frontend** | HTML5, CSS3 (Tailwind), JavaScript vanilla |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Déploiement** | Vercel (auto-deploy sur main) |
| **Temps réel** | WebSocket Supabase |
| **Analytics** | Vercel Speed Insights |
| **Mobile** | Capacitor (iOS/Android) |

---

## 🚀 Installation Locale

### Prérequis
- Node.js 18+
- npm ou yarn

### Étapes

1. **Clone le repo**
   ```bash
   git clone https://github.com/Katsun1236/Projet_Blocus.git
   cd Projet_Blocus
   ```

2. **Installe les dépendances**
   ```bash
   npm install
   ```

3. **Configure les variables d'environnement**
   ```bash
   cp .env.example .env
   # Édite .env avec tes clés Supabase
   ```

4. **Lance le serveur local**
   ```bash
   npm run dev
   # Accès sur http://localhost:5173
   ```

5. **Build pour production**
   ```bash
   npm run build
   npm run preview
   ```

---

## 📤 Déploiement

### Sur Vercel (Recommandé)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
npm run deploy          # Staging
npm run deploy:prod     # Production
```

**Configuration automatique** : Chaque `git push` sur `main` redéploie automatiquement via GitHub integration de Vercel.

### Edge Functions Supabase

```bash
# Déployer generate-quiz
./deploy-quiz.sh  # ou npm run deploy:functions

# Remove old: (ne plus utiliser)
# npm run deploy:netlify   ❌ DÉPRÉCIÉ
# npm run deploy:firebase  ❌ DÉPRÉCIÉ
```

---

## ✨ Fonctionnalités

### Académiques
- 📝 **Quiz Intelligents** - Généré par IA à partir de tes notes
- 📊 **Synthèses IA** - Résumé automatique de textes
- 🔄 **Répétition Espacée** - Apprentissage basé sur les sciences cognitives
- 📅 **Planification** - Organise tes révisions
- ⏱️ **Pomodoro** - Technique de gestion du temps

### Social
- 👥 **Communauté** - Partage tes ressources
- 💬 **Discussion** - Forums par sujet
- 🤝 **Amis** - Collaborative learning
- 🏆 **Points de gamification** - Motivation + classement

### Autres
- 📱 **Responsive & Mobile** - Fonctionne partout
- 🌙 **Dark mode** - Révise les yeux détendus
- 📥 **Uploads** - PDF, images, texte
- 🔐 **Auth Supabase** - Sécurisé & scalable

---

## 🏗️ Architecture

```
Projet_Blocus/
├── assets/
│   ├── js/           # Code frontend principal
│   │   ├── supabase-config.js  # Client Supabase
│   │   ├── auth-guard.js       # Protection routes
│   │   ├── courses.js          # Gestion des cours
│   │   ├── quizz.js            # Quiz engine
│   │   ├── synthesize.js       # Synthèses IA
│   │   └── ...
│   └── css/          # Styles Tailwind + custom
├── pages/
│   ├── auth/         # Login, Register, Onboarding
│   └── app/          # Dashboard, Quiz, Community, etc.
├── supabase/
│   ├── migrations/   # Schema versioning
│   ├── functions/    # Edge Functions Deno
│   └── schema.sql    # Définition initiale
├── config/           # Tailwind, PostCSS, Vite
└── index.html        # Entry point (spa-like)
```

### Flux de données
```
Browser
  ↓ (assets/js/*.js)
  ↓
Supabase API
  ├── Auth (JWT)
  ├── PostgreSQL (realtime)
  ├── Storage (fichiers)
  └── Edge Functions
```

---

## 🗄️ Base de Données

### Setup initial

```bash
# Exécuté en production automatiquement
supabase migration up
```

### Migrations manuelles

```bash
cd supabase/
# Appliquer une nouvelle migration
supabase migration new your_migration_name
# Éditer migrations/*.sql
supabase db push
```

### Schéma principal

| Table | Description |
|-------|-------------|
| `users` | Profils utilisateurs |
| `courses` | Cours/matières |
| `quizzes` | Quiz générés |
| `notes` | Notes utilisateur |
| `community_posts` | Posts communauté |
| `friendships` | Relations amitié |

Voir [supabase/schema.sql](supabase/schema.sql) pour le détail complet.

---

## 🔐 Variables d'Environnement

Crée un `.env` à la racine:

```env
# Supabase
VITE_SUPABASE_URL=https://vhtzudbcfyxnwmpyjyqw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...

# App config (optionnel)
VITE_APP_NAME=Projet Blocus
VITE_APP_ENV=development
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

**⚠️ FAIS JAMAIS DE COMMIT** de cette clé - elle est **protégée par row-level-security** (RLS) dans Supabase.

---

## 📊 Scripts disponibles

```bash
npm run dev              # Dev server (Vite)
npm run build            # Production build
npm run preview          # Preview build local
npm run test             # Unit tests (Vitest)
npm run test:ui          # Test UI
npm run test:coverage    # Coverage report
npm run lint             # ESLint check
npm run format           # Prettier format
npm run optimize:images  # Compress images

# Mobile (Capacitor)
npm run cap:sync         # Sync to native
npm run cap:run:android  # Run on Android
npm run cap:run:ios      # Run on iOS

# Deploy
npm run deploy           # Deploy à Vercel staging
npm run deploy:prod      # Deploy à Vercel production
```

---

## 🐛 État des Bugs

✅ **100% des CRITICAL & HIGH priority fixes appliquées** (70/99 bugs)

Reste: 29 bugs LOW/MEDIUM (optimisations et edge cases)

Voir [docs/ETAT_BUGS_FINAL.md](docs/ETAT_BUGS_FINAL.md) pour le détail complet.

---

## 📝 License

MIT - Libre d'utilisation et modification (attribue le crédit!)

---

## 📞 Support

- **Bug report** → [pages/app/bug-report.html](pages/app/bug-report.html)
- **Issues GitHub** → Ouvre une issue
- **Forum** → Communauté interne du site

---

**Fait avec ❤️ par Katsun1236 | 2024-2026**
