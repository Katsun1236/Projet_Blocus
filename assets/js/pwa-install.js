/**
 * PWA Installation et Service Worker
 * Gère l'enregistrement du SW et l'installation de l'app
 */

(function() {
    'use strict';

    let deferredPrompt;
    let swRegistration;

    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                swRegistration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('✅ Service Worker enregistré:', swRegistration.scope);

                // Vérifier les mises à jour toutes les heures
                setInterval(() => {
                    swRegistration.update();
                }, 60 * 60 * 1000);

                // Écouter les mises à jour
                swRegistration.addEventListener('updatefound', () => {
                    const newWorker = swRegistration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });

            } catch (error) {
                console.error('❌ Erreur Service Worker:', error);
            }
        });
    }

    // Détecter l'événement beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Afficher le bouton d'installation
        showInstallButton();
    });

    // Bouton d'installation PWA
    function showInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');

        if (!installBtn) {
            createInstallButton();
        }
    }

    function createInstallButton() {
        // Vérifier si déjà installé
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return; // Déjà installé
        }

        const btn = document.createElement('button');
        btn.id = 'pwa-install-btn';
        btn.className = 'fixed bottom-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all flex items-center gap-2 font-bold text-sm';
        btn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Installer l'app</span>
        `;

        btn.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            console.log(`Installation PWA: ${outcome}`);

            if (outcome === 'accepted') {
                btn.style.opacity = '0';
                setTimeout(() => btn.remove(), 300);
            }

            deferredPrompt = null;
        });

        document.body.appendChild(btn);

        // Animation d'apparition
        setTimeout(() => {
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(100px)';
            btn.style.transition = 'all 0.5s ease';

            requestAnimationFrame(() => {
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            });
        }, 100);
    }

    // Notification de mise à jour
    function showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-6 z-50 bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-md';
        notification.innerHTML = `
            <i class="fas fa-sync-alt text-2xl"></i>
            <div class="flex-1">
                <p class="font-bold">Mise à jour disponible</p>
                <p class="text-sm text-indigo-200">Une nouvelle version de Projet Blocus est prête.</p>
            </div>
            <button id="update-btn" class="px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition">
                Actualiser
            </button>
        `;

        document.body.appendChild(notification);

        document.getElementById('update-btn').addEventListener('click', () => {
            if (swRegistration && swRegistration.waiting) {
                swRegistration.waiting.postMessage({ action: 'skipWaiting' });
                window.location.reload();
            }
        });
    }

    // Détection du mode standalone (app installée)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('🚀 PWA lancée en mode standalone');
        document.body.classList.add('pwa-standalone');
    }

    // Statut de connexion
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        const statusBar = document.getElementById('connection-status');

        if (!isOnline && !statusBar) {
            const bar = document.createElement('div');
            bar.id = 'connection-status';
            bar.className = 'fixed top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 text-sm font-bold z-[100]';
            bar.textContent = '⚠️ Vous êtes hors ligne - Certaines fonctionnalités sont limitées';
            document.body.prepend(bar);
        } else if (isOnline && statusBar) {
            statusBar.remove();
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Exporter pour usage global
    window.PWA = {
        getRegistration: () => swRegistration,
        clearCache: async () => {
            if (swRegistration) {
                return new Promise((resolve) => {
                    const messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = (event) => {
                        resolve(event.data);
                    };
                    swRegistration.active.postMessage(
                        { action: 'clearCache' },
                        [messageChannel.port2]
                    );
                });
            }
        }
    };

})();
