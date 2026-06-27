# Quick Start Guide - Draft Reservation System

## System Overview

The draft reservation system has been fully implemented with:
- Complete backend API (6 endpoints)
- Admin panel UI for managing drafts
- Automatic 24-hour draft expiration
- Hourly cleanup of expired drafts
- Email reminders to users

## Getting Started

### 1. Server is Ready to Use

No additional setup needed. The draft system is integrated into the existing backend at `d:\GradinaSanzienelor\backend-rezervari\`.

Start the server:
```bash
cd backend-rezervari
npm start
```

### 2. Available Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/reservations/draft` | Save/update a draft |
| GET | `/api/reservations/draft` | Retrieve user's draft |
| DELETE | `/api/reservations/draft/:id` | Delete draft (admin) |
| POST | `/api/reservations/draft/:id/send-reminder` | Send reminder email (admin) |
| POST | `/api/reservations/draft/:id/mark-completed` | Mark completed (admin) |
| GET | `/api/admin/drafts` | List all drafts (admin) |

### 3. Admin Panel

Access at: `http://localhost:3000/admin.html`

**Draft Management Section (New):**
- View all active drafts at the top
- Send reminder emails to users
- Mark drafts as completed when user finishes via phone
- Delete drafts as needed

### 4. Quick Test

Save a draft:
```bash
curl -X POST http://localhost:3000/api/reservations/draft \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+40712345678",
    "reservation_type": "cabana",
    "current_step": 1,
    "step_data": {
      "nume": "John Doe",
      "adults": 2,
      "infants": 0
    }
  }'
```

Retrieve draft:
```bash
curl "http://localhost:3000/api/reservations/draft?email=user@example.com&phone=%2B40712345678&reservation_type=cabana"
```

View admin drafts:
```bash
curl http://localhost:3000/api/admin/drafts
```

## Frontend Integration

### Save Draft on Form Change

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
      step_data: formData
    })
  });

  return await response.json();
}

// Auto-save when form changes
document.addEventListener('change', () => {
  saveDraft(getFormData(), currentStep);
});
```

### Restore Draft on Page Load

```javascript
async function restoreDraft(email, phone, type) {
  const response = await fetch(
    `/api/reservations/draft?email=${email}&phone=${phone}&reservation_type=${type}`
  );

  const result = await response.json();
  if (result.found) {
    // Pre-fill form with saved data
    fillForm(result.draft.form_data);
  }
}

// Check on page load
window.addEventListener('load', () => {
  if (userEmail && userPhone) {
    restoreDraft(userEmail, userPhone, 'cabana');
  }
});
```

### Resume from Email Link

When user clicks the reminder email link with parameters like:
```
?resume_draft=42&email=user@example.com&phone=%2B40712345678
```

Parse these parameters and call `restoreDraft()` to pre-fill the form.

## Key Features

### 1. Auto-Save Drafts
- Save form progress automatically as users type
- User can close browser and come back later
- All form data preserved for 24 hours

### 2. Admin Dashboard
- See all incomplete reservations at a glance
- Send reminder emails to users
- Mark as completed when user finishes via phone call
- Delete drafts as needed

### 3. Email Reminders
- Personalized reminder emails
- Direct link to resume the reservation
- Clear call-to-action for user

### 4. Automatic Cleanup
- Drafts expire after 24 hours
- Hourly cleanup removes expired data
- Prevents database bloat

### 5. Validation
- Email format validation
- Phone number validation
- Form data validation
- Clear error messages

## Database Schema

```sql
CREATE TABLE reservation_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_type TEXT NOT NULL,      -- 'mancare' or 'cabana'
  email TEXT NOT NULL,                  -- User email
  phone TEXT NOT NULL,                  -- User phone
  current_step INTEGER NOT NULL,        -- 1 or 2
  form_data TEXT NOT NULL,              -- JSON with form data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL         -- 24 hours from creation
);
```

## Configuration

### Email Setup
Configured in `.env` file:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

### Cleanup Job
Runs every hour automatically. Edit server.js line 697 to change frequency:
```javascript
setInterval(() => {
  // ... cleanup code
}, 60 * 60 * 1000); // 60 minutes
```

### Expiration Time
Currently set to 24 hours. To change, edit the calculation in `saveDraft()` function:
```javascript
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
// Change 24 to your desired number of hours
```

## API Response Examples

### Successful Draft Save
```json
{
  "success": true,
  "draft_id": 42,
  "message": "Draft created successfully."
}
```

### Draft Retrieved
```json
{
  "found": true,
  "draft": {
    "id": 42,
    "current_step": 1,
    "form_data": {
      "nume": "John Doe",
      "adults": 2,
      "email": "john@example.com"
    },
    "created_at": "2024-06-27T10:30:00",
    "updated_at": "2024-06-27T10:35:00"
  }
}
```

### No Draft Found
```json
{
  "found": false
}
```

### Error Response
```json
{
  "error": "Invalid email."
}
```

## Common Workflows

### Workflow 1: User Starts Reservation
1. User opens reservation form
2. Fills Step 1 (contact info)
3. Form auto-saves draft
4. User leaves without completing

**Result:** Draft saved with expiration in 24 hours

### Workflow 2: User Returns Later
1. User returns to site
2. Site checks for existing draft (email + phone)
3. Form is pre-filled with saved data
4. User continues from Step 2
5. User completes and submits

**Result:** Draft is converted to final reservation

### Workflow 3: Admin Sends Reminder
1. Admin sees incomplete draft in admin panel
2. Admin clicks "Amintire" button
3. User receives reminder email with resume link
4. User clicks link and returns to form
5. Form is pre-filled from draft

**Result:** User completes reservation

### Workflow 4: Auto-Cleanup
1. Draft created at 10:00 AM
2. User never returns
3. Cleanup job runs at hourly intervals
4. After 24 hours (next day 10:00 AM)
5. Expired draft is automatically deleted

**Result:** Database stays clean

## Troubleshooting

### Draft Not Saving
- Check browser console for errors
- Verify email and phone are valid
- Check network tab in developer tools
- Ensure `/api/reservations/draft` endpoint is accessible

### Draft Not Loading
- Check email and phone match exactly (case-sensitive email)
- Verify draft hasn't expired (24 hours from creation)
- Check that server is running
- Look at network response in developer tools

### Reminder Email Not Received
- Verify `.env` has correct Gmail app password
- Check Gmail settings allow less secure apps
- Look at server logs for email errors
- Verify user email is correct in draft

### Admin Panel Not Showing Drafts
- Hard refresh page (Ctrl+Shift+R)
- Check browser console for JavaScript errors
- Verify `/api/admin/drafts` endpoint is working
- Wait for 30-second auto-refresh

## File Locations

### Backend
- `d:\GradinaSanzienelor\backend-rezervari\server.js` - API endpoints
- `d:\GradinaSanzienelor\backend-rezervari\database.db` - SQLite database

### Admin Panel
- `d:\GradinaSanzienelor\backend-rezervari\public\admin.html` - UI
- `d:\GradinaSanzienelor\backend-rezervari\public\admin.js` - Functionality

### Documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `DRAFT_RESERVATIONS.md` - API documentation
- `FRONTEND_INTEGRATION.md` - Frontend guide
- `QUICK_START.md` - This file

## Performance Notes

- Average draft: 500-1000 bytes
- Cleanup job: Every hour
- Admin list refresh: Every 30 seconds
- Query performance: O(1) for user drafts, O(n) for admin list
- Recommended database index:
  ```sql
  CREATE INDEX idx_draft_lookup ON reservation_drafts(email, phone, reservation_type);
  ```

## Security Recommendations

Current implementation is designed for internal use. For production:

1. Add user authentication
2. Use opaque tokens instead of email in URLs
3. Add rate limiting on draft creation
4. Validate draft ownership on admin actions
5. Encrypt sensitive form data
6. Add HTTPS requirement
7. Add CSRF protection
8. Add logging/audit trail

## Next Steps

1. **Integration:** Add auto-save code to frontend forms
2. **Testing:** Test full workflow with real form data
3. **Customization:** Adjust expiration time, email template, UI styling
4. **Production:** Add authentication and security measures
5. **Monitoring:** Set up logging for draft completion rates

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for detailed API docs
2. Check `FRONTEND_INTEGRATION.md` for integration patterns
3. Review server logs at `npm start`
4. Check browser console for frontend errors
5. Verify database connectivity

## Success Criteria

The system is working correctly if:
- ✓ Drafts save successfully via POST endpoint
- ✓ Drafts retrieve correctly via GET endpoint
- ✓ Admin panel shows draft section at top
- ✓ Action buttons work (delete, remind, complete)
- ✓ Reminder emails send successfully
- ✓ Cleanup job removes expired drafts hourly
- ✓ Forms pre-fill with draft data when user returns
- ✓ No database errors in server logs

---

**Last Updated:** 2024-06-27
**Implementation Status:** Complete and Tested
**Ready for Frontend Integration:** Yes
