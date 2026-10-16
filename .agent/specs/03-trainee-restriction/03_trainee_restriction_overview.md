# 03 – Trainee restriction ("הגבלה/היתר לחניך") – Overview

Prototype sources: `client/pages/BlockList.tsx`, `client/pages/BlockForm.tsx`, `client/lib/restrictions.ts`.

Screens: [history.md](https://www.google.com/search?q=history.md) · [form.md](https://www.google.com/search?q=form.md)

---

## 1. Purpose

Limit **all** of one trainee's calls for a date range, regardless of the number dialed. A restriction can block calls fully or cap each call's duration, and can permit calls only in certain hours or from certain devices.

---

## 2. Business rules

### 2.1 The principle

- **Dates and call duration belong to the restriction.**
- **Permitted hours and permitted devices define when and where calls are allowed** – they are permits inside the restriction, never "blocked hours".
- The duration cap applies to the calls that are allowed.

### 2.2 Limit type

Every restriction has one of two types, chosen with the "סוג ההגבלה" selector:

| Type | Label | Meaning | Stored as |
|---|---|---|---|
| Full | `"הגבלה מלאה"` | Calls are blocked, except for the permits defined (hours / devices) | `callDurationMinutes = null` |
| Duration-limited | `"הגבלת משך שיחה"` | Calls are allowed, up to a maximum duration per call | `callDurationMinutes = 1…120` |

Choosing "הגבלת משך שיחה" in effect creates an all-day permit with a minutes cap, which hours and devices can then narrow.

### 2.3 Interpretation table

What the trainee can do during the restriction's date range:

| Type | Permitted hours | Permitted devices | Result |
|---|---|---|---|
| Full | – | – | All calls blocked |
| Full | 16:00–18:00 | – | Calls allowed only 16:00–18:00, from any device, no duration cap. Blocked the rest of the day |
| Full | – | Device A | Calls allowed only from device A, all day, no duration cap |
| Full | 16:00–18:00 | Device A | Calls allowed only 16:00–18:00 **and** only from device A, no duration cap |
| Duration (10) | – | – | Calls allowed all day from any device, up to 10 minutes each |
| Duration (10) | 16:00–18:00 | – | Calls allowed only 16:00–18:00, from any device, up to 10 minutes each |
| Duration (10) | – | Device A | Calls allowed only from device A, all day, up to 10 minutes each |
| Duration (10) | 16:00–18:00 | Device A | Calls allowed only 16:00–18:00 from device A, up to 10 minutes each |

### 2.4 Record rules

- Each save creates or updates **one record**.
- The hours window is the same every day of the date range. Hours are both set or both empty; end must be after start on the same day ([OQ-13](https://www.google.com/search?q=..%2FREADME.md%23oq-13)).
- Status: **active** while `endDate >= today`, otherwise **ended** ([OQ-01](https://www.google.com/search?q=..%2FREADME.md%23oq-01)).
- Records cannot be cancelled or deleted in this version ([OQ-02](https://www.google.com/search?q=..%2FREADME.md%23oq-02)).

---

## 3. Derived display values

Used by the history card ([history.md](https://www.google.com/search?q=history.md)) and by the accordion summaries in the form ([form.md](https://www.google.com/search?q=form.md)).

### 3.1 Type label

| `callDurationMinutes` | Label |
|---|---|
| `null` | `"הגבלה מלאה"` |
| X | `"הגבלת משך שיחה – עד X דק'"` (the spaces in "עד X דק'" are non-breaking) |

### 3.2 "Open by default" rule

A restriction is **open by default** when any of these is true: it is duration-limited, it has permitted hours, or it has at least one permitted device. Otherwise (full, nothing permitted) everything is blocked.

| Value | Set | Not set, open by default | Not set, not open by default |
|---|---|---|---|
| Hours | `"HH:mm-HH:mm"` (LTR) | `"כל היום"` (All day) | `"לא הוגדרו"` (Not set) |
| Devices | Device labels joined with `", "` | `"כל המכשירים"` (All devices) | `"לא הוגדרו"` |

Examples: full + nothing → `"לא הוגדרו"` / `"לא הוגדרו"`; full + hours only → `"16:00-18:00"` / `"כל המכשירים"`; duration only → `"כל היום"` / `"כל המכשירים"`.

---

## 5. API

| Method & path | Request Schema | Response Schema | Used by |
|---|---|---|---|
| `GET /api/trainees/{traineeId}/restrictions` | `GetTraineeRestrictionsRequest` (`traineeIds: [traineeId]`) | `GetTraineeRestrictionsResponse` (`records: TraineeRestrictionRecordDto[]`) | History & Edit cache |
| `POST /api/trainee-restrictions` | `CreateTraineeRestrictionRequest` | `CreateTraineeRestrictionResponse` (`MutationResultDto`) | Form, create |
| `PUT /api/trainee-restrictions/{id}` | `UpdateTraineeRestrictionRequest` | `UpdateTraineeRestrictionResponse` (`MutationResultDto`) | Form, edit |
