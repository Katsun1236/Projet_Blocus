import { auth, db } from './config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- STATE ---
let currentUserId = null;
let calendar = null; // Instance FullCalendar
let currentEventId = null; // ID pour l'édition/suppression
let unsubscribeEvents = null; // Listener Firestore

// --- DOM ELEMENTS ---
const ui = {
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    // Modal
    modal: document.getElementById('event-modal'),
    modalTitle: document.getElementById('modal-title'),
    closeBtn: document.getElementById('close-modal-btn'),
    cancelBtn: document.getElementById('btn-cancel'),
    saveBtn: document.getElementById('btn-save-event'),
    deleteBtn: document.getElementById('btn-delete-event'),
    // Inputs
    titleInput: document.getElementById('event-title'),
    startInput: document.getElementById('event-start'),
    endInput: document.getElementById('event-end'),
    descInput: document.getElementById('event-desc'),
    typeInputs: document.getElementsByName('event-type'),
    // Trigger
    addBtn: document.getElementById('btn-add-event')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initLayout('planning'); // Active l'onglet sidebar

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            
            // 1. Load User Info (Header)
            const userDoc = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js").then(m => m.getDoc(m.doc(db, 'users', user.uid)));
            if(userDoc.exists()) {
                const data = userDoc.data();
                if(ui.userName) ui.userName.textContent = data.firstName;
                if(ui.userAvatar) ui.userAvatar.src = data.photoURL || `https://ui-avatars.com/api/?name=${data.firstName}&background=random`;
            }

            // 2. Init Calendar
            initCalendar();

            // 3. Subscribe to Data
            subscribeToEvents();

        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
});

// --- FULLCALENDAR SETUP ---
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Vue par défaut (Mois)
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'fr', // Français
        firstDay: 1, // Lundi
        navLinks: true, // Click sur jour/semaine
        editable: true, // Drag & Drop
        selectable: true, // Sélection de plage pour créer
        dayMaxEvents: true, // "plus..." si trop d'events
        height: '100%',
        
        // Callbacks
        select: handleDateSelect,
        eventClick: handleEventClick,
        eventDrop: handleEventDrop, // Drag & Drop (Update date)
        eventResize: handleEventResize, // Resize (Update duration)
        
        // Styling events
        eventClassNames: function(arg) {
            // Retourne des classes CSS selon le type
            const type = arg.event.extendedProps.type || 'other';
            if (type === 'exam') return ['bg-red-600', 'border-red-700', 'text-white'];
            if (type === 'revision') return ['bg-indigo-600', 'border-indigo-700', 'text-white'];
            return ['bg-emerald-600', 'border-emerald-700', 'text-white'];
        }
    });

    calendar.render();
}

// --- FIRESTORE LOGIC ---

function subscribeToEvents() {
    if (unsubscribeEvents) unsubscribeEvents();

    const q = collection(db, 'users', currentUserId, 'planning');
    
    unsubscribeEvents = onSnapshot(q, (snapshot) => {
        // Nettoyer calendrier avant de recharger (évite doublons si pas géré par merge)
        calendar.removeAllEvents();
        
        const events = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            events.push({
                id: docSnap.id,
                title: data.title,
                start: data.start, // ISO String stocké
                end: data.end,
                extendedProps: {
                    description: data.description,
                    type: data.type
                }
                // Color is handled by classNames in initCalendar
            });
        });
        
        // Add source
        calendar.addEventSource(events);
    }, (error) => {
        console.error("Erreur planning:", error);
        showMessage("Erreur chargement planning", "error");
    });
}

async function saveEvent() {
    const title = ui.titleInput.value.trim();
    const start = ui.startInput.value;
    const end = ui.endInput.value;
    const desc = ui.descInput.value.trim();
    const type = document.querySelector('input[name="event-type"]:checked').value;

    if (!title || !start) return showMessage("Titre et date de début requis", "error");

    const eventData = {
        title,
        start,
        end: end || null, // Peut être null
        description: desc,
        type
    };

    ui.saveBtn.disabled = true;
    ui.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        if (currentEventId) {
            // UPDATE
            await updateDoc(doc(db, 'users', currentUserId, 'planning', currentEventId), eventData);
            showMessage("Événement modifié", "success");
        } else {
            // CREATE
            await addDoc(collection(db, 'users', currentUserId, 'planning'), eventData);
            showMessage("Événement ajouté", "success");
        }
        closeModal();
    } catch (e) {
        console.error(e);
        showMessage("Erreur sauvegarde", "error");
    } finally {
        ui.saveBtn.disabled = false;
        ui.saveBtn.innerHTML = '<i class="fas fa-save"></i> Sauvegarder';
    }
}

async function deleteEvent() {
    if (!currentEventId) return;
    if (!confirm("Supprimer cet événement ?")) return;

    try {
        await deleteDoc(doc(db, 'users', currentUserId, 'planning', currentEventId));
        showMessage("Événement supprimé", "info");
        closeModal();
    } catch (e) {
        console.error(e);
        showMessage("Erreur suppression", "error");
    }
}

// Update date after Drag & Drop
async function handleEventDrop(info) {
    const event = info.event;
    try {
        await updateDoc(doc(db, 'users', currentUserId, 'planning', event.id), {
            start: event.start.toISOString(),
            end: event.end ? event.end.toISOString() : null
        });
        showMessage("Déplacé !", "success");
    } catch (e) {
        info.revert(); // Annuler visuellement si erreur
        showMessage("Erreur déplacement", "error");
    }
}

// Update duration after resize
async function handleEventResize(info) {
    const event = info.event;
    try {
        await updateDoc(doc(db, 'users', currentUserId, 'planning', event.id), {
            end: event.end ? event.end.toISOString() : null
        });
    } catch (e) {
        info.revert();
    }
}

// --- MODAL HANDLERS ---

function handleDateSelect(selectInfo) {
    resetModal();
    currentEventId = null; // Create Mode
    ui.modalTitle.textContent = "Nouvel Événement";
    ui.deleteBtn.classList.add('hidden');
    
    // Pre-fill dates (Format pour input datetime-local: YYYY-MM-DDTHH:mm)
    // Astuce: FullCalendar renvoie des dates JS, il faut convertir en format input local
    const startStr = toLocalISOString(selectInfo.startStr);
    const endStr = selectInfo.endStr ? toLocalISOString(selectInfo.endStr) : '';
    
    ui.startInput.value = startStr.slice(0, 16); // Coupe les secondes/timezone
    // Si selection journée entière, end est le lendemain minuit, on peut ajuster si besoin
    
    ui.modal.classList.remove('hidden');
}

function handleEventClick(clickInfo) {
    resetModal();
    currentEventId = clickInfo.event.id; // Edit Mode
    ui.modalTitle.textContent = "Modifier l'événement";
    ui.deleteBtn.classList.remove('hidden');

    // Fill Form
    ui.titleInput.value = clickInfo.event.title;
    
    const props = clickInfo.event.extendedProps;
    ui.descInput.value = props.description || '';
    
    // Select Type Radio
    const type = props.type || 'other';
    const radio = document.querySelector(`input[name="event-type"][value="${type}"]`);
    if(radio) radio.checked = true;

    // Fill Dates
    if(clickInfo.event.start) ui.startInput.value = toLocalISOString(clickInfo.event.start.toISOString()).slice(0, 16);
    if(clickInfo.event.end) ui.endInput.value = toLocalISOString(clickInfo.event.end.toISOString()).slice(0, 16);

    ui.modal.classList.remove('hidden');
}

function closeModal() {
    ui.modal.classList.add('hidden');
    currentEventId = null;
    if (calendar) calendar.unselect();
}

function resetModal() {
    ui.titleInput.value = "";
    ui.startInput.value = "";
    ui.endInput.value = "";
    ui.descInput.value = "";
    document.querySelector('input[name="event-type"][value="revision"]').checked = true;
}

// Helper pour convertir date UTC FullCalendar vers Local Input
function toLocalISOString(dateStr) {
    const date = new Date(dateStr);
    // Ajustement timezone simpliste (attention aux edge cases, mais ok pour MVP)
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in ms
    const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, -1);
    return localISOTime;
}

// --- LISTENERS ---

function setupEventListeners() {
    ui.addBtn.onclick = () => {
        resetModal();
        currentEventId = null;
        ui.modalTitle.textContent = "Nouvel Événement";
        ui.deleteBtn.classList.add('hidden');
        // Default start now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        ui.startInput.value = now.toISOString().slice(0, 16);
        ui.modal.classList.remove('hidden');
    };

    ui.closeBtn.onclick = closeModal;
    ui.cancelBtn.onclick = closeModal;
    ui.saveBtn.onclick = saveEvent;
    ui.deleteBtn.onclick = deleteEvent;
    
    // Close on click outside
    ui.modal.addEventListener('click', (e) => {
        if (e.target === ui.modal) closeModal();
    });
}