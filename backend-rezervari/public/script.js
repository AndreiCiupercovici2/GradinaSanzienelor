// --- WIZARD STATE MANAGEMENT ---
const WIZARD_STATE = {
    currentReservationType: null,
    mealStep1Data: null,
    mealStep2Data: null,
    cabinStep1Data: null,
    cabinStep2Data: null,
    currentMealStep: 1,
    currentCabinStep: 1,
    mealFormDirty: false,
    cabinFormDirty: false
};

// --- SLIDESHOW FUNCTIONALITY ---
let currentSlide = 1;
let slideShowInterval = null;
const SLIDESHOW_INTERVAL = 10000; // 10 seconds
const TOTAL_SLIDES = 11;
let slideshowInitialized = false;

function showSlide(n) {
    // Validate slide number
    if (n > TOTAL_SLIDES) currentSlide = 1;
    if (n < 1) currentSlide = TOTAL_SLIDES;

    // Hide all slides
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => slide.classList.remove('active'));

    // Remove active class from all dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('active'));

    // Show current slide and highlight dot
    const currentSlideElement = document.querySelector(`.slide[data-slide="${currentSlide}"]`);
    const currentDot = document.querySelector(`.dot[data-slide="${currentSlide}"]`);

    if (currentSlideElement) currentSlideElement.classList.add('active');
    if (currentDot) currentDot.classList.add('active');
}

function nextSlide() {
    currentSlide++;
    if (currentSlide > TOTAL_SLIDES) currentSlide = 1;
    showSlide(currentSlide);
}

function previousSlide() {
    currentSlide--;
    if (currentSlide < 1) currentSlide = TOTAL_SLIDES;
    showSlide(currentSlide);
}

function goToSlide(n) {
    currentSlide = n;
    showSlide(currentSlide);
    resetAutoplay();
}

function startAutoplay() {
    if (slideShowInterval) clearInterval(slideShowInterval);
    slideShowInterval = setInterval(nextSlide, SLIDESHOW_INTERVAL);
}

function resetAutoplay() {
    if (slideShowInterval) clearInterval(slideShowInterval);
    startAutoplay();
}

function stopAutoplay() {
    if (slideShowInterval) {
        clearInterval(slideShowInterval);
        slideShowInterval = null;
    }
}

// --- WIZARD FUNCTIONS ---
function showMealStep(stepNumber) {
    WIZARD_STATE.currentMealStep = stepNumber;
    const step1 = document.getElementById('step1ContainerMeal');
    const step2 = document.getElementById('step2ContainerMeal');
    const stepIndicator1 = document.getElementById('step1Meal');
    const stepIndicator2 = document.getElementById('step2Meal');

    if (stepNumber === 1) {
        step1.style.display = 'block';
        step2.style.display = 'none';
        stepIndicator1.classList.add('active');
        stepIndicator1.classList.remove('completed');
        stepIndicator2.classList.remove('active', 'completed');
        step1.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        step1.style.display = 'none';
        step2.style.display = 'block';
        stepIndicator1.classList.remove('active');
        stepIndicator1.classList.add('completed');
        stepIndicator2.classList.add('active');
        step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showCabinStep(stepNumber) {
    WIZARD_STATE.currentCabinStep = stepNumber;
    const step1 = document.getElementById('step1ContainerCabin');
    const step2 = document.getElementById('step2ContainerCabin');
    const stepIndicator1 = document.getElementById('step1Cabin');
    const stepIndicator2 = document.getElementById('step2Cabin');

    if (stepNumber === 1) {
        step1.style.display = 'block';
        step2.style.display = 'none';
        stepIndicator1.classList.add('active');
        stepIndicator1.classList.remove('completed');
        stepIndicator2.classList.remove('active', 'completed');
        step1.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        step1.style.display = 'none';
        step2.style.display = 'block';
        stepIndicator1.classList.remove('active');
        stepIndicator1.classList.add('completed');
        stepIndicator2.classList.add('active');
        step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function validateMealStep1() {
    const date = document.getElementById('dataMStep1').value;
    const time = document.getElementById('oraMStep1').value;
    const adults = parseInt(document.getElementById('adultiMStep1').value) || 0;
    const children = parseInt(document.getElementById('copiiMStep1').value) || 0;

    if (!date || !time || adults < 1) {
        alert(limbaCurenta === 'en' ? 'Please fill all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }

    if (adults + children > MAX_PERSOANE_MANCARE) {
        alert(limbaCurenta === 'en' ? 'Maximum 15 people allowed.' : 'Maxim 15 persoane permise.');
        return false;
    }

    return true;
}

function validateCabinStep1() {
    const startDate = document.getElementById('dataInceputCStep1').value;
    const endDate = document.getElementById('dataSfarsitCStep1').value;
    const adults = parseInt(document.getElementById('adultiCStep1').value) || 0;
    const children = parseInt(document.getElementById('copiiCStep1').value) || 0;

    if (!startDate || !endDate || adults < 1) {
        alert(limbaCurenta === 'en' ? 'Please fill all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }

    if (adults + children < 1 || adults + children > CAPACITATE_MAX_CABANA) {
        alert(limbaCurenta === 'en' ? `Number of people must be between 1 and ${CAPACITATE_MAX_CABANA}.` : `Numărul de persoane trebuie să fie între 1 și ${CAPACITATE_MAX_CABANA}.`);
        return false;
    }

    return true;
}

function validateMealStep2() {
    const name = document.getElementById('numeMStep2').value;
    const phone = document.getElementById('telefonMStep2').value;

    if (!name || !phone) {
        alert(limbaCurenta === 'en' ? 'Please fill all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }

    return true;
}

function validateCabinStep2() {
    const name = document.getElementById('numeCStep2').value;
    const phone = document.getElementById('telefonCStep2').value;

    if (!name || !phone) {
        alert(limbaCurenta === 'en' ? 'Please fill all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }

    return true;
}

async function saveMealDraft(step) {
    const email = document.getElementById('emailMStep2').value;
    const phone = document.getElementById('telefonMStep2').value;

    if (!email || !phone) {
        return; // Can't save without contact info
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
        await fetch(`${backendUrl}/reservations/draft`, {
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
    } catch (err) {
        console.error('Draft save failed:', err);
    }
}

async function saveCabinDraft(step) {
    const email = document.getElementById('emailCStep2').value;
    const phone = document.getElementById('telefonCStep2').value;

    if (!email || !phone) {
        return; // Can't save without contact info
    }

    const step1Data = {
        data_inceput: document.getElementById('dataInceputCStep1').value,
        data_sfarsit: document.getElementById('dataSfarsitCStep1').value,
        adults: parseInt(document.getElementById('adultiCStep1').value) || 0,
        infants: parseInt(document.getElementById('copiiCStep1').value) || 0,
        pets: parseInt(document.getElementById('animaleCStep1').value) || 0,
        rooms_needed: parseInt(document.getElementById('cameresCStep1').value) || 1,
        vrea_meniu: document.getElementById('meniuCStep1').checked
    };

    const step2Data = step === 2 ? {
        nume: document.getElementById('numeCStep2').value,
        email: email,
        telefon: phone
    } : {};

    const allData = step === 1 ? step1Data : { ...step1Data, ...step2Data };

    try {
        await fetch(`${backendUrl}/reservations/draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                phone,
                reservation_type: 'cabana',
                current_step: step,
                step_data: allData
            })
        });
    } catch (err) {
        console.error('Draft save failed:', err);
    }
}

// --- WARN ON PAGE EXIT IF FORM INCOMPLETE ---
window.addEventListener('beforeunload', (e) => {
    if (WIZARD_STATE.mealFormDirty || WIZARD_STATE.cabinFormDirty) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Initialize slideshow on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Guard against multiple initializations
    if (slideshowInitialized) return;
    slideshowInitialized = true;

    // Load occupation data
    await incarcatDateOcupare();

    // Show first slide initially
    showSlide(currentSlide);

    // Start autoplay
    startAutoplay();

    // Add scroll functionality to down arrow
    const arrowDown = document.querySelector('.arrow-down');
    if (arrowDown) {
        arrowDown.addEventListener('click', function() {
            window.scrollBy({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        });
    }

    // Add click functionality to navigation arrows
    const prevSlideBtn = document.getElementById('prevSlideBtn');
    const nextSlideBtn = document.getElementById('nextSlideBtn');

    if (prevSlideBtn) {
        prevSlideBtn.addEventListener('click', function() {
            previousSlide();
            resetAutoplay();
        });
    }

    if (nextSlideBtn) {
        nextSlideBtn.addEventListener('click', function() {
            nextSlide();
            resetAutoplay();
        });
    }

    // --- WIZARD STEP HANDLERS FOR MEAL ---
    const continueMealBtn = document.getElementById('continueMealBtn');
    if (continueMealBtn) {
        continueMealBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            if (validateMealStep1()) {
                WIZARD_STATE.mealFormDirty = true;
                await saveMealDraft(1);
                showMealStep(2);
            }
        });
    }

    const backMealBtn = document.getElementById('backMealBtn');
    if (backMealBtn) {
        backMealBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showMealStep(1);
        });
    }

    // --- WIZARD STEP HANDLERS FOR CABIN ---
    const continueCabinBtn = document.getElementById('continueCabinBtn');
    if (continueCabinBtn) {
        continueCabinBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            if (validateCabinStep1()) {
                WIZARD_STATE.cabinFormDirty = true;
                await saveCabinDraft(1);
                showCabinStep(2);
            }
        });
    }

    const backCabinBtn = document.getElementById('backCabinBtn');
    if (backCabinBtn) {
        backCabinBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCabinStep(1);
        });
    }

    // Track form changes
    document.getElementById('formMancareStep1')?.addEventListener('input', function() {
        WIZARD_STATE.mealFormDirty = true;
    });

    document.getElementById('formMancareStep2')?.addEventListener('input', function() {
        WIZARD_STATE.mealFormDirty = true;
    });

    document.getElementById('formCabanaStep1')?.addEventListener('input', function() {
        WIZARD_STATE.cabinFormDirty = true;
    });

    document.getElementById('formCabanaStep1')?.addEventListener('change', function() {
        WIZARD_STATE.cabinFormDirty = true;
    });

    document.getElementById('formCabanaStep2')?.addEventListener('input', function() {
        WIZARD_STATE.cabinFormDirty = true;
    });

    // --- CHECK FOR DRAFT RESERVATIONS ---
    // Note: Draft checking would require email/phone from user - this is handled via resume buttons
    // when users explicitly click to resume a saved draft
});

// --- 1. LOCALIZARE (TRADUCERI) ---
let limbaCurenta = localStorage.getItem('limba_preferata') || 'ro';

function aplicaTraducerile() {
    if (typeof traduceri === 'undefined') return;
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const cheie = element.getAttribute('data-i18n');
        if (traduceri[limbaCurenta] && traduceri[limbaCurenta][cheie]) {
            element.innerText = traduceri[limbaCurenta][cheie];
        }
    });
}

function schimbaLimba(nouaLimba) {
    limbaCurenta = nouaLimba;
    localStorage.setItem('limba_preferata', nouaLimba);
    aplicaTraducerile();

    // Recreate visible calendars with new locale
    const mancareContainer = document.getElementById('sectiuneMancare');
    const cabanaContainer = document.getElementById('sectiuneCabana');

    if (mancareContainer.style.display !== 'none' && calendarMancareInstanta) {
        calendarMancareInstanta.destroy();
        calendarMancareInstanta = null;
        arataSectiune('mancare');
    }
    if (cabanaContainer.style.display !== 'none' && calendarCabanaInstanta) {
        calendarCabanaInstanta.destroy();
        calendarCabanaInstanta = null;
        arataSectiune('cabana');
    }

    // Refresh price displays with new language
    if (document.getElementById('pretCabanaAfisajStep1')?.innerText.includes('RON')) {
        calculeazaPretCabana();
    }
    if (document.getElementById('pretMancareAfisajStep1')?.innerText.includes('RON')) {
        calculeazaPretMancare();
    }
}
aplicaTraducerile();

// --- 2. SETĂRI GLOBALE ---
const PRET_NOAPTE_PERSOANA = 100;
const PRET_MENIU_PERSOANA = 70;
const MAX_PERSOANE_MANCARE = 15;
const CAPACITATE_MAX_CABANA = 8;
const MAX_CAMERE = 3;
const backendUrl = '/api';

let ocupareZilnica = {};
let zileCompletOcupate = [];
let calendarMancareInstanta = null;
let calendarCabanaInstanta = null;

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

function updateTotalDisplay(adultsId, infantsId, displayId) {
    const adults = parseInt(document.getElementById(adultsId).value) || 0;
    const infants = parseInt(document.getElementById(infantsId).value) || 0;
    const total = calculateTotalPeople(adults, infants);
    const totalText = limbaCurenta === 'en' ? `Total: ${total} people` : `Total: ${total} persoane`;
    document.getElementById(displayId).textContent = totalText;
}


// Deschide secțiunea selectată și inițializează calendarul aferent ei
function arataSectiune(tip) {
    // Afișăm containerul corect și îl ascundem pe celălalt
    document.getElementById('sectiuneMancare').style.display = tip === 'mancare' ? 'block' : 'none';
    document.getElementById('sectiuneCabana').style.display = tip === 'cabana' ? 'block' : 'none';

    // Schimbăm clasa activă pe butoane pentru feedback vizual albastru/gri
    document.getElementById('btnMancare').classList.toggle('active', tip === 'mancare');
    document.getElementById('btnCabana').classList.toggle('active', tip === 'cabana');

    const todayDisabled = isToday(new Date().toISOString().split('T')[0]) && isAfter10Am();
    if (tip === 'mancare') {
        document.getElementById('notificationTodayMancare').style.display = todayDisabled ? 'block' : 'none';
        document.getElementById('btnToday').disabled = todayDisabled;
        if (todayDisabled) {
            document.getElementById('btnToday').style.opacity = '0.5';
            document.getElementById('btnToday').style.cursor = 'not-allowed';
        }
    } else {
        document.getElementById('notificationTodayCabana').style.display = todayDisabled ? 'block' : 'none';
    }

    const setariComune = {
        dateFormat: "Y-m-d",
        inline: true,
        disableMobile: "true",
        locale: limbaCurenta === 'ro' ? flatpickr.l10ns.ro : 'en'
    };

    // Inițializare Calendar Mâncare la cerere
    if (tip === 'mancare' && !calendarMancareInstanta) {
        calendarMancareInstanta = flatpickr("#calendarMancare", {
            ...setariComune,
            minDate: "today",
            onChange: function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    document.getElementById('dataMStep1').value = dateStr;
                    showMealStep(1);
                    calculeazaPretMancare();
                }
            }
        });

        // Scroll calendar into view immediately when section is shown
        const calendarWrapperMancare = document.querySelector('#sectiuneMancare .calendar-wrapper');
        if (calendarWrapperMancare) {
            calendarWrapperMancare.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Inițializare Calendar Cabană la cerere
    if (tip === 'cabana' && !calendarCabanaInstanta) {
        calendarCabanaInstanta = flatpickr("#calendarCabana", {
            ...setariComune,
            minDate: "today",
            mode: "range",
            disable: zileCompletOcupate,
            onChange: function(selectedDates, dateStr, instance) {
                if (selectedDates.length === 2) {
                    document.getElementById('dataInceputCStep1').value = instance.formatDate(selectedDates[0], "Y-m-d");
                    document.getElementById('dataSfarsitCStep1').value = instance.formatDate(selectedDates[1], "Y-m-d");

                    let maxOcupateInInterval = 0;
                    let startSafe = new Date(selectedDates[0]); startSafe.setHours(12, 0, 0, 0);
                    let endSafe = new Date(selectedDates[1]); endSafe.setHours(12, 0, 0, 0);

                    for (let d = new Date(startSafe); d < endSafe; d.setDate(d.getDate() + 1)) {
                        let dStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                        if (ocupareZilnica[dStr]) {
                            maxOcupateInInterval = Math.max(maxOcupateInInterval, ocupareZilnica[dStr]);
                        }
                    }

                    const locuriDisponibile = 8 - maxOcupateInInterval;
                    const inputAdulti = document.getElementById('adultiCStep1');
                    const inputCopii = document.getElementById('copiiCStep1');

                    if (parseInt(inputAdulti.value) + parseInt(inputCopii.value) > locuriDisponibile) {
                        inputAdulti.value = Math.max(1, locuriDisponibile - parseInt(inputCopii.value));
                    }

                    if (maxOcupateInInterval > 0) {
                        const warningDiv = document.getElementById('warningCabana');
                        warningDiv.style.display = 'block';
                        const warningTemplate = limbaCurenta === 'en'
                            ? traduceri.en.warningCabana
                            : traduceri.ro.warningCabana;
                        warningDiv.innerHTML = warningTemplate.replace(/\{guests\}/g, maxOcupateInInterval).replace(/\{oaspeți\}/g, maxOcupateInInterval).replace(/\{spaces\}/g, locuriDisponibile).replace(/\{locuri\}/g, locuriDisponibile);
                    } else {
                        document.getElementById('warningCabana').style.display = 'none';
                    }

                    showCabinStep(1);
                    calculeazaPretCabana();
                }
            }
        });

        // Scroll calendar into view immediately when section is shown
        const calendarWrapperCabana = document.querySelector('#sectiuneCabana .calendar-wrapper');
        if (calendarWrapperCabana) {
            calendarWrapperCabana.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Also scroll calendar into view if it's already initialized (already visible section)
    if (tip === 'mancare' && calendarMancareInstanta) {
        const calendarWrapperMancare = document.querySelector('#sectiuneMancare .calendar-wrapper');
        if (calendarWrapperMancare) {
            calendarWrapperMancare.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else if (tip === 'cabana' && calendarCabanaInstanta) {
        const calendarWrapperCabana = document.querySelector('#sectiuneCabana .calendar-wrapper');
        if (calendarWrapperCabana) {
            calendarWrapperCabana.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

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
function calculeazaNopti(start, end) {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    const zile = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return zile > 0 ? zile : 0;
}

function calculeazaPretCabana() {
    const adulti = parseInt(document.getElementById('adultiCStep1').value) || 0;
    const copii = parseInt(document.getElementById('copiiCStep1').value) || 0;
    const persoane = adulti + copii;
    const nopti = calculeazaNopti(document.getElementById('dataInceputCStep1').value, document.getElementById('dataSfarsitCStep1').value);
    const vreaMeniu = document.getElementById('meniuCStep1').checked;

    let pretTotal = (nopti > 0) ? (persoane * nopti * PRET_NOAPTE_PERSOANA) : 0;
    if (nopti > 0 && vreaMeniu) pretTotal += (persoane * nopti * PRET_MENIU_PERSOANA);

    const pretEstimatiText = limbaCurenta === 'en' ? 'Estimated Price:' : 'Preț estimat:';
    document.getElementById('pretCabanaAfisajStep1').innerText = `${pretEstimatiText} ${pretTotal} RON`;
    updateTotalDisplay('adultiCStep1', 'copiiCStep1', 'totalPeopleCStep1');
}

function calculeazaPretMancare() {
    const adulti = parseInt(document.getElementById('adultiMStep1').value) || 0;
    const copii = parseInt(document.getElementById('copiiMStep1').value) || 0;
    const persoane = adulti + copii;

    if (persoane > MAX_PERSOANE_MANCARE) {
        document.getElementById('adultiMStep1').value = Math.max(1, MAX_PERSOANE_MANCARE - copii);
    }

    const pretEstimatiText = limbaCurenta === 'en' ? 'Estimated Price:' : 'Preț estimat:';
    document.getElementById('pretMancareAfisajStep1').innerText = `${pretEstimatiText} ${persoane * PRET_MENIU_PERSOANA} RON`;
    updateTotalDisplay('adultiMStep1', 'copiiMStep1', 'totalPeopleMStep1');
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('adultiCStep1')?.addEventListener('input', calculeazaPretCabana);
    document.getElementById('copiiCStep1')?.addEventListener('input', calculeazaPretCabana);
    document.getElementById('meniuCStep1')?.addEventListener('change', calculeazaPretCabana);
    document.getElementById('adultiMStep1')?.addEventListener('input', calculeazaPretMancare);
    document.getElementById('copiiMStep1')?.addEventListener('input', calculeazaPretMancare);
});

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
            document.getElementById('formMancareStep2').reset();
            document.getElementById('formMancareStep1').reset();
            showMealStep(1);
            WIZARD_STATE.mealFormDirty = false;
            calculeazaPretMancare();
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
        calculeazaPretMancare();
    }
});

document.getElementById('btnTomorrow')?.addEventListener('click', function(e) {
    e.preventDefault();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
    document.getElementById('dataMStep1').value = dateStr;
    showMealStep(1);
    calculeazaPretMancare();
});

document.getElementById('formCabanaStep2')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateCabinStep2()) return;

    const adulti = parseInt(document.getElementById('adultiCStep1').value) || 0;
    const copii = parseInt(document.getElementById('copiiCStep1').value) || 0;
    const payload = {
        nume: document.getElementById('numeCStep2').value,
        email: document.getElementById('emailCStep2').value,
        telefon: document.getElementById('telefonCStep2').value || null,
        data_inceput: document.getElementById('dataInceputCStep1').value,
        data_sfarsit: document.getElementById('dataSfarsitCStep1').value,
        adults: adulti,
        infants: copii,
        pets: parseInt(document.getElementById('animaleCStep1').value) || 0,
        rooms_needed: parseInt(document.getElementById('cameresCStep1').value) || 1,
        numar_persoane: adulti + copii,
        vrea_meniu: document.getElementById('meniuCStep1').checked
    };

    try {
        const res = await fetch(`${backendUrl}/rezervari_cabana`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) {
            const confirmMsg = limbaCurenta === 'en'
                ? 'Reservation request submitted for approval. An administrator will contact you to confirm details.'
                : 'Cererea de rezervare a fost trimisă pentru aprobare. Un administrator vă va contacta pentru a confirma detaliile.';
            alert(confirmMsg);
            document.getElementById('formCabanaStep2').reset();
            document.getElementById('formCabanaStep1').reset();
            showCabinStep(1);
            WIZARD_STATE.cabinFormDirty = false;
            calculeazaPretCabana();
        } else {
            const data = await res.json();
            alert('Eroare: ' + (data.error || 'Date incorecte.'));
        }
    } catch (err) { alert('Nu se poate contacta serverul.'); }
});
