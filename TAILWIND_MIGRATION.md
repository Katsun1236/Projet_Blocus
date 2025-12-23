# Migration Tailwind CDN → Build System

## Problème Actuel

⚠️ **Le site utilise actuellement Tailwind via CDN** :
```html
<script src="https://cdn.tailwindcss.com"></script>
```

**Inconvénients :**
- ~3MB de CSS non utilisé chargé à chaque page
- Performance dégradée (First Contentful Paint)
- Pas optimisé pour la production
- Avertissement dans la console

## Solution Recommandée

Migrer vers un build system avec PostCSS pour n'inclure que les classes utilisées.

---

## Option 1 : Installation Simple (Tailwind CLI)

### Étape 1 : Installation
```bash
npm install -D tailwindcss
npx tailwindcss init
```

### Étape 2 : Configuration `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./pages/**/*.html",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#050505',
        'accent-primary': '#6366f1',
        'accent-secondary': '#a855f7',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### Étape 3 : Créer `assets/css/input.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Vos styles personnalisés */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

:root {
    --bg-dark: #050505;
    --accent-primary: #6366f1;
    --accent-secondary: #a855f7;
    --text-primary: #ffffff;
    --text-secondary: #9ca3af;
}

/* ... reste de votre CSS personnalisé ... */
```

### Étape 4 : Script de build dans `package.json`
```json
{
  "scripts": {
    "build:css": "tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --minify",
    "watch:css": "tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch"
  }
}
```

### Étape 5 : Modifier vos fichiers HTML
Remplacer :
```html
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="assets/css/style.css">
```

Par :
```html
<link rel="stylesheet" href="assets/css/output.css">
```

### Étape 6 : Build & Deploy
```bash
# Pendant le développement
npm run watch:css

# Avant déploiement
npm run build:css
firebase deploy
```

---

## Option 2 : Vite (Recommandé pour SPA)

Si vous envisagez de refactoriser en SPA (React/Vue), utilisez Vite :

```bash
npm create vite@latest projet-blocus -- --template vanilla
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## Gains de Performance Estimés

| Métrique | Avant (CDN) | Après (Build) | Gain |
|----------|-------------|---------------|------|
| Taille CSS | ~3MB | ~50KB | **98%** |
| FCP (First Contentful Paint) | ~2.5s | ~1.2s | **52%** |
| LCP (Largest Contentful Paint) | ~3.8s | ~2.1s | **45%** |

---

## Checklist de Migration

- [ ] Installer Tailwind CLI localement
- [ ] Créer `tailwind.config.js` avec les chemins
- [ ] Créer `assets/css/input.css` avec @tailwind directives
- [ ] Copier les styles personnalisés dans input.css
- [ ] Tester le build : `npm run build:css`
- [ ] Mettre à jour tous les fichiers HTML
- [ ] Supprimer la ligne CDN Tailwind
- [ ] Tester localement toutes les pages
- [ ] Commit et deploy
- [ ] Vérifier la production

---

## Notes Importantes

1. **Ne pas commiter `output.css`** : Ajouter au `.gitignore`
2. **Build automatique avec Firebase** : Ajouter dans `firebase.json`
   ```json
   "hosting": {
     "predeploy": ["npm run build:css"]
   }
   ```

3. **Purge automatique** : Tailwind 3+ purge automatiquement le CSS non utilisé selon `content` dans la config

---

## Ressources

- [Tailwind CSS Installation](https://tailwindcss.com/docs/installation)
- [Tailwind CLI Documentation](https://tailwindcss.com/docs/installation/using-postcss)
- [Optimizing for Production](https://tailwindcss.com/docs/optimizing-for-production)
