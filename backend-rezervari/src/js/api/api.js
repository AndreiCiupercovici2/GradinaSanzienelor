import { WIZARD_STATE, backendUrl } from '../core/state.js';

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

export async function submitCabinBooking() {
    const res = await fetch(`${backendUrl}/api/cabinReservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit accommodation booking');
    }
    return await res.json();
}

export async function submitMealBooking() {
    const res = await fetch(`${backendUrl}/api/mealReservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit meal booking');
    }
    return await res.json();
}