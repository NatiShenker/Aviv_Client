# 05 – Voice message ("הודעה קולית") – Overview

Prototype sources: `client/pages/VoiceMessageList.tsx`, `client/pages/VoiceMessageForm.tsx`.

Screens: [history.md](https://www.google.com/search?q=history.md) · [form.md](https://www.google.com/search?q=form.md)

---

## 1. Purpose

Play a fixed identifying message on the trainee's outgoing calls, so the person called knows the call comes from the institute:

> `"שלום, זוהי שיחה מהפנימייה מהחניך {fullName}"` (Hello, this is a call from the institute, from trainee {fullName})

The message plays before each call the trainee makes – on **all calls** or only on calls to **selected numbers** – and can **repeat during the call**.

---

## 2. Business rules

| Rule | Detail |
|---|---|
| Scope | `"בכל השיחות"` (all calls) or `"רק במספרים נבחרים"` (selected numbers only). Selected numbers require at least one number |
| One record per save | Unlike the number restriction, several numbers are saved in **one** voice message record |
| Repeat | `"חזרה במהלך השיחה"` – on / off (default off) |
| Dates | Required; end ≥ start |
| Hours | Optional daily window when the message is active. Both or none; end after start on the same day ([OQ-13](https://www.google.com/search?q=..%2FREADME.md%23oq-13)) |
| Devices | Optional. None selected = **all devices** |
| Direction | Here hours and devices define **when and where the message plays**. They are not permits |
| File | Exactly one, required |
| Status | Active while `endDate >= today`, else ended ([OQ-01](https://www.google.com/search?q=..%2FREADME.md%23oq-01)) |

---

## 4. API

| Method & path | Request Schema | Response Schema | Used by |
|---|---|---|---|
| `GET /api/trainees/{traineeId}/voice-messages` | `GetTraineeVoiceMessagesRequest` (`traineeIds: [traineeId]`) | `GetTraineeVoiceMessagesResponse` (`records: TraineeVoiceMessageRecordDto[]`) | History & Edit cache |
| `POST /api/trainee-voice-messages` | `CreateTraineeVoiceMessageRequest` | `CreateTraineeVoiceMessageResponse` (`MutationResultDto`) | Form, create |
| `PUT /api/trainee-voice-messages/{id}` | `UpdateTraineeVoiceMessageRequest` | `UpdateTraineeVoiceMessageResponse` (`MutationResultDto`) | Form, edit |
