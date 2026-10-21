# 05 – Voice message to the recipient – History

Prototype source: `client/pages/VoiceMessageList.tsx` (superseded where this spec differs). Rules and model: [overview.md](05_voice_message_overview.md). Pattern: [00 §4.1](../00_foundations.md).

---

## 1. Purpose & entry points

- Lists the trainee's voice messages (active and ended), one card per record – an all-calls message or one number; search, sort, expand, edit, create.
- **Entry points:** `"הודעה קולית לנמען"` on the actions screen; returning from the form.

---

## 2. Route & parameters

- **Route:** `/trainee/:traineeId/voice-message`
- **`id`:** trainee ID. Unknown trainee → `"החניך לא נמצא"` under the header.
- **After save:** the list reloads and opens the first saved record.

---

## 3. Layout

1. **HistoryHeader** – title `"הודעה קולית לנמען"`; back arrow one step back to the actions screen ([00 §3.1](../00_foundations.md)).
2. **HistoryToolbar** ([00 §3.23](../00_foundations.md))
   - Section title `"היסטוריית הודעות לנמען"` (Messages history).
   - Search field: aria-label `"חיפוש הודעות לנמען"`, placeholder `"חיפוש חופשי"` (Free search; decided 2026-10-21). It still searches the fields of §4.
   - Sort button (aria-label `"מיון"`).
   - Results count ([00 §3.23](../00_foundations.md) row 3): `"מוצגות {n} הודעות"` / `"מוצגת הודעה אחת"` (decided 2026-10-21).
3. **Cards** – one ExpandableRecordCard per record.
4. **EmptyState** – `"לא נמצאו הודעות לנמען"` (No messages found).
5. **StickyActionBar** – primary button `"הוספת הודעה לנמען"` (Add message) + plus icon → `/trainee/{id}/voice-message/new`.

### 3.1 Card – closed

| Part | Content |
|---|---|
| Icon | RecordIcon – microphone, blue |
| Title line (16/20, `text-primary`) | The number (LTR), or `"כל השיחות"` (All calls) |
| Meta line (16/20 gray) | Date range (LTR) + StatusBadge `"פעילה"` / `"הסתיים"` |
| End | Chevron |

### 3.2 Card – open

DetailGrid, two columns (right column first). The number, dates and status are already in the card summary, so they are not repeated:

| Row | Right | Left |
|---|---|---|
| 1 | `"הודעה חוזרת"` (Repeating message) – `"כן"` / `"לא"`, full width | |
| 2 | `"סיבה"` – label or `"לא צוין"` | `"גורם מאשר"` – label or `"לא צוין"` |
| 3 | `"פירוט"` – full width, **only when not empty** | |

Below the grid: outline button `"עריכה"` with edit icon – or, on an ended record, `"יצירת הודעה דומה"` (decided 2026-10-21) with a copy icon (an ended record cannot be edited, [00 §3.22](../00_foundations.md)).

---

## 4. Behavior & states

- **Search** matches the trimmed query (substring) against: the number, or `"כל השיחות"` (all-calls records only), `"הודעה חוזרת"` (repeating records only), reason, details, approver, date range (`DD/MM/YY-DD/MM/YY`), start and end dates (`YYYY-MM-DD`).
- **Sort sheet rows** – the same as the trainee restriction history ([03 history §4](../03-trainee-restriction/03_trainee_restriction_history.md)), including the status rows in the feminine: `"סטטוס: פעילות תחילה"` / `"סטטוס: שהסתיימו תחילה"` (decided 2026-10-21).
- **Empty list** and **no search match** both show `"לא נמצאו הודעות לנמען"`.
- **Loading:** skeleton cards, `"טוען הודעות לנמען…"` **(proposed)**. **Failure:** `"לא ניתן לטעון את ההודעות לנמען"` **(proposed)** + `"טעינה מחדש"` (decided 2026-10-21).
- **Permission:** requires the voice-message permission ([02 §7](../02_child_actions.md)).
- The screen scrolls to the top when opened.

---

## 6. Data & API (`voice-messages.schema.ts`)

| When | Call | Schema |
|---|---|---|
| Every time the screen opens (no client cache); returning from the form | `POST VoiceMessages/GetTraineeVoiceMessages` *(placeholder)* | Request: `GetTraineeVoiceMessagesRequest` (`traineeIds: [traineeId]`)<br>Response: `GetTraineeVoiceMessagesResponse` (`records: TraineeVoiceMessageRecordDto[]`) |

- Search and sort run on the client over `records`.

---

## 8. Desktop (Aviv's container ≥ 1024px)

The history opens in the trainee drawer, in the desktop history pattern of [00 §4.4](../00_foundations.md#44-desktop-history-and-form-in-the-trainee-drawer) (decided 2026-10-19):

- **Top row:** back to the actions, and the action selector showing `"הודעה קולית לנמען"`.
- **Toolbar:**
  - the section title `"היסטוריית הודעות לנמען"`, with the create button `"הוספת הודעה לנמען"` at the end of its row;
  - the search, with this screen's label and placeholder (§3);
  - the `"מיון"` select, with the rows of the history screens ([03 history §4](../03-trainee-restriction/03_trainee_restriction_history.md)).
- **Cards, search, sort, states and permission:** as in §3–§4.
- **Card actions:** `"עריכה"` and `"יצירת הודעה דומה"` open the form as a layer over the history ([form §8](05_voice_message_form.md)).
