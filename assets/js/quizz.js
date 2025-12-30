import { auth, supabase } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';
// import { initSpeedInsights } from './speed-insights.js';

// Initialize Speed Insights for performance monitoring
// initSpeedInsights(); // Disabled for now

console.log('🚀🚀🚀 QUIZZ.JS SCRIPT LOADED 🚀🚀🚀');

// Barre de progression pour la génération de quiz
function showQuizProgress() {
    const tips = [
        "🧠 Astuce : Les quiz actifs renforcent mieux la mémoire que la lecture passive",
        "⏰ Conseil : Prenez une pause toutes les 20 minutes pour maintenir votre concentration",
        "🎯 Objectif : Visez 80% de bonnes réponses avant de passer au niveau suivant",
        "📝 Méthode : Éliminez les mauvaises réponses d'abord pour augmenter vos chances",
        "🔄 Répétition : Revoyez les questions où vous avez fait des erreurs",
        "🎮 Gamification : Challengez-vous avec des temps limites pour plus d'engagement",
        "🤔 Réflexion : Lisez attentivement chaque question avant de répondre",
        "📊 Progression : Notez vos améliorations pour rester motivé",
        "🏆 Récompense : Célébrez vos succès même les plus petits",
        "🌙 Sommeil : Une bonne nuit de sommeil améliore les performances aux quiz"
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    // Créer ou mettre à jour le conteneur de progression
    let progressContainer = document.getElementById('quiz-progress-container');
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'quiz-progress-container';
        progressContainer.className = 'mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300';
        const modalBody = document.querySelector('#new-quiz-modal .p-6.overflow-y-auto');
        if (modalBody) {
            modalBody.appendChild(progressContainer);
        }
    }
    
    progressContainer.innerHTML = `
        <div class="flex items-start gap-2">
            <span class="text-blue-400 mt-1">🧠</span>
            <div class="flex-1">
                <div class="font-medium text-blue-200 mb-1">Pendant que nous générons votre quiz...</div>
                <div class="mb-2">${randomTip}</div>
                <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div id="quiz-progress-bar" class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out" style="width: 0%"></div>
                </div>
                <div class="text-xs text-blue-400 mt-1">
                    <span id="quiz-progress-text">0%</span> • Analyse du sujet...
                </div>
            </div>
        </div>
    `;
    
    // Démarrer la progression animée
    startQuizProgress();
}

function startQuizProgress() {
    let progress = 0;
    const progressBar = document.getElementById('quiz-progress-bar');
    const progressText = document.getElementById('quiz-progress-text');
    
    if (!progressBar || !progressText) return;
    
    const steps = [
        { progress: 15, text: "Analyse du sujet...", delay: 600 },
        { progress: 30, text: "Génération des questions...", delay: 1000 },
        { progress: 50, text: "Création des réponses...", delay: 1400 },
        { progress: 70, text: "Vérification des questions...", delay: 1800 },
        { progress: 85, text: "Mise en forme du quiz...", delay: 2200 },
        { progress: 95, text: "Finalisation...", delay: 2600 }
    ];
    
    let currentStep = 0;
    
    function updateProgress() {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            progress = step.progress;
            
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            // Mettre à jour le texte
            const textContainer = progressText.parentElement;
            if (textContainer) {
                textContainer.innerHTML = `<span id="quiz-progress-text">${progress}%</span> • ${step.text}`;
            }
            
            currentStep++;
            setTimeout(updateProgress, step.delay);
        } else {
            // Progression terminée, attendre la fin réelle
            setTimeout(() => {
                if (progressBar) {
                    progressBar.style.width = '100%';
                    progressText.textContent = '100%';
                    const textContainer = progressText.parentElement;
                    if (textContainer) {
                        textContainer.innerHTML = `<span id="quiz-progress-text">100%</span> • Quiz prêt !`;
                    }
                }
            }, 800);
        }
    }
    
    updateProgress();
}

function stopQuizProgress() {
    const progressContainer = document.getElementById('quiz-progress-container');
    if (progressContainer) {
        progressContainer.remove();
    }
}

let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let isGenerating = false;
let userSyntheses = [];
let userCourses = [];

const ui = {
    dashboard: document.getElementById('quiz-dashboard'),
    player: document.getElementById('quiz-player'),
    results: document.getElementById('results-container'),
    btnNewQuizHero: document.getElementById('btn-new-quiz-hero'),
    btnNewQuizHeader: document.getElementById('btn-new-quiz-header'),
    quizGrid: document.getElementById('quiz-grid'),
    modal: document.getElementById('new-quiz-modal'),
    closeModal: document.getElementById('close-modal-btn'),
    cancelBtn: document.getElementById('cancel-quiz-btn'),
    generateBtn: document.getElementById('generate-quiz-btn'),
    loadingContainer: document.getElementById('loading-bar-container'),
    sourceRadios: document.getElementsByName('quiz-source'),
    sourceTopicContainer: document.getElementById('source-topic-container'),
    sourceSynthesisContainer: document.getElementById('source-synthesis-container'),
    sourceCourseContainer: document.getElementById('source-course-container'),
    topicInput: document.getElementById('quiz-topic'),
    synthesisSelect: document.getElementById('quiz-synthesis-select'),
    courseSelect: document.getElementById('quiz-course-select'),
    quizTitleInput: document.getElementById('quiz-title-input'),
    questionCountInput: document.getElementById('quiz-length'),
    questionCountVal: document.getElementById('quiz-length-val'),
    quizTypeInput: document.getElementById('quiz-type'),
    questionText: document.getElementById('question-text'),
    optionsGrid: document.getElementById('options-grid'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('player-progress'),
    quizTitle: document.getElementById('player-quiz-title'),
    btnNext: document.getElementById('next-question-btn'),
    btnExit: document.getElementById('exit-quiz-btn'),
    feedbackArea: document.getElementById('feedback-area'),
    feedbackBox: document.getElementById('feedback-box'),
    finalScore: document.getElementById('final-score'),
    resultMessage: document.getElementById('result-message'),
    btnRetry: document.getElementById('retry-quiz-btn'),
    btnBack: document.getElementById('back-to-dashboard-btn')
};

// Initialisation immédiate (pas de DOMContentLoaded pour les modules)
initLayout('quiz');
setupEventListeners();

// Auth et chargement initial
let currentUserId = null;

(async function initQuiz() {
    console.log('🔐 Checking authentication...');

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('❌ Not authenticated, redirecting to login');
        window.location.href = '../auth/login.html';
        return;
    }

    currentUserId = user.id;
    console.log('✅ Authenticated as:', currentUserId);

    // Charger les données
    loadRecentQuiz(currentUserId);
    loadUserSyntheses(currentUserId);
    loadUserCourses(currentUserId);
})();

async function loadUserSyntheses(userId) {
    if (!userId) return;
    try {
        console.log('📚 Loading syntheses for user:', userId);

        const { data: syntheses, error } = await supabase
            .from('syntheses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error loading syntheses:', error);
            ui.synthesisSelect.innerHTML = '<option value="">Erreur chargement</option>';
            return;
        }

        userSyntheses = syntheses || [];
        ui.synthesisSelect.innerHTML = '<option value="">-- Choisir une synthèse --</option>';

        if (userSyntheses.length === 0) {
            ui.synthesisSelect.innerHTML = '<option value="">Aucune synthèse trouvée</option>';
            console.log('⚠️ No syntheses found');
            return;
        }

        userSyntheses.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.title || `Synthèse du ${new Date(s.created_at).toLocaleDateString('fr-FR')}`;
            ui.synthesisSelect.appendChild(opt);
        });

        console.log(`✅ Loaded ${userSyntheses.length} syntheses`);
    } catch (e) {
        console.error("❌ Error loading syntheses:", e);
        ui.synthesisSelect.innerHTML = '<option value="">Erreur (Voir Console)</option>';
    }
}

async function loadUserCourses(userId) {
    if (!userId) return;
    try {
        console.log('📄 Loading courses for user:', userId);

        const { data: courses, error } = await supabase
            .from('courses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error loading courses:', error);
            ui.courseSelect.innerHTML = `<option value="">Erreur: ${error.message}</option>`;
            return;
        }

        userCourses = courses || [];
        ui.courseSelect.innerHTML = '<option value="">-- Choisir un fichier --</option>';

        if (userCourses.length === 0) {
            ui.courseSelect.innerHTML = '<option value="">Aucun fichier trouvé. Uploadez des cours !</option>';
            console.log('⚠️ No courses found');
            return;
        }

        userCourses.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.file_name || f.title || "Fichier sans nom";
            ui.courseSelect.appendChild(opt);
        });

        console.log(`✅ Loaded ${userCourses.length} courses`);
    } catch (e) {
        console.error("❌ Error loading courses:", e);
        ui.courseSelect.innerHTML = `<option value="">Erreur: ${e.message}</option>`;
    }
}

// ✅ REFACTORING: Extract source data logic to reduce nesting
function extractQuizSourceData(source) {
    let topic = "";
    let dataContext = "";
    let title = ui.quizTitleInput.value.trim();

    if (source === 'topic') {
        topic = ui.topicInput.value.trim();
        if (!topic) {
            showMessage("Veuillez décrire le sujet.", "error");
            return null;
        }
        if (!title) title = topic.substring(0, 30) + "...";
    }
    else if (source === 'synthesis') {
        const synthId = ui.synthesisSelect.value;
        if (!synthId) {
            showMessage("Veuillez sélectionner une synthèse.", "error");
            return null;
        }
        const synth = userSyntheses.find(s => s.id === synthId);
        if (synth) {
            topic = `Synthèse : ${synth.title}`;
            dataContext = synth.content;
            if (!title) title = synth.title;
        }
    }
    else if (source === 'course') {
        const fileId = ui.courseSelect.value;
        if (!fileId) {
            showMessage("Veuillez sélectionner un cours.", "error");
            return null;
        }
        const file = userCourses.find(f => f.id === fileId);
        if (file) {
            const fileName = file.file_name || file.title || "Fichier";
            topic = `Cours : ${fileName}`;
            dataContext = `Document: ${fileName}. Génère des questions pertinentes basées sur ce type de matière.`;
            if (!title) title = fileName;
        }
    }

    return { topic, dataContext, title };
}

// ✅ REFACTORING: Extract UI state management
function setGeneratingState(isGenerating) {
    if (!ui.generateBtn || !ui.btnText || !ui.spinner) return;
    
    if (isGenerating) {
        ui.generateBtn.disabled = true;
        ui.spinner.classList.remove('hidden');
        ui.btnText.textContent = 'Génération en cours...';
        
        // Afficher un tip d'étude aléatoire
        showStudyTip();
    } else {
        ui.generateBtn.disabled = false;
        ui.spinner.classList.add('hidden');
        ui.btnText.textContent = 'Générer le quiz';
    }
}

// Afficher des tips d'étude pendant le chargement
function showStudyTip() {
    const tips = [
        "💡 Astuce : Prenez des notes manuscrites pour mieux mémoriser",
        "📚 Conseil : Révisez régulièrement plutôt qu'en une seule fois",
        "🧠 Méthode : Expliquez le concept à quelqu'un d'autre pour valider votre compréhension",
        "⏰ Technique : Utilisez la technique Pomodoro (25min travail, 5min pause)",
        "🎯 Objectif : Fixez-vous des objectifs d'apprentissage spécifiques et mesurables",
        "🔄 Répétition : Revoyez les informations après 1 jour, 3 jours, 1 semaine",
        "📝 Organisation : Créez des fiches de révision avec des mots-clés",
        "🎨 Visuel : Utilisez des schémas et couleurs pour mieux retenir",
        "🔊 Auditif : Lisez vos notes à voix haute pour renforcer la mémorisation",
        "🏃 Mouvement : Faites de courtes pauses pour marcher et oxygéner votre cerveau",
        "🎮 Gamification : Transformez l'apprentissage en jeu pour plus de motivation",
        "🤔 Questions : Testez-vous régulièrement avec des questions spontanées",
        "📖 Contexte : Reliez les nouvelles informations à ce que vous connaissez déjà",
        "⚡ Focus : Éliminez les distractions (téléphone, notifications) pendant l'étude",
        "🌙 Sommeil : Une bonne nuit de sommeil améliore la consolidation de la mémoire"
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    // Créer ou mettre à jour le conteneur de tips
    let tipContainer = document.getElementById('study-tip-container');
    if (!tipContainer) {
        tipContainer = document.createElement('div');
        tipContainer.id = 'study-tip-container';
        tipContainer.className = 'mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300';
        ui.modal.querySelector('.modal-body').appendChild(tipContainer);
    }
    
    tipContainer.innerHTML = `
        <div class="flex items-start gap-2">
            <span class="text-blue-400 mt-1">💡</span>
            <div>
                <div class="font-medium text-blue-200 mb-1">Pendant que nous générons votre quiz...</div>
                <div>${randomTip}</div>
            </div>
        </div>
    `;
}

// ✅ PRODUCTION SÉCURISÉE: Call Supabase Edge Function avec authentification
async function callGenerateQuizFunction(topic, dataContext, count, type, options = {}) {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 12000; // 12 secondes de base
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`🤖 Calling generate-quiz Edge Function (attempt ${attempt}/${MAX_RETRIES})...`);

            // Utiliser l'ANON_KEY comme pour les synthèses (pas le JWT utilisateur)
            const SUPABASE_URL = 'https://vhtzudbcfyxnwmpyjyqw.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodHp1ZGJjZnl4bndtcHlqeXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDY2NDgsImV4cCI6MjA4MjQyMjY0OH0.6tHA5qpktIqoLNh1RN620lSVhn6FRu3qtRI2O0j7mGU';
            
            // Échapper les données pour éviter les erreurs JSON
            const safeDataContext = dataContext ? dataContext.replace(/[\u0000-\u001F\u007F-\u009F]/g, '') : '';
            
            const requestBody = {
                mode: 'quiz',
                topic: topic,
                data: safeDataContext,
                options: {
                    count: count,
                    type: type,
                    ...options
                }
            };

            console.log('📤 Request body:', requestBody);

            const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-quiz`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('🔴 Edge Function Error:', response.status, errorData);
                
                // Vérifier si c'est une erreur de quota
                if (errorData.error && errorData.error.includes('quota')) {
                    const waitTime = extractWaitTime(errorData.error) || (BASE_DELAY * attempt);
                    console.log(`⏰ Quota exceeded, waiting ${waitTime/1000}s before retry ${attempt}/${MAX_RETRIES}`);
                    
                    if (attempt < MAX_RETRIES) {
                        // Mettre à jour la barre de progression avec message d'attente
                        updateQuizProgressWait(waitTime/1000, attempt);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue; // Réessayer
                    }
                }
                
                throw new Error(errorData.error || errorData.message || 'Erreur lors de la génération du quiz');
            }

            const data = await response.json();
            console.log('📥 Response data:', data);
            return data;

        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error);
            
            if (attempt === MAX_RETRIES) {
                throw error; // Relancer l'erreur après le dernier essai
            }
            
            // Attendre avant de réessayer (avec backoff exponentiel)
            const waitTime = BASE_DELAY * Math.pow(2, attempt - 1);
            console.log(`⏰ Waiting ${waitTime/1000}s before retry ${attempt + 1}/${MAX_RETRIES}`);
            updateQuizProgressWait(waitTime/1000, attempt);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

// Extraire le temps d'attente depuis le message d'erreur
function extractWaitTime(errorMessage) {
    const match = errorMessage.match(/Please retry in ([\d.]+)s/);
    return match ? parseFloat(match[1]) * 1000 : null;
}

// Mettre à jour la barre de progression pendant l'attente
function updateQuizProgressWait(seconds, attempt) {
    const progressText = document.getElementById('quiz-progress-text');
    const progressBar = document.getElementById('quiz-progress-bar');
    
    if (progressText && progressBar) {
        const textContainer = progressText.parentElement;
        if (textContainer) {
            textContainer.innerHTML = `<span id="quiz-progress-text">⏳ Attente quota...</span> • ${seconds}s (essai ${attempt}/3)`;
        }
        
        // Animation de pulse pendant l'attente
        progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)';
        progressBar.style.backgroundSize = '200% 100%';
        progressBar.style.animation = 'pulse 2s infinite';
    }
}

// 🔄 Sauvegarder le quiz dans la base de données
async function saveQuizToDatabase(quizData) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.warn('⚠️ No session found, skipping quiz save');
            return;
        }

        const quizRecord = {
            user_id: session.user.id,
            title: quizData.title || 'Quiz généré',
            type: quizData.type || 'qcm',
            difficulty: quizData.difficulty || 'intermediaire',
            theme: quizData.theme || 'general',
            question_count: quizData.questions?.length || 0,
            score: 0, // Score initial à 0, sera mis à jour après complétion
            total: quizData.questions?.length || 0, // Total des questions
            questions: JSON.stringify(quizData.questions || []), // Questions du quiz
            answers: JSON.stringify([]), // Réponses vides initialement
            content: JSON.stringify(quizData),
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('quiz_results')
            .insert([quizRecord])
            .select();

        if (error) {
            console.error('❌ Error saving quiz:', error);
            return;
        }

        console.log('✅ Quiz saved to database:', data);
        
        // Rafraîchir la liste des quiz
        loadRecentQuiz();
        
    } catch (error) {
        console.error('❌ Error in saveQuizToDatabase:', error);
    }
}

async function generateQuiz() {
    if (isGenerating) return;

    const sourceElement = document.querySelector('input[name="quiz-source"]:checked');
    if (!sourceElement) return showMessage("Sélectionnez une source pour le quiz", "error");

    const source = sourceElement.value;
    const count = parseInt(ui.questionCountInput.value);
    const type = ui.quizTypeInput.value;
    const difficulty = document.getElementById('quiz-difficulty')?.value || 'intermediaire';
    const theme = document.getElementById('quiz-theme')?.value || 'general';
    const answerFormat = document.querySelector('input[name="answer-format"]:checked')?.value || 'short';

    // Récupérer les focus options
    const focusConcepts = document.getElementById('focus-concepts')?.checked || false;
    const focusApplications = document.getElementById('focus-applications')?.checked || false;
    const focusDefinitions = document.getElementById('focus-definitions')?.checked || false;

    // Extract and validate source data
    const sourceData = extractQuizSourceData(source);
    if (!sourceData) return; // Validation failed, error already shown

    isGenerating = true;
    setGeneratingState(true);
    
    // Afficher la barre de chargement progressive
    showQuizProgress();

    // Timeout de sécurité pour éviter le chargement infini
    const safetyTimeout = setTimeout(() => {
        stopQuizProgress();
        isGenerating = false;
        setGeneratingState(false);
        showMessage("Le chargement a pris trop de temps. Veuillez réessayer.", "error");
    }, 30000); // 30 secondes maximum

    try {
        console.log('🎯 Generating quiz:', { 
            topic: sourceData.topic, 
            count, 
            type, 
            difficulty, 
            theme, 
            answerFormat,
            focus: { concepts: focusConcepts, applications: focusApplications, definitions: focusDefinitions }
        });

        // ✅ PRODUCTION: Appeler la Supabase Edge Function (sécurisé)
        const quizData = await callGenerateQuizFunction(
            sourceData.topic,
            sourceData.dataContext,
            count,
            type,
            {
                difficulty,
                theme,
                answerFormat,
                focusConcepts,
                focusApplications,
                focusDefinitions
            }
        );

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            throw new Error("L'IA n'a pas renvoyé de questions valides.");
        }

        quizData.title = sourceData.title;
        quizData.type = type;
        quizData.difficulty = difficulty;
        quizData.theme = theme;

        console.log('✅ Quiz generated:', quizData);
        showMessage("Quiz prêt !", "success");
        startQuiz(quizData);
        ui.modal.classList.add('hidden');

        // 🔄 Sauvegarder le quiz dans la base de données
        await saveQuizToDatabase(quizData);

    } catch (error) {
        console.error("❌ Erreur Génération:", error);
        showMessage("Erreur IA : " + (error.message || "Réessayez plus tard."), "error");
    } finally {
        clearTimeout(safetyTimeout); // Annuler le timeout de sécurité
        stopQuizProgress(); // Nettoyer la progression
        isGenerating = false;
        setGeneratingState(false);
    }
}

function startQuiz(quizData) {
    currentQuiz = quizData;
    currentQuestionIndex = 0;
    userAnswers = [];
    score = 0;

    ui.dashboard.classList.add('hidden');
    ui.results.classList.add('hidden');
    ui.player.classList.remove('hidden');

    ui.quizTitle.textContent = quizData.title;
    showQuestion();
}

function showQuestion() {
    const q = currentQuiz.questions[currentQuestionIndex];
    ui.questionText.textContent = q.question;
    ui.progressText.textContent = `${currentQuestionIndex + 1}/${currentQuiz.questions.length}`;
    const progressPercent = ((currentQuestionIndex) / currentQuiz.questions.length) * 100;
    ui.progressBar.style.width = `${progressPercent}%`;

    ui.feedbackArea.classList.add('hidden');
    ui.btnNext.disabled = true;
    ui.optionsGrid.innerHTML = '';

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = "w-full p-4 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all flex items-center group";
        btn.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gray-900 text-gray-400 flex items-center justify-center mr-4 text-sm font-bold border border-gray-700 group-hover:border-indigo-500 group-hover:text-indigo-400 transition-colors">
                ${String.fromCharCode(65 + index)}
            </div>
            <span class="text-gray-200 font-medium">${opt}</span>
        `;
        btn.onclick = () => handleAnswer(index, btn);
        ui.optionsGrid.appendChild(btn);
    });
}

function handleAnswer(selectedIndex, btnElement) {
    if (!ui.btnNext.disabled) return;
    const q = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedIndex === q.correctAnswer;

    if (isCorrect) {
        btnElement.classList.remove('bg-gray-800', 'border-gray-700');
        btnElement.classList.add('bg-green-500/20', 'border-green-500');
        score++;
        showFeedback(true, "Bonne réponse ! " + (q.explanation || ""));
    } else {
        btnElement.classList.remove('bg-gray-800', 'border-gray-700');
        btnElement.classList.add('bg-red-500/20', 'border-red-500');
        const correctBtn = ui.optionsGrid.children[q.correctAnswer];
        if(correctBtn) {
            correctBtn.classList.remove('bg-gray-800', 'border-gray-700');
            correctBtn.classList.add('bg-green-500/20', 'border-green-500', 'opacity-50');
        }
        showFeedback(false, "Faux. " + (q.explanation || ""));
    }

    userAnswers.push({
        question: q.question,
        selected: selectedIndex,
        correct: q.correctAnswer,
        isCorrect: isCorrect
    });
    ui.btnNext.disabled = false;
}

function showFeedback(isSuccess, message) {
    ui.feedbackArea.classList.remove('hidden');
    ui.feedbackBox.className = isSuccess
        ? "p-4 rounded-xl mb-6 text-sm font-medium bg-green-500/10 border border-green-500/30 text-green-400"
        : "p-4 rounded-xl mb-6 text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-400";
    ui.feedbackBox.innerHTML = `<div class="flex gap-2"><i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-times-circle'} mt-0.5"></i><div>${message}</div></div>`;
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuiz.questions.length) {
        showQuestion();
    } else {
        finishQuiz();
    }
}

async function finishQuiz() {
    const percentage = Math.round((score / currentQuiz.questions.length) * 100);
    ui.player.classList.add('hidden');
    ui.results.classList.remove('hidden');
    ui.finalScore.textContent = `${percentage}%`;

    let msg = "Peut mieux faire...";
    if (percentage >= 50) msg = "Pas mal !";
    if (percentage >= 80) msg = "Excellent travail !";
    if (percentage === 100) msg = "Parfait !";
    ui.resultMessage.textContent = msg;

    const reviewList = document.getElementById('review-list');
    if(reviewList) {
        reviewList.innerHTML = '';
        userAnswers.forEach((ans, idx) => {
            const div = document.createElement('div');
            div.className = `p-3 rounded-lg border ${ans.isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`;
            div.innerHTML = `
                <div class="flex justify-between mb-1">
                    <span class="text-xs font-bold ${ans.isCorrect ? 'text-green-400' : 'text-red-400'}">Q${idx+1}</span>
                    <span class="text-xs text-gray-500">${ans.isCorrect ? 'Correct' : 'Erreur'}</span>
                </div>
                <p class="text-sm text-gray-300">${ans.question}</p>
            `;
            reviewList.appendChild(div);
        });
    }

    if (currentUserId) {
        try {
            console.log('💾 Updating quiz score in database...');
            // Mettre à jour le score du quiz existant
            const { data, error } = await supabase
                .from('quiz_results')
                .update({
                    score: score,
                    total: currentQuiz.questions.length,
                    content: JSON.stringify({
                        ...currentQuiz,
                        userAnswers: userAnswers,
                        percentage: percentage
                    })
                })
                .eq('user_id', currentUserId)
                .eq('title', currentQuiz.title)
                .select();

            if (error) {
                console.error("❌ Error updating quiz result:", error);
            } else {
                console.log("✅ Quiz result updated");
            }
        } catch (e) {
            console.error("❌ Error updating quiz result:", e);
        }
    }
}

function exitQuiz() {
    if(confirm("Quitter le quiz ?")) {
        ui.player.classList.add('hidden');
        ui.results.classList.add('hidden');
        ui.dashboard.classList.remove('hidden');
        loadRecentQuiz();
    }
}

async function loadRecentQuiz(userId = currentUserId) {
    if (!ui.quizGrid) return;
    if (!userId) {
        ui.quizGrid.innerHTML = '<div class="col-span-full py-8 text-center text-gray-500">Connectez-vous pour voir vos quiz.</div>';
        return;
    }

    ui.quizGrid.innerHTML = '<div class="col-span-full py-12 text-center text-gray-500"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement...</p></div>';

    try {
        console.log('🎯 Loading recent quiz for user:', userId);

        const { data: quizResults, error } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) {
            console.error('❌ Error loading quiz results:', error);
            ui.quizGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 text-xs">Erreur chargement historique.</div>';
            return;
        }

        ui.quizGrid.innerHTML = '';

        if (!quizResults || quizResults.length === 0) {
            ui.quizGrid.innerHTML = '<div class="col-span-full py-8 text-center text-gray-500">Aucun quiz récent.</div>';
            console.log('⚠️ No quiz results found');
            return;
        }

        // Créer les cartes quiz directement dans la grille existante
        quizResults.forEach(data => {
            const div = document.createElement('div');
            div.className = "bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer";
            
            // Calculer le pourcentage si score et total existent
            const percentage = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
            
            let scoreColor = percentage >= 80 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400';

            const dateStr = data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR') : 'Date inconnue';

            div.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-bold text-white text-lg mb-2">${data.title || 'Quiz sans titre'}</h4>
                        <div class="flex items-center gap-2 text-sm text-gray-400">
                            <span class="px-2 py-1 bg-blue-500/20 rounded">${getTypeLabel(data.type)}</span>
                            <span>${data.question_count || 0} questions</span>
                            ${data.difficulty ? `<span class="px-2 py-1 bg-gray-700 rounded">${getDifficultyLabel(data.difficulty)}</span>` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold ${scoreColor}">${percentage}%</div>
                        <div class="text-xs text-gray-500">${data.score}/${data.total}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-500">${dateStr}</div>
            `;
            
            // Fonctions pour afficher les informations
            function getTypeLabel(type) {
                const types = {
                    'qcm': '📝 QCM',
                    'vrai-faux': '✅ Vrai/Faux',
                    'remplissage': '🔄 Remplissage',
                    'chronologie': '📅 Chronologique',
                    'association': '🔗 Association',
                    'calcul': '🧮 Calcul'
                };
                return types[type] || '📝 QCM';
            }
            
            function getDifficultyLabel(difficulty) {
                const labels = {
                    'debutant': '🟢 Débutant',
                    'intermediaire': '🟡 Intermédiaire',
                    'avance': '🔴 Avancé',
                    'expert': '🟣 Expert'
                };
                return labels[difficulty] || '🟡 Intermédiaire';
            }
            
            // Ajouter un événement click pour rejouer le quiz
            div.addEventListener('click', () => {
                try {
                    const quizContent = JSON.parse(data.content);
                    startQuiz(quizContent);
                    ui.modal.classList.add('hidden');
                } catch (error) {
                    console.error('❌ Error loading quiz:', error);
                    showMessage("Erreur lors du chargement du quiz", "error");
                }
            });
            
            ui.quizGrid.appendChild(div);
        });

        console.log(`✅ Loaded ${quizResults.length} quiz results`);
    } catch (e) {
        console.error("❌ Error loading quiz history:", e);
        ui.quizGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 text-xs">Historique indisponible.</div>';
    }
}

// Fonction pour calculer les statistiques globales
function calculateQuizStats(quizResults) {
    const stats = {
        totalQuizzes: quizResults.length,
        totalQuestions: 0,
        totalScore: 0,
        averageScore: 0
    };

    quizResults.forEach(quiz => {
        stats.totalQuestions += quiz.question_count || 0;
        if (quiz.total > 0) {
            stats.totalScore += Math.round((quiz.score / quiz.total) * 100);
        }
    });

    if (stats.totalQuizzes > 0) {
        stats.averageScore = Math.round(stats.totalScore / stats.totalQuizzes);
    }

    return stats;
}

// Fonction pour obtenir la couleur de performance
function getPerformanceColor(score) {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
}

// Fonction pour obtenir le label de performance
function getPerformanceLabel(score) {
    if (score >= 90) return '🏆 Excellent';
    if (score >= 80) return '⭐ Très bien';
    if (score >= 60) return '👍 Bien';
    if (score >= 40) return '📚 Moyen';
    if (score >= 20) return '📖 Faible';
    return '❌ À améliorer';
}

function setupEventListeners() {
    const toggleModal = (show) => {
        if(show) {
            if(ui.modal) ui.modal.classList.remove('hidden');
            if(ui.topicInput) ui.topicInput.value = "";
            if(ui.quizTitleInput) ui.quizTitleInput.value = "";
        } else {
            if(ui.modal) ui.modal.classList.add('hidden');
        }
    };

    if(ui.btnNewQuizHeader) ui.btnNewQuizHeader.onclick = () => toggleModal(true);
    if(ui.btnNewQuizHero) ui.btnNewQuizHero.onclick = () => toggleModal(true);
    if(ui.closeModal) ui.closeModal.onclick = () => toggleModal(false);
    if(ui.cancelBtn) ui.cancelBtn.onclick = () => toggleModal(false);

    if(ui.sourceRadios) {
        ui.sourceRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const val = e.target.value;
                if(ui.sourceTopicContainer) ui.sourceTopicContainer.classList.add('hidden');
                if(ui.sourceSynthesisContainer) ui.sourceSynthesisContainer.classList.add('hidden');
                if(ui.sourceCourseContainer) ui.sourceCourseContainer.classList.add('hidden');

                if (val === 'topic' && ui.sourceTopicContainer) ui.sourceTopicContainer.classList.remove('hidden');
                if (val === 'synthesis' && ui.sourceSynthesisContainer) ui.sourceSynthesisContainer.classList.remove('hidden');
                if (val === 'course' && ui.sourceCourseContainer) ui.sourceCourseContainer.classList.remove('hidden');
            });
        });
    }

    if(ui.questionCountInput && ui.questionCountVal) {
        ui.questionCountInput.addEventListener('input', (e) => {
            ui.questionCountVal.textContent = e.target.value;
        });
    }

    // Toggle options avancées
    const toggleAdvancedBtn = document.getElementById('toggle-advanced');
    const advancedOptions = document.getElementById('advanced-options');
    
    if (toggleAdvancedBtn && advancedOptions) {
        toggleAdvancedBtn.addEventListener('click', () => {
            const isHidden = advancedOptions.classList.contains('hidden');
            advancedOptions.classList.toggle('hidden');
            toggleAdvancedBtn.innerHTML = isHidden 
                ? '<i class="fas fa-chevron-up mr-1"></i>Masquer'
                : '<i class="fas fa-chevron-down mr-1"></i>Afficher';
        });
    }

    if(ui.generateBtn) ui.generateBtn.onclick = generateQuiz;
    if(ui.btnNext) ui.btnNext.onclick = nextQuestion;
    if(ui.btnExit) ui.btnExit.onclick = exitQuiz;
    if(ui.btnRetry) ui.btnRetry.onclick = () => startQuiz(currentQuiz);
    if(ui.btnBack) ui.btnBack.onclick = () => { 
        if(ui.results) ui.results.classList.add('hidden'); 
        if(ui.dashboard) ui.dashboard.classList.remove('hidden'); 
        loadRecentQuiz(); 
    };
}
