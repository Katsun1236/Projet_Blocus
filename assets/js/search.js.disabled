import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let currentUser = null;
let searchIndex = [];
let currentFilter = 'all';
let recentSearches = [];

// Initialisation
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        initLayout('search');
        await buildSearchIndex();
        loadRecentSearches();
        setupEventListeners();
    }
});

// Configuration des écouteurs
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    const voiceBtn = document.getElementById('voice-search');

    // Search input
    let debounceTimer;
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // Show/hide clear button
        clearBtn.classList.toggle('hidden', !query);

        // Debounce search
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (query.length >= 2) {
                performSearch(query);
            } else {
                showInitialState();
            }
        }, 300);
    });

    // Clear button
    clearBtn?.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.add('hidden');
        showInitialState();
        searchInput.focus();
    });

    // Voice search
    voiceBtn?.addEventListener('click', startVoiceSearch);

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.closest('.filter-btn').classList.add('active');
            currentFilter = e.target.closest('.filter-btn').dataset.filter;

            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
    });

    // Enter key
    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                performSearch(query);
                saveToRecentSearches(query);
            }
        }
    });
}

// Construire l'index de recherche
async function buildSearchIndex() {
    if (!currentUser) return;

    searchIndex = [];
    const startTime = performance.now();

    try {
        // Indexer les cours
        const coursesRef = collection(db, 'users', currentUser.uid, 'courses');
        const coursesSnapshot = await getDocs(coursesRef);

        coursesSnapshot.forEach(doc => {
            const data = doc.data();
            searchIndex.push({
                id: doc.id,
                type: 'course',
                title: data.title || data.name || 'Sans titre',
                content: data.description || data.content || '',
                url: `courses.html?id=${doc.id}`,
                icon: 'fa-folder',
                color: 'indigo',
                createdAt: data.createdAt
            });
        });

        // Indexer les synthèses
        const synthesisRef = collection(db, 'users', currentUser.uid, 'synthesis');
        const synthesisSnapshot = await getDocs(synthesisRef);

        synthesisSnapshot.forEach(doc => {
            const data = doc.data();
            searchIndex.push({
                id: doc.id,
                type: 'synthesis',
                title: data.courseName || 'Synthèse',
                content: data.content || '',
                url: `synthesize.html?id=${doc.id}`,
                icon: 'fa-file-alt',
                color: 'purple',
                createdAt: data.createdAt
            });
        });

        // Indexer les flashcard decks
        const decksRef = collection(db, 'users', currentUser.uid, 'flashcard_decks');
        const decksSnapshot = await getDocs(decksRef);

        decksSnapshot.forEach(doc => {
            const data = doc.data();
            searchIndex.push({
                id: doc.id,
                type: 'flashcard',
                title: data.name || 'Deck',
                content: data.description || '',
                url: `flashcards.html?id=${doc.id}`,
                icon: 'fa-layer-group',
                color: 'yellow',
                createdAt: data.createdAt
            });
        });

        const endTime = performance.now();
        console.log(`✅ Search index built: ${searchIndex.length} items in ${(endTime - startTime).toFixed(0)}ms`);

    } catch (error) {
        console.error('Error building search index:', error);
    }
}

// Effectuer la recherche
function performSearch(query) {
    const startTime = performance.now();

    // Hide initial state
    document.getElementById('initial-state')?.classList.add('hidden');
    document.getElementById('loading-state')?.classList.remove('hidden');

    // Simulate delay for better UX
    setTimeout(() => {
        const results = search(query, currentFilter);
        const endTime = performance.now();

        displayResults(results, endTime - startTime);
    }, 100);
}

// Algorithme de recherche (fuzzy matching + scoring)
function search(query, filter) {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 0);

    let results = searchIndex.map(item => {
        // Filter by type
        if (filter !== 'all') {
            const typeMap = {
                'courses': 'course',
                'syntheses': 'synthesis',
                'quizzes': 'quiz',
                'flashcards': 'flashcard'
            };
            if (item.type !== typeMap[filter]) {
                return null;
            }
        }

        const titleLower = item.title.toLowerCase();
        const contentLower = item.content.toLowerCase();

        let score = 0;

        // Exact title match: high score
        if (titleLower.includes(queryLower)) {
            score += 100;
        }

        // Each term in title
        queryTerms.forEach(term => {
            if (titleLower.includes(term)) {
                score += 50;
            }
        });

        // Each term in content
        queryTerms.forEach(term => {
            if (contentLower.includes(term)) {
                score += 10;
            }
        });

        // Bonus for recent items
        if (item.createdAt) {
            const age = Date.now() - (item.createdAt.toDate ? item.createdAt.toDate().getTime() : Date.now());
            const daysSinceCreation = age / (1000 * 60 * 60 * 24);
            if (daysSinceCreation < 7) {
                score += 5;
            }
        }

        if (score === 0) return null;

        return { ...item, score };
    }).filter(Boolean);

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 50); // Limit to 50 results
}

// Afficher les résultats
function displayResults(results, searchTime) {
    document.getElementById('loading-state')?.classList.add('hidden');

    const statsEl = document.getElementById('search-stats');
    const resultsListEl = document.getElementById('results-list');
    const noResultsEl = document.getElementById('no-results');

    if (results.length === 0) {
        statsEl?.classList.add('hidden');
        resultsListEl?.classList.add('hidden');
        noResultsEl?.classList.remove('hidden');
        return;
    }

    // Show stats
    statsEl?.classList.remove('hidden');
    document.getElementById('results-count').textContent = results.length;
    document.getElementById('search-time').textContent = searchTime.toFixed(0);

    // Show results
    resultsListEl?.classList.remove('hidden');
    noResultsEl?.classList.add('hidden');

    const query = document.getElementById('search-input').value.trim();

    resultsListEl.innerHTML = results.map(result => {
        const typeLabel = {
            'course': 'Cours',
            'synthesis': 'Synthèse',
            'quiz': 'Quiz',
            'flashcard': 'Flashcards'
        }[result.type] || result.type;

        const highlightedTitle = highlightText(result.title, query);
        const highlightedContent = highlightText(truncate(result.content, 150), query);

        return `
            <div class="search-result-card animate-fade-in-up" onclick="window.location.href='${result.url}'">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-full bg-${result.color}-500/20 flex items-center justify-center flex-shrink-0">
                        <i class="fas ${result.icon} text-${result.color}-400 text-xl"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs px-2 py-1 bg-${result.color}-500/20 text-${result.color}-400 rounded-full font-bold">
                                ${typeLabel}
                            </span>
                            ${result.score > 90 ? '<span class="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-bold">Pertinent</span>' : ''}
                        </div>
                        <h3 class="text-lg font-bold text-white mb-1">${highlightedTitle}</h3>
                        ${highlightedContent ? `<p class="text-sm text-gray-400 line-clamp-2">${highlightedContent}</p>` : ''}
                    </div>
                    <i class="fas fa-chevron-right text-gray-600"></i>
                </div>
            </div>
        `;
    }).join('');
}

// Highlight matching text
function highlightText(text, query) {
    if (!text || !query) return text;

    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    let highlighted = text;

    queryTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlighted = highlighted.replace(regex, '<span class="search-highlight">$1</span>');
    });

    return highlighted;
}

// Truncate text
function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Show initial state
function showInitialState() {
    document.getElementById('initial-state')?.classList.remove('hidden');
    document.getElementById('loading-state')?.classList.add('hidden');
    document.getElementById('results-list')?.classList.add('hidden');
    document.getElementById('no-results')?.classList.add('hidden');
    document.getElementById('search-stats')?.classList.add('hidden');
}

// Recent searches
function saveToRecentSearches(query) {
    recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');

    // Remove if already exists
    recentSearches = recentSearches.filter(s => s !== query);

    // Add to beginning
    recentSearches.unshift(query);

    // Limit to 10
    recentSearches = recentSearches.slice(0, 10);

    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    displayRecentSearches();
}

function loadRecentSearches() {
    recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    displayRecentSearches();
}

function displayRecentSearches() {
    const container = document.getElementById('recent-searches');
    const parent = container.querySelector('div');

    if (!parent || recentSearches.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    parent.innerHTML = recentSearches.map(query => `
        <button class="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-indigo-500 transition" onclick="document.getElementById('search-input').value='${query}'; document.getElementById('search-input').dispatchEvent(new Event('input'));">
            <i class="fas fa-history mr-2"></i>${query}
        </button>
    `).join('');
}

// Voice search (Web Speech API)
function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    const voiceBtn = document.getElementById('voice-search');
    voiceBtn.innerHTML = '<i class="fas fa-microphone-slash text-xl text-red-500"></i>';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('search-input').value = transcript;
        performSearch(transcript);
        saveToRecentSearches(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        voiceBtn.innerHTML = '<i class="fas fa-microphone text-xl"></i>';
    };

    recognition.start();
}

console.log('Search module loaded ✅');
