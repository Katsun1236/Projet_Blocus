import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, orderBy, getDocs, limit, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- STATE ---
let currentUserId = null;
let currentUserData = null;
let currentPostId = null; // Pour la vue détail
let postsUnsubscribe = null;
let groupsUnsubscribe = null;

// --- DOM ELEMENTS ---
const ui = {
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    postsContainer: document.getElementById('posts-container'),
    contributorsList: document.getElementById('contributors-list'),
    groupsList: document.getElementById('groups-list'),
    onlineCount: document.getElementById('online-users-count'),
    btnNewPost: document.getElementById('btn-new-post'),
    filters: document.getElementById('post-filters'),
    // Modale New Post
    newPostModal: document.getElementById('new-post-modal'),
    closePostModal: document.getElementById('close-post-modal'),
    cancelPost: document.getElementById('cancel-post'),
    submitPost: document.getElementById('submit-post'),
    postTitle: document.getElementById('post-title'),
    postContent: document.getElementById('post-content'),
    postTag: document.getElementById('post-tag'),
    // Modale Détail
    detailModal: document.getElementById('post-detail-modal'),
    closeDetailModal: document.getElementById('close-detail-modal'),
    detailContent: document.getElementById('detail-content'),
    commentInput: document.getElementById('comment-input'),
    submitComment: document.getElementById('submit-comment'),
    currentUserAvatarComment: document.getElementById('current-user-avatar-comment')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initLayout('community');

    if(ui.onlineCount) ui.onlineCount.textContent = Math.floor(Math.random() * (200 - 80) + 80);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            await loadUserProfile();
            subscribeToPosts(); // Real-time listener
            loadContributors(); // Mock data pour l'instant (calcul complexe)
            subscribeToGroups(); // Real-time groups
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
            currentUserData = userDoc.data();
            if(ui.userName) ui.userName.textContent = currentUserData.firstName || "Étudiant";
            const avatarUrl = currentUserData.photoURL || `https://ui-avatars.com/api/?name=${currentUserData.firstName || 'User'}&background=random`;
            if(ui.userAvatar) ui.userAvatar.src = avatarUrl;
            if(ui.currentUserAvatarComment) ui.currentUserAvatarComment.src = avatarUrl;
        } else {
            currentUserData = { firstName: "Étudiant", photoURL: null };
        }
    } catch(e) { 
        console.error("Erreur profil:", e); 
        currentUserData = { firstName: "Étudiant", photoURL: null };
    }
}

function subscribeToPosts(filterType = 'all') {
    if (postsUnsubscribe) postsUnsubscribe();

    ui.postsContainer.innerHTML = `<div class="text-center py-10 opacity-50"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement en direct...</p></div>`;

    let q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'), limit(20));
    
    if (filterType !== 'all') {
        q = query(collection(db, 'community_posts'), where('type', '==', filterType), orderBy('createdAt', 'desc'), limit(20));
    }

    postsUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.postsContainer.innerHTML = '';
        if (snapshot.empty) {
            ui.postsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">Aucune discussion pour le moment. Lance-toi !</div>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const post = { id: docSnap.id, ...docSnap.data() };
            renderPostCard(post);
        });
    }, (error) => {
        console.error("Erreur Posts (Firestore):", error);
        if (error.code === 'permission-denied') {
             ui.postsContainer.innerHTML = `
                <div class="text-center text-red-400 p-6 border border-red-900 rounded-xl bg-red-900/20">
                    <p class="font-bold mb-2"><i class="fas fa-lock"></i> Accès Refusé</p>
                    <p class="text-sm">Vérifiez les règles de sécurité Firestore.</p>
                </div>`;
        } else {
            ui.postsContainer.innerHTML = `<div class="text-center text-red-400">Erreur de chargement (${error.code})</div>`;
        }
    });
}

function renderPostCard(post) {
    const isQuestion = post.type === 'question';
    const badgeColor = isQuestion ? 'blue' : (post.type === 'share' ? 'purple' : 'gray');
    const badgeLabel = isQuestion ? 'Question' : (post.type === 'share' ? 'Partage' : 'Discussion');
    
    const card = document.createElement('div');
    card.className = 'content-glass post-card p-6 rounded-2xl cursor-pointer transition-all group animate-fade-in';
    
    const userLiked = post.likesBy && post.likesBy.includes(currentUserId);
    const likeClass = userLiked ? 'text-red-500' : 'hover:text-red-400';
    const likeIcon = userLiked ? 'fas fa-heart' : 'far fa-heart';
    const likesCount = post.likesBy ? post.likesBy.length : 0;
    const commentsCount = post.commentsCount || 0;
    const timeAgo = post.createdAt ? timeSince(post.createdAt.toDate()) : 'À l\'instant';

    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
                <img src="${post.authorAvatar || 'https://ui-avatars.com/api/?background=random'}" class="w-10 h-10 rounded-full border border-gray-600">
                <div>
                    <h4 class="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">${post.authorName || 'Anonyme'}</h4>
                    <p class="text-xs text-gray-500">${timeAgo} • ${post.tag || 'Général'}</p>
                </div>
            </div>
            <span class="px-2 py-1 bg-${badgeColor}-500/10 text-${badgeColor}-400 text-xs rounded border border-${badgeColor}-500/20">${badgeLabel}</span>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">${post.title}</h3>
        <p class="text-gray-400 text-sm mb-4 line-clamp-3 whitespace-pre-line">${post.content}</p>
        
        <div class="flex items-center gap-6 text-xs text-gray-500 border-t border-gray-800/50 pt-4">
            <button class="flex items-center gap-2 hover:text-emerald-400 transition-colors action-btn comment-trigger">
                <i class="far fa-comment-alt"></i> ${commentsCount} rép.
            </button>
            <button class="flex items-center gap-2 ${likeClass} transition-colors action-btn like-btn">
                <i class="${likeIcon}"></i> <span class="like-count">${likesCount}</span>
            </button>
            <button class="ml-auto hover:text-white action-btn share-btn transition-colors hover:text-indigo-400">
                <i class="fas fa-share"></i> Republier
            </button>
        </div>
    `;

    // Interaction Like
    const likeBtn = card.querySelector('.like-btn');
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(post.id, userLiked);
    });

    // Interaction Share
    const shareBtn = card.querySelector('.share-btn');
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sharePost(post);
    });

    // Interaction Detail/Comment
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.action-btn')) {
            openDetailModal(post);
        }
    });

    ui.postsContainer.appendChild(card);
}

// --- ACTIONS POST ---

async function createPost() {
    const title = ui.postTitle.value.trim();
    const content = ui.postContent.value.trim();
    const tag = ui.postTag.value.trim();
    const type = document.querySelector('input[name="post-type"]:checked').value;

    if (!title || !content) return showMessage("Titre et contenu requis", "error");

    ui.submitPost.disabled = true;
    ui.submitPost.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Publication...`;

    try {
        await addDoc(collection(db, 'community_posts'), {
            title,
            content,
            tag: tag || 'Général',
            type,
            authorId: currentUserId,
            authorName: currentUserData.firstName || 'Utilisateur',
            authorAvatar: currentUserData.photoURL || `https://ui-avatars.com/api/?name=${currentUserData.firstName}&background=random`,
            createdAt: serverTimestamp(),
            likesBy: [],
            commentsCount: 0
        });

        window.togglePostModal(false);
        // Reset form
        ui.postTitle.value = "";
        ui.postContent.value = "";
        ui.postTag.value = "";
        showMessage("Discussion publiée !", "success");
    } catch (e) {
        console.error(e);
        showMessage("Erreur lors de la publication", "error");
    } finally {
        ui.submitPost.disabled = false;
        ui.submitPost.innerHTML = `<i class="fas fa-paper-plane"></i> Publier`;
    }
}

async function toggleLike(postId, alreadyLiked) {
    const postRef = doc(db, 'community_posts', postId);
    try {
        if (alreadyLiked) {
            await updateDoc(postRef, { likesBy: arrayRemove(currentUserId) });
        } else {
            await updateDoc(postRef, { likesBy: arrayUnion(currentUserId) });
        }
    } catch(e) {
        console.error("Erreur like:", e);
    }
}

function sharePost(post) {
    // On ouvre la modale de création pré-remplie
    window.togglePostModal(true);
    
    ui.postTitle.value = `RE: ${post.title}`;
    ui.postContent.value = `\n\n--- Publication originale de ${post.authorName} ---\n${post.content}`;
    ui.postTag.value = post.tag;
    
    // On focus au début du contenu pour que l'user écrive son message
    ui.postContent.setSelectionRange(0, 0);
    ui.postContent.focus();
    
    showMessage("Vous republiez ce post. Ajoutez votre commentaire au début !", "info");
}

// --- DETAIL & COMMENTS ---

async function openDetailModal(post) {
    currentPostId = post.id;
    ui.detailModal.classList.remove('hidden');
    
    const timeAgo = post.createdAt ? timeSince(post.createdAt.toDate()) : 'À l\'instant';
    ui.detailContent.innerHTML = `
        <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
                <img src="${post.authorAvatar || 'https://ui-avatars.com/api/?background=random'}" class="w-12 h-12 rounded-full border border-gray-600">
                <div>
                    <h4 class="font-bold text-white text-lg">${post.authorName}</h4>
                    <p class="text-xs text-gray-500">${timeAgo} • ${post.tag}</p>
                </div>
            </div>
            <h2 class="text-2xl font-bold text-white mb-4">${post.title}</h2>
            <p class="text-gray-300 leading-relaxed whitespace-pre-line">${post.content}</p>
        </div>
        
        <h3 class="text-sm font-bold text-gray-500 uppercase mb-4 border-b border-gray-800 pb-2">Commentaires</h3>
        <div id="comments-list" class="space-y-4">
            <div class="text-center py-4"><i class="fas fa-circle-notch fa-spin text-gray-600"></i></div>
        </div>
    `;

    subscribeToComments(post.id);
}

function subscribeToComments(postId) {
    const commentsList = document.getElementById('comments-list');
    const q = query(collection(db, 'community_posts', postId, 'comments'), orderBy('createdAt', 'asc'));

    onSnapshot(q, (snapshot) => {
        commentsList.innerHTML = '';
        if (snapshot.empty) {
            commentsList.innerHTML = `<p class="text-center text-gray-600 italic text-sm">Aucune réponse. Sois le premier !</p>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const c = docSnap.data();
            const div = document.createElement('div');
            div.className = 'flex gap-3 bg-gray-800/30 p-3 rounded-xl border border-gray-800 animate-fade-in';
            div.innerHTML = `
                <img src="${c.authorAvatar}" class="w-8 h-8 rounded-full flex-shrink-0">
                <div>
                    <div class="flex items-baseline gap-2">
                        <span class="text-sm font-bold text-white">${c.authorName}</span>
                        <span class="text-[10px] text-gray-500">${c.createdAt ? timeSince(c.createdAt.toDate()) : ''}</span>
                    </div>
                    <p class="text-sm text-gray-300 mt-1 whitespace-pre-line">${c.content}</p>
                </div>
            `;
            commentsList.appendChild(div);
        });
    });
}

async function submitComment() {
    const content = ui.commentInput.value.trim();
    if (!content || !currentPostId) return;

    try {
        await addDoc(collection(db, 'community_posts', currentPostId, 'comments'), {
            content,
            authorId: currentUserId,
            authorName: currentUserData.firstName || 'User',
            authorAvatar: currentUserData.photoURL || `https://ui-avatars.com/api/?name=${currentUserData.firstName}&background=random`,
            createdAt: serverTimestamp()
        });

        const postRef = doc(db, 'community_posts', currentPostId);
        const p = await getDoc(postRef);
        if(p.exists()) {
            await updateDoc(postRef, { commentsCount: (p.data().commentsCount || 0) + 1 });
        }

        ui.commentInput.value = '';
    } catch(e) {
        console.error(e);
        showMessage("Erreur envoi commentaire", "error");
    }
}

// --- GROUPS LOGIC (NEW) ---

function subscribeToGroups() {
    if (groupsUnsubscribe) groupsUnsubscribe();

    const q = query(collection(db, 'groups'), orderBy('memberCount', 'desc'), limit(5));

    groupsUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.groupsList.innerHTML = '';
        if (snapshot.empty) {
            // Créer des groupes par défaut si vide (juste pour la démo, en vrai admin only)
            createDefaultGroups(); 
            ui.groupsList.innerHTML = `<p class="text-xs text-gray-500 text-center">Initialisation des groupes...</p>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const group = { id: docSnap.id, ...docSnap.data() };
            const isMember = group.members && group.members.includes(currentUserId);
            
            const div = document.createElement('div');
            div.className = 'flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group-item animate-fade-in';
            div.innerHTML = `
                <div class="w-10 h-10 rounded-lg bg-${group.color || 'indigo'}-500/20 text-${group.color || 'indigo'}-400 flex items-center justify-center text-lg">
                    <i class="fas ${group.icon || 'fa-users'}"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-white">${group.name}</p>
                    <p class="text-xs text-gray-500">${group.memberCount || 0} membres</p>
                </div>
                <button class="ml-auto text-xs px-2 py-1 rounded transition-colors ${isMember ? 'bg-gray-700 text-gray-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'} join-group-btn" data-id="${group.id}">
                    ${isMember ? 'Rejoint' : 'Rejoindre'}
                </button>
            `;
            
            div.querySelector('.join-group-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleJoinGroup(group.id, isMember);
            });

            ui.groupsList.appendChild(div);
        });
    });
}

async function createDefaultGroups() {
    // Cette fonction ne devrait s'exécuter qu'une fois si la collection est vide
    const defaultGroups = [
        { name: 'Droit L1 - Paris', icon: 'fa-balance-scale', color: 'blue', memberCount: 0, members: [] },
        { name: 'Dev Web & Code', icon: 'fa-code', color: 'purple', memberCount: 0, members: [] },
        { name: 'Médecine PACES', icon: 'fa-user-md', color: 'red', memberCount: 0, members: [] }
    ];

    for (const g of defaultGroups) {
        await addDoc(collection(db, 'groups'), g);
    }
}

async function toggleJoinGroup(groupId, isMember) {
    const groupRef = doc(db, 'groups', groupId);
    try {
        if (isMember) {
            await updateDoc(groupRef, { 
                members: arrayRemove(currentUserId)
                // Note: Firestore n'a pas d'incrément atomique simple ici sans transaction, 
                // pour simplifier on ne met pas à jour le compteur manuellement ici, 
                // mais idéalement il faudrait utiliser increment(-1)
            });
            // Update manuel du compteur (approximatif pour démo)
            const g = await getDoc(groupRef);
            await updateDoc(groupRef, { memberCount: Math.max(0, (g.data().memberCount || 1) - 1) });
            showMessage("Groupe quitté", "info");
        } else {
            await updateDoc(groupRef, { 
                members: arrayUnion(currentUserId)
            });
            const g = await getDoc(groupRef);
            await updateDoc(groupRef, { memberCount: (g.data().memberCount || 0) + 1 });
            showMessage("Groupe rejoint !", "success");
        }
    } catch(e) {
        console.error("Erreur groupe:", e);
        if(e.code === 'permission-denied') showMessage("Erreur de permission (Règles Firestore)", "error");
    }
}

// --- HELPERS ---

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " an(s)";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " mois";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "j";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min";
    return "À l'instant";
}

function loadContributors() {
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

// --- EVENT LISTENERS ---

function setupEventListeners() {
    const togglePostModal = (show) => ui.newPostModal.classList.toggle('hidden', !show);
    if(ui.btnNewPost) ui.btnNewPost.onclick = () => {
        // Reset form pour nouveau post
        ui.postTitle.value = "";
        ui.postContent.value = "";
        ui.postTag.value = "";
        togglePostModal(true);
    };
    if(ui.closePostModal) ui.closePostModal.onclick = () => togglePostModal(false);
    if(ui.cancelPost) ui.cancelPost.onclick = () => togglePostModal(false);
    
    if(ui.submitPost) ui.submitPost.onclick = createPost;

    if(ui.closeDetailModal) ui.closeDetailModal.onclick = () => ui.detailModal.classList.add('hidden');
    
    if(ui.submitComment) ui.submitComment.onclick = submitComment;
    if(ui.commentInput) ui.commentInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') submitComment();
    });

    if(ui.filters) {
        ui.filters.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') {
                ui.filters.querySelectorAll('button').forEach(b => {
                    b.classList.remove('bg-gray-700', 'text-white');
                    b.classList.add('text-gray-400');
                });
                e.target.classList.add('bg-gray-700', 'text-white');
                e.target.classList.remove('text-gray-400');
                
                subscribeToPosts(e.target.dataset.filter);
            }
        });
    }

    window.togglePostModal = togglePostModal;
}