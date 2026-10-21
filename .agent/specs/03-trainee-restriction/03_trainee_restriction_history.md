# 03 – Trainee restriction – History

Prototype source: `client/pages/BlockList.tsx`. Business rules and model: [overview.md](03_trainee_restriction_overview.md). Pattern: [00 §4.1](../00_foundations.md#41-history-screen).

---

## 1. Purpose & entry points

- Lists all trainee restrictions of one trainee (active and ended), lets the user search, sort, expand a record, edit it, or create a new one.
- **Entry points:** `"הגבלות לחניך"` on the actions screen; returning from the form (save or close).

---

## 2. Route & parameters

- **Route:** `/trainee/:traineeId/trainee-restriction` (renamed from the sketch slug `block`, [OQ-19](../../pending-decisions.md#oq-19))
- **`id`:** trainee ID. Unknown trainee → not-found screen (production).
- **After save:** the list reloads and opens the saved record. The ID passes from the form to the list in memory, not in the URL.

---

## 3. Layout

1. **HistoryHeader** – title `"הגבלות לחניך"` (decided 2026-10-21); back arrow one step back to the actions screen ([00 §3.1](../00_foundations.md)).
2. **HistoryToolbar** ([00 §3.23](../00_foundations.md))
   - Section title `"היסטוריית הגבלות"` (Restrictions history).
   - Search field: aria-label `"חיפוש הגבלות"`, placeholder `"חיפוש חופשי"` (Free search; decided 2026-10-21). It still searches the fields of §4.
   - Square sort button, outlined like the fields (aria-label `"מיון"`).
   - Results count ([00 §3.23](../00_foundations.md) row 3): `"מוצגות {n} הגבלות"` / `"מוצגת הגבלה אחת"` (decided 2026-10-21).
3. **Cards** – one ExpandableRecordCard per restriction, rendered incrementally.
4. **EmptyState** – `"לא נמצאו הגבלות"` (No restrictions found).
5. **StickyActionBar** – primary button `"הוספת הגבלה"` (Add restriction) + plus icon → `/trainee/{id}/trainee-restriction/new` (decided 2026-10-18, like the other history screens).

### 3.1 Card – closed

What, then when ([00 §3.22](../00_foundations.md), decided 2026-10-18):

| Part | Content |
|---|---|
| Icon | RecordIcon, circle with slash, red |
| Title line (16/20, `text-primary`, truncated) | Type label ([overview §3.1](03_trainee_restriction_overview.md)), e.g. `"הגבלת משך שיחה - עד 15 דק׳"` |
| Meta line (16/20 gray) | Date range `DD/MM/YY-DD/MM/YY` (LTR) + StatusBadge `"פעילה"` / `"הסתיימה"` |
| End | Chevron |

### 3.2 Card – open

DetailGrid, two columns, in this order (right column first). The type and dates are already in the card summary, so they are not repeated:

| Row | Right | Left |
|---|---|---|
| 1 | `"שעות מותרות"` (Permitted hours) – hours value ([overview §3.2](03_trainee_restriction_overview.md)); LTR when hours are set | `"מכשירים מותרים"` (Permitted devices) – devices value |
| 2 | `"סיבה"` (Reason) – label or `"לא צוין"` (Not specified) | `"גורם מאשר"` (Approver) – label or `"לא צוין"` |
| 3 | `"פירוט"` (Details) – full width, **only when not empty** | |

Below the grid: outline button `"עריכה"` (Edit) with edit icon – or, on an ended record, `"יצירת הגבלה דומה"` (decided 2026-10-21) with a copy icon (an ended record cannot be edited, [00 §3.22](../00_foundations.md)).

Note: like the form summary ([form.md §4.5](03_trainee_restriction_form.md#45-hours-and-devices-accordions)), the card shows one device by its label and more as `"{n} מכשירים"` – an institute can have many devices (decided 2026-10-18).

---

## 4. Behavior & states

- **Search** matches the trimmed query (substring) against a text built from: reason, details, approver, type label, hours value, devices value and every device label (so a device is found even when the card shows only the count), date range (`DD/MM/YY-DD/MM/YY`), start date and end date (`YYYY-MM-DD`). Non-breaking spaces in the type label count as spaces, so `"עד 10 דק׳"` matches.
- **Empty list** and **no search match** both show `"לא נמצאו הגבלות"`.
- **Sort sheet rows** (field + direction, [00 §3.25](../00_foundations.md)): `"תאריך התחלה: מהחדש לישן"` (default), `"תאריך התחלה: מהישן לחדש"`, `"תאריך סיום: מהחדש לישן"`, `"תאריך סיום: מהישן לחדש"` **(proposed)**, `"סטטוס: פעילות תחילה"`, `"סטטוס: שהסתיימו תחילה"` (in the record's gender, decided 2026-10-21, [00 §4.1](../00_foundations.md)).
- **Loading:** skeleton cards. **Failure:** `"לא ניתן לטעון את ההגבלות"` **(proposed)** + `"טעינה מחדש"` (decided 2026-10-21).
- **Permission:** requires the trainee-restriction permission ([02 §7](../02_child_actions.md)).

---

## 6. Data & API (`trainee-restrictions.schema.ts`)

| When | Call | Schema |
|---|---|---|
| Every time the screen opens (no client cache – the history is always fresh); returning from the form | `POST TraineeRestrictions/GetTraineeRestrictions` *(name is a placeholder – see pending-decisions)* | Request: `GetTraineeRestrictionsRequest` (`traineeIds: [traineeId]`)<br>Response: `GetTraineeRestrictionsResponse` (`records: TraineeRestrictionRecordDto[]`) |

- Search and sort run on the client over the loaded `records` list.
- Display values come from `TraineeRestrictionRecordDto`: `reason`, `details`, `approver.fullName`, `devices[].name`, `startTime`/`endTime`, `durationMinutes`, `temporalStatus`.

---

## 8. Desktop (Aviv's container ≥ 1024px)

The history opens in the trainee drawer, in the desktop history pattern of [00 §4.4](../00_foundations.md#44-desktop-history-and-form-in-the-trainee-drawer) (decided 2026-10-19):

- **Top row:** back to the actions, and the action selector showing `"הגבלות לחניך"`.
- **Toolbar:**
  - the section title `"היסטוריית הגבלות"`, with the create button `"הוספת הגבלה"` at the end of its row;
  - the search, with this screen's label and placeholder (§3);
  - the `"מיון"` select, with the rows of §4.
- **Cards, search, sort, states and permission:** as in §3–§4.
- **Card actions:** `"עריכה"` and `"יצירת הגבלה דומה"` open the form as a layer over the history ([form §8](03_trainee_restriction_form.md)).
