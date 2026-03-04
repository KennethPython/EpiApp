# EpiApp — Epilepsy Tracker

A calendar-based app for logging seizures and triggers. Built with **Angular 17 + Angular Material** (frontend) and **Spring Boot 3 + H2** (backend).

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

### Seizures

| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | `/api/seizures`       | List all seizures  |
| POST   | `/api/seizures`       | Create a seizure   |
| DELETE | `/api/seizures/{id}`  | Delete a seizure   |

**Seizure body (POST):**
```json
{
  "dateTime": "2024-03-01T14:30:00",
  "durationMinutes": 3,
  "type": "TONIC_CLONIC",
  "notes": "Woke up confused"
}
```

### Triggers

| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | `/api/triggers`       | List all triggers  |
| POST   | `/api/triggers`       | Create a trigger   |
| DELETE | `/api/triggers/{id}`  | Delete a trigger   |

**Trigger body (POST):**
```json
{
  "date": "2024-03-01",
  "type": "SLEEP"
}
```

### Enums

| Enum          | Values                                               |
|---------------|------------------------------------------------------|
| `SeizureType` | `TONIC_CLONIC`, `ABSENCE`, `FOCAL`, `MYOCLONIC`, `ATONIC`, `OTHER` |
| `TriggerType` | `CAFFEINE`, `SLEEP`, `MEDICATION`                   |

---

## Frontend Components

| Component                | Role                                                              |
|--------------------------|-------------------------------------------------------------------|
| `CalendarComponent`      | Month grid view. Shows seizures (red) and triggers (orange) as dots. Navigation via chevrons. |
| `AddEventDialogComponent`| Opened by the FAB (`+`). Choose between Seizure or Trigger.     |
| `SeizureFormDialogComponent` | Form: date, time, duration, type, notes. Saves one seizure. |
| `TriggerFormDialogComponent` | Checkboxes for each trigger type + date picker. Each checked item is saved as a separate entry. |
| `DayDetailDialogComponent`   | Opened by clicking a day. Lists that day's seizures and triggers with individual delete buttons. |

**Services:** `SeizureService` and `TriggerService` wrap the REST API with `HttpClient`.
**Models:** `Seizure`, `Trigger` interfaces in `src/app/models/`.

---

## Data Flow

```
User clicks "+"
  → AddEventDialog (choose type)
    → SEIZURE → SeizureFormDialog → POST /api/seizures → calendar reloads
    → TRIGGER → TriggerFormDialog → POST /api/triggers (one per checkbox) → calendar reloads

User clicks a day cell
  → DayDetailDialog (list events)
    → Delete button → DELETE /api/seizures/{id} or /api/triggers/{id} → list updates
```

---

## Auth Readiness

Both `Seizure` and `Trigger` entities include a `userId` field (currently unused). Adding Spring Security + JWT will only require:
1. A `User` entity and auth endpoints
2. Populating `userId` from the security context in the controllers
3. Filtering queries by `userId`
