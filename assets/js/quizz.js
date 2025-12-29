import { auth, supabase } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';
// import { initSpeedInsights } from './speed-insights.js';

// Initialize Speed Insights for performance monitoring
// initSpeedInsights(); // Disabled for now

console.log('🚀🚀🚀 QUIZZ.JS SCRIPT LOADED 🚀🚀🚀');

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
    ui.generateBtn.disabled = isGenerating;
    ui.generateBtn.innerHTML = isGenerating
        ? `<i class="fas fa-spinner fa-spin"></i> Génération...`
        : `<i class="fas fa-bolt mr-2"></i> Générer`;
    ui.loadingContainer.classList.toggle('hidden', !isGenerating);
}

// ✅ PRODUCTION SÉCURISÉE: Call Supabase Edge Function avec authentification
async function callGenerateQuizFunction(topic, dataContext, count, type) {
    try {
        console.log('🤖 TEST: Calling generate-quiz Edge Function (NO AUTH)...');

        // TEST SANS AUTH - juste pour vérifier que la fonction existe
        const { data, error } = await supabase.functions.invoke('generate-quiz', {
            body: {
                mode: 'quiz',
                topic: topic,
                data: dataContext,
                options: {
                    count: count,
                    type: type
                }
            }
            // PAS d'Authorization header pour le test
        });

        if (error) {
            console.error('❌ Edge Function error:', error);
            throw new Error(error.message || 'Erreur lors de la génération du quiz');
        }

        console.log('✅ Quiz generated successfully');
        return data;

    } catch (error) {
        console.error('❌ Generate quiz error:', error);
        throw error;
    }
}

async function generateQuiz() {
    if (isGenerating) return;

    const sourceElement = document.querySelector('input[name="quiz-source"]:checked');
    if (!sourceElement) return showMessage("Sélectionnez une source pour le quiz", "error");

    const source = sourceElement.value;
    const count = parseInt(ui.questionCountInput.value);
    const type = ui.quizTypeInput.value;

    // Extract and validate source data
    const sourceData = extractQuizSourceData(source);
    if (!sourceData) return; // Validation failed, error already shown

    isGenerating = true;
    setGeneratingState(true);

    try {
        console.log('🎯 Generating quiz:', { topic: sourceData.topic, count, type });

        // ✅ PRODUCTION: Appeler la Supabase Edge Function (sécurisé)
        const quizData = await callGenerateQuizFunction(
            sourceData.topic,
            sourceData.dataContext,
            count,
            type
        );

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            throw new Error("L'IA n'a pas renvoyé de questions valides.");
        }

        quizData.title = sourceData.title;

        console.log('✅ Quiz generated:', quizData);
        showMessage("Quiz prêt !", "success");
        startQuiz(quizData);
        ui.modal.classList.add('hidden');

    } catch (error) {
        console.error("❌ Erreur Génération:", error);
        showMessage("Erreur IA : " + (error.message || "Réessayez plus tard."), "error");
    } finally {
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
            console.log('💾 Saving quiz result...');
            const { data, error } = await supabase
                .from('quiz_results')
                .insert({
                    user_id: currentUserId,
                    topic: currentQuiz.title,
                    score: score,
                    total: currentQuiz.questions.length,
                    percentage: percentage
                    // created_at sera auto-généré par Supabase
                });

            if (error) {
                console.error("❌ Error saving quiz result:", error);
            } else {
                console.log("✅ Quiz result saved");
            }
        } catch (e) {
            console.error("❌ Error saving quiz result:", e);
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

        quizResults.forEach(data => {
            const div = document.createElement('div');
            div.className = "content-glass p-5 rounded-2xl flex flex-col gap-3 group hover:bg-gray-800 transition-colors";

            let colorClass = "text-red-400";
            if (data.percentage >= 50) colorClass = "text-orange-400";
            if (data.percentage >= 80) colorClass = "text-green-400";

            const dateStr = data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR') : 'Date inconnue';

            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">
                        <i class="fas fa-brain"></i>
                    </div>
                    <span class="text-lg font-bold ${colorClass}">${data.percentage}%</span>
                </div>
                <div>
                    <h4 class="font-bold text-white truncate">${data.topic || 'Quiz sans titre'}</h4>
                    <p class="text-xs text-gray-500">${dateStr}</p>
                </div>
            `;
            ui.quizGrid.appendChild(div);
        });

        console.log(`✅ Loaded ${quizResults.length} quiz results`);
    } catch (e) {
        console.error("❌ Error loading quiz history:", e);
        ui.quizGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 text-xs">Historique indisponible.</div>';
    }
}

function setupEventListeners() {
    const toggleModal = (show) => {
        if(show) {
            ui.modal.classList.remove('hidden');
            ui.topicInput.value = "";
            ui.quizTitleInput.value = "";
        } else {
            ui.modal.classList.add('hidden');
        }
    };

    if(ui.btnNewQuizHeader) ui.btnNewQuizHeader.onclick = () => toggleModal(true);
    if(ui.btnNewQuizHero) ui.btnNewQuizHero.onclick = () => toggleModal(true);
    if(ui.closeModal) ui.closeModal.onclick = () => toggleModal(false);
    if(ui.cancelBtn) ui.cancelBtn.onclick = () => toggleModal(false);

    ui.sourceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            ui.sourceTopicContainer.classList.add('hidden');
            ui.sourceSynthesisContainer.classList.add('hidden');
            ui.sourceCourseContainer.classList.add('hidden');

            if (val === 'topic') ui.sourceTopicContainer.classList.remove('hidden');
            if (val === 'synthesis') ui.sourceSynthesisContainer.classList.remove('hidden');
            if (val === 'course') ui.sourceCourseContainer.classList.remove('hidden');
        });
    });

    if(ui.questionCountInput) ui.questionCountInput.oninput = (e) => ui.questionCountVal.textContent = e.target.value;
    if(ui.generateBtn) ui.generateBtn.onclick = generateQuiz;
    if(ui.btnNext) ui.btnNext.onclick = nextQuestion;
    if(ui.btnExit) ui.btnExit.onclick = exitQuiz;
    if(ui.btnRetry) ui.btnRetry.onclick = () => startQuiz(currentQuiz);
    if(ui.btnBack) ui.btnBack.onclick = () => { ui.results.classList.add('hidden'); ui.dashboard.classList.remove('hidden'); loadRecentQuiz(); };
}
