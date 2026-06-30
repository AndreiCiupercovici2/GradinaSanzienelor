import { WIZARD_STATE } from '../core/state.js';

export function isToday(dateStr) {
    const today = new Date();
    const date = new Date(dateStr);
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
}

export function isAfter10Am() {
    return new Date().getHours() >= 10;
}

export function syncCabinOrMealFormToState() {
    const state = WIZARD_STATE.cabinFormData;
    state.firstName = document.getElementById('firstName').value;
    state.lastName = document.getElementById('lastName').value;
    state.email = document.getElementById('email').value;
    state.phonePrefix = document.getElementById('phonePrefix')?.value || '+40';
    state.phone = document.getElementById('phone').value;
    state.adults = parseInt(document.getElementById('adults')?.value) || 1;
    state.pets = parseInt(document.getElementById('pets')?.value) || 0;
    state.arrivalDate = document.getElementById('arrivalDate')?.value || new Date().toISOString().split('T')[0];
    state.departureDate = document.getElementById('departureDate')?.value || '';
    state.newsletter = document.getElementById('newsletter')?.checked;
    state.wantsMeal = document.getElementById('wantsMeal')?.checked;
    state.wantsHotTub = document.getElementById('wantsHotTub')?.checked;
    state.wantsCabin = document.getElementById('wantsCabin')?.checked;
    state.rooms = parseInt(document.getElementById('rooms')?.value) || 1;
}