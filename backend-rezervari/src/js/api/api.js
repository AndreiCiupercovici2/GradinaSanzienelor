import { WIZARD_STATE, APP_GLOBALS, backendUrl } from '../core/state.js';

export async function saveMealDraft(step) {
    const res = await fetch(`${backendUrl}/api/reservations/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_type: 'meal', current_step: step, step_data: WIZARD_STATE.mealFormData })
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save meal draft');
    }
    return await res.json();
}

export async function saveCabinDraft(step) {
    const res = await fetch(`${backendUrl}/api/reservations/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_type: 'cabin', current_step: step, step_data: WIZARD_STATE.cabinFormData })
    });
    if (!res.ok) {
        console.log('Error response:', res);
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save cabin draft');
    }
    return await res.json();
}

export async function submitCabinBooking(payload) {
    const res = await fetch(`${backendUrl}/api/cabin_reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit accommodation booking');
    }
    return await res.json();
}

export async function submitMealBooking(payload) {
    const res = await fetch(`${backendUrl}/api/meal_reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(async (res) => {
        if(!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.errors || 'Failed to submit meal booking');
        }
        return res.json();
    })
}

export async function loadOccupiedDates() {
    try {
        const response = await fetch(`${backendUrl}/api/occupied_days`);
        if (response.ok) {
            const confirmedReservations = await response.json();
            confirmedReservations.forEach(rez => {
                let startParts = rez.start_date.split('-');
                let endParts = rez.end_date.split('-');
                let startDate = new Date(startParts[0], startParts[1] - 1, startParts[2], 12, 0, 0);
                let endDate = new Date(endParts[0], endParts[1] - 1, endParts[2], 12, 0, 0);

                for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
                    let dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');

                    if (!APP_GLOBALS.dailyOccupancy[dateStr]) APP_GLOBALS.dailyOccupancy[dateStr] = 0;
                    APP_GLOBALS.dailyOccupancy[dateStr] += rez.number_of_persons;

                    if (APP_GLOBALS.dailyOccupancy[dateStr] >= 8) {
                        APP_GLOBALS.fullyBookedDates.push(dateStr);
                    }
                }
            });
        }
    } catch (e) {
        console.warn("Serverul nu a trimis zilele ocupate.");
    }
}
