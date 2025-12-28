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

// ✅ PERFORMANCE: Debounce function pour search inputs
export function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// ✅ CODE DUPLICATION: Centralize button loading state
export function setButtonLoading(button, isLoading, loadingText = 'Chargement...', defaultContent = null) {
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.dataset.originalContent = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        button.disabled = false;
        button.innerHTML = defaultContent || button.dataset.originalContent || '';
        delete button.dataset.originalContent;
    }
}

// ✅ CODE DUPLICATION: Modal management utility
export function createModalManager(modalElement) {
    return {
        show() {
            if (modalElement) modalElement.classList.remove('hidden');
        },
        hide() {
            if (modalElement) modalElement.classList.add('hidden');
        },
        toggle() {
            if (modalElement) modalElement.classList.toggle('hidden');
        },
        onClickOutside(callback) {
            if (modalElement) {
                modalElement.addEventListener('click', (e) => {
                    if (e.target === modalElement) {
                        callback();
                    }
                });
            }
        }
    };
}

// ✅ CODE DUPLICATION: Time utilities
export const TimeUtils = {
    /**
     * Convert minutes to milliseconds
     */
    minutesToMs(minutes) {
        return minutes * 60 * 1000;
    },

    /**
     * Convert milliseconds to minutes
     */
    msToMinutes(ms) {
        return Math.floor(ms / 60000);
    },

    /**
     * Format seconds to MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Get end of day timestamp
     */
    getEndOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    /**
     * Get start of day timestamp
     */
    getStartOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }
};

// ✅ CODE DUPLICATION: Empty state HTML generator
export function createEmptyState(icon, title, message) {
    return `
        <div class="text-center py-12 text-gray-400">
            <i class="fas ${icon} text-5xl mb-4 opacity-50"></i>
            <h3 class="text-xl font-semibold mb-2">${title}</h3>
            <p class="text-sm">${message}</p>
        </div>
    `;
}

// ✅ CODE DUPLICATION: Prevent default helper
export function handleFormSubmit(formElement, callback) {
    if (!formElement) return;

    formElement.addEventListener('submit', (e) => {
        e.preventDefault();
        if (callback && typeof callback === 'function') {
            callback(e);
        }
    });
}
