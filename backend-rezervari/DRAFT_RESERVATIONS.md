# Draft Reservation System Documentation

## Overview

The draft reservation system allows users to save their multi-step reservation forms before finalizing. Drafts are automatically stored in the database and can be retrieved by email and phone. Each draft expires after 24 hours.

## Database Schema

### `reservation_drafts` Table

```sql
CREATE TABLE reservation_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_type TEXT NOT NULL,           -- 'mancare' or 'cabana'
  email TEXT NOT NULL,                       -- User email
  phone TEXT NOT NULL,                       -- User phone
  current_step INTEGER NOT NULL DEFAULT 1,  -- 1 or 2
  form_data TEXT NOT NULL,                  -- JSON blob with all form data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL             -- 24 hours from creation
);
```

## API Endpoints

### 1. Save/Update Draft
**POST** `/api/reservations/draft`

Save or update a draft reservation.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+40712345678",
  "reservation_type": "cabana",  // 'mancare' or 'cabana'
  "current_step": 1,              // 1 or 2
  "step_data": {                  // Any data from the current step
    "nume": "John Doe",
    "adults": 2,
    "infants": 1,
    "pets": 0,
    "data_inceput": "2024-07-15",
    "data_sfarsit": "2024-07-20"
  }
}
```

**Response (201 - New):**
```json
{
  "success": true,
  "draft_id": 42,
  "message": "Draft created successfully."
}
```

**Response (200 - Updated):**
```json
{
  "success": true,
  "draft_id": 42,
  "message": "Draft updated successfully."
}
```

### 2. Retrieve Draft
**GET** `/api/reservations/draft?email=user@example.com&phone=%2B40712345678&reservation_type=cabana`

Fetch an active (non-expired) draft for a user.

**Response (Found):**
```json
{
  "found": true,
  "draft": {
    "id": 42,
    "current_step": 1,
    "form_data": {
      "nume": "John Doe",
      "adults": 2,
      "infants": 1,
      "pets": 0
    },
    "created_at": "2024-06-27T10:30:00Z",
    "updated_at": "2024-06-27T10:35:00Z"
  }
}
```

**Response (Not Found):**
```json
{
  "found": false
}
```

### 3. Delete Draft (Admin)
**DELETE** `/api/reservations/draft/:id`

Admin action to delete a specific draft.

**Response:**
```json
{
  "success": true,
  "message": "Draft deleted successfully."
}
```

### 4. Send Reminder Email (Admin)
**POST** `/api/reservations/draft/:id/send-reminder`

Send a reminder email to the user with a link to resume their draft.

**Response:**
```json
{
  "success": true,
  "message": "Reminder email sent successfully."
}
```

**Email Content:**
```
Salut [Name],

Observă că ai o rezervare nefinalizată pentru [Type], înregistrată pe [Date].

Poți continua să completezi formularul accesând următorul link:
[Resume Link]

Datele tale vor fi șterse în 24 de ore din momentul înregistrării.

Dacă ai întrebări, ne poți contacta.

Cu plăcere,
Echipa Diana
```

### 5. Mark Draft as Completed (Admin)
**POST** `/api/reservations/draft/:id/mark-completed`

Admin action to mark a draft as completed and remove it from the system.

**Response:**
```json
{
  "success": true,
  "message": "Draft marked as completed and removed."
}
```

### 6. Fetch All Active Drafts (Admin)
**GET** `/api/admin/drafts`

Retrieve all non-expired drafts for the admin panel.

**Response:**
```json
[
  {
    "id": 42,
    "reservation_type": "cabana",
    "email": "user@example.com",
    "phone": "+40712345678",
    "current_step": 1,
    "created_at": "2024-06-27T10:30:00Z",
    "updated_at": "2024-06-27T10:35:00Z"
  },
  {
    "id": 43,
    "reservation_type": "mancare",
    "email": "user2@example.com",
    "phone": "+40712345679",
    "current_step": 2,
    "created_at": "2024-06-27T09:00:00Z",
    "updated_at": "2024-06-27T10:00:00Z"
  }
]
```

## Client-Side Integration

### Saving a Draft (Frontend Example)

```javascript
async function saveDraft(formData, step) {
  const response = await fetch('/api/reservations/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.email,
      phone: formData.phone,
      reservation_type: 'cabana', // or 'mancare'
      current_step: step,
      step_data: {
        nume: formData.nume,
        adults: formData.adults,
        infants: formData.infants,
        pets: formData.pets,
        // ... other fields specific to the step
      }
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log('Draft saved with ID:', result.draft_id);
  }
}
```

### Retrieving a Draft (Frontend Example)

```javascript
async function retrieveDraft(email, phone, reservationType) {
  const params = new URLSearchParams({
    email,
    phone,
    reservation_type: reservationType
  });

  const response = await fetch(`/api/reservations/draft?${params}`);
  const result = await response.json();

  if (result.found) {
    // Pre-fill form with draft data
    const draft = result.draft;
    fillFormWithData(draft.form_data);
    currentStep = draft.current_step;
  }
}
```

### Resume Draft from Email Link

Users receive an email with a link like:
```
http://yoursite.com?resume_draft=42&email=user@example.com&phone=%2B40712345678
```

Frontend JavaScript should:
1. Parse the URL parameters
2. Call `retrieveDraft()` with the email and phone
3. Pre-fill the form from the draft data
4. Continue from `current_step`

## Admin Panel Features

The admin panel (`public/admin.html`) includes:

### Draft Reservations Section (Section 0)
Displays all active drafts with columns:
- **Data Cererii**: When the draft was created/updated
- **Nume / Contact**: Email and phone of the user
- **Tip**: Reservation type (Mâncare/Cabană) with draft badge
- **Pas**: Current step (1 or 2)
- **Acțiuni**: Action buttons

**Action Buttons:**
- 📧 **Amintire**: Send reminder email to user
- ✓ **Finalizat**: Mark draft as completed and remove
- ❌ **Șterge**: Delete draft

### Auto-Refresh
The admin panel automatically refreshes all sections every 30 seconds.

## Cleanup Job

A scheduled task runs **every hour** to delete expired drafts:
```javascript
setInterval(() => {
    db.run(
        `DELETE FROM reservation_drafts WHERE expires_at <= CURRENT_TIMESTAMP`,
        function(err) {
            if (err) {
                console.error('Error cleaning up expired drafts:', err);
            } else if (this.changes > 0) {
                console.log(`Cleaned up ${this.changes} expired draft(s).`);
            }
        }
    );
}, 60 * 60 * 1000); // Every hour
```

## Email Configuration

Draft reminder emails use the existing nodemailer configuration:
- **From**: `process.env.EMAIL_USER` (configured in `.env`)
- **To**: User's email from the draft
- **Subject**: `Reluare rezervare - [Mâncare|Cabană]`

## Validation Rules

All endpoints perform the following validations:

1. **Email**: Valid email format required
2. **Phone**: Valid phone format required (at least 6 characters with digits)
3. **Reservation Type**: Must be 'mancare' or 'cabana'
4. **Current Step**: Must be 1 or 2
5. **Form Data**: Must be a valid JSON object

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid email."
}
```

### 404 Not Found
```json
{
  "error": "Reservation not found."
}
```

### 500 Internal Server Error
```json
{
  "error": "Error saving reservation."
}
```

## Database Migration

The `reservation_drafts` table is created automatically on server start via:
```javascript
db.run(`CREATE TABLE IF NOT EXISTS reservation_drafts (...)`);
```

Existing databases will automatically have the table added when the server starts.

## Security Considerations

1. **No Authentication**: Draft endpoints don't require authentication. They use email+phone as identifiers.
   - Recommendation: Add authentication if sensitive data is stored.
   
2. **CORS**: Enabled via `app.use(cors())`
   - Recommendation: Restrict origins if needed.

3. **Input Validation**: All inputs are validated and sanitized.

4. **Email Links**: Resume links contain `email` and `phone` parameters for verification.
   - Recommendation: Consider using token-based resume links for better security.

5. **Data Expiration**: Drafts auto-expire after 24 hours.
   - User data is not persisted long-term.

## Performance Notes

- Drafts are queried by email+phone+type, which should be indexed for better performance:
  ```sql
  CREATE INDEX idx_draft_lookup ON reservation_drafts(email, phone, reservation_type);
  ```

- Cleanup job deletes expired records hourly, preventing table bloat.

- Admin panel displays only non-expired drafts.

## Troubleshooting

### Draft Not Found After Saving
- Verify email and phone match exactly
- Check draft hasn't expired (24 hours from creation)
- Check database connectivity

### Reminder Email Not Sent
- Verify `.env` has valid `EMAIL_USER` and `EMAIL_PASS`
- Check Gmail app passwords are configured
- Review server logs for email errors

### Admin Panel Not Showing Drafts
- Refresh the page (or wait 30 seconds for auto-refresh)
- Check browser console for JavaScript errors
- Verify `/api/admin/drafts` endpoint is working

## Future Enhancements

1. **Token-based Resume Links**: Use secure tokens instead of email/phone in URLs
2. **Database Indexing**: Add indices for faster lookups
3. **Draft Versioning**: Keep multiple versions of drafts
4. **Analytics**: Track draft completion rates
5. **SMS Reminders**: Supplement email with SMS notifications
6. **Draft Autosave**: Frontend auto-save every N seconds
7. **Draft Recovery**: Retrieve older draft versions
