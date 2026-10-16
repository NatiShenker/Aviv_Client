# 04 – Number restriction / permit – Form

Prototype source: `client/pages/ExceptionForm.tsx`. Business rules and model: [overview.md](https://www.google.com/search?q=overview.md). Pattern: [00 §4.2](https://www.google.com/search?q=..%2F00-foundations.md%2342-form-screen).

---

## 1. Purpose & entry points

- **Create** a permit for a restricted number, or a restriction on one or more numbers.
- **Edit** an existing permit or restriction (dates, conditions, decision – not the type, number or underlying restriction).
- **Create:** `"הוספת הגבלה/היתר"` on the history screen. **Edit:** `"עריכה"` in an open history card.

---

## 2. Route & parameters

| Mode | Route | Notes |
|---|---|---|
| Create | `/child/:id/exception/new` | Opens on type `"היתר למספר מוגבל"` |
| Edit | `/child/:id/exception/:recordId/edit` | Production: load by ID; 404 → redirect to `/child/:id/exception` (replace). Prototype: works only when opened from the list |

---

## 3. Layout

### 3.1 Header

FormHeader – title:

| Mode | Permit | Restriction |
|---|---|---|
| Create | `"היתר חדש"` (New permit) | `"הגבלה חדשה"` (New restriction) |
| Edit | `"עריכת היתר"` (Edit permit) | `"עריכת הגבלה"` (Edit restriction) |

The create title follows the action type selected below. Close X (aria-label `"סגירה ללא שמירה"`).

### 3.2 Block 0 (create only) – `"סוג הפעולה"` (Action type)

1. **Title** `"סוג הפעולה"` (`h2`).
2. **Radio** (16px below), labelled by the title: `"היתר למספר מוגבל"` (default) · `"הגבלת מספר"`.
3. **Number field** (13px below), by type:

| Type | Component | Hint | Button |
|---|---|---|---|
| Permit | PhoneSearchField | `"הזן את המספר המלא כדי לאתר את ההגבלות החלות עליו עבור החניך"` (Enter the full number to find the restrictions that apply to it for this trainee) | `"חיפוש"` + search icon |
| Restriction | PhoneNumbersField | `"הזן מספר אחד או יותר. כל מספר יישמר כהגבלה נפרדת"` (Enter one or more numbers. Each number is saved as a separate restriction) | `"הוסף"` + plus icon |

4. **Permit lookup result** (16px below the number field, fade-in) – one of:
   - **No results card** (white card, radius 8, padding 16, thin outline):
     - Text (14/18): `"לא נמצאו הגבלות פעילות על המספר עבור החניך – המספר פתוח ואין צורך בהיתר"` (No active restrictions on this number for the trainee – the number is open and no permit is needed).
     - Link button (8px below, 14/18, `action` color, chevron pointing left): `"להגבלת המספר"` (Restrict the number).
   - **Restriction picker:**
     - Heading row (22px): title (14/18) at the start; `"החלפה"` (Change) text button (14/18, `action`) at the end, when shown (§4.4).
     - Hint (12/15 gray), when shown (§4.4).
     - Cards (8px below, 8px apart) in a radiogroup labelled by the title – **RestrictionOption** (§3.2.1).
     - ErrorText – restriction.

#### 3.2.1 RestrictionOption card

White card, radius 8, padding 16; outline 1px `action` when selected, 0.5px `divider` otherwise. The whole card is the radio label.

| Part | Content |
|---|---|
| Radio | RadioDot, aligned with the first line |
| Line 1 | Scope label (16/20, weight 500): `"הגבלה ארצית"` / `"הגבלת פנימייה – {institute}"` / `"הגבלה לחניך"` |
| Line 2 | (14/18 gray, 4px below) date range (LTR) + `" · "` + reason, or `"ללא סיבה"` |
| Line 3 | Only when this trainee has existing permits on it (14/18 navy, 4px below): `"היתרים קיימים לחניך: {summary}"`, several joined with `"; "`. Summary format: [overview §3](https://www.google.com/search?q=overview.md%233-derived-display-values), e.g. `"16:00-19:00 · עד 15 דק'"` |

### 3.3 Edit mode – locked number card (instead of block 0)

White card, radius 8, padding 16, thin outline, 24px below the header:

- RecordIcon (open lock, red); next to it the phone number (16/20, LTR) and below it the full type label (14/18 gray): `"היתר למספר מוגבל"` or `"הגבלת מספר"`.
- **Permits only:** a 0.5px line, then `"על הגבלה"` (14/18 gray) and the restriction lines (scope label, then range · reason) as in §3.2.1 lines 1–2.

### 3.4 Block 1 – `"פרטי ההיתר"` (Permit details) / `"פרטי ההגבלה"` (Restriction details)

1. **FieldIntro** `"טווח תאריכים"` with description:
   - Permit: `"ההיתר יחול בתאריכים אלו, בתוך תקופת ההגבלה"` (The permit applies on these dates, within the restriction's period)
   - Restriction: `"ההגבלה תחול בתאריכים אלו בלבד"`
2. **Date pair** – start (`"בחר תאריך"`, `"תאריך התחלה"`), end (`"תאריך סיום"`). Limits in §4.8.
3. ErrorText – dates.
4. **LimitTypeSelector** – permit config (`"סוג ההיתר"`: `"היתר מלא"` / `"היתר עם הגבלת משך"`) or restriction config (`"סוג ההגבלה"`: `"הגבלה מלאה"` / `"הגבלת משך שיחה"`), with the hints from [00 §3.9](https://www.google.com/search?q=..%2F00-foundations.md%2339-limittypeselector), DurationField, ErrorText – duration.

### 3.5 Block 2 – `"הגבלה להיתר"` (Limits on the permit) / `"היתרים להגבלה"` (Permits within the restriction)

1. **Hint** (14/18 gray):
   - Permit (both types): `"ברירת מחדל – פתוח כל היום ובכל המכשירים"` (Default – open all day on all devices)
   - Restriction, `"הגבלה מלאה"`: `"ללא היתרים – חסום לחלוטין. הגדר שעות או מכשירים שבהם מותר לשוחח"`
   - Restriction, `"הגבלת משך שיחה"`: `"ללא הגדרה – מותר כל היום ובכל המכשירים, בהגבלת המשך שנבחרה"`
2. **ConditionAccordion `"שעות מותרות"`** and **`"מכשירים מותרים"`** – identical to the trainee form ([03 form §3.3](https://www.google.com/search?q=..%2F03-trainee-restriction%2Fform.md%2333-block-2--%D7%94%D7%99%D7%AA%D7%A8%D7%99%D7%9D-%D7%9C%D7%94%D7%92%D7%91%D7%9C%D7%94-permits-within-the-restriction)), including content hints and ErrorText – hours.

### 3.6 Block 3 – `"סיבות והחלטה"`

As in [00 §4.3](https://www.google.com/search?q=..%2F00-foundations.md%2343-reasons--decision-block), with the number reasons list ([00 §6](https://www.google.com/search?q=..%2F00-foundations.md%236-lookup-lists-current-prototype-values)).

### 3.7 Footer

StickyActionBar, two columns: outline `"ביטול"` (link to the history list, replace) and primary submit `"שמור"`.

### 3.8 Visibility of blocks 1–3

| Situation | Blocks 1–3 |
|---|---|
| Create, restriction | Shown |
| Create, permit, no restriction selected yet | **Hidden** (only block 0 and the footer) |
| Create, permit, restriction selected | Shown (fade-in) |
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

| State | Title | Hint | Cards shown | `"החלפה"` |
|---|---|---|---|---|
| 1 result (auto-selected) | `"ההגבלה שעליה יחול ההיתר"` (The restriction the permit will apply to) | `"זו ההגבלה היחידה החלה על המספר עבור החניך, ולכן נבחרה"` (This is the only restriction on the number for the trainee, so it was selected) | The one card, selected | No |
| 2+ results, none selected | `"בחר את ההגבלה שעליה יחול ההיתר"` (Choose the restriction the permit will apply to) | `"נמצאו {n} הגבלות החלות על המספר עבור החניך"` (Found {n} restrictions on the number for the trainee) | All, none selected | No |
| 2+ results, one selected | `"ההגבלה שעליה יחול ההיתר"` | – | **Only the selected card** | Yes |
| 2+ results, reopened with `"החלפה"` | `"בחר את ההגבלה שעליה יחול ההיתר"` | `"נמצאו {n} הגבלות החלות על המספר עבור החניך"` | All, current one selected | No |

- Card order: national → institute → trainee, then start date ascending ([overview §2.7](https://www.google.com/search?q=overview.md%2327-which-restrictions-the-permit-lookup-returns)).
- The existing-permits line is information only; it does not block creating another permit ([OQ-12](https://www.google.com/search?q=..%2FREADME.md%23oq-12)).

### 4.5 Permit – selecting a restriction

- Selecting a card collapses the list to that card.
- **Selecting the card that is already selected** only collapses the list; nothing is reset.
- **Selecting a different card (or the first selection):**
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

- A permit's start can be earlier than today, as long as it is inside the restriction ([OQ-14](https://www.google.com/search?q=..%2FREADME.md%23oq-14)).
- Changing either date clears the dates error.

### 4.9 Limit type, minutes, accordions

Same behavior as the trainee form ([03 form §4.3–4.5](https://www.google.com/search?q=..%2F03-trainee-restriction%2Fform.md%2343-type-selector)), with these differences for a **permit**:

- Option labels and hints are the permit ones.
- Accordion summaries are always "open by default": unset hours → `"כל היום"`, unset devices → `"כל המכשירים"` (never `"לא הוגדרו"`).

### 4.10 Submit (`"שמור"`)

| Situation | Checks |
|---|---|
| Create permit, no search yet | Phone error `"יש להזין מספר ולחפש"` (Enter a number and search). Nothing else is checked |
| Create permit, search returned 0 | Phone error `"יש להזין מספר מוגבל ולחפש"` (Enter a restricted number and search). Nothing else is checked |
| Create permit, results but none selected | Restriction error `"יש לבחור הגבלה"` (Choose a restriction). Nothing else is checked |
| Create permit, restriction selected | All rules in §5 |
| Create restriction | Pending input (§4.7), at least one number, all rules in §5 |
| Edit | All rules in §5 (no number or restriction checks) |

- An hours error opens the hours accordion.
- **Success:** a permit creates one record; a restriction creates **one record per number** with the same values. Then go to the history list (replace) with the first saved record open.
- **Production addition:** after a failed submit, scroll to and focus the first field with an error.

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
| `approvedFileId` | File |
| `409 CONFLICT` on a permit | Restriction slot: `"ההגבלה שנבחרה אינה פעילה עוד. יש לחפש שוב"` (The selected restriction is no longer active. Search again) **(proposed)** |

---

## 7. Loading & errors (proposed – not in the prototype)

| State | Behavior |
|---|---|
| Edit – loading / 404 | As in the trainee form ([03 form §7](https://www.google.com/search?q=..%2F03-trainee-restriction%2Fform.md%237-loading--errors-proposed--not-in-the-prototype)) |
| Searching | `"חיפוש"` disabled until the response arrives |
| Search failed | Phone slot: `"החיפוש נכשל, נסה שוב"` (Search failed, try again) **(proposed)**; the input keeps its value and the button is enabled again |
| File upload, saving, save failure | As in the trainee form |
