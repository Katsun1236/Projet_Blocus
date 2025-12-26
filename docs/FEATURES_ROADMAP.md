# 🗺️ Roadmap des Fonctionnalités - Projet Blocus

**Version:** 1.0.0
**Dernière mise à jour:** 23 décembre 2025

---

## 🎯 Vision du Projet

Projet Blocus vise à devenir **LA** plateforme gratuite d'étude assistée par IA pour tous les étudiants francophones. Notre objectif est de rendre la révision plus efficace, collaborative et accessible.

---

## ✅ Fonctionnalités Actuelles

### 📚 Gestion de Cours
- Upload de fichiers PDF, images, notes
- Organisation en dossiers
- Visualisation des cours

### 🧠 IA Générative
- Génération de synthèses (via Gemini API)
- Création de quiz (QCM, QRM, Vrai/Faux)
- Textes à trous
- Fiches de révision

### 👥 Communauté
- Système de posts et commentaires
- Groupes d'étude avec chat
- Partage de fichiers entre membres
- Système de rôles et permissions

### 📅 Planning
- Calendrier de révision
- Événements et deadlines
- Vue personnalisée

### 👤 Profil Utilisateur
- Customisation du profil
- Statistiques d'utilisation
- Système de points

---

## 🚀 Nouvelles Fonctionnalités Proposées

### 🔴 **HAUTE PRIORITÉ**

#### 1. Mode Hors Ligne (PWA)
**Pourquoi:** Permettre la révision même sans connexion internet

**Fonctionnalités:**
- Service Worker pour cache des pages
- Synchronisation des données en arrière-plan
- Notification "Vous êtes hors ligne"
- Accès aux derniers cours consultés

**Implémentation:**
```javascript
// manifest.json
{
  "name": "Projet Blocus",
  "short_name": "Blocus",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#050505",
  "theme_color": "#6366f1",
  "icons": [...]
}
```

**Impact:** 📈 Utilisation +40% / Satisfaction +60%

---

#### 2. Flashcards Intelligentes (Spaced Repetition)
**Pourquoi:** Mémorisation optimale grâce à la répétition espacée

**Fonctionnalités:**
- Génération automatique de flashcards depuis les cours
- Algorithme de répétition espacée (SM-2)
- Statistiques de mémorisation
- Mode révision rapide

**Exemple d'utilisation:**
```
1. Upload cours PDF
2. IA génère 50 flashcards
3. Algorithme planifie les révisions
4. Notification: "5 cartes à réviser aujourd'hui"
```

**Impact:** 📈 Rétention +70% / Engagement +50%

---

#### 3. Recherche Intelligente Multi-Cours
**Pourquoi:** Trouver rapidement une information dans tous ses cours

**Fonctionnalités:**
- Recherche full-text dans tous les documents
- Suggestions intelligentes (IA)
- Filtres avancés (date, matière, type)
- Prévisualisation des résultats

**Technologies:**
- Algolia Search ou MeiliSearch
- Embeddings Gemini pour recherche sémantique

**Impact:** 📈 Productivité +35% / Temps gagné: 2h/semaine

---

#### 4. Statistiques et Analytics Avancées
**Pourquoi:** Suivre sa progression et identifier les faiblesses

**Dashboard incluant:**
- Temps de révision par matière
- Taux de réussite aux quiz
- Progression semaine/mois
- Suggestions personnalisées IA
- Comparaison avec la moyenne

**Visualisations:**
- Graphiques de progression
- Heatmap de révision
- Radial chart des matières

**Impact:** 📈 Motivation +45% / Résultats +25%

---

### 🟡 **PRIORITÉ MOYENNE**

#### 5. Collaboration Temps Réel
**Fonctionnalités:**
- Édition collaborative de notes
- Whiteboard partagé pour brainstorming
- Quiz en groupe avec classement
- Sessions de révision en direct

**Technologies:**
- Firebase Realtime Database
- WebRTC pour visio (optionnel)

---

#### 6. Gamification
**Système de récompenses:**
- Badges et achievements
- Streaks de révision quotidienne
- Classements (hebdo/mensuel)
- Système de niveaux XP

**Exemples de badges:**
- 🔥 "Streaker" - 7 jours consécutifs
- 📚 "Bookworm" - 100 pages lues
- 🧠 "Quiz Master" - 50 quiz terminés
- 👑 "Top Contributor" - 20 synthèses partagées

**Impact:** 📈 Engagement +80% / Rétention +55%

---

#### 7. Export Multi-Format
**Formats supportés:**
- PDF (synthèses formatées)
- Anki (flashcards)
- Notion (via API)
- Google Docs
- Markdown

**Cas d'usage:**
- Imprimer des fiches pour réviser
- Importer dans Anki pour SRS
- Partager avec des amis

---

#### 8. Notifications Intelligentes
**Types de notifications:**
- Rappels de révision personnalisés
- Nouveau contenu dans les groupes
- Deadlines approchant
- Suggestions IA ("Tu devrais réviser X")
- Accomplissements

**Canaux:**
- Push browser
- Email digest (quotidien/hebdo)
- Discord webhook (optionnel)

---

#### 9. Intégration Calendrier
**Synchronisation avec:**
- Google Calendar
- Outlook Calendar
- Apple Calendar
- iCal

**Fonctionnalités:**
- Import d'horaires de cours
- Export des événements de révision
- Sync bidirectionnelle

---

### 🔵 **PRIORITÉ BASSE**

#### 10. Tutoriels Vidéo Générés par IA
**Concept:** Transformer un PDF en vidéo explicative

**Technologies:**
- Gemini Vision pour analyser le contenu
- TTS (Text-to-Speech) pour voix off
- Motion graphics automatiques

**Status:** 🔬 Expérimental / R&D

---

#### 11. Chat IA Personnel (Chatbot)
**Fonctionnalités:**
- Poser des questions sur ses cours
- Demander des explications
- Suggestions de révision
- Assistant virtuel Locus

**Exemple:**
```
User: "Explique-moi la photosynthèse"
Locus AI: "D'après ton cours de Biologie L1, la photosynthèse..."
```

---

#### 12. Marketplace de Contenus
**Concept:** Vendre/acheter des synthèses premium

**Fonctionnalités:**
- Créateurs de contenu certifiés
- Système de paiement (Stripe)
- Notation et reviews
- Reversement aux créateurs (70/30)

**Impact:** 💰 Monétisation + Contenu de qualité

---

#### 13. API Publique
**Pour développeurs:**
- Accès aux fonctionnalités IA
- Webhooks
- Rate limiting
- Documentation complète

**Use cases:**
- Intégrations tierces
- Extensions navigateur
- Apps mobiles

---

## 📊 Matrice de Priorisation

| Feature | Impact | Effort | Priorité | ETA |
|---------|--------|--------|----------|-----|
| PWA Offline | Élevé | Moyen | 🔴 Haute | Q1 2026 |
| Flashcards SRS | Très élevé | Élevé | 🔴 Haute | Q1 2026 |
| Recherche Multi-Cours | Élevé | Moyen | 🔴 Haute | Q1 2026 |
| Analytics Avancées | Moyen | Faible | 🔴 Haute | Q1 2026 |
| Collaboration Temps Réel | Moyen | Élevé | 🟡 Moyenne | Q2 2026 |
| Gamification | Élevé | Moyen | 🟡 Moyenne | Q2 2026 |
| Export Multi-Format | Moyen | Faible | 🟡 Moyenne | Q2 2026 |
| Notifications | Moyen | Faible | 🟡 Moyenne | Q2 2026 |
| Intégration Calendrier | Faible | Moyen | 🔵 Basse | Q3 2026 |
| Vidéos IA | Très élevé | Très élevé | 🔵 R&D | Q4 2026 |
| Chat IA Personnel | Élevé | Élevé | 🔵 Basse | Q3 2026 |
| Marketplace | Très élevé | Très élevé | 🔵 Basse | 2027 |
| API Publique | Moyen | Élevé | 🔵 Basse | 2027 |

---

## 🐛 Corrections de Bugs Identifiés

### En Cours
1. ⏳ Optimisation des images (locus_asset1.png = 5.7MB)
2. ⏳ Division de community.js (trop volumineux)

### À Faire
3. 📝 Validation des formulaires côté client améliorée
4. 📝 Gestion d'erreurs réseau plus robuste
5. 📝 Amélioration de l'accessibilité (ARIA labels)
6. 📝 Tests sur Safari/iOS (compatibilité)
7. 📝 Optimisation du chargement initial (lazy loading)

---

## 💡 Idées en Vrac (Brainstorm)

- 🎙️ Génération de podcasts audio depuis les cours
- 🌍 Support multilingue (EN, ES, DE)
- 📱 Application mobile native (React Native)
- 🎨 Thèmes personnalisables (dark, light, custom)
- 🤖 Intégration avec ChatGPT / Claude
- 📊 Dashboard enseignant (analytics classes)
- 🎓 Certification de révision (proof of study)
- 🔗 Intégration Moodle/Blackboard
- 🧪 Mode "Blitz" (révision intensive 24h)
- 🎯 Objectifs SMART personnalisés

---

## 📣 Feedback Utilisateurs

### Demandes Fréquentes
1. "Mode nuit moins agressif pour les yeux" ⭐⭐⭐⭐⭐
2. "Plus de types de quiz (drag & drop, ordre)" ⭐⭐⭐⭐
3. "Notifications de révision" ⭐⭐⭐⭐
4. "Export vers Anki" ⭐⭐⭐⭐⭐
5. "App mobile" ⭐⭐⭐⭐⭐

### Bugs Rapportés
- Chat de groupe parfois lent (>5 membres)
- Upload de gros fichiers timeout
- Notifications parfois en double

---

## 🎯 Objectifs 2026

### Q1 (Jan-Mar)
- ✅ PWA fonctionnel
- ✅ Flashcards avec SRS
- ✅ Recherche multi-cours
- ✅ Analytics v1

### Q2 (Avr-Juin)
- Gamification complète
- Export Anki/PDF
- Notifications push
- 10,000 utilisateurs actifs

### Q3 (Juil-Sept)
- Collaboration temps réel
- Chat IA Locus
- App mobile (beta)
- 25,000 utilisateurs

### Q4 (Oct-Déc)
- Intégration calendriers
- Marketplace beta
- 50,000 utilisateurs
- Rentabilité

---

## 🤝 Comment Contribuer

1. **Proposer une feature:** Ouvrir une issue GitHub avec le tag `feature-request`
2. **Voter:** Réagir avec 👍 sur les features qui vous intéressent
3. **Développer:** Fork le repo, créer une branche, PR
4. **Tester:** Rejoindre le programme beta

---

## 📞 Contact & Feedback

- **GitHub Issues:** [github.com/Katsun1236/Projet_Blocus/issues](https://github.com/Katsun1236/Projet_Blocus/issues)
- **Email:** feedback@projetblocus.com (à créer)
- **Discord:** discord.gg/blocus (à créer)

---

**Note:** Cette roadmap est évolutive et sera mise à jour régulièrement en fonction des retours utilisateurs et des contraintes techniques.

**Maintenu par:** L'équipe Projet Blocus
**Licence:** MIT
