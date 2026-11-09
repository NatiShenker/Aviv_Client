# 04 – Number restriction / permit – History

Prototype source: `client/pages/ExceptionList.tsx`. Business rules and model: [overview.md](04_number_restriction_overview.md). Pattern: [00 §4.1](../00_foundations.md#41-history-screen).

---

## 1. Purpose & entry points

- Lists all of the trainee's number restrictions and permits (active and ended) as separate cards; search, sort, expand, edit, create.
- **Entry points:** `"הגבלות והיתרים למספר"` on the actions screen; returning from the form.

---

## 2. Route & parameters

- **Route:** `/trainee/:traineeId/number-restriction` (renamed from the sketch slug `exception`, [OQ-19](../../pending-decisions.md#oq-19))
- **`id`:** trainee ID. Unknown trainee → not-found screen (production).
- **After save:** the list reloads and opens the **first** saved record. The key passes from the form to the list in memory, not in the URL. A record key is the type + ID (e.g. `permit-12`), because restrictions and permits come from separate tables and their IDs can repeat; the edit route uses the same key ([form §2](04_number_restriction_form.md)).

---

## 3. Layout

1. **HistoryHeader** – title `"הגבלות והיתרים למספר"` (decided 2026-10-21); back arrow one step back to the actions screen ([00 §3.1](../00_foundations.md)).
2. **HistoryToolbar** ([00 §3.23](../00_foundations.md))
   - Section title `"היסטוריית הגבלות והיתרים"` (Restrictions and permits history).
   - Search field: aria-label `"חיפוש הגבלות והיתרים"`, placeholder `"חיפוש חופשי"` (Free search; decided 2026-10-21). It still searches the fields of §4.
   - Square sort button, outlined like the fields (aria-label `"מיון"`).
   - Results count ([00 §3.23](../00_foundations.md) row 3): `"מוצגים {n} הגבלות והיתרים"` – masculine, because the list holds restrictions and permits together; one record by its type: `"מוצגת הגבלה אחת"` / `"מוצג היתר אחד"` (decided 2026-10-21).
3. **Cards** – one ExpandableRecordCard per record (each permit and each restriction separately).
4. **EmptyState** – `"לא נמצאו הגבלות או היתרים"` (No restrictions or permits found).
5. **StickyActionBar** – primary button `"הוספת הגבלה או היתר"` (Add a restriction or permit; decided 2026-10-21) + plus icon → `/trainee/{id}/number-restriction/new`.

### 3.1 Card – closed

What, then when ([00 §3.22](../00_foundations.md), decided 2026-10-18):

| Part | Content |
|---|---|
| Icon | RecordIcon – **open lock, red, the same for every card** (permit or restriction) |
| Title line (16/20, `text-primary`) | Phone number (LTR) + TypeTag `"היתר"` / `"הגבלה"` |
| Meta line (16/20 gray) | Date range (LTR) + StatusBadge (`"פעיל"` for a permit, `"פעילה"` for a restriction; when ended `"הסתיים"` / `"הסתיימה"`) |
| End | Chevron |

### 3.2 Card – open

DetailGrid, two columns (right column first). The number, type tag, dates and status are already in the card summary, so they are not repeated:

| Row | Right | Left |
|---|---|---|
| 1 | `"סוג"` (Type) – type label, permit or restriction variant ([overview §3](04_number_restriction_overview.md)), full width | |
| 2 (permits only) | `"חל על הגבלה"` (Applies to restriction; decided 2026-10-21) – `"{scope label} · {range}"`, full width | |
| 3 | `"שעות מותרות"` – hours value; LTR when set | `"מכשירים מותרים"` – 1 device → its label; more → `"{n} מכשירים"`; or the default value |
| 4 | `"גורם מאשר"` – name or `"לא צוין"` | |
| 5 | `"פירוט"` – full width, **only when not empty** | |

There is no `"סיבה"` row: the server does not return the reason while it is not stored ([pending-decisions](../../pending-decisions.md), 2026-11-09). It comes back when the columns exist.

Below the grid: outline button `"עריכה"` with edit icon – or, on an ended record, `"יצירת היתר דומה"` / `"יצירת הגבלה דומה"` (decided 2026-10-21) with a copy icon (an ended record cannot be edited, [00 §3.22](../00_foundations.md)).

**Default values for hours and devices:**

- Permit: unset hours → `"כל היום"`; unset devices → `"כל המכשירים"`.
- Restriction: same rule as the trainee restriction ([03 overview §3.2](../03-trainee-restriction/03_trainee_restriction_overview.md#32-open-by-default-rule)) – `"לא הוגדרו"` only for a full restriction with nothing permitted.

---

## 4. Behavior & states

- **Search** matches the trimmed query (substring) against: phone, full type label (`"היתר למספר"` / `"הגבלה למספר"`), type label (e.g. `"היתר עם הגבלת משך - עד 15 דק׳"`, non-breaking spaces count as spaces), scope label of the underlying restriction (permits), details, approver, hours value, devices value and every device label, date range (`DD/MM/YY-DD/MM/YY`), start and end dates (`YYYY-MM-DD`).
- **Empty list** and **no search match** both show `"לא נמצאו הגבלות או היתרים"`.
- **Sort sheet rows:** as in [03 history §4](../03-trainee-restriction/03_trainee_restriction_history.md), except the status rows, in the masculine because the list holds restrictions and permits together: `"סטטוס: פעילים תחילה"` / `"סטטוס: שהסתיימו תחילה"` (decided 2026-10-21).

---

## 6. Data & API (`phone-exceptions.schema.ts`)

| When | Call | Schema |
|---|---|---|
| Screen opens; returning from the form | `POST PhoneExceptions/GetTraineePhoneRecords` (`PhoneExceptionsController`, 2026-11-09) | Request: `GetTraineePhoneRecordsRequest` (`idntTraineeList: [traineeId]`)<br>Response: `GetTraineePhoneRecordsResponse` (`records: TraineePhoneRecordDto[]`) – restrictions and permits in one list, the active versions only, active and ended, no paging |

- Search and sort run on the client over `records`.
- Display values come from `TraineePhoneRecordDto` (`TraineePhoneRestrictionRecordDto | TraineePhonePermitRecordDto`, told apart by the server's `isPermit` flag; the record key `permit-12` / `restriction-12` is derived from it); the status from `isEnded`; `"חל על הגבלה"` uses `record.sourceRestriction` (joined by the server from `AVIV_RESTRICTION_NUMBER`), whose `codeRestrictionScope` + `institutes` give the scope label ([overview §2.2](04_number_restriction_overview.md)).

---

## 8. Desktop (Aviv's container ≥ 1024px)

The history opens in the trainee drawer, in the desktop history pattern of [00 §4.4](../00_foundations.md#44-desktop-history-and-form-in-the-trainee-drawer) (decided 2026-10-19):

- **Top row:** back to the actions, and the action selector showing `"הגבלות והיתרים למספר"`.
- **Toolbar:**
  - the section title `"היסטוריית הגבלות והיתרים"`, with the create button `"הוספת הגבלה או היתר"` at the end of its row;
  - the search, with this screen's label and placeholder (§3);
  - the `"מיון"` select, with the rows of §4.
- **Cards, search, sort, states and permission:** as in §3–§4.
- **Card actions:** `"עריכה"` and the "create based on" buttons open the form as a layer over the history ([form §8](04_number_restriction_form.md)).
