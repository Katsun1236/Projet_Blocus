import { auth, db, functions } from './config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";

// --- STATE ---
let currentUserId = null;
let currentQuiz = null; 
let currentQuestionIndex = 0;
let currentScore = 0;
let quizHistory = [];

// --- DOM ELEMENTS ---
const ui = {
    // Dashboard
    dashboard: document.getElementById('quiz-dashboard'),
    quizGrid: document.getElementById('quiz-grid'),
    statAvg: document.getElementById('stat-avg-score'),
    statTotal: document.getElementById('stat-total-quiz'),
    // Player
    player: document.getElementById('quiz-player'),
    playerTitle: document.getElementById('player-quiz-title'),
    playerProgress: document.getElementById('player-progress'),
    progressBar: document.getElementById('progress-bar'),
    questionText: document.getElementById('question-text'),
    questionTypeBadge: document.getElementById('question-type-badge'),
    optionsGrid: document.getElementById('options-grid'),
    feedbackArea: document.getElementById('feedback-area'),
    feedbackBox: document.getElementById('feedback-box'),
    nextBtn: document.getElementById('next-question-btn'),
    resultsContainer: document.getElementById('results-container'),
    questionContainer: document.getElementById('question-container'),
    finalScore: document.getElementById('final-score'),
    resultMessage: document.getElementById('result-message'),
    reviewList: document.getElementById('review-list'),
    exitBtn: document.getElementById('exit-quiz-btn'),
    backDashboardBtn: document.getElementById('back-to-dashboard-btn'),
    retryQuizBtn: document.getElementById('retry-quiz-btn'),
    retryErrorsBtn: document.getElementById('retry-errors-btn'),
    // Modal
    modal: document.getElementById('new-quiz-modal'),
    btnOpenHero: document.getElementById('btn-new-quiz-hero'),
    btnOpenHeader: document.getElementById('btn-new-quiz-header'),
    btnClose: document.getElementById('close-modal-btn'),
    btnCancel: document.getElementById('cancel-quiz-btn'),
    btnGenerate: document.getElementById('generate-quiz-btn'),
    loadingBar: document.getElementById('loading-bar-container'),
    // Form Inputs
    titleInput: document.getElementById('quiz-title-input'),
    sourceRadios: document.getElementsByName('quiz-source'),
    containers: {
        synthesis: document.getElementById('source-synthesis-container'),
        file: document.getElementById('source-file-container'),
        topic: document.getElementById('source-topic-container')
    },
    selects: {
        synthesis: document.getElementById('quiz-synthesis-select'),
        file: document.getElementById('quiz-file-select')
    },
    topicInput: document.getElementById('quiz-topic'),
    typeSelect: document.getElementById('quiz-type'),
    lengthInput: document.getElementById('quiz-length'),
    lengthVal: document.getElementById('quiz-length-val'),
    // Header Info
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initLayout('quiz');
    
    // UI Helpers
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            select.classList.toggle('has-value', !!select.value);
        });
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            await initPage();
            loadQuizzes();
            loadSources();
        } else {
            window.location.href = '../auth/login.html';
        }
    });
});

async function initPage() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if(ui.userName) ui.userName.textContent = data.firstName || "Étudiant";
            if(ui.userAvatar) ui.userAvatar.src = data.photoURL || 'https://ui-avatars.com/api/?background=random';
        }
    } catch(e) { console.error(e); }
}

// --- DATA LOADING ---
async function loadQuizzes() {
    ui.quizGrid.innerHTML = '';
    
    try {
        const q = query(collection(db, 'users', currentUserId, 'quizzes'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        let totalScore = 0, count = 0;

        if (snapshot.empty) {
            ui.quizGrid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500 opacity-50"><p>Aucun quiz. Créez-en un !</p></div>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const quiz = docSnap.data();
            if (quiz.score !== null) { totalScore += quiz.score; count++; }
            
            const card = document.createElement('div');
            card.className = 'quiz-card content-glass rounded-2xl p-6 flex flex-col justify-between h-full relative group cursor-pointer border border-gray-800 hover:border-indigo-500/30';
            
            const scoreBadge = quiz.score !== null 
                ? `<span class="px-2 py-1 rounded bg-gray-800 text-xs ${quiz.score >= 50 ? 'text-green-400' : 'text-red-400'}">${quiz.score}%</span>`
                : `<span class="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400">À faire</span>`;

            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                            <i class="fas fa-brain"></i>
                        </div>
                        <div class="flex gap-2">
                            ${scoreBadge}
                            <button class="rename-btn p-1 hover:text-white text-gray-500" title="Renommer"><i class="fas fa-pen text-xs"></i></button>
                            <button class="delete-btn p-1 hover:text-red-400 text-gray-500" title="Supprimer"><i class="fas fa-trash text-xs"></i></button>
                        </div>
                    </div>
                    <h3 class="font-bold text-white text-lg mb-1 line-clamp-2">${quiz.title || quiz.topic}</h3>
                    <p class="text-xs text-gray-400 flex items-center gap-2">
                        <span>${quiz.type ? quiz.type.toUpperCase() : 'MIXTE'}</span> • <span>${quiz.questions.length} Q</span>
                    </p>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-indigo-400 font-bold group-hover:text-indigo-300">
                    <span>${quiz.score !== null ? 'Rejouer' : 'Commencer'}</span>
                    <i class="fas fa-arrow-right"></i>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if(!e.target.closest('button')) startQuiz(docSnap.id, quiz);
            });

            // Renommer
            card.querySelector('.rename-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                const newTitle = prompt("Nouveau nom du quiz :", quiz.title || quiz.topic);
                if (newTitle) {
                    await updateDoc(doc(db, 'users', currentUserId, 'quizzes', docSnap.id), { title: newTitle });
                    loadQuizzes();
                }
            });

            // Supprimer
            card.querySelector('.delete-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                if(confirm("Supprimer ce quiz ?")) {
                    await deleteDoc(doc(db, 'users', currentUserId, 'quizzes', docSnap.id));
                    loadQuizzes();
                }
            });

            ui.quizGrid.appendChild(card);
        });

        ui.statTotal.textContent = count;
        ui.statAvg.textContent = count > 0 ? Math.round(totalScore / count) + '%' : '--%';
    } catch (e) {
        console.error("Erreur chargement quiz:", e);
    }
}

async function loadSources() {
    try {
        const synthSnap = await getDocs(query(collection(db, 'users', currentUserId, 'syntheses'), orderBy('createdAt', 'desc')));
        ui.selects.synthesis.innerHTML = '<option value="">-- Choisir une synthèse --</option>';
        synthSnap.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id; 
            opt.text = d.data().title;
            opt.dataset.content = d.data().content || ""; 
            ui.selects.synthesis.appendChild(opt);
        });

        const fileSnap = await getDocs(query(collection(db, 'users', currentUserId, 'courses'), orderBy('createdAt', 'desc')));
        ui.selects.file.innerHTML = '<option value="">-- Choisir un fichier --</option>';
        fileSnap.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id; 
            opt.text = d.data().title || d.data().fileName;
            ui.selects.file.appendChild(opt);
        });
    } catch (e) { console.error(e); }
}

// --- GENERATION LOGIC (SECURE) ---
if (ui.btnGenerate) {
    ui.btnGenerate.onclick = async () => {
        const btn = ui.btnGenerate;
        const originalHtml = btn.innerHTML;
        
        const title = ui.titleInput.value.trim() || "Nouveau Quiz";
        const source = document.querySelector('input[name="quiz-source"]:checked').value;
        const type = ui.typeSelect.value;
        const count = ui.lengthInput.value;
        
        if(!type) return showMessage("Veuillez choisir un type de quiz", "error");

        let context = "";
        let topicName = "";

        if (source === 'topic') {
            context = ui.topicInput.value;
            topicName = context;
        } else if (source === 'synthesis') {
            const sel = ui.selects.synthesis;
            if (!sel.value) return showMessage("Sélectionnez une synthèse", "error");
            // Limitation taille pour éviter de dépasser token limit
            const content = sel.options[sel.selectedIndex].dataset.content; 
            topicName = sel.options[sel.selectedIndex].text;
            context = `Basé sur la synthèse suivante: "${topicName}". Contenu: ${content.substring(0, 8000)}`; 
        } else {
            const sel = ui.selects.file;
            if (!sel.value) return showMessage("Sélectionnez un fichier", "error");
            topicName = sel.options[sel.selectedIndex].text;
            context = `Sujet du cours : ${topicName}. Génère des questions pertinentes sur ce thème général (le contenu complet du fichier n'est pas accessible).`; 
        }

        if (!context) return showMessage("Source invalide", "error");

        // UI LOADING
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-hourglass-half fa-spin"></i> Patientez...`;
        ui.loadingBar.classList.remove('hidden');

        try {
            // Appel à la Cloud Function "generateContent"
            const generateContent = httpsCallable(functions, 'generateContent');
            
            const prompt = `
                Agis comme un professeur d'université. Génère un quiz de ${count} questions.
                Contexte: ${context}
                Type: ${type} (qcm, qrm, truefalse, fill)
                Langue: Français.
                Format JSON attendu (tableau 'questions' avec 'question', 'options' (array), 'correctAnswers' (array d'index), 'explanation').
            `;

            // Schema Strict pour JSON Output
            const schema = {
                type: "OBJECT",
                properties: {
                    questions: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                question: { type: "STRING" },
                                options: { type: "ARRAY", items: { type: "STRING" } },
                                correctAnswers: { type: "ARRAY", items: { type: "INTEGER" } },
                                explanation: { type: "STRING" }
                            },
                            required: ["question", "options", "correctAnswers", "explanation"]
                        }
                    }
                },
                required: ["questions"]
            };

            const response = await generateContent({ 
                prompt: prompt,
                schema: schema,
                model: 'gemini-pro', // CHANGEMENT ICI
                mimeType: 'application/json'
            });

            // Parsing du résultat
            const jsonText = response.data.text;
            const parsed = JSON.parse(jsonText);
            const questions = parsed.questions || parsed;

            // Sauvegarde
            await addDoc(collection(db, 'users', currentUserId, 'quizzes'), {
                title: title,
                topic: topicName,
                type: type,
                questions: questions,
                createdAt: serverTimestamp(),
                score: null,
                status: 'created'
            });

            ui.modal.classList.add('hidden');
            ui.titleInput.value = "";
            showMessage("Quiz généré et sauvegardé !", "success");
            loadQuizzes();

        } catch (e) {
            console.error(e);
            showMessage("Erreur IA : " + e.message, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            ui.loadingBar.classList.add('hidden');
        }
    };
}

// --- PLAYER LOGIC ---
function startQuiz(quizId, quizData) {
    currentQuiz = { id: quizId, ...quizData };
    currentQuestionIndex = 0;
    currentScore = 0;
    quizHistory = [];

    ui.dashboard.classList.add('hidden');
    ui.player.classList.remove('hidden');
    ui.resultsContainer.classList.add('hidden');
    ui.questionContainer.classList.remove('hidden');
    
    ui.playerTitle.textContent = currentQuiz.title;
    ui.questionTypeBadge.textContent = currentQuiz.type ? currentQuiz.type.toUpperCase() : 'QUIZ';

    renderQuestion();
}

function renderQuestion() {
    const q = currentQuiz.questions[currentQuestionIndex];
    ui.playerProgress.textContent = `Question ${currentQuestionIndex + 1}/${currentQuiz.questions.length}`;
    ui.progressBar.style.width = `${((currentQuestionIndex) / currentQuiz.questions.length) * 100}%`;
    
    ui.questionText.textContent = q.question;
    ui.optionsGrid.innerHTML = '';
    ui.feedbackArea.classList.add('hidden');
    ui.nextBtn.onclick = null; 

    if (currentQuiz.type === 'fill') {
        ui.questionText.innerHTML = q.question.replace(/\[(.*?)\]/g, '<span class="border-b-2 border-indigo-500 text-indigo-400 px-2">_____</span>');
    }

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-left text-gray-200 hover:bg-gray-700 transition-all font-medium';
        btn.textContent = opt;
        btn.dataset.idx = idx;
        
        btn.onclick = () => handleAnswer(idx, btn, q);
        ui.optionsGrid.appendChild(btn);
    });
}

function handleAnswer(selectedIndex, btnElement, questionData) {
    const allBtns = ui.optionsGrid.querySelectorAll('button');
    allBtns.forEach(b => b.disabled = true);

    const correctIndices = Array.isArray(questionData.correctAnswers) ? questionData.correctAnswers : [questionData.correctAnswer];
    const isCorrect = correctIndices.includes(selectedIndex);

    if (isCorrect) {
        btnElement.classList.add('correct-answer', 'text-green-400');
        currentScore++;
    } else {
        btnElement.classList.add('wrong-answer', 'text-red-400');
        allBtns.forEach(b => {
            if (correctIndices.includes(parseInt(b.dataset.idx))) {
                b.classList.add('correct-answer', 'text-green-400');
            }
        });
    }

    quizHistory.push({
        question: questionData.question,
        userAnswer: questionData.options[selectedIndex],
        correctAnswer: correctIndices.map(i => questionData.options[i]).join(', '),
        isCorrect: isCorrect,
        explanation: questionData.explanation
    });

    ui.feedbackArea.classList.remove('hidden');
    ui.feedbackBox.className = `p-4 rounded-xl mb-4 text-sm font-medium ${isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`;
    ui.feedbackBox.innerHTML = `<strong>${isCorrect ? 'Correct !' : 'Incorrect.'}</strong> ${questionData.explanation || ''}`;

    ui.nextBtn.onclick = nextQuestion;
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuiz.questions.length) {
        renderQuestion();
    } else {
        finishQuiz();
    }
}

async function finishQuiz() {
    ui.questionContainer.classList.add('hidden');
    ui.resultsContainer.classList.remove('hidden');
    ui.progressBar.style.width = '100%';

    const finalPercent = Math.round((currentScore / currentQuiz.questions.length) * 100);
    ui.finalScore.textContent = `${finalPercent}%`;
    
    if (finalPercent >= 80) ui.resultMessage.textContent = "Excellent travail ! Tu maîtrises le sujet.";
    else if (finalPercent >= 50) ui.resultMessage.textContent = "Bien joué, mais il reste des lacunes.";
    else ui.resultMessage.textContent = "Continue de réviser, ça va venir !";

    if (finalPercent < 100) ui.retryErrorsBtn.classList.remove('hidden');
    else ui.retryErrorsBtn.classList.add('hidden');

    ui.reviewList.innerHTML = '';
    quizHistory.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = `p-4 rounded-xl border ${item.isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`;
        el.innerHTML = `
            <p class="text-sm font-bold text-white mb-2">Q${index+1}: ${item.question}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div class="${item.isCorrect ? 'text-green-400' : 'text-red-400'}">
                    <span class="font-bold">Toi:</span> ${item.userAnswer}
                </div>
                <div class="text-green-400">
                    <span class="font-bold">Réponse:</span> ${item.correctAnswer}
                </div>
            </div>
            <p class="text-xs text-gray-400 mt-2 italic border-t border-white/5 pt-2">${item.explanation}</p>
        `;
        ui.reviewList.appendChild(el);
    });

    try {
        await updateDoc(doc(db, 'users', currentUserId, 'quizzes', currentQuiz.id), {
            score: finalPercent,
            status: 'completed',
            lastPlayed: serverTimestamp()
        });
        loadQuizzes();
    } catch(e) { console.error(e); }
}

// --- UTILS & EVENT HANDLERS ---
if (ui.retryQuizBtn) ui.retryQuizBtn.onclick = () => startQuiz(currentQuiz.id, currentQuiz);

if (ui.retryErrorsBtn) ui.retryErrorsBtn.onclick = () => {
    const wrongIndices = quizHistory
        .map((h, i) => h.isCorrect ? -1 : i)
        .filter(i => i !== -1);
    
    if (wrongIndices.length === 0) return;
    const wrongQuestions = wrongIndices.map(i => currentQuiz.questions[i]);
    const tempQuiz = { ...currentQuiz, title: `${currentQuiz.title} (Erreurs)`, questions: wrongQuestions };
    startQuiz(currentQuiz.id, tempQuiz);
};

const exit = () => {
    ui.player.classList.add('hidden');
    ui.dashboard.classList.remove('hidden');
};
if (ui.exitBtn) ui.exitBtn.onclick = () => confirm("Quitter ?") && exit();
if (ui.backDashboardBtn) ui.backDashboardBtn.onclick = exit;

const toggleModal = (show) => { ui.modal.classList.toggle('hidden', !show); };
if (ui.btnOpenHero) ui.btnOpenHero.onclick = () => toggleModal(true);
if (ui.btnOpenHeader) ui.btnOpenHeader.onclick = () => toggleModal(true);
if (ui.btnClose) ui.btnClose.onclick = () => toggleModal(false);
if (ui.btnCancel) ui.btnCancel.onclick = () => toggleModal(false);

ui.sourceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        Object.values(ui.containers).forEach(c => c.classList.add('hidden'));
        ui.containers[e.target.value].classList.remove('hidden');
    });
});
if(ui.lengthInput) ui.lengthInput.addEventListener('input', (e) => ui.lengthVal.textContent = e.target.value);