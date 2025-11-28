import 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const pdfjsLib = window.pdfjsLib;

// Configuration PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export { pdfjsLib };

/**
 * Affiche une notification (Toast)
 * @param {string} message - Le message à afficher
 * @param {boolean} isError - Si true, affiche en rouge, sinon en vert
 */
export function showToast(message, isError = false) {
    let box = document.getElementById('global-message-box');

    // Créer le conteneur s'il n'existe pas
    if (!box) {
        box = document.createElement('div');
        box.id = 'global-message-box';
        box.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(box);
    }

    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-2xl text-white flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-500 pointer-events-auto border backdrop-blur-md ${isError ? 'bg-gray-900/90 border-red-500/30' : 'bg-gray-900/90 border-green-500/30'}`;

    toast.innerHTML = `
        <div class="${isError ? 'text-red-400' : 'text-green-400'} text-xl">
            <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        </div>
        <p class="font-medium text-sm">${message}</p>
    `;

    box.appendChild(toast);

    // Animation d'entrée
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    // Suppression automatique
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/**
 * Extrait le texte d'un fichier PDF via son URL
 * @param {string} url - URL du fichier PDF
 * @returns {Promise<string>} - Le texte extrait
 */
export async function extractTextFromPdf(url) {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText;
    } catch (error) {
        console.error("Erreur PDF.js:", error);
        throw new Error("Impossible de lire le PDF. Vérifiez qu'il est accessible.");
    }
}

/**
 * Formate une date en "il y a X temps"
 * @param {Date|Timestamp} date - La date à formater
 * @returns {string}
 */
export function timeAgo(date) {
    if (!date) return 'récemment';

    // Gestion des Timestamps Firestore
    const d = date.toDate ? date.toDate() : new Date(date);

    const seconds = Math.floor((new Date() - d) / 1000);

    if (seconds < 60) return "à l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} j`;
}

/**
 * Formate une date en format français (ex: 28 novembre 2025)
 * @param {Date|Timestamp} date 
 * @returns {string}
 */
export function formatDate(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
