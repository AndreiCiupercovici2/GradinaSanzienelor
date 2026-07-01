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
            <button style="background:green; color:white; border:none; padding:5px; cursor:pointer;" onclick="changeStatus(${id}, '${reservationType}', 'confirm')">✔️ Aprobă</button>
            <button style="background:red; color:white; border:none; padding:5px; cursor:pointer;" onclick="changeStatus(${id}, '${reservationType}', 'reject')">❌ Respinge</button>
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
    const res = await fetch(`${backendUrl}/admin/meal`);
    const reservations = await res.json();
    const table = document.getElementById('mealTable');
    table.innerHTML = '';

    reservations.forEach(rez => {
        table.innerHTML += `
            <tr>
                <td style="color:#888; font-size:12px;">${formatDate(rez.order_date)}</td>
                <td>${rez.first_name} ${rez.last_name} <br> <small>${rez.phone || 'Fără tel.'}</small></td>
                <td><strong>${rez.reservation_date}</strong> <br> Ora: ${rez.time}</td>
                <td>${rez.number_of_persons}</td>
                <td>${generateButtons(rez.id, 'meal', rez.status)}</td>
            </tr>`;
    });
}

async function loadCabinReservations() {
    const res = await fetch(`${backendUrl}/admin/cabin`);
    const reservations = await res.json();
    const table = document.getElementById('cabinTable');
    table.innerHTML = '';

    reservations.forEach(rez => {
        table.innerHTML += `
            <tr>
                <td style="color:#888; font-size:12px;">${formatDate(rez.reservation_date)}</td>
                <td>${rez.first_name} ${rez.last_name} <br> <small>${rez.phone || 'Fără tel.'}</small></td>
                <td>${rez.start_date} - ${rez.end_date}</td>
                <td>${rez.number_of_persons} <br> Meniu: ${rez.wants_meal ? 'Da' : 'Nu'}</td>
                <td>${generateButtons(rez.id, 'cabin', rez.status)}</td>
            </tr>`;
    });
}

// Auto-refresh every 30 seconds
setInterval(() => {
    loadMealReservations();
    loadCabinReservations();
}, 30000);

// Initial load
loadMealReservations();
loadCabinReservations();
