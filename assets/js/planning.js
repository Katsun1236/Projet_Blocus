// ✅ PURE SUPABASE - Pas de wrappers Firestore
import { supabase } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage } from './utils.js';
import { initSpeedInsights } from './speed-insights.js';

// Initialize Speed Insights for performance monitoring
initSpeedInsights();

let currentUserId = null;
let calendar = null;
let currentEventId = null;
let eventsSubscription = null; // ✅ Supabase subscription au lieu de unsubscribe function

const ui = {
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    modal: document.getElementById('event-modal'),
    modalTitle: document.getElementById('modal-title'),
    closeBtn: document.getElementById('close-modal-btn'),
    cancelBtn: document.getElementById('btn-cancel'),
    saveBtn: document.getElementById('btn-save-event'),
    deleteBtn: document.getElementById('btn-delete-event'),
    titleInput: document.getElementById('event-title'),
    startInput: document.getElementById('event-start'),
    endInput: document.getElementById('event-end'),
    descInput: document.getElementById('event-desc'),
    typeInputs: document.getElementsByName('event-type'),
    addBtn: document.getElementById('btn-add-event')
};

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('planning');

    // ✅ PURE SUPABASE: Récupérer la session directement
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (session?.user) {
        currentUserId = session.user.id;

        // Charger les données utilisateur depuis Supabase
        const { data, error } = await supabase
            .from('users')
            .select('first_name, photo_url')
            .eq('id', session.user.id)
            .single();

        if (data && !error) {
            if(ui.userName) ui.userName.textContent = data.first_name;
            if(ui.userAvatar) ui.userAvatar.src = data.photo_url || `https://ui-avatars.com/api/?name=${data.first_name}&background=random`;
        }

        initCalendar();
        subscribeToEvents();

    } else {
        window.location.href = '../auth/login.html';
    }

    setupEventListeners();
});

function initCalendar() {
    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'fr',
        firstDay: 1,
        navLinks: true,
        editable: true,
        selectable: true,
        dayMaxEvents: true,
        height: '100%',

        select: handleDateSelect,
        eventClick: handleEventClick,
        eventDrop: handleEventDrop,
        eventResize: handleEventResize,

        eventClassNames: function(arg) {
            const type = arg.event.extendedProps.type || 'other';
            if (type === 'exam') return ['bg-red-600', 'border-red-700', 'text-white'];
            if (type === 'revision') return ['bg-indigo-600', 'border-indigo-700', 'text-white'];
            return ['bg-emerald-600', 'border-emerald-700', 'text-white'];
        }
    });

    calendar.render();
}

async function subscribeToEvents() {
    // ✅ PURE SUPABASE: Utiliser Supabase Realtime au lieu de Firestore onSnapshot

    // Nettoyer l'ancienne subscription si elle existe
    if (eventsSubscription) {
        await supabase.removeChannel(eventsSubscription);
    }

    // Charger les événements initiaux
    await loadEvents();

    // S'abonner aux changements en temps réel
    eventsSubscription = supabase
        .channel('planning_events_changes')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'planning_events',
                filter: `user_id=eq.${currentUserId}`
            },
            (payload) => {
                console.log('Planning event changed:', payload);
                loadEvents(); // Recharger tous les événements
            }
        )
        .subscribe();
}

async function loadEvents() {
    try {
        const { data: events, error } = await supabase
            .from('planning_events')
            .select('*')
            .eq('user_id', currentUserId);

        if (error) throw error;

        calendar.removeAllEvents();

        const calendarEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start_date,
            end: event.end_date,
            extendedProps: {
                description: event.description,
                type: event.type || 'other'
            }
        }));

        calendar.addEventSource(calendarEvents);
    } catch (error) {
        console.error("Erreur planning:", error);
        showMessage("Erreur chargement planning", "error");
    }
}

async function saveEvent() {
    const title = ui.titleInput.value.trim();
    const start = ui.startInput.value;
    const end = ui.endInput.value;
    const desc = ui.descInput.value.trim();
    const typeElement = document.querySelector('input[name="event-type"]:checked');

    if (!title || !start) return showMessage("Titre et date de début requis", "error");
    if (!typeElement) return showMessage("Sélectionnez un type d'événement", "error");
    const type = typeElement.value;

    // ✅ PURE SUPABASE: Données pour l'événement
    const eventData = {
        user_id: currentUserId,
        title,
        start_date: start,
        end_date: end || null,
        description: desc,
        type
    };

    ui.saveBtn.disabled = true;
    ui.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sauvegarde...';

    try {
        if (currentEventId) {
            // Mise à jour d'un événement existant
            const { error } = await supabase
                .from('planning_events')
                .update(eventData)
                .eq('id', currentEventId);

            if (error) throw error;
            showMessage("Événement modifié avec succès", "success");
        } else {
            // Création d'un nouvel événement
            const { error } = await supabase
                .from('planning_events')
                .insert([eventData]);

            if (error) throw error;
            showMessage("Événement ajouté avec succès", "success");
        }
        closeModal();
    } catch (e) {
        console.error("Erreur sauvegarde:", e);
        showMessage("Impossible de sauvegarder l'événement. Réessayez.", "error");
    } finally {
        ui.saveBtn.disabled = false;
        ui.saveBtn.innerHTML = '<i class="fas fa-save"></i> Sauvegarder';
    }
}

async function deleteEvent() {
    if (!currentEventId) return;
    if (!confirm("Supprimer définitivement cet événement ?")) return;

    ui.deleteBtn.disabled = true;
    ui.deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        // ✅ PURE SUPABASE: Suppression directe
        const { error } = await supabase
            .from('planning_events')
            .delete()
            .eq('id', currentEventId);

        if (error) throw error;
        showMessage("Événement supprimé avec succès", "success");
        closeModal();
    } catch (e) {
        console.error("Erreur suppression:", e);
        showMessage("Impossible de supprimer l'événement. Réessayez.", "error");
    } finally {
        ui.deleteBtn.disabled = false;
        ui.deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Supprimer';
    }
}

async function handleEventDrop(info) {
    const event = info.event;
    try {
        // ✅ PURE SUPABASE: Mise à jour des dates
        const { error } = await supabase
            .from('planning_events')
            .update({
                start_date: event.start.toISOString(),
                end_date: event.end ? event.end.toISOString() : null
            })
            .eq('id', event.id);

        if (error) throw error;
        showMessage("Événement déplacé avec succès", "success");
    } catch (e) {
        console.error("Erreur déplacement:", e);
        info.revert();
        showMessage("Impossible de déplacer l'événement", "error");
    }
}

async function handleEventResize(info) {
    const event = info.event;
    try {
        // ✅ PURE SUPABASE: Mise à jour de la date de fin
        const { error } = await supabase
            .from('planning_events')
            .update({
                end_date: event.end ? event.end.toISOString() : null
            })
            .eq('id', event.id);

        if (error) throw error;
        showMessage("Durée modifiée", "success");
    } catch (e) {
        console.error("Erreur redimensionnement:", e);
        info.revert();
        showMessage("Impossible de modifier la durée", "error");
    }
}

function handleDateSelect(selectInfo) {
    resetModal();
    currentEventId = null;
    ui.modalTitle.textContent = "Nouvel Événement";
    ui.deleteBtn.classList.add('hidden');

    const startStr = toLocalISOString(selectInfo.startStr);
    const endStr = selectInfo.endStr ? toLocalISOString(selectInfo.endStr) : '';

    ui.startInput.value = startStr.slice(0, 16);

    ui.modal.classList.remove('hidden');
}

function handleEventClick(clickInfo) {
    resetModal();
    currentEventId = clickInfo.event.id;
    ui.modalTitle.textContent = "Modifier l'événement";
    ui.deleteBtn.classList.remove('hidden');

    ui.titleInput.value = clickInfo.event.title;

    const props = clickInfo.event.extendedProps;
    ui.descInput.value = props.description || '';

    const type = props.type || 'other';
    const radio = document.querySelector(`input[name="event-type"][value="${type}"]`);
    if(radio) radio.checked = true;

    if(clickInfo.event.start) ui.startInput.value = toLocalISOString(clickInfo.event.start.toISOString()).slice(0, 16);
    if(clickInfo.event.end) ui.endInput.value = toLocalISOString(clickInfo.event.end?.toISOString() || clickInfo.event.start.toISOString()).slice(0, 16);

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

function toLocalISOString(dateStr) {
    const date = new Date(dateStr);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, -1);
    return localISOTime;
}

function setupEventListeners() {
    ui.addBtn.onclick = () => {
        resetModal();
        currentEventId = null;
        ui.modalTitle.textContent = "Nouvel Événement";
        ui.deleteBtn.classList.add('hidden');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        ui.startInput.value = now.toISOString().slice(0, 16);
        ui.modal.classList.remove('hidden');
    };

    ui.closeBtn.onclick = closeModal;
    ui.cancelBtn.onclick = closeModal;
    ui.saveBtn.onclick = saveEvent;
    ui.deleteBtn.onclick = deleteEvent;

    ui.modal.addEventListener('click', (e) => {
        if (e.target === ui.modal) closeModal();
    });

    // ✅ MEMORY LEAK FIX: Cleanup realtime subscriptions before page unload
    window.addEventListener('beforeunload', async () => {
        if (eventsSubscription) {
            await supabase.removeChannel(eventsSubscription);
            eventsSubscription = null;
        }
    });
}
