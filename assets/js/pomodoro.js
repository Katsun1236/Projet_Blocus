import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let currentUserId = null;
let timerInterval = null;
let isPaused = false;
let currentPhase = 'work'; // 'work' | 'shortBreak' | 'longBreak'
let pomodorosCompleted = 0;
let timeRemaining = 25 * 60; // 25 minutes in seconds

// Paramètres personnalisables
let settings = {
    workDuration: 25,        // minutes
    shortBreakDuration: 5,   // minutes
    longBreakDuration: 15,   // minutes
    pomodorosUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    notificationsEnabled: true,
    soundEnabled: true
};

const ui = {
    timerDisplay: document.getElementById('timer-display'),
    phaseLabel: document.getElementById('phase-label'),
    btnStart: document.getElementById('btn-start-timer'),
    btnPause: document.getElementById('btn-pause-timer'),
    btnReset: document.getElementById('btn-reset-timer'),
    btnSkip: document.getElementById('btn-skip-timer'),
    progressRing: document.getElementById('progress-ring'),
    pomodoroCount: document.getElementById('pomodoro-count'),
    totalTime: document.getElementById('total-study-time'),
    todaySessions: document.getElementById('today-sessions'),
    settingsBtn: document.getElementById('btn-settings'),
    settingsModal: document.getElementById('settings-modal'),
    saveSettingsBtn: document.getElementById('save-settings'),
    closeSettingsBtn: document.getElementById('close-settings'),
    workDurationInput: document.getElementById('work-duration'),
    shortBreakInput: document.getElementById('short-break-duration'),
    longBreakInput: document.getElementById('long-break-duration'),
    pomodorosInput: document.getElementById('pomodoros-until-long-break'),
    autoStartBreaksCheck: document.getElementById('auto-start-breaks'),
    autoStartPomodorosCheck: document.getElementById('auto-start-pomodoros'),
    notificationsCheck: document.getElementById('notifications-enabled'),
    soundCheck: document.getElementById('sound-enabled')
};

// Initialisation
onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '/pages/auth/login.html'; return; }
    currentUserId = user.uid;
    await initLayout(user);
    await loadSettings();
    await loadStats();
    setupEventListeners();
    updateUI();
    requestNotificationPermission();
});

async function loadSettings() {
    try {
        const docRef = doc(db, 'users', currentUserId, 'settings', 'pomodoro');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            settings = { ...settings, ...docSnap.data() };
            updateSettingsUI();
        }
    } catch (e) {
        console.error('Error loading settings:', e);
    }
}

async function saveSettings() {
    // Récupérer les valeurs des inputs
    settings.workDuration = parseInt(ui.workDurationInput.value) || 25;
    settings.shortBreakDuration = parseInt(ui.shortBreakInput.value) || 5;
    settings.longBreakDuration = parseInt(ui.longBreakInput.value) || 15;
    settings.pomodorosUntilLongBreak = parseInt(ui.pomodorosInput.value) || 4;
    settings.autoStartBreaks = ui.autoStartBreaksCheck.checked;
    settings.autoStartPomodoros = ui.autoStartPomodorosCheck.checked;
    settings.notificationsEnabled = ui.notificationsCheck.checked;
    settings.soundEnabled = ui.soundCheck.checked;

    try {
        const docRef = doc(db, 'users', currentUserId, 'settings', 'pomodoro');
        await setDoc(docRef, settings);
        showMessage('Paramètres sauvegardés !', 'success');
        ui.settingsModal.classList.add('hidden');

        // Reset timer si changement de durée
        if (!timerInterval) {
            resetTimer();
        }
    } catch (e) {
        console.error('Error saving settings:', e);
        showMessage('Erreur sauvegarde paramètres', 'error');
    }
}

function updateSettingsUI() {
    ui.workDurationInput.value = settings.workDuration;
    ui.shortBreakInput.value = settings.shortBreakDuration;
    ui.longBreakInput.value = settings.longBreakDuration;
    ui.pomodorosInput.value = settings.pomodorosUntilLongBreak;
    ui.autoStartBreaksCheck.checked = settings.autoStartBreaks;
    ui.autoStartPomodorosCheck.checked = settings.autoStartPomodoros;
    ui.notificationsCheck.checked = settings.notificationsEnabled;
    ui.soundCheck.checked = settings.soundEnabled;
}

async function loadStats() {
    try {
        const docRef = doc(db, 'users', currentUserId, 'stats', 'pomodoro');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const stats = docSnap.data();
            ui.totalTime.textContent = formatTime(stats.totalMinutes * 60 || 0);
            ui.todaySessions.textContent = stats.todaySessions || 0;
        }
    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

function setupEventListeners() {
    ui.btnStart.onclick = startTimer;
    ui.btnPause.onclick = pauseTimer;
    ui.btnReset.onclick = resetTimer;
    ui.btnSkip.onclick = skipPhase;
    ui.settingsBtn.onclick = () => ui.settingsModal.classList.remove('hidden');
    ui.closeSettingsBtn.onclick = () => ui.settingsModal.classList.add('hidden');
    ui.saveSettingsBtn.onclick = saveSettings;

    // Fermer modal en cliquant en dehors
    ui.settingsModal.addEventListener('click', (e) => {
        if (e.target === ui.settingsModal) {
            ui.settingsModal.classList.add('hidden');
        }
    });
}

function startTimer() {
    if (timerInterval) return; // Déjà démarré

    isPaused = false;
    ui.btnStart.classList.add('hidden');
    ui.btnPause.classList.remove('hidden');

    timerInterval = setInterval(() => {
        if (!isPaused && timeRemaining > 0) {
            timeRemaining--;
            updateUI();

            if (timeRemaining === 0) {
                handlePhaseComplete();
            }
        }
    }, 1000);
}

function pauseTimer() {
    isPaused = !isPaused;
    ui.btnPause.innerHTML = isPaused
        ? '<i class="fas fa-play"></i> Reprendre'
        : '<i class="fas fa-pause"></i> Pause';
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isPaused = false;
    currentPhase = 'work';
    timeRemaining = settings.workDuration * 60;
    ui.btnStart.classList.remove('hidden');
    ui.btnPause.classList.add('hidden');
    ui.btnPause.innerHTML = '<i class="fas fa-pause"></i> Pause';
    updateUI();
}

function skipPhase() {
    timeRemaining = 0;
    handlePhaseComplete();
}

function handlePhaseComplete() {
    clearInterval(timerInterval);
    timerInterval = null;

    playSound();
    sendNotification();

    if (currentPhase === 'work') {
        pomodorosCompleted++;
        saveCompletedPomodoro();

        // Décider de la prochaine phase
        if (pomodorosCompleted % settings.pomodorosUntilLongBreak === 0) {
            currentPhase = 'longBreak';
            timeRemaining = settings.longBreakDuration * 60;
        } else {
            currentPhase = 'shortBreak';
            timeRemaining = settings.shortBreakDuration * 60;
        }

        if (settings.autoStartBreaks) {
            startTimer();
        } else {
            ui.btnStart.classList.remove('hidden');
            ui.btnPause.classList.add('hidden');
        }
    } else {
        // Fin de pause
        currentPhase = 'work';
        timeRemaining = settings.workDuration * 60;

        if (settings.autoStartPomodoros) {
            startTimer();
        } else {
            ui.btnStart.classList.remove('hidden');
            ui.btnPause.classList.add('hidden');
        }
    }

    updateUI();
}

async function saveCompletedPomodoro() {
    try {
        const docRef = doc(db, 'users', currentUserId, 'stats', 'pomodoro');
        const docSnap = await getDoc(docRef);

        const today = new Date().toISOString().split('T')[0];
        let todaySessions = 0;

        if (docSnap.exists()) {
            const data = docSnap.data();
            todaySessions = data.lastDate === today ? (data.todaySessions || 0) + 1 : 1;

            await updateDoc(docRef, {
                totalMinutes: increment(settings.workDuration),
                totalPomodoros: increment(1),
                todaySessions: todaySessions,
                lastDate: today,
                lastSessionAt: serverTimestamp()
            });
        } else {
            await setDoc(docRef, {
                totalMinutes: settings.workDuration,
                totalPomodoros: 1,
                todaySessions: 1,
                lastDate: today,
                lastSessionAt: serverTimestamp()
            });
        }

        // Mettre à jour l'UI
        ui.todaySessions.textContent = todaySessions;
        const totalTime = (docSnap.exists() ? (docSnap.data().totalMinutes || 0) : 0) + settings.workDuration;
        ui.totalTime.textContent = formatTime(totalTime * 60);

    } catch (e) {
        console.error('Error saving pomodoro:', e);
    }
}

function updateUI() {
    // Timer display
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    ui.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Phase label
    const phaseLabels = {
        work: '🍅 Session de travail',
        shortBreak: '☕ Pause courte',
        longBreak: '🌴 Pause longue'
    };
    ui.phaseLabel.textContent = phaseLabels[currentPhase];

    // Pomodoro count
    ui.pomodoroCount.textContent = pomodorosCompleted;

    // Progress ring
    const totalTime = currentPhase === 'work' ? settings.workDuration * 60
                    : currentPhase === 'shortBreak' ? settings.shortBreakDuration * 60
                    : settings.longBreakDuration * 60;

    const progress = ((totalTime - timeRemaining) / totalTime) * 100;
    const circumference = 2 * Math.PI * 120; // radius = 120
    const offset = circumference - (progress / 100) * circumference;

    if (ui.progressRing) {
        ui.progressRing.style.strokeDashoffset = offset;
    }

    // Mettre à jour le titre de la page
    document.title = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} - ${phaseLabels[currentPhase]}`;
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
}

function playSound() {
    if (!settings.soundEnabled) return;

    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixdxPnfgTcKGV+i3+7J...'); // Minimal beep sound
        audio.play().catch(e => console.log('Cannot play sound:', e));
    } catch (e) {
        console.log('Sound error:', e);
    }
}

function sendNotification() {
    if (!settings.notificationsEnabled || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const messages = {
        work: '✅ Pomodoro terminé ! Prends une pause',
        shortBreak: '⏰ Pause terminée ! Retour au travail',
        longBreak: '⏰ Longue pause terminée ! Retour au travail'
    };

    const notification = new Notification('Projet Blocus - Pomodoro', {
        body: messages[currentPhase],
        icon: '/assets/images/locus-neon-favicon.png',
        tag: 'pomodoro-timer',
        requireInteraction: false
    });

    setTimeout(() => notification.close(), 5000);
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}
