# 05 – Voice message to the recipient ("הודעה קולית לנמען") – Overview

Prototype sources: `client/pages/VoiceMessageList.tsx`, `client/pages/VoiceMessageForm.tsx`. The prototype predates the decisions of 2026-10-18 below; where they differ, this spec wins.

Screens: [history.md](05_voice_message_history.md) · [form.md](05_voice_message_form.md)

---

## 1. Purpose

Play a fixed identifying message to the person the trainee calls, so they know the call comes from the institute:

> `"שלום, זוהי שיחה מהפנימייה מהחניך {fullName}"` (Hello, this is a call from the institute, from trainee {fullName})

The message plays on **all calls** or only on calls to **selected numbers**. A **repeating message** plays again every 5 minutes while the call is active.

**Naming (decided 2026-10-18):** `"הודעה קולית לנמען"` wherever there is no context (the actions menu, the screen title, the filter group on the children list); `"הודעה לנמען"` inside the screen and the form, where the context is clear.

---

## 2. Business rules

| Rule | Detail |
|---|---|
| Scope | `"בכל השיחות"` (all calls) or `"רק במספרים נבחרים"` (selected numbers only). Selected numbers require at least one number |
| One record per number | Like the number restriction ([04 overview §2.4](../04-number-restriction/04_number_restriction_overview.md)): at creation the user can enter several numbers, and **each number becomes a separate record** with the same dates, repeat setting and decision. An all-calls message is one record without a number (decided 2026-10-18) |
| Edit | Scope and number are locked after creation; each record is edited on its own |
| Repeat | `"הודעה חוזרת"` – on / off (default off). On: the message plays at the start of the call and again **every 5 minutes** while the call is active. The interval is fixed. Off ("regular message"): it plays once, before the call |
| Children list flags | `hasActiveMessage` = an active regular message today; `hasActiveInteractiveMessage` = an active repeating message today ("interactive" in the schema is the repeating message) |
| Dates | Required; end ≥ start |
| Hours / devices | None – the message plays all day on every device within its dates (decided 2026-10-18; the prototype's "אפשרויות נוספות" was removed) |
| Duplicates | Not checked: the same number may have overlapping messages, and a number may have a message while an all-calls message is active ([OQ-23](../../pending-decisions.md#oq-23)) |
| File | Exactly one, required |
| Status | Active while `endDate >= today`, else ended ([OQ-01](../../pending-decisions.md#oq-01)) |

---

## 4. API (`voice-messages.schema.ts` – approximate, see pending-decisions)

| Method & action | Request Schema | Response Schema | Used by |
|---|---|---|---|
| `POST VoiceMessages/GetTraineeVoiceMessages` | `GetTraineeVoiceMessagesRequest` (`traineeIds: [traineeId]`) | `GetTraineeVoiceMessagesResponse` (`records: TraineeVoiceMessageRecordDto[]`) | History & edit |
| `POST VoiceMessages/CreateTraineeVoiceMessage` | `CreateTraineeVoiceMessageRequest` (one record per number in `phoneNumbers[]`) | `CreateTraineeVoiceMessageResponse` (`MutationResultDto`) | Form, create |
| `PUT VoiceMessages/UpdateTraineeVoiceMessage` | `UpdateTraineeVoiceMessageRequest` (locked `scope` + `phoneNumber` sent as in the record) | `UpdateTraineeVoiceMessageResponse` (`MutationResultDto`) | Form, edit |
| `GET Lookups/GetVoiceMessageReasons` | – | `LookupItem<number>[]` | Form, reasons list |

Action names are placeholders until the service defines them ([00 §7](../00_foundations.md)).
