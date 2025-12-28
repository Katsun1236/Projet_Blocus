import { auth, db, storage, supabase, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, deleteField, ref, uploadBytesResumable, getDownloadURL } from './supabase-config.js';

export const BADGES = {
    'streak-3': {
        id: 'streak-3',
        name: 'Débutant Assidu',
        description: '3 jours consécutifs de révision',
        icon: '🔥',
        xp: 50,
        requirement: { type: 'streak', value: 3 }
    },
    'streak-7': {
        id: 'streak-7',
        name: 'Streaker',
        description: '7 jours consécutifs de révision',
        icon: '🔥🔥',
        xp: 150,
        requirement: { type: 'streak', value: 7 }
    },
    'streak-30': {
        id: 'streak-30',
        name: 'Marathonien',
        description: '30 jours consécutifs de révision',
        icon: '🔥🔥🔥',
        xp: 500,
        requirement: { type: 'streak', value: 30 }
    },
    'quiz-master-10': {
        id: 'quiz-master-10',
        name: 'Quiz Novice',
        description: '10 quiz terminés',
        icon: '🧠',
        xp: 100,
        requirement: { type: 'quizzes', value: 10 }
    },
    'quiz-master-50': {
        id: 'quiz-master-50',
        name: 'Quiz Master',
        description: '50 quiz terminés',
        icon: '🎯',
        xp: 300,
        requirement: { type: 'quizzes', value: 50 }
    },
    'perfect-score': {
        id: 'perfect-score',
        name: 'Perfectionniste',
        description: 'Score parfait sur un quiz',
        icon: '💯',
        xp: 200,
        requirement: { type: 'perfect-quiz', value: 1 }
    },
    'synthesizer-10': {
        id: 'synthesizer-10',
        name: 'Synthétiseur',
        description: '10 synthèses générées',
        icon: '📝',
        xp: 100,
        requirement: { type: 'syntheses', value: 10 }
    },
    'synthesizer-50': {
        id: 'synthesizer-50',
        name: 'Maître des Synthèses',
        description: '50 synthèses générées',
        icon: '📚',
        xp: 400,
        requirement: { type: 'syntheses', value: 50 }
    },
    'flashcard-warrior': {
        id: 'flashcard-warrior',
        name: 'Guerrier des Flashcards',
        description: '100 flashcards révisées',
        icon: '🗂️',
        xp: 250,
        requirement: { type: 'flashcards-reviewed', value: 100 }
    },
    'memory-master': {
        id: 'memory-master',
        name: 'Maître de la Mémoire',
        description: '90% de rétention sur 30 jours',
        icon: '🧩',
        xp: 500,
        requirement: { type: 'retention-rate', value: 90 }
    },
    'contributor': {
        id: 'contributor',
        name: 'Contributeur',
        description: '10 posts partagés',
        icon: '👑',
        xp: 150,
        requirement: { type: 'posts', value: 10 }
    },
    'top-contributor': {
        id: 'top-contributor',
        name: 'Top Contributor',
        description: '20 synthèses partagées',
        icon: '🌟',
        xp: 400,
        requirement: { type: 'shared-syntheses', value: 20 }
    },
    'bookworm': {
        id: 'bookworm',
        name: 'Bookworm',
        description: '100 pages lues',
        icon: '📖',
        xp: 200,
        requirement: { type: 'pages-read', value: 100 }
    },
    'library': {
        id: 'library',
        name: 'Bibliothèque Vivante',
        description: '50 cours uploadés',
        icon: '📚',
        xp: 300,
        requirement: { type: 'courses-uploaded', value: 50 }
    },
    'studious': {
        id: 'studious',
        name: 'Studieux',
        description: '10 heures d\'étude',
        icon: '⏰',
        xp: 150,
        requirement: { type: 'study-hours', value: 10 }
    },
    'dedicated': {
        id: 'dedicated',
        name: 'Dévoué',
        description: '50 heures d\'étude',
        icon: '⏳',
        xp: 500,
        requirement: { type: 'study-hours', value: 50 }
    }
};

export const LEVELS = [
    { level: 1, xpRequired: 0, title: 'Débutant' },
    { level: 2, xpRequired: 100, title: 'Novice' },
    { level: 3, xpRequired: 250, title: 'Apprenti' },
    { level: 4, xpRequired: 500, title: 'Étudiant' },
    { level: 5, xpRequired: 1000, title: 'Studieux' },
    { level: 6, xpRequired: 1750, title: 'Érudit' },
    { level: 7, xpRequired: 2750, title: 'Expert' },
    { level: 8, xpRequired: 4000, title: 'Maître' },
    { level: 9, xpRequired: 6000, title: 'Grand Maître' },
    { level: 10, xpRequired: 9000, title: 'Légende' }
];

export class GamificationSystem {
    constructor(userId) {
        this.userId = userId;
        this.userDocRef = doc(db, 'users', userId);
    }

    async getUserData() {
        try {
            const userDoc = await getDoc(this.userDocRef);
            if (!userDoc.exists()) return null;

            const data = userDoc.data();
            return {
                xp: data.xp || 0,
                level: data.level || 1,
                badges: data.badges || [],
                streak: data.streak || 0,
                lastActivity: data.lastActivity,
                stats: {
                    quizzesCompleted: data.quizzesCompleted || 0,
                    synthesesGenerated: data.synthesesGenerated || 0,
                    flashcardsReviewed: data.flashcardsReviewed || 0,
                    postsShared: data.postsShared || 0,
                    coursesUploaded: data.coursesUploaded || 0,
                    studyHours: data.studyHours || 0,
                    pagesRead: data.pagesRead || 0
                }
            };
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    async addXP(amount, reason = '') {
        try {
            await updateDoc(this.userDocRef, {
                xp: increment(amount),
                lastXPGain: serverTimestamp(),
                lastXPReason: reason
            });

            const userData = await this.getUserData();
            if (userData) {
                const newLevel = this.calculateLevel(userData.xp);
                if (newLevel > userData.level) {
                    await this.levelUp(newLevel);
                    return { levelUp: true, newLevel, xp: userData.xp };
                }
            }

            return { levelUp: false, xp: amount };
        } catch (error) {
            console.error('Error adding XP:', error);
            return null;
        }
    }

    calculateLevel(xp) {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (xp >= LEVELS[i].xpRequired) {
                return LEVELS[i].level;
            }
        }
        return 1;
    }

    async levelUp(newLevel) {
        try {
            await updateDoc(this.userDocRef, {
                level: newLevel,
                lastLevelUp: serverTimestamp()
            });

            this.showLevelUpNotification(newLevel);
        } catch (error) {
            console.error('Error leveling up:', error);
        }
    }

    async checkAndUnlockBadges() {
        try {
            const userData = await this.getUserData();
            if (!userData) return;

            const unlockedBadges = [];

            for (const badgeId in BADGES) {
                const badge = BADGES[badgeId];

                if (userData.badges.includes(badgeId)) continue;

                const requirement = badge.requirement;
                let unlocked = false;

                switch (requirement.type) {
                    case 'streak':
                        unlocked = userData.streak >= requirement.value;
                        break;
                    case 'quizzes':
                        unlocked = userData.stats.quizzesCompleted >= requirement.value;
                        break;
                    case 'syntheses':
                        unlocked = userData.stats.synthesesGenerated >= requirement.value;
                        break;
                    case 'flashcards-reviewed':
                        unlocked = userData.stats.flashcardsReviewed >= requirement.value;
                        break;
                    case 'posts':
                        unlocked = userData.stats.postsShared >= requirement.value;
                        break;
                    case 'courses-uploaded':
                        unlocked = userData.stats.coursesUploaded >= requirement.value;
                        break;
                    case 'study-hours':
                        unlocked = userData.stats.studyHours >= requirement.value;
                        break;
                    case 'pages-read':
                        unlocked = userData.stats.pagesRead >= requirement.value;
                        break;
                }

                if (unlocked) {
                    await this.unlockBadge(badgeId, badge);
                    unlockedBadges.push(badge);
                }
            }

            return unlockedBadges;
        } catch (error) {
            console.error('Error checking badges:', error);
            return [];
        }
    }

    async unlockBadge(badgeId, badge) {
        try {
            const userDoc = await getDoc(this.userDocRef);
            const currentBadges = userDoc.data().badges || [];

            if (!currentBadges.includes(badgeId)) {
                await updateDoc(this.userDocRef, {
                    badges: [...currentBadges, badgeId],
                    xp: increment(badge.xp)
                });

                this.showBadgeUnlockNotification(badge);
            }
        } catch (error) {
            console.error('Error unlocking badge:', error);
        }
    }

    async incrementStat(statName, amount = 1) {
        try {
            await updateDoc(this.userDocRef, {
                [statName]: increment(amount)
            });

            await this.checkAndUnlockBadges();
        } catch (error) {
            console.error('Error incrementing stat:', error);
        }
    }

    async updateStreak() {
        try {
            const userData = await this.getUserData();
            if (!userData) return;

            const now = new Date();
            const lastActivity = userData.lastActivity?.toDate ? userData.lastActivity.toDate() : null;

            if (!lastActivity) {
                await updateDoc(this.userDocRef, {
                    streak: 1,
                    lastActivity: serverTimestamp()
                });
                return 1;
            }

            const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                return userData.streak;
            } else if (daysDiff === 1) {
                const newStreak = userData.streak + 1;
                await updateDoc(this.userDocRef, {
                    streak: newStreak,
                    lastActivity: serverTimestamp()
                });

                await this.checkAndUnlockBadges();

                return newStreak;
            } else {
                await updateDoc(this.userDocRef, {
                    streak: 1,
                    lastActivity: serverTimestamp()
                });
                return 1;
            }
        } catch (error) {
            console.error('Error updating streak:', error);
            return 0;
        }
    }

    showLevelUpNotification(newLevel) {
        const levelData = LEVELS.find(l => l.level === newLevel);
        if (!levelData) return;

        this.showNotification({
            title: '🎉 Level Up!',
            message: `Tu es maintenant ${levelData.title} (Niveau ${newLevel})`,
            type: 'success'
        });
    }

    showBadgeUnlockNotification(badge) {
        this.showNotification({
            title: `${badge.icon} Badge Débloqué!`,
            message: `${badge.name} - ${badge.description}`,
            type: 'badge'
        });
    }

    showNotification({ title, message, type = 'info' }) {
        const notification = document.createElement('div');
        notification.className = `fixed top-24 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl animate-slide-in-right max-w-sm ${
            type === 'success' ? 'bg-gradient-to-r from-green-600 to-emerald-600' :
            type === 'badge' ? 'bg-gradient-to-r from-yellow-600 to-orange-600' :
            'bg-gradient-to-r from-indigo-600 to-purple-600'
        } text-white`;

        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div>
                    <p class="font-bold text-lg">${title}</p>
                    <p class="text-sm opacity-90">${message}</p>
                </div>
                <button class="ml-auto text-white/80 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

export function getLevelTitle(level) {
    const levelData = LEVELS.find(l => l.level === level);
    return levelData ? levelData.title : 'Inconnu';
}

export function getXPForNextLevel(currentXP) {
    const currentLevel = LEVELS.find(l => currentXP >= l.xpRequired && (LEVELS[LEVELS.indexOf(l) + 1]?.xpRequired || Infinity) > currentXP);

    // ✅ NULL CHECK: Vérifier que currentLevel existe avant d'accéder à ses propriétés
    if (!currentLevel) return null;

    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];

    if (!nextLevel) return null;

    return {
        current: currentXP,
        required: nextLevel.xpRequired,
        remaining: nextLevel.xpRequired - currentXP,
        percentage: ((currentXP - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100
    };
}

// ✅ LOW: Removed console.log for production
// console.log('✅ Gamification system loaded');
