# EpiApp — Epilepsy Tracker

A calendar-based app for logging seizures, triggers, and medications. Built with **Angular 17 + Angular Material** (frontend) and **Spring Boot 3 + H2** (backend).

---

## Project Structure

```
EpiApp/
├── backend/      Spring Boot REST API
└── frontend/     Angular SPA
```

---

## Getting Started

### Backend

**Requirements:** Java 17+, Maven

```bash
cd backend
mvn spring-boot:run
```

Runs on **http://localhost:8080**

> H2 console available at http://localhost:8080/h2-console
> JDBC URL: `jdbc:h2:mem:epiapp` · User: `sa` · Password: *(empty)*
> Data resets on every restart (in-memory).

A test user is created automatically on startup:
- **Username:** `Kenneth123@`
- **Password:** `Kenneth123@`

---

### Frontend

**Requirements:** Node 18+, npm

```bash
cd frontend
npm install
npm start
```

Runs on **http://localhost:4200** — proxies `/api/*` to the backend automatically via `proxy.conf.json`.

---

## API Reference

All endpoints are under `/api`.

### Auth

| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| POST   | `/api/auth/register`   | Register a new user      |
| POST   | `/api/auth/login`      | Login and get userId     |

**Register / Login body:**
```json
{ "username": "Kenneth123@", "password": "Kenneth123@" }
```

**Response:**
```json
{ "userId": 1, "username": "Kenneth123@" }
```

Password rules (enforced on the frontend): min 8 characters, at least 1 number, at least 1 special character. Usernames must be unique (409 Conflict if taken).

---

### Seizures

| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | `/api/seizures`       | List all seizures  |
| POST   | `/api/seizures`       | Create a seizure   |
| DELETE | `/api/seizures/{id}`  | Delete a seizure   |

**POST body:**
```json
{
  "dateTime": "2024-03-01T14:30:00",
  "durationMinutes": 3,
  "type": "TONIC_CLONIC",
  "notes": "Woke up confused"
}
```

---

### Triggers

| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | `/api/triggers`       | List all triggers  |
| POST   | `/api/triggers`       | Create a trigger   |
| DELETE | `/api/triggers/{id}`  | Delete a trigger   |

**POST body:**
```json
{ "date": "2024-03-01", "type": "SLEEP" }
```

For custom triggers use `"type": "OTHER"` and include `"label": "My trigger"`.

---

### Custom Trigger Options

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | `/api/custom-trigger-options`   | List saved custom trigger options  |
| POST   | `/api/custom-trigger-options`   | Save a new custom trigger option   |
| DELETE | `/api/custom-trigger-options/{id}` | Delete a custom trigger option  |

---

### Medications

| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | `/api/medications`        | List all medications |
| POST   | `/api/medications`        | Create a medication  |
| PUT    | `/api/medications/{id}`   | Update a medication  |
| DELETE | `/api/medications/{id}`   | Delete a medication (also removes its logs) |

**POST / PUT body:**
```json
{ "name": "Levetiracetam", "dosage": "500mg", "times": ["08:00", "20:00"] }
```

---

### Medication Logs

| Method | Endpoint                      | Description                         |
|--------|-------------------------------|-------------------------------------|
| GET    | `/api/medication-logs?date=`  | Get logs for a date (`YYYY-MM-DD`)  |
| POST   | `/api/medication-logs`        | Mark a dose as taken                |

**POST body:**
```json
{ "medicationId": 1, "scheduledTime": "08:00", "date": "2024-03-01" }
```

---

### Enums

| Enum          | Values                                                              |
|---------------|---------------------------------------------------------------------|
| `SeizureType` | `TONIC_CLONIC`, `ABSENCE`, `FOCAL`, `MYOCLONIC`, `ATONIC`, `OTHER` |
| `TriggerType` | `CAFFEINE`, `SLEEP`, `MEDICATION`, `OTHER`                          |

---

## Frontend Components

| Component | Role |
|---|---|
| `LoginComponent` | Landing page. Username + password fields with Login and Register buttons. |
| `RegisterComponent` | Registration form with password strength validation. |
| `CalendarComponent` | Month grid view. Shows seizures (red) and triggers (orange) as dots. Two FABs: add event and add medication. |
| `AddEventDialogComponent` | Choose between Seizure or Trigger. |
| `SeizureFormDialogComponent` | Form: date, time, duration, type, notes, and optional trigger checkboxes. |
| `TriggerFormDialogComponent` | Checkbox list (fixed + custom triggers) with date picker. Each checked item is saved as a separate trigger entry. |
| `DayDetailDialogComponent` | Opened by clicking a day. Lists that day's seizures and triggers with delete buttons. |
| `AddMedicationDialogComponent` | Add multiple medications at once via a pending list before saving all. |
| `MedicationOverviewComponent` | Shows today's medications grouped by time slot. "Take all" button per slot. Taken doses shown in green with timestamp. |
| `EditMedicationDialogComponent` | Edit or delete an existing medication. |

**Services:** `SeizureService`, `TriggerService`, `CustomTriggerOptionService`, `MedicationService`, `MedicationLogService`, `AuthService` — all wrap REST endpoints via `HttpClient`.

**Auth guard:** `authGuard` protects the `/calendar` route — redirects to `/login` if not authenticated.

---

## Data Flow

```
App loads → /login (landing page)
  → Login succeeds → /calendar (userId stored in localStorage)
  → Register → /register → on success → /calendar

User clicks "+"
  → AddEventDialog (choose type)
    → SEIZURE → SeizureFormDialog → POST /api/seizures
               (+ optional triggers) → POST /api/triggers per checked box
    → TRIGGER → TriggerFormDialog → POST /api/triggers (one per checkbox)

User clicks a day cell
  → DayDetailDialog → lists seizures + triggers
    → Delete → DELETE /api/seizures/{id} or /api/triggers/{id}

Medication FAB
  → AddMedicationDialog → pending list → forkJoin POST /api/medications
  → MedicationOverview → grouped by time → "Take all" → POST /api/medication-logs
  → Edit button → EditMedicationDialog → PUT or DELETE /api/medications/{id}
```

---

## Auth Readiness

A `User` entity and login/register endpoints are implemented. All other entities include a `userId` field ready for per-user data filtering once session or token-based auth is added to the API layer.
