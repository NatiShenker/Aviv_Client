# 04 – Number restriction / permit – History

Prototype source: `client/pages/ExceptionList.tsx`. Business rules and model: [overview.md](04_number_restriction_overview.md). Pattern: [00 §4.1](../00_foundations.md#41-history-screen).

---

## 1. Purpose & entry points

- Lists all of the trainee's number restrictions and permits (active and ended) as separate cards; search, sort, expand, edit, create.
- **Entry points:** `"הגבלה/היתר למספר"` on the actions screen; returning from the form.

---

## 2. Route & parameters

- **Route:** `/trainee/:id/number-restriction` (renamed from the sketch slug `exception`, [OQ-19](../../pending-decisions.md#oq-19))
- **`id`:** trainee ID. Unknown trainee → not-found screen (production).
- **After save:** the list reloads and opens the **first** saved record. The key passes from the form to the list in memory, not in the URL. A record key is the type + ID (e.g. `permit-12`), because restrictions and permits come from separate tables and their IDs can repeat; the edit route uses the same key ([form §2](04_number_restriction_form.md)).

---

## 3. Layout

1. **HistoryHeader** – title `"הגבלה/היתר למספר"`; back arrow one step back to the actions screen ([00 §3.1](../00_foundations.md)).
2. **HistoryToolbar** ([00 §3.23](../00_foundations.md))
   - Section title `"היסטוריית הגבלות והיתרים"` (Restrictions and permits history).
   - Search field: aria-label `"חיפוש הגבלות והיתרים"`, placeholder `"חיפוש לפי מספר, סיבה או תאריך"` (Search by number, reason or date).
   - Round sort button (aria-label `"מיון"`).
3. **Cards** – one ExpandableRecordCard per record (each permit and each restriction separately).
4. **EmptyState** – `"לא נמצאו הגבלות או היתרים"` (No restrictions or permits found).
5. **StickyActionBar** – primary link `"הוספת הגבלה/היתר"` (Add restriction/permit) + plus icon → `/trainee/{id}/number-restriction/new`.

### 3.1 Card – closed

What, then when ([00 §3.22](../00_foundations.md), decided 2026-10-18):

| Part | Content |
|---|---|
| Icon | RecordIcon – **open lock, red, the same for every card** (permit or restriction) |
| Title line (16/20, `text-primary`) | Phone number (LTR) + TypeTag `"היתר"` / `"הגבלה"` |
| Meta line (16/20 gray) | Date range (LTR) + StatusBadge (`"פעיל"` for a permit, `"פעילה"` for a restriction, `"הסתיים"` when ended) |
| End | Chevron |

### 3.2 Card – open

DetailGrid, two columns (right column first). The number, type tag, dates and status are already in the card summary, so they are not repeated:

| Row | Right | Left |
|---|---|---|
| 1 | `"סוג"` (Type) – type label, permit or restriction variant ([overview §3](04_number_restriction_overview.md)), full width | |
| 2 (permits only) | `"על הגבלה"` (On restriction) – `"{scope label} · {range}"`, full width | |
| 3 | `"שעות מותרות"` – hours value; LTR when set | `"מכשירים מותרים"` – 1 device → its label; more → `"{n} מכשירים"`; or the default value |
| 4 | `"סיבה"` – label or `"לא צוין"` | `"גורם מאשר"` – label or `"לא צוין"` |
| 5 | `"פירוט"` – full width, **only when not empty** | |

Below the grid: outline button `"עריכה"` with edit icon – or, on an ended record, `"צור היתר חדש על בסיס זה"` / `"צור הגבלה חדשה על בסיס זו"` **(proposed)** with a copy icon (an ended record cannot be edited, [00 §3.22](../00_foundations.md)).

**Default values for hours and devices:**

- Permit: unset hours → `"כל היום"`; unset devices → `"כל המכשירים"`.
- Restriction: same rule as the trainee restriction ([03 overview §3.2](../03-trainee-restriction/03_trainee_restriction_overview.md#32-open-by-default-rule)) – `"לא הוגדרו"` only for a full restriction with nothing permitted.

---

## 4. Behavior & states

- **Search** matches the trimmed query (substring) against: phone, full type label (`"היתר למספר מוגבל"` / `"הגבלת מספר"`), type label (e.g. `"היתר עם הגבלת משך – עד 15 דק'"`, non-breaking spaces count as spaces), scope label of the underlying restriction (permits), reason, details, approver, hours value, devices value and every device label, date range (`DD/MM/YY-DD/MM/YY`), start and end dates (`YYYY-MM-DD`).
- **Empty list** and **no search match** both show `"לא נמצאו הגבלות או היתרים"`.

---

## 6. Data & API (`phone-exceptions.schema.ts`)

| When | Call | Schema |
|---|---|---|
| Screen opens; returning from the form | `GET /api/trainees/{traineeId}/phone-records` | Request: `GetTraineePhoneRecordsRequest` (`traineeIds: [traineeId]`)<br>Response: `GetTraineePhoneRecordsResponse` (`records: TraineePhoneRecordDto[]`) |

- Search and sort run on the client over `records`.
- Display values come from `TraineePhoneRecordDto` (`TraineePhoneRestrictionRecordDto | TraineePhonePermitRecordDto`); `"על הגבלה"` uses `record.sourceRestriction` (joined by the server from `AVIV_RESTRICTION_NUMBER`).
