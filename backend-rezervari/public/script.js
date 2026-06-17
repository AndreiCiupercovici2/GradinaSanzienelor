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
    
    if (typeof flatpickr !== 'undefined' && flatpickr.l10ns[nouaLimba]) {
        flatpickr.localize(flatpickr.l10ns[nouaLimba]);
    }
}
aplicaTraducerile();

// --- 2. SETĂRI GLOBALE ---
const PRET_NOAPTE_PERSOANA = 100; 
const PRET_MENIU_PERSOANA = 70;
const backendUrl = '/api'; 

let ocupareZilnica = {}; 
let zileCompletOcupate = [];
let calendarMancareInstanta = null;
let calendarCabanaInstanta = null;

// Deschide secțiunea selectată și inițializează calendarul aferent ei
function arataSectiune(tip) {
    // Afișăm containerul corect și îl ascundem pe celălalt
    document.getElementById('sectiuneMancare').style.display = tip === 'mancare' ? 'block' : 'none';
    document.getElementById('sectiuneCabana').style.display = tip === 'cabana' ? 'block' : 'none';

    // Schimbăm clasa activă pe butoane pentru feedback vizual albastru/gri
    document.getElementById('btnMancare').classList.toggle('active', tip === 'mancare');
    document.getElementById('btnCabana').classList.toggle('active', tip === 'cabana');

    const setariComune = {
        dateFormat: "Y-m-d",
        inline: true,
        disableMobile: "true"
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
                    const inputPersoane = document.getElementById('persoaneC');
                    inputPersoane.max = locuriDisponibile;
                    
                    if (parseInt(inputPersoane.value) > locuriDisponibile) {
                        inputPersoane.value = locuriDisponibile;
                    }

                    if (maxOcupateInInterval > 0) {
                        warningDiv.style.display = 'block';
                        warningDiv.innerHTML = `<strong>Atenție:</strong> În această perioadă cabana mai găzduiește <strong>${maxOcupateInInterval} oaspeți</strong>. Spațiile comune se împart. <br>Mai sunt doar <strong>${locuriDisponibile} locuri libere</strong>.`;
                    } else {
                        warningDiv.style.display = 'none';
                        inputPersoane.max = 8;
                    }

                    formContainer.style.display = 'block';
                    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    calculeazaPretCabana();
                } else {
                    formContainer.style.display = 'none';
                }
            }
        });
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

document.addEventListener("DOMContentLoaded", async function() {
    await incarcatDateOcupare();
    // Pagina de mâncare rămâne prima deschisă automat la încărcare
    arataSectiune('mancare');
});

// --- 4. CALCUL PREȚ ---
function calculeazaNopti(start, end) {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    const zile = Math.ceil(diff / (1000 * 60 * 60 * 24)); 
    return zile > 0 ? zile : 0;
}

function calculeazaPretCabana() {
    const persoane = parseInt(document.getElementById('persoaneC').value) || 0;
    const nopti = calculeazaNopti(document.getElementById('dataInceputC').value, document.getElementById('dataSfarsitC').value);
    const vreaMeniu = document.getElementById('meniuC').checked;
    
    let pretTotal = (nopti > 0) ? (persoane * nopti * PRET_NOAPTE_PERSOANA) : 0;
    if (nopti > 0 && vreaMeniu) pretTotal += (persoane * nopti * PRET_MENIU_PERSOANA);
    
    document.getElementById('pretCabanaAfisaj').innerText = `Preț estimat: ${pretTotal} RON`;
}

function calculeazaPretMancare() {
    const persoane = parseInt(document.getElementById('persoaneM').value) || 0;
    document.getElementById('pretMancareAfisaj').innerText = `Preț estimat: ${persoane * PRET_MENIU_PERSOANA} RON`;
}

document.getElementById('persoaneC').addEventListener('input', calculeazaPretCabana);
document.getElementById('meniuC').addEventListener('change', calculeazaPretCabana);
document.getElementById('persoaneM').addEventListener('input', calculeazaPretMancare);

// --- 5. COMUNICARE BACKEND ---
document.getElementById('formMancare').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nume: document.getElementById('numeM').value,
        email: document.getElementById('emailM').value,
        telefon: document.getElementById('telefonM').value || null,
        data_rezervare: document.getElementById('dataM').value,
        ora: document.getElementById('oraM').value,
        numar_persoane: parseInt(document.getElementById('persoaneM').value)
    };

    try {
        const res = await fetch(`${backendUrl}/rezervari_mancare`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert(traduceri[limbaCurenta].alerta_success || 'Cerere trimisă!');
            document.getElementById('formMancare').reset();
            document.getElementById('formMancareContainer').style.display = 'none';
            calculeazaPretMancare();
        } else {
            const data = await res.json();
            alert('Eroare: ' + (data.error || 'Date incorecte.'));
        }
    } catch (err) { alert('Nu se poate contacta serverul.'); }
});

document.getElementById('formCabana').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nume: document.getElementById('numeC').value,
        email: document.getElementById('emailC').value,
        telefon: document.getElementById('telefonC').value || null,
        data_inceput: document.getElementById('dataInceputC').value,
        data_sfarsit: document.getElementById('dataSfarsitC').value,
        numar_persoane: parseInt(document.getElementById('persoaneC').value),
        vrea_meniu: document.getElementById('meniuC').checked
    };

    try {
        const res = await fetch(`${backendUrl}/rezervari_cabana`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert(traduceri[limbaCurenta].alerta_success || 'Cerere trimisă!');
            document.getElementById('formCabana').reset();
            document.getElementById('formCabanaContainer').style.display = 'none';
            calculeazaPretCabana();
        } else {
            const data = await res.json();
            alert('Eroare: ' + (data.error || 'Date incorecte.'));
        }
    } catch (err) { alert('Nu se poate contacta serverul.'); }
});