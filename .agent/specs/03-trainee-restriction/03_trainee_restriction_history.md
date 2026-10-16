# 03 – Trainee restriction – History

Prototype source: `client/pages/BlockList.tsx`. Business rules and model: [overview.md](overview.md). Pattern: [00 §4.1](../00-foundations.md#41-history-screen).

---

## 1. Purpose & entry points

- Lists all trainee restrictions of one trainee (active and ended), lets the user search, sort, expand a record, edit it, or create a new one.
- **Entry points:** `"הגבלה/היתר לחניך"` on the actions screen; returning from the form (save or close).

---

## 2. Route & parameters

- **Route:** `/child/:id/block` (legacy slug, [OQ-19](../README.md#oq-19))
- **`id`:** trainee ID. Unknown trainee → not-found screen (production).
- **After save (production):** the form passes the saved record ID (navigation state or a query parameter such as `?saved={recordId}`); the list opens that card, then clears the parameter so back/forward does not re-apply it.

---

## 3. Layout

1. **HistoryHeader** – title `"הגבלה/היתר לחניך"`; back arrow to `/child/{id}`.
2. **Toolbar row**
   - Section title `"הסטוריית הגבלות"` (Restrictions history).
   - ToolbarSearch: aria-label `"חיפוש הגבלות"`, placeholder `"חיפוש לפי סיבה, גורם או תאריך"` (Search by reason, approver or date).
   - Sort button `"מיון"`.
3. **Cards** – one ExpandableRecordCard per restriction.
4. **EmptyState** – `"לא נמצאו הגבלות"` (No restrictions found).
5. **StickyActionBar** – primary link `"הגבלה חדשה"` (New restriction) + plus icon → `/child/{id}/block/new`.

### 3.1 Card – closed

| Part | Content |
|---|---|
| Icon | RecordIcon, circle with slash, red |
| Top line | Date range `DD/MM/YY-DD/MM/YY` (LTR, 16/20 gray) + StatusBadge `"פעילה"` / `"הסתיים"` |
| Second line | Reason label, or `"ללא סיבה"` (truncated) |
| End | Chevron |

### 3.2 Card – open

DetailGrid, two columns, in this order (right column first):

| Row | Right | Left |
|---|---|---|
| 1 | `"תאריכים"` (Dates) – range, LTR | `"סוג ההגבלה"` (Restriction type) – type label ([overview §3.1](overview.md#31-type-label)) |
| 2 | `"שעות מותרות"` (Permitted hours) – hours value ([overview §3.2](overview.md#32-open-by-default-rule)); LTR when hours are set | `"מכשירים מותרים"` (Permitted devices) – devices value |
| 3 | `"סיבה"` (Reason) – label or `"לא צוין"` (Not specified) | `"גורם מאשר"` (Approver) – label or `"לא צוין"` |
| 4 | `"פירוט"` (Details) – full width, **only when not empty** | |

Below the grid: outline button `"עריכה"` (Edit) with edit icon.

Note: in the card the devices value lists **all** device labels joined with `", "`; the form summary shows a count instead ([form.md §4.5](form.md#45-permits-block-accordions)).

---

## 4. Behavior & states

- **Search** matches the trimmed query (substring) against a text built from: reason, details, approver, type label, hours value, devices value, date range (`DD/MM/YY-DD/MM/YY`), start date and end date (`YYYY-MM-DD`). Non-breaking spaces in the type label count as spaces, so `"עד 10 דק'"` matches.
- **Empty list** and **no search match** both show `"לא נמצאו הגבלות"`.

---

## 6. Data & API (`trainee-restrictions.schema.ts`)

| When | Call | Schema |
|---|---|---|
| Screen opens; returning from the form | `GET /api/trainees/{traineeId}/restrictions` | Request: `GetTraineeRestrictionsRequest` (`traineeIds: [traineeId]`)<br>Response: `GetTraineeRestrictionsResponse` (`records: TraineeRestrictionRecordDto[]`) |

- Search and sort run on the client over the loaded `records` list.
- Display values come from `TraineeRestrictionRecordDto`: `reason`, `details`, `approver.fullName`, `devices[].name`, `startTime`/`endTime`, `durationMinutes`, `temporalStatus`.
