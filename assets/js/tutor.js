import { auth, db, storage, supabase, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, deleteField, ref, uploadBytesResumable, getDownloadURL } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';
import { sanitizeHTML, sanitizeText } from './sanitizer.js';

let currentUserId = null;
let currentUserData = null;
let messagesUnsubscribe = null;
let isGenerating = false;

const ui = {
    chatContainer: document.getElementById('chat-container'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-message-btn'),
    clearBtn: document.getElementById('clear-chat-btn'),
    contextSelect: document.getElementById('context-select'),
    suggestions: document.getElementById('suggestions-container')
};

const SYSTEM_PROMPT = `Tu es un tuteur IA bienveillant et pédagogue pour étudiants.

Ton rôle :
- Expliquer les concepts de manière simple et claire
- Donner des exemples concrets
- Encourager la réflexion plutôt que donner directement la réponse
- Adapter ton niveau au contexte de l'étudiant
- Être patient et encourageant

Règles :
- Ne donne JAMAIS directement la réponse complète à un devoir
- Guide l'étudiant avec des questions et des indices
- Si on te demande de faire un devoir, refuse poliment et propose plutôt d'expliquer comment le faire
- Reste bienveillant même si la question est simple
- Utilise des émojis pour rendre les explications plus engageantes`;

const SUGGESTIONS = [
    "Explique-moi la photosynthèse 🌱",
    "Comment calculer une dérivée ? 📐",
    "Qu'est-ce qu'une métaphore ? ✍️",
    "Comment mémoriser efficacement ? 🧠",
    "Explique-moi les lois de Newton ⚛️",
    "C'est quoi la différence entre ADN et ARN ? 🧬"
];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initLayout('tutor');

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../auth/login.html';
            return;
        }

        currentUserId = user.id;
        await loadUserData();
        await loadChatHistory();
        setupEventListeners();
        displaySuggestions();
    });
});

async function loadUserData() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
            currentUserData = userDoc.data();
        }
    } catch (e) {
        console.error('Error loading user data:', e);
    }
}

function setupEventListeners() {
    ui.sendBtn.onclick = sendMessage;
    ui.clearBtn.onclick = clearChat;

    ui.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    ui.messageInput.addEventListener('input', () => {
        ui.sendBtn.disabled = !ui.messageInput.value.trim();
    });

    // ✅ MEMORY LEAK FIX: Cleanup realtime subscriptions before page unload
    window.addEventListener('beforeunload', () => {
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
        }
    });
}

function displaySuggestions() {
    ui.suggestions.innerHTML = SUGGESTIONS.map(suggestion => `
        <button class="suggestion-btn px-4 py-2 bg-gray-800/50 hover:bg-gray-700 rounded-xl text-sm text-gray-300 border border-gray-700 transition-colors">
            ${sanitizeText(suggestion)}
        </button>
    `).join('');

    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.onclick = () => {
            ui.messageInput.value = btn.textContent.trim();
            ui.sendBtn.disabled = false;
            ui.messageInput.focus();
        };
    });
}

async function loadChatHistory() {
    if (messagesUnsubscribe) messagesUnsubscribe();

    const messagesRef = collection(db, 'users', currentUserId, 'tutor_messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.chatContainer.innerHTML = '';

        if (snapshot.empty) {
            showWelcomeMessage();
            return;
        }

        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        // Reverse pour afficher du plus ancien au plus récent
        messages.reverse().forEach(msg => {
            displayMessage(msg.role, msg.content, msg.createdAt);
        });

        scrollToBottom();
    });
}

function showWelcomeMessage() {
    ui.chatContainer.innerHTML = `
        <div class="text-center py-10">
            <div class="text-6xl mb-4">🤖</div>
            <h3 class="text-xl font-bold text-white mb-2">Bonjour ${sanitizeText(currentUserData?.firstName || 'étudiant')} !</h3>
            <p class="text-gray-400 mb-6">Je suis ton tuteur IA. Pose-moi des questions sur tes cours !</p>
        </div>
    `;
}

function displayMessage(role, content, timestamp) {
    const isUser = role === 'user';
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`;

    const time = timestamp?.toDate ? new Date(timestamp.toDate()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

    messageDiv.innerHTML = `
        <div class="${isUser ? 'bg-indigo-600' : 'bg-gray-800'} rounded-2xl px-4 py-3 max-w-[80%]">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs ${isUser ? 'text-indigo-200' : 'text-gray-500'} font-semibold">
                    ${isUser ? 'Vous' : '🤖 IA Tuteur'}
                </span>
                ${time ? `<span class="text-xs ${isUser ? 'text-indigo-300' : 'text-gray-600'}">${time}</span>` : ''}
            </div>
            <div class="text-sm ${isUser ? 'text-white' : 'text-gray-200'} whitespace-pre-wrap">${isUser ? sanitizeText(content) : sanitizeHTML(content)}</div>
        </div>
    `;

    ui.chatContainer.appendChild(messageDiv);
}

async function sendMessage() {
    const message = ui.messageInput.value.trim();
    if (!message || isGenerating) return;

    // Sauvegarder message utilisateur
    try {
        await addDoc(collection(db, 'users', currentUserId, 'tutor_messages'), {
            role: 'user',
            content: message,
            createdAt: serverTimestamp()
        });

        ui.messageInput.value = '';
        ui.sendBtn.disabled = true;
        ui.suggestions.classList.add('hidden');

        // Afficher typing indicator
        showTypingIndicator();

        // Appeler l'API Gemini via Cloud Function
        const response = await generateTutorResponse(message);

        // Sauvegarder réponse IA
        await addDoc(collection(db, 'users', currentUserId, 'tutor_messages'), {
            role: 'assistant',
            content: response,
            createdAt: serverTimestamp()
        });

        hideTypingIndicator();

    } catch (e) {
        console.error('Error sending message:', e);
        showMessage('Erreur lors de l\'envoi du message', 'error');
        hideTypingIndicator();
    }
}

function showTypingIndicator() {
    isGenerating = true;
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'flex justify-start mb-4';
    typingDiv.innerHTML = `
        <div class="bg-gray-800 rounded-2xl px-4 py-3">
            <div class="flex items-center gap-2">
                <div class="flex gap-1">
                    <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
                <span class="text-xs text-gray-500">Le tuteur réfléchit...</span>
            </div>
        </div>
    `;
    ui.chatContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    isGenerating = false;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

async function generateTutorResponse(userMessage) {
    try {
        // Récupérer historique récent pour contexte
        const messagesRef = collection(db, 'users', currentUserId, 'tutor_messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(10));
        const snapshot = await getDocs(q);

        const history = [];
        snapshot.forEach(doc => {
            const msg = doc.data();
            history.unshift({
                role: msg.role,
                content: msg.content
            });
        });

        // Appeler Cloud Function
        const generateContent = httpsCallable(functions, 'generateContent');
        const result = await generateContent({
            prompt: `${SYSTEM_PROMPT}\n\nHistorique de conversation:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nÉtudiant: ${userMessage}\n\nTuteur IA:`,
            maxTokens: 1000
        });

        return result.data.text || "Désolé, je n'ai pas pu générer de réponse. Réessaie !";

    } catch (e) {
        console.error('Error generating response:', e);
        return "Désolé, une erreur s'est produite. Peux-tu reformuler ta question ?";
    }
}

async function clearChat() {
    if (!confirm('Effacer tout l\'historique de conversation ?')) return;

    try {
        const messagesRef = collection(db, 'users', currentUserId, 'tutor_messages');
        const snapshot = await getDocs(messagesRef);

        const deletePromises = [];
        snapshot.forEach(doc => {
            deletePromises.push(deleteDoc(doc.ref));
        });

        await Promise.all(deletePromises);

        showMessage('Conversation effacée', 'success');
        ui.suggestions.classList.remove('hidden');

    } catch (e) {
        console.error('Error clearing chat:', e);
        showMessage('Erreur lors de l\'effacement', 'error');
    }
}

function scrollToBottom() {
    setTimeout(() => {
        ui.chatContainer.scrollTop = ui.chatContainer.scrollHeight;
    }, 100);
}
