import { initExtrasSlideshow, initHeroSlideshow } from './ui/slideshow.js';
import { changeLanguage, applyTranslations, formatLegalLinks } from './core/translations.js';
import { APP_GLOBALS } from './core/state.js';
import { initWizardEventListeners, showCabinStep, showMealStep, initializeCalendars } from './ui/wizard.js';
import { loadOccupiedDates } from './api/api.js';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        initHeroSlideshow();
        initExtrasSlideshow('hotTubSlideshow');
        initExtrasSlideshow('mealSlideshow');
        initExtrasSlideshow('cabinSlideshow');
        initWizardEventListeners();
        initializeCalendars();
        await loadOccupiedDates();
    } catch (err) {
        console.error('Initialization failed:', err);
    }

    applyTranslations();
    formatLegalLinks();

    document.getElementById('ro-btn')?.addEventListener('click', (e) => { e.preventDefault(); changeLanguage('ro'); });
    document.getElementById('en-btn')?.addEventListener('click', (e) => { e.preventDefault(); changeLanguage('en'); });

    if (document.getElementById('cabinSection')) {
        showCabinStep(1);
    }
    if (document.getElementById('mealSection')) {
        showMealStep(1);
    }
});
