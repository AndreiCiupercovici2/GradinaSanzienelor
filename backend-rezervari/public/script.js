// --- WIZARD STATE MANAGEMENT ---
const WIZARD_STATE = {
    currentReservationType: null,
    mealStep1Data: null,
    mealStep2Data: null,
    cabinStep: 1,           // current step 1-4
    cabinExtras: {
        hotTub: false,
        meal: false
    },
    cabinFormData: {},
    currentMealStep: 1,
    mealFormDirty: false,
    cabinFormDirty: false,
    mealDraftId: null,
    cabinDraftId: null
};

// --- PRICING CONSTANTS ---
//const PRET_NOAPTE_PERSOANA = 100;
//const PRET_MENIU_PERSOANA = 70;
//const PRET_HOTTUB = 200;         // RON per stay
//const PRET_MENIU_PER_PERSON_NIGHT = 70;  // RON per person per night
const MAX_PERSOANE_MANCARE = 15;
const CAPACITATE_MAX_CABANA = 8;
const MAX_CAMERE = 3;
const backendUrl = '/api';

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
    WIZARD_STATE.cabinStep = stepNumber;
    const step1 = document.getElementById('step1ContainerCabin');
    const step2 = document.getElementById('step2ContainerCabin');
    const step3 = document.getElementById('step3ContainerCabin');
    const step4 = document.getElementById('step4ContainerCabin');

    const stepIndicator1 = document.getElementById('step1Cabin');
    const stepIndicator2 = document.getElementById('step2Cabin');
    const stepIndicator3 = document.getElementById('step3Cabin');
    const stepIndicator4 = document.getElementById('step4Cabin');

    // Hide all steps
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'none';
    if (step3) step3.style.display = 'none';
    if (step4) step4.style.display = 'none';

    // Reset all step indicators
    [stepIndicator1, stepIndicator2, stepIndicator3, stepIndicator4].forEach(ind => {
        if (ind) ind.classList.remove('active', 'completed');
    });

    // Show active step and update indicators
    switch(stepNumber) {
        case 1:
            if (step1) step1.style.display = 'block';
            if (stepIndicator1) stepIndicator1.classList.add('active');
            break;
        case 2:
            if (step2) step2.style.display = 'block';
            if (stepIndicator1) stepIndicator1.classList.add('completed');
            if (stepIndicator2) stepIndicator2.classList.add('active');
            break;
        case 3:
            if (step3) step3.style.display = 'block';
            if (stepIndicator1) stepIndicator1.classList.add('completed');
            if (stepIndicator2) stepIndicator2.classList.add('completed');
            if (stepIndicator3) stepIndicator3.classList.add('active');
            break;
        case 4:
            if (step4) step4.style.display = 'block';
            if (stepIndicator1) stepIndicator1.classList.add('completed');
            if (stepIndicator2) stepIndicator2.classList.add('completed');
            if (stepIndicator3) stepIndicator3.classList.add('completed');
            if (stepIndicator4) stepIndicator4.classList.add('active');
            break;
    }

    // Update price displays on all steps
    // updateCabinPriceDisplays();

    // Scroll to top of cabin section
    const cabinSection = document.getElementById('sectiuneCabana');
    if (cabinSection) {
        cabinSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const arrival = document.getElementById('cabinArrivalInput').value;
    const departure = document.getElementById('cabinDepartureInput').value;
    if (!arrival || !departure) {
        alert(limbaCurenta === 'en' ? 'Please select arrival and departure dates.' : 'Vă rugăm selectați datele de sosire și plecare.');
        return false;
    }
    if (cabinNights < 1) {
        alert(limbaCurenta === 'en' ? 'Minimum 1 night required.' : 'Minim 1 noapte obligatorie.');
        return false;
    }
    return true;
}

function validateCabinStep3() {
    const firstName = document.getElementById('cabinFirstName').value.trim();
    const lastName = document.getElementById('cabinLastName').value.trim();
    const email = document.getElementById('cabinEmail').value.trim();
    const phone = document.getElementById('cabinPhone').value.trim();
    if (!firstName || !lastName || !email || !phone) {
        alert(limbaCurenta === 'en' ? 'Please fill in all required fields.' : 'Vă rugăm completați toate câmpurile obligatorii.');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(limbaCurenta === 'en' ? 'Please enter a valid email address.' : 'Vă rugăm introduceți o adresă de email validă.');
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
        calculeazaPretMancare();

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

// --- WARN ON PAGE EXIT IF FORM INCOMPLETE ---
window.addEventListener('beforeunload', (e) => {
    if (WIZARD_STATE.mealFormDirty || WIZARD_STATE.cabinFormDirty) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// --- CABIN-SPECIFIC GLOBALS ---
let cabinNights = 1;
let ocupareZilnica = {};
let zileCompletOcupate = [];
let calendarMancareInstanta = null;
let cabinArrivalFP = null;
let cabinDepartureFP = null;

// Initialize slideshow on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Guard against multiple initializations
    if (slideshowInitialized) return;
    slideshowInitialized = true;

    // Load occupation data
    await incarcatDateOcupare();

    // Check for draft resume from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resumeDraftId = urlParams.get('resume_draft');
    const resumeEmail = urlParams.get('email');
    const resumePhone = urlParams.get('phone');

    if (resumeDraftId && resumeEmail && resumePhone) {
        // Auto-load draft from URL
        const decodedEmail = decodeURIComponent(resumeEmail);
        const decodedPhone = decodeURIComponent(resumePhone);

        // Try to determine reservation type from URL if available
        const reservationType = urlParams.get('type') || 'mancare';

        if (reservationType === 'cabana') {
            await loadAndRestoreCabinDraft(decodedEmail, decodedPhone);
            arataSectiune('cabana');
        } else {
            await loadAndRestoreMealDraft(decodedEmail, decodedPhone);
            arataSectiune('mancare');
        }

        // Remove query params from URL bar
        window.history.replaceState({}, document.title, window.location.pathname);
    }

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

    // --- CABIN NIGHTS COUNTER ---
    const nightsDecBtn = document.getElementById('nightsDecBtn');
    const nightsIncBtn = document.getElementById('nightsIncBtn');

    if (nightsDecBtn) {
        nightsDecBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (cabinNights > 1) {
                cabinNights--;
                updateNightsDisplay();
            }
        });
    }

    if (nightsIncBtn) {
        nightsIncBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cabinNights++;
            updateNightsDisplay();
        });
    }

    // --- CALENDAR INPUT CLICK HANDLERS (Issue #2: Non-responsive Calendar Inputs) ---
    // Add click handlers to make the readonly date inputs open the calendar
    document.addEventListener('click', function(e) {
        if (e.target.id === 'cabinArrivalInput') {
            console.log('Clicked on cabinArrivalInput');
            if (!cabinArrivalFP) {
                console.log('Initializing calendars on first click...');
                arataSectiune('cabana');
            }
            if (cabinArrivalFP) {
                try {
                    e.preventDefault();
                    e.stopPropagation();
                    cabinArrivalFP.open();
                    console.log('Arrival calendar opened via click handler');
                } catch (err) {
                    console.error('Error opening arrival calendar:', err);
                }
            }
        }
        if (e.target.id === 'cabinDepartureInput') {
            console.log('Clicked on cabinDepartureInput');
            if (!cabinDepartureFP) {
                console.log('Initializing calendars on first click...');
                arataSectiune('cabana');
            }
            if (cabinDepartureFP) {
                try {
                    e.preventDefault();
                    e.stopPropagation();
                    cabinDepartureFP.open();
                    console.log('Departure calendar opened via click handler');
                } catch (err) {
                    console.error('Error opening departure calendar:', err);
                }
            }
        }
    });

    // Also add focus handlers as backup to open calendars
    document.addEventListener('focus', function(e) {
        if (e.target.id === 'cabinArrivalInput') {
            if (!cabinArrivalFP) {
                arataSectiune('cabana');
            }
            if (cabinArrivalFP) {
                cabinArrivalFP.open();
            }
        }
        if (e.target.id === 'cabinDepartureInput') {
            if (!cabinDepartureFP) {
                arataSectiune('cabana');
            }
            if (cabinDepartureFP) {
                cabinDepartureFP.open();
            }
        }
    }, true);

    // --- ROOMS/ADULTS DEPENDENCY ---
    document.getElementById('cabinRoomsSelect')?.addEventListener('change', function() {
        updateAdultsOptions(parseInt(this.value));
        updateCabinSummary();
        // updateCabinPriceDisplays();
    });

    // Update price displays when adults count changes
    document.getElementById('cabinAdultsSelect')?.addEventListener('change', function() {
        updateCabinSummary();
        // updateCabinPriceDisplays();
    });

    // --- EXTRAS TOGGLES ---
    document.getElementById('hotTubToggle')?.addEventListener('click', function() {
        WIZARD_STATE.cabinExtras.hotTub = !WIZARD_STATE.cabinExtras.hotTub;
        this.textContent = WIZARD_STATE.cabinExtras.hotTub ? 'Added ✓' : 'Add Hot Tub';
        this.classList.toggle('extra-toggle-added', WIZARD_STATE.cabinExtras.hotTub);
        updateCabinSummary();
        // updateCabinPriceDisplays();
    });

    document.getElementById('mealToggle')?.addEventListener('click', function() {
        WIZARD_STATE.cabinExtras.meal = !WIZARD_STATE.cabinExtras.meal;
        this.textContent = WIZARD_STATE.cabinExtras.meal ? 'Added ✓' : 'Add Meal Plan';
        this.classList.toggle('extra-toggle-added', WIZARD_STATE.cabinExtras.meal);
        updateCabinSummary();
        // updateCabinPriceDisplays();
    });

    // --- EXTRAS SLIDESHOWS ---
    initExtrasSlideshow('hotTubSlideshow', []);
    initExtrasSlideshow('mealExtrasSlideshow', []);

    // --- CABIN WIZARD STEP HANDLERS ---
    document.getElementById('continueToExtrasBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (validateCabinStep1()) {
            WIZARD_STATE.cabinFormDirty = true;
            saveCabinDraft(1);
            showCabinStep(2);
        }
    });

    document.getElementById('continueToPersonalBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        updateCabinSummary();
        // updateCabinPriceDisplays();
        saveCabinDraft(2);
        showCabinStep(3);
    });

    document.getElementById('backToTravelBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showCabinStep(1);
    });

    document.getElementById('backToExtrasBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showCabinStep(2);
    });

    document.getElementById('sendBookingBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!validateCabinStep3()) return;
        await submitCabinBooking();
    });

    document.getElementById('newBookingBtn')?.addEventListener('click', () => {
        resetCabinForm();
        showCabinStep(1);
    });

    // --- RESUME BUTTON HANDLERS ---
    const resumeButtonMancare = document.getElementById('resumeButtonMancare');
    if (resumeButtonMancare) {
        resumeButtonMancare.addEventListener('click', async function(e) {
            e.preventDefault();
            const email = prompt(limbaCurenta === 'en' ? 'Enter your email:' : 'Introduceți emailul dvs:');
            if (!email) return;

            const phone = prompt(limbaCurenta === 'en' ? 'Enter your phone number:' : 'Introduceți numărul de telefon:');
            if (!phone) return;

            const success = await loadAndRestoreMealDraft(email, phone);
            if (!success) {
                alert(limbaCurenta === 'en' ? 'No saved reservation found.' : 'Nu s-a găsit o rezervare salvată.');
            } else {
                arataSectiune('mancare');
            }
        });
    }

    const resumeButtonCabana = document.getElementById('resumeButtonCabana');
    if (resumeButtonCabana) {
        resumeButtonCabana.addEventListener('click', async function(e) {
            e.preventDefault();
            const email = prompt(limbaCurenta === 'en' ? 'Enter your email:' : 'Introduceți emailul dvs:');
            if (!email) return;

            const phone = prompt(limbaCurenta === 'en' ? 'Enter your phone number:' : 'Introduceți numărul de telefon:');
            if (!phone) return;

            const success = await loadAndRestoreCabinDraft(email, phone);
            if (!success) {
                alert(limbaCurenta === 'en' ? 'No saved reservation found.' : 'Nu s-a găsit o rezervare salvată.');
            } else {
                arataSectiune('cabana');
            }
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
    if (cabanaContainer.style.display !== 'none' && cabinArrivalFP) {
        cabinArrivalFP.destroy();
        cabinDepartureFP?.destroy();
        cabinArrivalFP = null;
        cabinDepartureFP = null;
        arataSectiune('cabana');
    }

    // Refresh price displays with new language
    if (document.getElementById('pretMancareAfisajStep1')?.innerText.includes('RON')) {
        calculeazaPretMancare();
    }
    if (document.getElementById('summaryContent')?.innerText.includes('RON')) {
        updateCabinSummary();
    }
}
aplicaTraducerile();

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

function updateTotalDisplay(adultsId, infantsId, displayId) {
    const adults = parseInt(document.getElementById(adultsId).value) || 0;
    const infants = parseInt(document.getElementById(infantsId).value) || 0;
    const total = calculateTotalPeople(adults, infants);
    const totalText = limbaCurenta === 'en' ? `Total: ${total} people` : `Total: ${total} persoane`;
    document.getElementById(displayId).textContent = totalText;
}

function updateNightsDisplay(shouldUpdateDeparture = true) {
    const el = document.getElementById('nightsDisplay');
    if (el) el.textContent = cabinNights === 1 ? '1 night' : `${cabinNights} nights`;

    // Only recalculate departure based on arrival + nights if not called from handleDepartureChange
    if (shouldUpdateDeparture && cabinArrivalFP && cabinArrivalFP.selectedDates[0]) {
        const arrivalDate = new Date(cabinArrivalFP.selectedDates[0]);
        const dep = new Date(arrivalDate);
        dep.setDate(dep.getDate() + cabinNights);

        // Update the departure Flatpickr instance
        if (cabinDepartureFP) {
            cabinDepartureFP.setDate(dep, true);
            // Manually update the input value to ensure it's displayed
            const year = dep.getFullYear();
            const month = String(dep.getMonth() + 1).padStart(2, '0');
            const day = String(dep.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            document.getElementById('cabinDepartureInput').value = dateStr;
        }
    }
    updateCabinSummary();
    // updateCabinPriceDisplays();
}

function updateAdultsOptions(rooms) {
    const select = document.getElementById('cabinAdultsSelect');
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

function initExtrasSlideshow(containerId, imageList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let idx = 0;
    const slides = container.querySelectorAll('.extras-slide');
    const total = slides.length;
    if (total === 0) return;

    function show(n) {
        slides.forEach(s => s.classList.remove('active'));
        slides[n].classList.add('active');
    }

    show(0);
    setInterval(() => { idx = (idx + 1) % total; show(idx); }, 4000);

    container.querySelector('.extras-prev-btn')?.addEventListener('click', () => {
        idx = (idx - 1 + total) % total; show(idx);
    });
    container.querySelector('.extras-next-btn')?.addEventListener('click', () => {
        idx = (idx + 1) % total; show(idx);
    });
}

function updateCabinSummary() {
    const panel = document.getElementById('summaryContent');
    if (!panel) return;

    const arrival = document.getElementById('cabinArrivalInput')?.value || '—';
    const departure = document.getElementById('cabinDepartureInput')?.value || '—';
    const rooms = document.getElementById('cabinRoomsSelect')?.value || '1';
    const adults = document.getElementById('cabinAdultsSelect')?.value || '1';
    const pets = document.getElementById('cabinPetsInput')?.value || '';
    const nights = cabinNights;

    // let basePrice = parseInt(adults) * nights * PRET_NOAPTE_PERSOANA;
    // let hotTubPrice = WIZARD_STATE.cabinExtras.hotTub ? PRET_HOTTUB : 0;
    // let mealPrice = WIZARD_STATE.cabinExtras.meal ? parseInt(adults) * nights * PRET_MENIU_PER_PERSON_NIGHT : 0;
    // let total = basePrice + hotTubPrice + mealPrice;

    panel.innerHTML = `
        <div class="summary-section">
            <div class="summary-row"><span class="summary-label">Check-in</span><strong>${arrival}</strong></div>
            <div class="summary-row"><span class="summary-label">Check-out</span><strong>${departure}</strong></div>
            <div class="summary-row"><span class="summary-label">Duration</span><strong>${nights} ${nights === 1 ? 'night' : 'nights'}</strong></div>
            <div class="summary-row"><span class="summary-label">Rooms</span><strong>${rooms}</strong></div>
            <div class="summary-row"><span class="summary-label">Adults</span><strong>${adults}</strong></div>
            ${pets ? `<div class="summary-row"><span class="summary-label">Pets</span><strong>${pets}</strong></div>` : ''}
        </div>
    `;
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

function resetCabinForm() {
    document.getElementById('cabinArrivalInput').value = '';
    document.getElementById('cabinDepartureInput').value = '';
    document.getElementById('cabinRoomsSelect').value = '1';
    document.getElementById('cabinAdultsSelect').value = '1';
    document.getElementById('cabinFirstName').value = '';
    document.getElementById('cabinLastName').value = '';
    document.getElementById('cabinEmail').value = '';
    document.getElementById('cabinPhonePrefix').value = '+40';
    document.getElementById('cabinPhone').value = '';
    document.getElementById('cabinSalutation').value = '';
    document.getElementById('cabinPetsInput').value = '';
    document.getElementById('newsletterCheck').checked = false;

    WIZARD_STATE.cabinExtras.hotTub = false;
    WIZARD_STATE.cabinExtras.meal = false;
    cabinNights = 1;

    updateAdultsOptions(1);
    updateNightsDisplay();
    updateCabinSummary();
}

async function submitCabinBooking() {
    const prefix = document.getElementById('cabinPhonePrefix').value;
    const phone = prefix + document.getElementById('cabinPhone').value.trim();
    const salutation = document.getElementById('cabinSalutation').value;
    const firstName = document.getElementById('cabinFirstName').value.trim();
    const lastName = document.getElementById('cabinLastName').value.trim();
    const adults = parseInt(document.getElementById('cabinAdultsSelect').value) || 1;
    const rooms = parseInt(document.getElementById('cabinRoomsSelect').value) || 1;
    const pets = document.getElementById('cabinPetsInput').value.trim();

    const payload = {
        salutation,
        nume: `${salutation} ${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        email: document.getElementById('cabinEmail').value.trim(),
        telefon: phone,
        data_inceput: document.getElementById('cabinArrivalInput').value,
        data_sfarsit: document.getElementById('cabinDepartureInput').value,
        adults: adults,
        infants: 0,
        pets: pets ? 1 : 0,
        pets_info: pets,
        rooms_needed: rooms,
        numar_persoane: adults,
        vrea_meniu: WIZARD_STATE.cabinExtras.meal,
        vrea_hottub: WIZARD_STATE.cabinExtras.hotTub,
        newsletter: document.getElementById('newsletterCheck').checked
    };

    try {
        const res = await fetch(`${backendUrl}/rezervari_cabana`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            WIZARD_STATE.cabinFormDirty = false;

            // Delete draft after successful submission
            if (WIZARD_STATE.cabinDraftId) {
                await fetch(`${backendUrl}/reservations/draft/${WIZARD_STATE.cabinDraftId}`, {
                    method: 'DELETE'
                }).catch(err => console.error('Failed to delete draft:', err));
            }

            showCabinStep(4);
        } else {
            const data = await res.json();
            alert('Error: ' + (data.error || 'Something went wrong.'));
        }
    } catch (err) {
        alert('Cannot reach the server. Please try again.');
    }
}

// Deschide secțiunea selectată și inițializează calendarul aferent ei
function arataSectiune(tip) {
    // Afișăm containerul corect și îl ascundem pe celălalt
    const mancareEl = document.getElementById('sectiuneMancare');
    const cabanaEl = document.getElementById('sectiuneCabana');
    if (mancareEl) mancareEl.style.display = tip === 'mancare' ? 'block' : 'none';
    if (cabanaEl) cabanaEl.style.display = tip === 'cabana' ? 'flex' : 'none';

    // Schimbăm clasa activă pe butoane pentru feedback vizual albastru/gri
    const btnMancare = document.getElementById('btnMancare');
    const btnCabana = document.getElementById('btnCabana');
    if (btnMancare) btnMancare.classList.toggle('active', tip === 'mancare');
    if (btnCabana) btnCabana.classList.toggle('active', tip === 'cabana');

    const todayDisabled = isToday(new Date().toISOString().split('T')[0]) && isAfter10Am();
    if (tip === 'mancare') {
        const notifMancare = document.getElementById('notificationTodayMancare');
        if (notifMancare) notifMancare.style.display = todayDisabled ? 'block' : 'none';
        const btnToday = document.getElementById('btnToday');
        if (btnToday) {
            btnToday.disabled = todayDisabled;
            if (todayDisabled) {
                btnToday.style.opacity = '0.5';
                btnToday.style.cursor = 'not-allowed';
            }
        }
    } else {
        const notifCabana = document.getElementById('notificationTodayCabana');
        if (notifCabana) notifCabana.style.display = todayDisabled ? 'block' : 'none';
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

    // Inițializare Calendar Cabană la cerere - two popup calendars
    if (tip === 'cabana' && !cabinArrivalFP) {
        if (typeof flatpickr === 'undefined') {
            console.error('CRITICAL: Flatpickr library is not loaded!');
            alert('Error: Calendar library failed to load. Please refresh the page.');
            return;
        }

        try {
            const arrivalInput = document.getElementById('cabinArrivalInput');
            const departureInput = document.getElementById('cabinDepartureInput');

            if (!arrivalInput || !departureInput) {
                console.error('Error: Calendar input elements not found in DOM');
                return;
            }

            // Create arrival calendar
            cabinArrivalFP = flatpickr(arrivalInput, {
                mode: 'single',
                minDate: 'today',
                disable: zileCompletOcupate,
                dateFormat: "Y-m-d",
                locale: limbaCurenta === 'ro' ? flatpickr.l10ns.ro : 'en',
                focusInput: false,
                allowInput: false,
                clickOpens: true,
                onChange: handleArrivalChange,
                onOpen: function(dates, dateStr, instance) {
                    console.log('✓ Arrival calendar opened');
                    instance.calendarContainer.style.zIndex = '99999';
                }
            });

            // Create departure calendar
            cabinDepartureFP = flatpickr(departureInput, {
                mode: 'single',
                dateFormat: "Y-m-d",
                locale: limbaCurenta === 'ro' ? flatpickr.l10ns.ro : 'en',
                focusInput: false,
                allowInput: false,
                clickOpens: true,
                onChange: handleDepartureChange,
                onOpen: function(dates, dateStr, instance) {
                    console.log('✓ Departure calendar opened');
                    instance.calendarContainer.style.zIndex = '99999';
                }
            });

            // Attach event listeners to ensure calendar opens on click/focus
            arrivalInput.addEventListener('click', (e) => {
                if (cabinArrivalFP && !cabinArrivalFP.isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    cabinArrivalFP.open();
                }
            }, true);

            arrivalInput.addEventListener('focus', (e) => {
                if (cabinArrivalFP && !cabinArrivalFP.isOpen) {
                    cabinArrivalFP.open();
                }
            }, true);

            departureInput.addEventListener('click', (e) => {
                if (cabinDepartureFP && !cabinDepartureFP.isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    cabinDepartureFP.open();
                }
            }, true);

            departureInput.addEventListener('focus', (e) => {
                if (cabinDepartureFP && !cabinDepartureFP.isOpen) {
                    cabinDepartureFP.open();
                }
            }, true);

            console.log('✓ Cabin calendars initialized and listeners attached');
        } catch (err) {
            console.error('Critical error initializing cabin calendars:', err.message, err.stack);
        }

        // Scroll cabin dates card into view instead of non-existent wrapper
        const cabinDatesCard = document.querySelector('#sectiuneCabana .cabin-dates-card');
        if (cabinDatesCard) {
            cabinDatesCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Also scroll calendar into view if it's already initialized (already visible section)
    if (tip === 'mancare' && calendarMancareInstanta) {
        const calendarWrapperMancare = document.querySelector('#sectiuneMancare .calendar-wrapper');
        if (calendarWrapperMancare) {
            calendarWrapperMancare.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else if (tip === 'cabana' && cabinArrivalFP) {
        const cabinDatesCard = document.querySelector('#sectiuneCabana .cabin-dates-card');
        if (cabinDatesCard) {
            cabinDatesCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function handleArrivalChange(dates) {
    if (dates.length > 0) {
        const dep = new Date(dates[0]);
        dep.setDate(dep.getDate() + cabinNights);

        // Update the departure Flatpickr instance
        if (cabinDepartureFP) {
            cabinDepartureFP.setDate(dep, true);
            // Manually update the input value
            const year = dep.getFullYear();
            const month = String(dep.getMonth() + 1).padStart(2, '0');
            const day = String(dep.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            document.getElementById('cabinDepartureInput').value = dateStr;
            cabinDepartureFP.set('minDate', new Date(dates[0].getTime() + 24 * 60 * 60 * 1000));
        }
        updateNightsDisplay();
        updateCabinSummary();
        // updateCabinPriceDisplays();
    }
}

function handleDepartureChange(dates) {
    if (dates.length > 0 && cabinArrivalFP && cabinArrivalFP.selectedDates[0]) {
        const arrival = cabinArrivalFP.selectedDates[0];
        const departure = dates[0];
        const diff = new Date(departure) - new Date(arrival);
        const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (nights > 0) {
            cabinNights = nights;
            updateNightsDisplay(false);
            updateCabinSummary();
            // updateCabinPriceDisplays();
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

