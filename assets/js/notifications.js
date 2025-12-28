import { auth, db, storage, supabase, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, deleteField, ref, uploadBytesResumable, getDownloadURL } from './supabase-config.js';

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
        // ✅ LOW: Removed console.log - not an error, just unsupported feature
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
        }).catch(error => {
            console.error('Error requesting notification permission:', error);
        });
    }
}

export function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}
