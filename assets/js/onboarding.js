import { auth, supabase } from './supabase-config.js';

const TUTORIAL_STEPS = [
    {
        target: '#dashboard-link',
        title: "Bienvenue sur Projet Blocus ! 🦉",
        message: "Je suis Locus, ta mascotte ! Je vais te guider pour découvrir toutes les fonctionnalités. Clique sur 'Visiter' pour explorer ou 'Suivant' pour continuer.",
        position: 'right',
        visitUrl: '../app/dashboard.html'
    },
    {
        target: '#courses-link',
        title: "Mes Cours 📚",
        message: "Ici, tu peux organiser tous tes cours dans des dossiers. Upload tes fichiers PDF, images ou notes pour les retrouver facilement. Visite la page pour découvrir l'interface !",
        position: 'right',
        visitUrl: '../app/courses.html'
    },
    {
        target: '#quiz-link',
        title: "Quiz & IA 🧠",
        message: "Génère des quiz personnalisés avec l'IA ! Choisis un cours, sélectionne le type de questions (QCM, vrai/faux...) et teste tes connaissances. Essaie-le maintenant !",
        position: 'right',
        visitUrl: '../app/quiz.html'
    },
    {
        target: '#synthesize-link',
        title: "Synthétiseur IA ✨",
        message: "L'outil le plus puissant ! Upload tes cours et l'IA crée automatiquement des résumés, fiches de révision, flashcards ou plans détaillés. Découvre la magie de l'IA !",
        position: 'right',
        visitUrl: '../app/synthesize.html'
    },
    {
        target: '#community-link',
        title: "Communauté 👥",
        message: "Partage tes synthèses avec d'autres étudiants et découvre celles qu'ils ont créées. L'entraide, c'est la clé du succès ! Rejoins la communauté !",
        position: 'right',
        visitUrl: '../app/community.html'
    },
    {
        target: '#planning-link',
        title: "Planning 📅",
        message: "Organise ton blocus ! Crée des événements de révision, gère tes deadlines et reste productif avec un planning visuel. Planifie ton succès !",
        position: 'right',
        visitUrl: '../app/planning.html'
    },
    {
        target: '#user-avatar-header',
        title: "Ton Profil 👤",
        message: "Accède à ton profil ici pour personnaliser ton compte, voir tes statistiques et gérer tes paramètres. Fais-en ta page personnelle !",
        position: 'bottom',
        visitUrl: '../app/profile.html'
    },
    {
        target: null,
        title: "C'est parti ! 🚀",
        message: "Tu es prêt ! Commence par uploader un cours ou générer ta première synthèse. Bonne révision et bon blocus !",
        position: 'center',
        visitUrl: null
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('has_completed_onboarding')
                .eq('id', user.id)
                .single();

            if (error || !data) return true;
            return !data.has_completed_onboarding;
        } catch (error) {
            console.error("Erreur vérification tutoriel:", error);
            return false;
        }
    }

    async start() {
        if (this.isActive) return;

        const inProgress = localStorage.getItem('onboarding_in_progress');
        const savedStep = localStorage.getItem('onboarding_current_step');

        if (inProgress === 'true' && savedStep !== null) {
            localStorage.removeItem('onboarding_in_progress');
            this.isActive = true;
            const parsedStep = parseInt(savedStep);
            this.currentStep = isNaN(parsedStep) ? 0 : parsedStep;
            this.createOverlay();
            this.createMascot();
            this.showStep(this.currentStep);
            this.showResumeMessage();
            return;
        }

        const shouldShow = await this.shouldShowTutorial();
        if (!shouldShow) return;

        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.createMascot();
        this.showStep(0);
    }

    showResumeMessage() {
        const msg = document.createElement('div');
        msg.className = 'fixed top-4 right-4 z-[1000002] bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-fade-in-up';
        msg.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">🦉</span>
                <div>
                    <p class="font-bold">Locus est de retour !</p>
                    <p class="text-sm opacity-90">On continue le tutoriel ensemble ?</p>
                </div>
            </div>
        `;
        document.body.appendChild(msg);

        setTimeout(() => msg.remove(), 4000);
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'onboarding-overlay';
        this.overlay.className = 'fixed inset-0 bg-black/80 transition-all duration-300';
        this.overlay.style.cssText = 'z-index: 999999 !important; pointer-events: auto !important;';
        document.body.appendChild(this.overlay);

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

        const mascotImage = '../../assets/images/locus-happy-mascot.png';

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
            <div class="pt-4 border-t border-gray-700">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex gap-2">
                        ${Array(TUTORIAL_STEPS.length).fill(0).map((_, i) =>
                            `<div class="w-2 h-2 rounded-full bg-gray-600 onboarding-dot" data-step="${i}"></div>`
                        ).join('')}
                    </div>
                    <button id="onboarding-skip-all" class="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                        Tout passer
                    </button>
                </div>
                <div class="flex gap-2">
                    <button id="onboarding-skip-step" class="flex-1 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 text-xs font-medium rounded-lg transition-colors">
                        Passer cette étape
                    </button>
                    <button id="onboarding-prev" class="hidden px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button id="onboarding-visit" class="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20">
                        <i class="fas fa-rocket mr-1"></i> Visiter
                    </button>
                    <button id="onboarding-next" class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
                        Suivant <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.mascot);

        document.getElementById('onboarding-next').addEventListener('click', () => this.nextStep());
        document.getElementById('onboarding-prev').addEventListener('click', () => this.prevStep());
        document.getElementById('onboarding-visit').addEventListener('click', () => this.visitFeature());
        document.getElementById('onboarding-skip-step').addEventListener('click', () => this.skipStep());
        document.getElementById('onboarding-skip-all').addEventListener('click', () => this.skipAll());
    }

    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= TUTORIAL_STEPS.length) return;

        this.currentStep = stepIndex;
        const step = TUTORIAL_STEPS[stepIndex];

        document.getElementById('onboarding-title').textContent = step.title;
        document.getElementById('onboarding-message').textContent = step.message;

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

        const prevBtn = document.getElementById('onboarding-prev');
        const nextBtn = document.getElementById('onboarding-next');
        const visitBtn = document.getElementById('onboarding-visit');

        if (stepIndex === 0) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }

        if (stepIndex === TUTORIAL_STEPS.length - 1) {
            nextBtn.innerHTML = 'Terminer <i class="fas fa-check ml-1"></i>';
        } else {
            nextBtn.innerHTML = 'Suivant <i class="fas fa-arrow-right ml-1"></i>';
        }

        if (step.visitUrl) {
            visitBtn.classList.remove('hidden');
        } else {
            visitBtn.classList.add('hidden');
        }

        this.updatePositions(step);
    }

    updatePositions(step) {
        if (step.target) {
            const target = document.querySelector(step.target);
            if (!target) {
                console.warn(`Target not found: ${step.target}, centering mascot instead`);
                this.spotlight.style.opacity = '0';
                this.mascot.style.top = '50%';
                this.mascot.style.left = '50%';
                this.mascot.style.transform = 'translate(-50%, -50%)';
                return;
            }

            const rect = target.getBoundingClientRect();
            const padding = 20;

            this.spotlight.style.left = `${rect.left - padding}px`;
            this.spotlight.style.top = `${rect.top - padding}px`;
            this.spotlight.style.width = `${rect.width + padding * 2}px`;
            this.spotlight.style.height = `${rect.height + padding * 2}px`;
            this.spotlight.style.opacity = '1';

            this.positionMascot(rect, step.position);
        } else {
            this.spotlight.style.opacity = '0';
            this.mascot.style.top = '50%';
            this.mascot.style.left = '50%';
            this.mascot.style.transform = 'translate(-50%, -50%)';
        }
    }

    positionMascot(targetRect, position) {
        const mascotWidth = 400;
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

    visitFeature() {
        const step = TUTORIAL_STEPS[this.currentStep];
        if (step.visitUrl) {
            localStorage.setItem('onboarding_in_progress', 'true');
            localStorage.setItem('onboarding_current_step', this.currentStep);

            window.location.href = step.visitUrl;
        }
    }

    skipStep() {
        if (this.currentStep < TUTORIAL_STEPS.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    async skipAll() {
        const confirmed = confirm("Es-tu sûr de vouloir passer tout le tutoriel ? Tu pourras toujours le relancer depuis ton profil.");
        if (confirmed) {
            await this.markAsCompleted();
            this.close();
        }
    }

    async complete() {
        await this.markAsCompleted();
        this.close();

        this.showCompletionMessage();
    }

    async markAsCompleted() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            await supabase
                .from('users')
                .update({
                    has_completed_onboarding: true,
                    onboarding_completed_at: new Date().toISOString()
                })
                .eq('id', user.id);
        } catch (error) {
            console.error("Erreur sauvegarde tutoriel:", error);
        }
    }

    close() {
        if (this.overlay) this.overlay.remove();
        if (this.spotlight) this.spotlight.remove();
        if (this.mascot) this.mascot.remove();
        this.isActive = false;

        localStorage.removeItem('onboarding_in_progress');
        localStorage.removeItem('onboarding_current_step');
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

    async restart() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            await supabase
                .from('users')
                .update({ has_completed_onboarding: false })
                .eq('id', user.id);
            this.start();
        } catch (error) {
            console.error("Erreur relance tutoriel:", error);
        }
    }
}

export const onboarding = new OnboardingTutorial();
