import { WIZARD_STATE, APP_GLOBALS, backendUrl } from '../core/state.js';
import { isToday, isAfter10Am, syncCabinOrMealFormToState } from '../utils/helpers.js';
import { saveMealDraft, saveCabinDraft, submitCabinBooking, submitMealBooking } from '../api/api.js';

import flatpickr from 'flatpickr';
import { Romanian } from 'flatpickr/dist/l10n/ro.js';
import 'flatpickr/dist/flatpickr.min.css';

export async function handleCabinSubmission() {
    if (!validateCabinStep3()) return;
    syncCabinOrMealFormToState();
    
    const payload = WIZARD_STATE.cabinFormData;

    const backendPayload = {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        telefon: payload.phonePrefix + payload.phone,
        start_date: payload.arrivalDate,
        end_date: payload.departureDate,
        adults: payload.adults,
        pets: payload.pets,
        wants_meal: payload.wantsMeal,
        wants_hottub: payload.wantsHotTub,
        rooms_needed: payload.rooms_needed || 1,
        newsletter: payload.newsletter
    }

    try {
        await submitCabinBooking(backendPayload);
        showCabinStep(4);
    } catch (err) {
        alert('Error submitting cabin booking: ' + err.message);
    }
}

export async function handleMealSubmission() {
    
}

// --- CALENDAR HANDLERS ---
export function handleArrivalChange(dates) {
    if (dates.length > 0) {
        const dep = new Date(dates[0]);
        dep.setDate(dep.getDate() + APP_GLOBALS.cabinNights);

        if (APP_GLOBALS.cabinDepartureFP) {
            APP_GLOBALS.cabinDepartureFP.setDate(dep, true);
            const dateStr = `${dep.getFullYear()}-${String(dep.getMonth() + 1).padStart(2, '0')}-${String(dep.getDate()).padStart(2, '0')}`;
            document.getElementById('cabinDepartureInput').value = dateStr;
            APP_GLOBALS.cabinDepartureFP.set('minDate', new Date(dates[0].getTime() + 24 * 60 * 60 * 1000));
        }
        updateNightsDisplay();
        updateCabinSummary();
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

export async function showSection(type) {
    const cabinEl = document.getElementById('sectiuneCabana');
    const mealEl = document.getElementById('sectiuneMancare');

    if (cabinEl) {
        cabinEl.style.display = 'flex';
    }
    if (mealEl) {
        mealEl.style.display = 'flex';
    }

    if (type === 'sectiuneCabana') {
        const arrivalInput = document.getElementById('cabinArrivalInput');
        const departureInput = document.getElementById('cabinDepartureInput');
        if (!arrivalInput || !departureInput) {
            console.error('Elementele calendarului lipsesc din HTML!');
            return;
        }

        if (!arrivalInput.dataset.fpBound) {
            arrivalInput.dataset.fpBound = 'true';
            arrivalInput.addEventListener('click', () => {
                if (!APP_GLOBALS.cabinArrivalFP) {
                    APP_GLOBALS.cabinArrivalFP = flatpickr(arrivalInput, {
                        mode: 'single',
                        minDate: 'today',
                        dateFormat: "Y-m-d",
                        locale: APP_GLOBALS.currentLanguage === 'ro' ? Romanian : 'en',
                        onChange: handleArrivalChange
                    });
                    APP_GLOBALS.cabinArrivalFP.open();
                }
            });
        }

        if (!departureInput.dataset.fpBound) {
            departureInput.dataset.fpBound = 'true';
            departureInput.addEventListener('click', () => {
                if (!APP_GLOBALS.cabinDepartureFP) {
                    APP_GLOBALS.cabinDepartureFP = flatpickr(departureInput, {
                        mode: 'single',
                        dateFormat: "Y-m-d",
                        locale: APP_GLOBALS.currentLanguage === 'ro' ? Romanian : 'en',
                        onChange: handleDepartureChange
                    });
                    APP_GLOBALS.cabinDepartureFP.open();
                }
            });
        }
    }

    if (type === 'sectiuneMancare') {
        const arrivalInputMeal = document.getElementById('mealArrivalInput');
        if (arrivalInputMeal && !arrivalInputMeal.dataset.fpBound) {
            arrivalInputMeal.dataset.fpBound = 'true';
            arrivalInputMeal.addEventListener('click', () => {
                if (!APP_GLOBALS.calendarMealInstance) {
                    APP_GLOBALS.calendarMealInstance = flatpickr(arrivalInputMeal, {
                        mode: 'single',
                        minDate: 'today',
                        dateFormat: "Y-m-d",
                        locale: APP_GLOBALS.currentLanguage === 'ro' ? Romanian : 'en',
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
    document.getElementById('sectiuneMancare')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    document.getElementById('sectiuneCabana')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Validation 
export function validateMealStep1() {
    if (!document.getElementById('mealArrivalInput')?.value && !document.getElementById('dataMStep1')?.value) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please select a date.' : 'Vă rugăm selectați o dată.');
        return false;
    }
    return true;
}

export function validateCabinStep1() {
    if (!document.getElementById('cabinArrivalInput').value || !document.getElementById('cabinDepartureInput').value) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please select arrival and departure dates.' : 'Vă rugăm selectați datele de sosire și plecare.');
        return false;
    }
    if (APP_GLOBALS.cabinNights < 1) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Minimum 1 night required.' : 'Minim 1 noapte obligatorie.');
        return false;
    }
    return true;
}

export function validateCabinStep3() {
    const firstName = document.getElementById('cabinFirstName').value.trim();
    const lastName = document.getElementById('cabinLastName').value.trim();
    const email = document.getElementById('cabinEmail').value.trim();
    if (!firstName || !lastName || !email) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please fill in all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid email address.' : 'Vă rugăm introduceți o adresă de email validă.');
        return false;
    }
    return true;
}

// Display Updates
export function updateNightsDisplay(shouldUpdateDeparture = true) {
    const el = document.getElementById('nightsDisplay');
    if (el) el.textContent = APP_GLOBALS.cabinNights === 1 ? '1 night' : `${APP_GLOBALS.cabinNights} nights`;

    if (shouldUpdateDeparture && APP_GLOBALS.cabinArrivalFP && APP_GLOBALS.cabinArrivalFP.selectedDates[0]) {
        const arrivalDate = new Date(APP_GLOBALS.cabinArrivalFP.selectedDates[0]);
        const dep = new Date(arrivalDate);
        dep.setDate(dep.getDate() + APP_GLOBALS.cabinNights);

        if (APP_GLOBALS.cabinDepartureFP) {
            APP_GLOBALS.cabinDepartureFP.setDate(dep, true);
            const dateStr = `${dep.getFullYear()}-${String(dep.getMonth() + 1).padStart(2, '0')}-${String(dep.getDate()).padStart(2, '0')}`;
            document.getElementById('cabinDepartureInput').value = dateStr;
        }
    }
    updateCabinSummary();
}

export function updateCabinSummary() {
    const panel = document.getElementById('summaryContent');
    if (!panel) return;
    const arrival = document.getElementById('cabinArrivalInput')?.value || '—';
    const departure = document.getElementById('cabinDepartureInput')?.value || '—';
    const rooms = document.getElementById('cabinRoomsSelect')?.value || '1';
    const adults = document.getElementById('cabinAdultsSelect')?.value || '1';
    const pets = document.getElementById('cabinPetsInput')?.value || '';

    panel.innerHTML = `
        <div class="summary-section">
            <div class="summary-row"><span class="summary-label">Check-in</span><strong>${arrival}</strong></div>
            <div class="summary-row"><span class="summary-label">Check-out</span><strong>${departure}</strong></div>
            <div class="summary-row"><span class="summary-label">Duration</span><strong>${APP_GLOBALS.cabinNights} ${APP_GLOBALS.cabinNights === 1 ? 'night' : 'nights'}</strong></div>
            <div class="summary-row"><span class="summary-label">Rooms</span><strong>${rooms}</strong></div>
            <div class="summary-row"><span class="summary-label">Adults</span><strong>${adults}</strong></div>
            ${pets ? `<div class="summary-row"><span class="summary-label">Pets</span><strong>${pets}</strong></div>` : ''}
        </div>
    `;
}

export function updateAdultsOptions(rooms) {
    const select = document.getElementById('cabinAdultsSelect');
    if(!select) return;
    const max = rooms * 3;
    const current = parseInt(select.value) || 1;
    select.innerHTML = '';
    for (let i = 1; i <= max; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
    }
    select.value = Math.min(current, max);
}

// Submissions


export async function processCabinBooking() {
    const prefix = document.getElementById('cabinPhonePrefix')?.value || '';
    const phone = prefix + document.getElementById('cabinPhone').value.trim();
    const payload = {
        first_name: document.getElementById('cabinFirstName').value.trim(),
        last_name: document.getElementById('cabinLastName').value.trim(),
        email: document.getElementById('cabinEmail').value.trim(),
        telefon: phone, // Unified property
        phone: phone,
        data_inceput: document.getElementById('cabinArrivalInput').value, // Unified property
        start_date: document.getElementById('cabinArrivalInput').value,
        data_sfarsit: document.getElementById('cabinDepartureInput').value,
        end_date: document.getElementById('cabinDepartureInput').value,
        adults: parseInt(document.getElementById('cabinAdultsSelect').value) || 1,
        rooms_needed: parseInt(document.getElementById('cabinRoomsSelect').value) || 1,
        vrea_meniu: WIZARD_STATE.cabinExtras.meal,
        wants_meal: WIZARD_STATE.cabinExtras.meal,
        vrea_hottub: WIZARD_STATE.cabinExtras.hotTub,
        wants_hottub: WIZARD_STATE.cabinExtras.hotTub
    };

    try {
        const res = await fetch(`${backendUrl}/api/cabinReservations`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) {
            WIZARD_STATE.cabinFormDirty = false;
            if (WIZARD_STATE.cabinDraftId) {
                await fetch(`${backendUrl}/api/reservations/draft/${WIZARD_STATE.cabinDraftId}`, { method: 'DELETE' });
            }
            showCabinStep(4);
        } else {
            const data = await res.json();
            alert('Error: ' + (data.error || 'Something went wrong.'));
        }
    } catch (err) { alert('Cannot reach the server. Please try again.'); }
}

export function resetCabinForm() {
    if(document.getElementById('cabinArrivalInput')) document.getElementById('cabinArrivalInput').value = '';
    if(document.getElementById('cabinDepartureInput')) document.getElementById('cabinDepartureInput').value = '';
    
    WIZARD_STATE.cabinExtras.hotTub = false;
    WIZARD_STATE.cabinExtras.meal = false;
    APP_GLOBALS.cabinNights = 1;

    updateAdultsOptions(1);
    updateNightsDisplay();
    updateCabinSummary();
}

// --- EVENT LISTENERS ---
export function initWizardEventListeners() {
    window.addEventListener('beforeunload', (e) => {
        if (WIZARD_STATE.mealFormDirty || WIZARD_STATE.cabinFormDirty) {
            e.preventDefault(); e.returnValue = '';
        }
    });

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

    document.getElementById('continueToExtrasBtn')?.addEventListener('click', function (e) {
        e.preventDefault();
        if (validateCabinStep1()) {
            WIZARD_STATE.cabinFormDirty = true;
            saveCabinDraft(1);
            showCabinStep(2);
        }
    });

    document.getElementById('continueToPersonalBtn')?.addEventListener('click', function (e) {
        e.preventDefault();
        updateCabinSummary();
        saveCabinDraft(2);
        showCabinStep(3);
    });

    document.getElementById('sendBookingBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!validateCabinStep3()) return;
        await processCabinBooking();
    });
    
    // Listeners for triggers
    document.addEventListener('click', function (e) {
        if (e.target.id === 'cabinArrivalInput' && APP_GLOBALS.cabinArrivalFP) APP_GLOBALS.cabinArrivalFP.open();
        if (e.target.id === 'cabinDepartureInput' && APP_GLOBALS.cabinDepartureFP) APP_GLOBALS.cabinDepartureFP.open();
    });
}