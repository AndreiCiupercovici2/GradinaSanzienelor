import { initExtrasSlideshow, initHeroSlideshow } from './ui/slideshow.js';
import { changeLanguage, applyTranslations } from './core/translations.js';
import { APP_GLOBALS } from './core/state.js';
import { initWizardEventListeners, showSection, showCabinStep, showMealStep } from './ui/wizard.js';
import { loadOccupiedDates } from './api/api.js';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        initHeroSlideshow();
        initExtrasSlideshow('hotTubSlideshow');
        initExtrasSlideshow('mealSlideshow');
        initExtrasSlideshow('cabinSlideshow');
        initWizardEventListeners();
        await loadOccupiedDates();
    } catch (err) {
        console.error('Initialization failed:', err);
    }

    applyTranslations();

    document.getElementById('ro-btn')?.addEventListener('click', (e) => { e.preventDefault(); changeLanguage('ro'); });
    document.getElementById('en-btn')?.addEventListener('click', (e) => { e.preventDefault(); changeLanguage('en'); });

    if (document.getElementById('cabinSection')) {
        await showSection('cabinSection');
        showCabinStep(1);
    }
    if (document.getElementById('mealSection')) {
        await showSection('mealSection');
        showMealStep(1);
    }
});
