import { WIZARD_STATE, APP_GLOBALS } from '../core/state.js';
import flatpickr from 'flatpickr';
import { Romanian } from 'flatpickr/dist/l10n/ro.js';

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

export function getLocaleConfig() {
    if (APP_GLOBALS.currentLanguage === 'ro' && typeof flatpickr !== 'undefined' && Romanian) {
        return { locale: Romanian };
    }
    return { locale: 'en' };
}

export function formatDate(dateUTC) {
    if (!dateUTC) return '-';
    return new Date(dateUTC).toLocaleString('ro-RO');
}

export function calculateNights(arrivalDate, departureDate) {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    const diffTime = Math.abs(departure - arrival);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function setVal(selector, value) {
    const element = document.querySelector(selector);
    if ( element && value !== undefined && value !== null) element.value = value;
}

export function setChecked(selector, isChecked) {
    const element = document.querySelector(selector);
    if (element) element.checked = isChecked;
}