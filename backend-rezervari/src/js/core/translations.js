import { WIZARD_STATE, APP_GLOBALS } from '../core/state.js';
export const translations = {
    ro: {
        main_title: "Grădina Sânzienelor - Punct Gastronomic Local",
        label_name: "Nume complet",
        label_email: "Adresă de email",
        label_phone: "Telefon",
        label_meal_date: "Data mesei",
        label_check_in_date: "Data check-in (început)",
        label_check_out_date: "Data check-out (sfârșit)",
        label_arrival_time: "Ora sosirii",
        label_number_of_persons: "Număr persoane",
        label_menu: "Doresc și meniu gastronomic",
        label_adults: "Adulți",
        label_pets: "Animale de companie",
        label_rooms_needed: "Camere necesare",
        btn_send: "Trimite rezervarea",
        continue_button: "Continuă la informații personale",
        btn_submit: "Trimite",
        btn_resume: "Continuă rezervarea",
        btn_today: "Azi",
        btn_tomorrow: "Mâine",
        alert_success: "Rezervarea a fost trimisă cu succes!",
        meal_section_subtitle: "Selecteaza o zi din calendar pentru a face rezervarea la masă.",
        cabin_section_subtitle: "Selectează perioada în care dorești să te cazezi în cabană.",
        cabin_warning: "<strong>Atenție:</strong> În această perioadă cabana mai găzduiește <strong>{oaspeți} oaspeți</strong>. Spațiile comune se împart. <br>Mai sunt doar <strong>{locuri} locuri libere</strong>.",
        notification_today_disabled: "Dacă doriți să rezervați pentru astăzi, vă rugăm sunați la numărul nostru de telefon: \n+40 748 792 686 sau \n+40 740 884 472.\nDupa finalizarea rezervării, vă vom contacta pentru a confirma detaliile și a vă oferi informații suplimentare.\nPentru evenimente speciale și meniuri mai complexe vă rugăm sa ne sunați",
        confirmation_pending: "Cererea a fost trimisă pentru aprobare. Un administrator vă va contacta pentru a confirma detaliile.",
        warning_pending_reservation: "Atenție: Există o rezervare în așteptare pentru această perioadă.",
        step_travel_info: "Informații călătorie",
        step_personal_info: "Informații personale",
        step_progress_1of2: "Pasul 1 din 2",
        step_progress_2of2: "Pasul 2 din 2",
        step_extras: "Extra servicii",
        step_your_details: "Date personale",
        step_confirmation: "Confirmare",
        label_arrival: "Sosire",
        label_departure: "Plecare",
        label_night: "Noapte",
        label_nights: "Nopți",
        label_rooms: "Nr. de camere",
        label_hottub: "Ciubăr",
        label_meal_plan: "Plan gastronomic",
        label_first_name: "Prenume",
        label_last_name: "Nume",
        label_phone_prefix: "Cod țară",
        newsletter_label: "Doresc să primesc noutăți și detalii despre evenimente prin email",
        newsletter_tooltip: "În viitor, aș dori să primesc noutăți legate de meniuri și detalii despre evenimente prin email. Acest consimțământ poate fi retras oricând.",
        terms_note: "Confirmând rezervarea, sunteți de acord cu",
        terms_link: "Termenii și condițiile",
        privacy_link: "Politica de confidențialitate",
        btn_send_booking: "Trimite rezervarea pentru confirmare",
        btn_new_booking: "Fă o altă rezervare",
        confirmation_title: "Cererea de rezervare primită!",
        confirmation_message: "Mulțumim că ați ales Grădina Sânzienelor. Gazda va examina cererea și vă va contacta în 24 de ore pentru a confirma detaliile rezervării.",
        summary_title: "Rezervarea dvs",
        summary_arrival: "Sosire",
        summary_departure: "Plecare",
        summary_nights: "Nopți",
        summary_rooms: "Camere",
        summary_adults: "Adulți",
        summary_extras: "Extra servicii",
        hottub_description: "Relaxați-vă sub stele în ciubărul nostru privat cu sistem de lumini și jacuzzi. Disponibil tot anul, ciubărul poate găzdui până la 6 oaspeți. Puteți alege să îl adăugați la rezervarea dvs. pentru întreg sejurul sau doar pentru o noapte.",
        meal_description: "Începeți fiecare dimineață cu un mic dejun copios, din ingrediente locale sezoniere. Bucurați-vă de cine în trei feluri, gătit de bucătaria noastră. Preț per persoană per noapte.",
        accommodation_title: "Rezervări cazare",
        punct_gastronomic_title: "Ce este un Punct Gastronomic Local?",
        contact_title: "Contact",
        meal_title: "Rezervări Masă",
        nav_home: "Acasă",
        nav_gastronomic_point: "Ce este un Punct Gastronomic Local?",
        nav_contact: "Contact",
        nav_meal: "Rezervări masă",
        nav_cabin: "Rezervări cazare",
        legal_note: "Confirmând rezervarea, sunteți de acord cu {/terms} și {/privacy}.",
        terms_and_conditions: "Termeni și condiții",
        privacy_policy: "Politica de confidențialitate",
        back_to_travel_info: "Înapoi la informații de călătorie",
        send_booking_button: "Trimite rezervarea pentru confirmare",
        booking_summary: "Rezumat rezervare",
        confirmation_label: "Confirmare",
        confirmation_message: "Rezervarea dvs. a fost trimisă.",
        booking_request_submitted: "Cererea de rezervare a fost trimisă",
        confirmation_message_details: "Vă mulțumim pentru cererea de rezervare. Gazda noastră va examina personal detaliile și vă va contacta în cel mai scurt timp pentru a confirma rezervarea. Așteptăm cu nerăbdare să vă primim la Grădina Sânzienelor!",
        confirmation_sub_message: "Vă rugăm să verificați email-ul pentru un rezumat al cererii dvs.",
        make_another_booking: "Fă o altă rezervare",
        extras_title: "Extra servicii",
        extras_subtitle: "Selectați serviciile suplimentare pe care doriți să le adăugați la rezervarea dvs.",
        extras_hottub: "Ciubăr privat",
        extras_meal_plan: "Plan gastronomic",
        extras_hottub_description: "Relaxați-vă sub stele în ciubărul nostru privat cu sistem de lumini și jacuzzi. Disponibil tot anul, ciubărul poate găzdui până la 6 oaspeți. Puteți alege să îl adăugați la rezervarea dvs. pentru întreg sejurul sau doar pentru o noapte.",
        extras_meal_plan_description: "Începeți fiecare dimineață cu un mic dejun copios, din ingrediente locale sezoniere. Bucurați-vă de cine în trei feluri, gătit de bucătaria noastră. Preț per persoană per noapte.",
        terms_and_conditions: "Termeni și condiții",
        privacy_policy: "Politica de confidențialitate",
        newsletter_agree: "Sunt de acord să primesc informații",
        extras_cabin: "Cabana",
        extras_cabin_description: "Bucurați-vă de un sejur confortabil în cabana noastră, înconjurată de natură. Cabana este dotată cu facilități moderne și oferă un refugiu confortabil pentru escapada dvs.",
        terms_title: "Termeni și condiții",
        privacy_title: "Politica de confidențialitate",
        meal_arrival_label: "Sosire",
        placeholder_select_date: "Selectează data sosirii",
        placeholder_select_time: "Selectează ora sosirii",
        placeholder_pets: "ex: 1 câine",
        continue_to_extras: "Continuă la extra servicii",
        continue_to_personal_info: "Continuă la informații personale",
        back_to_extras: "Înapoi la extra servicii",
        cabin_title: "Cazare în cabană",
        cabin_description: "Relaxați-vă în cabana noastră privată cu vedere la pădure. Perfectă pentru seri romantice sau după o zi de explorare a munților. Disponibilă pe toată durata sejurului.",
        email_placeholder: "Introduceți adresa dvs. de email",
        first_name_placeholder: "Introduceți prenumele dvs.",
        last_name_placeholder: "Introduceți numele dvs.",
        phone_placeholder: "Introduceți numărul dvs. de telefon",
        first_name_label: "Prenume",
        last_name_label: "Nume",
        email_address_label: "Adresă de email",
        telephone_label: "Număr de telefon",
        meal_extras_title: "Extra servicii pentru masă",
        summary_time: "Ora sosirii",
        yes: "Da",
        no: "Nu",
        cabin_extras_title: "Extra servicii pentru cazare",
        extra_hot_tub: "Ciubăr privat",
        extra_meal_plan: "Plan gastronomic",
        cabin_dates_title: "Date cazare",
        extra_hot_tub_description: "Relaxați-vă sub stele în ciubărul nostru privat cu sistem de lumini și jacuzzi. Disponibil tot anul, ciubărul poate găzdui până la 6 oaspeți. Puteți alege să îl adăugați la rezervarea dvs. pentru întreg sejurul sau doar pentru o noapte.",
        extra_meal_plan_description: "Începeți fiecare dimineață cu un mic dejun copios, din ingrediente locale sezoniere. Bucurați-vă de cine în trei feluri, gătit de bucătaria noastră. Preț per persoană per noapte.",
        cabin_guests_title: "Număr de oaspeți în cabană",
        personal_information_title: "Informații personale"
    },
    en: {
        main_title: "Grădina Sânzienelor - Local Gastronomic Point",
        label_name: "Full name",
        label_email: "Email address",
        label_phone: "Phone",
        label_meal_date: "Reservation date",
        label_check_in_date: "Check-in date (start)",
        label_check_out_date: "Check-out date (end)",
        label_arrival_time: "Arrival time",
        label_number_of_persons: "Number of people",
        label_menu: "I also want the gastronomic menu",
        label_adults: "Adults",
        label_pets: "Pets",
        label_rooms_needed: "Rooms needed",
        btn_send: "Submit reservation",
        continue_button: "Continue to personal information",
        btn_submit: "Submit",
        btn_resume: "Resume booking",
        btn_today: "Today",
        btn_tomorrow: "Tomorrow",
        alert_success: "Reservation submitted successfully!",
        meal_section_subtitle: "Select a date from the calendar to make your meal reservation.",
        cabin_section_subtitle: "Select the period you want to stay in the cabin.",
        cabin_warning: "<strong>Attention:</strong> During this period the cabin hosts <strong>{guests} guests</strong>. Common areas are shared. <br>There are only <strong>{spaces} spaces left</strong>.",
        notification_today_disabled: "If you want to book for today please call us at: \n+40 748 792 686 or \n+40 740 884 472.\nAfter completing the booking, we will contact you to confirm the details and provide additional information.\nFor special events and more complex menus, please call us.",
        confirmation_pending: "Your request has been submitted for approval. An administrator will contact you to confirm the details.",
        warning_pending_reservation: "Note: There is a pending reservation for this period.",
        step_travel_info: "Travel information",
        step_personal_info: "Personal information",
        step_progress_1of2: "Step 1 of 2",
        step_progress_2of2: "Step 2 of 2",
        step_extras: "Extras",
        step_your_details: "Your details",
        step_confirmation: "Confirmation",
        label_arrival: "Arrival",
        label_departure: "Departure",
        label_nights: "Nights",
        label_night: "Night",
        label_rooms: "No. of rooms",
        label_hottub: "Hot tub",
        label_meal_plan: "Gastronomic meal plan",
        label_first_name: "First name",
        label_last_name: "Last name",
        label_phone_prefix: "Country code",
        newsletter_label: "I would like to receive news and event details by email",
        newsletter_tooltip: "In the future, I would like to receive newsletters with current information and event details by email. This consent can be withdrawn at any time.",
        terms_note: "By confirming the booking you agree to the",
        terms_link: "Terms and conditions",
        privacy_link: "Privacy policy",
        btn_send_booking: "Send booking for confirmation",
        btn_new_booking: "Make another booking",
        confirmation_title: "Booking request received!",
        confirmation_message: "Thank you for choosing Grădina Sânzienelor. Our host will review your request and contact you as soon as possible to confirm your reservation details.",
        summary_title: "Your booking",
        summary_arrival: "Arrival",
        summary_departure: "Departure",
        summary_nights: "Nights",
        summary_rooms: "Rooms",
        summary_adults: "Adults",
        summary_extras: "Extras",
        hottub_description: "Relax under the stars in our private outdoor hot tub. Available year-round, the hot tub accommodates up to 6 guests and is included for your entire stay.",
        meal_description: "Start each morning with a hearty homemade breakfast featuring local seasonal produce. Enjoy three-course dinners crafted by our kitchen. Priced per person per night.",
        accommodation_title: "Accommodation reservations",
        meal_title: "Meal reservations",
        nav_home: "Home",
        nav_gastronomic_point: "What is a Local Gastronomic Point?",
        nav_contact: "Contact",
        nav_meal: "Meal reservations",
        nav_cabin: "Accommodation reservations",
        punct_gastronomic_title: "What is a Local Gastronomic Point?",
        contact_title: "Contact",
        legal_note: "By confirming the booking you agree to the {/terms} and {/privacy}.",
        terms_and_conditions: "Terms and conditions",
        privacy_policy: "Privacy policy",
        back_to_travel_info: "Back to travel information",
        send_booking_button: "Send booking for confirmation",
        booking_summary: "Booking summary",
        confirmation_label: "Confirmation",
        confirmation_message: "Your booking has been submitted.",
        booking_request_submitted: "Booking Request Submitted",
        confirmation_message_details: "Thank you for your booking request. Our host will personally review your details and contact you as soon as possible to confirm your reservation. We look forward to welcoming you to Grădina Sânzienelor!",
        confirmation_sub_message: "Please check your email for a summary of your request.",
        make_another_booking: "Make another booking",
        extras_title: "Extra services",
        extras_subtitle: "Select the additional services you would like to add to your reservation.",
        extras_hottub: "Private hot tub",
        extras_meal_plan: "Gastronomic meal plan",
        extras_hottub_description: "Relax under the stars in our private outdoor hot tub. Available year-round, the hot tub accommodates up to 6 guests and is included for your entire stay.",
        extras_meal_plan_description: "Start each morning with a hearty homemade breakfast featuring local seasonal produce. Enjoy three-course dinners crafted by our kitchen. Priced per person per night.",
        terms_and_conditions: "Terms and conditions",
        privacy_policy: "Privacy policy",
        newsletter_agree: "I agree to receive information",
        extras_cabin: "Cabin",
        extras_cabin_description: "Enjoy a cozy stay in our cabin, surrounded by nature. The cabin is equipped with modern amenities and provides a comfortable retreat for your getaway.",
        terms_title: "Terms and conditions",
        privacy_title: "Privacy policy",
        meal_arrival_label: "Arrival",
        placeholder_select_date: "Select arrival date",
        placeholder_select_time: "Select arrival time",
        placeholder_pets: "e.g. 1 dog",
        continue_to_extras: "Continue to extra services",
        continue_to_personal_info: "Continue to personal information",
        back_to_extras: "Back to extra services",
        cabin_title: "Cabin accommodation",
        cabin_description: "Unwind in our private cabin overlooking the forest. Perfect for romantic evenings or after a day of exploring the mountains. Available throughout your entire stay.",
        first_name_placeholder: "Enter your first name",
        last_name_placeholder: "Enter your last name",
        email_placeholder: "Enter your email address",
        phone_placeholder: "Enter your phone number",
        first_name_label: "First name",
        last_name_label: "Last name",
        email_address_label: "Email address",
        telephone_label: "Phone number",
        meal_extras_title: "Meal extra services",
        summary_time: "Arrival time",
        yes: "Yes",
        no: "No",
        cabin_extras_title: "Cabin extra services",
        extra_hot_tub: "Private hot tub",
        extra_meal_plan: "Gastronomic meal plan",
        extra_hot_tub_description: "Relax under the stars in our private outdoor hot tub. Available year-round, the hot tub accommodates up to 6 guests and is included for your entire stay.",
        cabin_dates_title: "Cabin dates",
        cabin_guests_title: "Number of guests in cabin",
        personal_information_title: "Personal information",
        extra_meal_plan_description: "Start each morning with a hearty homemade breakfast featuring local seasonal produce. Enjoy three-course dinners crafted by our kitchen. Priced per person per night."
    }
}

// --- 1. TRANSLATIONS ---
let currentLanguage = localStorage.getItem('limba_preferata') || 'ro';

export function applyTranslations() {
    if (typeof translations === 'undefined') return;
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.innerText = translations[currentLanguage][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.setAttribute('placeholder', translations[currentLanguage][key]);
        }
    });
}

export function changeLanguage(newLanguage) {
    currentLanguage = newLanguage;
    APP_GLOBALS.currentLanguage = newLanguage;
    localStorage.setItem('limba_preferata', newLanguage);
    applyTranslations();
    formatLegalLinks();
    updateExtrasToggleTexts();

    // Recreate visible calendars with new locale
    const mealContainer = document.getElementById('mealSection');
    const cabinContainer = document.getElementById('cabinSection');
    const calendarMealInstance = WIZARD_STATE.calendarMealInstance;
    const cabinArrivalFP = WIZARD_STATE.cabinArrivalFP;
    const cabinDepartureFP = WIZARD_STATE.cabinDepartureFP;

    if (mealContainer && mealContainer.style.display !== 'none' && calendarMealInstance) {
        calendarMealInstance.destroy();
        calendarMealInstance = null;
        showSection('mealSection');
    }
    if (cabinContainer && cabinContainer.style.display !== 'none' && cabinArrivalFP) {
        cabinArrivalFP.destroy();
        cabinDepartureFP?.destroy();
        cabinArrivalFP = null;
        cabinDepartureFP = null;
        showSection('cabinSection');
    }

    // // Refresh price displays with new language
    // if (document.getElementById('pretMancareAfisajStep1')?.innerText.includes('RON')) {
    //     calculeazaPretMancare();
    // }
    // if (document.getElementById('summaryContent')?.innerText.includes('RON')) {
    //     updateCabinSummary();
    // }
}

export function formatLegalLinks() {
    const noteElement = document.querySelector('.legal-note');
    if (!noteElement) return;

    let currentText = noteElement.textContent;
    const termsHtml = `<a href="/terms" target="_blank" class="legal-link" id="termsLink" data-i18n="terms_and_conditions">${translations[currentLanguage].terms_and_conditions}</a>`;
    const privacyHtml = `<a href="/privacy" target="_blank" class="legal-link" id="privacyLink" data-i18n="privacy_policy">${translations[currentLanguage].privacy_policy}</a>`;

    currentText = currentText.replace('{/terms}', termsHtml).replace('{/privacy}', privacyHtml);
    noteElement.innerHTML = currentText;
}

export function updateExtrasToggleTexts() {
    const lang = currentLanguage || 'ro';

    const hotTubToggle = document.getElementById('hotTubToggle');
    if (hotTubToggle) {
        const isAdded = WIZARD_STATE.cabinExtras.hotTub || false;
        hotTubToggle.textContent = isAdded ? (lang === 'ro' ? '- Elimină Ciubăr' : '- Remove Hot Tub') : (lang === 'ro' ? '+ Adaugă Ciubăr' : '+ Add Hot Tub');
    }

    const mealToggle = document.getElementById('mealToggle');
    if (mealToggle) {
        const isAdded = WIZARD_STATE.cabinExtras.meal || false;
        mealToggle.textContent = isAdded ? (lang === 'ro' ? '- Elimină Meniu' : '- Remove Meal') : (lang === 'ro' ? '+ Adaugă Meniu' : '+ Add Meal');
    }

    const cabinToggle = document.getElementById('cabinToggle');
    if (cabinToggle) {
        const isAdded = WIZARD_STATE.mealExtras.cabin || false;
        cabinToggle.textContent = isAdded ? (lang === 'ro' ? '- Elimină Cabană' : '- Remove Cabin') : (lang === 'ro' ? '+ Adaugă Cabană' : '+ Add Cabin');
    }
}

