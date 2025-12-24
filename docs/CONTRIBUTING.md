# 🤝 Guide de Contribution - Projet Blocus

Merci de vouloir contribuer au Projet Blocus ! Ce guide vous aidera à comprendre l'organisation du projet et les bonnes pratiques.

---

## 📋 Table des matières

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Structure du projet](#structure-du-projet)
4. [Standards de code](#standards-de-code)
5. [Processus de Pull Request](#processus-de-pull-request)
6. [Tests](#tests)

---

## 📜 Code de conduite

- Soyez respectueux et bienveillant
- Pas de discrimination ou harcèlement
- Concentrez-vous sur ce qui est meilleur pour la communauté
- Utilisez un langage accueillant et inclusif

---

## 🚀 Comment contribuer

### Types de contributions

1. **🐛 Rapporter des bugs**
   - Utiliser les [GitHub Issues](https://github.com/Katsun1236/Projet_Blocus/issues)
   - Fournir un maximum de détails (étapes de reproduction, navigateur, etc.)

2. **💡 Proposer des features**
   - Consulter d'abord la [Roadmap](FEATURES_ROADMAP.md)
   - Ouvrir une issue avec le tag "enhancement"

3. **📝 Améliorer la documentation**
   - Corriger les typos
   - Ajouter des exemples
   - Clarifier les explications

4. **💻 Contribuer du code**
   - Corriger des bugs
   - Implémenter des features
   - Optimiser les performances

---

## 📁 Structure du projet

Consultez [`FILE_ORGANIZATION.md`](FILE_ORGANIZATION.md) pour une vue détaillée.

### Organisation rapide

```
Projet_Blocus/
├── assets/
│   ├── css/           # Styles
│   ├── js/            # Scripts (24 fichiers)
│   └── images/        # Images (à optimiser en WebP)
├── pages/
│   ├── app/           # Pages application
│   └── auth/          # Pages authentification
├── docs/              # Documentation
├── scripts/           # Scripts utilitaires
├── sw.js              # Service Worker PWA
└── manifest.json      # PWA Manifest
```

### Où ajouter votre code ?

| Ce que vous ajoutez | Où le mettre |
|---------------------|--------------|
| Nouvelle feature JS | `assets/js/nom-feature.js` |
| Nouvelle page | `pages/app/nom-page.html` |
| Documentation | `docs/NOM_DOC.md` |
| Script build/util | `scripts/nom-script.js` |
| Tests | `tests/` (à créer) |

---

## 💻 Standards de code

### JavaScript

#### Style

```javascript
// ✅ BON
export class GamificationSystem {
    constructor(userId) {
        this.userId = userId;
    }

    async getUserData() {
        try {
            const data = await fetchData();
            return data;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }
}

// ❌ MAUVAIS
export class gamificationSystem {
  constructor(userId) {
this.userId=userId
}
async getUserData() {
const data=await fetchData()
return data
}
}
```

#### Règles

1. **ES6+ moderne**
   - Utiliser `const`/`let` (pas `var`)
   - Arrow functions quand approprié
   - Async/await plutôt que `.then()`
   - Modules ES6 (`import`/`export`)

2. **Nommage**
   - camelCase pour variables/fonctions : `getUserData()`
   - PascalCase pour classes : `GamificationSystem`
   - SCREAMING_SNAKE_CASE pour constantes : `MAX_RETRIES`

3. **Commentaires**
   - Documenter les fonctions complexes
   - Expliquer le "pourquoi", pas le "quoi"
   - Utiliser JSDoc pour les fonctions publiques

```javascript
/**
 * Calcule le prochain intervalle de révision selon l'algorithme SM-2
 * @param {number} easeFactor - Facteur de facilité (1.3-2.5)
 * @param {number} interval - Intervalle actuel en jours
 * @param {number} repetitions - Nombre de répétitions réussies
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @returns {Object} Nouveau state { easeFactor, interval, repetitions }
 */
function calculateNextReview(easeFactor, interval, repetitions, difficulty) {
    // Implémentation...
}
```

4. **Gestion d'erreurs**
   - Toujours utiliser try/catch pour async
   - Logger les erreurs de manière descriptive
   - Ne jamais laisser passer une erreur silencieusement

5. **Performance**
   - Éviter les boucles inutiles
   - Utiliser `const` par défaut
   - Préférer les méthodes natives (map, filter, reduce)

### HTML

```html
<!-- ✅ BON -->
<div class="flex items-center gap-4 p-6 bg-gray-900 rounded-xl">
    <i class="fas fa-check text-green-400"></i>
    <span>Tâche complétée</span>
</div>

<!-- ❌ MAUVAIS -->
<div class="flex items-center gap-4 p-6 bg-gray-900 rounded-xl"><i class="fas fa-check text-green-400"></i><span>Tâche complétée</span></div>
```

#### Règles

1. **Indentation** : 2 espaces
2. **Classes Tailwind** : Ordre logique (layout → spacing → colors → effects)
3. **Accessibilité** : Ajouter `aria-label`, `alt`, `role` quand nécessaire

### CSS (Tailwind)

Le projet utilise **Tailwind CSS** via CDN. Éviter le CSS custom sauf nécessaire.

```html
<!-- ✅ Utiliser Tailwind -->
<button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
    Cliquer
</button>

<!-- ❌ Éviter CSS custom -->
<style>
.custom-button {
    padding: 0.5rem 1rem;
    background: #4f46e5;
}
</style>
```

---

## 🔄 Processus de Pull Request

### 1. Fork et Clone

```bash
# Fork sur GitHub, puis :
git clone https://github.com/VOTRE_USERNAME/Projet_Blocus.git
cd Projet_Blocus
```

### 2. Créer une branche

```bash
# Nomenclature : type/description
git checkout -b feature/flashcards-export
git checkout -b fix/quiz-scoring-bug
git checkout -b docs/update-readme
```

Types de branches :
- `feature/` - Nouvelle fonctionnalité
- `fix/` - Correction de bug
- `docs/` - Documentation
- `refactor/` - Refactoring
- `style/` - Changements de style/format
- `test/` - Ajout de tests

### 3. Faire vos changements

```bash
# Commits atomiques et descriptifs
git add .
git commit -m "feat: add export to Anki for flashcards

- Implement CSV export format
- Add download button in flashcards page
- Update export.js with Anki format
"
```

**Format des commits (Conventional Commits) :**
```
type(scope): sujet

description détaillée (optionnel)
```

Types :
- `feat:` - Nouvelle feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Tâches de maintenance

### 4. Push et créer la PR

```bash
git push origin feature/flashcards-export
```

Puis sur GitHub :
1. Ouvrir une Pull Request
2. Remplir le template (description, tests effectués)
3. Attendre la review

### 5. Review et merge

- Répondre aux commentaires
- Faire les modifications demandées
- Une fois approuvé, la PR sera merged

---

## 🧪 Tests

### Tests manuels (actuellement)

Avant de soumettre une PR, tester :

1. **Fonctionnalité** : Ça marche comme prévu ?
2. **Cas limites** : Erreurs, champs vides, etc.
3. **Navigateurs** : Chrome, Firefox, Safari
4. **Mobile** : Test responsive
5. **Console** : Pas d'erreurs JavaScript

```bash
# Lancer un serveur local
python -m http.server 8000
# Puis ouvrir http://localhost:8000
```

### Tests automatisés (futur)

À venir :
- Unit tests (Vitest)
- E2E tests (Playwright)
- CI/CD (GitHub Actions)

---

## 🎨 Design et UX

### Thème visuel

- **Style** : Cyberpunk, dark mode, néon
- **Couleurs principales** :
  - Indigo : `#6366f1` (boutons, accents)
  - Purple : `#a855f7` (gradients)
  - Background : `#050505` (noir profond)
  - Cards : `#0f0f0f`, `#1a1a1a` (gris foncés)

### Cohérence UI

- Utiliser les composants existants (regarder `layout.js`)
- Suivre le design system Tailwind
- Animations douces (transitions 300ms)
- Icons : Font Awesome

---

## 📚 Ressources

### Documentation interne

- [Roadmap](FEATURES_ROADMAP.md) - Fonctionnalités prévues
- [Organisation](FILE_ORGANIZATION.md) - Structure du projet
- [Optimisations](OPTIMIZATIONS.md) - Performances
- [État d'implémentation](IMPLEMENTATION_STATUS.md) - Ce qui est fait

### Technologies utilisées

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase](https://firebase.google.com/docs)
- [Gemini API](https://ai.google.dev/docs)
- [PWA](https://web.dev/progressive-web-apps/)
- [Font Awesome](https://fontawesome.com/icons)

---

## ❓ Questions

Si vous avez des questions :
1. Consulter d'abord la [documentation](../README.md)
2. Chercher dans les [issues existantes](https://github.com/Katsun1236/Projet_Blocus/issues)
3. Ouvrir une nouvelle issue avec le tag "question"

---

## 🎉 Merci !

Chaque contribution, aussi petite soit-elle, est précieuse. Merci de rendre le Projet Blocus meilleur pour tous les étudiants ! 🚀

---

**Dernière mise à jour :** 24 décembre 2024
