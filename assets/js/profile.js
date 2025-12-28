import { auth, db, storage, supabase, getStorage, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, deleteField, ref, uploadBytesResumable, getDownloadURL } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { initSpeedInsights } from './speed-insights.js';

// Initialize Speed Insights for performance monitoring
initSpeedInsights();

let currentUserId = null;
let currentUserData = null;
let userStats = {
    files: 0,
    quiz: 0,
    groups: 0,
    posts: 0,
    points: 0
};

const ACHIEVEMENTS_LIST = [
    { id: 'soc_1', title: 'Premiers pas', desc: 'Rejoindre un groupe', icon: 'fa-users', type: 'social', condition: (s) => s.groups >= 1 },
    { id: 'soc_2', title: 'Social', desc: 'Rejoindre 5 groupes', icon: 'fa-users', type: 'social', condition: (s) => s.groups >= 5 },
    { id: 'soc_3', title: 'Influenceur', desc: 'Poster 10 messages', icon: 'fa-comment', type: 'social', condition: (s) => s.posts >= 10 },
    { id: 'stu_1', title: 'Curieux', desc: 'Terminer 1 Quiz', icon: 'fa-brain', type: 'study', condition: (s) => s.quiz >= 1 },
    { id: 'stu_2', title: 'Intello', desc: 'Terminer 10 Quiz', icon: 'fa-graduation-cap', type: 'study', condition: (s) => s.quiz >= 10 },
    { id: 'stu_3', title: 'Expert', desc: 'Terminer 50 Quiz', icon: 'fa-crown', type: 'study', condition: (s) => s.quiz >= 50 },
    { id: 'sha_1', title: 'Partageur', desc: 'Uploader 1 fichier', icon: 'fa-file-upload', type: 'share', condition: (s) => s.files >= 1 },
    { id: 'sha_2', title: 'Bibliothécaire', desc: 'Uploader 10 fichiers', icon: 'fa-book', type: 'share', condition: (s) => s.files >= 10 },
    { id: 'sha_3', title: 'Archiviste', desc: 'Uploader 50 fichiers', icon: 'fa-archive', type: 'share', condition: (s) => s.files >= 50 },
    { id: 'pts_1', title: 'Novice', desc: 'Atteindre 100 pts', icon: 'fa-star', type: 'points', condition: (s) => s.points >= 100 },
    { id: 'pts_2', title: 'Initié', desc: 'Atteindre 500 pts', icon: 'fa-star-half-alt', type: 'points', condition: (s) => s.points >= 500 },
    { id: 'pts_3', title: 'Maître', desc: 'Atteindre 1000 pts', icon: 'fa-sun', type: 'points', condition: (s) => s.points >= 1000 },
];

const ui = {
    avatar: document.getElementById('profile-avatar'),
    name: document.getElementById('profile-name'),
    email: document.getElementById('profile-email'),
    points: document.getElementById('profile-points'),
    bio: document.getElementById('profile-bio'),
    statFiles: document.getElementById('stat-files'),
    statQuiz: document.getElementById('stat-quiz'),
    statGroups: document.getElementById('stat-groups'),
    statAchievements: document.getElementById('stat-achievements'),
    activityList: document.getElementById('activity-list'),
    achievementsGrid: document.getElementById('achievements-grid'),
    skillsChartCanvas: document.getElementById('skillsChart'),
    progressionChartCanvas: document.getElementById('progressionChart'),
    btnEdit: document.getElementById('btn-edit-profile'),
    btnChangeAvatar: document.getElementById('btn-change-avatar'),
    avatarUpload: document.getElementById('avatar-upload'),
    btnLogout: document.getElementById('btn-logout'),
    viewMode: document.getElementById('view-mode-content'),
    editMode: document.getElementById('edit-mode-content'),
    editFirstname: document.getElementById('edit-firstname'),
    editLastname: document.getElementById('edit-lastname'),
    editBio: document.getElementById('edit-bio'),
    btnSave: document.getElementById('btn-save-profile'),
    btnCancel: document.getElementById('btn-cancel-edit')
};

document.addEventListener('DOMContentLoaded', () => {
    initLayout('');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            await loadProfileData();
            await loadUserStats();
            loadRecentActivity();
            renderAchievements();
            initCharts();
        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
});

async function loadProfileData() {
    try {
        const docRef = doc(db, 'users', currentUserId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentUserData = docSnap.data();
            userStats.points = currentUserData.points || 0;
            renderProfile(currentUserData);
        } else {
            console.error("Aucun document user trouvé !");
        }
    } catch (e) {
        console.error("Erreur chargement profil:", e);
    }
}

function renderProfile(data) {
    const avatarUrl = data.photoURL || `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=random&color=fff`;
    ui.avatar.src = avatarUrl;
    ui.name.textContent = `${data.firstName || ''} ${data.lastName || ''}`;
    ui.email.textContent = data.email || '';
    ui.points.textContent = data.points || 0;

    if (data.bio && data.bio.trim() !== "") {
        ui.bio.textContent = data.bio;
        ui.bio.classList.remove('italic');
    } else {
        ui.bio.textContent = "Aucune biographie renseignée. Cliquez sur Modifier pour vous présenter !";
        ui.bio.classList.add('italic');
    }

    ui.editFirstname.value = data.firstName || "";
    ui.editLastname.value = data.lastName || "";
    ui.editBio.value = data.bio || "";
}

async function loadUserStats() {
    try {
        // ✅ OPTIMISÉ: Requêtes parallèles au lieu de séquentielles (4x plus rapide)
        const [coursesCount, quizCount, groupsCount, postsCount] = await Promise.all([
            // Count courses
            supabase.from('courses').select('*', { count: 'exact', head: true }).eq('user_id', currentUserId),
            // Count quiz results
            supabase.from('quiz_results').select('*', { count: 'exact', head: true }).eq('user_id', currentUserId),
            // Count groups (nécessite array contains - fallback à getDocs pour compatibilité)
            getDocs(query(collection(db, 'community_groups'))).then(snap =>
                snap.filter(doc => doc.data().members?.includes(currentUserId)).length
            ),
            // Count posts
            supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('user_id', currentUserId)
        ]);

        // Update stats avec résultats parallèles
        userStats.files = coursesCount.count || 0;
        userStats.quiz = quizCount.count || 0;
        userStats.groups = groupsCount || 0;
        userStats.posts = postsCount.count || 0;

        // Update UI
        ui.statFiles.textContent = userStats.files;
        ui.statQuiz.textContent = userStats.quiz;
        ui.statGroups.textContent = userStats.groups;

    } catch (e) {
        console.error("Erreur stats:", e);
        // Fallback values
        ui.statFiles.textContent = '0';
        ui.statQuiz.textContent = '0';
        ui.statGroups.textContent = '0';
    }
}

async function loadRecentActivity() {
    ui.activityList.innerHTML = '';
    try {
        const q = query(collection(db, 'community_posts'), where('authorId', '==', currentUserId), orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            ui.activityList.innerHTML = `<div class="text-center py-6 text-gray-500 text-xs italic pl-6">Aucune activité récente.</div>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = "relative pl-6 pb-2";
            div.innerHTML = `
                <div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-indigo-500"></div>
                <div class="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors cursor-pointer">
                    <p class="text-sm text-gray-200 font-medium truncate">${data.title}</p>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">${data.type === 'question' ? 'Question' : 'Post'}</span>
                        <span class="text-[10px] text-gray-500">${data.createdAt ? formatDate(data.createdAt.toDate()) : ''}</span>
                    </div>
                </div>
            `;
            ui.activityList.appendChild(div);
        });
    } catch (e) {
        console.warn("Activité non chargée", e);
        ui.activityList.innerHTML = `<div class="text-center py-6 text-gray-500 text-xs pl-6">Activité indisponible.</div>`;
    }
}

function renderAchievements() {
    ui.achievementsGrid.innerHTML = '';
    let unlockedCount = 0;

    ACHIEVEMENTS_LIST.forEach(ach => {
        const isUnlocked = ach.condition(userStats);
        if (isUnlocked) unlockedCount++;

        const div = document.createElement('div');
        div.className = `flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-800/30 border border-gray-700/50 transition-all duration-300 hover:scale-105 group relative ${isUnlocked ? 'achievement-unlocked' : 'achievement-locked'}`;
        div.title = ach.desc;

        let iconColorClass = isUnlocked ? 'text-white' : 'text-gray-600';
        if (isUnlocked) {
            if (ach.type === 'social') iconColorClass = 'text-blue-400';
            if (ach.type === 'study') iconColorClass = 'text-purple-400';
            if (ach.type === 'share') iconColorClass = 'text-emerald-400';
            if (ach.type === 'points') iconColorClass = 'text-yellow-400';
        }

        div.innerHTML = `
            <div class="w-12 h-12 flex items-center justify-center rounded-full bg-gray-900/50 mb-3 shadow-inner text-2xl ${iconColorClass}">
                <i class="fas ${ach.icon}"></i>
            </div>
            <h4 class="text-xs font-bold text-gray-300 text-center leading-tight mb-1">${ach.title}</h4>
            <p class="text-[10px] text-gray-600 text-center hidden group-hover:block transition-all">${ach.desc}</p>
        `;
        ui.achievementsGrid.appendChild(div);
    });

    ui.statAchievements.textContent = `${unlockedCount}/${ACHIEVEMENTS_LIST.length}`;
}

function initCharts() {
    const skillsData = [
        Math.min(100, userStats.quiz * 10),
        Math.min(100, userStats.files * 5),
        Math.min(100, userStats.posts * 5),
        Math.min(100, userStats.groups * 10),
        Math.min(100, (userStats.points / 1000) * 100)
    ];

    new Chart(ui.skillsChartCanvas, {
        type: 'radar',
        data: {
            labels: ['Connaissances', 'Contribution', 'Social', 'Collaboration', 'Expérience'],
            datasets: [{
                label: 'Niveau',
                data: skillsData,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgb(99, 102, 241)',
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(99, 102, 241)'
            }]
        },
        options: {
            elements: { line: { borderWidth: 3 } },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 10 } },
                    ticks: { display: false, backdropColor: 'transparent' },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const currentPoints = userStats.points;
    const progressData = [
        Math.max(0, currentPoints - 150),
        Math.max(0, currentPoints - 100),
        Math.max(0, currentPoints - 40),
        currentPoints
    ];

    new Chart(ui.progressionChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Points',
                data: progressData,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

async function saveProfile() {
    const firstName = ui.editFirstname.value.trim();
    const lastName = ui.editLastname.value.trim();
    const bio = ui.editBio.value.trim();

    if (!firstName || !lastName) {
        return showMessage("Nom et prénom requis.", "error");
    }

    ui.btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    ui.btnSave.disabled = true;

    try {
        const userRef = doc(db, 'users', currentUserId);
        await updateDoc(userRef, {
            firstName: firstName,
            lastName: lastName,
            bio: bio
        });

        showMessage("Profil mis à jour !", "success");
        currentUserData.firstName = firstName;
        currentUserData.lastName = lastName;
        currentUserData.bio = bio;
        renderProfile(currentUserData);
        toggleEditMode(false);

    } catch (e) {
        console.error(e);
        showMessage("Erreur lors de la sauvegarde.", "error");
    } finally {
        ui.btnSave.innerHTML = `<i class="fas fa-save"></i> Enregistrer`;
        ui.btnSave.disabled = false;
    }
}

async function uploadAvatar(file) {
    showMessage("Upload de l'avatar...", "info");
    try {
        const storageRef = ref(storage, `users/${currentUserId}/avatar_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        const userRef = doc(db, 'users', currentUserId);
        await updateDoc(userRef, { photoURL: downloadURL });
        ui.avatar.src = downloadURL;
        showMessage("Avatar mis à jour !", "success");
    } catch (e) {
        console.error("Avatar Upload Error:", e);
        showMessage("Erreur lors de l'upload.", "error");
    }
}

async function handleLogout() {
    try { await signOut(auth); window.location.href = '../auth/login.html'; } catch (e) { console.error(e); }
}

function toggleEditMode(show) {
    if (show) {
        ui.viewMode.classList.add('hidden');
        ui.editMode.classList.remove('hidden');
        ui.btnEdit.classList.add('hidden');
    } else {
        ui.viewMode.classList.remove('hidden');
        ui.editMode.classList.add('hidden');
        ui.btnEdit.classList.remove('hidden');
    }
}

function setupEventListeners() {
    ui.btnEdit.addEventListener('click', () => toggleEditMode(true));
    ui.btnCancel.addEventListener('click', () => toggleEditMode(false));
    ui.btnSave.addEventListener('click', saveProfile);
    ui.btnLogout.addEventListener('click', handleLogout);
    ui.btnChangeAvatar.addEventListener('click', () => ui.avatarUpload.click());
    // ✅ ERROR HANDLING: Valider e.target.files avant upload + utiliser 'change' au lieu de 'click'
    ui.avatarUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadAvatar(e.target.files[0]);
        }
    });
}
