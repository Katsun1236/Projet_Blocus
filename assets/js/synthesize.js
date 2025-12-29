// ✅ PURE SUPABASE - Pas de wrappers Firestore
import { supabase } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { initSpeedInsights } from './speed-insights.js';

// Initialize Speed Insights for performance monitoring
initSpeedInsights();

let currentUserId = null;
let currentSynthId = null;

const ui = {
    dashboard: document.getElementById('synth-dashboard'),
    viewer: document.getElementById('synth-viewer'),
    grid: document.getElementById('synth-grid'),
    modal: document.getElementById('new-synth-modal'),
    viewTitle: document.getElementById('view-title'),
    viewMeta: document.getElementById('view-meta'),
    viewContent: document.getElementById('view-content'),
    viewBadge: document.getElementById('view-type-badge'),
    titleInput: document.getElementById('synth-title-input'),
    sourceRadios: document.getElementsByName('synth-source'),
    containers: {
        file: document.getElementById('source-file-container'),
        text: document.getElementById('source-text-container'),
        topic: document.getElementById('source-topic-container')
    },
    fileSelect: document.getElementById('synth-file-select'),
    textInput: document.getElementById('synth-text-input'),
    topicInput: document.getElementById('synth-topic-input'),
    formatSelect: document.getElementById('synth-format'),
    lengthSelect: document.getElementById('synth-length'),
    loadingBar: document.getElementById('loading-bar-container'),
    btnOpenHero: document.getElementById('btn-new-synth-hero'),
    btnOpenHeader: document.getElementById('btn-new-synth-header'),
    btnCloseModal: document.getElementById('close-modal-btn'),
    btnCancel: document.getElementById('cancel-synth-btn'),
    btnGenerate: document.getElementById('generate-synth-btn'),
    btnCloseViewer: document.getElementById('close-viewer-btn'),
    btnPrint: document.getElementById('print-btn'),
    btnDelete: document.getElementById('delete-current-synth'),
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    notifBtn: document.getElementById('notif-btn'),
    notifBadge: document.getElementById('notif-badge'),
    notifDropdown: document.getElementById('notif-dropdown'),
    notifList: document.getElementById('notifications-list')
};

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('synthesize');

    document.querySelectorAll('select').forEach(s => {
        s.addEventListener('change', () => s.value ? s.classList.add('has-value') : s.classList.remove('has-value'));
    });

    // ✅ PURE SUPABASE: Récupérer la session directement
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (session?.user) {
        currentUserId = session.user.id;
        await initPage();
        loadSyntheses();
        loadFiles();
        setupNotifications(currentUserId);
    } else {
        window.location.href = '../auth/login.html';
    }
});

async function initPage() {
    try {
        // ✅ PURE SUPABASE: Récupérer user directement avec snake_case
        const { data, error } = await supabase
            .from('users')
            .select('first_name, photo_url')
            .eq('id', currentUserId)
            .single();

        if (error) throw error;

        if (data) {
            if(ui.userName) ui.userName.textContent = data.first_name || "Étudiant";
            if(ui.userAvatar) ui.userAvatar.src = data.photo_url || 'https://ui-avatars.com/api/?background=random';
        }
    } catch(e) {
        // ✅ ERROR HANDLING: Log l'erreur (non bloquant pour l'UI)
        console.error('Erreur lors du chargement du profil utilisateur:', e);
    }
}

async function loadSyntheses() {
    // ✅ PURE SUPABASE: Query directe sans wrapper
    const { data: syntheses, error } = await supabase
        .from('syntheses')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erreur chargement synthèses:', error);
        ui.grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500 opacity-50"><p>Erreur de chargement</p></div>`;
        return;
    }

    ui.grid.innerHTML = '';
    if (!syntheses || syntheses.length === 0) {
        ui.grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500 opacity-50"><p>Aucune synthèse pour l'instant.</p></div>`;
        return;
    }

    syntheses.forEach(synth => {
        const dateStr = formatDate(synth.created_at);

        const card = document.createElement('div');
        card.className = 'synth-card content-glass rounded-2xl p-6 flex flex-col justify-between h-full relative group cursor-pointer border border-gray-800 hover:border-pink-500/30 transition-all';
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center text-pink-400">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <span class="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400 border border-gray-700">${synth.format_label || 'Résumé'}</span>
                </div>
                <h3 class="font-bold text-white text-lg mb-2 line-clamp-2">${synth.title}</h3>
                <p class="text-xs text-gray-400 mb-1"><i class="far fa-clock mr-1"></i> ${dateStr}</p>
                <p class="text-xs text-gray-500 truncate">Source: ${synth.source_type}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-pink-400 font-bold group-hover:text-pink-300">
                <span>Lire la fiche</span>
                <i class="fas fa-arrow-right"></i>
            </div>
        `;
        card.onclick = () => openViewer(synth.id, synth);
        ui.grid.appendChild(card);
    });
}

async function loadFiles() {
    // ✅ PURE SUPABASE: Query directe
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    ui.fileSelect.innerHTML = '<option value="">-- Choisir un fichier --</option>';

    if (error) {
        console.error('Erreur chargement fichiers:', error);
        return;
    }

    if (courses) {
        courses.forEach(course => {
            const opt = document.createElement('option');
            opt.value = course.id;
            opt.text = course.title || course.file_name;
            ui.fileSelect.appendChild(opt);
        });
    }
}

function openViewer(id, synth) {
    currentSynthId = id;
    ui.dashboard.classList.add('hidden');
    ui.viewer.classList.remove('hidden');

    // ✅ PURE SUPABASE: Utiliser snake_case
    ui.viewTitle.textContent = synth.title;
    ui.viewBadge.textContent = (synth.format_label || 'RÉSUMÉ').toUpperCase();
    ui.viewMeta.textContent = `Généré le ${formatDate(synth.created_at)} • Source: ${synth.source_name || 'Inconnue'}`;

    // ✅ SÉCURISÉ: Utiliser textContent au lieu de innerHTML pour éviter XSS
    // Si le contenu contient du HTML formaté de Gemini, on utilise DOMPurify
    if (synth.content?.includes('<')) {
        // Fallback: sanitize si DOMPurify disponible, sinon textContent
        if (typeof DOMPurify !== 'undefined') {
            ui.viewContent.innerHTML = DOMPurify.sanitize(synth.content);
        } else {
            ui.viewContent.textContent = synth.content;
        }
    } else {
        ui.viewContent.textContent = synth.content || '';
    }
}

ui.btnCloseViewer.onclick = () => {
    ui.viewer.classList.add('hidden');
    ui.dashboard.classList.remove('hidden');
};

ui.btnPrint.onclick = () => window.print();

ui.btnDelete.onclick = async () => {
    if(confirm("Supprimer cette synthèse ?")) {
        // ✅ PURE SUPABASE: Suppression directe
        const { error } = await supabase
            .from('syntheses')
            .delete()
            .eq('id', currentSynthId);

        if (error) {
            console.error('Erreur suppression:', error);
            showMessage("Erreur lors de la suppression", "error");
            return;
        }

        ui.viewer.classList.add('hidden');
        ui.dashboard.classList.remove('hidden');
        loadSyntheses();
        showMessage("Synthèse supprimée", "success");
    }
};

if (ui.btnGenerate) {
    ui.btnGenerate.onclick = async () => {
        const btn = ui.btnGenerate;
        const originalHtml = btn.innerHTML;
        const title = ui.titleInput.value.trim() || "Nouvelle Synthèse";
        const sourceElement = document.querySelector('input[name="synth-source"]:checked');

        if (!sourceElement) return showMessage("Sélectionnez une source", "error");
        const source = sourceElement.value;
        const format = ui.formatSelect.value;
        const length = ui.lengthSelect.value;

        let context = "";
        let sourceName = "";

        if (source === 'topic') {
            context = ui.topicInput.value.trim();
            sourceName = context;
            if (!context) return showMessage("Entrez un sujet", "error");
        } else if (source === 'text') {
            context = ui.textInput.value.trim();
            sourceName = "Texte collé";
            if (!context) return showMessage("Collez du texte", "error");
        } else {
            const sel = ui.fileSelect;
            if (!sel.value) return showMessage("Sélectionnez un fichier", "error");
            sourceName = sel.options[sel.selectedIndex].text;
            context = `Fichier intitulé : "${sourceName}". (Le contenu complet n'est pas encore accessible, baser sur le titre)`;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Rédaction...`;
        ui.loadingBar.classList.remove('hidden');

        try {
            // ✅ Récupérer le token JWT pour l'authentification
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            console.log('🔍 === DEBUGGING JWT ===');
            console.log('📦 Session exists:', !!session);
            console.log('📦 Session error:', sessionError);

            if (session) {
                console.log('👤 User ID:', session.user?.id);
                console.log('📧 User email:', session.user?.email);
                console.log('🔑 Access token (first 20 chars):', session.access_token?.substring(0, 20) + '...');
                console.log('🔑 Token length:', session.access_token?.length);
                console.log('⏰ Token expires at:', new Date(session.expires_at * 1000).toLocaleString());
                console.log('⏰ Current time:', new Date().toLocaleString());
                console.log('⚠️ Token expired?', session.expires_at * 1000 < Date.now());
            }

            if (!session) {
                throw new Error('Non authentifié. Veuillez vous reconnecter.');
            }

            const requestBody = {
                mode: 'synthesis',
                topic: sourceName,
                data: context,
                options: {
                    format: format,
                    length: length
                }
            };

            console.log('📤 Request body:', requestBody);
            console.log('📤 Authorization header:', `Bearer ${session.access_token.substring(0, 20)}...`);

            // ✅ DEBUGGING: Utiliser fetch direct pour voir les erreurs complètes
            const SUPABASE_URL = 'https://vhtzudbcfyxnwmpyjyqw.supabase.co';
            const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-synthesis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

            const responseData = await response.json();
            console.log('📥 Response data:', responseData);

            if (!response.ok) {
                console.error('🔴 Edge Function HTTP Error:', response.status, response.statusText);
                console.error('🔴 Response body:', responseData);
                throw new Error(responseData.error || 'Erreur lors de la génération de la synthèse');
            }

            const data = responseData;

            // Sauvegarder la synthèse dans la base de données
            const { error: insertError } = await supabase.from('syntheses').insert([{
                user_id: currentUserId,
                title: title,
                source_type: source,
                source_name: sourceName,
                format: format,
                format_label: ui.formatSelect.options[ui.formatSelect.selectedIndex].text,
                content: data.content
            }]);

            if (insertError) throw insertError;

            toggleModal(false);
            ui.titleInput.value = "";
            showMessage("Synthèse générée avec succès !", "success");
            loadSyntheses();

        } catch (e) {
            console.error(e);
            showMessage("Erreur : " + (e.message || "Une erreur est survenue"), "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            ui.loadingBar.classList.add('hidden');
        }
    };
}

const toggleModal = (show) => ui.modal.classList.toggle('hidden', !show);
if(ui.btnOpenHero) ui.btnOpenHero.onclick = () => toggleModal(true);
if(ui.btnOpenHeader) ui.btnOpenHeader.onclick = () => toggleModal(true);
if(ui.btnCloseModal) ui.btnCloseModal.onclick = () => toggleModal(false);
if(ui.btnCancel) ui.btnCancel.onclick = () => toggleModal(false);

ui.sourceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        Object.values(ui.containers).forEach(c => c.classList.add('hidden'));
        ui.containers[e.target.value].classList.remove('hidden');
    });
});

async function setupNotifications(userId) {
    // ✅ PURE SUPABASE: Query directe sans wrapper
    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Erreur chargement notifications:', error);
        return;
    }

    if (notifications && notifications.length > 0) {
        ui.notifBadge.classList.remove('hidden');
        ui.notifList.innerHTML = notifications.map(n => `<div class="p-3 border-b border-gray-800 text-left text-sm text-gray-300">${n.message}</div>`).join('');
    } else {
        ui.notifBadge.classList.add('hidden');
    }

    // ✅ S'abonner aux changements en temps réel
    supabase
        .channel('notifications_changes')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log('Notification changed:', payload);
                setupNotifications(userId); // Recharger
            }
        )
        .subscribe();
}
if(ui.notifBtn) ui.notifBtn.onclick = (e) => { e.stopPropagation(); ui.notifDropdown.classList.toggle('hidden'); };
window.onclick = (e) => { if(!ui.notifDropdown.contains(e.target) && !ui.notifBtn.contains(e.target)) ui.notifDropdown.classList.add('hidden'); };
