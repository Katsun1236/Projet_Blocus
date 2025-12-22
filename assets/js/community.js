import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, orderBy, getDocs, limit, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- STATE ---
let currentUserId = null;
let allPosts = []; // Cache local

// --- DOM ELEMENTS ---
const ui = {
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    postsContainer: document.getElementById('posts-container'),
    contributorsList: document.getElementById('contributors-list'),
    groupsList: document.getElementById('groups-list'),
    onlineCount: document.getElementById('online-users-count'),
    btnNewPost: document.getElementById('btn-new-post'),
    filters: document.getElementById('post-filters')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initLayout('community');

    // Fake Online Count (pour l'effet visuel)
    if(ui.onlineCount) ui.onlineCount.textContent = Math.floor(Math.random() * (200 - 80) + 80);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            await loadUserProfile();
            await loadPosts(); // Vrais posts + Mock data si vide
            loadContributors(); // Mock data pour l'instant
            loadGroups(); // Mock data pour l'instant
        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
});

// --- LOAD DATA ---

async function loadUserProfile() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if(ui.userName) ui.userName.textContent = data.firstName || "Étudiant";
            if(ui.userAvatar) ui.userAvatar.src = data.photoURL || 'https://ui-avatars.com/api/?background=random';
        }
    } catch(e) { console.error("Erreur profil:", e); }
}

async function loadPosts() {
    ui.postsContainer.innerHTML = `<div class="text-center py-10 opacity-50"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement...</p></div>`;

    try {
        // Essayer de charger depuis Firestore (collection 'posts' globale)
        // Note: Pour une vraie app, il faudrait créer cette collection et gérer les permissions
        // Ici, on va simuler un mix de données réelles (si elles existaient) et de données fictives pour la démo
        
        // Simulation de données (en attendant une vraie DB peuplée)
        const mockPosts = [
            {
                id: 'mock1',
                authorName: 'Sarah M.',
                authorAvatar: 'https://ui-avatars.com/api/?name=Sarah+M&background=random',
                timeAgo: 'Il y a 2h',
                tag: 'Droit Civil',
                type: 'question', // question, share
                title: "Besoin d'aide sur l'arrêt Blanco 🤯",
                content: "Salut la team ! Je galère un peu à comprendre la portée exacte de l'arrêt Blanco en droit administratif. Quelqu'un aurait une fiche synthèse ou un résumé clair ? Merci d'avance !",
                likes: 5,
                comments: 12,
                userLiked: false
            },
            {
                id: 'mock2',
                authorName: 'Thomas B.',
                authorAvatar: 'https://ui-avatars.com/api/?name=Thomas+B&background=random',
                timeAgo: 'Il y a 5h',
                tag: 'Économie',
                type: 'share',
                title: "Ma fiche complète sur la Microéconomie 📈",
                content: "Je viens de finir ma synthèse pour les partiels. Je vous la mets en PDF ici si ça peut aider quelqu'un. N'hésitez pas à me dire s'il y a des erreurs !",
                attachment: { name: 'Synthese_Micro_S1.pdf', size: '2.4 MB', type: 'pdf' },
                likes: 42,
                comments: 8,
                userLiked: true
            },
            {
                id: 'mock3',
                authorName: 'Julie L.',
                authorAvatar: 'https://ui-avatars.com/api/?name=Julie+L&background=random',
                timeAgo: 'Il y a 1j',
                tag: 'Méthodologie',
                type: 'share',
                title: "Mon template Notion pour gérer ses révisions",
                content: "J'ai créé un template Notion super clean pour organiser ses cours par semestre. Lien en commentaire !",
                likes: 156,
                comments: 24,
                userLiked: false
            }
        ];

        allPosts = mockPosts; // On stocke pour le filtrage
        renderPosts(allPosts);

    } catch (e) {
        console.error(e);
        ui.postsContainer.innerHTML = `<div class="text-center text-red-400">Erreur de chargement.</div>`;
    }
}

function renderPosts(posts) {
    ui.postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        ui.postsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">Aucun post trouvé.</div>`;
        return;
    }

    posts.forEach(post => {
        const isQuestion = post.type === 'question';
        const badgeColor = isQuestion ? 'blue' : 'purple';
        const badgeLabel = isQuestion ? 'Question' : 'Partage';
        
        const card = document.createElement('div');
        card.className = 'content-glass post-card p-6 rounded-2xl cursor-pointer transition-all group animate-fade-in';
        
        let attachmentHTML = '';
        if (post.attachment) {
            attachmentHTML = `
                <div class="bg-gray-800/50 p-3 rounded-lg flex items-center gap-3 mb-4 border border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                    <div class="w-8 h-8 bg-red-500/20 text-red-400 rounded flex items-center justify-center"><i class="fas fa-file-pdf"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-white truncate">${post.attachment.name}</p>
                        <p class="text-[10px] text-gray-500">${post.attachment.size}</p>
                    </div>
                    <button class="text-gray-400 hover:text-white"><i class="fas fa-download"></i></button>
                </div>
            `;
        }

        const likeClass = post.userLiked ? 'text-red-500' : 'hover:text-red-400';
        const likeIcon = post.userLiked ? 'fas fa-heart' : 'far fa-heart';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <img src="${post.authorAvatar}" class="w-10 h-10 rounded-full border border-gray-600">
                    <div>
                        <h4 class="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">${post.authorName}</h4>
                        <p class="text-xs text-gray-500">${post.timeAgo} • ${post.tag}</p>
                    </div>
                </div>
                <span class="px-2 py-1 bg-${badgeColor}-500/10 text-${badgeColor}-400 text-xs rounded border border-${badgeColor}-500/20">${badgeLabel}</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${post.title}</h3>
            <p class="text-gray-400 text-sm mb-4 line-clamp-3">${post.content}</p>
            
            ${attachmentHTML}

            <div class="flex items-center gap-6 text-xs text-gray-500 border-t border-gray-800/50 pt-4">
                <button class="flex items-center gap-2 hover:text-emerald-400 transition-colors action-btn"><i class="far fa-comment-alt"></i> ${post.comments} rép.</button>
                <button class="flex items-center gap-2 ${likeClass} transition-colors action-btn like-btn" data-id="${post.id}">
                    <i class="${likeIcon}"></i> <span class="like-count">${post.likes}</span>
                </button>
                <button class="ml-auto hover:text-white action-btn"><i class="fas fa-share"></i> Partager</button>
            </div>
        `;

        // Interaction Like (Fake pour l'instant)
        const likeBtn = card.querySelector('.like-btn');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(post, likeBtn);
        });

        ui.postsContainer.appendChild(card);
    });
}

function loadContributors() {
    // Mock Data
    const contributors = [
        { name: 'Léa D.', points: 1240, rank: 1 },
        { name: 'Karim S.', points: 980, rank: 2 },
        { name: 'Alex W.', points: 850, rank: 3 }
    ];

    ui.contributorsList.innerHTML = contributors.map(c => `
        <div class="flex items-center gap-3 animate-fade-in">
            <span class="text-gray-500 text-xs font-bold w-4">${c.rank}</span>
            <img src="https://ui-avatars.com/api/?name=${c.name}&background=random" class="w-8 h-8 rounded-full">
            <div class="flex-1">
                <p class="text-sm font-bold text-white">${c.name}</p>
                <p class="text-xs text-emerald-400">${c.points} pts</p>
            </div>
        </div>
    `).join('');
}

function loadGroups() {
    // Mock Data
    const groups = [
        { name: 'Droit L1 - Paris', members: 145, icon: 'fa-balance-scale', color: 'blue' },
        { name: 'Dev Web', members: 89, icon: 'fa-code', color: 'purple' },
        { name: 'Médecine PACES', members: 210, icon: 'fa-user-md', color: 'red' }
    ];

    ui.groupsList.innerHTML = groups.map(g => `
        <div class="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group-item animate-fade-in">
            <div class="w-10 h-10 rounded-lg bg-${g.color}-500/20 text-${g.color}-400 flex items-center justify-center text-lg">
                <i class="fas ${g.icon}"></i>
            </div>
            <div>
                <p class="text-sm font-bold text-white">${g.name}</p>
                <p class="text-xs text-gray-500">${g.members} membres</p>
            </div>
            <button class="ml-auto text-xs bg-${g.color}-600 hover:bg-${g.color}-500 text-white px-2 py-1 rounded join-btn">Rejoindre</button>
        </div>
    `).join('');
    
    // Listeners Join
    document.querySelectorAll('.join-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            btn.textContent = btn.textContent === 'Rejoindre' ? 'Rejoint' : 'Rejoindre';
            btn.classList.toggle('bg-gray-600');
            showMessage("Action effectuée !", "success");
        });
    });
}

// --- ACTIONS ---

function toggleLike(post, btn) {
    post.userLiked = !post.userLiked;
    post.likes += post.userLiked ? 1 : -1;
    
    const icon = btn.querySelector('i');
    const count = btn.querySelector('.like-count');
    
    if (post.userLiked) {
        btn.classList.add('text-red-500');
        btn.classList.remove('hover:text-red-400');
        icon.classList.remove('far');
        icon.classList.add('fas');
    } else {
        btn.classList.remove('text-red-500');
        btn.classList.add('hover:text-red-400');
        icon.classList.remove('fas');
        icon.classList.add('far');
    }
    
    count.textContent = post.likes;
    
    // Animation
    icon.classList.add('scale-125');
    setTimeout(() => icon.classList.remove('scale-125'), 200);
}

function setupEventListeners() {
    // New Post
    if(ui.btnNewPost) ui.btnNewPost.onclick = () => showMessage("Fonctionnalité 'Nouveau Post' bientôt disponible !", "info");

    // Filters
    if(ui.filters) {
        ui.filters.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') {
                // Style actif
                ui.filters.querySelectorAll('button').forEach(b => {
                    b.classList.remove('bg-gray-700', 'text-white');
                    b.classList.add('text-gray-400');
                });
                e.target.classList.add('bg-gray-700', 'text-white');
                e.target.classList.remove('text-gray-400');
                
                // Logique filtre
                const filter = e.target.dataset.filter;
                if (filter === 'all') {
                    renderPosts(allPosts);
                } else {
                    renderPosts(allPosts.filter(p => p.type === filter));
                }
            }
        });
    }
}