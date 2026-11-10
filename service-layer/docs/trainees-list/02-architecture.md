# Trainees list – server side, phase 2: architecture

Status: approved by the product owner on 2026-11-10 together with phase 1 (the owner asked for all phases to run in sequence). **Revised the same day after the owner's review of the written code (L-15):** the read queries follow the shape of the existing `LocationsController` / `LocationsRepository` / `WingDto.cs` in `reference/service/` – a one-line input check and a `try/catch` in the controller, one DTO file per domain, a bare list in the response – instead of the save-feature machinery of 03 / 04 (validator classes, field-name constants, `ApiActionRunner`, response wrappers). Phase 1 is in [01-business-analysis.md](01-business-analysis.md); every decision referenced here is in [decisions.md](decisions.md) (L-n, LI-n, LQ-n, LC-n) or in the logs of 03 ([../trainee-restrictions/decisions.md](../trainee-restrictions/decisions.md)) and 04 ([../number-restrictions/decisions.md](../number-restrictions/decisions.md)).

Scope: `POST Trainees/GetTrainees` – one HTTP action, one stored procedure, the service layers, the contract, and the Cellcom seam. Where this document says nothing, the 04 architecture applies as written for what 04 and the reads share (procedure conventions §4, DB access §A-16) and the shared files of 03 (T-12, T-13).

Siblings written in the same session: [../devices/02-architecture.md](../devices/02-architecture.md) and [../lookups/02-architecture.md](../lookups/02-architecture.md).

---

## 1. Principles the design follows

1. **Readability first, especially here** (G-1, L-14 – the owner's emphasis for this procedure). The procedure is a sequence of short steps; each step fills one temp table whose name says what it holds; the final `SELECT` only joins them.
2. **A read looks like `Locations`** (L-15). The controller checks the input in one line and returns `BadRequest`, wraps the call in `try/catch` and returns `500` with a log line, and returns the list itself. No validator class, no `…RequestFields`, no `ApiActionRunner`: those belong to the saves of 03 / 04, where the procedures throw business errors and the client maps 400 field names. The difference from the 03 / 04 histories (`{ records }`) is recorded, not hidden.
3. **Flags come from the procedure** (I-19). The one derivation in C# is `HasBalance = NumbRemainingMinutes > 0`, because its input is not in the database (L-6).
4. **Flat row, nested DTO** (L-7): `TraineeRow` is what Dapper fills; `TraineesAssembler` builds `TraineeDto` with `Wing` / `Location` as `LookupItemDto` and `Flags` as an object. The orchestrator and the assembler exist because there is work to do here (the Cellcom merge, the nesting) – unlike the devices query.
5. **One seam for Cellcom** (L-6): `ICellcomBalanceProvider`, one registered implementation (`CellcomBalanceStandIn`) until the integration exists.
6. **No catch in the repository** (A-6, confirmed by the owner for the reads): an exception reaches the controller's `catch` and becomes a 500, never an empty list that looks like "no trainees".
7. **No permission check** (D-17), **no paging** (B-5).

---

## 2. Layers and files

Paths are relative to `service-layer/`. Namespaces follow the folders (T-13): `Aviv_Service.Models.Trainees`, `Aviv_Service.Services.Trainees`, and the flat `Aviv_Service.Controllers`, `.Interfaces`, `.Repository`, `.Utils`.

### 2.1 Files of the trainees list (11)

| File | Responsibility |
|---|---|
| `Controllers/TraineesController.cs` | `[Authorize] [ApiController] [Route("api/[controller]")]`. One action, `GetTrainees` (POST): `isEmpty` check (both lists empty → `BadRequest("Invalid request values.")`), `try` → `Ok(list)`, `catch` → log + `500` – the shape of `LocationsController` (L-15). |
| `Interfaces/ITraineesOrchestrator.cs`, `Services/Trainees/TraineesOrchestrator.cs` | Calls the repository, asks `ICellcomBalanceProvider` once for the balances of the returned trainees, assembles the list (`TraineesAssembler`). No try/catch (A-6). |
| `Services/Trainees/TraineesAssembler.cs` | Rows + balances → `List<TraineeDto>` (§8). |
| `Interfaces/ICellcomBalanceProvider.cs` | `Task<IReadOnlyDictionary<int, CellcomTraineeBalance>> GetBalancesAsync(IReadOnlyCollection<int> traineeIds)` – the Cellcom seam (L-6). |
| `Services/Trainees/CellcomBalanceStandIn.cs` | The one implementation registered today: returns an empty dictionary ("no data for anyone"). Replaced by the HTTP implementation in one DI line (LQ-5). |
| `Interfaces/ITraineesRepository.cs`, `Repository/TraineesRepository.cs` | One method, `GetTraineesAsync(TraineeRequestDto)`: two TVPs through `ProcedureParameters.AddIdList`, one `QueryMultiple`, one `Read<TraineeRow>()`. No try/catch. |
| `Models/Trainees/TraineeDto.cs` | The request record, the response classes and the row, in one file like `WingDto.cs` (§7): `TraineeRequestDto`, `TraineeDto`, `TraineeFlagsDto`, `TraineeRow`. |
| `Models/Trainees/CellcomTraineeBalance.cs` | `record CellcomTraineeBalance(int NumbRemainingMinutes, bool HasCellcomDiscrepancy)` – what the provider knows about one trainee. |
| `Utils/StoredProcedures.Trainees.cs` | `GET_TRAINEES`, a `partial` addition to `StoredProcedures` (A-15, I-16). |

### 2.2 Shared files touched (1)

| File | Change | Why |
|---|---|---|
| `Repository/ProcedureParameters.cs` | `AddIdList` accepts a `null` list (sent empty) and removes duplicates before building the TVP. | The reads have no validator to normalize the lists (L-15) and the procedures fill `PRIMARY KEY` temp tables from them; the same normalization `LocationsRepository` does. For the saves it is a harmless second pass (I-4). |

### 2.3 The resulting additions to the layout of `service-layer/`

```
Controllers/     TraineesController.cs
Interfaces/      ITraineesOrchestrator.cs, ITraineesRepository.cs, ICellcomBalanceProvider.cs
Models/          Trainees/  TraineeDto.cs, CellcomTraineeBalance.cs
Repository/      TraineesRepository.cs
Services/        Trainees/  TraineesOrchestrator.cs, TraineesAssembler.cs, CellcomBalanceStandIn.cs
Utils/           StoredProcedures.Trainees.cs
```

The stored procedure lives in `stored-procedures/trainees-list/SP_AVIV_GET_TRAINEES.sql`, with `00-test-data.sql` next to it.

---

## 3. Action → procedure

| Action | Procedure | Parameters | Result set | HTTP response |
|---|---|---|---|---|
| `POST GetTrainees` | `SP_AVIV_GET_TRAINEES` | `@IDNT_INSTITUTION_LIST dbo.INT_TABLE READONLY`, `@IDNT_WINGS_LIST dbo.INT_TABLE READONLY` (the names of `SP_AVIV_GET_LOCATIONS`) | 1 `TraineeRow` – one row per current trainee of the requested institutes or wings | `200` with `List<TraineeDto>` – a bare JSON array (L-15) |

Semantics of the two lists (L-1, as `SP_AVIV_GET_LOCATIONS`): a trainee is included when its institute is in the first list **or** its wing is in the second; a wing whose institute is already requested is dropped from the second list. At least one list must have an id (§6).

---

## 4. Procedure conventions and structure

Unchanged by the revision – see the procedure itself and L-14. As 04 §4 (header, `SET NOCOUNT ON`, Hebrew section headers, `(NOLOCK)`, PascalCase aliases equal to the `TraineeRow` properties, `DECLARE` constants), with these steps:

| Step | Section header (Hebrew) | Fills | Rule |
|---|---|---|---|
| 0 | מחיקת טבלאות זמניות; משתנים | – | `@Today DATE = CAST(GETDATE() AS DATE)` (P-10); `@RestrictionTypeNumber INT = 2` (D-10); `@VirtualLocationWingId INT = 99999` (needed only by the shared input block) |
| 1 | מיפוי הפנימיות והאגפים | `#ReqInstitutions`, `#ReqWings` | The block of `SP_AVIV_GET_LOCATIONS`, word for word; the same block under the same header in `SP_AVIV_GET_DEVICES` (A-3) |
| 2 | החניכים הנבחרים | `#Trainees` | `TRAINEE_SNAPSHOT` with `LOGI_ACTIVE = 1` and institute-or-wing (L-1) |
| 3 | דגלי "הגבלה לחניך" (03) | `#TraineeRestrictionFlags` | active today, `GROUP BY`: `MAX(DATE_RESTRICTION_END)`, full / minutes flags (L-3, T-2, B-1) |
| 4 | דגלי "הגבלות והיתרים למספר" (04) | `#PhoneRestrictionFlags`, `#PhonePermitFlags` | one statement per flag: trainee-scope restrictions (D-11); user permits of type 2, inline flag 0, active by their own dates (L-4, LI-3) |
| 5 | דגלי "הודעות קוליות" (05) | `#MessageFlags` | `AVIV_TRAINEE_MESSAGE` active today, interactive by `LOGI_INTERACTIVE_MESSAGE` (L-5) |
| 6 | תוצאה: חניך לשורה (TraineeRow) | the result set | `#Trainees` ⟕ `MAIN_WINGS_TABLE` ⟕ `A_LOCATION` ⟕ the flag tables; `ISNULL(flag, 0)` cast to `BIT`; the full name composed; `ORDER BY TextFullName` (L-13) |

Assumed column names are marked `-- משוער (LQ-1)` at their first use.

---

## 5. Business checks and the error contract

- **Procedure:** none. An unknown institute or wing matches no trainee; no `THROW`.
- **Controller (L-15):** both lists empty → `400` with the plain-text body `"Invalid request values."`; any exception from the layers below → one log line `Error at GetTrainees` and `500` with the plain-text body `"An error occurred while retrieving trainees."`. The same two shapes `LocationsController` returns. The structured error body of 03 / 04 (`{ code, message, fieldErrors }`, A-13) is **not** used here: the client never sends a field a user typed, and on any failure it shows its generic "לא ניתן לטעון" state.

---

## 6. Input check

One line in the controller: `(request.IdntInstitutionList is null or []) && (request.IdntWingList is null or [])` → `400`. Nothing else is validated in C#: ids are what the client got from `GetInstitutionsAndWings`; a `null` list is sent as an empty TVP and duplicates are removed by `ProcedureParameters.AddIdList` (§2.2); an unknown id matches nothing. No `clientIds` (L-9). No permission check (D-17).

---

## 7. Data shapes (`Models/Trainees/TraineeDto.cs`)

```csharp
public record TraineeRequestDto(int[] IdntInstitutionList, int[] IdntWingList);   // either list may be empty or missing

public class TraineeDto                                   // one element of the bare response array
{
    public int IdntTrainee { get; set; }
    public int NumbPersonalNumber { get; set; }          // TRAINEE_SNAPSHOT.NUMB_PERSONAL_NUMBER (LQ-1, LQ-3)
    public string TextFullName { get; set; } = "";       // first + ' ' + last, composed in SQL
    public int IdntInstitution { get; set; }
    public LookupItemDto Wing { get; set; } = new();     // MAIN_WINGS_TABLE; name empty when the lookup row is missing (C-8)
    public LookupItemDto? Location { get; set; }         // A_LOCATION; null when the trainee has no location
    public string? DateRestrictedUntil { get; set; }     // yyyy-MM-dd; null when no trainee restriction is active today (L-3)
    public int NumbRemainingMinutes { get; set; }        // Cellcom provider; 0 from the stand-in (L-6)
    public TraineeFlagsDto Flags { get; set; } = new();
}

public class TraineeFlagsDto                              // six procedure flags + HasBalance (assembler) + HasCellcomDiscrepancy (provider)
{ … }

public class TraineeRow                                   // what Dapper fills: the flat columns of the result set, nullable where the ODS may hold NULL (I-18)
{ … }
```

The JSON is a camelCase array: `[ { "idntTrainee", "numbPersonalNumber", "textFullName", "idntInstitution", "wing": { "id", "name" }, "location": {…} | null, "dateRestrictedUntil", "numbRemainingMinutes", "flags": {…} }, … ]`. Not returned: `firstName`, `lastName`, `lastActivityDate` (I-20, LC-1).

`CellcomTraineeBalance(int NumbRemainingMinutes, bool HasCellcomDiscrepancy)` and `ICellcomBalanceProvider.GetBalancesAsync(traineeIds)` → dictionary by trainee; a trainee absent from the dictionary has no data (0 / false / false).

---

## 8. Composing the response (`TraineesAssembler`)

1. The orchestrator reads the rows, collects their `IdntTrainee` values and asks the provider once for all of them.
2. Each row → `TraineeDto`: `Wing` from `IdntWing ?? 0` and `TextWingName ?? ""`; `Location` null when `IdntLocation` is null; `DateRestrictedUntil` through `DateTimeStrings.FormatDate` or null; the six procedure flags copied; the Cellcom values from the provider's entry or the "no data" defaults; `HasBalance = NumbRemainingMinutes > 0`.
3. The list keeps the procedure's order (by name); the client sorts and filters (B-5).

---

## 9. Client changes (C-list)

[decisions.md section C](decisions.md): LC-1 (DB-style names, dropped fields, bare array), LC-2 (request names), LC-3 (photo URL base), LC-4 (mock handler and data).

---

## 10. Phase 3 – what was written

1. **SQL.** `stored-procedures/trainees-list/SP_AVIV_GET_TRAINEES.sql` (§4) and `00-test-data.sql` (L-10).
2. **C#.** The eleven files of §2.1 and the `AddIdList` change of §2.2. Written first in the 03 / 04 shape and slimmed the same day to the Locations shape (L-15): the validator, the field-name constants and the three model files were removed.
3. **`03-manual-test-checklist.md`** of this folder.
