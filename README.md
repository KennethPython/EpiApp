# EpilAppsy — Epilepsy Tracker

A calendar-based app for logging seizures, triggers, and medications. Built with **Angular 17 + Angular Material** (frontend) and **Spring Boot 3** (backend).

> **This project is primarily built to be used as a native Android app.** The web version (Netlify) exists as a fallback, but the full feature set — including push notifications, native file export, and mobile-optimised navigation — is only available in the Android app.

**Live frontend (web):** https://epilappsy.netlify.app/
**Live backend:** https://epiapp-production.up.railway.app

---

## Stack

| Layer | Technology |
|---|---|
| Android app | Angular 17 + Capacitor |
| Web frontend | Angular 17, Angular Material |
| Backend | Spring Boot 3, Spring Security, Spring Data JPA |
| Database (local) | H2 (in-memory) |
| Database (production) | PostgreSQL |
| Containerisation | Docker (multi-stage build) |
| Frontend hosting | Netlify |
| Backend hosting | Railway |

---

## Project Structure

```
EpiApp/
├── backend/           Spring Boot REST API
│   └── Dockerfile
├── frontend/          Angular SPA (web, Netlify)
├── frontend-android/  Angular + Capacitor (Android app)
├── netlify.toml
└── railway.toml
```

---

## Android App

The Android app (`frontend-android/`) is a Capacitor wrapper around the Angular frontend, built specifically for mobile use. It connects to the same backend as the web version.

### What the Android app can do

- **Calendar view** — month and year overview of seizures, triggers, and medication doses
- **Log a seizure** — date, time, duration, type, notes, and optional linked triggers
- **Log triggers** — checkbox list with built-in and custom trigger options
- **Medication tracking** — add medications with name, dosage, and daily time slots; mark doses as taken per time slot
- **Push notifications** — daily reminders at each medication time slot with inline action buttons: *Take now* (marks all meds for that slot as taken without opening the app) and *Cancel*
- **Bottom navigation bar** — home button, central + FAB with speed dial (add seizure/trigger or medication), settings button
- **Color schemes** — three selectable themes in the settings panel: *Dark* (purple), *Clinical Blue*, and *Soft* (sage green); chosen theme persists across sessions
- **Custom event colors** — editable color coding for seizures, triggers, and medication dots
- **Data export** — month picker to select which months to export; exports as `.csv` with seizures, triggers, and medication logs; *Export all* exports from the first recorded data point to today; uses the native Android share sheet so the file can be saved, emailed, or sent directly
- **Persistent login** — JWT token is valid for 3 months; the user does not need to log in again after closing the app; logout button available in the settings panel
- **Android back button** — navigates back through the app; exits only from the root screen
- **Full-screen layout** — calendar fills the screen edge to edge on mobile

### Build and run on a physical device

**Requirements:** Node 18+, Android Studio, a physical Android 14+ device with USB debugging enabled

```bash
cd frontend-android
npm install
npm run build -- --configuration production
npx cap sync android
```

Then open `frontend-android/android/` in Android Studio and press **Run (▶)** with your device connected via USB.

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

## Deployment

### Frontend — Netlify

Configured via `netlify.toml` at the repo root:
- **Base directory:** `frontend/`
- **Build command:** `ng build --configuration production`
- **Publish directory:** `dist/epiapp-frontend/browser`

The `_redirects` file (`frontend/src/_redirects`) ensures all routes are served through `index.html` for Angular's client-side router.

### Backend — Railway

Configured via `railway.toml` at the repo root. Railway builds the Docker image using `backend/Dockerfile`, which uses a multi-stage build:
1. Compiles and packages the JAR inside the container using Maven
2. Copies the JAR into a lean runtime image

Set the following environment variables in Railway:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL (auto-set by Railway PostgreSQL plugin) |
| `PGUSER` | Database username (auto-set by Railway PostgreSQL plugin) |
| `PGPASSWORD` | Database password (auto-set by Railway PostgreSQL plugin) |
| `SPRING_PROFILES_ACTIVE` | Set to `prod` to activate the PostgreSQL profile |

### Frontend ↔ Backend Communication

In production, all `/api/*` requests from the Netlify frontend are routed to the Railway backend via an HTTP interceptor (`api-base.interceptor.ts`). The base URL is set per environment:

| Environment | API base URL |
|---|---|
| Development | *(empty — proxied via `proxy.conf.json`)* |
| Production | `https://epiapp-production.up.railway.app` |

> **Note:** The Railway backend must have CORS configured to allow requests from `https://epilappsy.netlify.app`.

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
{ "token": "<jwt>", "username": "Kenneth123@" }
```

The returned `token` must be sent as a `Bearer` token on all subsequent requests:
```
Authorization: Bearer <token>
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

| Method | Endpoint                        | Description                              |
|--------|---------------------------------|------------------------------------------|
| GET    | `/api/triggers`                 | List all triggers                        |
| GET    | `/api/triggers?seizureId={id}`  | List triggers linked to a seizure        |
| POST   | `/api/triggers`                 | Create a trigger                         |
| DELETE | `/api/triggers/{id}`            | Delete a trigger                         |

**POST body:**
```json
{ "date": "2024-03-01", "type": "SLEEP", "seizureId": 1 }
```

For custom triggers use `"type": "OTHER"` and include `"label": "My trigger"`. `seizureId` is optional — when provided the trigger is linked to that specific seizure.

---

### Custom Trigger Options

| Method | Endpoint                           | Description                        |
|--------|------------------------------------|------------------------------------|
| GET    | `/api/custom-trigger-options`      | List saved custom trigger options  |
| POST   | `/api/custom-trigger-options`      | Save a new custom trigger option   |
| DELETE | `/api/custom-trigger-options/{id}` | Delete a custom trigger option     |

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
| `CalendarComponent` | Month grid view. Shows seizures (red) and triggers (orange) as labeled bars, max 5 per day with "+N more" overflow. Two FABs: add event and add medication. |
| `AddEventDialogComponent` | Choose between Seizure or Trigger. |
| `SeizureFormDialogComponent` | Form: date, time, duration, type, notes, and optional trigger checkboxes. Also used in read-only view mode to display a saved seizure with its linked triggers. |
| `TriggerFormDialogComponent` | Checkbox list (fixed + custom triggers) with date picker. Each checked item is saved as a separate trigger entry. |
| `DayDetailDialogComponent` | Opened by clicking a day. Lists that day's seizures (clickable rows showing time + type) and triggers with delete buttons. Clicking a seizure opens it in the seizure form view mode. |
| `AddMedicationDialogComponent` | Add multiple medications at once via a pending list before saving all. |
| `MedicationOverviewComponent` | Shows today's medications grouped by time slot. "Take all" button per slot. Taken doses shown in green with timestamp. |
| `EditMedicationDialogComponent` | Edit or delete an existing medication. |

**Services:** `SeizureService`, `TriggerService`, `CustomTriggerOptionService`, `MedicationService`, `MedicationLogService`, `AuthService` — all wrap REST endpoints via `HttpClient`.

**Auth guard:** `authGuard` protects the `/calendar` route — redirects to `/login` if not authenticated.

---

## Data Flow

```
App loads → checks localStorage for JWT token
  → Token present and valid → /calendar (no login required)
  → No token → /login
    → Login succeeds → JWT stored in localStorage (valid 3 months) → /calendar
    → Register → /register → on success → JWT stored → /calendar
  → Token expired → backend returns 401 → auto-logout → /login

User clicks "+"
  → AddEventDialog (choose type)
    → SEIZURE → SeizureFormDialog → POST /api/seizures
               (+ optional triggers) → POST /api/triggers per checked box (with seizureId)
    → TRIGGER → TriggerFormDialog → POST /api/triggers (one per checkbox)

User clicks a day cell
  → DayDetailDialog → lists seizures + triggers
    → Click seizure row → GET /api/triggers?seizureId={id}
                        → SeizureFormDialog (read-only) with linked triggers
    → Delete → DELETE /api/seizures/{id} or /api/triggers/{id}

Medication FAB
  → AddMedicationDialog → pending list → forkJoin POST /api/medications
  → MedicationOverview → grouped by time → "Take all" → POST /api/medication-logs
  → Edit button → EditMedicationDialog → PUT or DELETE /api/medications/{id}
```

---

## Authentication

All API endpoints except `/api/auth/register` and `/api/auth/login` require a valid JWT in the `Authorization: Bearer` header. The frontend attaches the token automatically via an HTTP interceptor. Each user's data (seizures, triggers, medications, logs, custom trigger options) is isolated — only the authenticated user's own records are accessible.

Tokens are valid for **3 months** (`jwt.expiration-ms=7776000000`). When a token expires the backend returns 401, the frontend clears localStorage, and the user is redirected to `/login`. The user does not need to log in again until the token expires.

Railway environment variable required for production:

| Variable | Description |
|---|---|
| `JWT_SECRET` | HS256 signing secret (min 32 characters) |

---

## Active branches

| Branch | Status | What's being done |
|---|---|---|
| `main` | stable | Production-ready baseline. All merged features land here and trigger a Railway deploy. |
| `A0001-16-samsung-health` | in progress | Samsung Health Connect integration. Adds a **Sleep** tab to the calendar showing daily sleep duration fetched from Health Connect, colour-coded green (≥ 8 h) or red (< 8 h). Includes a silent permission check on load and a "Grant permission" prompt when the user opens the Sleep tab for the first time. |
| `android-medication-notification` | in progress | Wires up the **"Take now"** inline action on medication reminder notifications. When tapped, all medications scheduled for that time slot are marked as taken without the user needing to open the app. Includes unit tests for the action handler (Jest). |
