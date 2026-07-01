const backendUrl = '/api';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { calculateNights, formatDate } from './utils/helpers.js';

let cabinReservationsData = [];
let mealReservationsData = [];
let cabinCalendar;
let mealCalendar;

const TOTAL_CABIN_ROOMS = 3;

// Format a UTC registration date for display

// Build approve / reject buttons when status is 'pending'
function generateButtons(id, reservationType, currentStatus) {
    if (currentStatus === 'pending') {
        return `
            <button class="btn-approve" onclick="window.changeStatus(${id}, '${reservationType}', 'confirm')">✔️ Aprobă</button>
            <button class="btn-reject" onclick="window.changeStatus(${id}, '${reservationType}', 'rejected')">❌ Respinge</button>
        `;
    }
    return `<strong class="status-text status-${currentStatus}">${currentStatus.toUpperCase()}</strong>`;
}


// Called by the Approve / Reject buttons
async function changeStatus(id, reservationType, decision) {
    if (!confirm(`Ești sigură că vrei să marchezi această rezervare ca ${decision}?`)) return;

    try {
        const response = await fetch(`${backendUrl}/portalIntern/decision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, reservationType: reservationType, decision: decision })
        });

        if (response.ok) {
            alert('Status actualizat cu succes!');
            // Reload tables to reflect the new status
            loadMealReservations();
            loadCabinReservations();
        } else {
            alert('A apărut o eroare la actualizare.');
        }
    } catch (error) {
        console.error(error);
    }
}

mealCalendar = flatpickr("#mealAdminCalendarBtn", {
    enableTime: false,
    dateFormat: "Y-m-d",
    minDate: "today",

    // Se execută pentru fiecare zi randată în calendar
    onDayCreate: function (dObj, dStr, fp, dayElem) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cellDate = new Date(dayElem.dateObj);
        cellDate.setHours(0, 0, 0, 0);

        if (cellDate < today) {
            return;
        }

        const y = dayElem.dateObj.getFullYear();
        const m = String(dayElem.dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dayElem.dateObj.getDate()).padStart(2, '0');
        const currentCellDate = `${y}-${m}-${d}`;

        const activeRez = mealReservationsData.filter(rez => {
            return rez.status === 'confirmed' && rez.reservation_date === currentCellDate;
        });

        if (activeRez.length > 0) {
            dayElem.classList.add("cal-meal-booked"); // Maro
        } else {
            dayElem.classList.add("cal-meal-free"); // Verde
        }
    },

    // Se execută când dai click pe o dată
    onChange: function (selectedDates, dateStr, instance) {
        const detailsContainer = document.getElementById('mealDetails');
        if (!detailsContainer) return;

        // Afișăm containerul (în caz că l-am ascuns inițial)
        detailsContainer.style.display = 'block';

        const activeRez = mealReservationsData.filter(rez => {
            return rez.status === 'confirmed' && rez.reservation_date === dateStr;
        });

        if (activeRez.length === 0) {
            detailsContainer.innerHTML = `<p style="color: #28a745;"><strong>${dateStr}</strong>: Nu există rezervări de masă confirmate.</p>`;
        } else {
            let html = `<p><strong>Rezervări de masă confirmate în data de ${dateStr}:</strong></p><ul>`;
            activeRez.forEach(rez => {
                html += `<li>👤 <strong>${rez.first_name} ${rez.last_name}</strong> - Adulți: ${rez.adults}, Animale: ${rez.pets}</li>`;
            });
            html += `</ul>`;
            detailsContainer.innerHTML = html;
        }
    }
});

cabinCalendar = flatpickr("#cabinAdminCalendarBtn", {
    enableTime: false,
    dateFormat: "Y-m-d",

    minDate: "today",

    // Se execută pentru fiecare zi randată în calendar
    onDayCreate: function (dObj, dStr, fp, dayElem) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cellDate = new Date(dayElem.dateObj);
        cellDate.setHours(0, 0, 0, 0);

        if (cellDate < today) {
            return;
        }

        const y = dayElem.dateObj.getFullYear();
        const m = String(dayElem.dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dayElem.dateObj.getDate()).padStart(2, '0');
        const currentCellDate = `${y}-${m}-${d}`;

        const activeRez = cabinReservationsData.filter(rez => {
            // Decupăm strict partea de YYYY-MM-DD din baza de date
            const safeStart = rez.start_date ? rez.start_date.substring(0, 10) : "";
            const safeEnd = rez.end_date ? rez.end_date.substring(0, 10) : "";

            return rez.status === 'confirmed' &&
                currentCellDate >= safeStart &&
                currentCellDate <= safeEnd;
        });

        const roomsBooked = activeRez.reduce((sum, r) => sum + parseInt(r.rooms_needed || 1), 0);

        if (roomsBooked >= TOTAL_CABIN_ROOMS) {
            dayElem.classList.add("cal-fully-booked"); // Maro
        } else if (roomsBooked > 0) {
            dayElem.classList.add("cal-partially-booked"); // Galben
        } else {
            dayElem.classList.add("cal-free"); // Verde
        }
    },

    // Se execută când dai click pe o dată
    onChange: function (selectedDates, dateStr, instance) {
        const detailsContainer = document.getElementById('cabinDetails');
        if (!detailsContainer) return;

        // Afișăm containerul (în caz că l-am ascuns inițial)
        detailsContainer.style.display = 'block';

        const activeRez = cabinReservationsData.filter(rez => {
            const safeStart = rez.start_date ? rez.start_date.substring(0, 10) : "";
            const safeEnd = rez.end_date ? rez.end_date.substring(0, 10) : "";

            return rez.status === 'confirmed' &&
                dateStr >= safeStart &&
                dateStr <= safeEnd;
        });

        if (activeRez.length === 0) {
            detailsContainer.innerHTML = `<p style="color: #28a745;"><strong>${dateStr}</strong>: Cabana este complet liberă.</p>`;
        } else {
            let html = `<p><strong>Cazări active în data de ${dateStr} - până la ${activeRez[0].end_date}</strong></p><ul>`;
            activeRez.forEach(rez => {
                html += `<li>👤 <strong>${rez.first_name} ${rez.last_name}</strong> (${rez.rooms_needed} camere / Adulți: ${rez.adults}) - ${calculateNights(rez.start_date, rez.end_date)} nopți</li>`;
            });
            html += `</ul>`;
            detailsContainer.innerHTML = html;
        }
    }
});

async function loadMealReservations() {
    try {
        const res = await fetch(`${backendUrl}/portalIntern/meal`);

        // Check if response was successful
        if (!res.ok) {
            console.error('Error fetching meal reservations:', res.status);
            alert('Nu s-au putut încărca rezervările de mâncare.');
            return;
        }

        const reservations = await res.json();

        // Validate that reservations is an array
        if (!Array.isArray(reservations)) {
            console.error('API returned non-array data for meal reservations:', reservations);
            alert('Format de date invalid de la server.');
            return;
        }

        mealReservationsData = reservations;
        if (mealCalendar) {
            mealCalendar.redraw();
        }

        const table = document.getElementById('mealTable');
        table.innerHTML = '';

        reservations.forEach(rez => {
            table.innerHTML += `
                <tr>
                    <td style="color:#888; font-size:12px;">${formatDate(rez.created_at)}</td>
                    <td>${rez.first_name} ${rez.last_name} <br> <small>${rez.phone}</small><br> <small>${rez.email}</small></td>
                    <td><strong>${rez.reservation_date}</strong></td>
                    <td>${rez.adults}</td>
                    <td>${rez.pets}</td>
                    <td>${rez.wants_cabin ? 'Da' : 'Nu'}</td>
                    <td>${rez.newsletter ? 'Da' : 'Nu'}</td>
                    <td class="status">${generateButtons(rez.id, 'meal', rez.status)}</td>
                </tr>`;
        });
    } catch (error) {
        console.error('Exception in loadMealReservations:', error);
        alert('A apărut o eroare la încărcarea rezervărilor de mâncare.');
    }
}

async function loadCabinReservations() {
    try {
        const res = await fetch(`${backendUrl}/portalIntern/cabin`);

        // Check if response was successful
        if (!res.ok) {
            console.error('Error fetching cabin reservations:', res.status);
            alert('Nu s-au putut încărca rezervările de cabană.');
            return;
        }

        const reservations = await res.json();

        // Validate that reservations is an array
        if (!Array.isArray(reservations)) {
            console.error('API returned non-array data for cabin reservations:', reservations);
            alert('Format de date invalid de la server.');
            return;
        }

        cabinReservationsData = reservations;

        if (cabinCalendar) {
            cabinCalendar.redraw();
        }

        const table = document.getElementById('cabinTable');
        table.innerHTML = '';

        reservations.forEach(rez => {
            table.innerHTML += `
                <tr>
                    <td style="color:#888; font-size:12px;">${formatDate(rez.created_at)}</td>
                    <td>${rez.first_name} ${rez.last_name} <br> <small>${rez.phone}</small><br> <small>${rez.email}</small></td>
                    <td>${rez.start_date} - ${rez.end_date}<br>${calculateNights(rez.start_date, rez.end_date)} nopți</td>
                    <td>${rez.adults} <br> Meniu: ${rez.wants_meal ? 'Da' : 'Nu'}</td>
                    <td>${rez.rooms_needed}</td>
                    <td>${rez.wants_hottub ? 'Da' : 'Nu'}</td>
                    <td>${rez.pets}</td>
                    <td>${rez.newsletter ? 'Da' : 'Nu'}</td>
                    <td class="status">${generateButtons(rez.id, 'cabin', rez.status)}</td>
                </tr>`;
        });
    } catch (error) {
        console.error('Exception in loadCabinReservations:', error);
        alert('A apărut o eroare la încărcarea rezervărilor de cabană.');
    }
}

// Export to global scope so inline onclick handlers can access them
window.changeStatus = changeStatus;
window.loadMealReservations = loadMealReservations;
window.loadCabinReservations = loadCabinReservations;

// Auto-refresh every 30 seconds
setInterval(() => {
    loadMealReservations();
    loadCabinReservations();
}, 30000);

// Initial load
loadMealReservations();
loadCabinReservations();
