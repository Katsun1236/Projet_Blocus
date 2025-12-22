import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, orderBy, getDocs, limit, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, where, increment } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// --- STATE ---
let currentUserId = null;
let currentUserData = null;
let currentPostId = null; 
let currentGroupId = null; // ID du groupe actif
let currentGroupData = null; 
let postsUnsubscribe = null;
let groupsUnsubscribe = null;
let groupChatUnsubscribe = null;
let groupFilesUnsubscribe = null;
let allGroups = []; // Cache pour la recherche rapide

// Storage Init
const storage = getStorage();

// --- DOM ELEMENTS ---
const ui = {
    // ... elements de base ...
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    postsContainer: document.getElementById('posts-container'),
    contributorsList: document.getElementById('contributors-list'),
    groupsList: document.getElementById('groups-list'),
    onlineCount: document.getElementById('online-users-count'),
    btnNewPost: document.getElementById('btn-new-post'),
    filters: document.getElementById('post-filters'),
    // Recherche & Filtres Groupes
    groupSearchInput: document.getElementById('group-search-input'),
    groupFilters: document.getElementById('group-filters'),
    // Modale New Post
    newPostModal: document.getElementById('new-post-modal'),
    closePostModal: document.getElementById('close-post-modal'),
    cancelPost: document.getElementById('cancel-post'),
    submitPost: document.getElementById('submit-post'),
    postTitle: document.getElementById('post-title'),
    postContent: document.getElementById('post-content'),
    postTag: document.getElementById('post-tag'),
    // Modale Détail Post
    detailModal: document.getElementById('post-detail-modal'),
    closeDetailModal: document.getElementById('close-detail-modal'),
    detailContent: document.getElementById('detail-content'),
    commentInput: document.getElementById('comment-input'),
    submitComment: document.getElementById('submit-comment'),
    currentUserAvatarComment: document.getElementById('current-user-avatar-comment'),
    // Modale Groupe
    groupModal: document.getElementById('group-space-modal'),
    closeGroupModal: document.getElementById('close-group-modal'),
    groupTitle: document.getElementById('group-title-large'),
    groupIcon: document.getElementById('group-icon-large'),
    groupMemberCount: document.getElementById('group-member-count'),
    groupMembersList: document.getElementById('group-members-list'),
    groupMessagesContainer: document.getElementById('group-messages-container'),
    groupChatInput: document.getElementById('group-chat-input'),
    sendGroupMessageBtn: document.getElementById('send-group-message'),
    // Uploads Groupe
    groupFilesList: document.getElementById('group-files-list'),
    btnAddFile: document.getElementById('btn-add-file'),
    groupFileUpload: document.getElementById('group-file-upload'),
    changeGroupIconBtn: document.getElementById('change-group-icon-btn'),
    groupIconUpload: document.getElementById('group-icon-upload'),
    btnUploadChat: document.getElementById('btn-upload-chat'),
    // Modale Création Groupe
    createGroupModal: document.getElementById('create-group-modal'),
    closeCreateGroupModal: document.getElementById('close-create-group-modal'),
    btnCreateGroupHero: document.getElementById('btn-create-group-hero'),
    btnCreateGroupSidebar: document.getElementById('btn-create-group-sidebar'),
    newGroupName: document.getElementById('new-group-name'),
    newGroupDesc: document.getElementById('new-group-desc'),
    submitCreateGroup: document.getElementById('submit-create-group'),
    cancelCreateGroup: document.getElementById('cancel-create-group')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initLayout('community');

    if(ui.onlineCount) ui.onlineCount.textContent = Math.floor(Math.random() * (200 - 80) + 80);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            await loadUserProfile();
            subscribeToPosts(); 
            loadContributors(); 
            subscribeToGroups(); 
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

// --- LEADERBOARD DYNAMIQUE ---
async function loadContributors() {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(5));
    
    // Note: Si vous n'avez pas encore d'index sur 'points', ça peut échouer ou être vide.
    // Assurez-vous d'initialiser le champ 'points: 0' à la création des users.
    
    try {
        const snapshot = await getDocs(q);
        
        ui.contributorsList.innerHTML = '';
        if (snapshot.empty) {
            ui.contributorsList.innerHTML = `<div class="text-center py-4 text-xs text-gray-500">Classement en cours...</div>`;
            return;
        }

        let rank = 1;
        snapshot.forEach(docSnap => {
            const user = docSnap.data();
            // Ignorer les users sans points ou sans nom
            if(!user.firstName) return; 

            const div = document.createElement('div');
            div.className = 'flex items-center gap-3 animate-fade-in mb-3 last:mb-0';
            div.innerHTML = `
                <span class="text-gray-500 text-xs font-bold w-4">${rank}</span>
                <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${user.firstName}&background=random`}" class="w-8 h-8 rounded-full border border-gray-700">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-white truncate">${user.firstName}</p>
                    <p class="text-xs text-emerald-400 font-mono">${user.points || 0} pts</p>
                </div>
            `;
            ui.contributorsList.appendChild(div);
            rank++;
        });
    } catch (e) {
        console.error("Erreur Leaderboard:", e);
        ui.contributorsList.innerHTML = `<div class="text-center py-4 text-xs text-red-400">Erreur chargement.</div>`;
    }
}

// Fonction pour ajouter des points (à appeler lors d'actions)
async function addPointsToUser(userId, points) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            points: increment(points)
        });
    } catch (e) { console.error("Erreur points:", e); }
}

// ... (subscribeToPosts, renderPostCard, createPost, toggleLike, sharePost, openDetailModal... -> RESTENT IDENTIQUES) ...
function subscribeToPosts(filterType = 'all') {
    if (postsUnsubscribe) postsUnsubscribe();
    ui.postsContainer.innerHTML = `<div class="text-center py-10 opacity-50"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement...</p></div>`;
    let q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'), limit(20));
    if (filterType !== 'all') q = query(collection(db, 'community_posts'), where('type', '==', filterType), orderBy('createdAt', 'desc'), limit(20));

    postsUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.postsContainer.innerHTML = '';
        if (snapshot.empty) { ui.postsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">Aucune discussion.</div>`; return; }
        snapshot.forEach(docSnap => renderPostCard({ id: docSnap.id, ...docSnap.data() }));
    }, (error) => console.error("Erreur Posts:", error));
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
            <button class="flex items-center gap-2 hover:text-emerald-400 transition-colors action-btn"><i class="far fa-comment-alt"></i> ${post.commentsCount || 0} rép.</button>
            <button class="flex items-center gap-2 ${likeClass} transition-colors action-btn like-btn"><i class="${likeIcon}"></i> ${post.likesBy ? post.likesBy.length : 0}</button>
            <button class="ml-auto hover:text-white action-btn share-btn hover:text-indigo-400"><i class="fas fa-share"></i> Republier</button>
        </div>
    `;
    card.querySelector('.like-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleLike(post.id, userLiked); });
    card.querySelector('.share-btn').addEventListener('click', (e) => { e.stopPropagation(); sharePost(post); });
    card.addEventListener('click', (e) => { if (!e.target.closest('.action-btn')) openDetailModal(post); });
    ui.postsContainer.appendChild(card);
}

async function createPost() {
    const title = ui.postTitle.value.trim();
    const content = ui.postContent.value.trim();
    const tag = ui.postTag.value.trim();
    const type = document.querySelector('input[name="post-type"]:checked').value;
    if (!title || !content) return showMessage("Titre et contenu requis", "error");
    ui.submitPost.disabled = true; ui.submitPost.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    try {
        await addDoc(collection(db, 'community_posts'), {
            title, content, tag: tag || 'Général', type, authorId: currentUserId,
            authorName: currentUserData.firstName || 'Utilisateur', authorAvatar: currentUserData.photoURL,
            createdAt: serverTimestamp(), likesBy: [], commentsCount: 0
        });
        await addPointsToUser(currentUserId, 10); // +10 pts pour un post
        window.togglePostModal(false); ui.postTitle.value = ""; ui.postContent.value = "";
        showMessage("Publié ! (+10 pts)", "success");
        loadContributors(); // Refresh leaderboard
    } catch (e) { console.error(e); } finally { ui.submitPost.disabled = false; ui.submitPost.innerHTML = `<i class="fas fa-paper-plane"></i> Publier`; }
}

async function toggleLike(postId, alreadyLiked) {
    try {
        const ref = doc(db, 'community_posts', postId);
        if(alreadyLiked) await updateDoc(ref, { likesBy: arrayRemove(currentUserId) });
        else {
            await updateDoc(ref, { likesBy: arrayUnion(currentUserId) });
            // +2 pts pour un like (optionnel, attention au spam)
        }
    } catch(e) {}
}
function sharePost(post) {
    window.togglePostModal(true); ui.postTitle.value = `RE: ${post.title}`; ui.postContent.value = `\n\n--- De ${post.authorName} ---\n${post.content}`;
    ui.postContent.focus();
}
async function openDetailModal(post) {
    currentPostId = post.id; ui.detailModal.classList.remove('hidden');
    ui.detailContent.innerHTML = `<h2 class="text-2xl font-bold text-white mb-4">${post.title}</h2><p class="text-gray-300 whitespace-pre-line">${post.content}</p><div id="comments-list" class="mt-8 space-y-4"></div>`;
    subscribeToComments(post.id);
}
function subscribeToComments(postId) {
    const list = document.getElementById('comments-list');
    onSnapshot(query(collection(db, 'community_posts', postId, 'comments'), orderBy('createdAt', 'asc')), (snap) => {
        list.innerHTML = '';
        snap.forEach(d => {
            const c = d.data();
            list.innerHTML += `<div class="bg-gray-800/30 p-3 rounded-xl border border-gray-800"><span class="font-bold text-white text-sm">${c.authorName}</span><p class="text-sm text-gray-300 mt-1">${c.content}</p></div>`;
        });
    });
}
async function submitComment() {
    const content = ui.commentInput.value.trim(); if(!content) return;
    try {
        await addDoc(collection(db, 'community_posts', currentPostId, 'comments'), {
            content, authorId: currentUserId, authorName: currentUserData.firstName, createdAt: serverTimestamp()
        });
        await addPointsToUser(currentUserId, 5); // +5 pts commentaire
        ui.commentInput.value = '';
    } catch(e) {}
}

// --- GROUPS LOGIC AVEC RECHERCHE ---

async function createNewGroup() {
    const name = ui.newGroupName.value.trim();
    const desc = ui.newGroupDesc.value.trim();
    const color = document.querySelector('input[name="new-group-color"]:checked').value;

    if (!name) return showMessage("Le nom du groupe est requis", "error");

    ui.submitCreateGroup.disabled = true;
    ui.submitCreateGroup.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

    try {
        await addDoc(collection(db, 'groups'), {
            name: name,
            description: desc,
            color: color,
            icon: 'fa-users',
            memberCount: 1,
            members: [currentUserId],
            admins: [currentUserId],
            searchKeywords: generateKeywords(name), // Pour recherche future
            createdAt: serverTimestamp()
        });
        await addPointsToUser(currentUserId, 20); // +20 pts création groupe

        toggleCreateGroupModal(false);
        ui.newGroupName.value = ""; ui.newGroupDesc.value = "";
        showMessage("Groupe créé ! (+20 pts)", "success");
    } catch (e) {
        console.error("Erreur création groupe:", e);
        showMessage("Erreur lors de la création", "error");
    } finally {
        ui.submitCreateGroup.disabled = false;
        ui.submitCreateGroup.innerHTML = `<i class="fas fa-check"></i> Créer`;
    }
}

// Helper pour recherche simple (minuscule)
function generateKeywords(str) {
    return str.toLowerCase().split(' ');
}

function subscribeToGroups() {
    if (groupsUnsubscribe) groupsUnsubscribe();
    // On charge tous les groupes (avec une limite raisonnable) et on filtre en local
    // car Firestore ne gère pas le "contains" partiel nativement sans solution externe (Algolia...)
    const q = query(collection(db, 'groups'), orderBy('memberCount', 'desc'), limit(50));

    groupsUnsubscribe = onSnapshot(q, (snapshot) => {
        allGroups = [];
        snapshot.forEach(docSnap => {
            allGroups.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderGroupList(allGroups);
    });
}

function renderGroupList(groups) {
    ui.groupsList.innerHTML = '';
    if (groups.length === 0) {
        ui.groupsList.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Aucun groupe trouvé.</p>`; 
        return; 
    }

    groups.forEach(group => {
        const isMember = group.members && group.members.includes(currentUserId);
        
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group-item animate-fade-in';
        
        let iconHtml = `<i class="fas ${group.icon || 'fa-users'}"></i>`;
        let iconClass = `w-10 h-10 rounded-lg bg-${group.color || 'indigo'}-500/20 text-${group.color || 'indigo'}-400 flex items-center justify-center text-lg`;
        if (group.photoURL) {
            iconHtml = `<img src="${group.photoURL}" class="w-full h-full object-cover rounded-lg">`;
            iconClass = `w-10 h-10 rounded-lg bg-gray-800`;
        }

        div.innerHTML = `
            <div class="${iconClass}">
                ${iconHtml}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-white truncate">${group.name}</p>
                <p class="text-xs text-gray-500 truncate">${group.memberCount || 0} membres</p>
            </div>
            <button class="ml-auto text-xs px-2 py-1 rounded transition-colors ${isMember ? 'bg-gray-700 text-gray-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'} join-group-btn" data-id="${group.id}">
                ${isMember ? 'Ouvrir' : 'Rejoindre'}
            </button>
        `;
        
        const btn = div.querySelector('.join-group-btn');
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (isMember) {
                openGroupSpace(group);
            } else {
                await toggleJoinGroup(group.id, false);
                // On n'ouvre pas tout de suite, on attend que l'utilisateur soit membre
                openGroupSpace(group);
            }
        });

        div.addEventListener('click', () => { if(isMember) openGroupSpace(group); else btn.click(); });
        ui.groupsList.appendChild(div);
    });
}

// Fonction de filtrage local
function filterGroups() {
    const searchTerm = ui.groupSearchInput.value.toLowerCase();
    const filterType = document.querySelector('#group-filters button.bg-blue-900\\/50') ? 
                       document.querySelector('#group-filters button.bg-blue-900\\/50').dataset.filter : 'all';

    const filtered = allGroups.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchTerm) || (g.description && g.description.toLowerCase().includes(searchTerm));
        const matchesType = filterType === 'all' || (filterType === 'my' && g.members.includes(currentUserId));
        return matchesSearch && matchesType;
    });

    renderGroupList(filtered);
}

// ... (openGroupSpace, subscribeToGroupChat, sendGroupMessage, deleteGroupMessage, subscribeToGroupFiles, uploadGroupFile, uploadGroupIcon, toggleJoinGroup, timeSince, loadContributors... -> CODE EXISTANT) ...
// Pour la lisibilité, je ne répète pas tout le bloc 'Chat' et 'Files' qui reste identique à la version précédente sauf pour les appels à 'addPoints'

// OUVERTURE DU GROUPE
function openGroupSpace(group) {
    currentGroupId = group.id;
    currentGroupData = group; // Stocke pour vérification admin
    ui.groupModal.classList.remove('hidden');
    
    ui.groupTitle.textContent = group.name;
    ui.groupMemberCount.textContent = group.memberCount || 0;
    
    // Gérer l'affichage de l'icône dans la modale
    if (group.photoURL) {
         ui.groupIcon.innerHTML = `<img src="${group.photoURL}" class="w-full h-full object-cover rounded-2xl">`;
    } else {
         ui.groupIcon.innerHTML = `<i class="fas ${group.icon || 'fa-users'}"></i>`;
    }

    ui.groupMembersList.innerHTML = `
        <div class="flex items-center gap-2 text-sm text-gray-300">
            <img src="${currentUserData.photoURL || `https://ui-avatars.com/api/?name=${currentUserData.firstName}&background=random`}" class="w-6 h-6 rounded-full">
            <span>Toi</span>
        </div>
        <p class="text-xs text-gray-500 mt-2 italic">+ ${Math.max(0, (group.memberCount || 1) - 1)} autres membres</p>
    `;

    subscribeToGroupChat(group.id);
    subscribeToGroupFiles(group.id);
}

function subscribeToGroupChat(groupId) {
    if(groupChatUnsubscribe) groupChatUnsubscribe();
    ui.groupMessagesContainer.innerHTML = `<div class="text-center py-10 opacity-50"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement...</p></div>`;
    
    const q = query(collection(db, 'groups', groupId, 'messages'), orderBy('createdAt', 'asc'), limit(50));
    
    groupChatUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.groupMessagesContainer.innerHTML = '';
        if (snapshot.empty) {
            ui.groupMessagesContainer.innerHTML = `<div class="text-center text-gray-500 py-10"><p>Soyez le premier à écrire !</p></div>`;
            return;
        }

        const isAdmin = currentGroupData && currentGroupData.admins && currentGroupData.admins.includes(currentUserId);

        snapshot.forEach(docSnap => {
            const msg = { id: docSnap.id, ...docSnap.data() };
            const isMe = msg.authorId === currentUserId;
            
            // Bouton supprimer visible si c'est moi OU si je suis admin
            const canDelete = isMe || isAdmin;
            const deleteBtnHtml = canDelete ? 
                `<button class="text-gray-500 hover:text-red-500 ml-2 delete-msg-btn" data-id="${msg.id}"><i class="fas fa-trash-alt text-[10px]"></i></button>` : '';

            const msgDiv = document.createElement('div');
            msgDiv.className = `flex gap-3 mb-4 animate-fade-in ${isMe ? 'flex-row-reverse' : ''} group/msg`;
            msgDiv.innerHTML = `
                <img src="${msg.authorAvatar}" class="w-8 h-8 rounded-full flex-shrink-0 mt-1">
                <div class="max-w-[70%]">
                    <div class="${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'} p-3 rounded-2xl ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'} text-sm whitespace-pre-line group-hover/msg:opacity-90">
                        ${msg.content}
                    </div>
                    <div class="flex items-center ${isMe ? 'justify-end' : ''} mt-1 gap-2">
                        <p class="text-[10px] text-gray-600">${msg.createdAt ? timeSince(msg.createdAt.toDate()) : 'Envoi...'}</p>
                        ${deleteBtnHtml}
                    </div>
                </div>
            `;
            
            if(canDelete) {
                const delBtn = msgDiv.querySelector('.delete-msg-btn');
                delBtn.addEventListener('click', () => deleteGroupMessage(msg.id));
            }

            ui.groupMessagesContainer.appendChild(msgDiv);
        });
        ui.groupMessagesContainer.scrollTop = ui.groupMessagesContainer.scrollHeight;
    });
}

async function sendGroupMessage() {
    const content = ui.groupChatInput.value.trim();
    if(!content || !currentGroupId) return;
    try {
        await addDoc(collection(db, 'groups', currentGroupId, 'messages'), {
            content, authorId: currentUserId, authorName: currentUserData.firstName,
            authorAvatar: currentUserData.photoURL, createdAt: serverTimestamp()
        });
        ui.groupChatInput.value = '';
    } catch(e) { console.error(e); showMessage("Erreur envoi message", "error"); }
}

async function deleteGroupMessage(messageId) {
    if(!confirm("Supprimer ce message ?")) return;
    try {
        await deleteDoc(doc(db, 'groups', currentGroupId, 'messages', messageId));
    } catch(e) {
        console.error(e);
        showMessage("Impossible de supprimer", "error");
    }
}

function subscribeToGroupFiles(groupId) {
    if(groupFilesUnsubscribe) groupFilesUnsubscribe();
    
    const q = query(collection(db, 'groups', groupId, 'files'), orderBy('createdAt', 'desc'));
    
    groupFilesUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.groupFilesList.innerHTML = '';
        if (snapshot.empty) {
            ui.groupFilesList.innerHTML = `<div class="text-center py-4 text-xs italic text-gray-600">Aucun fichier partagé</div>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const f = docSnap.data();
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer group/file';
            div.innerHTML = `
                <i class="fas fa-file-alt text-gray-400"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-300 truncate">${f.name}</p>
                    <p class="text-[10px] text-gray-600">${f.size || '? KB'} • ${f.authorName}</p>
                </div>
                <a href="${f.url}" target="_blank" class="opacity-0 group-hover/file:opacity-100 text-indigo-400 hover:text-white transition-opacity">
                    <i class="fas fa-download"></i>
                </a>
            `;
            ui.groupFilesList.appendChild(div);
        });
    });
}

async function uploadGroupFile(file) {
    if (!currentGroupId) return;
    showMessage("Envoi du fichier...", "info");
    try {
        const storageRef = ref(storage, `groups/${currentGroupId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        await addDoc(collection(db, 'groups', currentGroupId, 'files'), {
            name: file.name,
            url: url,
            size: (file.size / 1024).toFixed(1) + ' KB',
            authorId: currentUserId,
            authorName: currentUserData.firstName,
            createdAt: serverTimestamp()
        });
        showMessage("Fichier partagé !", "success");
    } catch (e) {
        console.error(e);
        showMessage("Erreur upload fichier", "error");
    }
}

async function uploadGroupIcon(file) {
    if (!currentGroupId) return;
    showMessage("Mise à jour de l'icône...", "info");
    try {
        const storageRef = ref(storage, `group_icons/${currentGroupId}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        await updateDoc(doc(db, 'groups', currentGroupId), {
            photoURL: url
        });
        
        // Update local UI immediately
        ui.groupIcon.innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-2xl">`;
        showMessage("Icône mise à jour !", "success");
    } catch (e) {
        console.error(e);
        showMessage("Erreur upload icône", "error");
    }
}

async function toggleJoinGroup(groupId, isMember) {
    try {
        const ref = doc(db, 'groups', groupId);
        if (isMember) {
            await updateDoc(ref, { members: arrayRemove(currentUserId) });
            const g = await getDoc(ref);
            await updateDoc(ref, { memberCount: Math.max(0, (g.data().memberCount || 1) - 1) });
        } else {
            await updateDoc(ref, { members: arrayUnion(currentUserId) });
            const g = await getDoc(ref);
            await updateDoc(ref, { memberCount: (g.data().memberCount || 0) + 1 });
        }
    } catch(e) { console.error(e); }
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " an(s)";
    interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " mois";
    interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "j";
    interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " min";
    return "À l'instant";
}

function setupEventListeners() {
    const togglePostModal = (show) => ui.newPostModal.classList.toggle('hidden', !show);
    if(ui.btnNewPost) ui.btnNewPost.onclick = () => { ui.postTitle.value = ""; ui.postContent.value = ""; togglePostModal(true); };
    if(ui.closePostModal) ui.closePostModal.onclick = () => togglePostModal(false);
    if(ui.cancelPost) ui.cancelPost.onclick = () => togglePostModal(false);
    if(ui.submitPost) ui.submitPost.onclick = createPost;
    
    if(ui.closeDetailModal) ui.closeDetailModal.onclick = () => ui.detailModal.classList.add('hidden');
    if(ui.submitComment) ui.submitComment.onclick = submitComment;
    if(ui.commentInput) ui.commentInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') submitComment(); });

    // LISTENERS GROUPES
    if(ui.closeGroupModal) ui.closeGroupModal.onclick = () => ui.groupModal.classList.add('hidden');
    if(ui.sendGroupMessageBtn) ui.sendGroupMessageBtn.onclick = sendGroupMessage;
    if(ui.groupChatInput) ui.groupChatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendGroupMessage(); });
    
    // LISTENERS UPLOADS
    if(ui.btnAddFile) ui.btnAddFile.onclick = () => ui.groupFileUpload.click();
    if(ui.btnUploadChat) ui.btnUploadChat.onclick = () => ui.groupFileUpload.click(); // Raccourci chat aussi
    if(ui.groupFileUpload) ui.groupFileUpload.onchange = (e) => {
        if(e.target.files.length > 0) uploadGroupFile(e.target.files[0]);
    };
    
    if(ui.changeGroupIconBtn) ui.changeGroupIconBtn.onclick = () => ui.groupIconUpload.click();
    if(ui.groupIconUpload) ui.groupIconUpload.onchange = (e) => {
        if(e.target.files.length > 0) uploadGroupIcon(e.target.files[0]);
    };

    // NOUVEAUX LISTENERS CREATION GROUPE
    const toggleCreateGroupModal = (show) => ui.createGroupModal.classList.toggle('hidden', !show);
    if(ui.btnCreateGroupHero) ui.btnCreateGroupHero.onclick = () => toggleCreateGroupModal(true);
    if(ui.btnCreateGroupSidebar) ui.btnCreateGroupSidebar.onclick = () => toggleCreateGroupModal(true);
    if(ui.closeCreateGroupModal) ui.closeCreateGroupModal.onclick = () => toggleCreateGroupModal(false);
    if(ui.cancelCreateGroup) ui.cancelCreateGroup.onclick = () => toggleCreateGroupModal(false);
    if(ui.submitCreateGroup) ui.submitCreateGroup.onclick = createNewGroup;

    // FILTRES POSTS
    if(ui.filters) {
        ui.filters.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') {
                ui.filters.querySelectorAll('button').forEach(b => { b.classList.remove('bg-gray-700', 'text-white'); b.classList.add('text-gray-400'); });
                e.target.classList.add('bg-gray-700', 'text-white'); e.target.classList.remove('text-gray-400');
                subscribeToPosts(e.target.dataset.filter);
            }
        });
    }

    // FILTRES GROUPES (NOUVEAU)
    if(ui.groupSearchInput) {
        ui.groupSearchInput.addEventListener('input', filterGroups);
    }
    if(ui.groupFilters) {
        ui.groupFilters.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') {
                // Reset styles
                const allBtn = ui.groupFilters.querySelector('[data-filter="all"]');
                const myBtn = ui.groupFilters.querySelector('[data-filter="my"]');
                
                if(e.target.dataset.filter === 'all') {
                    allBtn.className = "flex-1 py-1 text-[10px] font-bold bg-blue-900/50 text-blue-200 border border-blue-800 rounded hover:bg-blue-800 transition-colors";
                    myBtn.className = "flex-1 py-1 text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700 rounded hover:bg-gray-700 transition-colors";
                } else {
                    myBtn.className = "flex-1 py-1 text-[10px] font-bold bg-blue-900/50 text-blue-200 border border-blue-800 rounded hover:bg-blue-800 transition-colors";
                    allBtn.className = "flex-1 py-1 text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700 rounded hover:bg-gray-700 transition-colors";
                }
                filterGroups();
            }
        });
    }

    window.togglePostModal = togglePostModal;
    window.toggleCreateGroupModal = toggleCreateGroupModal;
}