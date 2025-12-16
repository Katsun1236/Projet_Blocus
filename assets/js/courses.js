import { db } from "./config.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { requireAuth } from "./auth-guard.js";
import { initSidebar, initHeaderProfile } from "./layout.js";

// Références DOM
const coursesGrid = document.getElementById('courses-grid');
const loader = document.getElementById('loader'); // Assure-toi d'avoir un élément loader dans ton HTML

// Fonction principale d'initialisation
async function initPage() {
    try {
        // 1. Vérification Auth (Redirige si pas connecté)
        const user = await requireAuth();
        console.log("Connecté en tant que :", user.email);

        // 2. Initialisation UI
        initSidebar();
        initHeaderProfile(user);

        // 3. Chargement des données
        await loadCourses(user.uid);

    } catch (error) {
        console.error("Erreur initialisation page :", error);
    }
}

// Fonction de chargement des cours depuis Firestore
async function loadCourses(userId) {
    if(loader) loader.classList.remove('hidden');
    coursesGrid.innerHTML = ''; // Reset

    try {
        // Requête : Prendre les cours créés par l'user (ou publics, selon ta logique)
        const q = query(
            collection(db, "courses"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            coursesGrid.innerHTML = `
                <div class="col-span-full text-center py-10 text-gray-400">
                    <p class="text-xl">Aucun cours trouvé 📚</p>
                    <a href="upload.html" class="mt-4 inline-block text-indigo-400 hover:text-indigo-300">Ajouter mon premier cours</a>
                </div>
            `;
            return;
        }

        // Génération des cartes
        querySnapshot.forEach((doc) => {
            const course = doc.data();
            const card = createCourseCard(doc.id, course);
            coursesGrid.appendChild(card);
        });

    } catch (err) {
        console.error("Erreur chargement cours :", err);
        coursesGrid.innerHTML = `<p class="text-red-400">Erreur lors du chargement des cours.</p>`;
    } finally {
        if(loader) loader.classList.add('hidden');
    }
}

// Création HTML d'une carte (Template String)
function createCourseCard(id, data) {
    const div = document.createElement('div');
    // Classes Tailwind pour l'effet Glassmorphism
    div.className = "content-glass p-5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden";
    
    // Fallback si pas d'image
    const bgImage = data.thumbnailUrl || 'https://via.placeholder.com/400x200/3730a3/ffffff?text=Cours';

    div.innerHTML = `
        <div class="h-32 rounded-lg bg-cover bg-center mb-4" style="background-image: url('${bgImage}')"></div>
        <h3 class="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">${data.title || 'Sans titre'}</h3>
        <p class="text-sm text-gray-400 mb-3">${data.subject || 'Matière inconnue'} • ${data.year || 'N/A'}</p>
        
        <div class="flex gap-2 mt-4">
            <a href="synthesize.html?id=${id}" class="flex-1 text-center py-2 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 text-sm transition">
                <i class="fas fa-magic mr-1"></i> Synthèse
            </a>
            <a href="quiz.html?id=${id}" class="flex-1 text-center py-2 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 text-sm transition">
                <i class="fas fa-question-circle mr-1"></i> Quiz
            </a>
        </div>
    `;
    return div;
}

// Lancement
window.addEventListener('DOMContentLoaded', initPage);