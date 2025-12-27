# Guide des Animations - Projet Blocus

Ce guide explique comment utiliser le système d'animations pour créer une expérience utilisateur fluide et moderne.

## Fichiers

- `assets/css/animations.css` - Styles d'animations
- `assets/js/animations.js` - Utilitaires JavaScript pour les animations

## Animations de base

### Fade In

```html
<div class="animate-fade-in">
    Contenu qui apparaît en fondu
</div>

<!-- Vitesses disponibles -->
<div class="animate-fade-in-fast">Rapide (0.2s)</div>
<div class="animate-fade-in">Normal (0.4s)</div>
<div class="animate-fade-in-slow">Lent (0.8s)</div>
```

### Slide In

```html
<!-- Depuis la droite -->
<div class="animate-slide-in-right">Contenu</div>

<!-- Depuis la gauche -->
<div class="animate-slide-in-left">Contenu</div>

<!-- Depuis le bas -->
<div class="animate-slide-in-bottom">Contenu</div>
```

### Scale In

```html
<div class="animate-scale-in">
    Apparaît avec un effet de zoom
</div>
```

## Animations en boucle

### Bounce

```html
<!-- En continu -->
<i class="fas fa-arrow-down animate-bounce"></i>

<!-- Une seule fois -->
<button class="animate-bounce-once">Cliquez-moi</button>
```

### Pulse

```html
<div class="animate-pulse">
    Pulsation continue
</div>
```

### Spin

```html
<!-- Rotation normale -->
<i class="fas fa-circle-notch animate-spin"></i>

<!-- Rotation lente -->
<i class="fas fa-sync animate-spin-slow"></i>
```

### Glow

```html
<button class="animate-glow">
    Bouton qui brille
</button>
```

## Effets de survol

### Lift (Élévation)

```html
<div class="hover-lift">
    Se soulève au survol
</div>
```

### Scale (Agrandissement)

```html
<img class="hover-scale" src="image.jpg" alt="">
```

### Glow (Lumineux)

```html
<button class="hover-glow">
    Brille au survol
</button>
```

### Brighten (Éclaircissement)

```html
<div class="hover-brighten">
    S'éclaircit au survol
</div>
```

### Border Slide

```html
<a href="#" class="hover-border-slide">
    Lien avec bordure animée
</a>
```

## Animations au scroll

### Scroll Reveal

```html
<div class="scroll-reveal">
    Apparaît quand on scrolle jusqu'à cet élément
</div>
```

Ou en JavaScript :

```javascript
import { initScrollReveal } from './assets/js/animations.js';

// Initialiser l'observer
initScrollReveal();
```

## Stagger (Décalage)

Anime les enfants d'un conteneur avec un délai :

```html
<div class="stagger-fade-in">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
</div>
```

Ou en JavaScript :

```javascript
import { addStaggerAnimation } from './assets/js/animations.js';

addStaggerAnimation('#container', 0.1); // 0.1s de délai entre chaque
```

## Animations de cartes

### Entrance

```html
<div class="card-entrance">
    Carte qui apparaît depuis le bas
</div>

<!-- Avec délai -->
<div class="card-entrance card-entrance-delayed">
    Carte avec délai
</div>
```

Ou en JavaScript :

```javascript
import { animateCardEntrance } from './assets/js/animations.js';

// Animer toutes les cartes
animateCardEntrance('.content-glass', true);
```

## Effets interactifs

### Ripple (Ondulation au clic)

```html
<button class="ripple">
    Bouton avec effet d'ondulation
</button>
```

Ou en JavaScript :

```javascript
import { addRippleEffect, addRippleToButtons } from './assets/js/animations.js';

// Sur un élément spécifique
addRippleEffect('#myButton');

// Sur tous les boutons
addRippleToButtons();
```

### Button Press

```html
<button class="btn-press">
    S'enfonce au clic
</button>
```

## Loading States

### Skeleton Loading

```html
<div class="skeleton-loading" style="width: 200px; height: 20px; border-radius: 4px;">
</div>
```

### Shimmer

```html
<div class="animate-shimmer" style="width: 100%; height: 100px;">
</div>
```

### Progress Bar

```html
<div style="height: 4px; background: #1f2937; overflow: hidden;">
    <div class="animate-progress" style="height: 100%; width: 100%; background: linear-gradient(90deg, #6366f1, #a855f7);">
    </div>
</div>
```

## Modales

### Animations de modales

```html
<!-- Backdrop -->
<div class="modal-backdrop fixed inset-0 bg-black/70">
    <!-- Contenu -->
    <div class="modal-content bg-gray-900 rounded-xl p-8">
        Contenu de la modale
    </div>
</div>
```

## Transitions personnalisées

### Smooth Transitions

```html
<!-- Toutes les propriétés -->
<div class="transition-all-smooth">
    Transitions fluides sur toutes les propriétés
</div>

<!-- Couleurs uniquement -->
<div class="transition-colors-smooth">
    Transitions sur les couleurs
</div>

<!-- Transform uniquement -->
<div class="transition-transform-smooth">
    Transitions sur les transformations
</div>

<!-- Opacité uniquement -->
<div class="transition-opacity-smooth">
    Transitions sur l'opacité
</div>
```

## Utilitaires JavaScript

### Compteur animé

```javascript
import { animateCounter } from './assets/js/animations.js';

animateCounter('#counter', 0, 100, 2000); // De 0 à 100 en 2 secondes
```

### Smooth Scroll

```javascript
import { smoothScrollTo } from './assets/js/animations.js';

smoothScrollTo('#section', 100); // Scroll vers #section avec offset de 100px
```

### Notifications

```javascript
import { showNotification } from './assets/js/animations.js';

showNotification('Opération réussie !', 'success', 3000);
showNotification('Une erreur s\'est produite', 'error', 3000);
showNotification('Attention !', 'warning', 3000);
showNotification('Information', 'info', 3000);
```

### Loading Shimmer

```javascript
import { addLoadingShimmer, removeLoadingShimmer } from './assets/js/animations.js';

// Ajouter
addLoadingShimmer('#element');

// Retirer
removeLoadingShimmer('#element');
```

## Auto-initialisation

Le fichier `animations.js` s'initialise automatiquement et applique :

- Scroll reveal sur tous les `.scroll-reveal`
- Ripple sur tous les boutons avec `.btn-press`
- Hover lift sur tous les `.content-glass`
- Animations d'entrée sur les cartes

Pour désactiver l'auto-init sur un élément :

```html
<div class="content-glass no-lift">
    Pas d'effet de lift
</div>

<button class="no-ripple">
    Pas d'effet ripple
</button>
```

## Performance

### GPU Acceleration

Pour des animations plus fluides :

```html
<div class="gpu-accelerated">
    Animations accélérées par le GPU
</div>
```

### Reduced Motion

Le système respecte automatiquement la préférence utilisateur `prefers-reduced-motion` pour l'accessibilité.

## Exemples complets

### Card avec tous les effets

```html
<div class="content-glass hover-lift scroll-reveal card-entrance">
    <h3>Titre de la carte</h3>
    <p>Contenu</p>
    <button class="btn-press ripple">Action</button>
</div>
```

### Liste avec stagger

```html
<div class="stagger-fade-in">
    <div class="content-glass hover-lift">Item 1</div>
    <div class="content-glass hover-lift">Item 2</div>
    <div class="content-glass hover-lift">Item 3</div>
</div>
```

### Bouton avec tous les effets

```html
<button class="
    btn-press
    ripple
    hover-glow
    transition-all-smooth
    bg-gradient-to-r from-indigo-600 to-purple-600
    px-6 py-3 rounded-xl
">
    Bouton stylé
</button>
```

## Bonnes pratiques

1. **Ne pas abuser des animations** - Trop d'animations nuit à l'UX
2. **Utiliser des durées appropriées** :
   - Micro-interactions : 0.1-0.3s
   - Transitions de pages : 0.3-0.5s
   - Loading states : 1-2s
3. **Respecter la hiérarchie** - Animer l'important en premier
4. **Tester sur mobile** - Les animations peuvent être lentes sur mobile
5. **Considérer l'accessibilité** - Le système gère `prefers-reduced-motion`

## Ressources

- [Animation Principles](https://material.io/design/motion/understanding-motion.html)
- [CSS Animation Performance](https://web.dev/animations/)
- [Accessibility and Motion](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
