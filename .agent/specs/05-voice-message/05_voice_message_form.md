# 05 – Voice message to the recipient – Form

Prototype source: `client/pages/VoiceMessageForm.tsx` (superseded where this spec differs). Rules and model: [overview.md](05_voice_message_overview.md). Pattern: [00 §4.2](../00_foundations.md).

---

## 1. Purpose & entry points

- Create a voice message (for all calls, or one per selected number), or edit an existing one.
- **Create:** `"הוספת הודעה לנמען"` on the history screen. **Edit:** `"עריכה"` in an open history card (active or future records only).
- **Create based on an ended record:** `"צור הודעה חדשה על בסיס זו"` in an open card of an ended record (§4.6).

---

## 2. Route & parameters

- **Presentation:** a full-height sheet over the history screen ([00 §2.4](../00_foundations.md)). The route opens and closes it, so browser back closes it too.

| Mode | Route | Notes |
|---|---|---|
| Create | `/trainee/:id/voice-message/new` | |
| Create based on | `/trainee/:id/voice-message/new?basedOn={recordId}` | The source is taken from the loaded history; the form waits for it. Not found → a plain create form |
| Edit | `/trainee/:id/voice-message/:recordId/edit` | The record is taken by ID from the history that is already loaded; the form opens only when it exists and has not ended. Unknown ID (e.g. a record replaced by a newer version) or an ended record → redirect to `/trainee/:id/voice-message` (replace) |

---

## 3. Layout

Information order, as in every action form: **what → when → why and who** (decided 2026-10-18).

### 3.1 Header

FormHeader – `"הודעה לנמען חדשה"` (New message) or `"עריכת הודעה לנמען"` (Edit message); close X (aria-label `"סגירה ללא שמירה"`).

### 3.2 Block 1 – `"ההודעה"` (The message)

1. **Message content box** (read only): `info-box` background, `divider`-strong border, field radius, padding 16 × 8, 16/20.
   - Line 1 (weight 500): `"תוכן ההודעה:"` (Message content:)
   - Line 2: `"שלום, זוהי שיחה מהפנימייה מהחניך {fullName}"`
2. **Create – scope** (16px below): FieldIntro title `"היקף ההפעלה"` (no asterisk – a radio group always has a value) and a stacked RadioGroup with descriptions ([00 §3.8](../00_foundations.md)), the default first:

| Order | Title | Description |
|---|---|---|
| 1 | `"בכל השיחות"` (On all calls) – **default** | `"לפני כל שיחה שהחניך מבצע"` (Before every call the trainee makes) |
| 2 | `"רק במספרים נבחרים"` (Only on selected numbers) | `"הגדר את המספרים שבהם תופעל ההודעה"` (Set the numbers the message will play on) |

3. **Numbers** (only with `"רק במספרים נבחרים"`, 12px below the group, fade-in): PhoneNumbersField, hint `"הזן מספר אחד או יותר. כל מספר יישמר כהודעה נפרדת"` (Enter one or more numbers. Each number is saved as a separate message).
4. **Edit – locked scope card** (instead of 2–3): white card, card radius, thin outline – microphone RecordIcon; next to it the number (LTR) or `"בכל השיחות"`, and below it (14/18 gray) `"רק במספר נבחר"` **(proposed)** or `"לפני כל שיחה שהחניך מבצע"`.

### 3.3 Block 2 – `"פרטי ההודעה"` (Message details)

1. **Switch row** ([00 §3.17](../00_foundations.md)): full width – on the right the label `"הודעה חוזרת"` (Repeating message) with the line `"ההודעה תושמע שוב כל 5 דקות, כל עוד השיחה פעילה"` (The message plays again every 5 minutes while the call is active) under it; the 48×24 switch at the far left. Default off. A switch, not a radio: the choice usually stays off and needs no conscious decision.
2. **Date range** (16px below): FieldIntro `"טווח תאריכים"` / `"ההודעה תופעל בתאריכים אלו בלבד"` (The message plays on these dates only); date pair – start (`"תאריך התחלה"`), end (`"תאריך סיום"`, `min` = start); ErrorText – dates.

### 3.4 Block 3 – `"סיבות והחלטה"`

As in [00 §4.3](../00_foundations.md), with the voice message reasons list ([00 §6](../00_foundations.md)). All four fields are required, the reason too (decided 2026-10-19).

- **Edit:** the record stores the reason's name, so the reason is selected in the list by name.

### 3.5 Footer

StickyActionBar, two columns: outline `"ביטול"` and primary submit `"שמור"` – the same in every form ([OQ-17](../../pending-decisions.md#oq-17), closed).

---

## 4. Behavior & states

### 4.1 Initial state

| Item | Create | Edit |
|---|---|---|
| Scope | `"בכל השיחות"` | Locked card (§3.2.4) |
| Numbers | None | – |
| Repeat | Off | From the record |
| Dates | Today / tomorrow, muted | From the record, not muted |
| Reasons & decision | Empty | From the record |

### 4.2 Scope

- Choosing `"רק במספרים נבחרים"` shows the numbers field and **moves focus into it** – only when the user changed the selection. Choosing `"בכל השיחות"` hides it.
- Chips and any text in the input are **kept** while the form is open, so switching back restores them. A message saved with `"בכל השיחות"` is saved **without numbers**.
- Changing the scope clears the numbers error.

### 4.3 Numbers

- Same behavior as the number restriction form ([04 form §4.7](../04-number-restriction/04_number_restriction_form.md)): add with `"הוסף"` or Enter; invalid → `"מספר טלפון לא תקין"`; duplicate → `"המספר כבר נוסף"`; typing clears the error; X on a chip removes it; a valid number left in the input is added on submit (skipped silently if it is already a chip).

### 4.5 Submit (`"שמור"`)

1. Run all rules in §5; on create with `"רק במספרים נבחרים"` also handle the pending input and require at least one number.
2. Show every error at once, then scroll to and focus the first field with an error.
3. If valid: create (`phoneNumbers` = `[]` with `"בכל השיחות"`) – **one record per number** – or update; then go one step back to the history list with the first saved record open.

### 4.6 Create based on an ended record

As in [00 §4.2](../00_foundations.md): create mode (scope selector, not the locked card) with the record's scope, its number as a chip, and its repeat setting; reason (matched by name) and details from the record; dates today / tomorrow, muted; approver and file empty.

---

## 5. Validation

| Slot | Rule | Message | When checked | Cleared when |
|---|---|---|---|---|
| Numbers | Valid format | `"מספר טלפון לא תקין"` | On add; on submit (pending input) | Input changes; scope changes |
| Numbers | Not already added | `"המספר כבר נוסף"` | On add | Input changes; scope changes |
| Numbers | 1+ number when `"רק במספרים נבחרים"` (create) | `"יש להוסיף לפחות מספר אחד"` | Submit | Input changes; scope changes |
| Dates | Both present | `"יש לבחור תאריך התחלה ותאריך סיום"` | Submit | Either date changes |
| Dates | End ≥ start | `"תאריך הסיום לא יכול להיות לפני תאריך ההתחלה"` | Submit | Either date changes |
| Reason | A reason is chosen (decided 2026-10-19, [00 §4.3](../00_foundations.md)) | `"יש לבחור סיבה"` **(proposed)** | Submit | A reason is chosen |
| Details | Not empty (spaces only count as empty), [00 §4.3](../00_foundations.md) | `"יש להזין פירוט"` **(proposed)** | Submit | The details change |
| Approver | An approver is chosen | `"יש לבחור גורם מאשר"` **(proposed)** | Submit | An approver is chosen |
| File | One file attached | `"יש לצרף קובץ"` | Submit | A file is picked |

Only one message per slot (first failing rule, in table order).

---

## 6. Data & API (`voice-messages.schema.ts`)

### 6.1 Field mapping

| Form Field | Create (`CreateTraineeVoiceMessageRequest`) | Update (`UpdateTraineeVoiceMessageRequest`) |
|---|---|---|
| Trainee | `traineeIds: [traineeId]` | `traineeId` |
| Record replaced | – | `previousId` |
| `"היקף ההפעלה"` | `scope: "all" \| "selected"` | `scope` – locked, as in the record |
| Chips (+ valid pending input) | `phoneNumbers: PhoneString[]` (`[]` with `"בכל השיחות"`); the server creates one record per number | `phoneNumber: PhoneString \| null` – locked, as in the record |
| `"הודעה חוזרת"` | `repeatDuringCall: boolean` | `repeatDuringCall` |
| Dates | `startDate`, `endDate` | `startDate`, `endDate` |
| Reasons & decision | `reason`, `reasonCode?`, `details`, `approverId`, `approvedFileId` | same |

### 6.3 Server errors → form slots

| `fieldErrors` key | Slot |
|---|---|
| `phoneNumber`, `phoneNumbers` | Numbers |
| `startDate`, `endDate` | Dates |
| `reason`, `reasonCode` | Reason |
| `details` | Details |
| `approverId` | Approver |
| `approvedFileId` | File |
| A key whose slot is not shown (the locked number in edit; the numbers with `"בכל השיחות"`) | The general save error `"השמירה נכשלה. נסה שוב"`, together with the errors of the shown slots |

---

## 7. Loading & errors

As in the trainee form ([03 form §7](../03-trainee-restriction/03_trainee_restriction_form.md)): reasons list failure, file uploading / upload failure, saving (submit disabled), 400 → slots (§6.3), other failure → `"השמירה נכשלה. נסה שוב"` **(proposed)** above the footer buttons.
