# Number restrictions and permits – server side, phase 2: architecture

Status: approved by the product owner on 2026-11-07 after five review rounds. Phase 1 (schema analysis) is in [01-business-analysis.md](01-business-analysis.md); every decision referenced here (D-n, B-n, P-n, A-n, C-n, Q-n, I-n) is in [decisions.md](decisions.md).

Amended on 2026-11-08 during phase 3, after the owner's schema decisions: no CHECK constraints, no indexes, the details columns stay `varchar` (decisions.md D-18, A-1, A-2, A-10, P-7, P-9, I-13, I-14). The affected sentences below carry an "amended" note; the rest of the design is unchanged.

Amended again on 2026-11-08 after the owner's review of the C# batch: flags come from the procedures (`IsPermit`, `IsEnded`, `CodeRestrictionScope` as is), the history procedure returns four result sets, the C# layout is flat (16 files), and the placeholder fields are gone (decisions.md A-4, A-5, A-11, A-14, I-16, I-19, I-20, C-9 to C-12).

Amended on 2026-11-09 by feature 03 (decisions T-12 and T-13 in [../trainee-restrictions/decisions.md](../trainee-restrictions/decisions.md)): the code that both features share – the error translation (`ApiActionRunner`), the acting user (`ActingUserId`), the input rules (`RequestRules`), the record parts (`RecordPartsAssembler`: devices, institutes, approver, file), the Dapper helpers (`ProcedureParameters`, `CreatedIds`), the file-name rule (`FilePaths`) and the DTOs / rows (`Models/RecordDtos.cs`: `LookupItemDto`, `ApproverDto`, `FileDto`, `MutationResultDto`; `Models/RecordRows.cs`: `DeviceRow`, `InstituteRow`, `CreatedIdRow`) – was extracted from the 04 files into feature-neutral files, and the `Models/` and `Services/` files of 04 moved into `PhoneExceptions/` sub-folders with the namespaces `Aviv_Service.Models.PhoneExceptions` / `Aviv_Service.Services.PhoneExceptions`. The 04 logic is unchanged. The current file list and copy order are in [../trainee-restrictions/02-architecture.md §2](../trainee-restrictions/02-architecture.md) and in the 03 checklist §F; section 2 below describes the 2026-11-08 state and is kept for the history of the design.

Amended on 2026-11-09 by the client alignment (decisions.md I-22, I-23): the record SELECTs of the history procedure join the approver name from `ODSINTERNALDATA..A_WORKERS` (`ApproverName` on `PhoneRecordRow`), and the four save requests carry a reason code by action (`CodeRestrictionReason` / `CodePermitReason`, validated > 0) that reaches the procedures as `@CODE_RESTRICTION_REASON` / `@CODE_PERMIT_REASON` and is not written until the DBA adds the columns. The affected rows below carry an "amended 2026-11-09" note.

Scope: the server side of feature 04 ("הגבלות והיתרים למספר") – six HTTP actions, six stored procedures, the service layers, the contracts and the error handling. Phase 3 (implementation) starts from this document in a fresh session, after an explicit go-ahead.

---

## 1. Principles the design follows

1. **Readability and maintainability first** (G-1). One self-contained procedure per operation; a reader opens one file and sees the whole flow. A procedure never calls another procedure; when several are needed, the orchestrator runs them.
2. **The examples in `reference/` are conceptual** (G-4): `SP_AVIV_GET_LOCATIONS.sql` and `reference/service/*` show the house style (naming, layering, Dapper usage), not a template to copy 1:1. Local choices are made per case – for example, a one-row TVP is joined directly instead of being copied into a temp table.
3. **The client contract stays as it is**, except the changes listed in section 11 (C-list). Field names in the server DTOs follow the DB style of the existing service (`IdntTrainee…`), as the existing DTOs do (A-7).
4. **Integrity rules live in the service** (D-18, amended 2026-11-08): the request validator enforces the structural rules (section 6), the procedures keep the cross-row checks (409) and the required-field checks. There are no CHECK constraints. Form messages stay in the client.
5. **No silent failures**: repositories do not catch exceptions; the controller translates them to HTTP (A-6).

---

## 2. Layers and files

Namespaces and folders follow the existing service (`Aviv_Service.Models`, `.Interfaces`, `.Services`, `.Repository`, `.Utils`), plus `Aviv_Service.Infrastructure` for the error contract. Paths below are relative to `service-layer/`. *(Rewritten 2026-11-08 after the owner's review, I-16: 16 files, flat namespaces, no inheritance, no nested classes.)*

| File | Responsibility |
|---|---|
| `Controllers/PhoneExceptionsController.cs` | `[Authorize] [ApiController] [Route("api/[controller]")]`. Six thin actions named as the client calls them: `GetTraineePhoneRecords`, `LookupPhoneRestrictionsForPermit`, `CreateTraineePhoneRestriction`, `UpdateTraineePhoneRestriction` (PUT), `CreateTraineePhonePermit`, `UpdateTraineePhonePermit` (PUT). Each action calls one shared `RunAsync`: call the orchestrator, `Ok(result)`; `catch (ApiException)` → status + `ApiErrorDto`; `catch (SqlException) when business` → the same through `SqlErrorMapper`; `catch (Exception)` → log + 500. A missing or malformed body is rejected by `[ApiController]` before the action. |
| `Interfaces/IPhoneExceptionsOrchestrator.cs`, `Services/PhoneExceptionsOrchestrator.cs` | One orchestrator for the feature. Validates the request (`PhoneExceptionsRequestValidator`), reads the acting user from `ICurrentUserService`, creates the request GUID, calls the repository with the validated request, assembles the response DTOs from the row sets (`PhoneRecordsAssembler`). No try/catch. |
| `Services/PhoneExceptionsRequestValidator.cs` | Structural validation of every request (section 6), one explicitly named method per request. Throws `ApiException(400, fieldName)` on the first failing rule per field and returns the normalized copy of the request (I-4). |
| `Services/PhoneRecordsAssembler.cs` | Rows → DTOs: joins devices (by `ConditionsRowId`), institutes and existing permits to their parent rows, formats dates and times back to strings, sorts the lookup results. Copies `IsPermit`, `IsEnded` and `CodeRestrictionScope` as the procedures return them (I-19). |
| `Interfaces/IPhoneExceptionsRepository.cs`, `Repository/PhoneExceptionsRepository.cs` | One method per procedure, taking the validated request (saves: plus the acting user and the request GUID). `DynamicParameters`; TVPs through the existing `ToDataTable()` + `DbType.Object`; date and time strings parsed to `DateTime` at the parameter line; strings with explicit sizes. Every call goes through `dataAccess.QueryMultiple(parameters, StoredProcedures.<NAME>, ConnectionStrings.ZeroThree03, reader => …)`, for saves too (the last result set carries the created ids). No `try/catch`. |
| `Models/PhoneExceptionsRequests.cs` | The six request records (section 7.1). |
| `Models/PhoneExceptionsResponses.cs` | The response classes (section 7.2), including `MutationResultDto`. |
| `Models/PhoneExceptionsRows.cs` | The flat row shapes the procedures return (section 7.3); column aliases in PascalCase map to properties by name. `PhoneRecordRow` serves both record sets of the history; `TraineePhoneRecordsRowSets` and `RestrictionsForPermitRowSets` carry the result sets of one procedure call. |
| `Infrastructure/ApiException.cs`, `Infrastructure/ApiErrors.cs` | The error contract (section 5): `ApiException`; `ApiErrorDto`, `ApiErrorCodes`, `ErrorResponses`, `SqlErrorMapper`. |
| `Utils/StoredProcedures.PhoneExceptions.cs`, `Utils/PhoneExceptionsConstants.cs`, `Utils/PhoneNumbers.cs`, `Utils/DateTimeStrings.cs` | Procedure name constants (a `partial` addition to the existing class); the input limits and the camelCase field names of 400 bodies (`PhoneExceptionsLimits`, `PhoneExceptionsRequestFields`, I-14, I-17); phone normalization and validation; the string ↔ `DateTime` conversions of A-8 (I-5, I-18). |

The stored procedures live in `stored-procedures/number-restrictions/`, one file per procedure, and the DDL for the DBA in `stored-procedures/schema/`.

---

## 3. Actions → procedures

| Action | Procedure | Parameters | Result sets |
|---|---|---|---|
| `POST GetTraineePhoneRecords` | `SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS` | `@IDNT_TRAINEE_LIST dbo.INT_TABLE READONLY` | *(amended 2026-11-08, I-19)* 1 restrictions (`IsPermit = 0`: trainee row + parent + number + inline conditions row + file); 2 permits (`IsPermit = 1`, same aliases + source restriction summary + file); 3 devices of both, keyed by `ConditionsRowId`; 4 institutes of the source restrictions. Both record sets carry `IsEnded` |
| `POST LookupPhoneRestrictionsForPermit` | `SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT` | `@IDNT_TRAINEE INT`, `@IDNT_INSTITUTION INT`, `@PHONE_NUMBER_LIST VARCHAR(500)` (comma-separated, normalized numbers) | 1 applicable restrictions, not ended (general ones with no active institute link or with a link to the trainee's institute, and the trainee's own); 2 their institutes; 3 the trainee's existing permits on them, not ended; 4 devices of those permits |
| `POST CreateTraineePhoneRestriction` | `SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER` | `@IDNT_TRAINEE_LIST INT_TABLE`, `@PHONE_NUMBER_LIST VARCHAR(500)`, `@DATE_RESTRICTION_START DATETIME`, `@DATE_RESTRICTION_END DATETIME`, `@NUMB_DURATION_LIMIT INT = NULL`, `@TIME_PERMIT_START DATETIME = NULL`, `@TIME_PERMIT_END DATETIME = NULL`, `@IDNT_DEVICE_LIST INT_TABLE`, `@TEXT_RESTRICTION_REASON VARCHAR(1000)`, `@IDNT_USER_APPROVAL INT`, `@TEXT_FILE NVARCHAR(500)`, `@IDNT_USER INT`, `@REQUEST_UID UNIQUEIDENTIFIER` | 1 created ids (`IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER`, one per trainee × number) |
| `PUT UpdateTraineePhoneRestriction` | `SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER` | `@IDNT_PREVIOUS INT` (the previous trainee row), the same fields without the trainee and number lists | 1 the new id |
| `POST CreateTraineePhonePermit` | `SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER` | `@IDNT_TRAINEE_LIST INT_TABLE`, `@IDNT_INSTITUTION INT = NULL` (C-6; `NULL` skips the institute-narrowing check), `@IDNT_AVIV_RESTRICTION_NUMBER INT`, `@DATE_PERMIT_START/END DATETIME`, `@NUMB_DURATION_LIMIT INT = NULL`, `@TIME_PERMIT_START/END DATETIME = NULL`, `@IDNT_DEVICE_LIST INT_TABLE`, `@TEXT_PERMIT_REASON VARCHAR(1000)`, `@IDNT_USER_APPROVAL INT`, `@TEXT_FILE NVARCHAR(500)`, `@IDNT_USER INT`, `@REQUEST_UID UNIQUEIDENTIFIER` | 1 created ids (`IDNT_AVIV_PERMITS_FOR_RESTRICTION`) |
| `PUT UpdateTraineePhonePermit` | `SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER` | `@IDNT_PREVIOUS INT` (the previous permit row), the same fields without the trainee list and the restriction id (taken from the previous row) | 1 the new id |

Shared parameter rules: lists of ids are `dbo.INT_TABLE`; the list of phone numbers is one comma-separated `VARCHAR(500)` split with `STRING_SPLIT` (order is not a requirement, A-9); every string has an explicit size (A-10); the acting user and the request GUID come from the service (D-14, D-19). *(Amended 2026-11-09, I-23)* Every save procedure also takes the reason code right after its details parameter – `@CODE_RESTRICTION_REASON INT = NULL` (restrictions) / `@CODE_PERMIT_REASON INT = NULL` (permits) – accepted and not written until the DBA adds the columns of the same names.

---

## 4. Procedure conventions

In the spirit of `SP_AVIV_GET_LOCATIONS`, adapted where readability gains:

- Header block: Author, Create date, Description (Hebrew). `SET NOCOUNT ON;`. Save procedures add `SET XACT_ABORT ON;` and wrap the work in `BEGIN TRANSACTION … COMMIT TRANSACTION`.
- Sections separated by `-- ====` headers in Hebrew. The two update procedures use **identical section headers** for the parts that repeat ("החלפת גרסת האב", "הצבעה מחדש של ההיתרים"), so a diff shows drift (A-3).
- `DECLARE @Today DATE = CAST(GETDATE() AS DATE);` once; every date comparison casts both sides to `DATE`, so the end day is inclusive (the columns stay `datetime`, A-8).
- Times of day are stored on the base date `1900-01-01` (what SQL gives for `CAST('17:00' AS DATETIME)`); the hours window applies every day of the range, so no other date is meaningful.
- Lists: `DROP TABLE IF EXISTS` then a temp table with a primary key when the list is joined more than once or needs `DISTINCT` (devices, phone numbers); a one-row TVP is joined directly.
- Business checks are one line each: `IF <condition> THROW 50409, 'fieldName', 1;` (section 5). With `XACT_ABORT ON` the transaction rolls back by itself.
- Every `INSERT` and `UPDATE` writes `DATE_UPDATED = GETDATE()`, `IDNT_USER_UPDATE = @IDNT_USER`, `LAST_REQUEST_UID = @REQUEST_UID`; inserts also set `DATE_CREATED`, `LOGI_ACTIVE = 1`. `LAST_SUCCESS_REQUEST_UID` is never touched (D-19).
- `(NOLOCK)` only in the two read procedures.
- Column aliases in PascalCase, matching the `Rows` classes.
- Hebrew comments only where they add a reason or a decision reference (`-- D-1: …`).

---

## 5. Business checks and the error contract

Two business outcomes beside success (A-2): **400** – the input is wrong, with the field to fix; **409** – the record the request refers to is no longer valid, reload and retry. "Not found" is a 409 case. Anything else is 500.

### 5.1 Checks in the procedures

| Procedure | Check | Code and field |
|---|---|---|
| `UPDATE_TRAINEE_RESTRICTION_NUMBER` | The previous trainee row does not exist, is already replaced (`LOGI_ACTIVE = 0`) or has ended (`CAST(DATE_RESTRICTION_END AS DATE) < @Today`). Done as one claim: `UPDATE … SET LOGI_ACTIVE = 0 … WHERE IDNT = @IDNT_PREVIOUS AND LOGI_ACTIVE = 1 AND CAST(DATE_RESTRICTION_END AS DATE) >= @Today; IF @@ROWCOUNT = 0 THROW 50409, 'idntPrevious', 1;` | 409 `idntPrevious` |
| `CREATE_TRAINEE_PERMIT_…` | The source restriction is not active, has ended, or does not apply to the trainee (general with no active institute link; general with a link to `@IDNT_INSTITUTION`; or the trainee's own). | 409 `idntAvivRestrictionNumber` |
| | Permit dates outside the restriction's dates. | 400 `datePermitStart` |
| `UPDATE_TRAINEE_PERMIT_…` | The previous permit does not exist, is replaced, or has ended (claim as above). | 409 `idntPrevious` |
| | Its restriction has ended (B-3). | 409 `idntAvivRestrictionNumber` |
| | Permit dates outside the restriction's dates. | 400 `datePermitStart` |
| all saves | Required fields: empty trainee list, empty phone-number list (I-12). | 400 `idntTraineeList` / `phoneNumberList` |
| all saves | *(amended 2026-11-08)* No CHECK constraints. Date order, duration 1–120, time pair and phone format are enforced by the request validator before the call (section 6). | – |

### 5.2 Mapping in the service (`SqlErrorMapper`)

| `SqlException.Number` | Result |
|---|---|
| 50400 … 50499 | `ApiException(Number - 50000, Message)` – the message is the field name |
| anything else | rethrown → 500. *(amended 2026-11-08)* The former 547 (CHECK constraint → field by constraint name) and 2601/2627 (unique index → 409) rows are gone: no CHECK constraints and no unique index exist, so there is nothing to map. A failed `sp_getapplock` (50500, I-13) lands here too. |

### 5.3 The HTTP body

```json
{ "code": "VALIDATION_ERROR", "message": "datePermitStart", "fieldErrors": { "datePermitStart": "" } }
```

`code` is `VALIDATION_ERROR` (400), `CONFLICT` (409) or `SERVER_ERROR` (500); `fieldErrors` carries the field name with an empty text (the client keeps its own Hebrew messages, C-4). *(Amended 2026-11-08)* The translation runs in the controller's shared `RunAsync`: `ApiException` from the validator and the business `SqlException` from the procedures take the same path; anything else is logged there and becomes 500.

---

## 6. Validation in the orchestrator (`PhoneExceptionsRequestValidator`)

Runs before any database call; the first failing rule per field becomes `ApiException(400, field)`.

| Field | Rule |
|---|---|
| `IdntTraineeList` | not empty, all > 0 |
| `PhoneNumberList` (create restriction) | not empty; each number normalized (spaces, hyphens, parentheses removed) and matching `^0\d{8,9}$`; duplicates removed |
| `PhoneNumberList` (lookup) | same rule, at least one |
| `IdntAvivRestrictionNumber` (permits) | > 0 |
| `IdntPrevious` (updates) | > 0 |
| `DateRestrictionStart/End`, `DatePermitStart/End` | present, format `yyyy-MM-dd`, end ≥ start |
| `NumbDurationLimit` | null or 1–120 |
| `TimePermitStart/End` | both null or both present, format `HH:mm`, end > start |
| `IdntDeviceList` | all > 0, duplicates removed |
| `TextRestrictionReason` / `TextPermitReason` (details) | not blank, ≤ 1000 characters |
| `CodeRestrictionReason` / `CodePermitReason` *(amended 2026-11-09, I-23)* | > 0 (accepted, not stored) |
| `IdntUserApproval` | > 0 |
| `TextFile` | not blank, ≤ 500 characters |

---

## 7. Data shapes

### 7.1 Requests (`Models/PhoneExceptionsRequests.cs`)

Records with DB-style names; dates and times are strings (A-8).

```csharp
public record GetTraineePhoneRecordsRequestDto(int[] IdntTraineeList);

public record LookupRestrictionsForPermitRequestDto(int IdntTrainee, int IdntInstitution, string[] PhoneNumberList);

public record CreateTraineeRestrictionNumberRequestDto(
    int[] IdntTraineeList, string[] PhoneNumberList,
    string DateRestrictionStart, string DateRestrictionEnd,
    int? NumbDurationLimit, string? TimePermitStart, string? TimePermitEnd, int[] IdntDeviceList,
    string TextRestrictionReason, int IdntUserApproval, string TextFile, string? TextFileName);

public record UpdateTraineeRestrictionNumberRequestDto(
    int IdntPrevious,
    string DateRestrictionStart, string DateRestrictionEnd,
    int? NumbDurationLimit, string? TimePermitStart, string? TimePermitEnd, int[] IdntDeviceList,
    string TextRestrictionReason, int IdntUserApproval, string TextFile, string? TextFileName);

public record CreateTraineePermitRequestDto(
    int[] IdntTraineeList, int? IdntInstitution, int IdntAvivRestrictionNumber,
    string DatePermitStart, string DatePermitEnd,
    int? NumbDurationLimit, string? TimePermitStart, string? TimePermitEnd, int[] IdntDeviceList,
    string TextPermitReason, int IdntUserApproval, string TextFile, string? TextFileName);

public record UpdateTraineePermitRequestDto(
    int IdntPrevious,
    string DatePermitStart, string DatePermitEnd,
    int? NumbDurationLimit, string? TimePermitStart, string? TimePermitEnd, int[] IdntDeviceList,
    string TextPermitReason, int IdntUserApproval, string TextFile, string? TextFileName);
```

`TextFileName` is kept for display only (the orchestrator falls back to the last path segment); the procedures take `@TEXT_FILE` alone until `AVIV_FILE` gets a name column. *(Amended 2026-11-09, I-23)* The four save records also carry `int CodeRestrictionReason` (restrictions) / `int CodePermitReason` (permits), placed after the details field.

### 7.2 Responses (`Models/PhoneExceptionsResponses.cs`)

Same structure as the client's DTOs, DB-style names, strings for dates and times.

```csharp
public class TraineePhoneRecordsResponseDto { public List<TraineePhoneRecordDto> Records { get; set; } = []; }

public class TraineePhoneRecordDto                       // one class, two kinds (A-4)
{
    public bool IsPermit { get; set; }                   // from the procedure (I-19): false = restriction, true = permit
    public int Id { get; set; }                          // trainee row id (restriction) or permit id (permit)
    public int IdntAvivRestrictionNumber { get; set; }   // the parent (restriction) or the source restriction (permit)
    public int IdntTrainee { get; set; }
    public int IdntAvivListPhoneNumber { get; set; }
    public string TextPhoneNumber { get; set; } = "";
    public string DateStart { get; set; } = "";          // yyyy-MM-dd
    public string DateEnd { get; set; } = "";
    public bool IsEnded { get; set; }                    // from the procedure (I-19): end date before the server's today
    public int? NumbDurationLimit { get; set; }
    public string? TimePermitStart { get; set; }         // HH:mm
    public string? TimePermitEnd { get; set; }
    public List<LookupItemDto> Devices { get; set; } = [];
    public string TextReason { get; set; } = "";         // details (D-6)
    public ApproverDto Approver { get; set; } = new();   // id; name empty (Q-1)
    public FileDto ApprovedFile { get; set; } = new();   // id, name from the path, path
    public string DateCreated { get; set; } = "";
    public string? DateUpdated { get; set; }
    public int IdntUserUpdate { get; set; }
    public SourceRestrictionSummaryDto? SourceRestriction { get; set; }   // permit only
}

public class SourceRestrictionSummaryDto
{
    public int IdntAvivRestrictionNumber { get; set; }
    public int? IdntAvivTraineeRestrictionNumber { get; set; }
    public int IdntAvivListPhoneNumber { get; set; }
    public string TextPhoneNumber { get; set; } = "";
    public int CodeRestrictionScope { get; set; }        // DECODE value as is: 1 general, 2 trainee (A-5 amended, C-9)
    public List<LookupItemDto> Institutes { get; set; } = [];
    public string DateStart { get; set; } = "";
    public string DateEnd { get; set; } = "";
    public string TextReason { get; set; } = "";
    public List<ExistingPermitDto> ExistingTraineePermits { get; set; } = [];
}

public class LookupRestrictionsForPermitResponseDto { public List<PhoneLookupResultDto> Results { get; set; } = []; }
public class PhoneLookupResultDto { public string TextPhoneNumber { get; set; } = ""; public List<SourceRestrictionSummaryDto> ActiveRestrictions { get; set; } = []; }

public class ExistingPermitDto { public int Id { get; set; } public string DateStart { get; set; } = ""; public string DateEnd { get; set; } = ""; public int? NumbDurationLimit { get; set; } public string? TimePermitStart { get; set; } public string? TimePermitEnd { get; set; } public List<LookupItemDto> Devices { get; set; } = []; }
public class LookupItemDto { public int Id { get; set; } public string Name { get; set; } = ""; }
public class ApproverDto { public int Id { get; set; } public string FullName { get; set; } = ""; public string? RoleTitle { get; set; } }
public class FileDto { public int Id { get; set; } public string FileName { get; set; } = ""; public string TextFile { get; set; } = ""; }

public class MutationResultDto { public List<int> CreatedIds { get; set; } = []; }
public class ApiErrorDto { public string Code { get; set; } = ""; public string Message { get; set; } = ""; public Dictionary<string, string>? FieldErrors { get; set; } }   // Infrastructure/ApiErrors.cs
```

*(Amended 2026-11-08)* `CodeRestrictionScope` is the DECODE value as the procedure returns it; the client derives national / institute / trainee from it and from `Institutes` (C-9). `IsPermit` and `IsEnded` come from the procedure (I-19). No longer returned (I-20, C-10, C-12): `Type`, `TemporalStatus`, `IsActive`, `SyncStatus`, `Reason`, `InlinePermitId`, and `RequestUid` / `SyncStatus` of the mutation result.

### 7.3 Rows (`Models/PhoneExceptionsRows.cs`)

| Class | Columns (aliases) | Produced by |
|---|---|---|
| `PhoneRecordRow` *(2026-11-08)* | `Id`, `IsPermit`, `IsEnded`, `RestrictionNumberId`, `ConditionsRowId?`, `TraineeId`, `PhoneNumberId`, `PhoneNumber`, `DateStart`, `DateEnd`, `NumbDurationLimit?`, `TimePermitStart?`, `TimePermitEnd?`, `TextReason`, `IdntUserApproval`, `ApproverName` *(2026-11-09, I-22)*, `IdntApprovedFile`, `TextFile`, `DateCreated`, `DateUpdated?`, `IdntUserUpdate`; permits only: `SourceCodeRestrictionScope`, `SourceDateStart`, `SourceDateEnd`, `SourceTextReason`, `SourceTraineeRestrictionNumberId?` | history sets 1 (restrictions) and 2 (permits), read into one list |
| `SourceRestrictionRow` | `PhoneNumber`, `RestrictionNumberId`, `TraineeRestrictionNumberId?`, `PhoneNumberId`, `CodeRestrictionScope`, `DateStart`, `DateEnd`, `TextReason` | lookup set 1 |
| `InstituteRow` | `RestrictionNumberId`, `InstituteId`, `InstituteName` | history set 4, lookup set 2 |
| `ExistingPermitRow` | `PermitId`, `RestrictionNumberId`, `DateStart`, `DateEnd`, `NumbDurationLimit?`, `TimePermitStart?`, `TimePermitEnd?` | lookup set 3 |
| `DeviceRow` | `ConditionsRowId`, `DeviceId`, `DeviceName` | history set 3, lookup set 4 |
| `CreatedIdRow` | `CreatedId` | every save |

`InstituteName` and `DeviceName` are joined in the procedures (amended 2026-11-08, I-15): devices from `AVIV_DEVICE_DATA`, institutes from `ODSINTERNALDATA..A_LOCATION` (type "פנימייה"), both `LEFT JOIN` with `ISNULL(name, '')`, so a missing lookup row still yields the id with an empty name (C-8). The column names follow `SP_AVIV_GET_LOCATIONS` and are confirmed in SSMS before the first run (Q-9, Q-10). *(Amended 2026-11-09, I-22)* `ApproverName` is joined the same way from `ODSINTERNALDATA..A_WORKERS` (`IDNT_WORKER`, `TEXT_FIRST_NAME` + `TEXT_LAST_NAME`; assumed, confirmed in SSMS); `RecordPartsAssembler.ToApprover(id, name)` fills `ApproverDto.FullName`, and `RoleTitle` stays empty.

---

## 8. Composing the history and the lookup (`PhoneRecordsAssembler`)

*(Amended 2026-11-08, I-19)*

1. Read the four history sets with `QueryMultiple`: sets 1 and 2 into one `PhoneRecordRow` list (same aliases; `IsPermit` tells them apart), then `DeviceRow`, then `InstituteRow`.
2. Build lookups: devices by `ConditionsRowId`, institutes by `RestrictionNumberId`.
3. Each `PhoneRecordRow` → `TraineePhoneRecordDto`: the flags copied, devices from `ConditionsRowId` (none when it is null), strings for dates and times; for a permit row also a `SourceRestrictionSummaryDto` from the `Source*` columns plus the institutes of its `RestrictionNumberId` (existing permits are not filled in the history – the client does not use them there).
4. Return the list; sorting is the client's (B-5).

The lookup follows the same pattern: `SourceRestrictionRow` + institutes + existing permits (with their devices) → `SourceRestrictionSummaryDto` per phone number, grouped into `PhoneLookupResultDto` in the order of the request's numbers, each list sorted by `CodeRestrictionScope`, then "has institutes", then `DateStart` (spec 04 §2.7).

---

## 9. The update rule for a trainee's number restriction (final)

Inside one transaction (`SET XACT_ABORT ON`):

1. **Claim** the previous trainee row (`AVIV_TRAINEE_RESTRICTION_NUMBER`): set `LOGI_ACTIVE = 0` with the audit columns, `WHERE … = @IDNT_PREVIOUS AND LOGI_ACTIVE = 1 AND CAST(DATE_RESTRICTION_END AS DATE) >= @Today` (via the parent); `@@ROWCOUNT = 0` → `THROW 50409, 'idntPrevious', 1`.
2. Deactivate the previous parent row (`AVIV_RESTRICTION_NUMBER`).
3. Deactivate the previous inline conditions row and its `AVIV_PERMITS_DEVICE` rows (P-4).
4. Insert the `AVIV_FILE` row from `@TEXT_FILE` (D-13).
5. Insert the new parent row (same number and scope, new dates, details, approval, file) and the new trainee row.
6. If the request carries conditions (duration, hours or devices): insert the inline conditions row (`LOGI_RESTRICTION_INLINE_PERMIT = 1`, the trainee in `IDNT_TRAINEE`) and its device rows (`DISTINCT`).
7. **Re-point** the active user permits: `UPDATE AVIV_PERMITS_FOR_RESTRICTION SET IDNT_AVIV_RESTRICTION_TABLE = @NewParentId, <audit> WHERE IDNT_AVIV_RESTRICTION_TABLE = @OldParentId AND CODE_RESTRICTION_TYPE = <number restriction> AND LOGI_RESTRICTION_INLINE_PERMIT = 0 AND LOGI_ACTIVE = 1` (D-1).
8. `SELECT @NewTraineeRowId AS CreatedId`.

The permit update is the same shape without steps 2, 5 and 7: claim the previous permit, check its restriction (409 if ended, B-3) and the dates (400), insert file, insert the new permit row and devices, deactivate the old devices, return the new id.

---

## 10. Create flows

- **Restriction**: normalize and de-duplicate the numbers; for each number get-or-create the `AVIV_LIST_PHONE_NUMBER` row (insert with `WHERE NOT EXISTS`, then re-select; concurrent saves are serialized with `sp_getapplock`, I-13, amended 2026-11-08 – there is no unique index); insert the file row once; for every trainee × number insert the parent (scope 2), the trainee row, the inline conditions row and its devices when conditions exist; return all created trainee row ids (P-12, one transaction, all or nothing).
- **Permit**: check the source restriction (409), check the dates (400), insert the file row, for every trainee insert the permit row (`LOGI_RESTRICTION_INLINE_PERMIT = 0`) and its devices; return the created permit ids.

---

## 11. Client changes deferred (C-list)

| ID | Change |
|---|---|
| C-1 | Save requests send `TextFile` (+ `TextFileName`) instead of `approvedFileId`; `Files/RegisterApprovedFile` and the client's registration layer go away. |
| C-2 | `reason` / `reasonCode` are not stored; "סיבה" on the card and "create similar" stay empty until adapted; no reasons lookup endpoint. |
| C-3 | `syncStatus` / `requestUid` come back empty. |
| C-4 | Validation messages stay in the client; the server returns 400 with field names only (empty texts), and 409. |
| C-5 | Fix the comment on `TraineePhonePermitRecordDto` (non-existent table name). |
| C-6 | `IdntInstitution` is added to the create-permit request (needed for the "applies to the trainee" check of institute-narrowed general restrictions). |
| C-7 | Request and response field names follow the DB style (`IdntTrainee`, `TextPhoneNumber`, `DateStart`…); the client's schema files are adapted. |
| C-8 | `approver.fullName` / `roleTitle` arrive mocked until the users table is joined (Q-1); institute and device names are joined since 2026-11-08 (I-15) but arrive empty when the lookup row is missing; the client falls back to its own caches or shows the id. |
| C-9 | `sourceRestriction.scope` becomes `CodeRestrictionScope` (1 general, 2 trainee) next to `Institutes`; the client derives national / institute / trainee (`buildScopeLabel`, mock handlers). |
| C-10 | `type` becomes the boolean `IsPermit` from the procedure; `inlinePermitId` is no longer returned. |
| C-11 | `temporalStatus` becomes the boolean `IsEnded` from the procedure, in the shared `AuditMetadataDto` of histories 03, 04 and 05 (`isRecordActive` = `!isEnded`). |
| C-12 | `isActive`, `syncStatus`, `reason` and the mutation result's `requestUid` / `syncStatus` are not returned (I-20). |

---

## 12. Phase 3 – implementation plan

Runs in a **new session**, from this document, `decisions.md`, the DDL script and `reference/`, after the owner's go-ahead.

1. Apply the DDL script with the DBA (`stored-procedures/schema/01-proposed-schema-changes.sql`): `CODE_RESTRICTION_SCOPE`, `LOGI_RESTRICTION_INLINE_PERMIT`, `TEXT_PERMIT_REASON` (`varchar`), the two `DECODE` sets. *(amended 2026-11-08)* No CHECK constraints and no indexes.
2. Read procedures: `SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS`, `SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT`, with a test-data script for SSMS (one trainee, one general restriction narrowed to the trainee's institute, one trainee restriction with conditions, one permit).
3. Save procedures: create and update of the restriction, create and update of the permit; SSMS tests for each 400 and 409 path and for the re-pointing.
4. C#: `Rows` → `PhoneExceptionsRepository` → `PhoneExceptionsRequestValidator`, `PhoneRecordsAssembler`, `SqlErrorMapper` → `PhoneExceptionsOrchestrator` → `PhoneExceptionsController`; `StoredProcedures` constants.
5. Manual end-to-end check by the owner against the client, with a checklist delivered with the code: [03-manual-test-checklist.md](03-manual-test-checklist.md) (batch 4, 2026-11-09).

Verification of this phase: every action maps to a procedure with parameters and result sets (section 3); every field in the client's response knows its set and column (sections 7–8); the C-list is complete (section 11).
