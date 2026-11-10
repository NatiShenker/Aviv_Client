# Trainee restrictions – server side, phase 2: architecture

Status: approved by the product owner on 2026-11-09 after one review round (two parts: procedures and shared code, then the folder layout). Phase 1 is in [01-business-analysis.md](01-business-analysis.md); every decision referenced here is in [decisions.md](decisions.md) (T-n, TQ-n, TC-n) or in feature 04's log ([../number-restrictions/decisions.md](../number-restrictions/decisions.md), D-n, B-n, A-n, P-n, G-n, I-n, C-n, Q-n).

Amended on 2026-11-09 by the client alignment (04's decisions I-22, I-23; 03's T-4, T-5, TI-8): set 1 of the history procedure joins the approver name from `ODSINTERNALDATA..A_WORKERS` (`ApproverName` on `TraineeRestrictionRow`), and the two save requests carry `CodeRestrictionReason` (validated > 0), which reaches the procedures as `@CODE_RESTRICTION_REASON` and is not written until the DBA adds the column. The affected rows below carry an "amended 2026-11-09" note.

Scope: the server side of feature 03 ("הגבלות לחניך") – three HTTP actions, three stored procedures, the service layers, the contracts and the error handling – plus the code that 03 and 04 share from now on (T-12) and the folder layout that holds both (T-13). Phase 3 (implementation) starts from this document, in batches, after an explicit go-ahead.

Where this document says nothing, [../number-restrictions/02-architecture.md](../number-restrictions/02-architecture.md) applies as written: the principles (§1), the procedure conventions (§4), the error contract (§5.2, §5.3) and the validation rules (§6) are the same, and are only summarized here.

---

## 1. Principles the design follows

1. **Readability and maintainability first** (G-1). One self-contained procedure per operation; a procedure never calls a procedure (A-3).
2. **03 is 04 without the numbers.** Same versioning (D-1 without re-pointing), same inline conditions row (D-2, D-3), same error contract (A-2, A-13), same strings for dates and times (A-8), same acting-user and request-id stamping (D-14, D-19). What differs is listed in decisions.md section V and in T-1 to T-13.
3. **Shared code lives once** (T-12). The rules that must be identical across features – the error translation, the acting user, the input rules, the file-name rule of D-13, the Dapper parameter helpers – and the DTOs both features return are extracted from the 04 files into feature-neutral files, named by what they hold. Each feature keeps its own list of request field names (I-21) and its own details length (per table, I-14, TQ-2).
4. **Folders by layer, then by feature** (T-13): in `Models/` and `Services/` the shared files sit at the folder root and each feature has a sub-folder, with the namespace following the folder. `Controllers/`, `Interfaces/`, `Repository/`, `Utils/` and `Infrastructure/` stay flat.
5. **Integrity rules live in the service** (D-18): the request validator enforces the structural rules; the procedures keep the two cross-row checks of 03 (§5.1). No CHECK constraints.
6. **No silent failures** (A-6): repositories do not catch exceptions; the shared action runner translates them to HTTP.

---

## 2. Layers and files

Paths are relative to `service-layer/`. Namespaces follow the folders: `Aviv_Service.Models`, `Aviv_Service.Models.TraineeRestrictions`, `Aviv_Service.Services`, `Aviv_Service.Services.TraineeRestrictions`, and the flat `Aviv_Service.Controllers`, `.Interfaces`, `.Repository`, `.Utils`, `.Infrastructure`.

### 2.1 Files of feature 03 (new, 12)

| File | Responsibility |
|---|---|
| `Controllers/TraineeRestrictionsController.cs` | `[Authorize] [ApiController] [Route("api/[controller]")]`. Three thin actions named as the client calls them (A-7): `GetTraineeRestrictions` (POST), `CreateTraineeRestriction` (POST), `UpdateTraineeRestriction` (PUT). Each one calls `ApiActionRunner.RunAsync(request, orchestratorMethod, nameof(Action), logger)`. |
| `Interfaces/ITraineeRestrictionsOrchestrator.cs`, `Services/TraineeRestrictions/TraineeRestrictionsOrchestrator.cs` | Validates (`TraineeRestrictionsRequestValidator`), takes the acting user (`ActingUserId.From(currentUserService)`), creates the request GUID per save, calls the repository, assembles the history (`TraineeRestrictionsAssembler`). No try/catch. |
| `Services/TraineeRestrictions/TraineeRestrictionsRequestValidator.cs` | One explicitly named method per request (`ValidateGetRestrictions`, `ValidateCreate`, `ValidateUpdate`), composed from `RequestRules` with the field names of `TraineeRestrictionsRequestFields` (§6). Returns the normalized copy of the request (I-4). |
| `Services/TraineeRestrictions/TraineeRestrictionsAssembler.cs` | Rows → DTOs (§8): devices joined by `ConditionsRowId`, dates and times formatted with `DateTimeStrings`, the file DTO built with `FilePaths.FileNameFromPath`. Copies `IsEnded` as the procedure returns it (I-19). |
| `Interfaces/ITraineeRestrictionsRepository.cs`, `Repository/TraineeRestrictionsRepository.cs` | One method per procedure (§3), taking the validated request (saves: plus the acting user and the request GUID). Parameters through `ProcedureParameters` (shared, §2.2); every call through `dataAccess.QueryMultiple(parameters, StoredProcedures.<NAME>, ConnectionStrings.ZeroThree03, reader => …)`, saves included (A-16). No try/catch. |
| `Models/TraineeRestrictions/TraineeRestrictionsRequests.cs` | The three request records (§7.1). |
| `Models/TraineeRestrictions/TraineeRestrictionsResponses.cs` | `TraineeRestrictionsResponseDto`, `TraineeRestrictionRecordDto` (§7.2). |
| `Models/TraineeRestrictions/TraineeRestrictionsRows.cs` | `TraineeRestrictionRow`, `TraineeRestrictionsRowSets` (§7.3). |
| `Utils/TraineeRestrictionsConstants.cs` | `TraineeRestrictionsLimits` (`DetailsMaxLength = 1000`, the length of `AVIV_TRAINEE_RESTRICTION.TEXT_RESTRICTION_REASON`, assumed until TQ-2) and `TraineeRestrictionsRequestFields` (the camelCase names a 400 can carry, §6). |
| `Utils/StoredProcedures.TraineeRestrictions.cs` | The three procedure names, a `partial` addition to `StoredProcedures` (A-15, I-16). |

### 2.2 Shared files (new, 9; T-12)

Extracted from the 04 files in phase 3. Each file is named by what it holds; none carries a feature prefix. *(Revised 2026-11-09 after the owner's review of batch 3, TI-7: helpers are grouped by kind, so a helper that only 04 uses today sits with its siblings; a shared file never imports a feature namespace.)*

| File | Holds | Taken from |
|---|---|---|
| `Models/RecordDtos.cs` | The DTOs every record returns the same way: `LookupItemDto` (id + name), `ApproverDto` and `FileDto` (the "סיבות ואישורים" block of spec 00 §4.3), `MutationResultDto { CreatedIds }` (A-14) | `PhoneExceptionsResponses.cs` |
| `Models/RecordRows.cs` | The rows every read or save returns the same way: `DeviceRow`, `InstituteRow` (04 only today), `CreatedIdRow` | `PhoneExceptionsRows.cs` |
| `Services/RequestRules.cs` | Static, pure input rules that take the field name as a parameter: `RequireIdList`, `DistinctPositiveIds`, `RequirePositive`, `RequirePositiveWhenPresent`, `RequireDateRange`, `RequireDurationRange` (owns `DurationMinutesMin = 1`, `DurationMinutesMax = 120`), `ValidateTimeWindow`, `RequireText`. Each throws `ApiException.Validation(fieldName)` on the first failing rule. | the private helpers of `PhoneExceptionsRequestValidator.cs` |
| `Services/RecordPartsAssembler.cs` | The parts every assembler builds the same way from rows: `ToDevices`, `ToInstitutes` (04 only today), `ToApprover` (Q-1: name empty until a users join exists), `ToFile` (D-13, via `FilePaths`) | the private helpers of `PhoneRecordsAssembler.cs` |
| `Repository/ProcedureParameters.cs` | Static Dapper helpers for the procedure parameters: `AddIdList` (TVP via `ToDataTable()`), `AddPhoneNumberList` (04 only today, A-9), `AddDateRange`, `AddConditions`, `AddApproval` (takes the details parameter name and the feature's details length), `AddActingUser` | the private helpers of `PhoneExceptionsRepository.cs` |
| `Repository/CreatedIds.cs` | `static Task<List<int>> ReadAsync(IDataAccess dataAccess, string databaseName, string procedureName, DynamicParameters parameters)` – runs a save procedure through `QueryMultiple` and reads its `CreatedIdRow` set (A-14, A-16) | `ReadCreatedIdsAsync` of `PhoneExceptionsRepository.cs` |
| `Utils/FilePaths.cs` | `TextFileMaxLength = 500` and `FileNameFromPath(path)` – the D-13 rule | `PhoneRecordsAssembler.cs`, `PhoneExceptionsConstants.cs` |
| `Infrastructure/ApiActionRunner.cs` | `static Task<IActionResult> RunAsync<TRequest, TResponse>(TRequest request, Func<TRequest, Task<TResponse>> action, string actionName, ILogger logger)`: `Ok(response)`; `ApiException` → `ErrorResponses.FromApiException`; business `SqlException` (50400–50499) → the same through `SqlErrorMapper`; anything else → log + 500 (A-2, A-6, A-13) | the private `RunAsync` of `PhoneExceptionsController.cs` |
| `Infrastructure/ActingUserId.cs` | `static int From(ICurrentUserService currentUserService)` – the one place that knows the member of `ICurrentUserService` (I-7) | `GetActingUserId()` of `PhoneExceptionsOrchestrator.cs` |

Already shared and unchanged: `Infrastructure/ApiException.cs`, `Infrastructure/ApiErrors.cs`, `Utils/DateTimeStrings.cs`. Limits sit next to what they limit: `RequestRules.DurationMinutesMin / Max`, `FilePaths.TextFileMaxLength`, `PhoneNumbers.ListMaxLength`; each feature keeps only its `DetailsMaxLength` (per table, I-14).

### 2.3 What changes in the 04 files (phase 3, batch 3; mechanical, no logic)

| 04 file | Change |
|---|---|
| `Models/PhoneExceptions/PhoneExceptionsRequests.cs`, `…Responses.cs`, `…Rows.cs` | Moved into the feature sub-folder, namespace `Aviv_Service.Models.PhoneExceptions`; the shared types of §2.2 removed from Responses (`LookupItemDto`, `ApproverDto`, `FileDto`, `MutationResultDto`) and Rows (`DeviceRow`, `InstituteRow`, `CreatedIdRow`) |
| `Services/PhoneExceptions/PhoneExceptionsOrchestrator.cs`, `PhoneExceptionsRequestValidator.cs`, `PhoneRecordsAssembler.cs` | Moved, namespace `Aviv_Service.Services.PhoneExceptions`; `GetActingUserId()` → `ActingUserId.From`; the private rules → `RequestRules.*` (the composition stays in the validator, with `PhoneExceptionsRequestFields`); `ToDevices`, `ToInstitutes`, `ToFile` and the approver line → `RecordPartsAssembler.*`; `PhoneExceptionsLimits.PhoneNumberListMaxLength` → `PhoneNumbers.ListMaxLength` |
| `Controllers/PhoneExceptionsController.cs` | `RunAsync` → `ApiActionRunner.RunAsync`; `using Aviv_Service.Models.PhoneExceptions;` |
| `Repository/PhoneExceptionsRepository.cs` | The six private helpers → `ProcedureParameters.*` (`AddPhoneNumberList` included); `ReadCreatedIdsAsync` → `CreatedIds.ReadAsync`; `using` of the moved namespace |
| `Interfaces/IPhoneExceptionsOrchestrator.cs`, `IPhoneExceptionsRepository.cs` | `using Aviv_Service.Models.PhoneExceptions;` |
| `Utils/PhoneExceptionsConstants.cs`, `Utils/PhoneNumbers.cs` | `PhoneExceptionsLimits` keeps `DetailsMaxLength` only; `TextFileMaxLength`, `DurationMinutesMin/Max` moved to `FilePaths` and `RequestRules`; `PhoneNumberListMaxLength` moved to `PhoneNumbers.ListMaxLength`, next to `JoinForProcedure` |
| `../number-restrictions/03-manual-test-checklist.md` §F.1, §F.2 row 7 | The copy list becomes the layout of §2.4; the DI registration line names `Aviv_Service.Services.PhoneExceptions` |

### 2.4 The resulting layout of `service-layer/`

```
Controllers/     PhoneExceptionsController.cs, TraineeRestrictionsController.cs
Infrastructure/  ApiException.cs, ApiErrors.cs, ApiActionRunner.cs, ActingUserId.cs
Interfaces/      IPhoneExceptionsOrchestrator.cs, IPhoneExceptionsRepository.cs,
                 ITraineeRestrictionsOrchestrator.cs, ITraineeRestrictionsRepository.cs
Models/          RecordDtos.cs, RecordRows.cs
                 PhoneExceptions/      PhoneExceptionsRequests.cs, PhoneExceptionsResponses.cs, PhoneExceptionsRows.cs
                 TraineeRestrictions/  TraineeRestrictionsRequests.cs, TraineeRestrictionsResponses.cs, TraineeRestrictionsRows.cs
Repository/      ProcedureParameters.cs, CreatedIds.cs, PhoneExceptionsRepository.cs, TraineeRestrictionsRepository.cs
Services/        RequestRules.cs, RecordPartsAssembler.cs
                 PhoneExceptions/      PhoneExceptionsOrchestrator.cs, PhoneExceptionsRequestValidator.cs, PhoneRecordsAssembler.cs
                 TraineeRestrictions/  TraineeRestrictionsOrchestrator.cs, TraineeRestrictionsRequestValidator.cs, TraineeRestrictionsAssembler.cs
Utils/           DateTimeStrings.cs, FilePaths.cs, PhoneNumbers.cs, PhoneExceptionsConstants.cs, TraineeRestrictionsConstants.cs,
                 StoredProcedures.PhoneExceptions.cs, StoredProcedures.TraineeRestrictions.cs
```

The real service's existing files (`Models/LocationDto.cs`, `Models/WingDto.cs`, `LocationsController.cs`, …) are outside this scope and stay where they are (T-13).

The stored procedures live in `stored-procedures/trainee-restrictions/`, one file per procedure plus `00-test-data.sql`; the DDL for the DBA in `stored-procedures/schema/02-proposed-schema-changes-trainee-restrictions.sql`.

---

## 3. Actions → procedures

| Action | Procedure | Parameters | Result sets |
|---|---|---|---|
| `POST GetTraineeRestrictions` | `SP_AVIV_GET_TRAINEE_RESTRICTIONS` | `@IDNT_TRAINEE_LIST dbo.INT_TABLE READONLY` | 1 restrictions (`TraineeRestrictionRow`: restriction row + inline row + file path, with `IsEnded` and `ConditionsRowId`); 2 devices of the inline rows (`DeviceRow`, keyed by `ConditionsRowId`, names from `AVIV_DEVICE_DATA`, I-15) |
| `POST CreateTraineeRestriction` | `SP_AVIV_CREATE_TRAINEE_RESTRICTION` | `@IDNT_TRAINEE_LIST INT_TABLE`, `@DATE_RESTRICTION_START DATETIME`, `@DATE_RESTRICTION_END DATETIME`, `@NUMB_DURATION_LIMIT INT = NULL`, `@TIME_PERMIT_START DATETIME = NULL`, `@TIME_PERMIT_END DATETIME = NULL`, `@IDNT_DEVICE_LIST INT_TABLE`, `@TEXT_RESTRICTION_REASON VARCHAR(1000)`, `@IDNT_USER_APPROVAL INT`, `@TEXT_FILE NVARCHAR(500)`, `@IDNT_USER INT`, `@REQUEST_UID UNIQUEIDENTIFIER` | 1 created ids (`CreatedIdRow`), one per trainee (P-12) |
| `PUT UpdateTraineeRestriction` | `SP_AVIV_UPDATE_TRAINEE_RESTRICTION` | `@IDNT_PREVIOUS INT` (the previous restriction row), then the same fields without the trainee list | 1 the new id |

Shared parameter rules as in 04: id lists are `dbo.INT_TABLE`; every string has an explicit size (A-10); the acting user and the request GUID come from the service (D-14, D-19); dates and times arrive as `DATETIME` built by the repository from the request strings (A-8). *(Amended 2026-11-09, I-23)* Both save procedures also take `@CODE_RESTRICTION_REASON INT = NULL` right after `@TEXT_RESTRICTION_REASON` – accepted and not written until the DBA adds the column `CODE_RESTRICTION_REASON`.

---

## 4. Procedure conventions

As 04 §4, with these 03 specifics:

- Constants: `DECLARE @RestrictionTypeTrainee INT = 1;` (D-10, `DECODE AVIV_RESTRICTION_TYPE`); no scope constants.
- The inline row flag `@HasInlineConditions` is **hours or devices** – `@TIME_PERMIT_START IS NOT NULL OR EXISTS (SELECT 1 FROM #Devices)` – never the duration (T-2). The duration goes to `AVIV_TRAINEE_RESTRICTION.NUMB_DURATION_LIMIT`; the inline row's `NUMB_DURATION_LIMIT` is not written.
- The two save procedures use **identical section headers** for the repeated block "שורת התנאים הפנימית ומכשיריה" (A-3, drift control).
- `(NOLOCK)` only in the read procedure. `SET XACT_ABORT ON` and one transaction in the save procedures. Every written row carries `DATE_UPDATED`, `IDNT_USER_UPDATE`, `LAST_REQUEST_UID`; inserts also `DATE_CREATED`, `LOGI_ACTIVE = 1` (D-15, D-19).
- Column aliases in PascalCase, matching the `Rows` classes.

---

## 5. Business checks and the error contract

### 5.1 Checks in the procedures

| Procedure | Check | Code and field |
|---|---|---|
| `UPDATE_TRAINEE_RESTRICTION` | The previous row does not exist, is already replaced (`LOGI_ACTIVE = 0`) or has ended (`CAST(DATE_RESTRICTION_END AS DATE) < @Today`). One claim: `UPDATE … SET LOGI_ACTIVE = 0 … WHERE IDNT_AVIV_TRAINEE_RESTRICTION = @IDNT_PREVIOUS AND LOGI_ACTIVE = 1 AND CAST(DATE_RESTRICTION_END AS DATE) >= @Today; IF @@ROWCOUNT = 0 THROW 50409, 'idntPrevious', 1;` | 409 `idntPrevious` |
| `CREATE_TRAINEE_RESTRICTION` | Empty trainee list (I-12) | 400 `idntTraineeList` |

Nothing else: 03 has no source restriction, no institute and no dictionary table, so no other cross-row check exists.

### 5.2 Mapping in the service, 5.3 the HTTP body

Identical to 04 (`SqlErrorMapper`: 50400–50499 → `ApiException`, everything else 500; body `{ code, message, fieldErrors }` with the field name and an empty text, C-4). The translation runs in `ApiActionRunner.RunAsync` for both features.

---

## 6. Validation (`TraineeRestrictionsRequestValidator`, composed from `RequestRules`)

Runs before any database call; the first failing rule per field becomes `ApiException(400, field)`. Field names from `TraineeRestrictionsRequestFields`.

| Field | Rule (`RequestRules` method) |
|---|---|
| `IdntTraineeList` | not empty, all > 0, duplicates removed (`RequireIdList`) |
| `IdntPrevious` | > 0 (`RequirePositive`) |
| `DateRestrictionStart` / `DateRestrictionEnd` | present, `yyyy-MM-dd`, end ≥ start (`RequireDateRange`) |
| `NumbDurationLimit` | null or 1–120 (`RequireDurationRange`) |
| `TimePermitStart` / `TimePermitEnd` | both null or both present, `HH:mm`, end > start (`ValidateTimeWindow`; OQ-13 as in 04) |
| `IdntDeviceList` | all > 0, duplicates removed, empty allowed (`DistinctPositiveIds`) |
| `TextRestrictionReason` | not blank, ≤ `TraineeRestrictionsLimits.DetailsMaxLength` (`RequireText`) |
| `CodeRestrictionReason` *(amended 2026-11-09, I-23)* | > 0 (`RequirePositive`); accepted, not stored |
| `IdntUserApproval` | > 0 (`RequirePositive`) |
| `TextFile` | not blank, ≤ `FilePaths.TextFileMaxLength` (`RequireText`) |

The validator returns the request with the normalized lists (`with { IdntTraineeList = …, IdntDeviceList = … }`, I-4).

---

## 7. Data shapes

### 7.1 Requests (`Models/TraineeRestrictions/TraineeRestrictionsRequests.cs`)

```csharp
public record GetTraineeRestrictionsRequestDto(int[] IdntTraineeList);

public record CreateTraineeRestrictionRequestDto(
    int[] IdntTraineeList,
    string DateRestrictionStart, string DateRestrictionEnd,
    int? NumbDurationLimit, string? TimePermitStart, string? TimePermitEnd, int[] IdntDeviceList,
    string TextRestrictionReason, int IdntUserApproval, string TextFile, string? TextFileName);

public record UpdateTraineeRestrictionRequestDto(
    int IdntPrevious,
    string DateRestrictionStart, string DateRestrictionEnd,
    int? NumbDurationLimit, string? TimePermitStart, string? TimePermitEnd, int[] IdntDeviceList,
    string TextRestrictionReason, int IdntUserApproval, string TextFile, string? TextFileName);
```

No trainee in the update request (T-9). `TextFileName` is display-only, as in 04. *(Amended 2026-11-09, I-23)* Both save records carry `int CodeRestrictionReason` after `TextRestrictionReason`.

### 7.2 Responses (`Models/TraineeRestrictions/TraineeRestrictionsResponses.cs`)

```csharp
public class TraineeRestrictionsResponseDto { public List<TraineeRestrictionRecordDto> Records { get; set; } = []; }

public class TraineeRestrictionRecordDto
{
    public int Id { get; set; }                          // AVIV_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION
    public int IdntTrainee { get; set; }
    public string DateStart { get; set; } = "";          // yyyy-MM-dd
    public string DateEnd { get; set; } = "";
    public bool IsEnded { get; set; }                    // from the procedure (I-19)
    public int? NumbDurationLimit { get; set; }          // from the restriction row (T-2); null = full restriction
    public string? TimePermitStart { get; set; }         // HH:mm, from the inline row; null = all day
    public string? TimePermitEnd { get; set; }
    public List<LookupItemDto> Devices { get; set; } = [];
    public string TextReason { get; set; } = "";         // details (T-3)
    public ApproverDto Approver { get; set; } = new();   // id; name empty (Q-1)
    public FileDto ApprovedFile { get; set; } = new();   // id, name from the path, path (D-13)
    public string DateCreated { get; set; } = "";        // yyyy-MM-ddTHH:mm:ss (I-18)
    public string? DateUpdated { get; set; }
    public int IdntUserUpdate { get; set; }
}
```

Saves return the shared `MutationResultDto { CreatedIds }`. Not returned: `restrictionUid`, `restrictionCode`, `reason`, `isActive`, `temporalStatus`, `syncStatus`, `requestUid` (TC-1, TC-2, C-2, C-11, C-12).

### 7.3 Rows (`Models/TraineeRestrictions/TraineeRestrictionsRows.cs`)

| Class | Columns (aliases) | Produced by |
|---|---|---|
| `TraineeRestrictionRow` | `Id`, `IsEnded`, `ConditionsRowId?`, `TraineeId`, `DateStart`, `DateEnd`, `NumbDurationLimit?`, `TimePermitStart?`, `TimePermitEnd?`, `TextReason?`, `IdntUserApproval?`, `ApproverName?` *(2026-11-09, I-22)*, `IdntApprovedFile?`, `TextFile?`, `DateCreated?`, `DateUpdated?`, `IdntUserUpdate?` | history set 1 |
| `DeviceRow` (shared) | `ConditionsRowId`, `DeviceId` *(`DeviceName` removed 2026-11-10, E-8; the DTO carries `IdntDeviceList: List<int>`)* | history set 2 |
| `CreatedIdRow` (shared) | `CreatedId` | every save |
| `TraineeRestrictionsRowSets(List<TraineeRestrictionRow> Restrictions, List<DeviceRow> Devices)` | the two result sets of one history call | repository |

Audit and approval columns are nullable in the row class (I-18); `ConditionsRowId` is NULL when the restriction has no inline row.

---

## 8. Composing the history (`TraineeRestrictionsAssembler`)

1. Read the two sets with `QueryMultiple`: `TraineeRestrictionRow` list, then `DeviceRow` list.
2. Build one lookup: devices by `ConditionsRowId`.
3. Each row → `TraineeRestrictionRecordDto`: flags copied; devices from `ConditionsRowId` (none when it is null); strings for dates, times and timestamps through `DateTimeStrings`; `ApprovedFile` through `FilePaths.FileNameFromPath`; `Approver` from `IdntUserApproval ?? 0` and `ApproverName ?? ""` (I-22); `TextReason ?? ""`, `IdntUserUpdate ?? 0`.
4. Return the list; sorting and search are the client's (B-5).

---

## 9. The update rule (final; T-7)

`SP_AVIV_UPDATE_TRAINEE_RESTRICTION`, inside one transaction with `SET XACT_ABORT ON`:

1. **Keys of the previous version**: `SELECT @TraineeId = IDNT_TRAINEE FROM dbo.AVIV_TRAINEE_RESTRICTION WHERE IDNT_AVIV_TRAINEE_RESTRICTION = @IDNT_PREVIOUS;`
2. **Claim**: `UPDATE dbo.AVIV_TRAINEE_RESTRICTION SET LOGI_ACTIVE = 0, DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID WHERE IDNT_AVIV_TRAINEE_RESTRICTION = @IDNT_PREVIOUS AND LOGI_ACTIVE = 1 AND CAST(DATE_RESTRICTION_END AS DATE) >= @Today; IF @@ROWCOUNT = 0 THROW 50409, 'idntPrevious', 1;`
3. **Deactivate the previous inline row and its devices** (P-4): select `@PreviousInlineConditionsId` where `IDNT_AVIV_RESTRICTION_TABLE = @IDNT_PREVIOUS AND CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee AND LOGI_RESTRICTION_INLINE_PERMIT = 1 AND LOGI_ACTIVE = 1`; set `LOGI_ACTIVE = 0` + audit on that row and on its active `AVIV_PERMITS_DEVICE` rows. Always, whether or not the new version has conditions.
4. **File** (D-13): insert `AVIV_FILE (TEXT_FILE, audit…)`, `@FileId = SCOPE_IDENTITY()`.
5. **New restriction row**: insert `AVIV_TRAINEE_RESTRICTION (IDNT_TRAINEE = @TraineeId, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT, TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE = @FileId, IDNT_USER_APPROVAL, audit…)`; `@TraineeRestrictionId = SCOPE_IDENTITY()`. `RESTRICTION_UID` and `CODE_RESTRICTION` are not written (T-1, T-5).
6. **Inline conditions row and its devices** (section header identical to the create procedure): `IF @HasInlineConditions = 1` insert `AVIV_PERMITS_FOR_RESTRICTION (IDNT_AVIV_RESTRICTION_TABLE = @TraineeRestrictionId, CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee, IDNT_TRAINEE = @TraineeId, LOGI_RESTRICTION_INLINE_PERMIT = 1, DATE_PERMIT_START = @DATE_RESTRICTION_START, DATE_PERMIT_END = @DATE_RESTRICTION_END, TIME_PERMIT_START, TIME_PERMIT_END, audit…)` (I-2), then its devices from `#Devices` (`DISTINCT`, A-1).
7. **No re-pointing** (D-1 does not apply).
8. `COMMIT; SELECT @TraineeRestrictionId AS CreatedId;`

After an update that removes hours and devices, the restriction has exactly one active row in `AVIV_TRAINEE_RESTRICTION`, no active row in `AVIV_PERMITS_FOR_RESTRICTION` and none in `AVIV_PERMITS_DEVICE`; the previous rows stay with `LOGI_ACTIVE = 0`.

---

## 10. Create flow (set-based; T-11)

`SP_AVIV_CREATE_TRAINEE_RESTRICTION`: `#Trainees (TraineeId INT PRIMARY KEY)` and `#Devices (DeviceId INT PRIMARY KEY)` from the TVPs with `DISTINCT`; `IF NOT EXISTS (SELECT 1 FROM #Trainees) THROW 50400, 'idntTraineeList', 1;` (I-12); `@HasInlineConditions` as in §4; then one transaction:

```sql
INSERT INTO dbo.AVIV_FILE (TEXT_FILE, …audit) VALUES (@TEXT_FILE, …);            -- D-13, one row per save
SET @FileId = SCOPE_IDENTITY();

CREATE TABLE #Created (TraineeRestrictionId INT PRIMARY KEY, TraineeId INT NOT NULL);

INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
        (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL, …audit)
OUTPUT  INSERTED.IDNT_AVIV_TRAINEE_RESTRICTION, INSERTED.IDNT_TRAINEE INTO #Created (TraineeRestrictionId, TraineeId)
SELECT  TRAINEES.TraineeId, @DATE_RESTRICTION_START, @DATE_RESTRICTION_END, @NUMB_DURATION_LIMIT,
        @TEXT_RESTRICTION_REASON, @FileId, @IDNT_USER_APPROVAL, …
FROM    #Trainees AS TRAINEES;

IF @HasInlineConditions = 1                                                       -- T-2: hours or devices only
BEGIN
    CREATE TABLE #InlineRows (InlineConditionsId INT PRIMARY KEY);

    INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
            (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
             DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, …audit)
    OUTPUT  INSERTED.IDNT_AVIV_PERMITS_FOR_RESTRICTION INTO #InlineRows (InlineConditionsId)
    SELECT  CREATED.TraineeRestrictionId, @RestrictionTypeTrainee, CREATED.TraineeId, 1,
            @DATE_RESTRICTION_START, @DATE_RESTRICTION_END, @TIME_PERMIT_START, @TIME_PERMIT_END, …
    FROM    #Created AS CREATED;

    INSERT INTO dbo.AVIV_PERMITS_DEVICE (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE, …audit)
    SELECT  INLINE_ROWS.InlineConditionsId, DEVICES.DeviceId, …
    FROM    #InlineRows AS INLINE_ROWS
    CROSS JOIN #Devices AS DEVICES;
END

COMMIT TRANSACTION;
SELECT TraineeRestrictionId AS CreatedId FROM #Created ORDER BY TraineeRestrictionId;
```

Why set-based is possible here and was not in 04 (I-1): `AVIV_TRAINEE_RESTRICTION` carries `IDNT_TRAINEE`, so `OUTPUT` returns the mapping by itself; the inline rows need no mapping beyond their own ids. The shape is the one 04 already uses for creating permits.

---

## 11. Client changes (C-list)

The final list, with the "shared with 04" column and the items unique to 03 (TC-1 `restrictionCode`, TC-2 `restrictionUid`, TC-3 `traineeId` in the update request), is [decisions.md section C](decisions.md). The field names in that list are the ones of §7 of this document. The combined 03 + 04 summary there is the single list the future client session works from.

---

## 12. Phase 3 – implementation plan

Runs after the owner's go-ahead, in four batches, each reported and approved before the next:

1. **Schema + read + test data.** `stored-procedures/schema/02-proposed-schema-changes-trainee-restrictions.sql` (the `sp_rename` of T-8, re-runnable, with the environment queries of TQ-1 and TQ-2); section 8 of the 04 script reduced to a pointer. `SP_AVIV_GET_TRAINEE_RESTRICTIONS`. `stored-procedures/trainee-restrictions/00-test-data.sql`: trainees 998001 and 998002 (a series of its own – the 04 script cleans by phone number, this one by these trainee ids), devices 999001 / 999002, approver 999001, acting user 999999 as in 04; scenario per trainee 998001: an active duration-only restriction, an active full restriction with hours and devices, an ended restriction, a future restriction with hours only; trainee 998002 without rows (empty history).
2. **Save procedures.** `SP_AVIV_CREATE_TRAINEE_RESTRICTION` (§10), `SP_AVIV_UPDATE_TRAINEE_RESTRICTION` (§9); the test script gets the save examples (create for two trainees with a duplicate device; create duration-only; update that removes hours and devices; update that adds hours) and the error examples (update ended → 409, update replaced → 409, unknown → 409, empty trainee list → 400), then the history again.
3. **C#.** The ten shared files of §2.2, the twelve 03 files of §2.1, and the 04 files edited and moved per §2.3; the 04 checklist §F.1 / §F.2 amended.
4. **`03-manual-test-checklist.md`** of 03, with a section "combined run order with 04": 04 DDL → 03 DDL → 04 procedures → 03 procedures → 04 test data → 03 test data → the C# of both features in one build → smoke tests of both → client with the combined C-list.

Verification of this phase: every action maps to a procedure with parameters and result sets (§3); every field of the client's response knows its set and column (§7–§8); every shared piece has one home (§2.2); the C-list is complete (decisions.md section C).
