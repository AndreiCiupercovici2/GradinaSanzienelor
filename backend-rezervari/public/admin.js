const backendUrl = '/api';

// Funcție pentru formatarea datei de înregistrare
function formateazaData(dataUTC) {
    if (!dataUTC) return '-';
    return new Date(dataUTC + 'Z').toLocaleString('ro-RO');
}

// Helper pentru a genera butoanele de decizie dacă e "in asteptare"
function genereazaButoane(id, tip, statusActual) {
    if (statusActual === 'in asteptare') {
        return `
            <button style="background:green; color:white; border:none; padding:5px; cursor:pointer;" onclick="schimbaStatus(${id}, '${tip}', 'confirmat')">✔️ Aprobă</button>
            <button style="background:red; color:white; border:none; padding:5px; cursor:pointer;" onclick="schimbaStatus(${id}, '${tip}', 'anulat')">❌ Respinge</button>
        `;
    }
    // Dacă e deja confirmat sau anulat, arătăm doar textul
    return `<strong>${statusActual.toUpperCase()}</strong>`;
}

// Draft actions
async function stergereCiorna(draftId) {
    if (!confirm('Ești sigură că vrei să ștergi această ciornă?')) return;

    try {
        const response = await fetch(`${backendUrl}/reservations/draft/${draftId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Ciorna ștearsă cu succes!');
            incarcaCiorne();
        } else {
            alert('A apărut o eroare la ștergere.');
        }
    } catch (error) {
        console.error(error);
        alert('Eroare de conexiune.');
    }
}

async function trimitereAmintire(draftId) {
    if (!confirm('Ești sigură că vrei să trimiți un email de amintire?')) return;

    try {
        const response = await fetch(`${backendUrl}/reservations/draft/${draftId}/send-reminder`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Email de amintire trimis cu succes!');
        } else {
            const error = await response.json();
            alert('Eroare: ' + (error.message || 'A apărut o eroare.'));
        }
    } catch (error) {
        console.error(error);
        alert('Eroare de conexiune.');
    }
}

async function marcareFinal(draftId) {
    if (!confirm('Ești sigură că clientul a finalizat rezervarea?')) return;

    try {
        const response = await fetch(`${backendUrl}/reservations/draft/${draftId}/mark-completed`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Ciorna marcată ca finalizată și ștearsă!');
            incarcaCiorne();
        } else {
            alert('A apărut o eroare.');
        }
    } catch (error) {
        console.error(error);
        alert('Eroare de conexiune.');
    }
}

// Funcția apelată de butoanele Aprobă / Respinge
async function schimbaStatus(id, tip, decizie) {
    if (!confirm(`Ești sigură că vrei să marchezi această rezervare ca ${decizie}?`)) return;

    try {
        const response = await fetch(`${backendUrl}/admin/decizie`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, tipRezervare: tip, decizie: decizie })
        });

        if (response.ok) {
            alert('Status actualizat cu succes!');
            // Reîncărcăm tabelele pentru a vedea noul status
            incarcaRezervariCabana();
            incarcaRezervariMancare();
        } else {
            alert('A apărut o eroare la actualizare.');
        }
    } catch (error) {
        console.error(error);
    }
}

async function incarcaCiorne() {
    try {
        const res = await fetch(`${backendUrl}/admin/drafts`);
        const drafts = await res.json();
        const tabel = document.getElementById('tabelCiorne');
        tabel.innerHTML = '';

        if (drafts.length === 0) {
            tabel.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Nu sunt ciorně active.</td></tr>';
            return;
        }

        drafts.forEach(draft => {
            const tipDisplay = draft.reservation_type === 'mancare' ? 'Mâncare' : 'Cabană';
            const tabel_row = `
                <tr>
                    <td style="color:#888; font-size:12px;">${formateazaData(draft.updated_at)}</td>
                    <td>${draft.email} <br> <small>${draft.phone || 'Fără tel.'}</small></td>
                    <td><span class="status-draft">🔄 ${tipDisplay}</span></td>
                    <td>Pasul ${draft.current_step}</td>
                    <td>
                        <button class="btn-remind" onclick="trimitereAmintire(${draft.id})">📧 Amintire</button>
                        <button class="btn-complete" onclick="marcareFinal(${draft.id})">✓ Finalizat</button>
                        <button class="btn-delete" onclick="stergereCiorna(${draft.id})">❌ Șterge</button>
                    </td>
                </tr>`;
            tabel.innerHTML += tabel_row;
        });
    } catch (error) {
        console.error('Error loading drafts:', error);
    }
}

async function incarcaRezervariMancare() {
    const res = await fetch(`${backendUrl}/admin/mancare`);
    const rezervari = await res.json();
    const tabel = document.getElementById('tabelMancare');
    tabel.innerHTML = '';

    rezervari.forEach(rez => {
        tabel.innerHTML += `
            <tr>
                <td style="color:#888; font-size:12px;">${formateazaData(rez.data_comanda)}</td>
                <td>${rez.nume} <br> <small>${rez.telefon || 'Fără tel.'}</small></td>
                <td><strong>${rez.data_rezervare}</strong> <br> Ora: ${rez.ora}</td>
                <td>${rez.numar_persoane}</td>
                <td>${genereazaButoane(rez.id, 'mancare', rez.status)}</td>
            </tr>`;
    });
}

async function incarcaRezervariCabana() {
    const res = await fetch(`${backendUrl}/admin/cabana`);
    const rezervari = await res.json();
    const tabel = document.getElementById('tabelCabana');
    tabel.innerHTML = '';

    rezervari.forEach(rez => {
        tabel.innerHTML += `
            <tr>
                <td style="color:#888; font-size:12px;">${formateazaData(rez.data_rezervare)}</td>
                <td>${rez.nume} <br> <small>${rez.telefon || 'Fără tel.'}</small></td>
                <td>${rez.data_inceput} - ${rez.data_sfarsit}</td>
                <td>${rez.numar_persoane} <br> Meniu: ${rez.vrea_meniu ? 'Da' : 'Nu'}</td>
                <td>${genereazaButoane(rez.id, 'cabana', rez.status)}</td>
            </tr>`;
    });
}

// Auto-refresh every 30 seconds
setInterval(() => {
    incarcaCiorne();
    incarcaRezervariMancare();
    incarcaRezervariCabana();
}, 30000);

// Initial load
incarcaCiorne();
incarcaRezervariMancare();
incarcaRezervariCabana();