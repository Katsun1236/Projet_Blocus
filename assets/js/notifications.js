/**
 * Notification System
 * Gère les notifications push, rappels et alertes
 */

// Request notification permission
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Send browser notification
export function sendNotification(title, options = {}) {
    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    const notification = new Notification(title, {
        icon: '/assets/images/locus-logo.png',
        badge: '/assets/images/locus-neon-favicon.png',
        vibrate: [200, 100, 200],
        ...options
    });

    notification.onclick = () => {
        window.focus();
        if (options.url) {
            window.location.href = options.url;
        }
        notification.close();
    };

    return notification;
}

// Notification types
export const NotificationTypes = {
    // Rappels de révision
    STUDY_REMINDER: {
        title: '📚 C\'est l\'heure de réviser!',
        body: 'Tu as prévu de réviser maintenant. Reste concentré!',
        icon: '📚'
    },

    // Flashcards à réviser
    FLASHCARDS_DUE: {
        title: '🗂️ Flashcards à réviser',
        body: (count) => `Tu as ${count} flashcards à réviser aujourd'hui`,
        icon: '🗂️'
    },

    // Streak en danger
    STREAK_WARNING: {
        title: '🔥 Attention au streak!',
        body: 'Tu n\'as pas encore révisé aujourd\'hui. Ne casse pas ton streak!',
        icon: '⚠️'
    },

    // Nouveau contenu dans groupe
    NEW_GROUP_CONTENT: {
        title: '👥 Nouveau dans ton groupe',
        body: (groupName) => `Nouveau contenu dans ${groupName}`,
        icon: '👥'
    },

    // Deadline approchant
    DEADLINE_APPROACHING: {
        title: '⏰ Deadline approchant!',
        body: (days) => `Deadline dans ${days} jour${days > 1 ? 's' : ''}`,
        icon: '⏰'
    },

    // Accomplissement
    ACHIEVEMENT: {
        title: '🎉 Accomplissement débloqué!',
        body: (achievement) => achievement,
        icon: '🎉'
    }
};

// Schedule notifications
export class NotificationScheduler {
    constructor(userId) {
        this.userId = userId;
        this.scheduled = [];
    }

    // Planifier rappel de révision
    scheduleStudyReminder(time) {
        const now = new Date();
        const targetTime = new Date(time);
        const delay = targetTime - now;

        if (delay <= 0) return;

        const timeoutId = setTimeout(() => {
            sendNotification(
                NotificationTypes.STUDY_REMINDER.title,
                {
                    body: NotificationTypes.STUDY_REMINDER.body,
                    tag: 'study-reminder',
                    requireInteraction: true
                }
            );
        }, delay);

        this.scheduled.push({ id: 'study-reminder', timeoutId });
    }

    // Rappel quotidien de streak
    scheduleDailyStreakReminder() {
        // Rappel à 20h si pas encore révisé aujourd'hui
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(20, 0, 0, 0);

        if (reminderTime < now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const delay = reminderTime - now;

        const timeoutId = setTimeout(() => {
            this.checkTodayActivity().then(hasActivity => {
                if (!hasActivity) {
                    sendNotification(
                        NotificationTypes.STREAK_WARNING.title,
                        {
                            body: NotificationTypes.STREAK_WARNING.body,
                            tag: 'streak-warning',
                            requireInteraction: true,
                            url: '/pages/app/dashboard.html'
                        }
                    );
                }
            });

            // Reprogrammer pour demain
            this.scheduleDailyStreakReminder();
        }, delay);

        this.scheduled.push({ id: 'daily-streak', timeoutId });
    }

    // Vérifier activité du jour
    async checkTodayActivity() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            const userDoc = await getDoc(doc(db, 'users', this.userId));
            if (!userDoc.exists()) return false;

            const lastActivity = userDoc.data().lastActivity;
            if (!lastActivity) return false;

            const lastActivityDate = lastActivity.toDate();
            return lastActivityDate >= today;
        } catch (error) {
            console.error('Error checking activity:', error);
            return false;
        }
    }

    // Annuler toutes les notifications
    cancelAll() {
        this.scheduled.forEach(({ timeoutId }) => clearTimeout(timeoutId));
        this.scheduled = [];
    }
}

// In-app notifications (toast)
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');

    const colors = {
        success: 'from-green-600 to-emerald-600',
        error: 'from-red-600 to-rose-600',
        warning: 'from-yellow-600 to-orange-600',
        info: 'from-indigo-600 to-purple-600'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.className = `fixed top-24 right-6 z-[100] px-6 py-4 bg-gradient-to-r ${colors[type]} text-white rounded-xl shadow-2xl animate-slide-in-right max-w-md`;

    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${icons[type]} text-2xl"></i>
            <p class="flex-1">${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Notification center (liste des notifications)
export class NotificationCenter {
    constructor(userId) {
        this.userId = userId;
        this.notifications = [];
    }

    async load() {
        // Load from localStorage for now
        const stored = localStorage.getItem(`notifications_${this.userId}`);
        this.notifications = stored ? JSON.parse(stored) : [];
        return this.notifications;
    }

    add(notification) {
        this.notifications.unshift({
            id: Date.now(),
            ...notification,
            timestamp: new Date(),
            read: false
        });

        // Limit to 50
        this.notifications = this.notifications.slice(0, 50);

        this.save();
        this.updateBadge();
    }

    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            this.save();
            this.updateBadge();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.save();
        this.updateBadge();
    }

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    save() {
        localStorage.setItem(`notifications_${this.userId}`, JSON.stringify(this.notifications));
    }

    updateBadge() {
        const count = this.getUnreadCount();
        const badge = document.getElementById('notification-badge');

        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        }
    }
}

// Style for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in-right {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .animate-slide-in-right {
        animation: slide-in-right 0.3s ease;
    }
`;
document.head.appendChild(style);

console.log('✅ Notifications module loaded');
