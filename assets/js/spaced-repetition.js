import { auth, db, storage, supabase, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, deleteField, ref, uploadBytesResumable, getDownloadURL } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';

let currentUserId = null;
let reviewQueue = [];
let currentCard = null;
let currentIndex = 0;

const ui = {
    dashboard: document.getElementById('review-dashboard'),
    reviewSession: document.getElementById('review-session'),
    dueCount: document.getElementById('due-count'),
    totalCards: document.getElementById('total-cards'),
    streakDays: document.getElementById('streak-days'),
    btnStartReview: document.getElementById('btn-start-review'),
    btnAddCard: document.getElementById('btn-add-card'),
    cardQuestion: document.getElementById('card-question'),
    cardAnswer: document.getElementById('card-answer'),
    showAnswerBtn: document.getElementById('show-answer-btn'),
    ratingButtons: document.getElementById('rating-buttons'),
    progressBar: document.getElementById('review-progress-bar'),
    progressText: document.getElementById('review-progress-text'),
    sessionComplete: document.getElementById('session-complete'),
    reviewedCount: document.getElementById('reviewed-count'),
    btnFinish: document.getElementById('btn-finish-review'),
    addCardModal: document.getElementById('add-card-modal'),
    closeModalBtn: document.getElementById('close-add-card-modal'),
    questionInput: document.getElementById('new-card-question'),
    answerInput: document.getElementById('new-card-answer'),
    categoryInput: document.getElementById('new-card-category'),
    saveCardBtn: document.getElementById('save-card-btn')
};

/**
 * Algorithme SM-2 (SuperMemo 2)
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */
function calculateNextReview(card, rating) {
    let { easeFactor = 2.5, interval = 1, repetitions = 0 } = card;

    // Rating: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
    if (rating < 2) {
        // Réinitialiser si échec
        repetitions = 0;
        interval = 1;
    } else {
        repetitions++;
        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
    }

    // Ajuster easeFactor
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02)));

    // Calculer la prochaine date de révision
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
        easeFactor,
        interval,
        repetitions,
        nextReviewDate: Timestamp.fromDate(nextReviewDate),
        lastReviewed: serverTimestamp()
    };
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initLayout('spaced-repetition');

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../auth/login.html';
            return;
        }

        currentUserId = user.uid;
        await loadStats();
        setupEventListeners();
    });
});

async function loadStats() {
    try {
        const cardsRef = collection(db, 'users', currentUserId, 'review_cards');
        const allCards = await getDocs(cardsRef);

        ui.totalCards.textContent = allCards.size;

        // Compter les cartes dues aujourd'hui
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        let dueCount = 0;
        allCards.forEach(doc => {
            const card = doc.data();
            const nextReview = card.nextReviewDate?.toDate() || new Date(0);
            if (nextReview <= today) {
                dueCount++;
            }
        });

        ui.dueCount.textContent = dueCount;

        // Calculer le streak (jours consécutifs)
        await calculateStreak();

    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

async function calculateStreak() {
    try {
        // Récupérer les sessions de révision
        const sessionsRef = collection(db, 'users', currentUserId, 'review_sessions');
        const q = query(sessionsRef, orderBy('date', 'desc'), limit(365));
        const snapshot = await getDocs(q);

        let streak = 0;
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        snapshot.forEach(doc => {
            const sessionDate = doc.data().date.toDate();
            sessionDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((yesterday - sessionDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                streak++;
                yesterday.setDate(yesterday.getDate() - 1);
            }
        });

        ui.streakDays.textContent = streak;

    } catch (e) {
        console.error('Error calculating streak:', e);
    }
}

function setupEventListeners() {
    ui.btnStartReview.onclick = startReviewSession;
    ui.btnAddCard.onclick = () => ui.addCardModal.classList.remove('hidden');
    ui.closeModalBtn.onclick = () => ui.addCardModal.classList.add('hidden');
    ui.saveCardBtn.onclick = saveNewCard;
    ui.showAnswerBtn.onclick = showAnswer;
    ui.btnFinish.onclick = finishSession;

    // Rating buttons
    document.querySelectorAll('[data-rating]').forEach(btn => {
        btn.onclick = () => rateCard(parseInt(btn.dataset.rating));
    });

    // Fermer modal en cliquant en dehors
    ui.addCardModal.addEventListener('click', (e) => {
        if (e.target === ui.addCardModal) {
            ui.addCardModal.classList.add('hidden');
        }
    });
}

async function startReviewSession() {
    try {
        // Charger les cartes dues
        const cardsRef = collection(db, 'users', currentUserId, 'review_cards');
        const snapshot = await getDocs(cardsRef);

        reviewQueue = [];
        const today = new Date();

        snapshot.forEach(doc => {
            const card = { id: doc.id, ...doc.data() };
            const nextReview = card.nextReviewDate?.toDate() || new Date(0);
            if (nextReview <= today) {
                reviewQueue.push(card);
            }
        });

        if (reviewQueue.length === 0) {
            showMessage('Aucune carte à réviser pour le moment !', 'info');
            return;
        }

        // Mélanger la queue
        reviewQueue.sort(() => Math.random() - 0.5);

        // Démarrer la session
        currentIndex = 0;
        ui.dashboard.classList.add('hidden');
        ui.reviewSession.classList.remove('hidden');

        showNextCard();

    } catch (e) {
        console.error('Error starting review session:', e);
        showMessage('Erreur lors du démarrage de la session', 'error');
    }
}

function showNextCard() {
    if (currentIndex >= reviewQueue.length) {
        completeSession();
        return;
    }

    currentCard = reviewQueue[currentIndex];

    ui.cardQuestion.textContent = currentCard.question;
    ui.cardAnswer.textContent = currentCard.answer;
    ui.cardAnswer.classList.add('hidden');
    ui.showAnswerBtn.classList.remove('hidden');
    ui.ratingButtons.classList.add('hidden');

    updateProgress();
}

function showAnswer() {
    ui.cardAnswer.classList.remove('hidden');
    ui.showAnswerBtn.classList.add('hidden');
    ui.ratingButtons.classList.remove('hidden');
}

async function rateCard(rating) {
    try {
        // Calculer le prochain intervalle avec SM-2
        const updates = calculateNextReview(currentCard, rating);

        // Mettre à jour la carte dans Firestore
        const cardRef = doc(db, 'users', currentUserId, 'review_cards', currentCard.id);
        await updateDoc(cardRef, updates);

        // Passer à la carte suivante
        currentIndex++;
        showNextCard();

    } catch (e) {
        console.error('Error rating card:', e);
        showMessage('Erreur lors de l\'enregistrement', 'error');
    }
}

function updateProgress() {
    const percentage = ((currentIndex + 1) / reviewQueue.length) * 100;
    ui.progressBar.style.width = `${percentage}%`;
    ui.progressText.textContent = `${currentIndex + 1} / ${reviewQueue.length}`;
}

async function completeSession() {
    // Sauvegarder la session
    try {
        await addDoc(collection(db, 'users', currentUserId, 'review_sessions'), {
            date: serverTimestamp(),
            cardsReviewed: reviewQueue.length
        });
    } catch (e) {
        console.error('Error saving session:', e);
    }

    ui.reviewedCount.textContent = reviewQueue.length;
    ui.reviewSession.classList.add('hidden');
    ui.sessionComplete.classList.remove('hidden');
}

function finishSession() {
    ui.sessionComplete.classList.add('hidden');
    ui.dashboard.classList.remove('hidden');
    loadStats();
}

async function saveNewCard() {
    const question = ui.questionInput.value.trim();
    const answer = ui.answerInput.value.trim();
    const category = ui.categoryInput.value.trim();

    if (!question || !answer) {
        showMessage('Question et réponse requises', 'error');
        return;
    }

    try {
        await addDoc(collection(db, 'users', currentUserId, 'review_cards'), {
            question,
            answer,
            category: category || 'Général',
            easeFactor: 2.5,
            interval: 1,
            repetitions: 0,
            nextReviewDate: serverTimestamp(),
            createdAt: serverTimestamp()
        });

        showMessage('Carte ajoutée avec succès !', 'success');

        // Réinitialiser le formulaire
        ui.questionInput.value = '';
        ui.answerInput.value = '';
        ui.categoryInput.value = '';
        ui.addCardModal.classList.add('hidden');

        await loadStats();

    } catch (e) {
        console.error('Error saving card:', e);
        showMessage('Erreur lors de l\'ajout', 'error');
    }
}
