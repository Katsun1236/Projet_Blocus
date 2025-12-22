import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, orderBy, getDocs, limit, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// --- STATE ---
let currentUserId = null;
let currentUserData = null;
let currentPostId = null; 
let currentGroupId = null; // ID du groupe actif
let postsUnsubscribe = null;
let groupsUnsubscribe = null;
let groupChatUnsubscribe = null;
let groupFilesUnsubscribe = null;

// Storage Init
const storage = getStorage();

// --- DOM ELEMENTS ---
const ui = {
    // ... (éléments existants) ...
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
    btnUploadChat: document.getElementById('btn-upload-chat')
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

// ... (createPost, toggleLike, sharePost, openDetailModal, subscribeToComments, submitComment: Code inchangé ou similaire) ...
// Pour alléger la réponse, je me concentre sur les GROUPES et UPLOADS ci-dessous.

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
        window.togglePostModal(false); ui.postTitle.value = ""; ui.postContent.value = "";
        showMessage("Publié !", "success");
    } catch (e) { console.error(e); } finally { ui.submitPost.disabled = false; ui.submitPost.innerHTML = `<i class="fas fa-paper-plane"></i> Publier`; }
}

async function toggleLike(postId, alreadyLiked) {
    try {
        const ref = doc(db, 'community_posts', postId);
        if(alreadyLiked) await updateDoc(ref, { likesBy: arrayRemove(currentUserId) });
        else await updateDoc(ref, { likesBy: arrayUnion(currentUserId) });
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
        ui.commentInput.value = '';
    } catch(e) {}
}


// --- GROUPS LOGIC ---

function subscribeToGroups() {
    if (groupsUnsubscribe) groupsUnsubscribe();
    const q = query(collection(db, 'groups'), orderBy('memberCount', 'desc'), limit(10));

    groupsUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.groupsList.innerHTML = '';
        if (snapshot.empty) { createDefaultGroups(); return; }

        snapshot.forEach(docSnap => {
            const group = { id: docSnap.id, ...docSnap.data() };
            const isMember = group.members && group.members.includes(currentUserId);
            
            const div = document.createElement('div');
            div.className = 'flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group-item animate-fade-in';
            // Icon logic: Image URL or FontAwesome Icon
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
                <div>
                    <p class="text-sm font-bold text-white">${group.name}</p>
                    <p class="text-xs text-gray-500">${group.memberCount || 0} membres</p>
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
                    openGroupSpace(group);
                }
            });

            div.addEventListener('click', () => { if(isMember) openGroupSpace(group); else btn.click(); });
            ui.groupsList.appendChild(div);
        });
    });
}

// OUVERTURE DU GROUPE
function openGroupSpace(group) {
    currentGroupId = group.id;
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
    subscribeToGroupFiles(group.id); // NOUVEAU
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

        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const isMe = msg.authorId === currentUserId;
            const msgDiv = document.createElement('div');
            msgDiv.className = `flex gap-3 mb-4 animate-fade-in ${isMe ? 'flex-row-reverse' : ''}`;
            msgDiv.innerHTML = `
                <img src="${msg.authorAvatar}" class="w-8 h-8 rounded-full flex-shrink-0 mt-1">
                <div class="max-w-[70%]">
                    <div class="${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'} p-3 rounded-2xl ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'} text-sm whitespace-pre-line">${msg.content}</div>
                    <p class="text-[10px] text-gray-600 mt-1 ${isMe ? 'text-right' : ''}">${msg.createdAt ? timeSince(msg.createdAt.toDate()) : 'Envoi...'}</p>
                </div>
            `;
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

// --- FICHIERS GROUPE ---

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

// --- UTILS & EVENT LISTENERS ---

async function createDefaultGroups() {
    const defaultGroups = [
        { name: 'Droit L1', icon: 'fa-balance-scale', color: 'blue', memberCount: 0, members: [] },
        { name: 'Dev Web', icon: 'fa-code', color: 'purple', memberCount: 0, members: [] },
        { name: 'Médecine', icon: 'fa-user-md', color: 'red', memberCount: 0, members: [] }
    ];
    for (const g of defaultGroups) await addDoc(collection(db, 'groups'), g);
}

async function toggleJoinGroup(groupId, isMember) {
    try {
        const ref = doc(db, 'groups', groupId);
        if (isMember) {
            await updateDoc(ref, { members: arrayRemove(currentUserId) });
            // Decrement counter (approx)
            const g = await getDoc(ref);
            await updateDoc(ref, { memberCount: Math.max(0, (g.data().memberCount || 1) - 1) });
        } else {
            await updateDoc(ref, { members: arrayUnion(currentUserId) });
            // Increment counter
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

function loadContributors() {
    const contributors = [ { name: 'Léa D.', points: 1240, rank: 1 }, { name: 'Karim S.', points: 980, rank: 2 }, { name: 'Alex W.', points: 850, rank: 3 } ];
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

    if(ui.filters) {
        ui.filters.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') {
                ui.filters.querySelectorAll('button').forEach(b => { b.classList.remove('bg-gray-700', 'text-white'); b.classList.add('text-gray-400'); });
                e.target.classList.add('bg-gray-700', 'text-white'); e.target.classList.remove('text-gray-400');
                subscribeToPosts(e.target.dataset.filter);
            }
        });
    }

    window.togglePostModal = togglePostModal;
}