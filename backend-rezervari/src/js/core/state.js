export const MEAL_MAX_PERSONS = 15;
export const ACCOMMODATION_MAX_PERSONS = 15;
export const MAX_ROOMS = 3;
export const backendUrl = 'http://localhost:3000';

export const WIZARD_STATE = {
    currentReservationType: null,
    cabinStep: 1,           // current step 1-4
    cabinFormData: {
        firstName: '',
        lastName: '',
        email: '',
        phonePrefix: '+40',
        phone: '',
        arrivalDate: '',
        departureDate: '',
        arrivalTime: '',
        adults: 1,
        rooms_needed: 1,
        children: 0,
        wantsHotTub: false,
        wantsMeal: false,
        newsletter: false
    },
    cabinExtras: {
        meal: false,
        hotTub: false
    },
    mealFormData: {
        firstName: '',
        lastName: '',
        email: '',
        phonePrefix: '+40',
        phone: '',
        adults: 1,
        children: 0,
        wantsCabin: false,
        newsletter: false,
        reservationDate: '',
        reservationTime: ''
    },
    mealExtras: {
        cabin: false
    },
    mealStep: 1, // current step 1-4
    mealFormDirty: false,
    cabinFormDirty: false,
};

export const APP_GLOBALS = {
    cabinNights : 1,
    dailyOccupancy : {},
    fullyBookedDates : [],
    calendarMealInstance: null,
    cabinArrivalFP: null,
    cabinDepartureFP: null,
    currentLanguage: window.currentLanguage || 'ro',
    mealReservationFP: null
};