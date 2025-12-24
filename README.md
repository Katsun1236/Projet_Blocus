# Projet Blocus 🚀

## 📚 À propos du projet

Le **Projet Blocus** est une **Progressive Web App (PWA)** gratuite qui aide les étudiants à réviser efficacement. Grâce à l'IA Gemini, il transforme vos notes de cours en quiz, synthèses, flashcards et textes à trous. L'application fonctionne hors ligne et peut être installée comme une application native sur votre appareil.

**Mission :** Fournir une alternative gratuite, moderne et scientifiquement prouvée aux outils d'étude payants pour rendre la période de blocus plus productive et moins stressante.

## ✨ Fonctionnalités principales

### 🔴 Haute Priorité (Implémentées)

#### 📱 **Mode Hors Ligne (PWA)**
- Application installable sur mobile/desktop
- Fonctionne 100% hors ligne avec Service Worker
- Cache intelligent pour performances optimales
- Notifications de mise à jour automatiques
- Indicateur de connexion réseau

#### 🗂️ **Flashcards Intelligentes (SRS)**
- Système de répétition espacée avec **algorithme SuperMemo 2 (SM-2)**
- Création et gestion de decks personnalisés
- Mode révision avec animation flip 3D
- Statistiques : cartes à réviser, streak, taux de rétention
- Génération automatique depuis vos cours (IA)

#### 🔍 **Recherche Intelligente Multi-Cours**
- Recherche full-text dans tous vos contenus (cours, synthèses, quiz, flashcards)
- Algorithme de scoring intelligent avec fuzzy matching
- Recherche vocale (Web Speech API)
- Suggestions en temps réel
- Historique des recherches
- Filtres par type de contenu

#### 📊 **Statistiques & Analytics Avancées**
- Dashboard complet de progression
- Temps de révision par période (semaine/mois/année)
- Taux de réussite aux quiz
- Distribution par matière
- Activité récente détaillée
- Visualisations graphiques

### 🟡 Priorité Moyenne (Implémentées)

#### 🎮 **Gamification Complète**
- **20+ badges** à débloquer (streaks, quiz, synthèses, etc.)
- Système d'XP avec **10 niveaux** (Débutant → Légende)
- Suivi automatique des achievements
- Notifications de level-up et déblocage de badges
- Streaks quotidiens de révision

#### 📤 **Export Multi-Format**
- **Markdown** (.md) - Pour édition
- **PDF** - Pour impression
- **JSON** - Pour backup/partage
- **Anki** (.csv) - Import direct dans Anki
- Widget d'export flottant sur toutes les pages

#### 🔔 **Notifications Intelligentes**
- Notifications push navigateur
- Toast in-app avec animations
- Rappels de révision planifiés
- Alertes de streak
- Notifications de deadline
- Centre de notifications avec compteur

#### ✅ **Validation & Gestion d'Erreurs**
- Validation en temps réel des formulaires
- Validators : email, password, required, minLength, etc.
- Retry automatique avec **exponential backoff**
- Moniteur de connexion réseau
- Messages d'erreur clairs et utiles

### 🔵 Fonctionnalités de Base

* **Importation de documents :** Chargez vos notes au format PDF

* **Génération par IA (Gemini) :**
    * Synthèses concises
    * QCM et QRM intelligents
    * Textes à trous
    * Flashcards automatiques

* **Tableau de bord personnel :** Organisez vos cours et suivez votre progression

* **Communauté :** Partagez vos synthèses et collaborez avec d'autres étudiants

* **Design moderne :** Interface cyberpunk avec thème sombre et néon

## ⚙️ Stack technique

### **Frontend**

* **Vanilla JavaScript (ES6+)** - Aucune dépendance runtime, modules natifs
* **HTML5 & CSS3** - Structure et design modernes
* **Tailwind CSS** - Framework CSS utility-first
* **Progressive Web App (PWA)** - Service Worker, Cache API, Web App Manifest

### **Backend & Database**

* **Firebase Firestore** - Base de données NoSQL temps réel
* **Firebase Auth** - Authentification sécurisée (email/password, Google)
* **Firebase Storage** - Stockage de fichiers (PDFs, images)
* **Firebase Functions** - Serverless backend

### **Intelligence Artificielle**

* **Gemini 1.5 Flash** - Génération de contenu intelligent
* **Gemini API** - Synthèses, quiz, flashcards, textes à trous

### **APIs Web Utilisées**

* **Service Worker API** - Cache offline et PWA
* **Notification API** - Notifications push navigateur
* **Web Speech API** - Reconnaissance vocale pour recherche
* **Cache API** - Stratégies de cache avancées
* **LocalStorage API** - Stockage local de données

### **Déploiement**

* **Netlify** - Hébergement et déploiement continu
* **GitHub** - Gestion de version et CI/CD
* **CSP Headers** - Sécurité renforcée (Content Security Policy)

### **Outils de développement**

* **jsPDF** - Génération de PDF côté client
* **Sharp** - Optimisation d'images (WebP)
* **PostCSS & Autoprefixer** - Compatibilité CSS

## 📁 Structure du projet

```
Projet_Blocus/
├── assets/
│   ├── css/
│   │   └── style.css           # Styles globaux
│   ├── js/
│   │   ├── config.js           # Configuration Firebase
│   │   ├── layout.js           # Navigation et layout
│   │   ├── pwa-install.js      # Installation PWA
│   │   ├── analytics.js        # Système d'analytics
│   │   ├── flashcards.js       # Flashcards avec SM-2
│   │   ├── search.js           # Recherche intelligente
│   │   ├── gamification.js     # Badges, XP, niveaux
│   │   ├── export.js           # Export multi-format
│   │   ├── notifications.js    # Notifications système
│   │   ├── validation.js       # Validation formulaires
│   │   └── ...
│   └── images/                 # Logos et assets
├── pages/
│   ├── app/
│   │   ├── dashboard.html      # Tableau de bord
│   │   ├── courses.html        # Gestion des cours
│   │   ├── quiz.html           # Interface quiz
│   │   ├── flashcards.html     # Flashcards SRS
│   │   ├── search.html         # Recherche multi-cours
│   │   ├── analytics.html      # Statistiques
│   │   └── ...
│   └── auth/
│       ├── login.html          # Connexion
│       └── register.html       # Inscription
├── docs/
│   ├── FEATURES_ROADMAP.md     # Roadmap produit
│   ├── OPTIMIZATIONS.md        # Rapport optimisations
│   └── IMPLEMENTATION_STATUS.md # État des implémentations
├── sw.js                       # Service Worker PWA
├── manifest.json               # Web App Manifest
├── netlify.toml                # Configuration Netlify
├── _redirects                  # Redirections SPA
└── index.html                  # Page d'accueil
```

## 🚀 Installation et déploiement

### Développement local

```bash
# Cloner le repository
git clone https://github.com/Katsun1236/Projet_Blocus.git
cd Projet_Blocus

# Installer les dépendances (optionnel, pour optimisation images)
npm install

# Lancer un serveur local (exemple avec Python)
python -m http.server 8000
# OU avec Node.js
npx http-server

# Ouvrir http://localhost:8000
```

### Configuration Firebase

1. Créer un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activer Firestore, Auth (email/password + Google), Storage
3. Copier les credentials dans `assets/js/config.js`

### Déploiement sur Netlify

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Déployer
netlify deploy --prod
```

**Configuration automatique :** Le fichier `netlify.toml` contient déjà toute la configuration (headers CSP, cache, redirects).

### Optimisation des images (optionnel)

```bash
# Installer Sharp
npm install

# Convertir images en WebP
npm run optimize:images

# Puis mettre à jour les références dans le HTML
```

## 📊 Métriques de performance

- ⏱️ **Temps de chargement initial :** < 3s
- 📦 **Taille totale assets :** ~15MB (objectif: ~5MB avec WebP)
- 🚀 **PWA Lighthouse Score :** ~85/100
- ✅ **Compatibilité navigateurs :**
  - Chrome/Edge 90+ ✅
  - Firefox 88+ ✅
  - Safari 14+ ⚠️ (notifications limitées)

## 🎯 Roadmap 2026

Voir le fichier complet : [`docs/FEATURES_ROADMAP.md`](docs/FEATURES_ROADMAP.md)

### ✅ Q1 2026 (TERMINÉ)
- [x] PWA avec mode offline
- [x] Flashcards SRS (SM-2)
- [x] Recherche intelligente
- [x] Analytics avancées
- [x] Gamification complète
- [x] Export multi-format
- [x] Notifications
- [x] Validation améliorée

### ⏳ Q2 2026
- [ ] Collaboration temps réel (Firebase Realtime Database)
- [ ] Édition collaborative de notes
- [ ] Quiz en groupe

### ⏳ Q3 2026
- [ ] Intégration calendrier (Google Calendar, Outlook)
- [ ] Chat IA personnel (Gemini conversationnel)
- [ ] Suggestions personnalisées

### ⏳ 2027
- [ ] Marketplace de contenus
- [ ] API publique REST
- [ ] Application mobile native

## 🎉 Accomplissements récents

### En chiffres
- **20+ fichiers** créés dans la dernière mise à jour
- **8 systèmes** majeurs implémentés (PWA, SRS, Search, Analytics, etc.)
- **20+ badges** de gamification
- **10 niveaux** de progression
- **4 formats** d'export supportés
- **100% des objectifs Q1 2026** atteints en avance!

### Systèmes complets implémentés
1. ✅ PWA avec Service Worker et cache offline
2. ✅ Système de flashcards avec algorithme SM-2
3. ✅ Recherche intelligente multi-cours avec fuzzy matching
4. ✅ Dashboard d'analytics avec visualisations
5. ✅ Gamification complète (badges, XP, niveaux, streaks)
6. ✅ Export multi-format (MD, PDF, JSON, Anki)
7. ✅ Notifications push et in-app
8. ✅ Validation améliorée avec retry réseau

## 🤝 Contribution

Toutes les contributions sont les bienvenues ! **Consultez le [Guide de Contribution](docs/CONTRIBUTING.md) pour les détails complets.**

### Quick start

1. **Fork** le projet
2. Créez une **branche** (`git checkout -b feature/AmazingFeature`)
3. **Committez** (`git commit -m 'feat: add some AmazingFeature'`)
4. **Push** (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

### Guidelines principales
- ✅ Suivre la structure modulaire
- ✅ Utiliser ES6+ et modules natifs
- ✅ Tester sur Chrome, Firefox et Safari
- ✅ Documenter les nouvelles fonctionnalités
- ✅ Maintenir la compatibilité PWA
- ✅ Respecter les [conventions de code](docs/CONTRIBUTING.md)

## 📝 Documentation

- **Guide de contribution :** [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- **Organisation fichiers :** [`docs/FILE_ORGANIZATION.md`](docs/FILE_ORGANIZATION.md)
- **Roadmap produit :** [`docs/FEATURES_ROADMAP.md`](docs/FEATURES_ROADMAP.md)
- **État d'implémentation :** [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md)
- **Optimisations :** [`docs/OPTIMIZATIONS.md`](docs/OPTIMIZATIONS.md)

## 📄 Licence

Ce projet est open source et disponible gratuitement pour tous les étudiants.

## ✉️ Contact

- **GitHub :** [Katsun1236](https://github.com/Katsun1236)
- **Repository :** [Projet_Blocus](https://github.com/Katsun1236/Projet_Blocus)
- **Issues :** [Ouvrir une issue](https://github.com/Katsun1236/Projet_Blocus/issues)

Pour toute question, suggestion ou bug report, n'hésitez pas à ouvrir une issue sur GitHub!

---

**Made with ❤️ for students, by students**

*Dernière mise à jour : Décembre 2024*