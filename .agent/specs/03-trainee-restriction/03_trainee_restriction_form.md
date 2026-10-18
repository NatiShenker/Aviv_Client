# 03 – Trainee restriction – Form

Prototype source: `client/pages/BlockForm.tsx`. Business rules and model: [overview.md](https://www.google.com/search?q=overview.md). Pattern: [00 §4.2](https://www.google.com/search?q=..%2F00-foundations.md%2342-form-screen).

---

## 1. Purpose & entry points

- Create a new trainee restriction, or edit an existing one.
- **Create:** `"הגבלה חדשה"` on the history screen.
- **Edit:** `"עריכה"` inside an open history card.

---

## 2. Route & parameters

- **Presentation:** a full-height bottom sheet over the history screen ([00 §2.4](../00_foundations.md)). The route opens and closes it, so browser back closes it too. Close goes one step back in history ([00 §3.1](../00_foundations.md)).

| Mode | Route | Notes |
|---|---|---|
| Create | `/child/:id/block/new` | |
| Edit | `/child/:id/block/:recordId/edit` | The record is taken by ID from the history that is already loaded; the form opens only when it exists. Unknown ID (e.g. a record replaced by a newer version) → redirect to `/child/:id/block` (replace). A direct URL starts at the app start ([00 §1](../00_foundations.md)) |

---

## 3. Layout

Top to bottom. Spacing: 24px from header to the first block; 16px from a block title to its first item; 8px between a FieldIntro and its inputs.

### 3.1 Header

FormHeader – title `"הגבלה חדשה"` (create) or `"עריכת הגבלה"` (Edit restriction); close X (aria-label `"סגירה ללא שמירה"`) → history list.

### 3.2 Block 1 – `"פרטי ההגבלה"` (Restriction details)

1. **FieldIntro** `"טווח תאריכים"` (Date range) / `"ההגבלה תחול בתאריכים אלו בלבד"` (The restriction applies on these dates only).
2. **Date pair** (PickerInput × 2): start (label `"בחר תאריך"`, aria-label `"תאריך התחלה"`), end (no label, aria-label `"תאריך סיום"`, `min` = start date). Placeholder `"--/--/--"`.
3. ErrorText – dates.
4. **LimitTypeSelector – restriction** (16px below), see [00 §3.9](https://www.google.com/search?q=..%2F00-foundations.md%2339-limittypeselector):
   - FieldIntro `"סוג ההגבלה"` (Restriction type) + hint by selection
   - ErrorText – duration.

### 3.3 Block 2 – `"היתרים להגבלה"` (Permits within the restriction)

1. **Hint** (14/18 gray, 4px below the title), by the selected type:
   - `"הגבלה מלאה"` → `"ללא היתרים – חסום לחלוטין. הגדר שעות או מכשירים שבהם מותר לשוחח"` (No permits – fully blocked. Set hours or devices when calls are allowed)
   - `"הגבלת משך שיחה"` → `"ללא הגדרה – מותר כל היום ובכל המכשירים, בהגבלת המשך שנבחרה"` (Nothing set – allowed all day on all devices, within the chosen duration)
2. **ConditionAccordion `"שעות מותרות"`** (Permitted hours), 8px below:
   - Row summary: see §4.5.
   - Content: hint 12/15 `"השיחות יותרו רק בשעות אלו, בכל יום בטווח התאריכים"` (Calls will be allowed only in these hours, every day in the date range); time pair (8px below): start (label `"בחר שעה"`, aria-label `"שעת התחלה"`), end (aria-label `"שעת סיום"`), placeholder `"--:--"`, both clearable.
   - ErrorText – hours (at the bottom of the accordion, visible open or closed).
3. **ConditionAccordion `"מכשירים מותרים"`** (Permitted devices):
   - Row summary: see §4.5.
   - Content: hint 12/15 `"השיחות יותרו רק מהמכשירים שנבחרו"` (Calls will be allowed only from the selected devices); NativeMultiSelect `"בחר מכשיר"` with the devices list.

### 3.4 Block 3 – `"סיבות והחלטה"` (Reasons & decision)

As in [00 §4.3](https://www.google.com/search?q=..%2F00-foundations.md%2343-reasons--decision-block), with the trainee-restriction reasons list ([00 §6](https://www.google.com/search?q=..%2F00-foundations.md%236-lookup-lists-current-prototype-values)). Reason and approver are required here. The approver field (MFE + selected-approver card with `"החלפה"`) and the file field (`IpsFileUpload` + attached-file row) are described in 00 §4.3.

- **Edit:** the record stores the reason's name, so the reason is selected in the list by name ([pending-decisions](../../pending-decisions.md)).

### 3.5 Footer

StickyActionBar with one full-width primary submit button `"שמור הגבלה"` (Save restriction) – in both modes ([OQ-17](https://www.google.com/search?q=..%2FREADME.md%23oq-17)).

---

## 4. Behavior & states

### 4.1 Initial state

| Item | Create | Edit |
|---|---|---|
| Title | `"הגבלה חדשה"` | `"עריכת הגבלה"` |
| Dates | Today / tomorrow, **muted** | From the record, not muted |
| Type | `"הגבלה מלאה"` | `"הגבלת משך שיחה"` if the record has a duration, else `"הגבלה מלאה"` |
| Minutes | Empty | The record's minutes. **No auto-focus** |
| Hours accordion | Closed | Open if the record has a start or end time |
| Devices accordion | Closed | Open if the record has at least one device |
| Reasons & decision | Empty | From the record |
| Errors | None | None |

The screen scrolls to the top on open.

### 4.2 Dates

- A muted default date turns to normal color once the user changes it.
- The end-date picker cannot go before the start date (`min`). The start date has no minimum ([OQ-14](https://www.google.com/search?q=..%2FREADME.md%23oq-14)).
- Start = end is allowed (one-day restriction).
- Changing either date clears the dates error.

### 4.3 Type selector

- Switching to `"הגבלת משך שיחה"`: the DurationField fades in and receives focus; the type hint, the block 2 hint and both accordion summaries update immediately (before any minutes are typed).
- Switching back to `"הגבלה מלאה"`: the field hides; its value is kept in case the user switches again, but the record is saved **without** a duration.
- Changing the type clears the duration error.

### 4.5 Permits block accordions

**Row summaries** (update live):

| Row | Value |
|---|---|
| `"שעות מותרות"` | If a start **or** end time is set: `"{start}-{end}"` (LTR), with `"--:--"` for a missing side, e.g. `16:00---:--`. Otherwise `"כל היום"` when open by default, else `"לא הוגדרו"` |
| `"מכשירים מותרים"` | 1 device → its label; 2+ → `"{n} מכשירים"`; none → `"כל המכשירים"` when open by default, else `"לא הוגדרו"` |

**Open by default** (in the form) = type is `"הגבלת משך שיחה"`, **or** both hours are set, **or** at least one device is selected ([overview §3.2](https://www.google.com/search?q=overview.md%2332-open-by-default-rule)).

**Content behavior:**

- Changing or clearing either time clears the hours error.

### 4.7 Submit (`"שמור הגבלה"`)

1. Run all rules in §5 and show every error at once.
2. If there is an hours error, open the hours accordion.
3. If there are errors, stop (nothing is saved).
4. Otherwise build the input (`CreateTraineeRestrictionRequest` / `UpdateTraineeRestrictionRequest`): `durationMinutes` = the minutes when the type is `"הגבלת משך שיחה"`, else `null`; `startTime` / `endTime` = `null` when both times are empty.
5. Create (`POST`) or update (`PUT`), then go to the history list (replace) with the saved record open.

**Production addition:** after a failed submit, scroll to and focus the first field with an error.

### 4.8 Close

- The header X goes to the history list (replace) without saving or confirming ([OQ-16](https://www.google.com/search?q=..%2FREADME.md%23oq-16)).

---

## 5. Validation

All rules run on submit.

| Slot | Rule | Message | Cleared when |
|---|---|---|---|
| Dates | Both dates present | `"יש לבחור תאריך התחלה ותאריך סיום"` (Pick a start date and an end date) | Either date changes |
| Dates | End date ≥ start date | `"תאריך הסיום לא יכול להיות לפני תאריך ההתחלה"` (End date can't be before start date) | Either date changes |
| Duration | Only with `"הגבלת משך שיחה"`: whole number 1–120 | `"יש להזין מספר דקות שלם בין 1 ל-120"` (Enter a whole number of minutes between 1 and 120) | Minutes change, or the type changes |
| Hours | Both times or none | `"יש לבחור שעת התחלה ושעת סיום"` (Pick a start time and an end time) | Either time changes or is cleared |
| Hours | End time > start time | `"שעת הסיום חייבת להיות אחרי שעת ההתחלה"` (End time must be after start time) | Either time changes or is cleared |
| Reason | A reason is chosen (`CODE_RESTRICTION`, [00 §4.3](../00_foundations.md)) | `"יש לבחור סיבה"` **(proposed)** | A reason is chosen |
| Approver | An approver is chosen | `"יש לבחור גורם מאשר"` **(proposed)** | An approver is chosen |
| File | One file attached | `"יש לצרף קובץ"` (A file must be attached) | A file is attached |

Only one message per slot is shown (the first failing rule). Details and devices have no rules. Reason and approver are required (decided 2026-10-18, closing this part of [OQ-15](https://www.google.com/search?q=..%2FREADME.md%23oq-15)).

---

## 6. Data & API (`trainee-restrictions.schema.ts`)

### 6.1 Field mapping

| Form field | Schema field (`CreateTraineeRestrictionRequest` / `UpdateTraineeRestrictionRequest`) |
|---|---|
| Trainee | `traineeIds: [traineeId]` (create) / `traineeId: number` (update) |
| Start / end date | `startDate` / `endDate` (`ISODateString`) |
| Type + minutes | `durationMinutes: number \| null` (`null` for `"הגבלה מלאה"`) |
| Start / end time | `startTime: TimeString \| null`, `endTime: TimeString \| null` |
| Devices | `deviceIds: number[]` |
| `"סיבה/הערה"` | `reason: string`, `reasonCode?: number` |
| `"פירוט"` | `details: string` |
| `"גורם מאשר"` | `approverId: number` (selected via 3rd-party Approver MFE) |
| `"צירוף קובץ"` | `approvedFileId: number` (uploaded directly to SharePoint) |

### 6.3 Server errors → form slots

| `fieldErrors` key | Slot |
|---|---|
| `startDate`, `endDate` | Dates |
| `durationMinutes` | Duration |
| `startTime`, `endTime` | Hours (also opens the hours accordion) |
| `deviceIds` | Shown under the devices accordion row (opens it) |
| `approvedFileId` | File |

---

## 7. Loading & errors (proposed – not in the prototype)

| State | Behavior |
|---|---|
| Edit – loading the record | Header is shown; blocks render once the record arrives |
| Edit – 404 | Redirect to the history list |
| Lookups failed | The affected select shows only its placeholder; submit still works for fields that do not need it |
| File uploading | The field shows the file name; submit waits for the upload to finish |
| File upload failed | The field clears; file slot shows `"העלאת הקובץ נכשלה, נסה שוב"` (File upload failed, try again) **(proposed)** |
| Saving | Submit button disabled until the response arrives (prevents double save) |
| Save failed – 400 | Map `fieldErrors` to slots (§6.3) |
| Save failed – other | ErrorText above the submit button inside the footer: `"השמירה נכשלה. נסה שוב"` (Saving failed. Try again) **(proposed)**; all values stay |

---

## 9. Acceptance criteria

1. **Given** create mode, **then** the title is `"הגבלה חדשה"`, the dates are today and tomorrow in gray, the type is `"הגבלה מלאה"` with hint `"השיחות חסומות, למעט ההיתרים שיוגדרו למטה"`, the block 2 hint is `"ללא היתרים – חסום לחלוטין. הגדר שעות או מכשירים שבהם מותר לשוחח"`, and both accordions are closed showing `"לא הוגדרו"`.
2. **When** the user selects `"הגבלת משך שיחה"`, **then** the minutes field appears and is focused, the hint becomes `"השיחות מותרות, עד משך מרבי לכל שיחה"`, the block 2 hint becomes `"ללא הגדרה – מותר כל היום ובכל המכשירים, בהגבלת המשך שנבחרה"`, and the summaries become `"כל היום"` and `"כל המכשירים"`.
3. **Given** `"הגבלת משך שיחה"` with empty minutes, **when** the user saves, **then** `"יש להזין מספר דקות שלם בין 1 ל-120"` is shown and nothing is saved.
4. **Given** minutes `"0"` or `"121"`, **when** the user saves, **then** the same duration error is shown.
5. **When** the user types letters in the minutes field, **then** they do not appear.
6. **Given** minutes `"15"`, **when** the user switches to `"הגבלה מלאה"` and back, **then** `"15"` is still there.
7. **Given** minutes `"15"` and type `"הגבלה מלאה"`, **when** saved, **then** the record has no duration and its card shows `"הגבלה מלאה"`.
8. **Given** only a start time, **when** the user saves, **then** the hours accordion opens and shows `"יש לבחור שעת התחלה ושעת סיום"`.
9. **Given** an hours error, **when** the user closes the hours accordion, **then** the error stays visible under the accordion row.
10. **Given** start 18:00 and end 16:00, **when** the user saves, **then** `"שעת הסיום חייבת להיות אחרי שעת ההתחלה"` is shown.
11. **Given** type `"הגבלה מלאה"`, **when** the user sets hours 16:00–18:00, **then** the hours summary shows `16:00-18:00` and the devices summary changes from `"לא הוגדרו"` to `"כל המכשירים"`.
12. **When** the user selects one device, **then** the devices summary shows its name; with two devices it shows `"2 מכשירים"`.
13. **Given** no file, **when** the user saves, **then** `"יש לצרף קובץ"` is shown; **when** a file is picked, **then** the error disappears and the file name is shown.
14. **Given** an end date before the start date (possible only by editing the start date afterwards), **when** saved, **then** `"תאריך הסיום לא יכול להיות לפני תאריך ההתחלה"` is shown.
15. **Given** a valid form, **when** the user saves, **then** the history list opens with the new record open and its details match the form.
16. **Given** edit of a record with 15 minutes and hours 16:00–18:00, **then** the title is `"עריכת הגבלה"`, the type is `"הגבלת משך שיחה"`, the minutes show `15` without focus, the hours accordion is open and the devices accordion is closed.
17. **When** the user taps the header X, **then** the history list opens and nothing is saved.
18. **Given** an edit URL for an unknown record, **then** the user is redirected to the history list.
