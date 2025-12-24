import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let currentUser = null;
let decks = [];
let currentDeck = null;
let currentCards = [];
let currentCardIndex = 0;
let isFlipped = false;

// Initialisation
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        initLayout('flashcards');
        await loadDecks();
        await loadCourses();
        setupEventListeners();
        updateStats();
    }
});

// Configuration des écouteurs
function setupEventListeners() {
    // Create deck
    document.getElementById('create-deck-btn')?.addEventListener('click', openCreateDeckModal);
    document.getElementById('close-create-deck')?.addEventListener('click', closeCreateDeckModal);
    document.getElementById('cancel-deck')?.addEventListener('click', closeCreateDeckModal);
    document.getElementById('save-deck')?.addEventListener('click', createDeck);

    // Study mode
    document.getElementById('flip-card')?.addEventListener('click', flipCard);
    document.getElementById('close-study')?.addEventListener('click', closeStudyMode);

    // Answer buttons
    document.querySelectorAll('#answer-buttons button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.difficulty;
            answerCard(difficulty);
        });
    });
}

// Charger les decks
async function loadDecks() {
    if (!currentUser) return;

    try {
        const decksRef = collection(db, 'users', currentUser.uid, 'flashcard_decks');
        const snapshot = await getDocs(decksRef);

        decks = [];
        snapshot.forEach(doc => {
            decks.push({ id: doc.id, ...doc.data() });
        });

        renderDecks();

    } catch (error) {
        console.error('Error loading decks:', error);
        showMessage('Erreur de chargement', 'error');
    }
}

// Afficher les decks
function renderDecks() {
    const container = document.getElementById('decks-container');

    if (decks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500 col-span-full">
                <i class="fas fa-layer-group text-4xl mb-4 opacity-50"></i>
                <p>Aucun deck créé. Commencez par en créer un!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = decks.map(deck => `
        <div class="bg-gray-800/30 rounded-xl p-6 border border-gray-800 hover:border-indigo-500/30 transition cursor-pointer" data-deck-id="${deck.id}">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold">${deck.name}</h3>
                <div class="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <i class="fas fa-layer-group text-indigo-400"></i>
                </div>
            </div>
            <p class="text-gray-400 text-sm mb-4">${deck.description || 'Pas de description'}</p>
            <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">${deck.cardCount || 0} cartes</span>
                <button class="study-deck-btn px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition text-sm" data-deck-id="${deck.id}">
                    Réviser
                </button>
            </div>
        </div>
    `).join('');

    // Ajouter les événements
    document.querySelectorAll('.study-deck-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const deckId = e.target.dataset.deckId;
            startStudyMode(deckId);
        });
    });
}

// Ouvrir modal de création
function openCreateDeckModal() {
    document.getElementById('create-deck-modal').classList.remove('hidden');
}

function closeCreateDeckModal() {
    document.getElementById('create-deck-modal').classList.add('hidden');
    document.getElementById('deck-name').value = '';
    document.getElementById('deck-description').value = '';
    document.getElementById('course-select').value = '';
}

// Créer un deck
async function createDeck() {
    const name = document.getElementById('deck-name').value.trim();
    const description = document.getElementById('deck-description').value.trim();
    const courseId = document.getElementById('course-select').value;

    if (!name) {
        showMessage('Veuillez entrer un nom', 'error');
        return;
    }

    try {
        const decksRef = collection(db, 'users', currentUser.uid, 'flashcard_decks');

        const newDeck = {
            name,
            description,
            courseId: courseId || null,
            cardCount: 0,
            createdAt: serverTimestamp(),
            lastStudied: null
        };

        const deckDoc = await addDoc(decksRef, newDeck);

        // Si un cours est sélectionné, générer des flashcards automatiquement
        if (courseId) {
            await generateFlashcardsFromCourse(deckDoc.id, courseId);
        }

        showMessage('Deck créé avec succès!', 'success');
        closeCreateDeckModal();
        await loadDecks();

    } catch (error) {
        console.error('Error creating deck:', error);
        showMessage('Erreur lors de la création', 'error');
    }
}

// Générer des flashcards depuis un cours (placeholder)
async function generateFlashcardsFromCourse(deckId, courseId) {
    // TODO: Implémenter la génération via Gemini API
    console.log('Génération de flashcards pour deck:', deckId, 'cours:', courseId);

    // Pour l'instant, créer quelques cartes d'exemple
    const sampleCards = [
        { question: 'Qu\'est-ce qu\'une variable ?', answer: 'Un conteneur pour stocker des données' },
        { question: 'Définir une fonction', answer: 'Un bloc de code réutilisable qui effectue une tâche spécifique' },
        { question: 'Qu\'est-ce qu\'une boucle ?', answer: 'Une structure qui répète un bloc de code' }
    ];

    const cardsRef = collection(db, 'users', currentUser.uid, 'flashcard_decks', deckId, 'cards');

    for (const card of sampleCards) {
        await addDoc(cardsRef, {
            ...card,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReview: new Date(),
            createdAt: serverTimestamp()
        });
    }

    // Mettre à jour le compteur
    const deckRef = doc(db, 'users', currentUser.uid, 'flashcard_decks', deckId);
    await updateDoc(deckRef, {
        cardCount: sampleCards.length
    });
}

// Démarrer le mode révision
async function startStudyMode(deckId) {
    currentDeck = decks.find(d => d.id === deckId);

    if (!currentDeck) return;

    try {
        // Charger les cartes du deck
        const cardsRef = collection(db, 'users', currentUser.uid, 'flashcard_decks', deckId, 'cards');
        const q = query(cardsRef, where('nextReview', '<=', new Date()));
        const snapshot = await getDocs(q);

        currentCards = [];
        snapshot.forEach(doc => {
            currentCards.push({ id: doc.id, ...doc.data() });
        });

        if (currentCards.length === 0) {
            showMessage('Aucune carte à réviser!', 'info');
            return;
        }

        currentCardIndex = 0;
        document.getElementById('study-mode').classList.remove('hidden');
        showCard(0);

    } catch (error) {
        console.error('Error starting study mode:', error);
        showMessage('Erreur', 'error');
    }
}

// Afficher une carte
function showCard(index) {
    if (index >= currentCards.length) {
        endStudySession();
        return;
    }

    const card = currentCards[index];

    document.getElementById('card-question').textContent = card.question;
    document.getElementById('card-answer').textContent = card.answer;
    document.getElementById('study-progress').textContent = `${index + 1}/${currentCards.length}`;
    document.getElementById('study-progress-bar').style.width = `${((index + 1) / currentCards.length) * 100}%`;

    // Reset flip
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('answer-buttons').classList.add('hidden');
    isFlipped = false;
}

// Retourner la carte
function flipCard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    isFlipped = !isFlipped;

    if (isFlipped) {
        document.getElementById('answer-buttons').classList.remove('hidden');
    }
}

// Répondre à une carte (SM-2 Algorithm)
async function answerCard(difficulty) {
    const card = currentCards[currentCardIndex];

    // Calculer la prochaine révision selon l'algorithme SM-2
    const { easeFactor, interval, repetitions } = calculateNextReview(
        card.easeFactor,
        card.interval,
        card.repetitions,
        difficulty
    );

    try {
        const cardRef = doc(db, 'users', currentUser.uid, 'flashcard_decks', currentDeck.id, 'cards', card.id);

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        await updateDoc(cardRef, {
            easeFactor,
            interval,
            repetitions,
            nextReview,
            lastReviewed: serverTimestamp()
        });

        currentCardIndex++;
        showCard(currentCardIndex);

    } catch (error) {
        console.error('Error updating card:', error);
    }
}

// Algorithme SM-2 (Supermemo 2)
function calculateNextReview(easeFactor, interval, repetitions, difficulty) {
    let quality;

    switch (difficulty) {
        case 'hard':
            quality = 2;
            break;
        case 'medium':
            quality = 3;
            break;
        case 'easy':
            quality = 4;
            break;
        default:
            quality = 3;
    }

    let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);

    let newInterval;
    let newRepetitions;

    if (quality < 3) {
        newRepetitions = 0;
        newInterval = 1;
    } else {
        newRepetitions = repetitions + 1;

        if (newRepetitions === 1) {
            newInterval = 1;
        } else if (newRepetitions === 2) {
            newInterval = 6;
        } else {
            newInterval = Math.round(interval * newEaseFactor);
        }
    }

    return {
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions
    };
}

// Terminer la session
function endStudySession() {
    closeStudyMode();
    showMessage(`Session terminée! ${currentCards.length} cartes révisées.`, 'success');
    updateStats();
}

function closeStudyMode() {
    document.getElementById('study-mode').classList.add('hidden');
    currentCards = [];
    currentCardIndex = 0;
}

// Charger les cours pour le sélecteur
async function loadCourses() {
    try {
        const coursesRef = collection(db, 'users', currentUser.uid, 'courses');
        const snapshot = await getDocs(coursesRef);

        const select = document.getElementById('course-select');
        select.innerHTML = '<option value="">-- Choisir un cours --</option>';

        snapshot.forEach(doc => {
            const course = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = course.title || course.name || 'Sans titre';
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Mettre à jour les statistiques
async function updateStats() {
    // TODO: Calculer les vraies stats depuis Firestore
    document.getElementById('cards-due-today').textContent = '0';
    document.getElementById('total-cards').textContent = decks.reduce((sum, deck) => sum + (deck.cardCount || 0), 0);
    document.getElementById('study-streak').textContent = '0 🔥';
    document.getElementById('retention-rate').textContent = '0%';
}

console.log('Flashcards module loaded ✅');
