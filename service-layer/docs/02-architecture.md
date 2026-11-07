# Number restrictions and permits – server side, phase 2: architecture

Status: approved by the product owner on 2026-11-07 after five review rounds. Phase 1 (schema analysis) is in [01-business-analysis.md](01-business-analysis.md); every decision referenced here (D-n, B-n, P-n, A-n, C-n, Q-n) is in [decisions.md](decisions.md).

Scope: the server side of feature 04 ("הגבלות והיתרים למספר") – six HTTP actions, six stored procedures, the service layers, the contracts and the error handling. Phase 3 (implementation) starts from this document in a fresh session, after an explicit go-ahead.

---

## 1. Principles the design follows

1. **Readability and maintainability first** (G-1). One self-contained procedure per operation; a reader opens one file and sees the whole flow. A procedure never calls another procedure; when several are needed, the orchestrator runs them.
2. **The examples in `reference/` are conceptual** (G-4): `SP_AVIV_GET_LOCATIONS.sql` and `reference/service/*` show the house style (naming, layering, Dapper usage), not a template to copy 1:1. Local choices are made per case – for example, a one-row TVP is joined directly instead of being copied into a temp table.
3. **The client contract stays as it is**, except the changes listed in section 11 (C-list). Field names in the server DTOs follow the DB style of the existing service (`IdntTrainee…`), as the existing DTOs do (A-7).
4. **Integrity rules live in the database** (D-18): CHECK constraints plus two cross-row checks in the procedures. Form messages stay in the client.
5. **No silent failures**: repositories do not catch exceptions; the controller translates them to HTTP (A-6).

---

## 2. Layers and files

Namespaces and folders follow the existing service (`Aviv_Service.Models`, `.Interfaces`, `.Services`, `.Repository`, `.Utils`). Paths below are relative to `service-layer/`.

| File | Responsibility |
|---|---|
| `Controllers/PhoneExceptionsController.cs` | `[Authorize] [ApiController] [Route("api/[controller]")]`. Six thin actions named as the client calls them: `GetTraineePhoneRecords`, `LookupPhoneRestrictionsForPermit`, `CreateTraineePhoneRestriction`, `UpdateTraineePhoneRestriction` (PUT), `CreateTraineePhonePermit`, `UpdateTraineePhonePermit` (PUT). Each action: null check of the body, call the orchestrator, return `Ok(result)`; `catch (ApiException)` → status + `ApiErrorDto`; `catch (Exception)` → log + 500. The translation is one helper, `ErrorResponses`. |
| `Interfaces/IPhoneExceptionsOrchestrator.cs`, `Services/PhoneExceptionsOrchestrator.cs` | One orchestrator for the feature. Validates the request (`PhoneExceptionsRequestValidator`), converts date and time strings to `DateTime`, reads the acting user from `ICurrentUserService`, creates the request GUID, calls the repository, assembles the response DTOs from the row sets (`PhoneRecordsAssembler`), and maps `SqlException` to `ApiException` (`SqlErrorMapper`). |
| `Services/PhoneExceptions/PhoneExceptionsRequestValidator.cs` | Structural validation of every request (section 6). Throws `ApiException(400, fieldName)` on the first failing rule per field. |
| `Services/PhoneExceptions/PhoneRecordsAssembler.cs` | Rows → DTOs: joins devices, institutes and existing permits to their parent rows by id, derives `Type`, `Scope` and `TemporalStatus`, formats dates and times back to strings. |
| `Interfaces/IPhoneExceptionsRepository.cs`, `Repository/PhoneExceptionsRepository.cs` | One method per procedure. `DynamicParameters`; TVPs through the existing `ToDataTable()` + `DbType.Object`; dates `DbType.DateTime`; strings with explicit sizes. Every call goes through `dataAccess.QueryMultiple(parameters, StoredProcedures.<NAME>, ConnectionStrings.ZeroThree03, reader => …)`, for saves too (the last result set carries the created ids). No `try/catch`. |
| `Models/PhoneExceptions/Requests/*.cs` | Request records (section 7.1). |
| `Models/PhoneExceptions/Responses/*.cs` | Response classes (section 7.2), including `MutationResultDto` and `ApiErrorDto`. |
| `Models/PhoneExceptions/Rows/*.cs` | The flat row shapes the procedures return (section 7.3); column aliases in PascalCase map to properties by name. |
| `Infrastructure/Errors/ApiException.cs`, `SqlErrorMapper.cs`, `ErrorResponses.cs` | The error contract (section 5). |
| `Utils/StoredProcedures.cs` (additions), `Utils/PhoneNumbers.cs` | Procedure name constants; phone normalization and validation. |

The stored procedures live in `stored-procedures/phone-exceptions/`, one file per procedure, and the DDL for the DBA in `stored-procedures/schema/`.

---

## 3. Actions → procedures

| Action | Procedure | Parameters | Result sets |
|---|---|---|---|
| `POST GetTraineePhoneRecords` | `SP_AVIV_GET_TRAINEE_PHONE_RECORDS` | `@IDNT_TRAINEE_LIST dbo.INT_TABLE READONLY` | 1 restrictions (trainee row + parent + number + inline conditions row + file); 2 devices of the inline conditions rows; 3 permits (+ source restriction summary + file); 4 devices of the permits; 5 institutes of the source restrictions |
| `POST LookupPhoneRestrictionsForPermit` | `SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT` | `@IDNT_TRAINEE INT`, `@IDNT_INSTITUTION INT`, `@PHONE_NUMBER_LIST VARCHAR(500)` (comma-separated, normalized numbers) | 1 applicable restrictions, not ended (general ones with no active institute link or with a link to the trainee's institute, and the trainee's own); 2 their institutes; 3 the trainee's existing permits on them, not ended; 4 devices of those permits |
| `POST CreateTraineePhoneRestriction` | `SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER` | `@IDNT_TRAINEE_LIST INT_TABLE`, `@PHONE_NUMBER_LIST VARCHAR(500)`, `@DATE_RESTRICTION_START DATETIME`, `@DATE_RESTRICTION_END DATETIME`, `@NUMB_DURATION_LIMIT INT = NULL`, `@TIME_PERMIT_START DATETIME = NULL`, `@TIME_PERMIT_END DATETIME = NULL`, `@IDNT_DEVICE_LIST INT_TABLE`, `@TEXT_RESTRICTION_REASON NVARCHAR(1000)`, `@IDNT_USER_APPROVAL INT`, `@TEXT_FILE NVARCHAR(500)`, `@IDNT_USER INT`, `@REQUEST_UID UNIQUEIDENTIFIER` | 1 created ids (`IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER`, one per trainee × number) |
| `PUT UpdateTraineePhoneRestriction` | `SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER` | `@IDNT_PREVIOUS INT` (the previous trainee row), the same fields without the trainee and number lists | 1 the new id |
| `POST CreateTraineePhonePermit` | `SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER` | `@IDNT_TRAINEE_LIST INT_TABLE`, `@IDNT_INSTITUTION INT = NULL` (C-6; `NULL` skips the institute-narrowing check), `@IDNT_AVIV_RESTRICTION_NUMBER INT`, `@DATE_PERMIT_START/END DATETIME`, `@NUMB_DURATION_LIMIT INT = NULL`, `@TIME_PERMIT_START/END DATETIME = NULL`, `@IDNT_DEVICE_LIST INT_TABLE`, `@TEXT_PERMIT_REASON NVARCHAR(1000)`, `@IDNT_USER_APPROVAL INT`, `@TEXT_FILE NVARCHAR(500)`, `@IDNT_USER INT`, `@REQUEST_UID UNIQUEIDENTIFIER` | 1 created ids (`IDNT_AVIV_PERMITS_FOR_RESTRICTION`) |
| `PUT UpdateTraineePhonePermit` | `SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER` | `@IDNT_PREVIOUS INT` (the previous permit row), the same fields without the trainee list and the restriction id (taken from the previous row) | 1 the new id |

Shared parameter rules: lists of ids are `dbo.INT_TABLE`; the list of phone numbers is one comma-separated `VARCHAR(500)` split with `STRING_SPLIT` (order is not a requirement, A-9); every string has an explicit size (A-10); the acting user and the request GUID come from the service (D-14, D-19).

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
| all saves | CHECK constraints: date order, duration 1–120, time pair; digits-only phone number. Raised by the database as error 547. | 400, field by constraint name |

### 5.2 Mapping in the service (`SqlErrorMapper`)

| `SqlException.Number` | Result |
|---|---|
| 50400 … 50499 | `ApiException(Number - 50000, Message)` – the message is the field name |
| 547 (constraint) | `ApiException(400, field)` where the field comes from the constraint name in the message: `CK_AVIV_RESTRICTION_NUMBER_DATES` → `dateRestrictionEnd`, `CK_AVIV_PERMITS_FOR_RESTRICTION_DATES` → `datePermitEnd`, `CK_AVIV_PERMITS_FOR_RESTRICTION_TIMES` → `timePermitEnd`, `CK_AVIV_PERMITS_FOR_RESTRICTION_DURATION` → `numbDurationLimit`, `CK_AVIV_LIST_PHONE_NUMBER_DIGITS` → `phoneNumberList` |
| 2601, 2627 (unique index) | `ApiException(409, null)` |
| anything else | rethrown → 500 |

### 5.3 The HTTP body

```json
{ "code": "VALIDATION_ERROR", "message": "datePermitStart", "fieldErrors": { "datePermitStart": "" } }
```

`code` is `VALIDATION_ERROR` (400), `CONFLICT` (409) or `SERVER_ERROR` (500); `fieldErrors` carries the field name with an empty text (the client keeps its own Hebrew messages, C-4).

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
| `IdntUserApproval` | > 0 |
| `TextFile` | not blank, ≤ 500 characters |

---

## 7. Data shapes

### 7.1 Requests (`Models/PhoneExceptions/Requests`)

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

`TextFileName` is kept for display only (the orchestrator falls back to the last path segment); the procedures take `@TEXT_FILE` alone until `AVIV_FILE` gets a name column.

### 7.2 Responses (`Models/PhoneExceptions/Responses`)

Same structure as the client's DTOs, DB-style names, strings for dates and times.

```csharp
public class TraineePhoneRecordsResponseDto { public List<TraineePhoneRecordDto> Records { get; set; } = []; }

public class TraineePhoneRecordDto                       // one class, two kinds (A-4)
{
    public string Type { get; set; } = "";               // "restriction" | "permit" – set by the assembler
    public int Id { get; set; }                          // trainee row id (restriction) or permit id (permit)
    public int IdntTrainee { get; set; }
    public int IdntAvivListPhoneNumber { get; set; }
    public string TextPhoneNumber { get; set; } = "";
    public string DateStart { get; set; } = "";          // yyyy-MM-dd
    public string DateEnd { get; set; } = "";
    public int? NumbDurationLimit { get; set; }
    public string? TimePermitStart { get; set; }         // HH:mm
    public string? TimePermitEnd { get; set; }
    public List<LookupItemDto> Devices { get; set; } = [];
    public string TextReason { get; set; } = "";         // details (D-6)
    public string Reason { get; set; } = "";             // always "" (D-7)
    public ApproverDto Approver { get; set; } = new();   // id + mock name (Q-1)
    public FileDto ApprovedFile { get; set; } = new();   // id, name from the path, path
    public bool IsActive { get; set; }
    public string TemporalStatus { get; set; } = "";     // active | scheduled | expired
    public string? SyncStatus { get; set; }              // always null (D-19)
    public string DateCreated { get; set; } = "";
    public string? DateUpdated { get; set; }
    public int IdntUserUpdate { get; set; }
    // restriction only
    public int? IdntAvivRestrictionNumber { get; set; }  // the parent row
    public int? InlinePermitId { get; set; }
    // permit only
    public SourceRestrictionSummaryDto? SourceRestriction { get; set; }
}

public class SourceRestrictionSummaryDto
{
    public int IdntAvivRestrictionNumber { get; set; }
    public int? IdntAvivTraineeRestrictionNumber { get; set; }
    public int IdntAvivListPhoneNumber { get; set; }
    public string TextPhoneNumber { get; set; } = "";
    public string Scope { get; set; } = "";              // national | institute | trainee – derived (A-5)
    public List<LookupItemDto> Institutes { get; set; } = [];
    public string DateStart { get; set; } = "";
    public string DateEnd { get; set; } = "";
    public string TextReason { get; set; } = "";
    public List<ExistingPermitDto> ExistingTraineePermits { get; set; } = [];
}

public class LookupRestrictionsForPermitResponseDto { public List<PhoneLookupResultDto> Results { get; set; } = []; }
public class PhoneLookupResultDto { public string TextPhoneNumber { get; set; } = ""; public List<SourceRestrictionSummaryDto> ActiveRestrictions { get; set; } = []; }

public class MutationResultDto { public List<int> CreatedIds { get; set; } = []; public string? RequestUid { get; set; } public string? SyncStatus { get; set; } }
public class ApiErrorDto { public string Code { get; set; } = ""; public string Message { get; set; } = ""; public Dictionary<string, string>? FieldErrors { get; set; } }
```

`Scope` derivation: parent `CODE_RESTRICTION_SCOPE = 2` → `trainee`; `= 1` with no institute rows → `national`; `= 1` with institute rows → `institute`. `TemporalStatus`: today before start → `scheduled`; after end → `expired`; otherwise `active`.

### 7.3 Rows (`Models/PhoneExceptions/Rows`)

| Class | Columns (aliases) | Produced by |
|---|---|---|
| `RestrictionRow` | `TraineeRestrictionNumberId`, `RestrictionNumberId`, `InlinePermitId?`, `TraineeId`, `PhoneNumberId`, `PhoneNumber`, `DateStart`, `DateEnd`, `NumbDurationLimit?`, `TimePermitStart?`, `TimePermitEnd?`, `TextReason`, `IdntUserApproval`, `IdntApprovedFile`, `TextFile`, `DateCreated`, `DateUpdated?`, `IdntUserUpdate` | history set 1 |
| `PermitRow` | `PermitId`, `TraineeId`, `RestrictionNumberId`, `PhoneNumberId`, `PhoneNumber`, `DateStart`, `DateEnd`, `NumbDurationLimit?`, `TimePermitStart?`, `TimePermitEnd?`, `TextReason`, `IdntUserApproval`, `IdntApprovedFile`, `TextFile`, audit columns, and the source summary: `SourceScopeCode`, `SourceDateStart`, `SourceDateEnd`, `SourceTextReason`, `SourceTraineeRestrictionNumberId?` | history set 3 |
| `SourceRestrictionRow` | `PhoneNumber`, `RestrictionNumberId`, `TraineeRestrictionNumberId?`, `PhoneNumberId`, `ScopeCode`, `DateStart`, `DateEnd`, `TextReason` | lookup set 1 |
| `InstituteRow` | `RestrictionNumberId`, `InstituteId`, `InstituteName` | history set 5, lookup set 2 |
| `ExistingPermitRow` | `PermitId`, `RestrictionNumberId`, `DateStart`, `DateEnd`, `NumbDurationLimit?`, `TimePermitStart?`, `TimePermitEnd?` | lookup set 3 |
| `DeviceRow` | `PermitId`, `DeviceId`, `DeviceName` | history sets 2 and 4, lookup set 4 |
| `CreatedIdRow` | `CreatedId` | every save |

`InstituteName` and `DeviceName` need joins to the institutes and devices tables (Q-9, Q-10); until the tables and columns are confirmed the procedures return the ids with empty names, like the approver (Q-1).

---

## 8. Composing the history and the lookup (`PhoneRecordsAssembler`)

1. Read the five history sets with `QueryMultiple` into `RestrictionRow`, `DeviceRow`, `PermitRow`, `DeviceRow`, `InstituteRow` lists.
2. Build dictionaries: devices by `PermitId` (for restrictions the key is the `InlinePermitId`), institutes by `RestrictionNumberId`.
3. Each `RestrictionRow` → `TraineePhoneRecordDto` with `Type = "restriction"`, devices from the inline permit id, strings for dates and times.
4. Each `PermitRow` → `TraineePhoneRecordDto` with `Type = "permit"`, its devices, and a `SourceRestrictionSummaryDto` built from the `Source*` columns plus the institutes of its `RestrictionNumberId` (existing permits are not filled in the history – the client does not use them there).
5. Return both kinds in one list; sorting is the client's (B-5).

The lookup follows the same pattern: `SourceRestrictionRow` + institutes + existing permits (with their devices) → `SourceRestrictionSummaryDto` per phone number, grouped into `PhoneLookupResultDto` in the order of the request's numbers.

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

- **Restriction**: normalize and de-duplicate the numbers; for each number get-or-create the `AVIV_LIST_PHONE_NUMBER` row (the unique index protects concurrent inserts; insert with `WHERE NOT EXISTS`, then re-select); insert the file row once; for every trainee × number insert the parent (scope 2), the trainee row, the inline conditions row and its devices when conditions exist; return all created trainee row ids (P-12, one transaction, all or nothing).
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
| C-8 | `approver.fullName` / `roleTitle`, institute names and device names may arrive empty until the reference tables are joined (Q-1, Q-9, Q-10); the client falls back to its own caches or shows the id. |

---

## 12. Phase 3 – implementation plan

Runs in a **new session**, from this document, `decisions.md`, the DDL script and `reference/`, after the owner's go-ahead.

1. Apply the DDL script with the DBA (`stored-procedures/schema/01-proposed-schema-changes.sql`): `CODE_RESTRICTION_SCOPE`, `LOGI_RESTRICTION_INLINE_PERMIT`, `TEXT_PERMIT_REASON`, the CHECK constraints, the three indexes, the two `DECODE` sets.
2. Read procedures: `SP_AVIV_GET_TRAINEE_PHONE_RECORDS`, `SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT`, with a test-data script for SSMS (one trainee, one general restriction narrowed to the trainee's institute, one trainee restriction with conditions, one permit).
3. Save procedures: create and update of the restriction, create and update of the permit; SSMS tests for each 400 and 409 path and for the re-pointing.
4. C#: `Rows` → `PhoneExceptionsRepository` → `PhoneExceptionsRequestValidator`, `PhoneRecordsAssembler`, `SqlErrorMapper` → `PhoneExceptionsOrchestrator` → `PhoneExceptionsController`; `StoredProcedures` constants.
5. Manual end-to-end check by the owner against the client, with a checklist delivered with the code.

Verification of this phase: every action maps to a procedure with parameters and result sets (section 3); every field in the client's response knows its set and column (sections 7–8); the C-list is complete (section 11).
