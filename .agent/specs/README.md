# Aviv – Screen Specifications

Development specs for the trainee-calls management app (web, mobile and desktop layouts, Hebrew, RTL). Each file describes one screen or one feature area well enough to build it in the production system without guessing: what is shown, how it behaves, what data it reads and writes, and how to verify it.

---

## 1. Index

| # | File | Covers |
|---|---|---|
| – | [README.md](README.md) | This index and the glossary |
| 00 | [00_foundations.md](00_foundations.md) | Platform, design tokens, shared components, shared patterns, formats, lookup lists, API conventions |
| 01 | [01_children_list.md](01_children_list.md) | Home screen – list of trainees with search, filter, sort |
| 02 | [02_child_actions.md](02_child_actions.md) | Trainee actions screen |
| 03 | [03-trainee-restriction/03_trainee_restriction_overview.md](03-trainee-restriction/03_trainee_restriction_overview.md) | "הגבלות לחניך" – business logic, data model, API, flow |
| 03 | [03-trainee-restriction/03_trainee_restriction_history.md](03-trainee-restriction/03_trainee_restriction_history.md) | Trainee restriction history (records list) |
| 03 | [03-trainee-restriction/03_trainee_restriction_form.md](03-trainee-restriction/03_trainee_restriction_form.md) | Trainee restriction form (create / edit) |
| 04 | [04-number-restriction/04_number_restriction_overview.md](04-number-restriction/04_number_restriction_overview.md) | "הגבלות והיתרים למספר" – business logic, data model, API, flow |
| 04 | [04-number-restriction/04_number_restriction_history.md](04-number-restriction/04_number_restriction_history.md) | Number restrictions & permits history |
| 04 | [04-number-restriction/04_number_restriction_form.md](04-number-restriction/04_number_restriction_form.md) | Number restriction / permit form (create / edit) |
| 05 | [05-voice-message/05_voice_message_overview.md](05-voice-message/05_voice_message_overview.md) | "הודעה קולית לנמען" – purpose, rules, API |
| 05 | [05-voice-message/05_voice_message_history.md](05-voice-message/05_voice_message_history.md) | Voice messages history |
| 05 | [05-voice-message/05_voice_message_form.md](05-voice-message/05_voice_message_form.md) | Voice message form (create / edit) |

**Recommended reading order:** README → 00 → 01 → 02 → 03 (overview → history → form) → 04 (same order) → 05 (same order). Read `00_foundations.md` before any screen file: screen files reference its components by name (e.g. *ConditionAccordion*, *FileField*) instead of repeating them.

---

## 2. Glossary

The same concept has a product name (the UI and the specs), a client name (routes and feature folders) and a server name. Layers that mirror the server (schemas, services, endpoints, mock server) use the server names; the feature and UI layers use the product and client names.

| Concept | UI name | Spec | Route | Feature folder (`src/features`) | Server and schema names |
|---|---|---|---|---|---|
| Trainee ("child" in the sketches) | חניך | 01, 02 | `/trainee/:traineeId` | `trainees-list`, `trainee-actions`, `trainee` | `Trainees/…`, `TraineeListItemDto` |
| Trainee restriction ("block" in the sketches) | הגבלות לחניך | 03 | `/trainee/:traineeId/trainee-restriction` | `trainee-restrictions` | `TraineeRestrictions/…`, `TraineeRestrictionRecordDto` |
| Number restriction or permit ("exception" in the sketches). One record is a "number record": a restriction or a permit | הגבלות והיתרים למספר | 04 | `/trainee/:traineeId/number-restriction` | `number-restrictions` | `PhoneExceptions/…`, `TraineePhoneRecordDto`, `phone-exceptions.schema.ts`; trainee flag group `phoneException` |
| Voice message ("recipient message" in the trainee flags) | הודעה קולית לנמען | 05 | `/trainee/:traineeId/voice-message` | `voice-messages` | `VoiceMessages/…`, `TraineeVoiceMessageRecordDto` |
| Institute ("institution" on the server) | פנימייה | 01 | – | `institutes` | `Institutions/…`, `organization.schema.ts` |
| Wing / location in a wing | אגף / מיקום באגף | 01 | – | – | `WingDto`, `WingLocationDto` |

In the code, every feature folder has `mobile/` and `desktop/` for each layout's composition (screens, histories, form sheets or drawer forms); the parts both layouts use sit beside them ([infrastructure.md](../infrastructure.md) › Folder layout).

---

## 3. Open questions

Open questions live in [pending-decisions.md](../pending-decisions.md), the only registry. The spec questions keep their `OQ-xx` IDs there (for example [OQ-14](../pending-decisions.md#oq-14)), and closed questions stay with their status.
