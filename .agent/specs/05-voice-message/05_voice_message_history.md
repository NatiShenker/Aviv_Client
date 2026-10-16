# 05 – Voice message – History

Prototype source: `client/pages/VoiceMessageList.tsx`. Rules and model: [overview.md](overview.md). Pattern: [00 §4.1](../00-foundations.md#41-history-screen).

---

## 1. Purpose & entry points

- Lists the trainee's voice messages (active and ended); search, sort, expand, edit, create.
- **Entry points:** `"הוספת הודעה קולית"` on the actions screen; returning from the form.

---

## 2. Route & parameters

- **Route:** `/child/:id/voice-message`
- **`id`:** trainee ID. Unknown trainee → not-found screen (production).
- **After save (production):** the form passes the saved record ID; the list opens that card, then clears it.

---

## 3. Layout

1. **HistoryHeader** – title `"הודעה קולית"` (Voice message); back arrow to `/child/{id}`.
2. **Toolbar row**
   - Section title `"הסטוריית הודעות קוליות"` (Voice messages history).
   - ToolbarSearch: aria-label `"חיפוש הודעות קוליות"`, placeholder `"חיפוש לפי מספר, סיבה או תאריך"`.
   - Sort button `"מיון"`.
3. **Cards** – one ExpandableRecordCard per voice message.
4. **EmptyState** – `"לא נמצאו הודעות קוליות"` (No voice messages found).
5. **StickyActionBar** – primary link `"הוספת הודעה קולית חדשה"` (Add new voice message) + plus icon → `/child/{id}/voice-message/new`.

### 3.1 Card – closed

| Part | Content |
|---|---|
| Icon | RecordIcon – microphone, blue (`#e0ebff` circle, `#006aff` stroke) |
| Top line (16/20 gray) | Scope summary + StatusBadge `"פעילה"` / `"הסתיים"` |
| Scope summary | All calls → `"כל השיחות"` (All calls). Selected → the first number (LTR), and when there are more, `"+{n}"` (LTR; screen readers hear `"ועוד {n} מספרים"` – and {n} more numbers) |
| Second line | Reason label, or `"ללא סיבה"` |
| End | Chevron |

### 3.2 Card – open

DetailGrid, two columns (right column first):

| Row | Right | Left |
|---|---|---|
| 1 | `"תאריכים"` – range, LTR | `"שעות"` (Hours) – `"HH:mm-HH:mm"` (LTR) when both are set, else `"כל היום"` |
| 2 | `"היקף ההפעלה"` (Activation scope) – `"בכל השיחות"` (On all calls), or the numbers one per line (LTR) | `"חזרה במהלך השיחה"` (Repeat during call) – `"כן"` (Yes) / `"לא"` (No) |
| 3 | `"סיבה"` – label or `"לא צוין"` | `"מכשירים"` (Devices) – labels joined with `", "`, or `"כל המכשירים"` |
| 4 | `"גורם מאשר"` – label or `"לא צוין"` | – |
| 5 | `"פירוט"` – full width, **only when not empty** | |

Below the grid: outline button `"עריכה"` with edit icon.

Note: this card uses the labels `"שעות"` and `"מכשירים"` (not "מותרות/מותרים"), because here they define when the message plays ([overview §2](overview.md#2-business-rules)).

---

## 4. Behavior & states

- **Search** matches the trimmed query (substring) against: `"כל השיחות"` (all-calls records only), each number, reason, details, approver, each device label, date range (`DD/MM/YY-DD/MM/YY`), start and end dates (`YYYY-MM-DD`). Hours are not searchable.
- **Empty list** and **no search match** both show `"לא נמצאו הודעות קוליות"`.
- The screen scrolls to the top when opened.

---

## 6. Data & API (`voice-messages.schema.ts`)

| When | Call | Schema |
|---|---|---|
| Screen opens; returning from the form | `GET /api/trainees/{traineeId}/voice-messages` | Request: `GetTraineeVoiceMessagesRequest` (`traineeIds: [traineeId]`)<br>Response: `GetTraineeVoiceMessagesResponse` (`records: TraineeVoiceMessageRecordDto[]`) |

- Search and sort run on the client over `records`.
