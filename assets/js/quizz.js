import { auth, db, functions } from './config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- STATE ---
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let isGenerating = false;
let userSyntheses = []; // Cache synthèses
let userCourses = [];   // Cache cours

// --- DOM ELEMENTS ---
const ui = {
    // Views
    dashboard: document.getElementById('quiz-dashboard'),
    player: document.getElementById('quiz-player'),
    results: document.getElementById('results-container'),
    // Dashboard
    btnNewQuizHero: document.getElementById('btn-new-quiz-hero'),
    btnNewQuizHeader: document.getElementById('btn-new-quiz-header'),
    quizGrid: document.getElementById('quiz-grid'),
    // Modal
    modal: document.getElementById('new-quiz-modal'),
    closeModal: document.getElementById('close-modal-btn'),
    cancelBtn: document.getElementById('cancel-quiz-btn'),
    generateBtn: document.getElementById('generate-quiz-btn'),
    loadingContainer: document.getElementById('loading-bar-container'),
    // Inputs Source
    sourceRadios: document.getElementsByName('quiz-source'),
    sourceTopicContainer: document.getElementById('source-topic-container'),
    sourceSynthesisContainer: document.getElementById('source-synthesis-container'),
    sourceCourseContainer: document.getElementById('source-course-container'),
    topicInput: document.getElementById('quiz-topic'),
    synthesisSelect: document.getElementById('quiz-synthesis-select'),
    courseSelect: document.getElementById('quiz-course-select'),
    // Params
    quizTitleInput: document.getElementById('quiz-title-input'),
    questionCountInput: document.getElementById('quiz-length'),
    questionCountVal: document.getElementById('quiz-length-val'),
    quizTypeInput: document.getElementById('quiz-type'),
    // Player
    questionText: document.getElementById('question-text'),
    optionsGrid: document.getElementById('options-grid'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('player-progress'),
    quizTitle: document.getElementById('player-quiz-title'),
    btnNext: document.getElementById('next-question-btn'),
    btnExit: document.getElementById('exit-quiz-btn'),
    feedbackArea: document.getElementById('feedback-area'),
    feedbackBox: document.getElementById('feedback-box'),
    // Results
    finalScore: document.getElementById('final-score'),
    resultMessage: document.getElementById('result-message'),
    btnRetry: document.getElementById('retry-quiz-btn'),
    btnBack: document.getElementById('back-to-dashboard-btn')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initLayout('quiz');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadRecentQuiz();
            // Pré-chargement des ressources
            loadUserSyntheses();
            loadUserCourses();
        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
});

// --- LOAD RESOURCES ---

async function loadUserSyntheses() {
    try {
        const q = query(collection(db, 'syntheses'), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        userSyntheses = [];
        ui.synthesisSelect.innerHTML = '<option value="">-- Choisir une synthèse --</option>';
        
        snapshot.forEach(doc => {
            const d = doc.data();
            const s = { id: doc.id, ...d };
            userSyntheses.push(s);
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.title || `Synthèse du ${new Date(s.createdAt.toDate()).toLocaleDateString()}`;
            ui.synthesisSelect.appendChild(opt);
        });
        
        if (userSyntheses.length === 0) {
            ui.synthesisSelect.innerHTML = '<option value="">Aucune synthèse trouvée</option>';
        }
    } catch (e) {
        console.warn("Erreur chargement synthèses (Collection vide ?)", e);
        ui.synthesisSelect.innerHTML = '<option value="">Aucune synthèse disponible</option>';
    }
}

async function loadUserCourses() {
    try {
        const q = query(collection(db, 'files'), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        userCourses = [];
        ui.courseSelect.innerHTML = '<option value="">-- Choisir un fichier --</option>';
        
        snapshot.forEach(doc => {
            const d = doc.data();
            const f = { id: doc.id, ...d };
            userCourses.push(f);
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            ui.courseSelect.appendChild(opt);
        });

        if (userCourses.length === 0) {
            ui.courseSelect.innerHTML = '<option value="">Aucun fichier trouvé</option>';
        }
    } catch (e) {
        console.warn("Erreur chargement cours", e);
        ui.courseSelect.innerHTML = '<option value="">Aucun fichier disponible</option>';
    }
}

// --- GENERATION LOGIC ---

async function generateQuiz() {
    if (isGenerating) return;

    const source = document.querySelector('input[name="quiz-source"]:checked').value;
    let title = ui.quizTitleInput.value.trim(); // Peut être vide
    const count = parseInt(ui.questionCountInput.value);
    const type = ui.quizTypeInput.value;

    let topic = "";
    let dataContext = "";

    // Validation stricte selon la source choisie
    if (source === 'topic') {
        topic = ui.topicInput.value.trim();
        if (!topic) return showMessage("Veuillez décrire le sujet.", "error");
        if (!title) title = topic.substring(0, 30) + "..."; // Auto-titre
    } 
    else if (source === 'synthesis') {
        const synthId = ui.synthesisSelect.value;
        if (!synthId) return showMessage("Veuillez sélectionner une synthèse.", "error");
        
        const synth = userSyntheses.find(s => s.id === synthId);
        if (synth) {
            topic = `Synthèse : ${synth.title}`;
            dataContext = synth.content; // Texte complet
            if (!title) title = synth.title; // Auto-titre
        }
    } 
    else if (source === 'course') {
        const fileId = ui.courseSelect.value;
        if (!fileId) return showMessage("Veuillez sélectionner un cours.", "error");
        
        const file = userCourses.find(f => f.id === fileId);
        if (file) {
            topic = `Cours : ${file.name}`;
            dataContext = `Document: ${file.name}. URL: ${file.url}. Génère des questions pertinentes basées sur ce type de document.`;
            if (!title) title = file.name; // Auto-titre
        }
    }

    // UI Loading
    isGenerating = true;
    ui.generateBtn.disabled = true;
    ui.generateBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Génération...`;
    ui.loadingContainer.classList.remove('hidden');

    try {
        const generateContent = httpsCallable(functions, 'generateContent');
        const result = await generateContent({
            mode: 'quiz',
            topic: topic,
            data: dataContext, 
            options: { count: count, type: type }
        });

        const quizData = result.data;
        
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            throw new Error("L'IA n'a pas renvoyé de questions valides.");
        }

        // On assigne le titre final
        quizData.title = title;

        showMessage("Quiz prêt !", "success");
        startQuiz(quizData);
        closeModal();

    } catch (error) {
        console.error("Erreur Génération:", error);
        showMessage("Erreur IA : " + (error.message || "Réessayez plus tard."), "error");
    } finally {
        isGenerating = false;
        ui.generateBtn.disabled = false;
        ui.generateBtn.innerHTML = `<i class="fas fa-bolt mr-2"></i> Générer`;
        ui.loadingContainer.classList.add('hidden');
    }
}

// --- PLAYER LOGIC ---

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

    if (auth.currentUser) {
        try {
            await addDoc(collection(db, 'quiz_results'), {
                userId: auth.currentUser.uid,
                topic: currentQuiz.title,
                score: score,
                total: currentQuiz.questions.length,
                percentage: percentage,
                createdAt: serverTimestamp()
            });
        } catch (e) { console.error("Erreur sauvegarde:", e); }
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

async function loadRecentQuiz() {
    if(!ui.quizGrid) return;
    ui.quizGrid.innerHTML = '<div class="col-span-full py-12 text-center text-gray-500"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement...</p></div>';
    try {
        const q = query(collection(db, 'quiz_results'), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'), limit(8));
        const snapshot = await getDocs(q);
        ui.quizGrid.innerHTML = '';
        if (snapshot.empty) {
            ui.quizGrid.innerHTML = '<div class="col-span-full py-8 text-center text-gray-500">Aucun quiz récent.</div>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = "content-glass p-5 rounded-2xl flex flex-col gap-3 group hover:bg-gray-800 transition-colors";
            let colorClass = "text-red-400";
            if (data.percentage >= 50) colorClass = "text-orange-400";
            if (data.percentage >= 80) colorClass = "text-green-400";
            div.innerHTML = `<div class="flex justify-between items-start"><div class="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg"><i class="fas fa-brain"></i></div><span class="text-lg font-bold ${colorClass}">${data.percentage}%</span></div><div><h4 class="font-bold text-white truncate">${data.topic || 'Quiz sans titre'}</h4><p class="text-xs text-gray-500">${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Date inconnue'}</p></div>`;
            ui.quizGrid.appendChild(div);
        });
    } catch (e) { console.error("Erreur historique:", e); ui.quizGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 text-xs">Historique indisponible.</div>'; }
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

    // SWITCH SOURCE LOGIC (3 OPTIONS)
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