export function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('message-box');

    if (!messageBox) {
        console.warn("Element #message-box introuvable dans le DOM. Message non affiché :", message);
        alert(message);
        return;
    }

    const toast = document.createElement('div');

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

export function formatDate(dateObj) {
    if (!dateObj) return '';
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}
