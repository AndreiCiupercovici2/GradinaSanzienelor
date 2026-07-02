import { WIZARD_STATE, APP_GLOBALS, backendUrl } from '../core/state.js';
import { isToday, isAfter10Am, syncCabinOrMealFormToState } from '../utils/helpers.js';
import { saveMealDraft, saveCabinDraft, submitCabinBooking, submitMealBooking } from '../api/api.js';

import flatpickr from 'flatpickr';
import { Romanian } from 'flatpickr/dist/l10n/ro.js';
import 'flatpickr/dist/flatpickr.min.css';

// ─── UI Notification Helpers ──────────────────────────────────────────────────

export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { error: '✕', success: '✓', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML =
        `<span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>` +
        `<span class="toast-message">${message}</span>` +
        `<button class="toast-close" aria-label="Close notification">&times;</button>`;

    const dismiss = () => {
        toast.classList.add('toast-fadeout');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    container.appendChild(toast);
    setTimeout(dismiss, 4000);
}

export function showConfirmModal(message, onConfirm) {
    const lang = APP_GLOBALS.currentLanguage;
    const overlay = document.createElement('div');
    overlay.id = 'confirm-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
        `<div class="confirm-modal">` +
        `<div class="confirm-modal-title">${lang === 'en' ? 'Confirm Action' : 'Confirmare acțiune'}</div>` +
        `<div class="confirm-modal-message">${message}</div>` +
        `<div class="confirm-modal-actions">` +
        `<button class="confirm-modal-cancel">${lang === 'en' ? 'Cancel' : 'Anulare'}</button>` +
        `<button class="confirm-modal-confirm">${lang === 'en' ? 'Confirm' : 'Confirmare'}</button>` +
        `</div>` +
        `</div>`;

    const close = () => overlay.remove();
    overlay.querySelector('.confirm-modal-cancel').addEventListener('click', close);
    overlay.querySelector('.confirm-modal-confirm').addEventListener('click', () => { close(); onConfirm(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
}

function markError(el) {
    if (!el) return;
    el.classList.add('input-error');
    el.addEventListener('input', () => el.classList.remove('input-error'), { once: true });
    el.addEventListener('change', () => el.classList.remove('input-error'), { once: true });
}

// ─────────────────────────────────────────────────────────────────────────────

export async function handleCabinSubmission() {
    if (!validateCabinStep3()) return;
    syncCabinOrMealFormToState();

    const payload = WIZARD_STATE.cabinFormData;

    const backendPayload = {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phonePrefix + payload.phone,
        start_date: payload.arrivalDate,
        end_date: payload.departureDate,
        adults: payload.adults,
        pets: payload.pets,
        wants_meal: payload.wantsMeal,
        wants_hottub: payload.wantsHotTub,
        rooms_needed: payload.rooms_needed || 1,
        newsletter: payload.newsletter
    };

    try {
        await submitCabinBooking(backendPayload);
        WIZARD_STATE.cabinFormDirty = false;
        if (WIZARD_STATE.cabinDraftId) {
            await saveCabinDraft(WIZARD_STATE.cabinDraftId, { ...backendPayload, current_step: 4 });
        }
        showCabinStep(4);
    } catch (err) {
        showToast('Error submitting cabin booking: ' + err.message, 'error');
    }
}

export async function handleMealSubmission() {
    if (!validateMealStep1()) return;
    syncCabinOrMealFormToState();

    const payload = WIZARD_STATE.mealFormData;

    const backendPayload = {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phonePrefix + payload.phone,
        reservation_date: payload.reservationDate,
        reservation_time: payload.reservationTime,
        adults: payload.adults,
        pets: payload.pets,
        wants_cabin: payload.wantsCabin,
        newsletter: payload.newsletter
    }
    try {
        await submitMealBooking(backendPayload);
        WIZARD_STATE.mealFormDirty = false;
        if (WIZARD_STATE.mealDraftId) {
            await saveMealDraft(WIZARD_STATE.mealDraftId, { ...backendPayload, current_step: 4 });
        }
        showMealStep(4);
    } catch (err) {
        showToast('Error submitting meal booking: ' + err.message, 'error');
    }
}

export function handleArrivalChange(dates) {
    const cabinArrivalInput = document.getElementById('cabinArrivalInput');
    const mealArrivalInput = document.getElementById('mealArrivalInput');
    if (cabinArrivalInput && cabinArrivalInput.value) {
        if (dates.length > 0) {
            const dep = new Date(dates[0]);
            dep.setDate(dep.getDate() + APP_GLOBALS.cabinNights);
            const dateStr = `${dep.getFullYear()}-${String(dep.getMonth() + 1).padStart(2, '0')}-${String(dep.getDate()).padStart(2, '0')}`;
            cabinArrivalInput.value = dateStr;

            if (APP_GLOBALS.cabinDepartureFP) {
                APP_GLOBALS.cabinDepartureFP.setDate(dep, true);
                APP_GLOBALS.cabinDepartureFP.set('minDate', new Date(dates[0].getTime() + 24 * 60 * 60 * 1000));
            }
            updateNightsDisplay();
            updateCabinSummary();
        }
    }
    if (mealArrivalInput && mealArrivalInput.value) {
        if (dates.length > 0) {
            const dep = new Date(dates[0]);
            dep.setDate(dep.getDate() + APP_GLOBALS.cabinNights);
            const dateStr = `${dep.getFullYear()}-${String(dep.getMonth() + 1).padStart(2, '0')}-${String(dep.getDate()).padStart(2, '0')}`;
            mealArrivalInput.value = dateStr;

            if (APP_GLOBALS.mealReservationFP) {
                APP_GLOBALS.mealReservationFP.setDate(dep, true);
                APP_GLOBALS.mealReservationFP.set('minDate', new Date(dates[0].getTime() + 24 * 60 * 60 * 1000));
            }
            updateNightsDisplay();
            updateMealSummary();
        }
    }
}

export function handleDepartureChange(dates) {
    if (dates.length > 0 && APP_GLOBALS.cabinArrivalFP && APP_GLOBALS.cabinArrivalFP.selectedDates[0]) {
        const arrival = APP_GLOBALS.cabinArrivalFP.selectedDates[0];
        const departure = dates[0];
        const diff = new Date(departure) - new Date(arrival);
        const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (nights > 0) {
            APP_GLOBALS.cabinNights = nights;
            updateNightsDisplay(false);
            updateCabinSummary();
        }
    }
}

async function fetchCabinOccupancy() {
    try {
        const resp = await fetch(`${backendUrl}/api/occupied_days`);
        if (!resp.ok) return { full: new Set(), partial: new Set() };
        const reservations = await resp.json();
        const adultsPerDay = {};
        for (const r of reservations) {
            const cur = new Date(r.start_date + 'T00:00:00');
            const end = new Date(r.end_date + 'T00:00:00');
            while (cur < end) {
                const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
                adultsPerDay[key] = (adultsPerDay[key] || 0) + (r.adults || 0);
                cur.setDate(cur.getDate() + 1);
            }
        }
        const full = new Set();
        const partial = new Set();
        for (const [date, adults] of Object.entries(adultsPerDay)) {
            if (adults >= 8) full.add(date);
            else if (adults > 0) partial.add(date);
        }
        return { full, partial };
    } catch {
        return { full: new Set(), partial: new Set() };
    }
}

async function fetchMealAvailability() {
    try {
        const resp = await fetch(`${backendUrl}/api/meal_availability`);
        if (!resp.ok) return { full: new Set(), partial: new Set() };
        const availability = await resp.json();
        const full = new Set();
        const partial = new Set();
        for (const [date, seats] of Object.entries(availability)) {
            if (seats >= 13) full.add(date);
            else if (seats > 0) partial.add(date);
        }
        return { full, partial };
    } catch {
        return { full: new Set(), partial: new Set() };
    }
}

export async function showSection(type) {
    const cabinEl = document.getElementById('cabinSection');
    const mealEl = document.getElementById('mealSection');

    if (cabinEl) {
        cabinEl.style.display = 'flex';
    }
    if (mealEl) {
        mealEl.style.display = 'flex';
    }

    if (type === 'cabinSection') {
        const arrivalInput = document.getElementById('cabinArrivalInput');
        const departureInput = document.getElementById('cabinDepartureInput');
        if (!arrivalInput || !departureInput) {
            console.error('Elementele calendarului lipsesc din HTML!');
            return;
        }

        if (!arrivalInput.dataset.fpBound) {
            arrivalInput.dataset.fpBound = 'true';
            arrivalInput.addEventListener('click', async () => {
                if (!APP_GLOBALS.cabinArrivalFP) {
                    const { full, partial } = await fetchCabinOccupancy();
                    const lang = APP_GLOBALS.currentLanguage;
                    APP_GLOBALS.cabinArrivalFP = flatpickr(arrivalInput, {
                        mode: 'single',
                        minDate: 'today',
                        dateFormat: "Y-m-d",
                        locale: lang === 'ro' ? Romanian : 'en',
                        disable: [d => {
                            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            if (full.has(key)) return true;
                            const today = new Date();
                            return d.getFullYear() === today.getFullYear() &&
                                d.getMonth() === today.getMonth() &&
                                d.getDate() === today.getDate() &&
                                isAfter10Am();
                        }],
                        onDayCreate(dObj, dStr, fp, dayElem) {
                            const key = `${dayElem.dateObj.getFullYear()}-${String(dayElem.dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayElem.dateObj.getDate()).padStart(2, '0')}`;
                            if (partial.has(key)) {
                                dayElem.classList.add('fp-partial-occupancy');
                                dayElem.title = lang === 'ro'
                                    ? 'Cabana este parțial ocupată în această noapte'
                                    : 'Cabin is partially occupied this night';
                            }
                        },
                        onChange: handleArrivalChange
                    });
                    APP_GLOBALS.cabinArrivalFP.open();
                }
            });
        }

        if (!departureInput.dataset.fpBound) {
            departureInput.dataset.fpBound = 'true';
            departureInput.addEventListener('click', async () => {
                if (!APP_GLOBALS.cabinDepartureFP) {
                    const { partial } = await fetchCabinOccupancy();
                    const lang = APP_GLOBALS.currentLanguage;
                    APP_GLOBALS.cabinDepartureFP = flatpickr(departureInput, {
                        mode: 'single',
                        dateFormat: "Y-m-d",
                        locale: lang === 'ro' ? Romanian : 'en',
                        onDayCreate(dObj, dStr, fp, dayElem) {
                            const key = `${dayElem.dateObj.getFullYear()}-${String(dayElem.dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayElem.dateObj.getDate()).padStart(2, '0')}`;
                            if (partial.has(key)) {
                                dayElem.classList.add('fp-partial-occupancy');
                                dayElem.title = lang === 'ro'
                                    ? 'Cabana este parțial ocupată în această noapte'
                                    : 'Cabin is partially occupied this night';
                            }
                        },
                        onChange: handleDepartureChange
                    });
                    APP_GLOBALS.cabinDepartureFP.open();
                }
            });
        }
    }

    if (type === 'mealSection') {
        const arrivalInputMeal = document.getElementById('mealArrivalInput');
        if (arrivalInputMeal && !arrivalInputMeal.dataset.fpBound) {
            arrivalInputMeal.dataset.fpBound = 'true';
            arrivalInputMeal.addEventListener('click', async () => {
                if (!APP_GLOBALS.calendarMealInstance) {
                    const { partial } = await fetchMealAvailability();
                    const lang = APP_GLOBALS.currentLanguage;
                    APP_GLOBALS.calendarMealInstance = flatpickr(arrivalInputMeal, {
                        mode: 'single',
                        minDate: 'today',
                        dateFormat: "Y-m-d",
                        locale: lang === 'ro' ? Romanian : 'en',
                        onDayCreate(dObj, dStr, fp, dayElem) {
                            const key = `${dayElem.dateObj.getFullYear()}-${String(dayElem.dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayElem.dateObj.getDate()).padStart(2, '0')}`;
                            if (partial.has(key)) {
                                dayElem.classList.add('fp-partial-occupancy');
                                dayElem.title = lang === 'ro'
                                    ? 'Masa este parțial ocupată în această zi'
                                    : 'Meal is partially occupied this day';
                            }
                        },
                        onChange: handleArrivalChange
                    });
                    APP_GLOBALS.calendarMealInstance.open();
                }
            });
        }
    }
}

export function showMealStep(stepNumber) {
    WIZARD_STATE.mealStep = stepNumber;
    [1, 2, 3, 4].forEach(i => {
        const stepContainer = document.getElementById(`step${i}ContainerMeal`);
        const stepIndicator = document.getElementById(`step${i}Meal`);
        if (stepContainer) stepContainer.style.display = i === stepNumber ? 'block' : 'none';
        if (stepIndicator) {
            stepIndicator.classList.remove('active', 'completed');
            if (i < stepNumber) stepIndicator.classList.add('completed');
            if (i === stepNumber) stepIndicator.classList.add('active');
        }
    });
    document.getElementById('mealSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function showCabinStep(stepNumber) {
    WIZARD_STATE.cabinStep = stepNumber;
    [1, 2, 3, 4].forEach(i => {
        const stepContainer = document.getElementById(`step${i}ContainerCabin`);
        const stepIndicator = document.getElementById(`step${i}Cabin`);
        if (stepContainer) stepContainer.style.display = i === stepNumber ? 'block' : 'none';
        if (stepIndicator) {
            stepIndicator.classList.remove('active', 'completed');
            if (i < stepNumber) stepIndicator.classList.add('completed');
            if (i === stepNumber) stepIndicator.classList.add('active');
        }
    });
    document.getElementById('cabinSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export async function validateMealStep1() {
    const lang = APP_GLOBALS.currentLanguage;
    const arrivalEl = document.getElementById('mealArrivalInput');
    const arrivalTimeEl = document.getElementById('mealArrivalTimeInput');
    const adultsEl = document.getElementById('mealAdultsInput');
    const petsEl = document.getElementById('mealPetsInput');

    if (!arrivalEl?.value) {
        markError(arrivalEl);
        showToast(lang === 'en' ? 'Please select a date.' : 'Vă rugăm selectați o dată.', 'warning');
        return false;
    }
    if (!arrivalTimeEl?.value) {
        markError(arrivalTimeEl);
        showToast(lang === 'en' ? 'Please select a time.' : 'Vă rugăm selectați o oră.', 'warning');
        return false;
    }
    if (isToday(arrivalEl.value) && isAfter10Am()) {
        markError(arrivalEl);
        showToast(lang === 'en' ? 'Same-day requests are no longer accepted. Please call.' : 'Cererea pentru azi nu mai este acceptată. Vă rugăm sunați.', 'warning');
        return false;
    }

    if ( arrivalTimeEl?.value ) {
        const selectedHour = parseInt(arrivalTimeEl.value.split(':')[0], 10);
        if (selectedHour >= 19) {
            markError(arrivalTimeEl);
            showToast(lang === 'en' ? 'Reservations after 7 PM are not accepted. Please call.' : 'Rezervările după ora 19:00 nu mai sunt acceptate. Vă rugăm sunați.', 'warning');
            return false;
        }
        if (selectedHour < 15) {
            markError(arrivalTimeEl);
            showToast(lang === 'en' ? 'Reservations before 3 PM are not accepted. Please call.' : 'Rezervările înainte de ora 15:00 nu mai sunt acceptate. Vă rugăm sunați.', 'warning');
            return false;
        }
    }

    const adults = parseInt(adultsEl?.value, 10);
    if (!adultsEl?.value || isNaN(adults) || adults < 1) {
        markError(adultsEl);
        showToast(lang === 'en' ? 'Adults must be at least 1.' : 'Adulți trebuie să fie cel puțin 1.', 'warning');
        return false;
    }
    if (adults > 15) {
        markError(adultsEl);
        showToast(lang === 'en' ? 'Maximum 15 people allowed for meals.' : 'Maxim 15 persoane permise pentru mese.', 'warning');
        return false;
    }

    try {
        const resp = await fetch(`${backendUrl}/api/meal_availability`);
        if (resp.ok) {
            const availability = await resp.json();
            const totalGuests = adults;
            if (availability.existingGuests + totalGuests > availability.maxCapacity) {
                markError(arrivalEl);
                showToast(lang === 'en' ? 'No availability for the selected date.' : 'Nu există disponibilitate pentru data selectată.', 'error');
                return false;
            }
        }
    } catch {
        markError(arrivalEl);
        showToast(lang === 'en' ? 'Error checking availability. Please try again later.' : 'Eroare la verificarea disponibilității. Vă rugăm încercați din nou mai târziu.', 'error');
        return false;
    }
    return true;
}

export function validateMealStep3() {
    const firstNameEl = document.getElementById('mealFirstName');
    const lastNameEl = document.getElementById('mealLastName');
    const emailEl = document.getElementById('mealEmail');
    const phoneEl = document.getElementById('mealPhone');
    const firstName = firstNameEl?.value.trim();
    const lastName = lastNameEl?.value.trim();
    const email = emailEl?.value.trim();
    const phone = phoneEl?.value.trim();
    if (!firstName || !lastName || !phone) {
        if (!firstName) markError(firstNameEl);
        if (!lastName) markError(lastNameEl);
        if (!phone) markError(phoneEl);
        showToast(APP_GLOBALS.currentLanguage === 'en' ? 'Please fill in all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.', 'warning');
        return false;
    }
    if (/[^a-zA-ZăîâșțĂÎÂȘȚ\s'-]/.test(firstName) || /[^a-zA-ZăîâșțĂÎÂȘȚ\s'-]/.test(lastName)) {
        markError(firstNameEl);
        markError(lastNameEl);
        showToast(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter valid names.' : 'Vă rugăm introduceți nume valide.', 'warning');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        markError(emailEl);
        showToast(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid email address.' : 'Vă rugăm introduceți o adresă de email validă.', 'warning');
        return false;
    }
    if (!/^[0-9\s\-\+()]{6,}$/.test(phone)) {
        markError(phoneEl);
        showToast(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid phone number.' : 'Vă rugăm introduceți un număr de telefon valid.', 'warning');
        return false;
    }
    return true;
}

export async function validateCabinStep1() {
    const lang = APP_GLOBALS.currentLanguage;
    const arrivalEl = document.getElementById('cabinArrivalInput');
    const departureEl = document.getElementById('cabinDepartureInput');
    const petsEl = document.getElementById('cabinPetsInput');
    const arrivalTimeEl = document.getElementById('cabinArrivalTimeInput');

    if (!arrivalEl?.value || !departureEl?.value) {
        if (!arrivalEl?.value) markError(arrivalEl);
        if (!departureEl?.value) markError(departureEl);
        showToast(lang === 'en' ? 'Please select arrival and departure dates.' : 'Vă rugăm selectați datele de sosire și plecare.', 'warning');
        return false;
    }
    if (!arrivalTimeEl?.value) {
        markError(arrivalTimeEl);
        showToast(lang === 'en' ? 'Please select an arrival time.' : 'Vă rugăm selectați o oră de sosire.', 'warning');
        return false;
    }
    if (APP_GLOBALS.cabinNights < 1) {
        showToast(lang === 'en' ? 'Minimum 1 night required.' : 'Minim 1 noapte obligatorie.', 'warning');
        return false;
    }
    if (isToday(arrivalEl.value) && isAfter10Am()) {
        markError(arrivalEl);
        showToast(lang === 'en' ? 'Same-day requests are no longer accepted. Please call.' : 'Cererea pentru azi nu mai este acceptată. Vă rugăm sunați.', 'warning');
        return false;
    }
    const adults = parseInt(document.getElementById('cabinAdultsSelect')?.value, 10);
    if (isNaN(adults) || adults < 1) {
        showToast(lang === 'en' ? 'Adults must be at least 1.' : 'Adulți trebuie să fie cel puțin 1.', 'warning');
        return false;
    }
    if (adults > 8) {
        showToast(lang === 'en' ? 'Number of people must be between 1 and 8.' : 'Numărul de persoane trebuie să fie între 1 și 8.', 'warning');
        return false;
    }

    try {
        const resp = await fetch(`${backendUrl}/api/occupied_days`);
        if (resp.ok) {
            const reservations = await resp.json();
            const start = new Date(arrivalEl.value);
            const end = new Date(departureEl.value);
            const existingAdults = reservations
                .filter(r => new Date(r.end_date) > start && new Date(r.start_date) < end)
                .reduce((sum, r) => sum + (r.adults || 0), 0);
            if (existingAdults + adults > 8) {
                markError(arrivalEl);
                markError(departureEl);
                showToast(lang === 'en' ? 'Cabin has no available spots for this period.' : 'Cabana nu mai are locuri disponibile în perioada selectată.', 'error');
                return false;
            }
        }
    } catch {
        // network error — let the server validate on submit
    }

    return true;
}

export function validateCabinStep3() {
    const firstNameEl = document.getElementById('cabinFirstName');
    const lastNameEl = document.getElementById('cabinLastName');
    const emailEl = document.getElementById('cabinEmail');
    const phoneEl = document.getElementById('cabinPhone');
    const firstName = firstNameEl?.value.trim();
    const lastName = lastNameEl?.value.trim();
    const email = emailEl?.value.trim();
    const phone = phoneEl?.value.trim();
    if (!firstName || !lastName || !email) {
        if (!firstName) markError(firstNameEl);
        if (!lastName) markError(lastNameEl);
        if (!email) markError(emailEl);
        showToast(APP_GLOBALS.currentLanguage === 'en' ? 'Please fill in all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.', 'warning');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        markError(emailEl);
        showToast(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid email address.' : 'Vă rugăm introduceți o adresă de email validă.', 'warning');
        return false;
    }
    if (!/^[0-9\s\-\+()]{6,}$/.test(phone)) {
        markError(phoneEl);
        showToast(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid phone number.' : 'Vă rugăm introduceți un număr de telefon valid.', 'warning');
        return false;
    }
    return true;
}

export function updateNightsDisplay(shouldUpdateDeparture = true) {
    const el = document.getElementById('nightsDisplay');
    if (el) el.textContent = APP_GLOBALS.cabinNights === 1 ? '1 night' : `${APP_GLOBALS.cabinNights} nights`;

    if (shouldUpdateDeparture && APP_GLOBALS.cabinArrivalFP && APP_GLOBALS.cabinArrivalFP.selectedDates[0]) {
        const arrivalDate = new Date(APP_GLOBALS.cabinArrivalFP.selectedDates[0]);
        const dep = new Date(arrivalDate);
        dep.setDate(dep.getDate() + APP_GLOBALS.cabinNights);
        const dateStr = `${dep.getFullYear()}-${String(dep.getMonth() + 1).padStart(2, '0')}-${String(dep.getDate()).padStart(2, '0')}`;
        document.getElementById('cabinDepartureInput').value = dateStr;

        if (APP_GLOBALS.cabinDepartureFP) {
            APP_GLOBALS.cabinDepartureFP.setDate(dep, true);
        }
    }
    updateCabinSummary();
}

export function updateCabinSummary() {
    const panel = document.getElementById('summaryContent');
    if (!panel) return;
    const arrival = document.getElementById('cabinArrivalInput')?.value || '—';
    const departure = document.getElementById('cabinDepartureInput')?.value || '—';
    const time = document.getElementById('cabinArrivalTimeInput')?.value || '—';
    const rooms = document.getElementById('cabinRoomsSelect')?.value || '1';
    const adults = document.getElementById('cabinAdultsSelect')?.value || '1';
    const pets = document.getElementById('cabinPetsInput')?.value || '';
    const hotTub = WIZARD_STATE.cabinExtras.hotTub ? 'Yes' : 'No';
    const meal = WIZARD_STATE.cabinExtras.meal ? 'Yes' : 'No';

    panel.innerHTML = `
        <div class="summary-section">
            <div class="summary-row"><span class="summary-label">Check-in</span><strong>${arrival}</strong></div>
            <div class="summary-row"><span class="summary-label">Check-in Time</span><strong>${time}</strong></div>
            <div class="summary-row"><span class="summary-label">Check-out</span><strong>${departure}</strong></div>
            <div class="summary-row"><span class="summary-label">Duration</span><strong>${APP_GLOBALS.cabinNights} ${APP_GLOBALS.cabinNights === 1 ? 'night' : 'nights'}</strong></div>
            <div class="summary-row"><span class="summary-label">Rooms</span><strong>${rooms}</strong></div>
            <div class="summary-row"><span class="summary-label">Adults</span><strong>${adults}</strong></div>
            ${pets ? `<div class="summary-row"><span class="summary-label">Pets</span><strong>${pets}</strong></div>` : ''}
            <div class="summary-row"><span class="summary-label">Hot Tub</span><strong>${hotTub}</strong></div>
            <div class="summary-row"><span class="summary-label">Meal</span><strong>${meal}</strong></div>
        </div>
    `;
}

export function updateMealSummary() {
    const panel = document.getElementById('summaryContent');
    if (!panel) return;
    const arrival = document.getElementById('mealArrivalInput')?.value || '—';
    const time = document.getElementById('mealArrivalTimeInput')?.value || '—';
    const adults = document.getElementById('mealAdultsInput')?.value || '1';
    const pets = document.getElementById('mealPetsInput')?.value || '';
    const wantsCabin = WIZARD_STATE.mealExtras?.cabin ? 'Yes' : 'No';

    panel.innerHTML = `
        <div class="summary-section">
            <div class="summary-row"><span class="summary-label">Check-in</span><strong>${arrival}</strong></div>
            <div class="summary-row"><span class="summary-label">Check-in Time</span><strong>${time}</strong></div>
            <div class="summary-row"><span class="summary-label">Adults</span><strong>${adults}</strong></div>
            ${pets ? `<div class="summary-row"><span class="summary-label">Pets</span><strong>${pets}</strong></div>` : ''}
            <div class="summary-row"><span class="summary-label">Cabin</span><strong>${wantsCabin}</strong></div>
        </div>
    `;
}


export function updateAdultsOptions(rooms) {
    const select = document.getElementById('cabinAdultsSelect');
    if (!select) return;
    const max = rooms * 3;
    const current = max - 2;
    select.innerHTML = '';
    for (let i = current; i <= max; i++) {
        if (i == 9) continue;
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
    }
    select.value = Math.min(current, max);
}

export function updateRoomsOptions(adults) {
    const select = document.getElementById('cabinRoomsSelect');
    if (!select) return;
    const maxRooms = Math.min(3, Math.ceil(adults / 1));
    const current = parseInt(select.value) || 1;
    select.innerHTML = '';
    for (let i = 1; i <= maxRooms; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
    }
    select.value = Math.min(current, maxRooms);
}

export function toggleMealExtras() {
    const mealExtras = document.getElementById('mealToggle');
    if (mealExtras) {
        const isVisible = mealExtras.style.display === 'block';
        mealExtras.style.display = isVisible ? 'none' : 'block';
        WIZARD_STATE.cabinExtras.meal = !isVisible;
    }
}

export function toggleHotTubExtras() {
    const hotTubExtras = document.getElementById('hotTubToggle');
    if (hotTubExtras) {
        const isVisible = hotTubExtras.style.display === 'block';
        hotTubExtras.style.display = isVisible ? 'none' : 'block';
        WIZARD_STATE.cabinExtras.hotTub = !isVisible;
    }
}

export function toggleCabinExtras() {
    const extrasSection = document.getElementById('cabinToggle');
    if (extrasSection) {
        const isVisible = extrasSection.style.display === 'block';
        extrasSection.style.display = isVisible ? 'none' : 'block';
    }
}

export function toggleNewsletter() {
    const newsletterCheckbox = document.getElementById('newsletter');
    if (newsletterCheckbox) {
        WIZARD_STATE.cabinFormData.newsletter = newsletterCheckbox.checked;
    }
}

export function resetCabinForm() {
    if (document.getElementById('cabinArrivalInput')) document.getElementById('cabinArrivalInput').value = '';
    if (document.getElementById('cabinDepartureInput')) document.getElementById('cabinDepartureInput').value = '';

    WIZARD_STATE.cabinExtras.hotTub = false;
    WIZARD_STATE.cabinExtras.meal = false;
    APP_GLOBALS.cabinNights = 1;

    updateAdultsOptions(1);
    updateRoomsOptions(1);
    updateNightsDisplay();
    updateCabinSummary();
}

export async function loadAndRestoreMealDraft(email, phone) {
    try {
        const resp = await fetch(`${backendUrl}/api/reservations/draft?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&reservation_type=meal`);
        if (!resp.ok) return false;

        const data = await resp.json();
        if (!data.found) return false;

        const draft = data.draft;
        const formData = draft.form_data;

        if (formData.reservation_date) document.getElementById('mealArrivalInput').value = formData.reservation_date;
        if (formData.reservation_time) document.getElementById('mealArrivalTimeInput').value = formData.reservation_time;
        if (formData.adults !== undefined) document.getElementById('mealAdultsInput').value = formData.adults;
        if (formData.pets !== undefined) document.getElementById('mealPetsInput').value = formData.pets;

        if (formData.first_name) document.getElementById('mealFirstName').value = formData.first_name;
        if (formData.last_name) document.getElementById('mealLastName').value = formData.last_name;
        if (formData.email) document.getElementById('mealEmail').value = formData.email;

        if (formData.phone) {
            const storedPhone = formData.phone;
            if (storedPhone.startsWith('+40')) {
                document.getElementById('mealPhonePrefix').value = '+40';
                document.getElementById('mealPhone').value = storedPhone.slice(3);
            } else if (storedPhone.startsWith('+')) {
                const prefixEnd = storedPhone.indexOf('-') > -1 ? storedPhone.indexOf('-') : 3;
                document.getElementById('mealPhonePrefix').value = storedPhone.slice(0, prefixEnd);
                document.getElementById('mealPhone').value = storedPhone.slice(prefixEnd);
            }
        }

        if (formData.wants_cabin !== undefined) WIZARD_STATE.mealExtras.cabin = formData.wants_cabin;

        WIZARD_STATE.mealDraftId = draft.id;

        updateMealSummary();
        showMealStep(draft.current_step);

        document.getElementById('resumeBannerMeal').style.display = 'none';

        WIZARD_STATE.mealFormDirty = true;

        return true;
    } catch (err) {
        console.error('Failed to load meal draft:', err);
        return false;
    }
}

export async function loadAndRestoreCabinDraft(email, phone) {
    try {
        const resp = await fetch(`${backendUrl}/api/reservations/draft?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&reservation_type=cabin`);
        if (!resp.ok) return false;

        const data = await resp.json();
        if (!data.found) return false;

        const draft = data.draft;
        const formData = draft.form_data;

        if (formData.start_date) document.getElementById('cabinArrivalInput').value = formData.start_date;
        if (formData.start_time) document.getElementById('cabinArrivalTimeInput').value = formData.start_time;
        if (formData.end_date) document.getElementById('cabinDepartureInput').value = formData.end_date;
        if (formData.adults !== undefined) document.getElementById('cabinAdultsSelect').value = formData.adults;
        if (formData.rooms_needed !== undefined) document.getElementById('cabinRoomsSelect').value = formData.rooms_needed;

        if (formData.wants_meal !== undefined) WIZARD_STATE.cabinExtras.meal = formData.wants_meal;
        if (formData.wants_hottub !== undefined) WIZARD_STATE.cabinExtras.hotTub = formData.wants_hottub;

        if (formData.first_name) document.getElementById('cabinFirstName').value = formData.first_name;
        if (formData.last_name) document.getElementById('cabinLastName').value = formData.last_name;
        if (formData.email) document.getElementById('cabinEmail').value = formData.email;
        if (formData.salutation) document.getElementById('cabinSalutation').value = formData.salutation;

        if (formData.phone) {
            const storedPhone = formData.phone;
            if (storedPhone.startsWith('+40')) {
                document.getElementById('cabinPhonePrefix').value = '+40';
                document.getElementById('cabinPhone').value = storedPhone.slice(3);
            } else if (storedPhone.startsWith('+')) {
                const prefixEnd = storedPhone.indexOf('-') > -1 ? storedPhone.indexOf('-') : 3;
                document.getElementById('cabinPhonePrefix').value = storedPhone.slice(0, prefixEnd);
                document.getElementById('cabinPhone').value = storedPhone.slice(prefixEnd);
            }
        }

        WIZARD_STATE.cabinDraftId = draft.id;

        updateAdultsOptions(parseInt(formData.rooms_needed) || 1);
        updateNightsDisplay();
        updateCabinSummary();

        showCabinStep(Math.min(draft.current_step, 4));

        document.getElementById('resumeBannerCabin').style.display = 'none';

        WIZARD_STATE.cabinFormDirty = true;

        return true;
    } catch (err) {
        console.error('Failed to load cabin draft:', err);
        return false;
    }
}

export function initWizardEventListeners() {
    window.addEventListener('beforeunload', (e) => {
        if (WIZARD_STATE.mealFormDirty || WIZARD_STATE.cabinFormDirty) {
            e.preventDefault(); e.returnValue = '';
        }
    });

    // ===== CABIN-SPECIFIC EVENT LISTENERS =====
    document.getElementById('nightsDecBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (APP_GLOBALS.cabinNights > 1) {
            APP_GLOBALS.cabinNights--;
            updateNightsDisplay();
        }
    });

    document.getElementById('nightsIncBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        APP_GLOBALS.cabinNights++;
        updateNightsDisplay();
    });

    // Step 1 to Step 2: Cabin workflow
    const cabinContinueBtn = document.querySelector('#step1ContainerCabin #continueToExtrasBtn');
    cabinContinueBtn?.addEventListener('click', async function (e) {
        e.preventDefault();
        if (await validateCabinStep1()) {
            WIZARD_STATE.cabinFormDirty = true;
            saveCabinDraft(1);
            showCabinStep(2);
        }
    });

    // Step 2 to Step 3: Cabin workflow
    const cabinPersonalBtn = document.querySelector('#step2ContainerCabin #continueToPersonalBtn');
    cabinPersonalBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        updateCabinSummary();
        saveCabinDraft(2);
        showCabinStep(3);
    });

    // Back to Step 1: Cabin workflow
    const cabinBackBtn = document.querySelector('#step2ContainerCabin #backToTravelBtn');
    cabinBackBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        showCabinStep(1);
    });

    // Back to Step 2: Cabin workflow
    const cabinBackExtrasBtn = document.querySelector('#step3ContainerCabin #backToExtrasBtn');
    cabinBackExtrasBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        showCabinStep(2);
    });

    // Submit Cabin Booking (Step 3 to Step 4)
    const cabinSendBtn = document.querySelector('#step3ContainerCabin #sendBookingBtn');
    cabinSendBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!validateCabinStep3()) return;
        await handleCabinSubmission();
    });

    // Cabin Extras Toggles
    document.getElementById('hotTubToggle')?.addEventListener('click', function (e) {
        e.preventDefault();
        const isAdded = WIZARD_STATE.cabinExtras.hotTub;
        WIZARD_STATE.cabinExtras.hotTub = !isAdded;
        this.textContent = !isAdded ? '- Remove Hot Tub' : '+ Add Hot Tub';
    });

    document.getElementById('mealToggle')?.addEventListener('click', function (e) {
        e.preventDefault();
        const isAdded = WIZARD_STATE.cabinExtras.meal;
        WIZARD_STATE.cabinExtras.meal = !isAdded;
        this.textContent = !isAdded ? '- Remove Meal Plan' : '+ Add Meal Plan';
    });

    // ===== MEAL-SPECIFIC EVENT LISTENERS =====

    // Step 1 to Step 2: Meal workflow
    const mealContinueBtn = document.querySelector('#step1ContainerMeal #continueToExtrasBtn');
    mealContinueBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        if (validateMealStep1()) {
            WIZARD_STATE.mealFormDirty = true;
            saveMealDraft(1);
            showMealStep(2);
        }
    });

    // Step 2 to Step 3: Meal workflow
    const mealPersonalBtn = document.querySelector('#step2ContainerMeal #continueToPersonalBtn');
    mealPersonalBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        updateMealSummary();
        saveMealDraft(2);
        showMealStep(3);
    });

    // Back to Step 1: Meal workflow
    const mealBackBtn = document.querySelector('#step2ContainerMeal #backToTravelBtn');
    mealBackBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        showMealStep(1);
    });

    // Back to Step 2: Meal workflow
    const mealBackExtrasBtn = document.querySelector('#step3ContainerMeal #backToExtrasBtn');
    mealBackExtrasBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        showMealStep(2);
    });

    // Submit Meal Booking (Step 3 to Step 4)
    const mealSendBtn = document.querySelector('#step3ContainerMeal #sendBookingBtn');
    mealSendBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!validateMealStep2()) return;
        await handleMealSubmission();
    });

    // Meal Extras Toggle
    document.getElementById('cabinToggle')?.addEventListener('click', function (e) {
        e.preventDefault();
        const isMealSection = document.getElementById('mealSection');
        if (isMealSection) {
            const isAdded = WIZARD_STATE.mealExtras?.cabin || false;
            WIZARD_STATE.mealExtras = { cabin: !isAdded };
            this.textContent = !isAdded ? '- Remove Cabin' : '+ Add Cabin';
        }
    });

    // ===== SHARED CALENDAR EVENT LISTENERS =====
    document.addEventListener('click', function (e) {
        if (e.target.id === 'cabinArrivalInput' && APP_GLOBALS.cabinArrivalFP) APP_GLOBALS.cabinArrivalFP.open();
        if (e.target.id === 'cabinDepartureInput' && APP_GLOBALS.cabinDepartureFP) APP_GLOBALS.cabinDepartureFP.open();
    });

    // Rooms select change listener - update adults options
    document.getElementById('cabinRoomsSelect')?.addEventListener('change', function (e) {
        const rooms = parseInt(this.value) || 1;
        updateAdultsOptions(rooms);
        updateCabinSummary();
    });

    // ===== MEAL QUICK DATE BUTTONS =====
    document.getElementById('btnToday')?.addEventListener('click', function (e) {
        e.preventDefault();
        if (!this.disabled) {
            const today = new Date();
            const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
            document.getElementById('mealArrivalInput').value = dateStr;
            showMealStep(1);
        }
    });

    document.getElementById('btnTomorrow')?.addEventListener('click', function (e) {
        e.preventDefault();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
        document.getElementById('mealArrivalInput').value = dateStr;
        showMealStep(1);
    });

    document.getElementById('newBookingBtn')?.addEventListener('click', function (e) {
        e.preventDefault();
        const msg = APP_GLOBALS.currentLanguage === 'en'
            ? 'Are you sure you want to start a new booking? Unsaved changes will be lost.'
            : 'Sigur doriți să începeți o rezervare nouă? Modificările nesalvate vor fi pierdute.';
        showConfirmModal(msg, () => {
            resetCabinForm();
            showCabinStep(1);
            showMealStep(1);
        });
    });
}
