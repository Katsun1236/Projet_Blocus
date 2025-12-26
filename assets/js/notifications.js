import { db } from './config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function sendNotification(userId, notification) {
    try {
        await addDoc(collection(db, 'users', userId, 'notifications'), {
            ...notification,
            createdAt: serverTimestamp(),
            read: false
        });
        return true;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
}

export async function sendBulkNotifications(userIds, notification) {
    const promises = userIds.map(userId => sendNotification(userId, notification));
    await Promise.all(promises);
}

export function showBrowserNotification(title, options = {}) {
    if (!("Notification" in window)) {
        console.log("Browser doesn't support notifications");
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(title, {
            icon: '/assets/images/locus-profile-sidebar.png',
            badge: '/assets/images/locus-profile-sidebar.png',
            ...options
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, {
                    icon: '/assets/images/locus-profile-sidebar.png',
                    ...options
                });
            }
        });
    }
}

export function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}
