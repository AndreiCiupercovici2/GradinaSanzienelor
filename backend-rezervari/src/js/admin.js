const backendUrl = '/api';

// Format a UTC registration date for display
function formatDate(dateUTC) {
    if (!dateUTC) return '-';
    return new Date(dateUTC + 'Z').toLocaleString('ro-RO');
}

// Build approve / reject buttons when status is 'pending'
function generateButtons(id, reservationType, currentStatus) {
    if (currentStatus === 'pending') {
        return `
            <button style="background:green; color:white; border:none; padding:5px; cursor:pointer;" onclick="window.changeStatus(${id}, '${reservationType}', 'confirm')">✔️ Aprobă</button>
            <button style="background:red; color:white; border:none; padding:5px; cursor:pointer;" onclick="window.changeStatus(${id}, '${reservationType}', 'reject')">❌ Respinge</button>
        `;
    }
    // Already confirmed or cancelled — show text only
    return `<strong>${currentStatus.toUpperCase()}</strong>`;
}


// Called by the Approve / Reject buttons
async function changeStatus(id, reservationType, decision) {
    if (!confirm(`Ești sigură că vrei să marchezi această rezervare ca ${decision}?`)) return;

    try {
        const response = await fetch(`${backendUrl}/admin/decision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, reservationType: reservationType, decision: decision })
        });

        if (response.ok) {
            alert('Status actualizat cu succes!');
            // Reload tables to reflect the new status
            loadMealReservations();
            loadCabinReservations();
        } else {
            alert('A apărut o eroare la actualizare.');
        }
    } catch (error) {
        console.error(error);
    }
}

async function loadMealReservations() {
    try {
        const res = await fetch(`${backendUrl}/admin/meal`);

        // Check if response was successful
        if (!res.ok) {
            console.error('Error fetching meal reservations:', res.status);
            alert('Nu s-au putut încărca rezervările de mâncare.');
            return;
        }

        const reservations = await res.json();

        // Validate that reservations is an array
        if (!Array.isArray(reservations)) {
            console.error('API returned non-array data for meal reservations:', reservations);
            alert('Format de date invalid de la server.');
            return;
        }

        const table = document.getElementById('mealTable');
        table.innerHTML = '';

        reservations.forEach(rez => {
            table.innerHTML += `
                <tr>
                    <td style="color:#888; font-size:12px;">${formatDate(rez.created_at)}</td>
                    <td>${rez.first_name} ${rez.last_name} <br> <small>${rez.phone || 'Fără tel.'}</small></td>
                    <td><strong>${rez.reservation_date}</strong></td>
                    <td>${rez.adults}</td>
                    <td>${generateButtons(rez.id, 'meal', rez.status)}</td>
                </tr>`;
        });
    } catch (error) {
        console.error('Exception in loadMealReservations:', error);
        alert('A apărut o eroare la încărcarea rezervărilor de mâncare.');
    }
}

async function loadCabinReservations() {
    try {
        const res = await fetch(`${backendUrl}/admin/cabin`);

        // Check if response was successful
        if (!res.ok) {
            console.error('Error fetching cabin reservations:', res.status);
            alert('Nu s-au putut încărca rezervările de cabană.');
            return;
        }

        const reservations = await res.json();

        // Validate that reservations is an array
        if (!Array.isArray(reservations)) {
            console.error('API returned non-array data for cabin reservations:', reservations);
            alert('Format de date invalid de la server.');
            return;
        }

        const table = document.getElementById('cabinTable');
        table.innerHTML = '';

        reservations.forEach(rez => {
            table.innerHTML += `
                <tr>
                    <td style="color:#888; font-size:12px;">${formatDate(rez.CREATED_AT)}</td>
                    <td>${rez.first_name} ${rez.last_name} <br> <small>${rez.phone || 'Fără tel.'}</small></td>
                    <td>${rez.start_date} - ${rez.end_date}</td>
                    <td>${rez.adults} <br> Meniu: ${rez.wants_meal ? 'Da' : 'Nu'}</td>
                    <td>${generateButtons(rez.id, 'cabin', rez.status)}</td>
                </tr>`;
        });
    } catch (error) {
        console.error('Exception in loadCabinReservations:', error);
        alert('A apărut o eroare la încărcarea rezervărilor de cabană.');
    }
}

// Export to global scope so inline onclick handlers can access them
window.changeStatus = changeStatus;
window.loadMealReservations = loadMealReservations;
window.loadCabinReservations = loadCabinReservations;

// Auto-refresh every 30 seconds
setInterval(() => {
    loadMealReservations();
    loadCabinReservations();
}, 30000);

// Initial load
loadMealReservations();
loadCabinReservations();
