import { auth, supabase } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';

// Variables globales
let currentUserId = null;
let currentUserData = null;
let posts = [];
let groups = [];

// Éléments UI
const ui = {
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    postsContainer: document.getElementById('posts-container'),
    contributorsList: document.getElementById('contributors-list'),
    groupsList: document.getElementById('groups-list'),
    btnNewPost: document.getElementById('btn-new-post'),
    newPostModal: document.getElementById('new-post-modal'),
    closePostModal: document.getElementById('close-post-modal'),
    submitPost: document.getElementById('submit-post'),
    postTitle: document.getElementById('post-title'),
    postContent: document.getElementById('post-content'),
    postTag: document.getElementById('post-tag'),
    createGroupModal: document.getElementById('create-group-modal'),
    closeCreateGroupModal: document.getElementById('close-create-group-modal'),
    btnCreateGroupHero: document.getElementById('btn-create-group-hero'),
    newGroupName: document.getElementById('new-group-name'),
    newGroupDesc: document.getElementById('new-group-desc'),
    submitCreateGroup: document.getElementById('submit-create-group'),
    // Éléments pour les commentaires
    detailModal: document.getElementById('post-detail-modal'),
    closeDetailModal: document.getElementById('close-detail-modal'),
    detailContent: document.getElementById('detail-content'),
    commentInput: document.getElementById('comment-input'),
    submitComment: document.getElementById('submit-comment')
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initLayout('community');
    setupEventListeners();
    checkAuth();
});

async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    currentUserId = user.id;
    await loadUserProfile();
    await loadPosts();
    await loadContributors();
    await loadGroups();
}

async function loadUserProfile() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUserId)
            .single();
            
        if (error) {
            console.error('Erreur chargement profil:', error);
            currentUserData = { first_name: "Étudiant", photo_url: null };
            return;
        }
        
        currentUserData = data;
        if(ui.userName) ui.userName.textContent = currentUserData.first_name || "Étudiant";
        if(ui.userAvatar) ui.userAvatar.src = currentUserData.photo_url || `https://ui-avatars.com/api/?name=${currentUserData.first_name}&background=random&color=fff`;
    } catch (e) {
        console.error('Erreur profil:', e);
        currentUserData = { first_name: "Étudiant", photo_url: null };
    }
}

async function loadPosts() {
    try {
        const { data, error } = await supabase
            .from('community_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
            
        if (error) {
            console.error('Erreur chargement posts:', error);
            if(ui.postsContainer) ui.postsContainer.innerHTML = '<div class="text-center py-10 text-gray-500">Erreur de chargement</div>';
            return;
        }
        
        posts = data || [];
        renderPosts();
    } catch (e) {
        console.error('Erreur posts:', e);
        if(ui.postsContainer) ui.postsContainer.innerHTML = '<div class="text-center py-10 text-gray-500">Erreur de chargement</div>';
    }
}

function renderPosts() {
    if (!ui.postsContainer) return;
    
    if (!posts || posts.length === 0) {
        ui.postsContainer.innerHTML = '<div class="text-center py-10 text-gray-500">Aucune discussion pour le moment</div>';
        return;
    }
    
    ui.postsContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postCard = createPostCard(post);
        ui.postsContainer.appendChild(postCard);
    });
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'content-glass p-6 rounded-2xl cursor-pointer transition-all group animate-fade-in mb-4';
    
    const timeAgo = post.created_at ? getTimeAgo(new Date(post.created_at)) : 'À l\'instant';
    const userLiked = post.likes_by && post.likes_by.includes(currentUserId);
    const likeClass = userLiked ? 'text-red-500' : 'hover:text-red-400';
    const likeIcon = userLiked ? 'fas fa-heart' : 'far fa-heart';
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
                <img src="${post.author_avatar || 'https://ui-avatars.com/api/?background=random'}" class="w-10 h-10 rounded-full border border-gray-600">
                <div>
                    <h4 class="font-bold text-white text-sm">${sanitizeText(post.author_name) || 'Anonyme'}</h4>
                    <p class="text-xs text-gray-500">${timeAgo} • ${sanitizeText(post.tag) || 'Général'}</p>
                </div>
            </div>
            <span class="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">${post.type || 'Discussion'}</span>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">${sanitizeText(post.title)}</h3>
        <p class="text-gray-400 text-sm mb-4 line-clamp-3 whitespace-pre-line">${sanitizeText(post.content)}</p>
        <div class="flex items-center gap-6 text-xs text-gray-500 border-t border-gray-800/50 pt-4">
            <button class="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <i class="far fa-comment-alt"></i> ${post.comments_count || 0} rép.
            </button>
            <button class="flex items-center gap-2 ${likeClass} transition-colors like-btn" data-post-id="${post.id}">
                <i class="${likeIcon}"></i> ${post.likes_by ? post.likes_by.length : 0}
            </button>
            <button class="ml-auto hover:text-white hover:text-indigo-400">
                <i class="fas fa-share"></i> Republier
            </button>
        </div>
    `;
    
    // Ajouter les event listeners
    const likeBtn = card.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(post.id);
        });
    }
    
    // Ajouter le clic pour ouvrir le détail
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.like-btn') && !e.target.closest('button')) {
            openPostDetail(post);
        }
    });
    
    return card;
}

async function loadGroups() {
    try {
        const { data, error } = await supabase
            .from('community_groups')
            .select('*')
            .order('member_count', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error('Erreur chargement groupes:', error);
            if(ui.groupsList) ui.groupsList.innerHTML = '<div class="text-center py-4 text-gray-500">Erreur de chargement</div>';
            return;
        }
        
        groups = data || [];
        renderGroups();
    } catch (e) {
        console.error('Erreur groupes:', e);
        if(ui.groupsList) ui.groupsList.innerHTML = '<div class="text-center py-4 text-gray-500">Erreur de chargement</div>';
    }
}

function renderGroups() {
    if (!ui.groupsList) return;
    
    if (!groups || groups.length === 0) {
        ui.groupsList.innerHTML = '<div class="text-center py-4 text-gray-500">Aucun groupe pour le moment</div>';
        return;
    }
    
    ui.groupsList.innerHTML = '';
    
    groups.forEach(group => {
        const groupCard = createGroupCard(group);
        ui.groupsList.appendChild(groupCard);
    });
}

function createGroupCard(group) {
    const card = document.createElement('div');
    card.className = 'bg-gray-800/50 p-4 rounded-xl border border-gray-700 hover:border-indigo-500/30 transition-all cursor-pointer mb-3';
    
    card.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 flex items-center justify-center text-lg border border-indigo-500/30">
                <i class="fas fa-users"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-white text-sm">${sanitizeText(group.name)}</h4>
                <p class="text-xs text-gray-400">${group.member_count || 0} membres</p>
            </div>
            <button class="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded hover:bg-indigo-500/30 transition-colors">
                Rejoindre
            </button>
        </div>
    `;
    
    return card;
}

async function createPost() {
    const title = ui.postTitle?.value?.trim();
    const content = ui.postContent?.value?.trim();
    const tag = ui.postTag?.value?.trim();
    const type = 'discussion'; // Type par défaut
    
    if (!title || !content) {
        showMessage("Titre et contenu requis", "error");
        return;
    }
    
    if (!ui.submitPost) return;
    
    ui.submitPost.disabled = true;
    ui.submitPost.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';
    
    try {
        const { data, error } = await supabase
            .from('community_posts')
            .insert({
                title,
                content,
                tag: tag || 'Général',
                type,
                user_id: currentUserId,
                author_name: currentUserData.first_name || 'Utilisateur',
                author_avatar: currentUserData.photo_url,
                likes_by: [],
                comments_count: 0
            })
            .select();
            
        if (error) {
            throw error;
        }
        
        // Fermer le modal et réinitialiser
        if (ui.newPostModal) ui.newPostModal.classList.add('hidden');
        if (ui.postTitle) ui.postTitle.value = '';
        if (ui.postContent) ui.postContent.value = '';
        if (ui.postTag) ui.postTag.value = '';
        
        showMessage("Publié avec succès !", "success");
        await loadPosts(); // Recharger les posts
        
    } catch (e) {
        console.error("Erreur création post:", e);
        showMessage("Impossible de publier. Réessayez.", "error");
    } finally {
        if (ui.submitPost) {
            ui.submitPost.disabled = false;
            ui.submitPost.innerHTML = '<i class="fas fa-paper-plane"></i> Publier';
        }
    }
}

async function toggleLike(postId) {
    try {
        // Récupérer le post actuel
        const { data: postData, error: fetchError } = await supabase
            .from('community_posts')
            .select('likes_by')
            .eq('id', postId)
            .single();
            
        if (fetchError) throw fetchError;
        
        const currentLikes = postData.likes_by || [];
        const isLiked = currentLikes.includes(currentUserId);
        
        // Mettre à jour les likes
        const newLikes = isLiked 
            ? currentLikes.filter(id => id !== currentUserId)
            : [...currentLikes, currentUserId];
            
        const { error: updateError } = await supabase
            .from('community_posts')
            .update({ likes_by: newLikes })
            .eq('id', postId);
            
        if (updateError) throw updateError;
        
        // Recharger les posts pour mettre à jour l'affichage
        await loadPosts();
        
    } catch (e) {
        console.error('Erreur lors du like:', e);
        showMessage('Impossible de liker le post', 'error');
    }
}

async function createGroup() {
    const name = ui.newGroupName?.value?.trim();
    const description = ui.newGroupDesc?.value?.trim();
    
    if (!name) {
        showMessage("Nom du groupe requis", "error");
        return;
    }
    
    if (!ui.submitCreateGroup) return;
    
    ui.submitCreateGroup.disabled = true;
    ui.submitCreateGroup.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const { data, error } = await supabase
            .from('community_groups')
            .insert({
                name,
                description,
                icon: 'fa-users',
                color: '#6366f1',
                member_count: 1,
                created_at: new Date().toISOString()
            })
            .select();
            
        if (error) throw error;
        
        // Fermer le modal et réinitialiser
        if (ui.createGroupModal) ui.createGroupModal.classList.add('hidden');
        if (ui.newGroupName) ui.newGroupName.value = '';
        if (ui.newGroupDesc) ui.newGroupDesc.value = '';
        
        showMessage("Groupe créé avec succès !", "success");
        await loadGroups(); // Recharger les groupes
        
    } catch (e) {
        console.error("Erreur création groupe:", e);
        showMessage("Impossible de créer le groupe. Réessayez.", "error");
    } finally {
        if (ui.submitCreateGroup) {
            ui.submitCreateGroup.disabled = false;
            ui.submitCreateGroup.innerHTML = '<i class="fas fa-check"></i> Créer';
        }
    }
}

function setupEventListeners() {
    // Modal nouveau post
    if (ui.btnNewPost) {
        ui.btnNewPost.addEventListener('click', () => {
            if (ui.newPostModal) ui.newPostModal.classList.remove('hidden');
        });
    }
    
    if (ui.closePostModal) {
        ui.closePostModal.addEventListener('click', () => {
            if (ui.newPostModal) ui.newPostModal.classList.add('hidden');
        });
    }
    
    if (ui.submitPost) {
        ui.submitPost.addEventListener('click', createPost);
    }
    
    // Modal création groupe
    if (ui.btnCreateGroupHero) {
        ui.btnCreateGroupHero.addEventListener('click', () => {
            if (ui.createGroupModal) ui.createGroupModal.classList.remove('hidden');
        });
    }
    
    if (ui.closeCreateGroupModal) {
        ui.closeCreateGroupModal.addEventListener('click', () => {
            if (ui.createGroupModal) ui.createGroupModal.classList.add('hidden');
        });
    }
    
    if (ui.submitCreateGroup) {
        ui.submitCreateGroup.addEventListener('click', createGroup);
    }
    
    // Modal détail et commentaires
    if (ui.closeDetailModal) {
        ui.closeDetailModal.addEventListener('click', () => {
            if (ui.detailModal) ui.detailModal.classList.add('hidden');
        });
    }
    
    if (ui.submitComment) {
        ui.submitComment.addEventListener('click', addComment);
    }
}

// Fonctions pour les détails et commentaires
let currentPostId = null;

async function openPostDetail(post) {
    currentPostId = post.id;
    if (!ui.detailModal || !ui.detailContent) return;
    
    ui.detailModal.classList.remove('hidden');
    ui.detailContent.innerHTML = `
        <div class="space-y-6">
            <div>
                <h2 class="text-2xl font-bold text-white mb-4">${sanitizeText(post.title)}</h2>
                <div class="flex items-center gap-3 mb-4">
                    <img src="${post.author_avatar || 'https://ui-avatars.com/api/?background=random'}" class="w-10 h-10 rounded-full border border-gray-600">
                    <div>
                        <h4 class="font-bold text-white text-sm">${sanitizeText(post.author_name) || 'Anonyme'}</h4>
                        <p class="text-xs text-gray-500">${post.created_at ? getTimeAgo(new Date(post.created_at)) : 'À l\'instant'}</p>
                    </div>
                </div>
                <p class="text-gray-300 whitespace-pre-line">${sanitizeText(post.content)}</p>
            </div>
            <div>
                <h3 class="text-lg font-bold text-white mb-4">Commentaires (${post.comments_count || 0})</h3>
                <div id="comments-list" class="space-y-4 mb-6"></div>
                <div class="flex gap-3">
                    <img src="${currentUserData.photo_url || 'https://ui-avatars.com/api/?name=' + currentUserData.first_name}" class="w-8 h-8 rounded-full border border-gray-600">
                    <div class="flex-1">
                        <textarea id="comment-input" placeholder="Ajouter un commentaire..." class="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 resize-none" rows="3"></textarea>
                        <div class="mt-2 flex justify-end">
                            <button id="submit-comment" class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
                                Commenter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Recharger les éléments UI après la mise à jour du HTML
    ui.commentInput = document.getElementById('comment-input');
    ui.submitComment = document.getElementById('submit-comment');
    
    if (ui.submitComment) {
        ui.submitComment.addEventListener('click', addComment);
    }
    
    await loadComments(post.id);
}

async function loadComments(postId) {
    try {
        const { data, error } = await supabase
            .from('community_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
            
        if (error) {
            console.error('Erreur chargement commentaires:', error);
            return;
        }
        
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        
        if (!data || data.length === 0) {
            commentsList.innerHTML = '<div class="text-center py-8 text-gray-500">Soyez le premier à commenter !</div>';
            return;
        }
        
        commentsList.innerHTML = '';
        data.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'bg-gray-800/30 p-4 rounded-xl border border-gray-800';
            commentDiv.innerHTML = `
                <div class="flex items-start gap-3">
                    <img src="${comment.author_avatar || 'https://ui-avatars.com/api/?background=random'}" class="w-8 h-8 rounded-full border border-gray-600">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="font-bold text-white text-sm">${sanitizeText(comment.author_name) || 'Anonyme'}</span>
                            <span class="text-xs text-gray-500">${comment.created_at ? getTimeAgo(new Date(comment.created_at)) : 'À l\'instant'}</span>
                        </div>
                        <p class="text-sm text-gray-300">${sanitizeText(comment.content)}</p>
                    </div>
                </div>
            `;
            commentsList.appendChild(commentDiv);
        });
    } catch (e) {
        console.error('Erreur commentaires:', e);
    }
}

async function addComment() {
    const content = ui.commentInput?.value?.trim();
    if (!content || !currentPostId) return;
    
    if (!ui.submitComment) return;
    
    ui.submitComment.disabled = true;
    ui.submitComment.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const { data, error } = await supabase
            .from('community_comments')
            .insert({
                post_id: currentPostId,
                content,
                author_id: currentUserId,
                author_name: currentUserData.first_name || 'Utilisateur',
                author_avatar: currentUserData.photo_url
            })
            .select();
            
        if (error) throw error;
        
        // Le trigger va automatiquement incrémenter le compteur
        // Réinitialiser et recharger
        if (ui.commentInput) ui.commentInput.value = '';
        await loadComments(currentPostId);
        await loadPosts(); // Recharger les posts pour mettre à jour le compteur
        
        showMessage("Commentaire ajouté !", "success");
        
    } catch (e) {
        console.error("Erreur commentaire:", e);
        showMessage("Impossible de commenter. Réessayez.", "error");
    } finally {
        if (ui.submitComment) {
            ui.submitComment.disabled = false;
            ui.submitComment.innerHTML = 'Commenter';
        }
    }
}

// Fonctions utilitaires
function sanitizeText(text) {
    if (!text) return '';
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    return `il y a ${diffDays}j`;
}
