# 04 – Number restriction / permit – History

Prototype source: `client/pages/ExceptionList.tsx`. Business rules and model: [overview.md](overview.md). Pattern: [00 §4.1](../00-foundations.md#41-history-screen).

---

## 1. Purpose & entry points

- Lists all of the trainee's number restrictions and permits (active and ended) as separate cards; search, sort, expand, edit, create.
- **Entry points:** `"הגבלה/היתר למספר"` on the actions screen; returning from the form.

---

## 2. Route & parameters

- **Route:** `/child/:id/exception` (legacy slug, [OQ-19](../README.md#oq-19))
- **`id`:** trainee ID. Unknown trainee → not-found screen (production).
- **After save (production):** the form passes the saved record IDs (navigation state or `?saved={id}`); the list opens the **first** one, then clears the parameter.

---

## 3. Layout

1. **HistoryHeader** – title `"הגבלה/היתר למספר"`; back arrow to `/child/{id}`.
2. **Toolbar row**
   - Section title `"הסטוריית הגבלות והיתרים"` (Restrictions and permits history).
   - ToolbarSearch: aria-label `"חיפוש הגבלות והיתרים"`, placeholder `"חיפוש לפי מספר, סיבה או תאריך"` (Search by number, reason or date).
   - Sort button `"מיון"`.
3. **Cards** – one ExpandableRecordCard per record (each permit and each restriction separately).
4. **EmptyState** – `"לא נמצאו הגבלות או היתרים"` (No restrictions or permits found).
5. **StickyActionBar** – primary link `"הוספת הגבלה/היתר"` (Add restriction/permit) + plus icon → `/child/{id}/exception/new`.

### 3.1 Card – closed

| Part | Content |
|---|---|
| Icon | RecordIcon – **open lock, red, the same for every card** (permit or restriction) |
| Top line | Phone number (LTR, 16/20 gray) + TypeTag `"היתר"` / `"הגבלה"` + StatusBadge (`"פעיל"` for a permit, `"פעילה"` for a restriction, `"הסתיים"` when ended) |
| Second line | Reason label, or `"ללא סיבה"` |
| End | Chevron |

### 3.2 Card – open

DetailGrid, two columns (right column first):

| Row | Right | Left |
|---|---|---|
| 1 | `"סוג"` (Type) – type label, permit or restriction variant ([overview §3](overview.md#3-derived-display-values)) | `"תאריכים"` – range, LTR |
| 2 (permits only) | `"על הגבלה"` (On restriction) – `"{scope label} · {range}"`, full width | |
| 3 | `"שעות מותרות"` – hours value; LTR when set | `"מכשירים מותרים"` – device labels joined with `", "`, or the default value |
| 4 | `"סיבה"` – label or `"לא צוין"` | `"גורם מאשר"` – label or `"לא צוין"` |
| 5 | `"פירוט"` – full width, **only when not empty** | |

Below the grid: outline button `"עריכה"` with edit icon.

**Default values for hours and devices:**

- Permit: unset hours → `"כל היום"`; unset devices → `"כל המכשירים"`.
- Restriction: same rule as the trainee restriction ([03 overview §3.2](../03-trainee-restriction/overview.md#32-open-by-default-rule)) – `"לא הוגדרו"` only for a full restriction with nothing permitted.

---

## 4. Behavior & states

- **Search** matches the trimmed query (substring) against: phone, full type label (`"היתר למספר מוגבל"` / `"הגבלת מספר"`), type label (e.g. `"היתר עם הגבלת משך – עד 15 דק'"`, non-breaking spaces count as spaces), scope label of the underlying restriction (permits), reason, details, approver, hours value, devices value, date range (`DD/MM/YY-DD/MM/YY`), start and end dates (`YYYY-MM-DD`).
- **Empty list** and **no search match** both show `"לא נמצאו הגבלות או היתרים"`.

---

## 6. Data & API (`phone-exceptions.schema.ts`)

| When | Call | Schema |
|---|---|---|
| Screen opens; returning from the form | `GET /api/trainees/{traineeId}/phone-records` | Request: `GetTraineePhoneRecordsRequest` (`traineeIds: [traineeId]`)<br>Response: `GetTraineePhoneRecordsResponse` (`records: TraineePhoneRecordDto[]`) |

- Search and sort run on the client over `records`.
- Display values come from `TraineePhoneRecordDto` (`TraineePhoneRestrictionRecordDto | TraineePhonePermitRecordDto`); `"על הגבלה"` uses `record.sourceRestriction` (joined by the server from `AVIV_RESTRICTION_NUMBER`).
