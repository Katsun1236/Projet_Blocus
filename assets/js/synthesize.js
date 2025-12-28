import { auth, db, storage, supabase, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, deleteField, ref, uploadBytesResumable, getDownloadURL } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';

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

document.addEventListener('DOMContentLoaded', () => {
    initLayout('synthesize');

    document.querySelectorAll('select').forEach(s => {
        s.addEventListener('change', () => s.value ? s.classList.add('has-value') : s.classList.remove('has-value'));
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.id;
            await initPage();
            loadSyntheses();
            loadFiles();
            setupNotifications(currentUserId);
        } else {
            window.location.href = '../auth/login.html';
        }
    });
});

async function initPage() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if(ui.userName) ui.userName.textContent = data.firstName || "Étudiant";
            if(ui.userAvatar) ui.userAvatar.src = data.photoURL || 'https://ui-avatars.com/api/?background=random';
        }
    } catch(e) {}
}

async function loadSyntheses() {
    const q = query(collection(db, 'users', currentUserId, 'syntheses'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    ui.grid.innerHTML = '';
    if (snapshot.empty) {
        ui.grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500 opacity-50"><p>Aucune synthèse pour l'instant.</p></div>`;
        return;
    }

    snapshot.forEach(docSnap => {
        const synth = docSnap.data();
        const dateStr = formatDate(synth.createdAt);

        const card = document.createElement('div');
        card.className = 'synth-card content-glass rounded-2xl p-6 flex flex-col justify-between h-full relative group cursor-pointer border border-gray-800 hover:border-pink-500/30 transition-all';
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center text-pink-400">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <span class="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400 border border-gray-700">${synth.formatLabel || 'Résumé'}</span>
                </div>
                <h3 class="font-bold text-white text-lg mb-2 line-clamp-2">${synth.title}</h3>
                <p class="text-xs text-gray-400 mb-1"><i class="far fa-clock mr-1"></i> ${dateStr}</p>
                <p class="text-xs text-gray-500 truncate">Source: ${synth.sourceType}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-pink-400 font-bold group-hover:text-pink-300">
                <span>Lire la fiche</span>
                <i class="fas fa-arrow-right"></i>
            </div>
        `;
        card.onclick = () => openViewer(docSnap.id, synth);
        ui.grid.appendChild(card);
    });
}

async function loadFiles() {
    const q = query(collection(db, 'users', currentUserId, 'courses'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    ui.fileSelect.innerHTML = '<option value="">-- Choisir un fichier --</option>';
    snapshot.forEach(doc => {
        const f = doc.data();
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.text = f.title || f.fileName;
        ui.fileSelect.appendChild(opt);
    });
}

function openViewer(id, synth) {
    currentSynthId = id;
    ui.dashboard.classList.add('hidden');
    ui.viewer.classList.remove('hidden');

    ui.viewTitle.textContent = synth.title;
    ui.viewBadge.textContent = (synth.formatLabel || 'RÉSUMÉ').toUpperCase();
    ui.viewMeta.textContent = `Généré le ${formatDate(synth.createdAt)} • Source: ${synth.sourceName || 'Inconnue'}`;

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
        await deleteDoc(doc(db, 'users', currentUserId, 'syntheses', currentSynthId));
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
        const source = document.querySelector('input[name="synth-source"]:checked').value;
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
            const generateContent = httpsCallable(functions, 'generateContent');

            const response = await generateContent({
                mode: 'synthesis',
                topic: sourceName,
                data: context,
                options: {
                    format: format,
                    length: length
                }
            });

            const content = response.data.content;

            await addDoc(collection(db, 'users', currentUserId, 'syntheses'), {
                title: title,
                sourceType: source,
                sourceName: sourceName,
                format: format,
                formatLabel: ui.formatSelect.options[ui.formatSelect.selectedIndex].text,
                content: content,
                createdAt: serverTimestamp()
            });

            toggleModal(false);
            ui.titleInput.value = "";
            showMessage("Synthèse générée !", "success");
            loadSyntheses();

        } catch (e) {
            console.error(e);
            showMessage("Erreur IA : " + (e.message || "Une erreur est survenue"), "error");
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

function setupNotifications(userId) {
    const q = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(5));
    onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(d => d.data());
        if (notifs.length > 0) {
            ui.notifBadge.classList.remove('hidden');
            ui.notifList.innerHTML = notifs.map(n => `<div class="p-3 border-b border-gray-800 text-left text-sm text-gray-300">${n.message}</div>`).join('');
        } else {
            ui.notifBadge.classList.add('hidden');
        }
    });
}
if(ui.notifBtn) ui.notifBtn.onclick = (e) => { e.stopPropagation(); ui.notifDropdown.classList.toggle('hidden'); };
window.onclick = (e) => { if(!ui.notifDropdown.contains(e.target) && !ui.notifBtn.contains(e.target)) ui.notifDropdown.classList.add('hidden'); };
