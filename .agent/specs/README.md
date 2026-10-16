# Aviv – Screen Specifications

Development specs for the trainee-calls management app (mobile web, Hebrew, RTL). Each file describes one screen or one feature area well enough to build it in the production system without guessing: what is shown, how it behaves, what data it reads and writes, and how to verify it.
---

## 1. Index

| # | File | Covers |
|---|---|---|
| – | [README.md](README.md) | This index, glossary, prototype vs production, all open questions |
| 00 | [00-foundations.md](00-foundations.md) | Platform, design tokens, shared components, shared patterns, formats, lookup lists, API conventions |
| 01 | [01-children-list.md](01-children-list.md) | Home screen – list of trainees with search, filter, sort |
| 02 | [02-child-actions.md](02-child-actions.md) | Trainee actions screen |
| 03 | [03-trainee-restriction/overview.md](03-trainee-restriction/overview.md) | "הגבלה/היתר לחניך" – business logic, data model, API, flow |
| 03 | [03-trainee-restriction/history.md](03-trainee-restriction/history.md) | Trainee restriction history (records list) |
| 03 | [03-trainee-restriction/form.md](03-trainee-restriction/form.md) | Trainee restriction form (create / edit) |
| 04 | [04-number-restriction/overview.md](04-number-restriction/overview.md) | "הגבלה/היתר למספר" – business logic, data model, API, flow |
| 04 | [04-number-restriction/history.md](04-number-restriction/history.md) | Number restrictions & permits history |
| 04 | [04-number-restriction/form.md](04-number-restriction/form.md) | Number restriction / permit form (create / edit) |
| 05 | [05-voice-message/overview.md](05-voice-message/overview.md) | "הודעה קולית" – purpose, data model, API |
| 05 | [05-voice-message/history.md](05-voice-message/history.md) | Voice messages history |
| 05 | [05-voice-message/form.md](05-voice-message/form.md) | Voice message form (create / edit) |

**Recommended reading order:** README → 00 → 01 → 02 → 03 (overview → history → form) → 04 (same order) → 05 (same order). Read `00-foundations.md` before any screen file: screen files reference its components by name (e.g. *ConditionAccordion*, *FileField*) instead of repeating them.

---

## 4. Open questions (all)

Each item is also listed in the relevant file's "Open questions" section.

| ID | Question | Files |
|---|---|---|
| <a id="oq-01"></a>OQ-01 | **Future records show as active.** Status is derived only from the end date, so a record that starts tomorrow shows "פעילה"/"פעיל". Add a "future" status (e.g. "עתידית")? | 03, 04, 05 history |
| <a id="oq-02"></a>OQ-02 | **No cancellation.** Records cannot be cancelled or deleted in this version (the DB concept includes cancellation with a cancellation file). In scope for a later version? | 03, 04, 05 |
| <a id="oq-03"></a>OQ-03 | **Terminology on the children list.** The filter chip says "חסום" (blocked) while the card badge says "מוגבל עד …" (restricted until). Align to "מוגבל"? Also define what makes a trainee "restricted" (proposed: an active trainee restriction today, with `restrictedUntil` = its end date). | 01 |
| <a id="oq-06"></a>OQ-06 | **Search by number** works only because the personal number is embedded in the name string ("יוסי כהן \| 012453"). Production should search name and personal number as separate fields. Confirm the display format. | 01 |
| <a id="oq-07"></a>OQ-07 | **Children list fields.** Which date does the card show (last call?). The "זמן שהייה" (time of stay) sort uses the minutes value – is that the intended meaning? | 01 |
| <a id="oq-08"></a>OQ-08 | **"הסטורית דקות"** (minutes history) on the actions screen has no destination. Define the screen or hide the row. Also note the spelling differs from "הסטוריית" used elsewhere. | 02 |
| <a id="oq-11"></a>OQ-11 | **Permit after its restriction changes.** A permit stores a snapshot of its restriction. What happens when the restriction is shortened, extended or cancelled in "חוסאם"? Should the permit end automatically? | 04 |
| <a id="oq-12"></a>OQ-12 | **Overlapping permits** on the same restriction are not validated. Allowed? | 04 |
| <a id="oq-13"></a>OQ-13 | **Overnight hours** (e.g. 22:00–02:00) are rejected: end time must be after start time on the same day. Confirm. | 03, 04, 05 form |
| <a id="oq-14"></a>OQ-14 | **Past dates.** Create forms allow a start date in the past (no minimum), and ended records can be edited. Confirm both. | 03, 04, 05 form |
| <a id="oq-15"></a>OQ-15 | **Reasons & decision fields.** Reason and approver are optional, and their placeholders read "הכל" (All), which reads like a filter. Keep as is, or make approver required and change the placeholder? | 03, 04, 05 form |
| <a id="oq-16"></a>OQ-16 | **Discarding changes.** Closing a form ("X" / "ביטול") leaves without confirmation, even with unsaved changes. Add a confirmation? | 03, 04, 05 form |
| <a id="oq-17"></a>OQ-17 | **Footer inconsistency.** The trainee form has one button ("שמור הגבלה"); the number and voice forms have "ביטול" + "שמור". Align? | 03, 04, 05 form |
| <a id="oq-18"></a>OQ-18 | **Voice message "אפשרויות נוספות".** The voice form still uses a single "more options" toggle for hours and devices, and its hours error sits inside it, so collapsing hides the error. Move it to the per-condition accordion pattern? | 05 form |
| <a id="oq-19"></a>OQ-19 | **Legacy route slugs.** URLs still use `block` and `exception`. Keep for continuity, or rename (e.g. `trainee-restriction`, `number-restriction`)? | README, 03, 04 |
| <a id="oq-20"></a>OQ-20 | **Phone format.** Only Israeli local numbers are accepted (`0` + 8–9 digits). International format (`+972…`) is rejected. Confirm. | 04, 05 form |
| <a id="oq-21"></a>OQ-21 | **Not-found screen** is the English template. Needs a Hebrew design. | 02, 00 |
| <a id="oq-22"></a>OQ-22 | **Files.** Allowed file types and maximum size are not defined (the picker accepts any file). | 00, all forms |
