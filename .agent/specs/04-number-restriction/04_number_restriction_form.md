# 04 – Number restriction / permit – Form

Prototype source: `client/pages/ExceptionForm.tsx`. Business rules and model: [overview.md](04_number_restriction_overview.md). Pattern: [00 §4.2](../00_foundations.md#42-form-screen).

---

## 1. Purpose & entry points

- **Create** a permit for a restricted number, or a restriction on one or more numbers.
- **Edit** an existing permit or restriction (dates, conditions, decision – not the type, number or underlying restriction).
- **Create:** `"הוספת הגבלה/היתר"` on the history screen. **Edit:** `"עריכה"` in an open history card (active or future records only).
- **Create based on an ended record:** `"צור היתר חדש על בסיס זה"` / `"צור הגבלה חדשה על בסיס זו"` in an open card of an ended record (§4.11).

---

## 2. Route & parameters

| Mode | Route | Notes |
|---|---|---|
| Create | `/trainee/:id/number-restriction/new` | Opens on type `"היתר למספר מוגבל"` |
| Create based on | `/trainee/:id/number-restriction/new?basedOn={recordKey}` | The source is taken from the loaded history; the form waits for it. Not found → a plain create form |
| Edit | `/trainee/:id/number-restriction/:recordKey/edit` | `recordKey` = record type + ID, e.g. `permit-12` or `restriction-12` (restrictions and permits come from separate tables, so IDs can repeat). The record is taken from the loaded history; unknown key or an ended record → redirect to `/trainee/:id/number-restriction` (replace) |

---

## 3. Layout

### 3.1 Header

FormHeader – title:

| Mode | Permit | Restriction |
|---|---|---|
| Create | `"היתר חדש"` (New permit) | `"הגבלה חדשה"` (New restriction) |
| Edit | `"עריכת היתר"` (Edit permit) | `"עריכת הגבלה"` (Edit restriction) |

The create title follows the action type selected below. Close X (aria-label `"סגירה ללא שמירה"`).

### 3.2 Block 0 (create only) – `"הגבלה או היתר"` (Restriction or permit)

1. **Title** `"הגבלה או היתר"` (`h2`) – renamed from "סוג הפעולה" (decided 2026-10-18), so the form no longer has two "סוג" titles in a row ("כיוון" was rejected: it reads as the call direction).
2. **Stacked radio** ([00 §3.8](../00_foundations.md)), 16px below, labelled by the title:

| Order | Title | Description **(proposed)** |
|---|---|---|
| 1 (default) | `"היתר למספר מוגבל"` | `"פתיחת מספר שחסום עבור החניך"` (Opening a number that is blocked for the trainee) |
| 2 | `"הגבלת מספר"` | `"חסימת מספר אחד או יותר לחניך"` (Blocking one or more numbers for the trainee) |

3. **Number field** (12px below), by type:

| Type | Component | Hint | Button |
|---|---|---|---|
| Permit | PhoneSearchField | `"הזן את המספר המלא כדי לאתר את ההגבלות החלות עליו עבור החניך"` (Enter the full number to find the restrictions that apply to it for this trainee) | `"חיפוש"` + search icon |
| Restriction | PhoneNumbersField | `"הזן מספר אחד או יותר. כל מספר יישמר כהגבלה נפרדת"` (Enter one or more numbers. Each number is saved as a separate restriction) | `"הוסף"` + plus icon |

4. **Permit lookup result** (16px below the number field, fade-in) – one of:
   - **No results card** (white card, radius 8, padding 16, thin outline):
     - Text (14/18): `"לא נמצאו הגבלות פעילות על המספר עבור החניך – המספר פתוח ואין צורך בהיתר"` (No active restrictions on this number for the trainee – the number is open and no permit is needed).
     - Link button (8px below, 14/18, `action` color, chevron pointing left): `"להגבלת המספר"` (Restrict the number).
   - **Restriction picker:**
     - Heading row (44px): title (14/18) at the start; at the end, when shown (§4.4), a text button (14/18, `action`): `"החלפה"` (Change) or `"ביטול"` (Cancel).
     - Hint (12/15 gray), when shown (§4.4).
     - Cards (8px below, 8px apart) in a list labelled by the title and described by the hint – **RestrictionOption** (§3.2.1). Rendered incrementally like every list (30 at a time).
     - ErrorText – restriction.
   - **While the picker is open for choosing** (§4.4) it takes the whole form below block 0: blocks 1–3 are hidden. The form scrolls as usual (no inner scroll area).

#### 3.2.1 RestrictionOption card

White card, radius 8, outline 1px `action` when it is the selected restriction, 0.5px `divider` otherwise. The card body is information only and is **not** tappable; choosing happens only on the dedicated "בחירה" row, so a card is never chosen by accident while scrolling or reading.

| Part | Content |
|---|---|
| Line 1 | (padding 16) Scope label (16/20, weight 500): `"הגבלה ארצית"` / `"הגבלת פנימייה – {institute}"` (several institutes joined with `", "`) / `"הגבלה לחניך"` |
| Line 2 | (14/18 gray, 4px below) date range (LTR) + `" · "` + reason, or `"ללא סיבה"` |
| Line 3 | Only when this trainee has existing permits on it (14/18 navy, 4px below): `"היתרים קיימים לחניך: {summary}"`, several joined with `"; "`. Summary format: [overview §3](04_number_restriction_overview.md#3-derived-display-values), e.g. `"16:00-19:00 · עד 15 דק'"` |
| Choose row | Only while choosing (§4.4): a 0.5px line, then a 44px+ row with the text button `"בחירה"` + chevron (pointing left) at the end. Accessible name `"בחירה: {scope label}, {range}"`. On the currently selected restriction (after `"החלפה"`) the row shows `"נבחרה"` + check icon instead, not tappable |

### 3.3 Edit mode – locked number card (instead of block 0)

White card, radius 8, padding 16, thin outline, 24px below the header:

- RecordIcon (open lock, red); next to it the phone number (16/20, LTR) and below it the full type label (14/18 gray): `"היתר למספר מוגבל"` or `"הגבלת מספר"`.
- **Permits only:** a 0.5px line, then `"על הגבלה"` (14/18 gray) and the restriction lines (scope label, then range · reason) as in §3.2.1 lines 1–2.

### 3.4 Block 1 – `"פרטי ההיתר"` (Permit details) / `"פרטי ההגבלה"` (Restriction details)

What, then when – the same order in every action form (decided 2026-10-18):

1. **LimitTypeSelector** – permit config (`"סוג ההיתר"`: `"היתר מלא"` / `"היתר עם הגבלת משך"`) or restriction config (`"סוג ההגבלה"`: `"הגבלה מלאה"` / `"הגבלת משך שיחה"`), stacked with the descriptions from [00 §3.9](../00_foundations.md), DurationField, ErrorText – duration.
2. **FieldIntro** `"טווח תאריכים"` (16px below) with description:
   - Permit: `"ההיתר יחול בתאריכים אלו, בתוך תקופת ההגבלה"` (The permit applies on these dates, within the restriction's period)
   - Restriction: `"ההגבלה תחול בתאריכים אלו בלבד"`
3. **Date pair** – start (`"תאריך התחלה"`), end (`"תאריך סיום"`). Limits in §4.8.
4. ErrorText – dates.

### 3.5 Block 2 – `"הגבלה להיתר"` (Limits on the permit) / `"היתרים להגבלה"` (Permits within the restriction)

1. **Hint** (14/18 gray):
   - Permit (both types): `"ברירת מחדל – פתוח כל היום ובכל המכשירים"` (Default – open all day on all devices)
   - Restriction, `"הגבלה מלאה"`: `"ללא היתרים – חסום לחלוטין. הגדר שעות או מכשירים שבהם מותר לשוחח"`
   - Restriction, `"הגבלת משך שיחה"`: `"ללא הגדרה – מותר כל היום ובכל המכשירים, בהגבלת המשך שנבחרה"`
2. **ConditionAccordion `"שעות מותרות"`** and **`"מכשירים מותרים"`** – identical to the trainee form ([03 form §3.3](../03-trainee-restriction/03_trainee_restriction_form.md#33-block-2--היתרים-להגבלה-permits-within-the-restriction)), including content hints and ErrorText – hours.

### 3.6 Block 3 – `"סיבות והחלטה"`

As in [00 §4.3](../00_foundations.md), with the number reasons list ([00 §6](../00_foundations.md)). All four fields are required, the reason too (decided 2026-10-19).

### 3.7 Footer

StickyActionBar, two columns: outline `"ביטול"` (one step back to the history list, [00 §3.1](../00_foundations.md)) and primary submit `"שמור"`.

### 3.8 Visibility of blocks 1–3

| Situation | Blocks 1–3 |
|---|---|
| Create, restriction | Shown |
| Create, permit, no restriction selected yet | **Hidden** (only block 0 and the footer) |
| Create, permit, restriction selected, picker closed | Shown (fade-in) |
| Create, permit, picker reopened with `"החלפה"` | **Hidden** – the list takes the form. The values in blocks 1–3 are kept (including a file being uploaded) |
| Edit | Shown |

---

## 4. Behavior & states

### 4.1 Initial state

| Item | Create | Edit |
|---|---|---|
| Action type | `"היתר למספר מוגבל"` | From the record, locked |
| Number area | Empty search field (permit) | Locked card (§3.3) |
| Dates | Today / tomorrow, muted (replaced when a restriction is selected) | From the record, not muted |
| Limit type | Option 1 | Option 2 if the record has a duration, else option 1 |
| Minutes | Empty | From the record, no auto-focus |
| Accordions | Closed | Open when they hold values |
| Reasons & decision | Empty | From the record |

### 4.2 Changing the action type (create)

- Selecting the current type does nothing.
- Selecting the other type **resets** to that type's defaults: number input, chips, search results and selected restriction are cleared; dates return to today / tomorrow (muted); limit type → option 1; minutes, hours and devices cleared; accordions closed; **all errors cleared**.
- **Kept:** reason, details, approver, file.

### 4.3 Permit – searching a number

- **Search button enabled** when the input is not blank **and** it is not the number already searched (compared after normalization).
- **Enter** in the field searches, when the button is enabled.
- **On search:**
  1. Normalize the input. Empty → nothing happens.
  2. Invalid → phone error `"מספר טלפון לא תקין"` (Invalid phone number); no lookup.
  3. Valid → run the lookup; remember the number; clear the phone and restriction errors.
  4. **0 results** → the no-results card. **1 result** → selected automatically (§4.5). **2+ results** → the picker opens with nothing selected.
- **Editing the input after a search** (any keystroke): clears the results, the selected restriction and the remembered number; hides the picker and blocks 1–3; clears the phone and restriction errors. Reasons & decision values are kept; the permit details are re-initialized on the next selection.
- **Production addition:** announce the lookup result (the hint or the no-results text) in a polite live region, so screen-reader users know the search finished.

### 4.4 Permit – picker states

| State | Title | Hint | Cards shown | Heading button | Choose row (§3.2.1) |
|---|---|---|---|---|---|
| 1 result (auto-selected) | `"ההגבלה שעליה יחול ההיתר"` (The restriction the permit will apply to) | `"זו ההגבלה היחידה החלה על המספר עבור החניך, ולכן נבחרה"` (This is the only restriction on the number for the trainee, so it was selected) | The one card, selected | – | – |
| 2+ results, none selected | `"בחר את ההגבלה שעליה יחול ההיתר"` (Choose the restriction the permit will apply to) | `"נמצאו {n} הגבלות החלות על המספר עבור החניך"` (Found {n} restrictions on the number for the trainee) | All | – | `"בחירה"` on every card |
| 2+ results, one selected | `"ההגבלה שעליה יחול ההיתר"` | – | **Only the selected card** | `"החלפה"` | – |
| 2+ results, reopened with `"החלפה"` | `"בחר את ההגבלה שעליה יחול ההיתר"` | `"נמצאו {n} הגבלות החלות על המספר עבור החניך"` | All | `"ביטול"` – back to the current selection, nothing changes | `"בחירה"`, and `"נבחרה"` on the current one |

- Card order: national → institute → trainee, then start date ascending ([overview §2.7](04_number_restriction_overview.md#27-which-restrictions-the-permit-lookup-returns)).
- The existing-permits line is information only; it does not block creating another permit ([OQ-12](../../pending-decisions.md#oq-12)).

### 4.5 Permit – selecting a restriction

- `"בחירה"` on a card selects it and collapses the list to that card; focus moves to the picker title, so screen-reader users know the choice was made.
- **`"ביטול"` after `"החלפה"`** only collapses the list back to the current card; nothing is reset.
- **Choosing a different card (or the first selection):**
  - Start date = the later of today and the restriction's start; end date = the restriction's end; dates are not muted.
  - Limit type → `"היתר מלא"`; minutes cleared; hours and devices cleared; accordions closed.
  - Errors cleared: restriction, dates, duration, hours.
  - Reasons & decision are not touched.
  - Blocks 1–3 appear.

### 4.6 `"להגבלת המספר"` (from the no-results card)

- Switches the action type to `"הגבלת מספר"` (with the reset of §4.2 – reason, details, approver and file kept) and adds the searched number as the first chip. The input is empty.

### 4.7 Restriction – numbers

- **`"הוסף"` enabled** when the input is not blank. **Enter** adds.
- **On add:** normalize. Invalid → `"מספר טלפון לא תקין"`. Already a chip → `"המספר כבר נוסף"` (Number already added). Otherwise add a chip and clear the input.
- Typing clears the phone error. A chip's X removes it.
- **On submit, a number still in the input** is added automatically when valid (skipped silently if it is already a chip); when invalid → `"מספר טלפון לא תקין"`.

### 4.8 Dates

| Record | Start picker | End picker |
|---|---|---|
| Permit (create and edit) | `min` = restriction start, `max` = restriction end | `min` = chosen start (or restriction start), `max` = restriction end |
| Restriction | No limits | `min` = start |

- A permit's start can be earlier than today, as long as it is inside the restriction ([OQ-14](../../pending-decisions.md#oq-14)).
- Changing either date clears the dates error.

### 4.9 Limit type, minutes, accordions

Same behavior as the trainee form ([03 form §4.3–4.5](../03-trainee-restriction/03_trainee_restriction_form.md#43-type-selector)), with these differences for a **permit**:

- Option labels and hints are the permit ones.
- Accordion summaries are always "open by default": unset hours → `"כל היום"`, unset devices → `"כל המכשירים"` (never `"לא הוגדרו"`).

### 4.10 Submit (`"שמור"`)

| Situation | Checks |
|---|---|
| Create permit, no search yet | Phone error `"יש להזין מספר ולחפש"` (Enter a number and search). Nothing else is checked |
| Create permit, search returned 0 | Phone error `"יש להזין מספר מוגבל ולחפש"` (Enter a restricted number and search). Nothing else is checked |
| Create permit, results but none selected | Restriction error `"יש לבחור הגבלה"` (Choose a restriction). Nothing else is checked |
| Create permit, restriction selected | All rules in §5. If the picker was reopened with `"החלפה"`, it first collapses back to the selected card, so blocks 1–3 are visible again |
| Create restriction | Pending input (§4.7), at least one number, all rules in §5 |
| Edit | All rules in §5 (no number or restriction checks) |

- An hours error opens the hours accordion.
- **Success:** a permit creates one record; a restriction creates **one record per number** with the same values. Then go one step back to the history list with the first saved record open.
- **Production addition:** after a failed submit, scroll to and focus the first field with an error.

### 4.11 Create based on an ended record

As in [00 §4.2](../00_foundations.md) – reason (matched by name) and details from the record; dates, approver and file new. Per type:

- **Restriction:** type `"הגבלת מספר"`, the number as the first chip (more can be added), limit type, minutes, hours and devices from the record. Dates today / tomorrow, muted.
- **Permit:** type `"היתר למספר מוגבל"`, the number in the search field, and **the search runs immediately**. When the results arrive: if the restriction the ended permit relied on is among them, it is selected; otherwise the usual 0 / 1 / several behavior (§4.3). Whenever a restriction is selected, the permit's limit type, minutes, hours and devices are applied (instead of the reset of §4.5); the dates follow the restriction as usual. Changing the action type drops the copied terms.

---

## 5. Validation

| Slot | Rule | Message | When checked | Cleared when |
|---|---|---|---|---|
| Phone | Valid format | `"מספר טלפון לא תקין"` | On search, on add, on submit (pending input – create restriction only) | Input changes |
| Phone | Not already a chip (restriction) | `"המספר כבר נוסף"` | On add | Input changes |
| Phone | At least one number (create restriction) | `"יש להוסיף לפחות מספר אחד"` (Add at least one number) | Submit | Input changes |
| Phone | A search was run (create permit) | `"יש להזין מספר ולחפש"` | Submit | Input changes; a search runs |
| Phone | The search found restrictions (create permit) | `"יש להזין מספר מוגבל ולחפש"` | Submit | Input changes; a search runs |
| Restriction | One restriction selected (create permit) | `"יש לבחור הגבלה"` | Submit | A restriction is selected; input changes; a search runs |
| Dates | Both dates present | `"יש לבחור תאריך התחלה ותאריך סיום"` | Submit | Either date changes; a restriction is selected |
| Dates | End ≥ start | `"תאריך הסיום לא יכול להיות לפני תאריך ההתחלה"` | Submit | Same |
| Dates | Permit dates inside the restriction | `"תאריכי ההיתר חייבים להיות בתוך תקופת ההגבלה ({DD/MM/YY-DD/MM/YY})"` (Permit dates must be within the restriction's period) | Submit | Same |
| Duration | With option 2: whole number 1–120 | `"יש להזין מספר דקות שלם בין 1 ל-120"` | Submit | Minutes change; limit type changes; a restriction is selected |
| Hours | Both or none | `"יש לבחור שעת התחלה ושעת סיום"` | Submit (opens accordion) | Either time changes; a restriction is selected |
| Hours | End > start | `"שעת הסיום חייבת להיות אחרי שעת ההתחלה"` | Submit (opens accordion) | Same |
| Reason | A reason is chosen (decided 2026-10-19, [00 §4.3](../00_foundations.md)) | `"יש לבחור סיבה"` **(proposed)** | Submit | A reason is chosen |
| Details | Not empty (spaces only count as empty), [00 §4.3](../00_foundations.md) | `"יש להזין פירוט"` **(proposed)** | Submit | The details change |
| Approver | An approver is chosen | `"יש לבחור גורם מאשר"` **(proposed)** | Submit | An approver is chosen |
| File | One file attached | `"יש לצרף קובץ"` | Submit | A file is picked |

- Changing the action type clears all errors.
- Only one message per slot (first failing rule, in table order).

---

## 6. Data & API (`phone-exceptions.schema.ts`)

### 6.1 Field mapping (Separate Payloads for Restriction vs. Permit)

| Form Field | Restriction (`Create` / `UpdateTraineePhoneRestrictionRequest`) | Permit (`Create` / `UpdateTraineePhonePermitRequest`) |
|---|---|---|
| Trainee | `traineeIds: [traineeId]` (create) / `traineeId` (update) | `traineeIds: [traineeId]` (create) / `traineeId` (update) |
| Phone(s) | `phoneNumbers: PhoneString[]` (create) / `phoneNumber` (update) | Derived from `sourceRestrictionId` |
| Selected restriction | – | `sourceRestrictionId: number` |
| Dates | `startDate`, `endDate` | `startDate`, `endDate` |
| Limit type + minutes | `durationMinutes: number \| null` | `durationMinutes: number \| null` |
| Permitted hours | `startTime: TimeString \| null`, `endTime: TimeString \| null` | `startTime: TimeString \| null`, `endTime: TimeString \| null` |
| Permitted devices | `deviceIds: number[]` | `deviceIds: number[]` |
| Reasons & decision | `reason`, `reasonCode`, `details`, `approverId: number`, `approvedFileId: number` | `reason`, `reasonCode`, `details`, `approverId: number`, `approvedFileId: number` |

### 6.3 Server errors → form slots

| `fieldErrors` key | Slot |
|---|---|
| `phoneNumber`, `phoneNumbers` | Phone |
| `sourceRestrictionId` | Restriction |
| `startDate`, `endDate` | Dates |
| `durationMinutes` | Duration |
| `startTime`, `endTime` | Hours (opens the accordion) |
| `deviceIds` | Under the devices accordion row (opens it) |
| `reason`, `reasonCode` | Reason |
| `details` | Details |
| `approverId` | Approver |
| `approvedFileId` | File |
| `409 CONFLICT` when creating a permit | Restriction slot: `"ההגבלה שנבחרה אינה פעילה עוד. יש לחפש שוב"` (The selected restriction is no longer active. Search again) **(proposed)** |

---

## 7. Loading & errors (proposed – not in the prototype)

| State | Behavior |
|---|---|
| Edit – loading / 404 | As in the trainee form ([03 form §7](../03-trainee-restriction/03_trainee_restriction_form.md#7-loading--errors-proposed--not-in-the-prototype)) |
| Searching | `"חיפוש"` disabled until the response arrives |
| Search failed | Phone slot: `"החיפוש נכשל, נסה שוב"` (Search failed, try again) **(proposed)**; the input keeps its value and the button is enabled again |
| File upload, saving, save failure | As in the trainee form |
