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
let userResources = []; // Cache combiné (Fichiers + Synthèses)

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
    sourceFileContainer: document.getElementById('source-file-container'), // Sera utilisé pour la liste combinée
    topicInput: document.getElementById('quiz-topic'),
    resourceSelect: document.getElementById('quiz-file-select'), // On réutilise le select existant pour tout
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
            loadUserResources(); // Charge tout (Fichiers + Synthèses)
        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
});

// --- LOAD RESOURCES (COMBINÉ) ---

async function loadUserResources() {
    try {
        const userId = auth.currentUser.uid;
        userResources = [];
        ui.resourceSelect.innerHTML = '<option value="">-- Chargement... --</option>';

        // 1. Récupérer les Fichiers (Cours)
        // Note: Assure-toi que la collection 'files' contient un champ 'type' ou 'mimeType' si tu veux filtrer
        const qFiles = query(collection(db, 'files'), where('userId', '==', userId));
        const filesSnap = await getDocs(qFiles);
        filesSnap.forEach(doc => {
            const d = doc.data();
            userResources.push({
                id: doc.id,
                type: 'file',
                name: d.name,
                url: d.url, // URL Storage
                content: null // On n'a pas le contenu texte direct
            });
        });

        // 2. Récupérer les Synthèses
        // Supposons une collection 'syntheses'
        // Si elle n'existe pas encore, cette partie ne retournera rien, pas grave.
        try {
            const qSynth = query(collection(db, 'syntheses'), where('userId', '==', userId));
            const synthSnap = await getDocs(qSynth);
            synthSnap.forEach(doc => {
                const d = doc.data();
                userResources.push({
                    id: doc.id,
                    type: 'synthesis',
                    name: `Synthèse : ${d.title || 'Sans titre'}`,
                    url: null,
                    content: d.content // Contenu texte Markdown
                });
            });
        } catch (e) {
            console.warn("Collection syntheses non trouvée ou erreur:", e);
        }

        // 3. Remplir le Select
        ui.resourceSelect.innerHTML = '<option value="">-- Choisir un cours ou une synthèse --</option>';
        if (userResources.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.textContent = "Aucun document disponible";
            ui.resourceSelect.appendChild(opt);
        } else {
            userResources.forEach(res => {
                const option = document.createElement('option');
                option.value = res.id;
                // Petit icône visuel dans le texte (si supporté par browser)
                const icon = res.type === 'file' ? '📄' : '📝';
                option.textContent = `${icon} ${res.name}`;
                ui.resourceSelect.appendChild(option);
            });
        }

    } catch (e) {
        console.error("Erreur chargement ressources:", e);
        ui.resourceSelect.innerHTML = '<option value="">Erreur chargement</option>';
    }
}

// --- CORE LOGIC : GENERATION ---

async function generateQuiz() {
    if (isGenerating) return;

    const source = document.querySelector('input[name="quiz-source"]:checked').value;
    const title = ui.quizTitleInput.value.trim() || "Quiz IA";
    const count = parseInt(ui.questionCountInput.value);
    const type = ui.quizTypeInput.value;

    let topic = "";
    let dataContext = ""; 

    // 1. Validation & Préparation Données
    if (source === 'topic') {
        // CAS 1: SUJET LIBRE
        topic = ui.topicInput.value.trim();
        if (!topic) return showMessage("Veuillez décrire le sujet.", "error");
    } else {
        // CAS 2: FICHIER OU SYNTHÈSE (Combinés dans l'UI sous value="file" ou "synthesis")
        // Note: Dans le HTML actuel, on a radio value="file" et value="synthesis".
        // Si tu veux simplifier l'UI à 2 choix (Doc vs Sujet), on peut fusionner.
        // Ici je gère le cas où l'utilisateur a choisi "Fichier" (qui contient notre liste combinée)
        
        const resourceId = ui.resourceSelect.value;
        if (!resourceId) return showMessage("Veuillez choisir un document.", "error");
        
        const selectedRes = userResources.find(r => r.id === resourceId);
        if (selectedRes) {
            topic = `Quiz sur : ${selectedRes.name}`;
            
            if (selectedRes.type === 'synthesis' && selectedRes.content) {
                // Pour une synthèse, on a le texte brut, c'est parfait pour l'IA
                dataContext = selectedRes.content;
            } else if (selectedRes.type === 'file') {
                // Pour un fichier, on envoie le nom et l'URL
                dataContext = `Document: ${selectedRes.name}. URL: ${selectedRes.url}. Génère des questions pertinentes basées sur ce type de document universitaire.`;
            }
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
            throw new Error("L'IA n'a pas pu générer de questions valides.");
        }

        quizData.title = title !== "Quiz IA" ? title : (quizData.title || title);

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
    if (percentage === 100) msg = "Parfait ! Maître du sujet.";
    ui.resultMessage.textContent = msg;

    // Revue des questions
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
    if(confirm("Quitter le quiz ? Progression perdue.")) {
        ui.player.classList.add('hidden');
        ui.results.classList.add('hidden');
        ui.dashboard.classList.remove('hidden');
        loadRecentQuiz();
    }
}

// --- DASHBOARD LOGIC ---

async function loadRecentQuiz() {
    if(!ui.quizGrid) return;
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
        // Fallback si index manquant
        ui.quizGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 text-xs">Historique indisponible (Index manquant).</div>';
    }
}

// --- EVENT LISTENERS ---

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

    // LOGIQUE DE SWITCH DES SOURCES (MODIFIÉE)
    ui.sourceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            // On considère 'file' et 'synthesis' comme le même cas UI pour l'instant (liste déroulante)
            if(val === 'file' || val === 'synthesis') {
                ui.sourceTopicContainer.classList.add('hidden');
                ui.sourceFileContainer.classList.remove('hidden');
            } else {
                // Topic
                ui.sourceTopicContainer.classList.remove('hidden');
                ui.sourceFileContainer.classList.add('hidden');
            }
        });
    });

    if(ui.questionCountInput) {
        ui.questionCountInput.oninput = (e) => ui.questionCountVal.textContent = e.target.value;
    }

    if(ui.generateBtn) ui.generateBtn.onclick = generateQuiz;

    if(ui.btnNext) ui.btnNext.onclick = nextQuestion;
    if(ui.btnExit) ui.btnExit.onclick = exitQuiz;

    if(ui.btnRetry) ui.btnRetry.onclick = () => startQuiz(currentQuiz);
    if(ui.btnBack) ui.btnBack.onclick = () => {
        ui.results.classList.add('hidden');
        ui.dashboard.classList.remove('hidden');
        loadRecentQuiz();
    };
}