import { auth, db, functions } from './config.js'; // Assure-toi que 'functions' est exporté de config.js
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
    // Inputs
    topicInput: document.getElementById('quiz-topic'),
    questionCountInput: document.getElementById('quiz-length'),
    questionCountVal: document.getElementById('quiz-length-val'),
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
        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
});

// --- CORE LOGIC : GENERATION ---

async function generateQuiz() {
    if (isGenerating) return;

    const topic = ui.topicInput.value.trim();
    const count = parseInt(ui.questionCountInput.value);
    
    // Validation basique
    if (!topic) return showMessage("Veuillez entrer un sujet.", "error");

    // UI Loading
    isGenerating = true;
    ui.generateBtn.disabled = true;
    ui.generateBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Génération...`;
    ui.loadingContainer.classList.remove('hidden');

    try {
        // Appel Cloud Function
        const generateContent = httpsCallable(functions, 'generateContent');
        const result = await generateContent({
            mode: 'quiz',
            topic: topic,
            options: { count: count, type: 'qcm' }
        });

        const quizData = result.data;
        
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            throw new Error("Format de quiz invalide reçu.");
        }

        // Succès
        showMessage("Quiz généré avec succès !", "success");
        startQuiz(quizData);
        closeModal();

    } catch (error) {
        console.error("Erreur Génération:", error);
        showMessage("Erreur IA : " + error.message, "error");
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

    // Switch View
    ui.dashboard.classList.add('hidden');
    ui.results.classList.add('hidden');
    ui.player.classList.remove('hidden');
    
    ui.quizTitle.textContent = quizData.title || "Quiz Généré";
    
    showQuestion();
}

function showQuestion() {
    const q = currentQuiz.questions[currentQuestionIndex];
    
    // UI Updates
    ui.questionText.textContent = q.question;
    ui.progressText.textContent = `${currentQuestionIndex + 1}/${currentQuiz.questions.length}`;
    const progressPercent = ((currentQuestionIndex) / currentQuiz.questions.length) * 100;
    ui.progressBar.style.width = `${progressPercent}%`;
    
    // Reset Feedback & Next Button
    ui.feedbackArea.classList.add('hidden');
    ui.btnNext.disabled = true;
    ui.optionsGrid.innerHTML = '';

    // Generate Options
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
    // Prevent multiple clicks
    if (!ui.btnNext.disabled) return;

    const q = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedIndex === q.correctAnswer;

    // Style selection
    if (isCorrect) {
        btnElement.classList.remove('bg-gray-800', 'border-gray-700');
        btnElement.classList.add('bg-green-500/20', 'border-green-500');
        score++;
        showFeedback(true, "Bonne réponse ! " + (q.explanation || ""));
    } else {
        btnElement.classList.remove('bg-gray-800', 'border-gray-700');
        btnElement.classList.add('bg-red-500/20', 'border-red-500');
        
        // Highlight correct answer
        const correctBtn = ui.optionsGrid.children[q.correctAnswer];
        correctBtn.classList.remove('bg-gray-800', 'border-gray-700');
        correctBtn.classList.add('bg-green-500/20', 'border-green-500', 'opacity-50');
        
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
    
    ui.feedbackBox.innerHTML = `
        <div class="flex gap-2">
            <i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-times-circle'} mt-0.5"></i>
            <div>${message}</div>
        </div>
    `;
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
    // Calcul score
    const percentage = Math.round((score / currentQuiz.questions.length) * 100);
    
    // UI Update
    ui.player.classList.add('hidden');
    ui.results.classList.remove('hidden');
    ui.finalScore.textContent = `${percentage}%`;
    
    let msg = "Peut mieux faire...";
    if (percentage >= 50) msg = "Pas mal !";
    if (percentage >= 80) msg = "Excellent travail !";
    if (percentage === 100) msg = "Parfait ! Maître du sujet.";
    ui.resultMessage.textContent = msg;

    // Save Result to Firestore
    if (auth.currentUser) {
        try {
            await addDoc(collection(db, 'quiz_results'), {
                userId: auth.currentUser.uid,
                topic: currentQuiz.title, // Ou topic input
                score: score,
                total: currentQuiz.questions.length,
                percentage: percentage,
                createdAt: serverTimestamp()
            });
            
            // TODO: Update User Points here if wanted (+ X pts)
            
        } catch (e) {
            console.error("Erreur sauvegarde résultat:", e);
        }
    }
}

function exitQuiz() {
    if(confirm("Quitter le quiz ? Votre progression sera perdue.")) {
        ui.player.classList.add('hidden');
        ui.results.classList.add('hidden');
        ui.dashboard.classList.remove('hidden');
        loadRecentQuiz(); // Refresh history
    }
}

// --- DASHBOARD LOGIC ---

async function loadRecentQuiz() {
    ui.quizGrid.innerHTML = '<div class="col-span-full py-12 text-center text-gray-500"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement...</p></div>';
    
    try {
        const q = query(collection(db, 'quiz_results'), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'), limit(8));
        const snapshot = await getDocs(q);
        
        ui.quizGrid.innerHTML = '';
        
        if (snapshot.empty) {
            ui.quizGrid.innerHTML = '<div class="col-span-full py-8 text-center text-gray-500">Aucun quiz récent. Lancez-vous !</div>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            // Carte Quiz Historique
            div.className = "content-glass p-5 rounded-2xl flex flex-col gap-3 group hover:bg-gray-800 transition-colors";
            
            let colorClass = "text-red-400";
            if (data.percentage >= 50) colorClass = "text-orange-400";
            if (data.percentage >= 80) colorClass = "text-green-400";

            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">
                        <i class="fas fa-brain"></i>
                    </div>
                    <span class="text-lg font-bold ${colorClass}">${data.percentage}%</span>
                </div>
                <div>
                    <h4 class="font-bold text-white truncate">${data.topic || 'Quiz sans titre'}</h4>
                    <p class="text-xs text-gray-500">${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Date inconnue'}</p>
                </div>
            `;
            ui.quizGrid.appendChild(div);
        });

    } catch (e) {
        console.error("Erreur historique:", e);
        ui.quizGrid.innerHTML = '<div class="col-span-full text-red-400 text-center">Erreur chargement historique.</div>';
    }
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    // Modale Open/Close
    const toggleModal = (show) => {
        if(show) ui.modal.classList.remove('hidden');
        else ui.modal.classList.add('hidden');
    };

    if(ui.btnNewQuizHeader) ui.btnNewQuizHeader.onclick = () => toggleModal(true);
    if(ui.btnNewQuizHero) ui.btnNewQuizHero.onclick = () => toggleModal(true);
    if(ui.closeModal) ui.closeModal.onclick = () => toggleModal(false);
    if(ui.cancelBtn) ui.cancelBtn.onclick = () => toggleModal(false);

    // Range Slider Value
    if(ui.questionCountInput) {
        ui.questionCountInput.oninput = (e) => ui.questionCountVal.textContent = e.target.value;
    }

    // Generate
    if(ui.generateBtn) ui.generateBtn.onclick = generateQuiz;

    // Player
    if(ui.btnNext) ui.btnNext.onclick = nextQuestion;
    if(ui.btnExit) ui.btnExit.onclick = exitQuiz;

    // Results
    if(ui.btnRetry) ui.btnRetry.onclick = () => {
        // Rejouer le même quiz
        startQuiz(currentQuiz);
    };
    if(ui.btnBack) ui.btnBack.onclick = () => {
        ui.results.classList.add('hidden');
        ui.dashboard.classList.remove('hidden');
        loadRecentQuiz();
    };
}