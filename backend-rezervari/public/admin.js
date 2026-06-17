const backendUrl = '/api';

// Funcție pentru formatarea datei de înregistrare
function formateazaData(dataUTC) {
    if (!dataUTC) return '-';
    return new Date(dataUTC + 'Z').toLocaleString('ro-RO');
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

incarcaRezervariMancare();
incarcaRezervariCabana();