// ✅ PURE SUPABASE - Pas de wrappers Firestore
import { supabase } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate, debounce } from './utils.js';
import { initSpeedInsights } from './speed-insights.js';

// Initialize Speed Insights for performance monitoring
initSpeedInsights();

// ✅ CONSTANTS: Éviter les magic numbers
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB en bytes

// ✅ SECURITY: Types de fichiers autorisés pour uploads
const ALLOWED_FILE_TYPES = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Texte
    'text/plain',
    'text/csv',
    'text/markdown',
    // Images
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                            '.txt', '.md', '.csv', '.png', '.jpg', '.jpeg', '.gif',
                            '.webp', '.svg', '.zip', '.rar', '.7z'];

let currentUserId = null;
let currentFolder = 'root';
let coursesData = [];

const ui = {
    grid: document.getElementById('courses-grid'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    loader: document.getElementById('loader'),
    emptyState: document.getElementById('empty-state'),
    folderModal: document.getElementById('folder-modal'),
    folderInput: document.getElementById('folder-name-input'),
    btnCreateFolder: document.getElementById('btn-create-folder'),
    btnOpenFolderModal: document.getElementById('btn-open-folder-modal'),
    btnCloseFolderModal: document.getElementById('btn-close-folder-modal'),
    btnCancelFolder: document.getElementById('btn-cancel-folder')
};

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('courses');

    // ✅ PURE SUPABASE: Récupérer la session directement
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (session?.user) {
        currentUserId = session.user.id;
        await loadCourses();
    } else {
        window.location.href = '../auth/login.html';
    }

    setupEventListeners();
});

function setupEventListeners() {
    // ✅ PERFORMANCE: Debounce search input pour éviter appels excessifs
    if(ui.searchInput) {
        const debouncedFilter = debounce((value) => filterCourses(value), 300);
        ui.searchInput.addEventListener('input', (e) => debouncedFilter(e.target.value));
    }
    if(ui.sortSelect) ui.sortSelect.addEventListener('change', () => filterCourses(ui.searchInput.value));

    if (ui.uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            ui.uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            ui.uploadArea.addEventListener(eventName, () => ui.uploadArea.classList.add('border-indigo-500', 'bg-indigo-500/10'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            ui.uploadArea.addEventListener(eventName, () => ui.uploadArea.classList.remove('border-indigo-500', 'bg-indigo-500/10'), false);
        });
        ui.uploadArea.addEventListener('drop', handleDrop, false);
        ui.uploadArea.addEventListener('click', () => ui.fileInput.click());
    }

    if(ui.fileInput) ui.fileInput.addEventListener('change', handleFiles);

    const toggleFolderModal = (show) => ui.folderModal.classList.toggle('hidden', !show);
    if(ui.btnOpenFolderModal) ui.btnOpenFolderModal.onclick = () => toggleFolderModal(true);
    if(ui.btnCloseFolderModal) ui.btnCloseFolderModal.onclick = () => toggleFolderModal(false);
    if(ui.btnCancelFolder) ui.btnCancelFolder.onclick = () => toggleFolderModal(false);

    if(ui.btnCreateFolder) ui.btnCreateFolder.onclick = async () => {
        const name = ui.folderInput.value.trim();
        if(!name) return showMessage("Nom du dossier requis", "error");

        const btn = ui.btnCreateFolder;
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Création...`;

        try {
            // ✅ PURE SUPABASE: Insert directe
            const { error } = await supabase.from('courses').insert([{
                user_id: currentUserId,
                type: 'folder',
                name: name,
                parent_id: currentFolder
            }]);

            if (error) throw error;

            ui.folderInput.value = "";
            toggleFolderModal(false);
            showMessage("Dossier créé avec succès", "success");
            loadCourses();
        } catch(e) {
            console.error("Erreur création dossier:", e);
            showMessage("Impossible de créer le dossier. Réessayez.", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    };
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

async function loadCourses() {
    if (!currentUserId) return;

    ui.loader.classList.remove('hidden');
    ui.grid.classList.add('hidden');
    ui.emptyState.classList.add('hidden');

    try {
        // ✅ PURE SUPABASE: Query directe
        const { data: courses, error } = await supabase
            .from('courses')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('parent_id', currentFolder)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        coursesData = courses || [];

        updateBreadcrumbs();
        filterCourses(ui.searchInput ? ui.searchInput.value : '');

    } catch (error) {
        console.error("Erreur chargement:", error);
        showMessage("Impossible de charger les cours", "error");
    } finally {
        ui.loader.classList.add('hidden');
        ui.grid.classList.remove('hidden');
    }
}

function filterCourses(searchTerm) {
    const term = searchTerm.toLowerCase();
    const sortType = ui.sortSelect ? ui.sortSelect.value : 'date-desc';

    let filtered = coursesData.filter(item => {
        const name = (item.title || item.name || item.file_name || "").toLowerCase();
        return name.includes(term);
    });

    filtered.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;

        // ✅ PURE SUPABASE: Les timestamps sont des strings ISO
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        const nameA = (a.title || a.name || "").toLowerCase();
        const nameB = (b.title || b.name || "").toLowerCase();

        switch (sortType) {
            case 'date-desc': return dateB - dateA;
            case 'date-asc': return dateA - dateB;
            case 'name-asc': return nameA.localeCompare(nameB);
            case 'name-desc': return nameB.localeCompare(nameA);
            default: return 0;
        }
    });

    renderGrid(filtered);
}

function renderGrid(items) {
    ui.grid.innerHTML = '';

    if (items.length === 0) {
        ui.emptyState.classList.remove('hidden');
        return;
    } else {
        ui.emptyState.classList.add('hidden');
    }

    if (currentFolder !== 'root') {
        const backCard = document.createElement('div');
        backCard.className = 'content-glass rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-white/5 border border-dashed border-gray-700 h-[100px] group';
        backCard.innerHTML = `<div class="text-center text-gray-400 group-hover:text-white"><i class="fas fa-reply text-xl mb-1"></i><p class="text-xs">Retour</p></div>`;
        backCard.onclick = goUpLevel;
        ui.grid.appendChild(backCard);
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'content-glass rounded-xl p-4 relative group hover:border-indigo-500/50 transition-all border border-transparent';

        const isFolder = item.type === 'folder';
        const icon = isFolder ? 'fa-folder text-yellow-400' : 'fa-file-pdf text-red-400';
        const title = escapeHtml(item.title || item.name || item.file_name || "Sans titre");
        const date = formatDate(item.created_at);
        const size = item.size ? (item.size / 1024 / 1024).toFixed(2) + ' MB' : '';

        el.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="p-3 rounded-lg bg-gray-800/50 text-xl ${isFolder ? 'text-yellow-400' : 'text-red-400'}">
                    <i class="fas ${icon}"></i>
                </div>
                <button class="delete-btn opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-opacity" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <h3 class="font-bold text-gray-200 text-sm mb-1 truncate" title="${title}">${title}</h3>
            <div class="flex justify-between items-center text-[10px] text-gray-500">
                <span>${date}</span>
                <span>${size}</span>
            </div>
        `;

        if (isFolder) {
            el.addEventListener('click', (e) => {
                if(!e.target.closest('button')) enterFolder(item.id, title);
            });
        } else {
            el.addEventListener('click', (e) => {
                if(!e.target.closest('button') && item.url) window.open(item.url, '_blank');
            });
        }

        const delBtn = el.querySelector('.delete-btn');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteItem(item);
        };

        ui.grid.appendChild(el);
    });
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    // ✅ BUG FIX: Valider les fichiers avant upload
    handleFiles({ target: { files: files } });
}

async function handleFiles(e) {
    const files = [...e.target.files];
    if (files.length === 0) return;

    ui.uploadArea.classList.add('opacity-50', 'pointer-events-none');
    showMessage(`Envoi de ${files.length} fichier(s)...`, "info");

    let successCount = 0;
    let errorCount = 0;

    // ✅ PERFORMANCE: Paralléliser les uploads au lieu de séquentiel (beaucoup plus rapide)
    const uploadPromises = Array.from(files).map(async (file) => {
        // ✅ SECURITY: Validation taille fichier
        if (file.size > MAX_FILE_SIZE) {
            showMessage(`Fichier trop lourd (max ${MAX_FILE_SIZE / (1024 * 1024)}MB): ${file.name}`, "error");
            return { success: false, file: file.name };
        }

        // ✅ SECURITY: Validation type de fichier
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
            showMessage(`Type de fichier non autorisé: ${file.name}`, "error");
            return { success: false, file: file.name };
        }

        try {
            // ✅ PURE SUPABASE: Upload vers Supabase Storage
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${currentUserId}/courses/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('courses')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Récupérer l'URL publique
            const { data: urlData } = supabase.storage
                .from('courses')
                .getPublicUrl(filePath);

            const downloadURL = urlData.publicUrl;

            // Sauvegarder dans la base de données
            const { error: insertError } = await supabase.from('courses').insert([{
                user_id: currentUserId,
                type: 'file',
                title: file.name,
                file_name: file.name,
                url: downloadURL,
                storage_path: filePath,
                size: file.size,
                parent_id: currentFolder
            }]);

            if (insertError) throw insertError;

            return { success: true, file: file.name };
        } catch (error) {
            console.error("Erreur upload:", error);
            showMessage(`Échec: ${file.name}`, "error");
            return { success: false, file: file.name };
        }
    });

    const results = await Promise.allSettled(uploadPromises);
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
        } else {
            errorCount++;
        }
    });

    if (successCount > 0) {
        showMessage(`${successCount} fichier(s) envoyé(s) avec succès !`, "success");
    }
    if (errorCount > 0) {
        showMessage(`${errorCount} fichier(s) ont échoué`, "error");
    }

    ui.uploadArea.classList.remove('opacity-50', 'pointer-events-none');
    ui.fileInput.value = '';
    loadCourses();
}

async function deleteItem(item) {
    if (!confirm(`Supprimer définitivement "${item.title || item.name}" ?`)) return;

    const itemName = item.title || item.name;
    showMessage(`Suppression de "${itemName}"...`, "info");

    try {
        // ✅ PURE SUPABASE: Suppression du fichier storage si nécessaire
        if (item.type === 'file' && item.storage_path) {
            const { error: storageError } = await supabase.storage
                .from('courses')
                .remove([item.storage_path]);

            if (storageError) console.error("Erreur suppression storage:", storageError);
        }

        // ✅ PURE SUPABASE: Suppression de la base de données
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', item.id);

        if (error) throw error;

        showMessage(`"${itemName}" supprimé avec succès`, "success");
        loadCourses();
    } catch (e) {
        console.error("Erreur suppression:", e);
        showMessage(`Impossible de supprimer "${itemName}". Réessayez.`, "error");
    }
}

function enterFolder(folderId, folderName) {
    currentFolder = folderId;
    loadCourses();
    // ✅ SECURITY & PERFORMANCE: Avoid innerHTML += and XSS
    const separator = document.createElement('span');
    separator.className = 'mx-2 text-gray-600';
    separator.textContent = '/';
    const folderSpan = document.createElement('span');
    folderSpan.className = 'text-white';
    folderSpan.textContent = folderName;
    ui.breadcrumbs.appendChild(separator);
    ui.breadcrumbs.appendChild(folderSpan);
}

async function goUpLevel() {
    if (currentFolder === 'root') return;

    try {
        // ✅ PURE SUPABASE: Récupérer le parent_id
        const { data, error } = await supabase
            .from('courses')
            .select('parent_id')
            .eq('id', currentFolder)
            .single();

        if (error) throw error;

        if (data) {
            currentFolder = data.parent_id || 'root';
        } else {
            currentFolder = 'root';
        }

        ui.breadcrumbs.innerHTML = `<span class="cursor-pointer hover:text-white" onclick="location.reload()">Mes Cours</span>`;
        loadCourses();
    } catch(e) {
        currentFolder = 'root';
        loadCourses();
    }
}

function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
