import { WIZARD_STATE, APP_GLOBALS, backendUrl } from '../core/state.js';
import { isToday, isAfter10Am, setVal, setChecked } from '../utils/helpers.js';
import { submitCabinBooking, submitMealBooking } from '../api/api.js';

import { translations } from '../core/translations.js';

import flatpickr from 'flatpickr';
import { Romanian } from 'flatpickr/dist/l10n/ro.js';

export function initWizardEventListeners() {
    window.addEventListener('beforeunload', (e) => {
        if (WIZARD_STATE.mealFormDirty || WIZARD_STATE.cabinFormDirty) {
            e.preventDefault(); e.returnValue = '';
        }
    });

    document.getElementById('cabinSection')?.addEventListener('input', (e) => {
        const id = e.target?.id;
        if (!WIZARD_STATE.cabinFormData) WIZARD_STATE.cabinFormData = {};
        const state = WIZARD_STATE.cabinFormData;

        if (id === 'cabinFirstName') state.firstName = e.target.value;
        if (id === 'cabinLastName') state.lastName = e.target.value;
        if (id === 'cabinEmail') state.email = e.target.value;
        if (id === 'cabinPhone') state.phone = e.target.value;
        if (id === 'cabinArrivalTimeInput') state.arrivalTime = e.target.value;
        if (id === 'cabinAdultsSelect') state.adults = parseInt(e.target.value) || 1;
        if (id === 'cabinPetsInput') state.pets = e.target.value;
        if (id === 'cabinRoomsSelect') state.rooms_needed = parseInt(e.target.value) || 1;

        saveToLocalStorage();
    });

    document.getElementById('mealSection')?.addEventListener('input', (e) => {
        const id = e.target?.id;
        if (!WIZARD_STATE.mealFormData) WIZARD_STATE.mealFormData = {};
        const state = WIZARD_STATE.mealFormData;

        if (id === 'mealFirstName') state.firstName = e.target.value;
        if (id === 'mealLastName') state.lastName = e.target.value;
        if (id === 'mealEmail') state.email = e.target.value;
        if (id === 'mealPhone') state.phone = e.target.value;
        if (id === 'mealArrivalTimeInput') state.reservationTime = e.target.value;
        if (id === 'mealAdultsInput') state.adults = parseInt(e.target.value) || 1;
        if (id === 'mealPetsInput') state.pets = e.target.value;

        saveToLocalStorage();
    });

    // ===== CABIN-SPECIFIC EVENT LISTENERS =====
    document.getElementById('nightsDecBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (APP_GLOBALS.cabinNights > 1) {
            APP_GLOBALS.cabinNights--;
            updateNightsDisplay();
            saveToLocalStorage();
        }
    });

    document.getElementById('nightsIncBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        APP_GLOBALS.cabinNights++;
        updateNightsDisplay();
        saveToLocalStorage();
    });

    // Step 1 to Step 2: Cabin workflow
    const cabinContinueBtn = document.querySelector('#step1ContainerCabin #continueToExtrasBtn');
    cabinContinueBtn?.addEventListener('click', async function (e) {
        e.preventDefault();
        if (await validateCabinStep1()) {
            WIZARD_STATE.cabinFormDirty = true;
            showCabinStep(2);
            saveToLocalStorage();
        }
    });

    // Step 2 to Step 3: Cabin workflow
    const cabinPersonalBtn = document.querySelector('#step2ContainerCabin #continueToPersonalBtn');
    cabinPersonalBtn?.addEventListener('click', async function (e) {
        e.preventDefault();
        updateCabinSummary();
        showCabinStep(3);
        saveToLocalStorage();
    });

    // Back to Step 1: Cabin workflow
    const cabinBackBtn = document.querySelector('#step2ContainerCabin #backToTravelBtn');
    cabinBackBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        showCabinStep(1);
        saveToLocalStorage();
    });

    // Back to Step 2: Cabin workflow
    const cabinBackExtrasBtn = document.querySelector('#step3ContainerCabin #backToExtrasBtn');
    cabinBackExtrasBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        showCabinStep(2);
        saveToLocalStorage();
    });

    // Submit Cabin Booking (Step 3 to Step 4)
    const cabinSendBtn = document.querySelector('#step3ContainerCabin #sendBookingBtn');
    cabinSendBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!validateCabinStep3()) return;
        saveToLocalStorage();
        await handleCabinSubmission();
    });

    // Cabin Extras Toggles
    document.getElementById('hotTubToggle')?.addEventListener('click', function (e) {
        e.preventDefault();
        const isAdded = WIZARD_STATE.cabinExtras?.hotTub || false;
        WIZARD_STATE.cabinExtras.hotTub = !isAdded;
        this.textContent = !isAdded ? APP_GLOBALS.currentLanguage === 'en' ? '+ Remove Hot Tub' : '+ Elimina Ciubăr' : APP_GLOBALS.currentLanguage === 'en' ? '+ Add Hot Tub' : '+ Adaugă Jacuzzi';
        saveToLocalStorage();
    });

    document.getElementById('mealToggle')?.addEventListener('click', function (e) {
        e.preventDefault();
        const isAdded = WIZARD_STATE.cabinExtras?.meal || false;
        WIZARD_STATE.cabinExtras.meal = !isAdded;
        this.textContent = !isAdded ? APP_GLOBALS.currentLanguage === 'en' ? '+ Remove Meal' : '+ Elimina Masă' : APP_GLOBALS.currentLanguage === 'en' ? '+ Add Meal' : '+ Adaugă Masă';
        saveToLocalStorage();
    });

    // Rooms select change listener - update adults options
    document.getElementById('cabinRoomsSelect')?.addEventListener('change', function (e) {
        const rooms = parseInt(this.value) || 1;
        updateAdultsOptions(rooms);
        updateCabinSummary();
        saveToLocalStorage();
    });

    // ===== MEAL-SPECIFIC EVENT LISTENERS =====

    // Step 1 to Step 2: Meal workflow
    const mealContinueBtn = document.querySelector('#step1ContainerMeal #continueToExtrasBtn');
    mealContinueBtn?.addEventListener('click', async function (e) {
        e.preventDefault();
        if (await validateMealStep1()) {
            WIZARD_STATE.mealFormDirty = true;
            saveToLocalStorage();
            showMealStep(2);
        }
    });

    // Step 2 to Step 3: Meal workflow
    const mealPersonalBtn = document.querySelector('#step2ContainerMeal #continueToPersonalBtn');
    mealPersonalBtn?.addEventListener('click', async function (e) {
        e.preventDefault();
        updateMealSummary();
        saveToLocalStorage();
        showMealStep(3);
    });

    // Back to Step 1: Meal workflow
    const mealBackBtn = document.querySelector('#step2ContainerMeal #backToTravelBtn');
    mealBackBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        showMealStep(1);
        saveToLocalStorage();
    });

    // Back to Step 2: Meal workflow
    const mealBackExtrasBtn = document.querySelector('#step3ContainerMeal #backToExtrasBtn');
    mealBackExtrasBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        showMealStep(2);
        saveToLocalStorage();
    });

    // Submit Meal Booking (Step 3 to Step 4)
    const mealSendBtn = document.querySelector('#step3ContainerMeal #sendBookingBtn');
    mealSendBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!validateMealStep3()) return;
        await handleMealSubmission();
        saveToLocalStorage();
    });

    // Meal Extras Toggle
    document.getElementById('cabinToggle')?.addEventListener('click', function (e) {
        e.preventDefault();
        const isMealSection = document.getElementById('mealSection');
        if (isMealSection) {
            const isAdded = WIZARD_STATE.mealExtras?.cabin || false;
            WIZARD_STATE.mealExtras.cabin = !isAdded;
            this.textContent = !isAdded ? APP_GLOBALS.currentLanguage === 'en' ? '+ Remove Cabin' : '+ Elimină Cabana' : APP_GLOBALS.currentLanguage === 'en' ? '+ Add Cabin' : '+ Adaugă Cabana';
            saveToLocalStorage();
        }
    });

    document.getElementById('newBookingBtn')?.addEventListener('click', function (e) {
        e.preventDefault();
        const msg = APP_GLOBALS.currentLanguage === 'en'
            ? 'Are you sure you want to start a new booking?'
            : 'Sigur doriți să începeți o rezervare nouă?';
        showConfirmModal(msg, () => {
            resetCabinForm();
            showCabinStep(1);
            showMealStep(1);
            saveToLocalStorage();
        });
    });

    document.addEventListener('change', function (e) {
        const id = e.target?.id;

        if (id === 'newsletterCheck') {
            const isChecked = e.target.checked;

            if (!WIZARD_STATE.cabinFormData) WIZARD_STATE.cabinFormData = {};
            WIZARD_STATE.cabinFormData.newsletter = isChecked;

            if (!WIZARD_STATE.mealFormData) WIZARD_STATE.mealFormData = {};
            WIZARD_STATE.mealFormData.newsletter = isChecked;

            saveToLocalStorage();
        }
    });

    document.querySelectorAll('.date-input-card, .time-input-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const input = card.querySelector('input, select');
            if (input && e.target !== input) {
                input.focus();
                if (input._flatpickr) {
                    input._flatpickr.open();
                } else if (typeof input.showPicker === 'function') {
                    input.showPicker();
                } else {
                    input.click();
                }
            }
        });
    });
}

export function saveToLocalStorage() {
    localStorage.setItem('wizardState', JSON.stringify(WIZARD_STATE));
}

export function loadFromLocalStorage() {
    const savedState = localStorage.getItem('wizardState');
    if (savedState) {
        try {

            const parsedState = JSON.parse(savedState);
            Object.assign(WIZARD_STATE, parsedState);

            const cabinState = WIZARD_STATE.cabinFormData;

            if (cabinState) {
                setVal('cabinFirstName', cabinState.firstName);
                setVal('cabinLastName', cabinState.lastName);
                setVal('cabinEmail', cabinState.email);
                setVal('cabinPhone', cabinState.phone);
                setVal('cabinPhonePrefix', cabinState.phonePrefix);
                setVal('cabinArrivalTimeInput', cabinState.arrivalTime);
                setVal('cabinAdultsSelect', cabinState.adults);
                setVal('cabinPetsInput', cabinState.pets);
                setVal('cabinRoomsSelect', cabinState.rooms_needed);
                setChecked('cabinNewsletter', cabinState.newsletter);
            }
            const hotTubToggle = document.getElementById('hotTubToggle');
            const mealToggle = document.getElementById('mealToggle');

            if (hotTubToggle && WIZARD_STATE.cabinExtras?.hotTub) {
                hotTubToggle.textContent = APP_GLOBALS.currentLanguage === 'en' ? '+ Remove Hot Tub' : '+ Elimina Ciubăr';
            }
            if (mealToggle && WIZARD_STATE.cabinExtras?.meal) {
                mealToggle.textContent = APP_GLOBALS.currentLanguage === 'en' ? '+ Remove Meal' : '+ Elimina Masă';
            }

            if (WIZARD_STATE.cabinStep > 1) {
                showCabinStep(WIZARD_STATE.cabinStep);
                updateCabinSummary();
            }

            const mealState = WIZARD_STATE.mealFormData;
            if (mealState) {
                setVal('mealFirstName', mealState.firstName);
                setVal('mealLastName', mealState.lastName);
                setVal('mealEmail', mealState.email);
                setVal('mealPhone', mealState.phone);
                setVal('mealPhonePrefix', mealState.phonePrefix);
                setVal('mealArrivalTimeInput', mealState.reservationTime);
                setVal('mealAdultsInput', mealState.adults);
                setVal('mealPetsInput', mealState.pets);
                setChecked('mealNewsletter', mealState.newsletter);
            }

            const cabinToggle = document.getElementById('cabinToggle');
            if (cabinToggle && WIZARD_STATE.mealExtras?.cabin) {
                cabinToggle.textContent = APP_GLOBALS.currentLanguage === 'en' ? '+ Remove Cabin' : '+ Elimină Cabana';
            }

            if (WIZARD_STATE.mealStep > 1) {
                showMealStep(WIZARD_STATE.mealStep);
                updateMealSummary();
            }
        } catch (e) {
            console.error('Error loading cabin state from localStorage:', e);
            localStorage.removeItem('wizardState');
        }
    }
}

export async function handleCabinSubmission() {
    if (!validateCabinStep3()) return;

    const payload = WIZARD_STATE.cabinFormData;
    const extras = WIZARD_STATE.cabinExtras;
    const fallbackStartDate = document.getElementById('cabinArrivalInput')?.value || '';
    const fallbackEndDate = document.getElementById('cabinDepartureInput')?.value || '';
    const fallbackArrivalTime = document.getElementById('cabinArrivalTimeInput')?.value || '';

    const backendPayload = {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phonePrefix + payload.phone,
        start_date: payload.arrivalDate || fallbackStartDate,
        end_date: payload.departureDate || fallbackEndDate,
        arrival_time: payload.arrivalTime || fallbackArrivalTime,
        adults: parseInt(payload.adults, 10) || 1,
        pets: payload.pets,
        wants_meal: extras.meal ? true : false,
        wants_hottub: extras.hotTub ? true : false,
        rooms_needed: payload.rooms_needed || 1,
        newsletter: payload.newsletter ? true : false
    };

    try {
        await submitCabinBooking(backendPayload);
        WIZARD_STATE.cabinFormDirty = false;

        localStorage.removeItem('wizardState');
        showCabinStep(4);
    } catch (e) {
        showToast('Error submitting cabin booking: ' + e.message, 'error');
    }
}

export async function handleMealSubmission() {
    if (!validateMealStep3()) return;

    const payload = WIZARD_STATE.mealFormData;
    const fallbackDate = document.getElementById('mealArrivalInput')?.value || '';
    const fallbackTime = document.getElementById('mealArrivalTimeInput')?.value || '';

    const backendPayload = {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phonePrefix + payload.phone,
        reservation_date: payload.reservationDate || fallbackDate,
        reservation_time: payload.reservationTime || fallbackTime,
        adults: parseInt(payload.adults, 10) || 1,
        pets: payload.pets,
        wants_cabin: WIZARD_STATE.mealExtras.cabin ? true : false,
        newsletter: payload.newsletter ? true : false
    };

    try {
        await submitMealBooking(backendPayload);
        WIZARD_STATE.mealFormDirty = false;

        localStorage.removeItem('wizardState');
        showMealStep(4);
    } catch (e) {
        showToast('Error submitting meal booking: ' + e.message, 'error');
    }
}
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


export function handleArrivalChange(dates) {
    if (!dates || dates.length === 0) return;
    const arrivalDate = new Date(dates[0]);
    const arrDateStr = `${arrivalDate.getFullYear()}-${String(arrivalDate.getMonth() + 1).padStart(2, '0')}-${String(arrivalDate.getDate()).padStart(2, '0')}`;
    const cabinArrivalInput = document.getElementById('cabinArrivalInput');
    const cabinDepartureInput = document.getElementById('cabinDepartureInput');
    const mealArrivalInput = document.getElementById('mealArrivalInput');

    if (cabinArrivalInput && cabinDepartureInput) {
        const depDate = new Date(arrivalDate);
        depDate.setDate(depDate.getDate() + APP_GLOBALS.cabinNights);
        const depDateStr = `${depDate.getFullYear()}-${String(depDate.getMonth() + 1).padStart(2, '0')}-${String(depDate.getDate()).padStart(2, '0')}`;
        cabinDepartureInput.value = depDateStr;

        if (!WIZARD_STATE.cabinFormData) WIZARD_STATE.cabinFormData = {};
        WIZARD_STATE.cabinFormData.arrivalDate = arrDateStr;
        WIZARD_STATE.cabinFormData.departureDate = depDateStr;

        if (APP_GLOBALS.cabinDepartureFP) {
            const nextDay = new Date(arrivalDate.getTime() + 24 * 60 * 60 * 1000);
            APP_GLOBALS.cabinDepartureFP.set('minDate', nextDay);
            APP_GLOBALS.cabinDepartureFP.setDate(depDate, false);
        }
        updateNightsDisplay(false);
        updateCabinSummary();
    }
    if (mealArrivalInput) {
        const mealDateStr = `${arrivalDate.getFullYear()}-${String(arrivalDate.getMonth() + 1).padStart(2, '0')}-${String(arrivalDate.getDate()).padStart(2, '0')}`;
        mealArrivalInput.value = mealDateStr;

        if (!WIZARD_STATE.mealFormData) WIZARD_STATE.mealFormData = {};
        WIZARD_STATE.mealFormData.reservationDate = mealDateStr;

        if (APP_GLOBALS.mealReservationFP) {
            APP_GLOBALS.mealReservationFP.setDate(arrivalDate, false);
        }
        updateMealSummary();
    }

    saveToLocalStorage();
}

export function handleDepartureChange(dates) {
    if (dates.length > 0 && APP_GLOBALS.cabinArrivalFP && APP_GLOBALS.cabinArrivalFP.selectedDates[0]) {
        const arrival = APP_GLOBALS.cabinArrivalFP.selectedDates[0];
        const departure = new Date(dates[0]);
        const diff = departure.getTime() - arrival.getTime();
        const nights = Math.round(diff / (1000 * 60 * 60 * 24));
        if (nights > 0) {
            APP_GLOBALS.cabinNights = nights;

            const depDateStr = `${departure.getFullYear()}-${String(departure.getMonth() + 1).padStart(2, '0')}-${String(departure.getDate()).padStart(2, '0')}`;

            if (!WIZARD_STATE.cabinFormData) WIZARD_STATE.cabinFormData = {};
            WIZARD_STATE.cabinFormData.departureDate = depDateStr;
            updateNightsDisplay(false);
            updateCabinSummary();

            saveToLocalStorage();
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
            if (seats >= 15) full.add(date);
            else if (seats > 0) partial.add(date);
        }
        return { full, partial };
    } catch {
        return { full: new Set(), partial: new Set() };
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
    // if (!arrivalTimeEl?.value) {
    //     markError(arrivalTimeEl);
    //     showToast(lang === 'en' ? 'Please select a time.' : 'Vă rugăm selectați o oră.', 'warning');
    //     return false;
    // }
    if (isToday(arrivalEl.value) && isAfter10Am()) {
        markError(arrivalEl);
        showToast(lang === 'en' ? 'Same-day requests are no longer accepted. Please call.' : 'Cererea pentru azi nu mai este acceptată. Vă rugăm sunați.', 'warning');
        return false;
    }

    if (arrivalTimeEl?.value) {
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
    // if (!arrivalTimeEl?.value) {
    //     markError(arrivalTimeEl);
    //     showToast(lang === 'en' ? 'Please select an arrival time.' : 'Vă rugăm selectați o oră de sosire.', 'warning');
    //     return false;
    // }
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
    if (!firstName || !lastName || !phone) {
        if (!firstName) markError(firstNameEl);
        if (!lastName) markError(lastNameEl);
        if (!phone) markError(phoneEl);
        showToast(APP_GLOBALS.currentLanguage === 'en' ? 'Please fill in all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.', 'warning');
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

    if (shouldUpdateDeparture && APP_GLOBALS.cabinArrivalFP) {
        let arrivalDate = null;
        if (APP_GLOBALS.cabinArrivalFP && APP_GLOBALS.cabinArrivalFP.selectedDates && APP_GLOBALS.cabinArrivalFP.selectedDates.length > 0) {
            arrivalDate = new Date(APP_GLOBALS.cabinArrivalFP.selectedDates[0]);
        }

        else {
            const arrivalInput = document.getElementById('cabinArrivalInput');
            if (arrivalInput && arrivalInput.value) {
                arrivalDate = new Date(arrivalInput.value);
            }
        }
        if (arrivalDate) {
            const dep = new Date(arrivalDate);
            dep.setDate(dep.getDate() + APP_GLOBALS.cabinNights);
            const dateStr = `${dep.getFullYear()}-${String(dep.getMonth() + 1).padStart(2, '0')}-${String(dep.getDate()).padStart(2, '0')}`;
            document.getElementById('cabinDepartureInput').value = dateStr;

            if (APP_GLOBALS.cabinDepartureFP) {
                APP_GLOBALS.cabinDepartureFP.setDate(dep, false);
            }
        }
        updateCabinSummary();
    }
}

export function updateCabinSummary() {
    const panel = document.getElementById('summaryContent');
    if (!panel) return;
    const lang = APP_GLOBALS.currentLanguage;
    const t = translations[lang];
    
    const arrival = document.getElementById('cabinArrivalInput')?.value || '—';
    const departure = document.getElementById('cabinDepartureInput')?.value || '—';
    const time = document.getElementById('cabinArrivalTimeInput')?.value || '—';
    const rooms = document.getElementById('cabinRoomsSelect')?.value || '1';
    const adults = document.getElementById('cabinAdultsSelect')?.value || '1';
    const pets = document.getElementById('cabinPetsInput')?.value || '';
    const hotTub = WIZARD_STATE.cabinExtras.hotTub ? t.yes : t.no;
    const meal = WIZARD_STATE.cabinExtras.meal ? t.yes : t.no;

    panel.innerHTML = `
        <div class="summary-section">
            <div class="summary-row"><span class="summary-label" data-i18n="check_in">${t.summary_arrival}</span><strong>${arrival}</strong></div>
            <div class="summary-row"><span class="summary-label" data-i18n="check_in_time">${t.summary_time}</span><strong>${time}</strong></div>
            <div class="summary-row"><span class="summary-label" data-i18n="check_out">${t.label_departure}</span><strong>${departure}</strong></div>
            <div class="summary-row"><span class="summary-label" data-i18n="duration">${t.summary_nights}</span><strong>${APP_GLOBALS.cabinNights} ${APP_GLOBALS.cabinNights === 1 ? t.label_night : t.label_nights}</strong></div>
            <div class="summary-row"><span class="summary-label" data-i18n="rooms">${t.summary_rooms}</span><strong>${rooms}</strong></div>
            <div class="summary-row"><span class="summary-label" data-i18n="adults">${t.summary_adults}</span><strong>${adults}</strong></div>
            ${pets ? `<div class="summary-row"><span class="summary-label" data-i18n="pets">${t.label_pets}</span><strong>${pets}</strong></div>` : ''}
            <div class="summary-row"><span class="summary-label" data-i18n="hot_tub">${t.extras_hottub}</span><strong>${hotTub}</strong></div>
            <div class="summary-row"><span class="summary-label" data-i18n="meal">${t.extras_meal_plan}</span><strong>${meal}</strong></div>
        </div>
    `;
}

export function updateMealSummary() {
    const panel = document.getElementById('summaryContent');
    if (!panel) return;
    const lang = APP_GLOBALS.currentLanguage;
    const t = translations[lang];

    const arrival = document.getElementById('mealArrivalInput')?.value || '—';
    const time = document.getElementById('mealArrivalTimeInput')?.value || '—';
    const adults = document.getElementById('mealAdultsInput')?.value || '1';
    const pets = document.getElementById('mealPetsInput')?.value || '';
    const wantsCabin = WIZARD_STATE.mealExtras?.cabin ? t.yes : t.no;

    panel.innerHTML = `
        <div class="summary-section">
            <div class="summary-row"><span class="summary-label">${t.summary_arrival}</span><strong>${arrival}</strong></div>
            <div class="summary-row"><span class="summary-label">${t.summary_time}</span><strong>${time}</strong></div>
            <div class="summary-row"><span class="summary-label">${t.summary_adults}</span><strong>${adults}</strong></div>
            ${pets ? `<div class="summary-row"><span class="summary-label">${t.label_pets}</span><strong>${pets}</strong></div>` : ''}
            <div class="summary-row"><span class="summary-label">${t.extras_cabin}</span><strong>${wantsCabin}</strong></div>
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

export function initializeCalendars() {
    const cabinArrivalInput = document.getElementById('cabinArrivalInput');
    const cabinDepartureInput = document.getElementById('cabinDepartureInput');
    const mealArrivalInput = document.getElementById('mealArrivalInput');

    if (cabinArrivalInput && cabinDepartureInput) {
        initializeFlatpickr(cabinArrivalInput, 'cabinSection');
        initializeFlatpickr(cabinDepartureInput, 'cabinSection');
    }

    if (mealArrivalInput) {
        initializeFlatpickr(mealArrivalInput, 'mealSection');
    }
}

function initializeFlatpickr(inputElement, type) {
    const lang = APP_GLOBALS.currentLanguage;
    const isArrival = inputElement.id.includes('Arrival');
    const isDeparture = inputElement.id.includes('Departure');
    const isReservation = inputElement.id.includes('Reservation');
    const isPastCutOff = typeof isAfter10Am === 'function' ? isAfter10Am() : new Date().getHours() >= 10;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const baseMinDate = isPastCutOff ? tomorrow : 'today';
    const baseDefaultDate = isPastCutOff ? tomorrow : 'today';

    let fpInstance;

    // Cabin arrival
    if (type === 'cabinSection' && isArrival) {
        fpInstance = flatpickr(inputElement, {
            mode: 'single',
            minDate: baseMinDate,
            defaultDate: baseDefaultDate,
            dateFormat: "Y-m-d",
            locale: lang === 'ro' ? Romanian : 'en',
            onChange: handleArrivalChange
        });
        APP_GLOBALS.cabinArrivalFP = fpInstance;

        fetchCabinOccupancy().then(({ full, partial }) => {
            fpInstance.set('disable', [
                d => {
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return full.has(key);
                }
            ]);

            fpInstance.set('onDayCreate', (dObj, dStr, fp, dayElem) => {
                const key = `${dayElem.dateObj.getFullYear()}-${String(dayElem.dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayElem.dateObj.getDate()).padStart(2, '0')}`;
                if (partial.has(key)) {
                    dayElem.classList.add('fp-partial-occupancy');
                    dayElem.title = lang === 'ro'
                        ? 'Cabana este parțial ocupată în această noapte'
                        : 'Cabin is partially occupied this night';
                }
            });
            fpInstance.redraw();
        }).catch(err => {
            console.error('Error fetching cabin occupancy:', err);
        });
    }

    // Cabin departure
    if (type === 'cabinSection' && isDeparture) {
        const defaultDepDate = isPastCutOff ? new Date(tomorrow) : new Date();
        defaultDepDate.setDate(defaultDepDate.getDate() + APP_GLOBALS.cabinNights);
        fpInstance = flatpickr(inputElement, {
            mode: 'single',
            minDate: baseMinDate,
            defaultDate: defaultDepDate,
            dateFormat: "Y-m-d",
            locale: lang === 'ro' ? Romanian : 'en',
            onChange: handleDepartureChange
        });
        APP_GLOBALS.cabinDepartureFP = fpInstance;
    }

    else if (type === 'mealSection') {
        fpInstance = flatpickr(inputElement, {
            mode: 'single',
            minDate: baseMinDate,
            defaultDate: baseDefaultDate,
            dateFormat: "Y-m-d",
            locale: lang === 'ro' ? Romanian : 'en',
            onChange: handleArrivalChange
        });
        APP_GLOBALS.calendarMealInstance = fpInstance;
        APP_GLOBALS.mealReservationFP = fpInstance;
    }
}


