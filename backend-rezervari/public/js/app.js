import { initExtrasSlideshow, initHeroSlideshow } from './ui/slideshow.js';
import { changeLanguage, applyTranslations } from './core/translations.js';
import {backendUrl, WIZARD_STATE, APP_GLOBALS} from './core/state.js';

document.addEventListener('DOMContentLoaded', async function() {
    applyTranslations();
});

async function saveMealDraft(step) {
    // Try to get email/phone from Step 2, but don't require them for Step 1
    const email = document.getElementById('emailMStep2').value || '';
    const phone = document.getElementById('telefonMStep2').value || '';

    // Only require contact info if saving Step 2
    if (step === 2 && (!email || !phone)) {
        return;
    }

    const step1Data = {
        data_rezervare: document.getElementById('dataMStep1').value,
        ora: document.getElementById('oraMStep1').value,
        adults: parseInt(document.getElementById('adultiMStep1').value) || 0,
        infants: parseInt(document.getElementById('copiiMStep1').value) || 0,
        pets: parseInt(document.getElementById('animaleMStep1').value) || 0
    };

    const step2Data = step === 2 ? {
        nume: document.getElementById('numeMStep2').value,
        email: email,
        telefon: phone
    } : {};

    const allData = step === 1 ? step1Data : { ...step1Data, ...step2Data };

    try {
        const resp = await fetch(`${backendUrl}/reservations/draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                phone,
                reservation_type: 'mancare',
                current_step: step,
                step_data: allData
            })
        });
        if (resp.ok) {
            const data = await resp.json();
            WIZARD_STATE.mealDraftId = data.draft_id;
        }
    } catch (err) {
        console.error('Draft save failed:', err);
    }
}

async function saveCabinDraft(step) {
    const email = document.getElementById('cabinEmail').value || '';
    const phone = document.getElementById('cabinPhone').value || '';

    const step1Data = {
        data_inceput: document.getElementById('cabinArrivalInput').value,
        data_sfarsit: document.getElementById('cabinDepartureInput').value,
        adults: parseInt(document.getElementById('cabinAdultsSelect').value) || 1,
        infants: 0,
        pets: document.getElementById('cabinPetsInput').value.trim() ? 1 : 0,
        rooms_needed: parseInt(document.getElementById('cabinRoomsSelect').value) || 1,
        vrea_meniu: WIZARD_STATE.cabinExtras.meal,
        vrea_hottub: WIZARD_STATE.cabinExtras.hotTub
    };

    const step2Data = step >= 2 ? { hotTub: WIZARD_STATE.cabinExtras.hotTub, meal: WIZARD_STATE.cabinExtras.meal } : {};

    const step3Data = step >= 3 ? {
        first_name: document.getElementById('cabinFirstName').value.trim(),
        last_name: document.getElementById('cabinLastName').value.trim(),
        email: email,
        telefon: document.getElementById('cabinPhonePrefix').value + document.getElementById('cabinPhone').value.trim()
    } : {};

    const allData = step === 1 ? step1Data : { ...step1Data, ...step2Data, ...step3Data };

    try {
        const resp = await fetch(`${backendUrl}/reservations/draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email || '',
                phone: phone || '',
                reservation_type: 'cabana',
                current_step: step,
                step_data: allData
            })
        });
        if (resp.ok) {
            const data = await resp.json();
            WIZARD_STATE.cabinDraftId = data.draft_id;
        }
    } catch (err) {
        console.error('Draft save failed:', err);
    }
}

// --- DRAFT LOADING & RESTORATION ---

async function loadAndRestoreMealDraft(email, phone) {
    try {
        const resp = await fetch(`${backendUrl}/reservations/draft?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&reservation_type=mancare`);
        if (!resp.ok) return false;

        const data = await resp.json();
        if (!data.found) return false;

        const draft = data.draft;
        const formData = draft.form_data;

        // Restore Step 1 data
        if (formData.data_rezervare) document.getElementById('dataMStep1').value = formData.data_rezervare;
        if (formData.ora) document.getElementById('oraMStep1').value = formData.ora;
        if (formData.adults !== undefined) document.getElementById('adultiMStep1').value = formData.adults;
        if (formData.infants !== undefined) document.getElementById('copiiMStep1').value = formData.infants;
        if (formData.pets !== undefined) document.getElementById('animaleMStep1').value = formData.pets;

        // Restore Step 2 data if available
        if (formData.nume) document.getElementById('numeMStep2').value = formData.nume;
        if (formData.email) document.getElementById('emailMStep2').value = formData.email;
        if (formData.telefon) document.getElementById('telefonMStep2').value = formData.telefon;

        // Store draft ID for later deletion after submission
        WIZARD_STATE.mealDraftId = draft.id;

        // Update totals and prices
        updateTotalDisplay('adultiMStep1', 'copiiMStep1', 'totalPeopleMStep1');
        // calculeazaPretMancare();

        // Show appropriate step
        showMealStep(draft.current_step);

        // Hide resume banner
        document.getElementById('resumeBannerMancare').style.display = 'none';

        // Mark form as dirty since we restored data
        WIZARD_STATE.mealFormDirty = true;

        return true;
    } catch (err) {
        console.error('Failed to load meal draft:', err);
        return false;
    }
}

async function loadAndRestoreCabinDraft(email, phone) {
    try {
        const resp = await fetch(`${backendUrl}/reservations/draft?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&reservation_type=cabana`);
        if (!resp.ok) return false;

        const data = await resp.json();
        if (!data.found) return false;

        const draft = data.draft;
        const formData = draft.form_data;

        // Restore Step 1 data
        if (formData.data_inceput) document.getElementById('cabinArrivalInput').value = formData.data_inceput;
        if (formData.data_sfarsit) document.getElementById('cabinDepartureInput').value = formData.data_sfarsit;
        if (formData.adults !== undefined) document.getElementById('cabinAdultsSelect').value = formData.adults;
        if (formData.rooms_needed !== undefined) document.getElementById('cabinRoomsSelect').value = formData.rooms_needed;

        // Restore Step 2 data (extras)
        if (formData.vrea_meniu !== undefined) WIZARD_STATE.cabinExtras.meal = formData.vrea_meniu;
        if (formData.vrea_hottub !== undefined) WIZARD_STATE.cabinExtras.hotTub = formData.vrea_hottub;

        // Restore Step 3 data (personal info)
        if (formData.first_name) document.getElementById('cabinFirstName').value = formData.first_name;
        if (formData.last_name) document.getElementById('cabinLastName').value = formData.last_name;
        if (formData.email) document.getElementById('cabinEmail').value = formData.email;
        if (formData.salutation) document.getElementById('cabinSalutation').value = formData.salutation;

        // Parse phone if stored
        if (formData.telefon) {
            const phone = formData.telefon;
            if (phone.startsWith('+40')) {
                document.getElementById('cabinPhonePrefix').value = '+40';
                document.getElementById('cabinPhone').value = phone.slice(3);
            } else if (phone.startsWith('+')) {
                const prefixEnd = phone.indexOf('-') > -1 ? phone.indexOf('-') : 3;
                document.getElementById('cabinPhonePrefix').value = phone.slice(0, prefixEnd);
                document.getElementById('cabinPhone').value = phone.slice(prefixEnd);
            }
        }

        // Store draft ID for later deletion after submission
        WIZARD_STATE.cabinDraftId = draft.id;

        // Update totals and calendar
        updateAdultsOptions(parseInt(formData.rooms_needed) || 1);
        updateNightsDisplay();
        updateCabinSummary();

        // Show appropriate step
        showCabinStep(Math.min(draft.current_step, 4));

        // Hide resume banner
        document.getElementById('resumeBannerCabana').style.display = 'none';

        // Mark form as dirty since we restored data
        WIZARD_STATE.cabinFormDirty = true;

        return true;
    } catch (err) {
        console.error('Failed to load cabin draft:', err);
        return false;
    }
}

// --- CABIN-SPECIFIC GLOBALS ---
let cabinNights = 1;
let ocupareZilnica = {};
let zileCompletOcupate = [];
let calendarMancareInstanta = null;
let cabinArrivalFP = null;
let cabinDepartureFP = null;

// --- 2. SETĂRI GLOBALE ---
function getLocaleConfig() {
    if (limbaCurenta === 'ro' && typeof flatpickr !== 'undefined' && flatpickr.l10ns && flatpickr.l10ns.ro) {
        return { locale: flatpickr.l10ns.ro };
    }
    return { locale: 'en' };
}

function isToday(dateStr) {
    const today = new Date();
    const date = new Date(dateStr);
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
}

function isAfter10Am() {
    const now = new Date();
    return now.getHours() >= 10;
}

function calculateTotalPeople(adults, infants) {
    return (parseInt(adults) || 0) + (parseInt(infants) || 0);
}

// --- NEW FUNCTION: Update price displays on all steps ---
/* function updateCabinPriceDisplays() {
    const adults = parseInt(document.getElementById('cabinAdultsSelect')?.value) || 1;
    const nights = cabinNights;

    let basePrice = adults * nights * PRET_NOAPTE_PERSOANA;
    let hotTubPrice = WIZARD_STATE.cabinExtras.hotTub ? PRET_HOTTUB : 0;
    let mealPrice = WIZARD_STATE.cabinExtras.meal ? adults * nights * PRET_MENIU_PER_PERSON_NIGHT : 0;
    let total = basePrice + hotTubPrice + mealPrice;

    // Update Step 1 price display
    const step1Price = document.getElementById('priceAmountStep1');
    if (step1Price) step1Price.textContent = `${total} RON`;

    // Update Step 2 price display
    const step2Price = document.getElementById('priceAmountStep2');
    if (step2Price) step2Price.textContent = `${total} RON`;

    // Update Step 4 price display
    const step4Price = document.getElementById('priceAmountStep4');
    if (step4Price) step4Price.textContent = `${total} RON`;

    // Show price displays only when we have valid dates
    const arrival = document.getElementById('cabinArrivalInput')?.value;
    const departure = document.getElementById('cabinDepartureInput')?.value;
    const hasValidDates = arrival && departure;

    const step1Display = document.getElementById('priceDisplayStep1');
    if (step1Display) step1Display.style.display = hasValidDates ? 'block' : 'none';

    const step2Display = document.getElementById('priceDisplayStep2');
    if (step2Display) step2Display.style.display = hasValidDates ? 'block' : 'none';

    const step4Display = document.getElementById('priceDisplayStep4');
    if (step4Display) step4Display.style.display = hasValidDates ? 'block' : 'none';
} */

// --- 3. ÎNCĂRCARE DATE DE PE SERVER LA START ---
async function incarcatDateOcupare() {
    try {
        const response = await fetch(`${backendUrl}/zile_ocupate`);
        if (response.ok) {
            const rezervariConfirmate = await response.json();
            rezervariConfirmate.forEach(rez => {
                let startParts = rez.data_inceput.split('-');
                let endParts = rez.data_sfarsit.split('-');
                let startDate = new Date(startParts[0], startParts[1] - 1, startParts[2], 12, 0, 0);
                let endDate = new Date(endParts[0], endParts[1] - 1, endParts[2], 12, 0, 0);

                for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
                    let dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');

                    if (!ocupareZilnica[dateStr]) ocupareZilnica[dateStr] = 0;
                    ocupareZilnica[dateStr] += rez.numar_persoane;

                    if (ocupareZilnica[dateStr] >= 8) {
                        zileCompletOcupate.push(dateStr);
                    }
                }
            });
        }
    } catch (e) {
        console.warn("Serverul nu a trimis zilele ocupate.");
    }
}

// --- 4. CALCUL PREȚ ---
// function calculeazaNopti(start, end) {
//     if (!start || !end) return 0;
//     const diff = new Date(end) - new Date(start);
//     const zile = Math.ceil(diff / (1000 * 60 * 60 * 24));
//     return zile > 0 ? zile : 0;
// }

// function calculeazaPretMancare() {
//     const adulti = parseInt(document.getElementById('adultiMStep1').value) || 0;
//     const copii = parseInt(document.getElementById('copiiMStep1').value) || 0;
//     const persoane = adulti + copii;

//     if (persoane > MAX_PERSOANE_MANCARE) {
//         document.getElementById('adultiMStep1').value = Math.max(1, MAX_PERSOANE_MANCARE - copii);
//     }

//     const pretEstimatiText = limbaCurenta === 'en' ? 'Estimated Price:' : 'Preț estimat:';
//     document.getElementById('pretMancareAfisajStep1').innerText = `${pretEstimatiText} ${persoane * PRET_MENIU_PERSOANA} RON`;
//     updateTotalDisplay('adultiMStep1', 'copiiMStep1', 'totalPeopleMStep1');
// }

// document.addEventListener('DOMContentLoaded', function() {
//     document.getElementById('adultiMStep1')?.addEventListener('input', calculeazaPretMancare);
//     document.getElementById('copiiMStep1')?.addEventListener('input', calculeazaPretMancare);
// });

// --- 5. COMUNICARE BACKEND (FORMULARE FINALIZARE) ---
document.getElementById('formMancareStep2')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateMealStep2()) return;

    const adulti = parseInt(document.getElementById('adultiMStep1').value) || 0;
    const copii = parseInt(document.getElementById('copiiMStep1').value) || 0;
    const payload = {
        nume: document.getElementById('numeMStep2').value,
        email: document.getElementById('emailMStep2').value,
        telefon: document.getElementById('telefonMStep2').value || null,
        data_rezervare: document.getElementById('dataMStep1').value,
        ora: document.getElementById('oraMStep1').value,
        adults: adulti,
        infants: copii,
        pets: parseInt(document.getElementById('animaleMStep1').value) || 0,
        numar_persoane: adulti + copii
    };

    try {
        const res = await fetch(`${backendUrl}/rezervari_mancare`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) {
            const confirmMsg = limbaCurenta === 'en'
                ? 'Meal request submitted for approval. An administrator will contact you to confirm details.'
                : 'Cererea de masă trimisă pentru aprobare. Un administrator vă va contacta pentru a confirma detaliile.';
            alert(confirmMsg);

            // Delete draft after successful submission
            if (WIZARD_STATE.mealDraftId) {
                await fetch(`${backendUrl}/reservations/draft/${WIZARD_STATE.mealDraftId}`, {
                    method: 'DELETE'
                }).catch(err => console.error('Failed to delete draft:', err));
            }

            document.getElementById('formMancareStep2').reset();
            document.getElementById('formMancareStep1').reset();
            showMealStep(1);
            WIZARD_STATE.mealFormDirty = false;
            WIZARD_STATE.mealDraftId = null;
            // calculeazaPretMancare();
        } else {
            const data = await res.json();
            alert('Eroare: ' + (data.error || 'Date incorecte.'));
        }
    } catch (err) { alert('Nu se poate contacta serverul.'); }
});

// Today/Tomorrow button handlers for meal form
document.getElementById('btnToday')?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!this.disabled) {
        const today = new Date();
        const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        document.getElementById('dataMStep1').value = dateStr;
        showMealStep(1);
        // calculeazaPretMancare();
    }
});

document.getElementById('btnTomorrow')?.addEventListener('click', function(e) {
    e.preventDefault();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
    document.getElementById('dataMStep1').value = dateStr;
    showMealStep(1);
    // calculeazaPretMancare();
});

export async function saveCabinDraft(step) {
    const email = document.getElementById('cabinEmail')?.value || '';
    const phone = document.getElementById('cabinPhone')?.value || '';
    const allData = {
        data_inceput: document.getElementById('cabinArrivalInput')?.value,
        data_sfarsit: document.getElementById('cabinDepartureInput')?.value,
        adults: parseInt(document.getElementById('cabinAdultsSelect')?.value) || 1,
        rooms_needed: parseInt(document.getElementById('cabinRoomsSelect')?.value) || 1,
        vrea_meniu: WIZARD_STATE.cabinExtras.meal,
        vrea_hottub: WIZARD_STATE.cabinExtras.hotTub,
        first_name: document.getElementById('cabinFirstName')?.value,
        email: email, telefon: phone
    };

    try {
        const resp = await fetch(`${backendUrl}/reservations/draft`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone, reservation_type: 'cabana', current_step: step, step_data: allData })
        });
        if (resp.ok) {
            const data = await resp.json();
            WIZARD_STATE.cabinDraftId = data.draft_id;
        }
    } catch (err) { console.error('Draft save failed:', err); }
}

export async function saveMealDraft(step) {
    const email = document.getElementById('mealEmail')?.value || document.getElementById('emailMStep2')?.value || '';
    const phone = document.getElementById('mealPhone')?.value || document.getElementById('telefonMStep2')?.value || '';
    if (step === 2 && (!email || !phone)) return;

    const allData = {
        data_rezervare: document.getElementById('dataMStep1')?.value,
        ora: document.getElementById('oraMStep1')?.value || document.getElementById('hourMStep1')?.value,
        adults: parseInt(document.getElementById('adultsMStep1')?.value || document.getElementById('adultiMStep1')?.value) || 0,
        infants: parseInt(document.getElementById('infantsMStep1')?.value || document.getElementById('copiiMStep1')?.value) || 0,
        email: email, phone: phone
    };

    try {
        const resp = await fetch(`${backendUrl}/reservations/draft`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone, reservation_type: 'mancare', current_step: step, step_data: allData })
        });
        if (resp.ok) {
            const data = await resp.json();
            WIZARD_STATE.mealDraftId = data.draft_id;
        }
    } catch (err) { console.error('Draft save failed:', err); }
}