import { auth, db } from './config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuration du tutoriel par étapes
const TUTORIAL_STEPS = [
    {
        target: '#dashboard-link',
        title: "Bienvenue sur Projet Blocus ! 🦉",
        message: "Je suis Locus, ta mascotte ! Je vais te guider pour découvrir toutes les fonctionnalités. Clique sur 'Suivant' pour commencer !",
        position: 'right'
    },
    {
        target: '#courses-link',
        title: "Mes Cours 📚",
        message: "Ici, tu peux organiser tous tes cours dans des dossiers. Upload tes fichiers PDF, images ou notes pour les retrouver facilement.",
        position: 'right'
    },
    {
        target: '#quiz-link',
        title: "Quiz & IA 🧠",
        message: "Génère des quiz personnalisés avec l'IA ! Choisis un cours, sélectionne le type de questions (QCM, vrai/faux...) et teste tes connaissances.",
        position: 'right'
    },
    {
        target: '#synthesize-link',
        title: "Synthétiseur IA ✨",
        message: "L'outil le plus puissant ! Upload tes cours et l'IA crée automatiquement des résumés, fiches de révision, flashcards ou plans détaillés.",
        position: 'right'
    },
    {
        target: '#community-link',
        title: "Communauté 👥",
        message: "Partage tes synthèses avec d'autres étudiants et découvre celles qu'ils ont créées. L'entraide, c'est la clé du succès !",
        position: 'right'
    },
    {
        target: '#planning-link',
        title: "Planning 📅",
        message: "Organise ton blocus ! Crée des événements de révision, gère tes deadlines et reste productif avec un planning visuel.",
        position: 'right'
    },
    {
        target: '#user-avatar-header',
        title: "Ton Profil 👤",
        message: "Accède à ton profil ici pour personnaliser ton compte, voir tes statistiques et gérer tes paramètres.",
        position: 'bottom'
    },
    {
        target: null,
        title: "C'est parti ! 🚀",
        message: "Tu es prêt ! Commence par uploader un cours ou générer ta première synthèse. Bonne révision et bon blocus !",
        position: 'center'
    }
];

class OnboardingTutorial {
    constructor() {
        this.currentStep = 0;
        this.overlay = null;
        this.spotlight = null;
        this.mascot = null;
        this.isActive = false;
    }

    async shouldShowTutorial() {
        const user = auth.currentUser;
        if (!user) return false;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                // Vérifier si l'utilisateur a déjà vu le tutoriel
                return !data.hasCompletedOnboarding;
            }
            return true; // Nouvel utilisateur
        } catch (error) {
            console.error("Erreur vérification tutoriel:", error);
            return false;
        }
    }

    async start() {
        if (this.isActive) return;

        const shouldShow = await this.shouldShowTutorial();
        if (!shouldShow) return;

        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.createMascot();
        this.showStep(0);
    }

    createOverlay() {
        // Overlay assombrissant
        this.overlay = document.createElement('div');
        this.overlay.id = 'onboarding-overlay';
        this.overlay.className = 'fixed inset-0 bg-black/80 transition-all duration-300';
        this.overlay.style.cssText = 'z-index: 999999 !important; pointer-events: auto !important;';
        document.body.appendChild(this.overlay);

        // Spotlight circulaire
        this.spotlight = document.createElement('div');
        this.spotlight.id = 'onboarding-spotlight';
        this.spotlight.className = 'fixed rounded-full border-4 border-indigo-500 transition-all duration-500';
        this.spotlight.style.cssText = 'z-index: 1000000 !important; pointer-events: none !important; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8);';
        document.body.appendChild(this.spotlight);
    }

    createMascot() {
        this.mascot = document.createElement('div');
        this.mascot.id = 'onboarding-mascot';
        this.mascot.className = 'fixed bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-indigo-500 rounded-2xl shadow-2xl p-6 max-w-md transition-all duration-500';
        this.mascot.style.cssText = 'z-index: 1000001 !important; pointer-events: auto !important;';

        // Utiliser une vraie image si disponible, sinon emoji
        const mascotImage = '../../assets/images/owl-logo.png';

        this.mascot.innerHTML = `
            <div class="flex items-start gap-4 mb-4">
                <div class="flex-shrink-0 w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
                    <img src="${mascotImage}" alt="Locus" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <span class="text-3xl hidden">🦉</span>
                </div>
                <div class="flex-grow">
                    <h3 id="onboarding-title" class="text-xl font-bold text-white mb-2"></h3>
                    <p id="onboarding-message" class="text-gray-300 text-sm leading-relaxed"></p>
                </div>
            </div>
            <div class="flex items-center justify-between pt-4 border-t border-gray-700">
                <div class="flex gap-2">
                    ${Array(TUTORIAL_STEPS.length).fill(0).map((_, i) =>
                        `<div class="w-2 h-2 rounded-full bg-gray-600 onboarding-dot" data-step="${i}"></div>`
                    ).join('')}
                </div>
                <div class="flex gap-3">
                    <button id="onboarding-skip" class="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors">
                        Passer
                    </button>
                    <button id="onboarding-prev" class="hidden px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all">
                        Précédent
                    </button>
                    <button id="onboarding-next" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
                        Suivant
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.mascot);

        // Event listeners
        document.getElementById('onboarding-next').addEventListener('click', () => this.nextStep());
        document.getElementById('onboarding-prev').addEventListener('click', () => this.prevStep());
        document.getElementById('onboarding-skip').addEventListener('click', () => this.skip());
    }

    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= TUTORIAL_STEPS.length) return;

        this.currentStep = stepIndex;
        const step = TUTORIAL_STEPS[stepIndex];

        // Mettre à jour le contenu
        document.getElementById('onboarding-title').textContent = step.title;
        document.getElementById('onboarding-message').textContent = step.message;

        // Mettre à jour les points de progression
        document.querySelectorAll('.onboarding-dot').forEach((dot, i) => {
            if (i === stepIndex) {
                dot.classList.add('bg-indigo-500');
                dot.classList.remove('bg-gray-600');
            } else if (i < stepIndex) {
                dot.classList.add('bg-indigo-700');
                dot.classList.remove('bg-gray-600', 'bg-indigo-500');
            } else {
                dot.classList.add('bg-gray-600');
                dot.classList.remove('bg-indigo-500', 'bg-indigo-700');
            }
        });

        // Gérer la visibilité des boutons
        const prevBtn = document.getElementById('onboarding-prev');
        const nextBtn = document.getElementById('onboarding-next');

        if (stepIndex === 0) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }

        if (stepIndex === TUTORIAL_STEPS.length - 1) {
            nextBtn.textContent = 'Terminer';
        } else {
            nextBtn.textContent = 'Suivant';
        }

        // Positionner le spotlight et la mascotte
        this.updatePositions(step);
    }

    updatePositions(step) {
        if (step.target) {
            const target = document.querySelector(step.target);
            if (!target) {
                console.warn(`Target not found: ${step.target}, centering mascot instead`);
                // Si l'élément n'existe pas, centrer la mascotte
                this.spotlight.style.opacity = '0';
                this.mascot.style.top = '50%';
                this.mascot.style.left = '50%';
                this.mascot.style.transform = 'translate(-50%, -50%)';
                return;
            }

            const rect = target.getBoundingClientRect();
            const padding = 20;

            // Positionner le spotlight
            this.spotlight.style.left = `${rect.left - padding}px`;
            this.spotlight.style.top = `${rect.top - padding}px`;
            this.spotlight.style.width = `${rect.width + padding * 2}px`;
            this.spotlight.style.height = `${rect.height + padding * 2}px`;
            this.spotlight.style.opacity = '1';

            // Positionner la mascotte selon la position spécifiée
            this.positionMascot(rect, step.position);
        } else {
            // Pas de cible : centrer la mascotte et cacher le spotlight
            this.spotlight.style.opacity = '0';
            this.mascot.style.top = '50%';
            this.mascot.style.left = '50%';
            this.mascot.style.transform = 'translate(-50%, -50%)';
        }
    }

    positionMascot(targetRect, position) {
        const mascotWidth = 400; // Estimation
        const mascotHeight = 250;
        const margin = 30;

        switch (position) {
            case 'right':
                this.mascot.style.left = `${targetRect.right + margin}px`;
                this.mascot.style.top = `${targetRect.top}px`;
                this.mascot.style.transform = 'none';
                break;
            case 'left':
                this.mascot.style.left = `${targetRect.left - mascotWidth - margin}px`;
                this.mascot.style.top = `${targetRect.top}px`;
                this.mascot.style.transform = 'none';
                break;
            case 'bottom':
                this.mascot.style.left = `${targetRect.left}px`;
                this.mascot.style.top = `${targetRect.bottom + margin}px`;
                this.mascot.style.transform = 'none';
                break;
            case 'top':
                this.mascot.style.left = `${targetRect.left}px`;
                this.mascot.style.top = `${targetRect.top - mascotHeight - margin}px`;
                this.mascot.style.transform = 'none';
                break;
            case 'center':
                this.mascot.style.top = '50%';
                this.mascot.style.left = '50%';
                this.mascot.style.transform = 'translate(-50%, -50%)';
                break;
        }
    }

    nextStep() {
        if (this.currentStep < TUTORIAL_STEPS.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    async skip() {
        const confirmed = confirm("Es-tu sûr de vouloir passer le tutoriel ? Tu pourras toujours le relancer depuis ton profil.");
        if (confirmed) {
            await this.markAsCompleted();
            this.close();
        }
    }

    async complete() {
        await this.markAsCompleted();
        this.close();

        // Message de félicitations
        this.showCompletionMessage();
    }

    async markAsCompleted() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                hasCompletedOnboarding: true,
                onboardingCompletedAt: new Date()
            });
        } catch (error) {
            console.error("Erreur sauvegarde tutoriel:", error);
        }
    }

    close() {
        if (this.overlay) this.overlay.remove();
        if (this.spotlight) this.spotlight.remove();
        if (this.mascot) this.mascot.remove();
        this.isActive = false;
    }

    showCompletionMessage() {
        const msg = document.createElement('div');
        msg.className = 'fixed top-4 right-4 z-[1002] bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-fade-in-up';
        msg.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">🎉</span>
                <div>
                    <p class="font-bold">Tutoriel terminé !</p>
                    <p class="text-sm opacity-90">Tu peux maintenant profiter de toutes les fonctionnalités.</p>
                </div>
            </div>
        `;
        document.body.appendChild(msg);

        setTimeout(() => msg.remove(), 5000);
    }

    // Méthode pour relancer le tutoriel manuellement
    async restart() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                hasCompletedOnboarding: false
            });
            this.start();
        } catch (error) {
            console.error("Erreur relance tutoriel:", error);
        }
    }
}

// Export singleton
export const onboarding = new OnboardingTutorial();
