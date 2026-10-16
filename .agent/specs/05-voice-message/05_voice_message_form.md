# 05 – Voice message – Form

Prototype source: `client/pages/VoiceMessageForm.tsx`. Rules and model: [overview.md](https://www.google.com/search?q=overview.md). Pattern: [00 §4.2](https://www.google.com/search?q=..%2F00-foundations.md%2342-form-screen).

---

## 1. Purpose & entry points

- Create or edit a voice message for the trainee.
- **Create:** `"הוספת הודעה קולית חדשה"` on the history screen. **Edit:** `"עריכה"` in an open history card.

---

## 2. Route & parameters

| Mode | Route | Notes |
|---|---|---|
| Create | `/child/:id/voice-message/new` | |
| Edit | `/child/:id/voice-message/:recordId/edit` | Production: load by ID; 404 → redirect to `/child/:id/voice-message` (replace). Prototype: works only when opened from the list |

- **Unknown trainee:** not-found screen.

---

## 3. Layout

### 3.1 Header

FormHeader – `"הודעה קולית חדשה"` (New voice message) or `"עריכת הודעה קולית"` (Edit voice message); close X (aria-label `"סגירה ללא שמירה"`).

### 3.2 Block 1 – message

1. **Message content box** (24px below the header): radius 8, 1px `#c5cbdd` border, `#f8f9fb` background, padding 16 × 8, 16/20.
   - Line 1 (weight 500): `"תוכן ההודעה:"` (Message content:)
   - Line 2: `"שלום, זוהי שיחה מהפנימייה מהחניך {fullName}"`
2. **Title** `"ההודעה"` (The message), 16px below.
3. **Scope** (16px below): FieldLabel `"היקף ההפעלה"` + `"*"`; ScopeOption radiogroup (10px below, 16px between options) labelled by it:

| Order | Title (bold) | Description |
|---|---|---|
| 1 | `"רק במספרים נבחרים"` (Only on selected numbers) | `"הגדר את המספרים שבהם תופעל ההודעה"` (Set the numbers the message will play on) |
| 2 | `"בכל השיחות"` (On all calls) – **default** | `"לפני כל שיחה שהחניך מבצע"` (Before every call the trainee makes) |

4. **Numbers** (only with `"רק במספרים נבחרים"`, 16px below, fade-in): PhoneNumbersField, hint `"הזן מספר אחד או יותר. ההודעה תופעל רק בשיחות למספרים אלו"` (Enter one or more numbers. The message will play only on calls to these numbers).
5. **Switch** (16px below): `"חזרה במהלך השיחה"` (Repeat during the call), default off.

### 3.3 Block 2 – `"פרטי החלטה"` (Decision details)

1. **FieldIntro** `"טווח תאריכים"` / `"ההודעה תופעל בתאריכים אלו בלבד"` (The message plays on these dates only).
2. **Date pair** – start (`"בחר תאריך"`, `"תאריך התחלה"`), end (`"תאריך סיום"`, `min` = start).
3. ErrorText – dates.
4. **`"אפשרויות נוספות"`** (More options) – text button + chevron, 8px below, `aria-expanded`. When open (fade-in):
   - FieldIntro `"טווח שעות"` (Hours range) / `"ההודעה תופעל בשעות אלו בלבד, בכל יום בטווח התאריכים"` (The message plays only in these hours, every day in the date range); time pair (`"בחר שעה"`, `"שעת התחלה"` / `"שעת סיום"`, clearable); ErrorText – hours (**inside** the open area).
   - FieldIntro (compact) `"מכשירים"` (Devices) / `"ברירת המחדל — ההודעה תופעל בכל המכשירים. בחר מכשירים מסוימים אם צריך"` (By default the message plays on all devices. Pick specific devices if needed); NativeMultiSelect `"בחר מכשיר"`.

This block still uses the single "more options" toggle, not the per-condition accordions of the restriction forms ([OQ-18](https://www.google.com/search?q=..%2FREADME.md%23oq-18)).

### 3.4 Block 3 – `"סיבות והחלטה"`

As in [00 §4.3](https://www.google.com/search?q=..%2F00-foundations.md%2343-reasons--decision-block), with the voice message reasons list ([00 §6](https://www.google.com/search?q=..%2F00-foundations.md%236-lookup-lists-current-prototype-values)).

### 3.5 Footer

StickyActionBar, two columns: outline `"ביטול"` and primary submit `"שמור"`.

---

## 4. Behavior & states

### 4.1 Initial state

| Item | Create | Edit |
|---|---|---|
| Scope | `"בכל השיחות"` | From the record |
| Numbers | None | From the record |
| Repeat | Off | From the record |
| Dates | Today / tomorrow, muted | From the record, not muted |
| `"אפשרויות נוספות"` | Closed | Open if the record has a start time, end time or any device |
| Reasons & decision | Empty | From the record |

All fields are editable in edit mode, including scope and numbers.

### 4.2 Scope

- Choosing `"רק במספרים נבחרים"` shows the numbers field; choosing `"בכל השיחות"` hides it.
- Chips and any text in the input are **kept** while the form is open, so switching back restores them. A message saved with `"בכל השיחות"` is saved **without numbers**.
- Changing the scope clears the numbers error.

### 4.3 Numbers

- Same behavior as the number restriction form ([04 form §4.7](https://www.google.com/search?q=..%2F04-number-restriction%2Fform.md%2347-restriction--numbers)): add with `"הוסף"` or Enter; invalid → `"מספר טלפון לא תקין"`; duplicate → `"המספר כבר נוסף"`; typing clears the error; X on a chip removes it; a valid number left in the input is added on submit.

### 4.4 More options

- Closed by default; open on load when the record has hours or devices; opens automatically when submit finds an hours error.
- The user can always open and close it. Values are kept when closed.
- The hours error is inside the open area: if the user closes it, the error is hidden until it is opened again ([OQ-18](https://www.google.com/search?q=..%2FREADME.md%23oq-18)).
- No devices selected = the message plays on all devices.

### 4.5 Submit (`"שמור"`)

1. Run all rules in §5; with `"רק במספרים נבחרים"` also handle the pending input and require at least one number.
2. Show every error at once; an hours error opens `"אפשרויות נוספות"`.
3. If valid: save (phones = `[]` when `"בכל השיחות"`), then go to the history list (replace) with the record open.
4. **Production addition:** scroll to and focus the first field with an error.

---

## 5. Validation

| Slot | Rule | Message | When checked | Cleared when |
|---|---|---|---|---|
| Numbers | Valid format | `"מספר טלפון לא תקין"` | On add; on submit (pending input) | Input changes; scope changes |
| Numbers | Not already added | `"המספר כבר נוסף"` | On add | Input changes; scope changes |
| Numbers | 1+ number when `"רק במספרים נבחרים"` | `"יש להוסיף לפחות מספר אחד"` | Submit | Input changes; scope changes |
| Dates | Both present | `"יש לבחור תאריך התחלה ותאריך סיום"` | Submit | Either date changes |
| Dates | End ≥ start | `"תאריך הסיום לא יכול להיות לפני תאריך ההתחלה"` | Submit | Either date changes |
| Hours | Both or none | `"יש לבחור שעת התחלה ושעת סיום"` | Submit (opens more options) | Either time changes or is cleared |
| Hours | End > start | `"שעת הסיום חייבת להיות אחרי שעת ההתחלה"` | Submit (opens more options) | Either time changes or is cleared |
| File | One file attached | `"יש לצרף קובץ"` | Submit | A file is picked |

---

## 6. Data & API (`voice-messages.schema.ts`)

### 6.1 Field mapping

| Form Field | Schema Field (`CreateTraineeVoiceMessageRequest` / `UpdateTraineeVoiceMessageRequest`) |
|---|---|
| Trainee | `traineeIds: [traineeId]` (create) / `traineeId: number` (update) |
| `"היקף ההפעלה"` | `scope: "all" \| "selected"` |
| Chips (+ valid pending input) | `phoneNumbers: PhoneString[]` (`[]` when `"בכל השיחות"`) |
| `"חזרה במהלך השיחה"` | `repeatDuringCall: boolean` |
| Dates | `startDate: ISODateString`, `endDate: ISODateString` |
| Hours | `startTime: TimeString \| null`, `endTime: TimeString \| null` |
| Devices | `deviceIds: number[]` |
| Reasons & decision | `reason: string`, `reasonCode?: number`, `details: string`, `approverId: number`, `approvedFileId: number` |

### 6.3 Server errors → form slots

| `fieldErrors` key | Slot |
|---|---|
| `phoneNumbers` | Numbers |
| `startDate`, `endDate` | Dates |
| `startTime`, `endTime` | Hours (opens more options) |
| `deviceIds` | Under the devices list (opens more options) |
| `approvedFileId` | File |
