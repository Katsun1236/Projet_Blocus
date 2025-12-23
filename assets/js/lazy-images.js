/**
 * Lazy Loading automatique des images
 * Ajoute loading="lazy" et decoding="async" à toutes les images
 * pour améliorer les performances de chargement
 */

(function() {
    'use strict';

    // Fonction pour ajouter lazy loading aux images
    function enableLazyLoading() {
        const images = document.querySelectorAll('img:not([loading])');

        images.forEach(img => {
            // Ajouter lazy loading (sauf pour les images above the fold)
            const rect = img.getBoundingClientRect();
            const isAboveFold = rect.top < window.innerHeight;

            if (!isAboveFold) {
                img.setAttribute('loading', 'lazy');
            }

            // Ajouter decoding async pour toutes les images
            img.setAttribute('decoding', 'async');

            // Ajouter aspect-ratio pour éviter le layout shift
            if (img.width && img.height && !img.style.aspectRatio) {
                img.style.aspectRatio = `${img.width} / ${img.height}`;
            }
        });

        console.log(`✅ Lazy loading activé sur ${images.length} images`);
    }

    // Exécuter au chargement du DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableLazyLoading);
    } else {
        enableLazyLoading();
    }

    // Observer pour les images ajoutées dynamiquement
    if ('MutationObserver' in window) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'IMG' && !node.hasAttribute('loading')) {
                        node.setAttribute('loading', 'lazy');
                        node.setAttribute('decoding', 'async');
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();
