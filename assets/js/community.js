import { auth, db, storage, getStorage } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { sanitizeHTML, sanitizeText } from './sanitizer.js';

// ✅ CONSTANTS: Limites de fichiers et queries
const MAX_GROUP_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_GROUP_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB
const POSTS_LIMIT = 20;
const TOP_CONTRIBUTORS_LIMIT = 5;
const GROUPS_LIMIT = 50;
const MESSAGES_LIMIT = 50;

let currentUserId = null;
let currentUserData = null;
let currentPostId = null;
let currentGroupId = null;
let currentGroupData = null;
let postsUnsubscribe = null;
let groupsUnsubscribe = null;
let groupChatUnsubscribe = null;
let groupFilesUnsubscribe = null;
let allGroups = [];
let editingRoleId = null;
let tempRoles = {};

const DEFAULT_ROLES = {
    admin: { name: "Admin", hexColor: "#ef4444", permissions: ["ALL"] },
    moderator: { name: "Modérateur", hexColor: "#3b82f6", permissions: ["KICK_MEMBERS", "DELETE_MESSAGES", "DELETE_FILES", "PIN_MESSAGES", "SEND_MESSAGES", "UPLOAD_FILES"] },
    member: { name: "Membre", hexColor: "#9ca3af", permissions: ["SEND_MESSAGES", "UPLOAD_FILES"] }
};

const PERMISSIONS_DEF = [
    { id: 'MANAGE_GROUP', label: 'Gérer le groupe', desc: 'Modifier le nom, l\'icône et la description.' },
    { id: 'MANAGE_ROLES', label: 'Gérer les rôles', desc: 'Créer, modifier et supprimer des rôles.' },
    { id: 'KICK_MEMBERS', label: 'Expulser des membres', desc: 'Retirer des membres du groupe.' },
    { id: 'SEND_MESSAGES', label: 'Envoyer des messages', desc: 'Participer au chat du groupe.' },
    { id: 'DELETE_MESSAGES', label: 'Supprimer des messages', desc: 'Supprimer les messages d\'autres membres.' },
    { id: 'UPLOAD_FILES', label: 'Partager des fichiers', desc: 'Uploader des documents dans le groupe.' },
    { id: 'DELETE_FILES', label: 'Supprimer des fichiers', desc: 'Supprimer les fichiers partagés par d\'autres.' }
];

const ui = {
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    postsContainer: document.getElementById('posts-container'),
    contributorsList: document.getElementById('contributors-list'),
    groupsList: document.getElementById('groups-list'),
    onlineCount: document.getElementById('online-users-count'),
    btnNewPost: document.getElementById('btn-new-post'),
    filters: document.getElementById('post-filters'),
    groupSearchInput: document.getElementById('group-search-input'),
    groupFilters: document.getElementById('group-filters'),
    newPostModal: document.getElementById('new-post-modal'),
    closePostModal: document.getElementById('close-post-modal'),
    cancelPost: document.getElementById('cancel-post'),
    submitPost: document.getElementById('submit-post'),
    postTitle: document.getElementById('post-title'),
    postContent: document.getElementById('post-content'),
    postTag: document.getElementById('post-tag'),
    detailModal: document.getElementById('post-detail-modal'),
    closeDetailModal: document.getElementById('close-detail-modal'),
    detailContent: document.getElementById('detail-content'),
    commentInput: document.getElementById('comment-input'),
    submitComment: document.getElementById('submit-comment'),
    currentUserAvatarComment: document.getElementById('current-user-avatar-comment'),
    groupModal: document.getElementById('group-space-modal'),
    closeGroupModal: document.getElementById('close-group-modal'),
    groupTitle: document.getElementById('group-title-large'),
    groupIcon: document.getElementById('group-icon-large'),
    groupMemberCount: document.getElementById('group-member-count'),
    groupMembersList: document.getElementById('group-members-list'),
    groupMessagesContainer: document.getElementById('group-messages-container'),
    groupChatInput: document.getElementById('group-chat-input'),
    sendGroupMessageBtn: document.getElementById('send-group-message'),
    groupFilesList: document.getElementById('group-files-list'),
    btnAddFile: document.getElementById('btn-add-file'),
    groupFileUpload: document.getElementById('group-file-upload'),
    changeGroupIconBtn: document.getElementById('change-group-icon-btn'),
    groupIconUpload: document.getElementById('group-icon-upload'),
    btnUploadChat: document.getElementById('btn-upload-chat'),
    createGroupModal: document.getElementById('create-group-modal'),
    closeCreateGroupModal: document.getElementById('close-create-group-modal'),
    btnCreateGroupHero: document.getElementById('btn-create-group-hero'),
    btnCreateGroupSidebar: document.getElementById('btn-create-group-sidebar'),
    newGroupName: document.getElementById('new-group-name'),
    newGroupDesc: document.getElementById('new-group-desc'),
    submitCreateGroup: document.getElementById('submit-create-group'),
    cancelCreateGroup: document.getElementById('cancel-create-group'),
    btnGroupSettings: document.getElementById('btn-group-settings'),
    settingsModal: document.getElementById('group-settings-modal'),
    closeSettingsModal: document.getElementById('close-settings-modal'),
    tabOverview: document.getElementById('tab-overview'),
    tabRoles: document.getElementById('tab-roles'),
    tabMembers: document.getElementById('tab-members'),
    sectionOverview: document.getElementById('section-overview'),
    sectionRoles: document.getElementById('section-roles'),
    sectionMembers: document.getElementById('section-members'),
    editGroupName: document.getElementById('edit-group-name'),
    editGroupDesc: document.getElementById('edit-group-desc'),
    btnSaveOverview: document.getElementById('btn-save-overview'),
    overviewIconPreview: document.getElementById('overview-icon-preview'),
    rolesListContainer: document.getElementById('roles-list-container'),
    btnCreateRole: document.getElementById('btn-create-role'),
    roleNameInput: document.getElementById('role-name-input'),
    roleColorPicker: document.getElementById('role-color-picker'),
    permissionsListContainer: document.getElementById('permissions-list-container'),
    btnSaveRole: document.getElementById('btn-save-role'),
    btnDeleteRole: document.getElementById('btn-delete-role'),
    membersListSettings: document.getElementById('members-list-settings')
};

document.addEventListener('DOMContentLoaded', () => {
    initLayout('community');

    if(ui.onlineCount) ui.onlineCount.textContent = Math.floor(Math.random() * (200 - 80) + 80);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.id;
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

async function loadContributors() {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(TOP_CONTRIBUTORS_LIMIT));
    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            ui.contributorsList.innerHTML = `<div class="text-center py-4 text-xs text-gray-500">Classement en cours...</div>`;
            return;
        }

        // ✅ PERFORMANCE: Utiliser DocumentFragment pour éviter reflow multiple
        const fragment = document.createDocumentFragment();
        let rank = 1;
        snapshot.forEach(docSnap => {
            const user = docSnap.data();
            if(!user.firstName) return;
            const div = document.createElement('div');
            div.className = 'flex items-center gap-3 animate-fade-in mb-3 last:mb-0';
            div.innerHTML = `<span class="text-gray-500 text-xs font-bold w-4">${rank}</span><img src="${user.photoURL || `https://ui-avatars.com/api/?name=${sanitizeText(user.firstName)}&background=random`}" class="w-8 h-8 rounded-full border border-gray-700"><div class="flex-1 min-w-0"><p class="text-sm font-bold text-white truncate">${sanitizeText(user.firstName)}</p><p class="text-xs text-emerald-400 font-mono">${user.points || 0} pts</p></div>`;
            fragment.appendChild(div);
            rank++;
        });
        ui.contributorsList.replaceChildren(fragment);
    } catch (e) { console.error(e); }
}

async function addPointsToUser(userId, points) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { points: increment(points) });
    } catch (e) {
        // ✅ ERROR HANDLING: Log l'erreur mais ne pas bloquer l'UX (points non critiques)
        console.error('Erreur lors de l\'ajout de points:', e);
    }
}

function subscribeToPosts(filterType = 'all') {
    if (postsUnsubscribe) postsUnsubscribe();
    ui.postsContainer.innerHTML = `<div class="text-center py-10 opacity-50"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement...</p></div>`;
    let q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'), limit(POSTS_LIMIT));
    if (filterType !== 'all') q = query(collection(db, 'community_posts'), where('type', '==', filterType), orderBy('createdAt', 'desc'), limit(POSTS_LIMIT));
    postsUnsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            ui.postsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">Aucune discussion.</div>`;
            return;
        }

        // ✅ PERFORMANCE: Clear avec replaceChildren est plus efficace que innerHTML = ''
        ui.postsContainer.replaceChildren();
        snapshot.forEach(docSnap => renderPostCard({ id: docSnap.id, ...docSnap.data() }));
    }, (error) => console.error(error));
}

function renderPostCard(post) {
    const isQuestion = post.type === 'question';
    const badgeColor = isQuestion ? 'blue' : (post.type === 'share' ? 'purple' : 'gray');
    const badgeLabel = isQuestion ? 'Question' : (post.type === 'share' ? 'Partage' : 'Discussion');

    // ✅ XSS FIX: Whitelist des couleurs pour éviter injection CSS
    const SAFE_COLORS = { blue: 'blue', purple: 'purple', gray: 'gray' };
    const safeColor = SAFE_COLORS[badgeColor] || 'gray';

    const card = document.createElement('div');
    card.className = 'content-glass post-card p-6 rounded-2xl cursor-pointer transition-all group animate-fade-in relative';
    const userLiked = post.likesBy && post.likesBy.includes(currentUserId);
    const likeClass = userLiked ? 'text-red-500' : 'hover:text-red-400';
    const likeIcon = userLiked ? 'fas fa-heart' : 'far fa-heart';
    const timeAgo = post.createdAt ? timeSince(post.createdAt.toDate()) : 'À l\'instant';

    let deleteBtnHtml = '';
    if (post.authorId === currentUserId) {
        deleteBtnHtml = `<button class="absolute top-4 right-4 text-gray-600 hover:text-red-500 delete-post-btn p-2"><i class="fas fa-trash"></i></button>`;
    }

    card.innerHTML = `
        ${deleteBtnHtml}
        <div class="flex justify-between items-start mb-4 pr-8">
            <div class="flex items-center gap-3">
                <img src="${post.authorAvatar || 'https://ui-avatars.com/api/?background=random'}" class="w-10 h-10 rounded-full border border-gray-600">
                <div>
                    <h4 class="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">${sanitizeText(post.authorName) || 'Anonyme'}</h4>
                    <p class="text-xs text-gray-500">${timeAgo} • ${sanitizeText(post.tag) || 'Général'}</p>
                </div>
            </div>
            <span class="px-2 py-1 bg-${safeColor}-500/10 text-${safeColor}-400 text-xs rounded border border-${safeColor}-500/20">${badgeLabel}</span>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">${sanitizeText(post.title)}</h3>
        <p class="text-gray-400 text-sm mb-4 line-clamp-3 whitespace-pre-line">${sanitizeHTML(post.content)}</p>
        <div class="flex items-center gap-6 text-xs text-gray-500 border-t border-gray-800/50 pt-4">
            <button class="flex items-center gap-2 hover:text-emerald-400 transition-colors action-btn"><i class="far fa-comment-alt"></i> ${post.commentsCount || 0} rép.</button>
            <button class="flex items-center gap-2 ${likeClass} transition-colors action-btn like-btn"><i class="${likeIcon}"></i> ${post.likesBy ? post.likesBy.length : 0}</button>
            <button class="ml-auto hover:text-white action-btn share-btn hover:text-indigo-400"><i class="fas fa-share"></i> Republier</button>
        </div>
    `;

    if (post.authorId === currentUserId) {
        card.querySelector('.delete-post-btn').addEventListener('click', (e) => { e.stopPropagation(); deletePost(post.id); });
    }
    card.querySelector('.like-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleLike(post.id, userLiked); });
    card.querySelector('.share-btn').addEventListener('click', (e) => { e.stopPropagation(); sharePost(post); });
    card.addEventListener('click', (e) => { if (!e.target.closest('.action-btn') && !e.target.closest('.delete-post-btn')) openDetailModal(post); });
    ui.postsContainer.appendChild(card);
}

async function deletePost(postId) {
    if(!confirm("Supprimer définitivement cette discussion ?")) return;

    showMessage("Suppression...", "info");

    try {
        await deleteDoc(doc(db, 'community_posts', postId));
        showMessage("Discussion supprimée avec succès", "success");
    } catch(e) {
        console.error("Erreur suppression post:", e);
        showMessage("Impossible de supprimer la discussion", "error");
    }
}

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
            authorAvatar: currentUserData.photoURL,
            createdAt: serverTimestamp(),
            likesBy: [],
            commentsCount: 0
        });

        await addPointsToUser(currentUserId, 10);

        window.togglePostModal(false);
        ui.postTitle.value = "";
        ui.postContent.value = "";

        showMessage("Publié avec succès ! (+10 pts)", "success");
        loadContributors();
    } catch (e) {
        console.error("Erreur création post:", e);
        showMessage("Impossible de publier. Réessayez.", "error");
    } finally {
        ui.submitPost.disabled = false;
        ui.submitPost.innerHTML = `<i class="fas fa-paper-plane"></i> Publier`;
    }
}

async function toggleLike(postId, alreadyLiked) {
    try {
        const ref = doc(db, 'community_posts', postId);
        if(alreadyLiked) await updateDoc(ref, { likesBy: arrayRemove(currentUserId) });
        else await updateDoc(ref, { likesBy: arrayUnion(currentUserId) });
    } catch(e) {
        // ✅ ERROR HANDLING: Afficher un message d'erreur à l'utilisateur
        console.error('Erreur lors du like:', e);
        showMessage('Impossible de liker le post. Vérifiez votre connexion.', 'error');
    }
}

function sharePost(post) {
    window.togglePostModal(true);
    ui.postTitle.value = `RE: ${post.title}`;
    ui.postContent.value = `\n\n--- De ${post.authorName} ---\n${post.content}`;
    ui.postContent.focus();
}

async function openDetailModal(post) {
    currentPostId = post.id;
    ui.detailModal.classList.remove('hidden');
    ui.detailContent.innerHTML = `<h2 class="text-2xl font-bold text-white mb-4">${sanitizeText(post.title)}</h2><p class="text-gray-300 whitespace-pre-line">${sanitizeHTML(post.content)}</p><div id="comments-list" class="mt-8 space-y-4"></div>`;
    subscribeToComments(post.id);
}

function subscribeToComments(postId) {
    const list = document.getElementById('comments-list');
    onSnapshot(query(collection(db, 'community_posts', postId, 'comments'), orderBy('createdAt', 'asc')), (snap) => {
        // ✅ PERFORMANCE: Utiliser DocumentFragment au lieu de innerHTML += (évite reflow multiple)
        const fragment = document.createDocumentFragment();
        snap.forEach(d => {
            const c = d.data();
            const div = document.createElement('div');
            div.className = 'bg-gray-800/30 p-3 rounded-xl border border-gray-800';
            div.innerHTML = `<span class="font-bold text-white text-sm">${sanitizeText(c.authorName)}</span><p class="text-sm text-gray-300 mt-1">${sanitizeHTML(c.content)}</p>`;
            fragment.appendChild(div);
        });
        list.replaceChildren(fragment);
    });
}

async function submitComment() {
    const content = ui.commentInput.value.trim();
    if(!content) return;
    try {
        await addDoc(collection(db, 'community_posts', currentPostId, 'comments'), {
            content,
            authorId: currentUserId,
            authorName: currentUserData.firstName,
            createdAt: serverTimestamp()
        });
        await addPointsToUser(currentUserId, 5);
        ui.commentInput.value = '';
    } catch(e) {
        // ✅ ERROR HANDLING: Afficher message d'erreur à l'utilisateur
        console.error('Erreur lors de l\'ajout du commentaire:', e);
        showMessage('Impossible d\'ajouter le commentaire. Vérifiez votre connexion.', 'error');
    }
}

function hasPermission(permission) {
    if (!currentGroupData) return false;
    const myRoleId = currentGroupData.memberRoles ? currentGroupData.memberRoles[currentUserId] : 'member';
    const role = currentGroupData.roles ? currentGroupData.roles[myRoleId] : DEFAULT_ROLES[myRoleId];

    if (!role) return false;
    if (role.permissions.includes('ALL')) return true;
    return role.permissions.includes(permission);
}

async function createNewGroup() {
    const name = ui.newGroupName.value.trim(); const desc = ui.newGroupDesc.value.trim(); const color = document.querySelector('input[name="new-group-color"]:checked').value;
    if (!name) return showMessage("Le nom du groupe est requis", "error");
    ui.submitCreateGroup.disabled = true; ui.submitCreateGroup.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    try {
        const initialMemberRoles = {}; initialMemberRoles[currentUserId] = 'admin';
        await addDoc(collection(db, 'groups'), { name: name, description: desc, color: color, icon: 'fa-users', memberCount: 1, members: [currentUserId], roles: DEFAULT_ROLES, memberRoles: initialMemberRoles, admins: [currentUserId], searchKeywords: generateKeywords(name), createdAt: serverTimestamp() });
        await addPointsToUser(currentUserId, 20); toggleCreateGroupModal(false); ui.newGroupName.value = ""; ui.newGroupDesc.value = ""; showMessage("Groupe créé ! (+20 pts)", "success");
    } catch (e) { console.error(e); } finally { ui.submitCreateGroup.disabled = false; ui.submitCreateGroup.innerHTML = `<i class="fas fa-check"></i> Créer`; }
}

function generateKeywords(str) { return str.toLowerCase().split(' '); }

function subscribeToGroups() {
    if (groupsUnsubscribe) groupsUnsubscribe();
    const q = query(collection(db, 'groups'), orderBy('memberCount', 'desc'), limit(GROUPS_LIMIT));
    groupsUnsubscribe = onSnapshot(q, (snapshot) => { allGroups = []; snapshot.forEach(docSnap => { allGroups.push({ id: docSnap.id, ...docSnap.data() }); }); renderGroupList(allGroups); });
}

function renderGroupList(groups) {
    ui.groupsList.innerHTML = '';
    if (groups.length === 0) { ui.groupsList.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Aucun groupe trouvé.</p>`; return; }
    groups.forEach(group => {
        const isMember = group.members && group.members.includes(currentUserId);
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group-item animate-fade-in';
        let iconHtml = `<i class="fas ${group.icon || 'fa-users'}"></i>`; let iconClass = `w-10 h-10 rounded-lg bg-${group.color || 'indigo'}-500/20 text-${group.color || 'indigo'}-400 flex items-center justify-center text-lg`;
        if (group.photoURL) { iconHtml = `<img src="${group.photoURL}" class="w-full h-full object-cover rounded-lg">`; iconClass = `w-10 h-10 rounded-lg bg-gray-800`; }
        div.innerHTML = `<div class="${iconClass}">${iconHtml}</div><div class="flex-1 min-w-0"><p class="text-sm font-bold text-white truncate">${group.name}</p><p class="text-xs text-gray-500 truncate">${group.memberCount || 0} membres</p></div><button class="ml-auto text-xs px-2 py-1 rounded transition-colors ${isMember ? 'bg-gray-700 text-gray-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'} join-group-btn" data-id="${group.id}">${isMember ? 'Ouvrir' : 'Rejoindre'}</button>`;
        const btn = div.querySelector('.join-group-btn'); btn.addEventListener('click', async (e) => { e.stopPropagation(); if (isMember) openGroupSpace(group); else { await toggleJoinGroup(group.id, false); openGroupSpace(group); } });
        div.addEventListener('click', () => { if(isMember) openGroupSpace(group); else btn.click(); });
        ui.groupsList.appendChild(div);
    });
}

function filterGroups() {
    const searchTerm = ui.groupSearchInput.value.toLowerCase();
    const filterType = document.querySelector('#group-filters button.bg-blue-900\\/50') ? document.querySelector('#group-filters button.bg-blue-900\\/50').dataset.filter : 'all';
    const filtered = allGroups.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchTerm) || (g.description && g.description.toLowerCase().includes(searchTerm));
        const matchesType = filterType === 'all' || (filterType === 'my' && g.members.includes(currentUserId));
        return matchesSearch && matchesType;
    });
    renderGroupList(filtered);
}

function openGroupSpace(group) {
    currentGroupId = group.id;
    currentGroupData = group;
    ui.groupModal.classList.remove('hidden');

    ui.groupTitle.textContent = group.name;
    ui.groupMemberCount.textContent = group.memberCount || 0;

    if (group.photoURL) {
         ui.groupIcon.innerHTML = `<img src="${group.photoURL}" class="w-full h-full object-cover rounded-2xl">`;
    } else {
         ui.groupIcon.innerHTML = `<i class="fas ${group.icon || 'fa-users'}"></i>`;
    }

    const myRole = group.memberRoles ? group.memberRoles[currentUserId] : 'member';
    if (myRole === 'admin') {
        ui.btnGroupSettings.classList.remove('hidden');
        ui.btnGroupSettings.onclick = () => openSettingsModal(group);
    } else {
        ui.btnGroupSettings.classList.add('hidden');
    }

    ui.groupMembersList.innerHTML = `<div class="text-center py-2"><i class="fas fa-circle-notch fa-spin text-gray-600"></i></div>`;
    loadGroupMembers(group);

    subscribeToGroupChat(group.id);
    subscribeToGroupFiles(group.id);
}

async function loadGroupMembers(group) {
    ui.groupMembersList.innerHTML = '';
    const myRoleId = group.memberRoles ? (group.memberRoles[currentUserId] || 'member') : 'member';
    const myRole = group.roles ? (group.roles[myRoleId] || DEFAULT_ROLES.member) : DEFAULT_ROLES.member;
    const badgeColor = myRole.hexColor || '#9ca3af';
    const divMe = document.createElement('div');
    divMe.className = 'flex items-center gap-2 p-2 rounded hover:bg-gray-800/50';
    divMe.innerHTML = `<img src="${currentUserData.photoURL || `https://ui-avatars.com/api/?name=${currentUserData.firstName}&background=random`}" class="w-8 h-8 rounded-full border border-gray-700"><div class="flex-1 min-w-0"><p class="text-sm font-bold text-white flex items-center gap-2">Toi <span class="text-[10px] px-1.5 py-0.5 rounded border" style="border-color: ${badgeColor}; color: ${badgeColor}; background-color: ${badgeColor}20;">${myRole.name}</span></p></div>`;
    ui.groupMembersList.appendChild(divMe);
    if (group.memberCount > 1) { const others = document.createElement('p'); others.className = "text-xs text-gray-500 mt-2 px-2 italic"; others.textContent = `+ ${group.memberCount - 1} autres membres`; ui.groupMembersList.appendChild(others); }
}

function openSettingsModal(group) {
    ui.settingsModal.classList.remove('hidden');
    tempRoles = JSON.parse(JSON.stringify(group.roles || DEFAULT_ROLES));

    ui.editGroupName.value = group.name;
    ui.editGroupDesc.value = group.description || '';
    if(group.photoURL) ui.overviewIconPreview.innerHTML = `<img src="${group.photoURL}" class="w-full h-full object-cover rounded-full">`;
    else ui.overviewIconPreview.innerHTML = `<i class="fas ${group.icon || 'fa-users'}"></i>`;

    switchTab('overview');
}

function switchTab(tabId) {
    [ui.tabOverview, ui.tabRoles, ui.tabMembers].forEach(t => {
        t.className = "w-full text-left px-3 py-2 rounded text-gray-300 hover:bg-[#3f4147] hover:text-white transition-colors text-sm font-medium";
    });
    [ui.sectionOverview, ui.sectionRoles, ui.sectionMembers].forEach(s => s.classList.add('hidden'));

    const btn = document.getElementById('tab-' + tabId);
    const sect = document.getElementById('section-' + tabId);

    btn.className = "w-full text-left px-3 py-2 rounded bg-[#3f4147] text-white transition-colors text-sm font-medium";
    sect.classList.remove('hidden');

    if (tabId === 'roles') {
        renderRolesList();
        const firstRole = Object.keys(tempRoles)[0];
        if (firstRole) selectRoleForEditing(firstRole);
    }
    if (tabId === 'members') {
        loadSettingsMembers();
    }
}

async function saveOverview() {
    const name = ui.editGroupName.value.trim();
    const desc = ui.editGroupDesc.value.trim();

    if (!name) return showMessage("Nom requis", "error");

    try {
        await updateDoc(doc(db, 'groups', currentGroupId), { name, description: desc });
        showMessage("Modifications enregistrées", "success");
        ui.groupTitle.textContent = name;
        currentGroupData.name = name;
        currentGroupData.description = desc;
    } catch(e) {
        console.error(e);
        showMessage("Erreur sauvegarde", "error");
    }
}

async function loadSettingsMembers() {
    ui.membersListSettings.innerHTML = `<div class="text-center py-8 text-gray-500 text-sm">Chargement... (Simulation)</div>`;

    ui.membersListSettings.innerHTML = '';

    const roleId = currentGroupData.memberRoles ? (currentGroupData.memberRoles[currentUserId] || 'member') : 'member';
    renderMemberRow(currentUserId, currentUserData, roleId);
}

function renderMemberRow(uid, userData, roleId) {
    const div = document.createElement('div');
    div.className = 'grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#3f4147]/50';

    const options = Object.keys(tempRoles).map(rid =>
        `<option value="${rid}" ${rid === roleId ? 'selected' : ''}>${tempRoles[rid].name}</option>`
    ).join('');

    div.innerHTML = `
        <div class="col-span-6 flex items-center gap-3">
            <img src="${userData.photoURL || `https://ui-avatars.com/api/?name=${userData.firstName}&background=random`}" class="w-8 h-8 rounded-full bg-gray-700">
            <span class="text-sm text-white font-medium">${userData.firstName}</span>
        </div>
        <div class="col-span-4">
            <select class="bg-[#1e1f22] text-white text-xs rounded border border-gray-700 p-1 w-full focus:outline-none member-role-select" data-uid="${uid}">
                ${options}
            </select>
        </div>
        <div class="col-span-2 text-right">
            ${uid !== currentUserId ? `<button class="text-red-400 hover:text-red-300 text-xs font-medium hover:underline kick-btn">Expulser</button>` : ''}
        </div>
    `;

    div.querySelector('.member-role-select').addEventListener('change', async (e) => {
        const newRole = e.target.value;
        try {
            await updateDoc(doc(db, 'groups', currentGroupId), {
                [`memberRoles.${uid}`]: newRole
            });
            showMessage("Rôle mis à jour", "success");
            currentGroupData.memberRoles[uid] = newRole;
        } catch(e) { console.error(e); showMessage("Erreur", "error"); }
    });

    ui.membersListSettings.appendChild(div);
}

function renderRolesList() {
    ui.rolesListContainer.innerHTML = '';
    Object.keys(tempRoles).forEach(roleId => {
        const role = tempRoles[roleId];
        const div = document.createElement('div');
        const isActive = roleId === editingRoleId;
        div.className = `p-2 rounded text-sm border-l-4 cursor-pointer mb-1 flex justify-between items-center ${isActive ? 'bg-[#3f4147] text-white' : 'hover:bg-[#2b2d31] text-gray-400'}`;
        div.style.borderLeftColor = role.hexColor || '#9ca3af';
        div.innerHTML = `<span>${role.name}</span>`;
        div.onclick = () => selectRoleForEditing(roleId);
        ui.rolesListContainer.appendChild(div);
    });
}

function selectRoleForEditing(roleId) {
    editingRoleId = roleId; const role = tempRoles[roleId]; renderRolesList();
    ui.roleNameInput.value = role.name;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#6b7280'];
    ui.roleColorPicker.innerHTML = colors.map(c => `<button class="w-6 h-6 rounded-full border-2 transition-all ${role.hexColor === c ? 'border-white ring-2 ring-indigo-500 scale-110' : 'border-transparent hover:border-gray-400'}" style="background-color: ${c};" onclick="window.updateRoleColor('${c}')"></button>`).join('');
    ui.permissionsListContainer.innerHTML = PERMISSIONS_DEF.map(perm => {
        const isChecked = role.permissions.includes('ALL') || role.permissions.includes(perm.id);
        const isDisabled = role.permissions.includes('ALL') && roleId === 'admin';
        return `<div class="flex items-center justify-between py-3 border-b border-gray-700/50"><div class="pr-4"><div class="text-white text-sm font-medium">${perm.label}</div><div class="text-gray-400 text-xs mt-0.5">${perm.desc}</div></div><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" class="sr-only peer" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} onchange="window.toggleRolePermission('${perm.id}', this.checked)"><div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}"></div></label></div>`;
    }).join('');
    if (roleId === 'admin' || roleId === 'member') ui.btnDeleteRole.style.display = 'none'; else ui.btnDeleteRole.style.display = 'block';
}

window.updateRoleColor = (color) => { if (tempRoles[editingRoleId]) { tempRoles[editingRoleId].hexColor = color; selectRoleForEditing(editingRoleId); } };
window.toggleRolePermission = (permId, checked) => { if (!tempRoles[editingRoleId]) return; let perms = tempRoles[editingRoleId].permissions; if (checked) { if (!perms.includes(permId)) perms.push(permId); } else { tempRoles[editingRoleId].permissions = perms.filter(p => p !== permId); } };

async function saveRolesChanges() { if (tempRoles[editingRoleId]) { tempRoles[editingRoleId].name = ui.roleNameInput.value; } try { ui.btnSaveRole.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; const groupRef = doc(db, 'groups', currentGroupId); await updateDoc(groupRef, { roles: tempRoles }); currentGroupData.roles = tempRoles; showMessage("Modifications enregistrées !", "success"); renderRolesList(); } catch (e) { console.error(e); showMessage("Erreur", "error"); } finally { ui.btnSaveRole.innerHTML = 'Enregistrer les modifications'; } }
async function createNewRole() { const newId = 'role_' + Date.now(); tempRoles[newId] = { name: "Nouveau Rôle", hexColor: "#9ca3af", permissions: ["SEND_MESSAGES"] }; renderRolesList(); selectRoleForEditing(newId); }
async function deleteCurrentRole() { if (editingRoleId === 'admin' || editingRoleId === 'member') return showMessage("Impossible de supprimer ce rôle système.", "error"); if (confirm("Supprimer ce rôle ?")) { delete tempRoles[editingRoleId]; const groupRef = doc(db, 'groups', currentGroupId); await updateDoc(groupRef, { roles: tempRoles }); const firstRole = Object.keys(tempRoles)[0]; selectRoleForEditing(firstRole); } }

function subscribeToGroupChat(groupId) {
    if(groupChatUnsubscribe) groupChatUnsubscribe();
    ui.groupMessagesContainer.innerHTML = `<div class="text-center py-10 opacity-50"><i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i><p>Chargement...</p></div>`;
    const q = query(collection(db, 'groups', groupId, 'messages'), orderBy('createdAt', 'asc'), limit(MESSAGES_LIMIT));
    groupChatUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.groupMessagesContainer.innerHTML = '';
        if (snapshot.empty) { ui.groupMessagesContainer.innerHTML = `<div class="text-center text-gray-500 py-10"><p>Soyez le premier à écrire !</p></div>`; return; }
        const canDeleteOthers = hasPermission('DELETE_MESSAGES');
        snapshot.forEach(docSnap => {
            const msg = { id: docSnap.id, ...docSnap.data() };
            const isMe = msg.authorId === currentUserId;
            const canDelete = isMe || canDeleteOthers;
            const deleteBtnHtml = canDelete ? `<button class="text-gray-500 hover:text-red-500 ml-2 delete-msg-btn" data-id="${msg.id}"><i class="fas fa-trash-alt text-[10px]"></i></button>` : '';
            let authorRoleBadge = '';
            if (currentGroupData && currentGroupData.memberRoles && currentGroupData.roles) {
                const roleId = currentGroupData.memberRoles[msg.authorId] || 'member';
                const role = currentGroupData.roles[roleId];
                if (role && roleId !== 'member') {
                    const color = role.hexColor || '#9ca3af';
                    authorRoleBadge = `<span class="text-[10px] ml-2 font-bold border px-1 rounded bg-black/20" style="color: ${color}; border-color: ${color};">${role.name}</span>`;
                }
            }
            const msgDiv = document.createElement('div');
            msgDiv.className = `flex gap-3 mb-4 animate-fade-in ${isMe ? 'flex-row-reverse' : ''} group/msg`;
            msgDiv.innerHTML = `<img src="${msg.authorAvatar}" class="w-8 h-8 rounded-full flex-shrink-0 mt-1"><div class="max-w-[70%]"><div class="flex items-center ${isMe ? 'justify-end' : ''} mb-1"><span class="text-[10px] text-gray-400">${msg.authorName}</span>${authorRoleBadge}</div><div class="${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'} p-3 rounded-2xl ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'} text-sm whitespace-pre-line group-hover/msg:opacity-90 shadow-sm">${msg.content}</div><div class="flex items-center ${isMe ? 'justify-end' : ''} mt-1 gap-2"><p class="text-[10px] text-gray-600">${msg.createdAt ? timeSince(msg.createdAt.toDate()) : 'Envoi...'}</p>${deleteBtnHtml}</div></div>`;
            if(canDelete) { const delBtn = msgDiv.querySelector('.delete-msg-btn'); delBtn.addEventListener('click', () => deleteGroupMessage(msg.id)); }
            ui.groupMessagesContainer.appendChild(msgDiv);
        });
        ui.groupMessagesContainer.scrollTop = ui.groupMessagesContainer.scrollHeight;
    });
}
async function sendGroupMessage() { if (!hasPermission('SEND_MESSAGES')) return showMessage("Permission refusée", "error"); const content = ui.groupChatInput.value.trim(); if(!content || !currentGroupId) return; try { await addDoc(collection(db, 'groups', currentGroupId, 'messages'), { content, authorId: currentUserId, authorName: currentUserData.firstName, authorAvatar: currentUserData.photoURL, createdAt: serverTimestamp() }); ui.groupChatInput.value = ''; } catch(e) { console.error(e); } }
async function deleteGroupMessage(messageId) { if(!confirm("Supprimer ce message ?")) return; try { await deleteDoc(doc(db, 'groups', currentGroupId, 'messages', messageId)); } catch(e) { console.error(e); } }
function subscribeToGroupFiles(groupId) {
    if(groupFilesUnsubscribe) groupFilesUnsubscribe();
    const q = query(collection(db, 'groups', groupId, 'files'), orderBy('createdAt', 'desc'));
    groupFilesUnsubscribe = onSnapshot(q, (snapshot) => {
        ui.groupFilesList.innerHTML = '';
        if (snapshot.empty) { ui.groupFilesList.innerHTML = `<div class="text-center py-4 text-xs italic text-gray-600">Aucun fichier partagé</div>`; return; }
        const canDeleteFiles = hasPermission('DELETE_FILES');
        snapshot.forEach(docSnap => {
            const f = { id: docSnap.id, ...docSnap.data() };
            const isMe = f.authorId === currentUserId;
            const canDelete = isMe || canDeleteFiles;
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer group/file relative';
            div.innerHTML = `<i class="fas fa-file-alt text-gray-400"></i><div class="flex-1 min-w-0"><p class="text-xs text-gray-300 truncate">${f.name}</p><p class="text-[10px] text-gray-600">${f.size || '? KB'} • ${f.authorName}</p></div><div class="flex items-center gap-2 opacity-0 group-hover/file:opacity-100 transition-opacity"><a href="${f.url}" target="_blank" class="text-indigo-400 hover:text-white"><i class="fas fa-download"></i></a>${canDelete ? `<button class="text-red-400 hover:text-red-300 delete-file-btn"><i class="fas fa-trash"></i></button>` : ''}</div>`;
            if(canDelete) { div.querySelector('.delete-file-btn').addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); if(confirm("Supprimer ce fichier ?")) deleteGroupFile(f.id); }); }
            ui.groupFilesList.appendChild(div);
        });
    });
}
async function deleteGroupFile(fileId) {
    showMessage("Suppression du fichier...", "info");
    try {
        await deleteDoc(doc(db, 'groups', currentGroupId, 'files', fileId));
        showMessage("Fichier supprimé avec succès", "success");
    } catch(e) {
        console.error("Erreur suppression fichier:", e);
        showMessage("Impossible de supprimer le fichier", "error");
    }
}
async function uploadGroupFile(file) {
    if (!currentGroupId) return;
    if (!hasPermission('UPLOAD_FILES')) return showMessage("Permission refusée", "error");

    if (file.size > MAX_GROUP_FILE_SIZE) {
        return showMessage("Fichier trop lourd (max 10MB)", "error");
    }

    showMessage(`Upload de "${file.name}"...`, "info");

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

        showMessage(`"${file.name}" partagé avec succès !`, "success");
    } catch (e) {
        console.error("Erreur upload fichier groupe:", e);
        showMessage("Échec de l'upload. Réessayez.", "error");
    }
}
async function uploadGroupIcon(file) {
    if (!currentGroupId) return;
    if (!hasPermission('MANAGE_GROUP')) return showMessage("Permission refusée", "error");

    if (!file.type.startsWith('image/')) {
        return showMessage("Le fichier doit être une image", "error");
    }

    if (file.size > MAX_GROUP_PHOTO_SIZE) {
        return showMessage("Image trop lourde (max 2MB)", "error");
    }

    showMessage("Mise à jour de l'icône...", "info");

    try {
        const storageRef = ref(storage, `group_icons/${currentGroupId}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        await updateDoc(doc(db, 'groups', currentGroupId), { photoURL: url });

        ui.groupIcon.innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-2xl">`;
        ui.overviewIconPreview.innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-full">`;

        showMessage("Icône mise à jour avec succès", "success");
    } catch (e) {
        console.error("Erreur upload icône:", e);
        showMessage("Impossible de modifier l'icône", "error");
    }
}
async function toggleJoinGroup(groupId, isMember) {
    try {
        const ref = doc(db, 'groups', groupId);

        if (isMember) {
            showMessage("Sortie du groupe...", "info");
            await updateDoc(ref, {
                members: arrayRemove(currentUserId),
                [`memberRoles.${currentUserId}`]: deleteField()
            });
            const g = await getDoc(ref);
            await updateDoc(ref, { memberCount: Math.max(0, (g.data().memberCount || 1) - 1) });
            showMessage("Vous avez quitté le groupe", "success");
        } else {
            showMessage("Rejoindre le groupe...", "info");
            await updateDoc(ref, {
                members: arrayUnion(currentUserId),
                [`memberRoles.${currentUserId}`]: 'member'
            });
            const g = await getDoc(ref);
            await updateDoc(ref, { memberCount: (g.data().memberCount || 0) + 1 });
            showMessage("Vous avez rejoint le groupe", "success");
        }
    } catch(e) {
        console.error("Erreur toggle join:", e);
        showMessage("Une erreur est survenue. Réessayez.", "error");
    }
}
function timeSince(date) { const seconds = Math.floor((new Date() - date) / 1000); let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " an(s)"; interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " mois"; interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "j"; interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h"; interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " min"; return "À l'instant"; }

function setupEventListeners() {
    const togglePostModal = (show) => ui.newPostModal.classList.toggle('hidden', !show);
    if(ui.btnNewPost) ui.btnNewPost.onclick = () => { ui.postTitle.value = ""; ui.postContent.value = ""; togglePostModal(true); };
    if(ui.closePostModal) ui.closePostModal.onclick = () => togglePostModal(false);
    if(ui.cancelPost) ui.cancelPost.onclick = () => togglePostModal(false);
    if(ui.submitPost) ui.submitPost.onclick = createPost;

    if(ui.closeDetailModal) ui.closeDetailModal.onclick = () => ui.detailModal.classList.add('hidden');
    if(ui.submitComment) ui.submitComment.onclick = submitComment;
    if(ui.commentInput) ui.commentInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') submitComment(); });

    if(ui.closeGroupModal) ui.closeGroupModal.onclick = () => ui.groupModal.classList.add('hidden');
    if(ui.sendGroupMessageBtn) ui.sendGroupMessageBtn.onclick = sendGroupMessage;
    if(ui.groupChatInput) ui.groupChatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendGroupMessage(); });

    if(ui.btnAddFile) ui.btnAddFile.onclick = () => ui.groupFileUpload.click();
    if(ui.btnUploadChat) ui.btnUploadChat.onclick = () => ui.groupFileUpload.click();
    if(ui.groupFileUpload) ui.groupFileUpload.onchange = (e) => { if(e.target.files.length > 0) uploadGroupFile(e.target.files[0]); };

    if(ui.changeGroupIconBtn) ui.changeGroupIconBtn.onclick = () => ui.groupIconUpload.click();
    if(ui.groupIconUpload) ui.groupIconUpload.onchange = (e) => { if(e.target.files.length > 0) uploadGroupIcon(e.target.files[0]); };

    const toggleCreateGroupModal = (show) => ui.createGroupModal.classList.toggle('hidden', !show);
    if(ui.btnCreateGroupHero) ui.btnCreateGroupHero.onclick = () => toggleCreateGroupModal(true);
    if(ui.btnCreateGroupSidebar) ui.btnCreateGroupSidebar.onclick = () => toggleCreateGroupModal(true);
    if(ui.closeCreateGroupModal) ui.closeCreateGroupModal.onclick = () => toggleCreateGroupModal(false);
    if(ui.cancelCreateGroup) ui.cancelCreateGroup.onclick = () => toggleCreateGroupModal(false);
    if(ui.submitCreateGroup) ui.submitCreateGroup.onclick = createNewGroup;

    if (ui.closeSettingsModal) ui.closeSettingsModal.onclick = () => ui.settingsModal.classList.add('hidden');
    if (ui.btnCreateRole) ui.btnCreateRole.onclick = createNewRole;
    if (ui.btnSaveRole) ui.btnSaveRole.onclick = saveRolesChanges;
    if (ui.btnDeleteRole) ui.btnDeleteRole.onclick = deleteCurrentRole;
    if (ui.roleNameInput) ui.roleNameInput.addEventListener('input', (e) => { if (tempRoles[editingRoleId]) { tempRoles[editingRoleId].name = e.target.value; } });
    if(ui.btnSaveOverview) ui.btnSaveOverview.onclick = saveOverview;
    if(ui.tabOverview) ui.tabOverview.onclick = () => switchTab('overview');
    if(ui.tabRoles) ui.tabRoles.onclick = () => switchTab('roles');
    if(ui.tabMembers) ui.tabMembers.onclick = () => switchTab('members');

    if(ui.filters) { ui.filters.addEventListener('click', (e) => { if(e.target.tagName === 'BUTTON') { ui.filters.querySelectorAll('button').forEach(b => { b.classList.remove('bg-gray-700', 'text-white'); b.classList.add('text-gray-400'); }); e.target.classList.add('bg-gray-700', 'text-white'); e.target.classList.remove('text-gray-400'); subscribeToPosts(e.target.dataset.filter); } }); }
    if(ui.groupSearchInput) { ui.groupSearchInput.addEventListener('input', filterGroups); }
    if(ui.groupFilters) { ui.groupFilters.addEventListener('click', (e) => { if(e.target.tagName === 'BUTTON') { const allBtn = ui.groupFilters.querySelector('[data-filter="all"]'); const myBtn = ui.groupFilters.querySelector('[data-filter="my"]'); if(e.target.dataset.filter === 'all') { allBtn.className = "flex-1 py-1 text-[10px] font-bold bg-blue-900/50 text-blue-200 border border-blue-800 rounded hover:bg-blue-800 transition-colors"; myBtn.className = "flex-1 py-1 text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700 rounded hover:bg-gray-700 transition-colors"; } else { myBtn.className = "flex-1 py-1 text-[10px] font-bold bg-blue-900/50 text-blue-200 border border-blue-800 rounded hover:bg-blue-800 transition-colors"; allBtn.className = "flex-1 py-1 text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700 rounded hover:bg-gray-700 transition-colors"; } filterGroups(); } }); }

    // ✅ MEMORY LEAK FIX: Cleanup realtime subscriptions before page unload
    window.addEventListener('beforeunload', () => {
        if (postsUnsubscribe) {
            postsUnsubscribe();
            postsUnsubscribe = null;
        }
        if (groupsUnsubscribe) {
            groupsUnsubscribe();
            groupsUnsubscribe = null;
        }
        if (groupChatUnsubscribe) {
            groupChatUnsubscribe();
            groupChatUnsubscribe = null;
        }
        if (groupFilesUnsubscribe) {
            groupFilesUnsubscribe();
            groupFilesUnsubscribe = null;
        }
    });

    window.togglePostModal = togglePostModal;
    window.toggleCreateGroupModal = toggleCreateGroupModal;
}
