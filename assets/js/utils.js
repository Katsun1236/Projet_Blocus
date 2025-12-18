/**
 * Affiche un message toast à l'utilisateur
 * @param {string} message - Le texte à afficher
 * @param {string} type - 'success', 'error', ou 'info'
 */
export function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('message-box');
    
    // Si la boîte de message n'existe pas dans le DOM, on ne fait rien (ou on log)
    if (!messageBox) {
        console.warn("Element #message-box introuvable dans le DOM. Message non affiché :", message);
        alert(message); // Fallback basique
        return;
    }

    // Création de l'élément toast
    const toast = document.createElement('div');
    
    // Styles de base Tailwind
    let bgClass = 'bg-blue-600';
    let icon = 'fa-info-circle';

    if (type === 'success') {
        bgClass = 'bg-green-600';
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        bgClass = 'bg-red-600';
        icon = 'fa-exclamation-circle';
    }

    toast.className = `${bgClass} text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 mb-3 transform transition-all duration-300 translate-x-full opacity-0`;
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span class="font-medium">${message}</span>
    `;


    messageBox.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (messageBox.contains(toast)) {
                messageBox.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

/**
 * Formate une date Firestore ou JS standard
 * @param {any} dateObj 
 * @returns {string} Date formatée
 */
export function formatDate(dateObj) {
    if (!dateObj) return '';
    // Gestion timestamp Firestore
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}