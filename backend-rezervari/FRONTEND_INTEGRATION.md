# Frontend Integration Guide - Draft Reservations

This guide helps frontend developers integrate draft saving into reservation forms.

## Quick Start

### 1. Auto-Save Draft on Form Input

Add this to your form pages (e.g., step 1 of the reservation form):

```javascript
// Get form data helper
function getFormData() {
  return {
    nume: document.getElementById('nume').value,
    email: document.getElementById('email').value,
    telefon: document.getElementById('telefon').value,
    adults: document.getElementById('adults').value,
    infants: document.getElementById('infants').value,
    pets: document.getElementById('pets').value,
    // Add other fields as needed
  };
}

// Save draft helper
async function saveDraftAuto(step) {
  const form = getFormData();

  try {
    const response = await fetch('/api/reservations/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        phone: form.telefon,
        reservation_type: 'cabana', // or 'mancare'
        current_step: step,
        step_data: form
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('Draft auto-saved (ID: ' + result.draft_id + ')');
    }
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

// Auto-save on input change (debounced)
let autoSaveTimeout;
document.addEventListener('change', () => {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => saveDraftAuto(1), 1000);
});
```

### 2. Retrieve and Restore Draft

Add this when the form page loads:

```javascript
async function restoreDraftIfExists(email, phone, reservationType) {
  try {
    const params = new URLSearchParams({
      email,
      phone,
      reservation_type: reservationType
    });

    const response = await fetch(`/api/reservations/draft?${params}`);
    const result = await response.json();

    if (result.found) {
      const draft = result.draft;
      // Pre-fill form fields
      document.getElementById('nume').value = draft.form_data.nume || '';
      document.getElementById('email').value = draft.form_data.email || '';
      document.getElementById('telefon').value = draft.form_data.telefon || '';
      document.getElementById('adults').value = draft.form_data.adults || 1;
      document.getElementById('infants').value = draft.form_data.infants || 0;
      document.getElementById('pets').value = draft.form_data.pets || 0;
      // ... restore other fields

      // Show notification
      showNotification(`Forma a fost pre-umplută cu datele din ciorna (pasul ${draft.current_step})`);
    }
  } catch (error) {
    console.error('Failed to restore draft:', error);
  }
}

// Call on page load
window.addEventListener('load', () => {
  const email = localStorage.getItem('email'); // or from other source
  const phone = localStorage.getItem('phone');
  if (email && phone) {
    restoreDraftIfExists(email, phone, 'cabana');
  }
});
```

### 3. Resume Draft from Email Link

Add this logic to your landing/entry page:

```javascript
function handleResumeFromEmail() {
  const params = new URLSearchParams(window.location.search);
  const resumeDraftId = params.get('resume_draft');
  const email = params.get('email');
  const phone = params.get('phone');

  if (resumeDraftId && email && phone) {
    // Store for later use
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('phone', phone);

    // Navigate to the appropriate form page
    const reservationType = params.get('type') || 'cabana'; // or detect from elsewhere
    window.location.href = `/reserve-${reservationType}.html`;
  }
}

handleResumeFromEmail();
```

## API Reference for Frontend

### Save Draft

```javascript
const response = await fetch('/api/reservations/draft', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    phone: '+40712345678',
    reservation_type: 'cabana',  // or 'mancare'
    current_step: 1,
    step_data: {
      // Any form fields from current step
      nume: 'John Doe',
      adults: 2,
      // ... other fields
    }
  })
});

const result = await response.json();
if (result.success) {
  console.log('Draft ID:', result.draft_id);
}
```

### Retrieve Draft

```javascript
const params = new URLSearchParams({
  email: 'user@example.com',
  phone: '+40712345678',
  reservation_type: 'cabana'
});

const response = await fetch(`/api/reservations/draft?${params}`);
const result = await response.json();

if (result.found) {
  console.log('Current step:', result.draft.current_step);
  console.log('Form data:', result.draft.form_data);
}
```

## User Experience Patterns

### Pattern 1: Auto-Save on Every Change
```javascript
// Save draft 1 second after user stops typing
document.addEventListener('input', debounce(() => saveDraftAuto(currentStep), 1000));
```

### Pattern 2: Manual Save Button
```javascript
document.getElementById('save-draft-btn').addEventListener('click', async () => {
  await saveDraftAuto(currentStep);
  showNotification('Formularul a fost salvat!');
});
```

### Pattern 3: Save Before Navigation
```javascript
window.addEventListener('beforeunload', () => {
  saveDraftAuto(currentStep); // Note: Can't use await here
});
```

### Pattern 4: Save on Step Transition
```javascript
document.getElementById('next-step-btn').addEventListener('click', async () => {
  await saveDraftAuto(1); // Save current step
  // Then navigate to step 2
  showStep(2);
});
```

## Best Practices

### 1. User Feedback
```javascript
// Show user that draft is being saved
function showSavingIndicator() {
  const indicator = document.getElementById('saving-indicator');
  indicator.style.display = 'block';
}

function hideSavingIndicator() {
  const indicator = document.getElementById('saving-indicator');
  indicator.style.display = 'none';
}

// Use with fetch
async function saveDraftWithFeedback(step) {
  showSavingIndicator();
  await saveDraftAuto(step);
  hideSavingIndicator();
}
```

### 2. Error Handling
```javascript
async function saveDraftSafely(step) {
  try {
    const response = await fetch('/api/reservations/draft', {
      // ... request body
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Save failed:', error.error);
      showNotification('Eroare la salvarea ciornei', 'error');
      return false;
    }

    const result = await response.json();
    showNotification('Ciorna a fost salvată', 'success');
    return true;
  } catch (error) {
    console.error('Network error:', error);
    showNotification('Eroare de conexiune', 'error');
    return false;
  }
}
```

### 3. Debouncing Auto-Save
```javascript
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

const debouncedSave = debounce(() => saveDraftAuto(1), 2000);
document.addEventListener('change', debouncedSave);
```

### 4. Track Unsaved Changes
```javascript
let hasUnsavedChanges = false;

document.addEventListener('change', () => {
  hasUnsavedChanges = true;
  saveDraftAuto(currentStep);
});

window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = 'Ai modificări nesalvate. Sigur vrei să pleci?';
  }
});
```

## HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Rezervare Cabană - Pasul 1</title>
</head>
<body>
  <h1>Informații Contact</h1>

  <form id="step1-form">
    <div>
      <label>Nume Complet:</label>
      <input type="text" id="nume" placeholder="Nume Complet" required>
    </div>

    <div>
      <label>Email:</label>
      <input type="email" id="email" placeholder="user@example.com" required>
    </div>

    <div>
      <label>Telefon:</label>
      <input type="tel" id="telefon" placeholder="+40712345678" required>
    </div>

    <div>
      <label>Adulți:</label>
      <input type="number" id="adults" value="1" min="1" required>
    </div>

    <div>
      <label>Copii:</label>
      <input type="number" id="infants" value="0" min="0">
    </div>

    <div>
      <label>Animale:</label>
      <input type="number" id="pets" value="0" min="0">
    </div>

    <button type="button" id="next-btn">Pasul Următor →</button>
  </form>

  <div id="saving-indicator" style="display:none; color:#888;">
    Se salvează...
  </div>

  <div id="notification" style="display:none; padding:10px; margin:10px 0;"></div>

  <script src="reservation-utils.js"></script>
  <script>
    // Initialize form restoration
    window.addEventListener('load', () => {
      const email = sessionStorage.getItem('email') || '';
      const phone = sessionStorage.getItem('phone') || '';
      if (email && phone) {
        restoreDraftIfExists(email, phone, 'cabana');
      }
    });

    // Auto-save on change
    const form = document.getElementById('step1-form');
    form.addEventListener('change', debounce(() => {
      saveDraftWithFeedback(1);
    }, 2000));

    // Next button saves and moves to step 2
    document.getElementById('next-btn').addEventListener('click', async () => {
      if (await saveDraftSafely(1)) {
        window.location.href = '/reserve-cabana-step2.html';
      }
    });

    function showNotification(msg, type = 'info') {
      const notif = document.getElementById('notification');
      notif.textContent = msg;
      notif.style.backgroundColor = type === 'error' ? '#fee' : '#efe';
      notif.style.display = 'block';
      setTimeout(() => notif.style.display = 'none', 3000);
    }
  </script>
</body>
</html>
```

## Testing the Draft System

### Test Save
```bash
curl -X POST http://localhost:3000/api/reservations/draft \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+40712345678",
    "reservation_type": "cabana",
    "current_step": 1,
    "step_data": {
      "nume": "Test User",
      "adults": 2,
      "infants": 0
    }
  }'
```

### Test Retrieve
```bash
curl "http://localhost:3000/api/reservations/draft?email=test@example.com&phone=%2B40712345678&reservation_type=cabana"
```

### Test Admin Drafts
```bash
curl http://localhost:3000/api/admin/drafts
```
