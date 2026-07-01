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
        showCabinStep(4);
    } catch (err) {
        alert('Error submitting cabin booking: ' + err.message);
    }
}

export async function handleMealSubmission() {
    const prefix = document.getElementById('mealPhonePrefix')?.value || '';
    const phone = prefix + document.getElementById('mealPhone').value.trim();
    const payload = {
        first_name: document.getElementById('mealFirstName').value.trim(),
        last_name: document.getElementById('mealLastName').value.trim(),
        email: document.getElementById('mealEmail').value.trim(),
        phone: phone,
        reservation_date: document.getElementById('mealArrivalInput').value,
        adults: parseInt(document.getElementById('mealAdultsInput').value) || 1,
        wants_cabin: WIZARD_STATE.mealExtras?.cabin || false,
        pets: document.getElementById('mealPetsInput').value || ''
    };

    try {
        const res = await fetch(`${backendUrl}/api/meal_reservations`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) {
            WIZARD_STATE.mealFormDirty = false;
            if (WIZARD_STATE.mealDraftId) {
                await fetch(`${backendUrl}/api/reservations/draft/${WIZARD_STATE.mealDraftId}`, { method: 'DELETE' });
            }
            showMealStep(4);
        } else {
            const data = await res.json();
            alert('Error: ' + (data.error || 'Something went wrong.'));
        }
    } catch (err) { alert('Cannot reach the server. Please try again.'); }
}

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

    if (type === 'mealSection') {
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

export function validateMealStep1() {
    if (!document.getElementById('mealArrivalInput')?.value) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please select a date.' : 'Vă rugăm selectați o dată.');
        return false;
    }
    return true;
}

export function validateMealStep3() {
    const firstName = document.getElementById('mealFirstName')?.value.trim();
    const lastName = document.getElementById('mealLastName')?.value.trim();
    const email = document.getElementById('mealEmail')?.value.trim();
    const phone = document.getElementById('mealPhone')?.value.trim();
    if (!firstName || !lastName || !email) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please fill in all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid email address.' : 'Vă rugăm introduceți o adresă de email validă.');
        return false;
    }
    if (!/^[0-9\s\-\+()]{6,}$/.test(phone)) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid phone number.' : 'Vă rugăm introduceți un număr de telefon valid.');
        return false;
    }
    return true;
}

export function validateCabinStep1() {
    if (!document.getElementById('cabinArrivalInput')?.value || !document.getElementById('cabinDepartureInput')?.value) {
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
    const firstName = document.getElementById('cabinFirstName')?.value.trim();
    const lastName = document.getElementById('cabinLastName')?.value.trim();
    const email = document.getElementById('cabinEmail')?.value.trim();
    const phone = document.getElementById('cabinPhone')?.value.trim();
    if (!firstName || !lastName || !email) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please fill in all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid email address.' : 'Vă rugăm introduceți o adresă de email validă.');
        return false;
    }
    if (!/^[0-9\s\-\+()]{6,}$/.test(phone)) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid phone number.' : 'Vă rugăm introduceți un număr de telefon valid.');
        return false;
    }
    return true;
}

export function validateMealStep2() {
    const firstName = document.getElementById('mealFirstName')?.value.trim();
    const lastName = document.getElementById('mealLastName')?.value.trim();
    const email = document.getElementById('mealEmail')?.value.trim();
    const phone = document.getElementById('mealPhone')?.value.trim();
    if (!firstName || !lastName || !email) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please fill in all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid email address.' : 'Vă rugăm introduceți o adresă de email validă.');
        return false;
    }
    if (!/^[0-9\s\-\+()]{6,}$/.test(phone)) {
        alert(APP_GLOBALS.currentLanguage === 'en' ? 'Please enter a valid phone number.' : 'Vă rugăm introduceți un număr de telefon valid.');
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
    if (!select) return;
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

export async function processCabinBooking() {
    const prefix = document.getElementById('cabinPhonePrefix')?.value || '';
    const phone = prefix + document.getElementById('cabinPhone').value.trim();
    const payload = {
        first_name: document.getElementById('cabinFirstName').value.trim(),
        last_name: document.getElementById('cabinLastName').value.trim(),
        email: document.getElementById('cabinEmail').value.trim(),
        phone: phone,
        start_date: document.getElementById('cabinArrivalInput').value,
        end_date: document.getElementById('cabinDepartureInput').value,
        adults: parseInt(document.getElementById('cabinAdultsSelect').value) || 1,
        rooms_needed: parseInt(document.getElementById('cabinRoomsSelect').value) || 1,
        wants_meal: WIZARD_STATE.cabinExtras.meal,
        wants_hottub: WIZARD_STATE.cabinExtras.hotTub
    };

    try {
        const res = await fetch(`${backendUrl}/api/cabin_reservations`, {
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
    cabinContinueBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        if (validateCabinStep1()) {
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
        await processCabinBooking();
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

    // ===== MEAL QUICK DATE BUTTONS =====
    document.getElementById('btnToday')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (!this.disabled) {
            const today = new Date();
            const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
            document.getElementById('mealArrivalInput').value = dateStr;
            showMealStep(1);
        }
    });

    document.getElementById('btnTomorrow')?.addEventListener('click', function(e) {
        e.preventDefault();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
        document.getElementById('mealArrivalInput').value = dateStr;
        showMealStep(1);
    });
}
