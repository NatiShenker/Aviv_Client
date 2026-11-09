# 04 – Number restriction / permit ("הגבלות והיתרים למספר") – Overview

Prototype sources: `client/pages/ExceptionList.tsx`, `client/pages/ExceptionForm.tsx`, `client/lib/restrictions.ts`.

Screens: [history.md](04_number_restriction_history.md) · [form.md](04_number_restriction_form.md)

---

## 1. Purpose

Manage calls between one trainee and **specific phone numbers**:

- **Restrict** numbers for this trainee (`"הגבלה למספר"`), or
- **Permit** a number that is already restricted (`"היתר למספר"`) – by a national or institute restriction from "חוסאם", or by a restriction created here for this trainee.

---

## 2. Business rules

### 2.1 Two record types

| Type | Label (full; decided 2026-10-21) | Tag in list | What it does |
|---|---|---|---|
| `restriction` | `"הגבלה למספר"` (Number restriction) | `"הגבלה"` | Restricts calls to one number for this trainee |
| `permit` | `"היתר למספר"` (Number permit) | `"היתר"` | Opens calls to a restricted number for this trainee, within one restriction |

Every permit and every restriction is a **separate record** in the history list.

### 2.2 Restriction scopes

| Scope | Label | Source | Applies to |
|---|---|---|---|
| `national` | `"הגבלה ארצית"` (National restriction) | "חוסאם" | Every trainee in every institute |
| `institute` | `"הגבלת פנימייה – {institute}"` (Institute restriction – …) | "חוסאם" | Every trainee of that institute |
| `trainee` | `"הגבלה לחניך"` (Trainee restriction) | A `restriction` record created in this feature | This trainee only |

The scope is a display derivation (2026-11-09): the server returns `sourceRestriction.codeRestrictionScope` – the `DECODE` value as is, `1` general / `2` trainee (`RESTRICTION_SCOPE_CODE`) – and `institutes`; `1` with no institutes → `national`, `1` with institutes → `institute`, `2` → `trainee`.

### 2.3 Permit rules

- **A permit always relies on one specific restriction.** The user finds it by entering the full number and choosing among the restrictions that apply to this trainee.
- **One number per permit.**
- **Dates must be inside the restriction's period.** Default: from the later of today and the restriction's start, to the restriction's end.
- **Several permits on the same restriction are allowed** (e.g. 08:00–09:00 and 18:00–19:00). Each is a separate record. Overlaps are not checked ([OQ-12](../../pending-decisions.md#oq-12)).
- On `GET`, the permit includes `sourceRestriction: SourceRestrictionSummaryDto` (resolved via SQL `JOIN` to `AVIV_RESTRICTION_NUMBER` + `AVIV_INSTITUTES_RESTRICTION_NUMBER`) for display ([OQ-11](../../pending-decisions.md#oq-11)); its `existingTraineePermits` are filled in the lookup only.
- Type, number and restriction cannot be changed after creation; an update sends `idntPrevious` only, and the server takes them from the previous record.
- When a trainee's number restriction is updated, the server creates a new parent row and **re-points the trainee's active permits to it** (server decision D-1), so the permits stay attached to the restriction's current version.

### 2.4 Restriction rules

- At creation the user can enter **several numbers**. Each number becomes a **separate restriction record** with the same dates, conditions and decision.
- After creation, each record is edited on its own; the number cannot be changed.
- A restriction created here appears in this trainee's permit lookup with scope `"הגבלה לחניך"` while it has not ended.

### 2.6 Interpretation

**Restriction** – same as the trainee restriction ([03 overview §2.3](../03-trainee-restriction/03_trainee_restriction_overview.md#23-interpretation-table)), but for calls to this number only.

**Permit** – calls to the number during the permit's dates (outside the permit, the restriction applies):

| Type | Permitted hours | Permitted devices | Result |
|---|---|---|---|
| Full permit | – | – | Open all day, from any device, no duration cap |
| Full permit | 16:00–19:00 | – | Open only 16:00–19:00 |
| Full permit | – | Device A | Open only from device A, all day |
| Duration (15) | – | – | Open all day, up to 15 minutes per call |
| Duration (15) | 16:00–19:00 | Device A | Open only 16:00–19:00 from device A, up to 15 minutes per call |

### 2.7 Which restrictions the permit lookup returns

For a given trainee and a full, valid number:

1. **National** restrictions on the number.
2. **Institute** restrictions on the number for **the trainee's institute** only.
3. **Trainee** restrictions on the number created for **this trainee**.

Only restrictions that have **not ended** (`endDate >= today`), including future ones. Sorted by scope (national → institute → trainee), then by start date ascending.

Each result also carries **this trainee's existing permits** on it that have not ended – shown to help the user avoid duplicates.

### 2.8 Status

Active while `dateEnd >= today`, else ended ([OQ-01](../../pending-decisions.md#oq-01)); the server computes it (`isEnded`, by its own clock, at day level). Label: `"פעיל"` / `"הסתיים"` for permits, `"פעילה"` / `"הסתיימה"` for restrictions.

---

## 3. Derived display values

| Value | Rule |
|---|---|
| Type label – restriction | `"הגבלה מלאה"` or `"הגבלת משך שיחה - עד X דק׳"` |
| Type label – permit | `"היתר מלא"` or `"היתר עם הגבלת משך - עד X דק׳"` |
| Hours / devices – restriction | Same "open by default" rule as [03 overview §3.2](../03-trainee-restriction/03_trainee_restriction_overview.md#32-open-by-default-rule) |
| Hours / devices – permit | Always open by default: unset hours → `"כל היום"`, unset devices → `"כל המכשירים"` |
| Scope label | §2.2 |
| "On restriction" | `"{scope label} · {DD/MM/YY-DD/MM/YY}"` |
| Existing-permit summary | Parts joined with `" · "`: hours `"HH:mm-HH:mm"` or `"כל היום"`; then devices (1 → label, more → `"{n} מכשירים"`) if any; then `"עד X דק׳"` if any. Several permits joined with `"; "` |

---

## 5. API (Separate Endpoints for Restrictions vs. Permits)

| Method & path | Request / Query Schema (`phone-exceptions.schema.ts`) | Response Schema | Used by |
|---|---|---|---|
| `POST PhoneExceptions/GetTraineePhoneRecords` | `GetTraineePhoneRecordsRequest` (`idntTraineeList: [traineeId]`) | `GetTraineePhoneRecordsResponse` (`records: TraineePhoneRecordDto[]`, `isPermit` tells the kinds apart) | History & Edit cache |
| `POST PhoneExceptions/LookupPhoneRestrictionsForPermit` | `LookupPhoneRestrictionsForPermitRequest` (`idntTrainee`, `idntInstitution`, `phoneNumberList: [phone]`) | `LookupPhoneRestrictionsForPermitResponse` (`results[]` per number, with the normalized `textPhoneNumber` and `activeRestrictions`: the not-ended national, institute and trainee restrictions for the phone + the trainee's existing permits) | Form, permit search (no lookup is needed in restriction mode) |
| `POST PhoneExceptions/CreateTraineePhoneRestriction` | `CreateTraineePhoneRestrictionRequest` (`idntTraineeList`, `phoneNumberList`, the dates, conditions, `textRestrictionReason`, `codeRestrictionReason`, approval) | `CreateTraineePhoneRestrictionResponse` (`createdIds` – one record per trainee × number) | Form, create restriction |
| `PUT PhoneExceptions/UpdateTraineePhoneRestriction` | `UpdateTraineePhoneRestrictionRequest` (`idntPrevious` + the restriction fields) | `UpdateTraineePhoneRestrictionResponse` (deactivates the previous version, re-points its permits, returns the new id). 409 when the previous record was replaced or has ended | Form, edit restriction |
| `POST PhoneExceptions/CreateTraineePhonePermit` | `CreateTraineePhonePermitRequest` (`idntTraineeList`, `idntInstitution`, `idntAvivRestrictionNumber`, the dates, conditions, `textPermitReason`, `codePermitReason`, approval) | `CreateTraineePhonePermitResponse`. 409 when the restriction is not active or does not apply; 400 `datePermitStart` when the dates fall outside it | Form, create permit |
| `PUT PhoneExceptions/UpdateTraineePhonePermit` | `UpdateTraineePhonePermitRequest` (`idntPrevious` + the permit fields) | `UpdateTraineePhonePermitResponse` (deactivates the previous permit, returns the new id). 409 when the permit was replaced or has ended, or its restriction has ended | Form, edit permit |

The actions are those of `PhoneExceptionsController` (`service-layer/`, 2026-11-09); the contract is `phone-exceptions.schema.ts`.

---

## 8. Prototype demo data (for QA parity)

| Number | Lookup result for the demo trainee (institute "הדר") |
|---|---|
| `0508881122` | 2 results: `"הגבלה ארצית"` and `"הגבלת פנימייה – הדר"` (an "אורות" restriction exists but is excluded). The national one has an existing permit: `"16:00-19:00 · עד 15 דק׳"` |
| `0524443322` | 1 result: `"הגבלת פנימייה – הדר"` – auto-selected |
| `039998877` | 1 result: `"הגבלה ארצית"` – auto-selected, with an existing permit: `"כל היום · טלפון משרד הפנימייה"` |
| `0526667788` | 1 result: `"הגבלה לחניך"` (from a restriction record of this trainee) – auto-selected |
| `0549990000` | 0 results – its national restriction has ended |
