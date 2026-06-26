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

    // // Pause autoplay on mouse enter, resume on mouse leave
    // const heroSection = document.getElementById('heroSlideshow');
    // if (heroSection) {
    //     heroSection.addEventListener('mouseenter', stopAutoplay);
    //     heroSection.addEventListener('mouseleave', startAutoplay);
    // }

    // Pause autoplay when user interacts with dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.addEventListener('click', resetAutoplay);
    });

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
    if (document.getElementById('pretCabanaAfisaj').innerText.includes('RON')) {
        calculeazaPretCabana();
    }
    if (document.getElementById('pretMancareAfisaj').innerText.includes('RON')) {
        calculeazaPretMancare();
    }
}
aplicaTraducerile();

// --- 2. SETĂRI GLOBALE ---
const PRET_NOAPTE_PERSOANA = 100;
const PRET_MENIU_PERSOANA = 70;
const MAX_PERSOANE_MANCARE = 15;
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
                    document.getElementById('dataM').value = dateStr;
                    const formContainer = document.getElementById('formMancareContainer');
                    formContainer.style.display = 'block';
                    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                const formContainer = document.getElementById('formCabanaContainer');
                const warningDiv = document.getElementById('warningCabana');

                if (selectedDates.length === 2) {
                    document.getElementById('dataInceputC').value = instance.formatDate(selectedDates[0], "Y-m-d");
                    document.getElementById('dataSfarsitC').value = instance.formatDate(selectedDates[1], "Y-m-d");

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
                    const inputAdulti = document.getElementById('adultiC');
                    const inputCopii = document.getElementById('copiiC');

                    if (parseInt(inputAdulti.value) + parseInt(inputCopii.value) > locuriDisponibile) {
                        inputAdulti.value = Math.max(1, locuriDisponibile - parseInt(inputCopii.value));
                    }

                    if (maxOcupateInInterval > 0) {
                        warningDiv.style.display = 'block';
                        warningDiv.innerHTML = template.replace(/\{oaspeți\}/g, maxOcupateInInterval).replace(/\{locuri\}/g, locuriDisponibile);
                    } else {
                        warningDiv.style.display = 'none';
                    }

                    formContainer.style.display = 'block';
                    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    calculeazaPretCabana();
                } else {
                    formContainer.style.display = 'none';
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
    const adulti = parseInt(document.getElementById('adultiC').value) || 0;
    const copii = parseInt(document.getElementById('copiiC').value) || 0;
    const persoane = adulti + copii;
    const nopti = calculeazaNopti(document.getElementById('dataInceputC').value, document.getElementById('dataSfarsitC').value);
    const vreaMeniu = document.getElementById('meniuC').checked;

    let pretTotal = (nopti > 0) ? (persoane * nopti * PRET_NOAPTE_PERSOANA) : 0;
    if (nopti > 0 && vreaMeniu) pretTotal += (persoane * nopti * PRET_MENIU_PERSOANA);

    const pretEstimatiText = limbaCurenta === 'en' ? 'Estimated Price:' : 'Preț estimat:';
    document.getElementById('pretCabanaAfisaj').innerText = `${pretEstimatiText} ${pretTotal} RON`;
    updateTotalDisplay('adultiC', 'copiiC', 'totalPeopleC');
}

function calculeazaPretMancare() {
    const adulti = parseInt(document.getElementById('adultiM').value) || 0;
    const copii = parseInt(document.getElementById('copiiM').value) || 0;
    const persoane = adulti + copii;

    if (persoane > MAX_PERSOANE_MANCARE) {
        document.getElementById('adultiM').value = Math.max(1, MAX_PERSOANE_MANCARE - copii);
    }

    const pretEstimatiText = limbaCurenta === 'en' ? 'Estimated Price:' : 'Preț estimat:';
    document.getElementById('pretMancareAfisaj').innerText = `${pretEstimatiText} ${persoane * PRET_MENIU_PERSOANA} RON`;
    updateTotalDisplay('adultiM', 'copiiM', 'totalPeopleM');
}

document.getElementById('adultiC').addEventListener('input', calculeazaPretCabana);
document.getElementById('copiiC').addEventListener('input', calculeazaPretCabana);
document.getElementById('meniuC').addEventListener('change', calculeazaPretCabana);
document.getElementById('adultiM').addEventListener('input', calculeazaPretMancare);
document.getElementById('copiiM').addEventListener('input', calculeazaPretMancare);

// --- 5. COMUNICARE BACKEND ---
document.getElementById('formMancare').addEventListener('submit', async (e) => {
    e.preventDefault();
    const adulti = parseInt(document.getElementById('adultiM').value) || 0;
    const copii = parseInt(document.getElementById('copiiM').value) || 0;
    const payload = {
        nume: document.getElementById('numeM').value,
        email: document.getElementById('emailM').value,
        telefon: document.getElementById('telefonM').value || null,
        data_rezervare: document.getElementById('dataM').value,
        ora: document.getElementById('oraM').value,
        adults: adulti,
        infants: copii,
        pets: parseInt(document.getElementById('animaleM').value) || 0,
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
            document.getElementById('formMancare').reset();
            document.getElementById('formMancareContainer').style.display = 'none';
            calculeazaPretMancare();
        } else {
            const data = await res.json();
            alert('Eroare: ' + (data.error || 'Date incorecte.'));
        }
    } catch (err) { alert('Nu se poate contacta serverul.'); }
});

// Today/Tomorrow button handlers for meal form
document.getElementById('btnToday').addEventListener('click', function(e) {
    e.preventDefault();
    if (!this.disabled) {
        const today = new Date();
        const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        document.getElementById('dataM').value = dateStr;
        document.getElementById('formMancareContainer').style.display = 'block';
        document.getElementById('formMancareContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
        calculeazaPretMancare();
    }
});

document.getElementById('btnTomorrow').addEventListener('click', function(e) {
    e.preventDefault();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
    document.getElementById('dataM').value = dateStr;
    document.getElementById('formMancareContainer').style.display = 'block';
    document.getElementById('formMancareContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    calculeazaPretMancare();
});

document.getElementById('formCabana').addEventListener('submit', async (e) => {
    e.preventDefault();
    const adulti = parseInt(document.getElementById('adultiC').value) || 0;
    const copii = parseInt(document.getElementById('copiiC').value) || 0;
    const payload = {
        nume: document.getElementById('numeC').value,
        email: document.getElementById('emailC').value,
        telefon: document.getElementById('telefonC').value || null,
        data_inceput: document.getElementById('dataInceputC').value,
        data_sfarsit: document.getElementById('dataSfarsitC').value,
        adults: adulti,
        infants: copii,
        pets: parseInt(document.getElementById('animaleC').value) || 0,
        rooms_needed: parseInt(document.getElementById('camereC').value) || 1,
        numar_persoane: adulti + copii,
        vrea_meniu: document.getElementById('meniuC').checked
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
            document.getElementById('formCabana').reset();
            document.getElementById('formCabanaContainer').style.display = 'none';
            calculeazaPretCabana();
        } else {
            const data = await res.json();
            alert('Eroare: ' + (data.error || 'Date incorecte.'));
        }
    } catch (err) { alert('Nu se poate contacta serverul.'); }
});