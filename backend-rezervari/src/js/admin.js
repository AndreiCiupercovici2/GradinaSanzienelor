import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { calculateNights, formatDate, formatDateDMY } from './utils/helpers.js';

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login';
}

const backendUrl = '/api';

async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        alert('Sesiunea a expirat. Te rugăm să te autentifici din nou.');
        window.location.href = 'login';
        throw new Error('Unauthorized');
    }
    return response;
}

let cabinReservationsData = [];
let mealReservationsData = [];
let cabinCalendar;
let mealCalendar;
let blockedDatesData = [];

const TOTAL_CABIN_ROOMS = 3;
const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login';
});

async function fetchBlockedDates() {
    try {
        const res = await fetchWithAuth(`${backendUrl}/portalIntern/blocked-dates`);
        if (res.ok) {
            blockedDatesData = await res.json();
            if (mealCalendar) {
                mealCalendar.redraw();
            }
            if (cabinCalendar) {
                cabinCalendar.redraw();
            }
        }
    } catch (error) {
        console.error('Error fetching blocked dates:', error);
    }
}

// Build approve / reject buttons when status is 'pending'
function generateButtons(id, reservationType, currentStatus) {
    if (currentStatus === 'pending') {
        return `
            <button class="btn-approve" onclick="window.changeStatus(${id}, '${reservationType}', 'confirm')">✔️ Aprobă</button>
            <button class="btn-reject" onclick="window.changeStatus(${id}, '${reservationType}', 'reject')">❌ Respinge</button>
        `;
    }
    return `<strong class="status-text status-${currentStatus}">${currentStatus.toUpperCase()}</strong>`;
}


// Called by the Approve / Reject buttons
async function changeStatus(id, reservationType, decision) {
    if (!confirm(`Ești sigură că vrei să marchezi această rezervare ca ${decision}?`)) return;

    try {
        const response = await fetchWithAuth(`${backendUrl}/portalIntern/decision`, {
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

        const isBlocked = blockedDatesData.some(b => {
            return b.type === 'meal' && currentCellDate >= b.start_date && currentCellDate <= b.end_date;
        });

        const activeRez = mealReservationsData.filter(rez => {
            return rez.status === 'confirmed' && rez.reservation_date === currentCellDate;
        });

        if (isBlocked) {
            dayElem.classList.add("cal-meal-blocked");
            dayElem.title = "Dată blocată manual";
        } else if (activeRez.length > 0) {
            dayElem.classList.add("cal-meal-booked");
        } else {
            dayElem.classList.add("cal-meal-free"); 
        }
    },

    onChange: function (selectedDates, dateStr, instance) {
        const detailsContainer = document.getElementById('mealDetails');
        if (!detailsContainer) return;

        detailsContainer.style.display = 'block';

        const blockedInfo = blockedDatesData.find(b => b.type === 'meal' && dateStr >= b.start_date && dateStr <= b.end_date);
        if (blockedInfo) {
            detailsContainer.innerHTML = `<p style="color: #dc3545;"><strong>${dateStr}</strong>: Dată blocată manual. Motiv: ${blockedInfo.reason || 'N/A'}</p>`;
            return;
        }

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

        const isBlocked = blockedDatesData.some(b => {
            return b.type === 'cabin' && currentCellDate >= b.start_date && currentCellDate <= b.end_date;
        });

        const activeRez = cabinReservationsData.filter(rez => {
            const safeStart = rez.start_date ? rez.start_date.substring(0, 10) : "";
            const safeEnd = rez.end_date ? rez.end_date.substring(0, 10) : "";

            return rez.status === 'confirmed' &&
                currentCellDate >= safeStart &&
                currentCellDate <= safeEnd;
        });

        const roomsBooked = activeRez.reduce((sum, r) => sum + parseInt(r.rooms_needed || 1), 0);

        if (isBlocked) {
            dayElem.classList.add("cal-cabin-blocked");
            dayElem.title = "Dată blocată manual";
        } else if (roomsBooked >= TOTAL_CABIN_ROOMS) {
            dayElem.classList.add("cal-fully-booked"); 
        } else if (roomsBooked > 0) {
            dayElem.classList.add("cal-partially-booked"); 
        } else {
            dayElem.classList.add("cal-free");
        }    
    },

    onChange: function (selectedDates, dateStr, instance) {
        const detailsContainer = document.getElementById('cabinDetails');
        if (!detailsContainer) return;

        detailsContainer.style.display = 'block';

        const blockedInfo = blockedDatesData.find(b => b.type === 'cabin' && dateStr >= b.start_date && dateStr <= b.end_date);
        if (blockedInfo) {
            detailsContainer.innerHTML = `<p style="color: #dc3545;"><strong>${formatDateDMY(dateStr)}</strong>: Dată blocată manual. Motiv: ${blockedInfo.reason || 'N/A'}</p>`;
            return;
        }

        const activeRez = cabinReservationsData.filter(rez => {
            const safeStart = rez.start_date ? rez.start_date.substring(0, 10) : "";
            const safeEnd = rez.end_date ? rez.end_date.substring(0, 10) : "";

            return rez.status === 'confirmed' &&
                dateStr >= safeStart &&
                dateStr <= safeEnd;
        });

        if (activeRez.length === 0) {
            detailsContainer.innerHTML = `<p style="color: #28a745;"><strong>${formatDateDMY(dateStr)}</strong>: Cabana este complet liberă.</p>`;
        } else {
            let html = `<p><strong>Cazări active în data de ${formatDateDMY(dateStr)} - până la ${formatDateDMY(activeRez[0].end_date)}</strong></p><ul>`;
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
        const res = await fetchWithAuth(`${backendUrl}/portalIntern/meal`);

        if (!res.ok) {
            console.error('Error fetching meal reservations:', res.status);
            alert('Nu s-au putut încărca rezervările de mâncare.');
            return;
        }

        const reservations = await res.json();

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

        mealReservationsData.sort((a, b) => {
            const dateCompare = (a.reservation_date || '').localeCompare(b.reservation_date || '');
            if (dateCompare !== 0) return dateCompare;
            return (a.reservation_time || '').localeCompare(b.reservation_time || '');

        });

        mealReservationsData.forEach(rez => {
            table.innerHTML += `
                <tr>
                    <td style="color:#888; font-size:12px;">${formatDate(rez.created_at)}</td>
                    <td>${rez.first_name} ${rez.last_name} <br> <small>${rez.phone}</small><br> <small>${rez.email}</small></td>
                    <td><strong>${formatDateDMY(rez.reservation_date)}</strong></td>
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
        const res = await fetchWithAuth(`${backendUrl}/portalIntern/cabin`);

        if (!res.ok) {
            console.error('Error fetching cabin reservations:', res.status);
            alert('Nu s-au putut încărca rezervările de cabană.');
            return;
        }

        const reservations = await res.json();

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

        cabinReservationsData.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

        cabinReservationsData.forEach(rez => {
            table.innerHTML += `
                <tr>
                    <td style="color:#888; font-size:12px;">${formatDate(rez.created_at)}</td>
                    <td>${rez.first_name} ${rez.last_name} <br> <small>${rez.phone}</small><br> <small>${rez.email}</small></td>
                    <td><strong>${formatDateDMY(rez.start_date)} - ${formatDateDMY(rez.end_date)}<br>${calculateNights(rez.start_date, rez.end_date)} nopți</strong></td>
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

async function blockDate(type, startDate, endDate, reason) {
    const response = await fetchWithAuth(`${backendUrl}/portalIntern/block-date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, start_date: startDate, end_date: endDate, reason: reason })
    });
    if (response.ok) {
        alert('Datele au fost blocate cu succes!');
        loadBlockedDates();
    } else {
        alert('A apărut o eroare la blocarea datelor.');
    }
}

async function loadBlockedDates() {
    try {
        const res = await fetchWithAuth(`${backendUrl}/portalIntern/blocked-dates`);
        if (!res.ok) {
            console.error('Error fetching blocked dates:', res.status);
            return;
        }
        const blockedDates = await res.json();

        if (!Array.isArray(blockedDates)) {
            console.error('API returned non-array data for blocked dates:', blockedDates);
            return;
        }

        blockedDatesData = blockedDates;

        if (mealCalendar) {
            mealCalendar.redraw();
        }
        if (cabinCalendar) {
            cabinCalendar.redraw();
        }
    } catch (error) {
        console.error('Exception in loadBlockedDates:', error);
    }
}

const blockStartPicker = flatpickr("#blockStartDate", {
    dateFormat: "Y-m-d",
    minDate: "today",
    onChange: function (selectedDates, dateStr) {
        blockEndPicker.set('minDate', dateStr);
    }
});

const blockEndPicker = flatpickr("#blockEndDate", {
    dateFormat: "Y-m-d",
    minDate: "today"
});

document.getElementById('blockDatesForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const type = document.getElementById('blockType').value;
    const startDate = document.getElementById('blockStartDate').value;
    const endDate = document.getElementById('blockEndDate').value;
    const reason = document.getElementById('blockReason').value;

    if (startDate > endDate) {
        alert('Data de început nu poate fi după data de sfârșit.');
        return;
    }

    if (!confirm(`Ești sigur că vrei să blochezi disponibilitatea pentru ${type === 'cabin' ? 'Cabană' : 'Masă'} între ${formatDateDMY(startDate)} și ${formatDateDMY(endDate)}?`)) {
        return;
    }

    await blockDate(type, startDate, endDate, reason);

    e.target.reset();
    blockEndPicker.set('minDate', 'today');
});

window.changeStatus = changeStatus;
window.loadMealReservations = loadMealReservations;
window.loadCabinReservations = loadCabinReservations;

setInterval(() => {
    loadMealReservations();
    loadCabinReservations();
    loadBlockedDates();
}, 30000);

loadMealReservations();
loadCabinReservations();
loadBlockedDates();
