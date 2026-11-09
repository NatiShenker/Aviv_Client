# Trainee restrictions – server side, phase 3: manual test checklist

Status: phase 3 of feature 03, written 2026-11-09 together with the code. Everything in `service-layer/` and `stored-procedures/` is carried by hand to the real .NET 8 service and to SSMS; nothing in this repository runs it. This checklist is the order in which to carry it, what to look at after each step, and which open items the run settles. Decisions referenced here are in [decisions.md](decisions.md) (T-n, TQ-n, TC-n) and in [../number-restrictions/decisions.md](../number-restrictions/decisions.md) (D-n, A-n, I-n, Q-n, C-n); the design is in [02-architecture.md](02-architecture.md).

How to use: features 03 and 04 are deployed together, so section 0 gives the combined order and says which checklist to open at each step. Sections A–D are SSMS only and belong to 03. Section F covers the C# of **both** features (it supersedes §F.1 / §F.2 of the 04 checklist, which were written before the shared code existed). Section G needs the client with the combined C-list applied.

---

## 0. Combined run order with 04

| Step | What | Checklist |
|---|---|---|
| 1 | Environment checks, read-only | [04 §A](../number-restrictions/03-manual-test-checklist.md) (A.1–A.9), then 03 §A below |
| 2 | DDL: `stored-procedures/schema/01-proposed-schema-changes.sql`, then `02-proposed-schema-changes-trainee-restrictions.sql` | 04 §B, then 03 §B |
| 3 | Procedures: the six of `stored-procedures/number-restrictions/`, then the three of `stored-procedures/trainee-restrictions/` | 04 §C, then 03 §C |
| 4 | Test data: `number-restrictions/00-test-data.sql`, then `trainee-restrictions/00-test-data.sql` (independent id series, T-15; any order works) | 04 §D–§E, then 03 §D |
| 5 | C# of both features in one build: shared files, the 04 files in their new places, the 03 files | **03 §F only** |
| 6 | Smoke tests of both features | 04 §F.4, then 03 §F.4 |
| 7 | Client with the combined C-list | 03 §G (uses the combined summary in [decisions.md section C](decisions.md)) |
| 8 | Record what the run settled | 04 §H, 03 §H |

---

## A. Environment checks (SSMS, read-only, once)

Run on `ZeroThree03`, after 04 §A. Each item names the decision it settles.

- [ ] **A.1 The real column list of `AVIV_TRAINEE_RESTRICTION` (TQ-2).** The DBA export of 2026-10-29 predates `TEXT_RESTRICTION_REASON`, so the whole list is re-read. Expected, beside the seven generic columns: `IDNT_AVIV_TRAINEE_RESTRICTION`, `IDNT_AVIV_TRAINEE_DATA` (becomes `IDNT_TRAINEE` in §B), `RESTRICTION_UID`, `CODE_RESTRICTION`, `DATE_RESTRICTION_START`, `DATE_RESTRICTION_END`, `NUMB_DURATION_LIMIT`, `TEXT_RESTRICTION_REASON`, `IDNT_APPROVED_FILE`, `IDNT_USER_APPROVAL`. Write down any column that is missing or extra.

```sql
SELECT COLUMNS.column_id, COLUMNS.name, TYPES.name AS type_name, COLUMNS.max_length, COLUMNS.is_nullable, COLUMNS.is_identity, COLUMNS.collation_name
FROM   sys.columns AS COLUMNS
JOIN   sys.types   AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
WHERE  COLUMNS.object_id = OBJECT_ID('dbo.AVIV_TRAINEE_RESTRICTION')
ORDER BY COLUMNS.column_id;
```

- [ ] **A.2 `RESTRICTION_UID` is nullable (TQ-1).** In the grid of A.1, `is_nullable` = 1 on `RESTRICTION_UID`. If it is 0 and there is no default, every insert of the two save procedures fails: stop and decide (a default from the DBA, or the "ours" variant of T-1).
- [ ] **A.3 `CODE_RESTRICTION` is `int` nullable (T-5).** `is_nullable` = 1. The procedures never write it.
- [ ] **A.4 `TEXT_RESTRICTION_REASON`: type, length, collation (I-14, Q-2, P-9).** The code assumes 1000 characters. If `max_length` is smaller, change `@TEXT_RESTRICTION_REASON VARCHAR(1000)` in the two save procedures and `TraineeRestrictionsLimits.DetailsMaxLength`. A non-Hebrew collation on this `varchar` column stores Hebrew as `?` (accepted by P-9; record it).
- [ ] **A.5 `IDNT_AVIV_TRAINEE_RESTRICTION` is IDENTITY (I-11).** `is_identity` = 1. The save procedures use `OUTPUT INSERTED` and `SCOPE_IDENTITY()`, and the test script inserts without keys.
- [ ] **A.6 Nullability of the audit and approval columns (I-18).** `TraineeRestrictionRow` declares `DateCreated`, `DateUpdated`, `IdntUserUpdate`, `TextReason`, `IdntUserApproval`, `IdntApprovedFile` nullable. If all are `NOT NULL`, the properties can be tightened; if any is nullable, leave them. The DTO is unaffected.
- [ ] **A.7 Device names (I-15, Q-9).** Same as 04 §A.7: `SELECT TOP (1) IDNT_DEVICE, TEXT_DEVICE_NAME FROM dbo.AVIV_DEVICE_DATA;` must return a row. 03 does not join institutes. **Approver name (I-22, added 2026-11-09):** settled by 04 §A.7b (`ODSINTERNALDATA..A_WORKERS`: `IDNT_WORKER`, `TEXT_FIRST_NAME`, `TEXT_LAST_NAME`); a corrected column name is applied to `SP_AVIV_GET_TRAINEE_RESTRICTIONS` set 1 as well.
- [ ] **A.8 Compatibility level and server clock.** Settled by 04 §A.1 and §A.3; nothing to repeat.

---

## B. Apply the 03 schema script (`stored-procedures/schema/02-proposed-schema-changes-trainee-restrictions.sql`)

- [ ] **B.1 Run the script** on `ZeroThree03`, after the 04 script. It is re-runnable: the rename runs only while `IDNT_AVIV_TRAINEE_DATA` exists. Expected: no errors.
- [ ] **B.2 Verify the rename (D-12, T-8).** Expected: one row, `IDNT_TRAINEE`.

```sql
SELECT name FROM sys.columns
WHERE  object_id = OBJECT_ID('dbo.AVIV_TRAINEE_RESTRICTION') AND name IN ('IDNT_TRAINEE', 'IDNT_AVIV_TRAINEE_DATA');
```

- [ ] **B.3 Existing rows (TQ-4).** If `AVIV_TRAINEE_RESTRICTION` already holds rows, confirm with their owner that they follow the 03 reading: the duration on the restriction row, hours and devices on an inline row with `LOGI_RESTRICTION_INLINE_PERMIT = 1`. The 04 DDL gave every pre-existing `AVIV_PERMITS_FOR_RESTRICTION` row the flag 0, so pre-existing hours rows of type 1 would be invisible to the 03 history until their flag is set to 1. The query below counts them; 0 means nothing to decide.

```sql
SELECT (SELECT COUNT(*) FROM dbo.AVIV_TRAINEE_RESTRICTION) AS trainee_restriction_rows,
       (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_FOR_RESTRICTION WHERE CODE_RESTRICTION_TYPE = 1 AND LOGI_RESTRICTION_INLINE_PERMIT = 0) AS type1_rows_with_flag_0;
```

---

## C. Create the three procedures (`stored-procedures/trainee-restrictions/`)

Each file starts with `USE [ZeroThree03]` and uses `CREATE OR ALTER`, so the order does not matter and re-running is safe. They need §B done (the column `IDNT_TRAINEE`) and the 04 DDL (the flag column).

- [ ] **C.1** `SP_AVIV_GET_TRAINEE_RESTRICTIONS.sql`
- [ ] **C.2** `SP_AVIV_CREATE_TRAINEE_RESTRICTION.sql`
- [ ] **C.3** `SP_AVIV_UPDATE_TRAINEE_RESTRICTION.sql`
- [ ] **C.4 Verify.** Expected: three rows (nine together with 04).

```sql
SELECT name, modify_date FROM sys.procedures WHERE name LIKE 'SP_AVIV_%TRAINEE_RESTRICTION%' ORDER BY name;
```

A failure at this step is almost always a column name (A.1) or a missing DDL column (04 §B.2, 03 §B.2).

---

## D. Run the test script (`stored-procedures/trainee-restrictions/00-test-data.sql`)

Run the whole file (F5) and read the grids top to bottom. The script is re-runnable: it removes everything of trainees `998001` and `998002` first, including the rows the save examples created. Devices `999001` / `999002`, approver `999001` and user `999999` are sentinels that exist nowhere else, so `DeviceName` comes back empty on purpose (I-15, C-8). Dates are relative to today.

### D.1 Scenario ids

- [ ] One grid, 8 rows, every `Id` filled: `TestTrainee`, `SecondTrainee`, R1 restriction, R2 restriction, R2 inline conditions, R3 restriction, R4 restriction, R4 inline conditions.

### D.2 Read 1 – history of trainee 998001 (two grids)

- [ ] **Set 1 – restrictions:** 4 rows.
  - R1: `IsEnded` 0, `ConditionsRowId` NULL, `NumbDurationLimit` 10, times NULL.
  - R2: `IsEnded` 0, `ConditionsRowId` = R2 inline conditions, `NumbDurationLimit` NULL, `TimePermitStart` 16:00, `TimePermitEnd` 18:00.
  - R3: `IsEnded` 1, `ConditionsRowId` NULL.
  - R4: `IsEnded` 0 (future is not ended, C-11), `ConditionsRowId` = R4 inline conditions, 08:00–12:00.
  - Every row: `TextReason` filled, `TextFile` = the test path, `IdntUserApproval` 999001, `DateCreated` filled.
- [ ] **Set 2 – devices:** 2 rows keyed by R2's `ConditionsRowId`: 999001 and 999002, `DeviceName` empty.

### D.3 Read 2 – trainee 998002

- [ ] Two empty grids, no error.

### D.4 Read 3 – both trainees

- [ ] Same as D.2 (998002 adds nothing).

### D.5 Saves 1–4 (one grid each)

- [ ] **Save 1 – create for two trainees, duplicate device:** 2 rows, one per trainee; each with `InlineConditionsId` set (devices exist, T-2), `NumbDurationLimit` NULL, times NULL, `DeviceRows` 1 (the duplicate removed, A-1).
- [ ] **Save 2 – create duration only:** 1 row, `NumbDurationLimit` 20, `InlineConditionsId` NULL (no inline row, T-2).
- [ ] **Save 3 – update R2, hours and devices removed:** `Result` OK, `OldRowActive` 0, `OldInlineActive` 0, `OldInlineActiveDevices` 0, `NewInlineRows` 0, `NewTraineeId` 998001 (taken from the previous row, T-9), `NewDuration` NULL. One active row for the restriction across all tables (T-7).
- [ ] **Save 4 – update R1, hours added:** `NewDuration` 10 (on the restriction row, T-2), `NewInlineConditionsId` set, 17:00–19:00, `InlineDuration` NULL, `NewInlineDevices` 0, `OldRowActive` 0.

### D.6 Errors 1–4 (one grid each)

Every grid must show `ErrorNumber` and `ErrorMessage` equal to its `Expected` column. A grid with `FAIL: no error raised` is a defect.

| # | Call | Expected |
|---|---|---|
| 1 | update R3 (ended) | 50409 `idntPrevious` |
| 2 | update the old R2 row (replaced in Save 3) | 50409 `idntPrevious` |
| 3 | update an unknown id | 50409 `idntPrevious` |
| 4 | create with an empty trainee list | 50400 `idntTraineeList` |

- [ ] All four match.

### D.7 Read 4 – history of both trainees after the saves (two grids)

- [ ] **Set 1:** 7 rows. Trainee 998001: R1's new version (10 min, `ConditionsRowId` set, 17:00–19:00), R2's new version (NULL duration, `ConditionsRowId` NULL), R3 (`IsEnded` 1), R4, the Save 1 row (`ConditionsRowId` set, times NULL), the Save 2 row (20 min, `ConditionsRowId` NULL). Trainee 998002: the Save 1 row. Not returned: the replaced versions of R1 and R2.
- [ ] **Set 2:** 2 rows, device 999002, one for each Save 1 conditions row. Not returned: R2's old devices (inactive); R1-new and R4 have hours only.

### D.8 Audit stamps (D-14, D-19)

- [ ] One grid with every `AVIV_TRAINEE_RESTRICTION` row of the two trainees, active and replaced: the rows of one save share `LAST_REQUEST_UID`; `IDNT_USER_UPDATE` is 999999 everywhere; replaced rows have `LOGI_ACTIVE` 0 and a `DATE_UPDATED` later than `DATE_CREATED`.

### D.9 After the run

- [ ] **Messages tab:** no red error text outside the four CATCH grids.
- [ ] **Hebrew in `varchar` (Q-2):** `SELECT TEXT_RESTRICTION_REASON FROM dbo.AVIV_TRAINEE_RESTRICTION WHERE IDNT_TRAINEE IN (998001, 998002);` – readable Hebrew or `????` (accepted by P-9; record it).
- [ ] **Run the script a second time:** same grids, no leftovers from the first run.

There is no section E: 03 has no dictionary table and no application lock (I-13 does not apply).

---

## F. Wire the C# into the real service (`service-layer/`) – both features

This section replaces §F.1 and §F.2 of the 04 checklist, which predate the shared code (T-12) and the folder layout (T-13). If the 04 files were already copied into the service from the earlier delivery, delete the six old paths first: `Models/PhoneExceptionsRequests.cs`, `Models/PhoneExceptionsResponses.cs`, `Models/PhoneExceptionsRows.cs`, `Services/PhoneExceptionsOrchestrator.cs`, `Services/PhoneExceptionsRequestValidator.cs`, `Services/PhoneRecordsAssembler.cs`.

### F.1 Copy the files into the existing folders (37 files)

All files are UTF-8 with BOM; the comments are Hebrew. `Infrastructure/` is a new folder (namespace `Aviv_Service.Infrastructure`). `Models/PhoneExceptions/`, `Models/TraineeRestrictions/`, `Services/PhoneExceptions/`, `Services/TraineeRestrictions/` are new sub-folders whose namespace follows the folder (T-13).

| Group | Files |
|---|---|
| Shared (12) | `Infrastructure/ApiException.cs` · `Infrastructure/ApiErrors.cs` · `Infrastructure/ApiActionRunner.cs` · `Infrastructure/ActingUserId.cs` · `Models/RecordDtos.cs` · `Models/RecordRows.cs` · `Services/RequestRules.cs` · `Services/RecordPartsAssembler.cs` · `Repository/ProcedureParameters.cs` · `Repository/CreatedIds.cs` · `Utils/DateTimeStrings.cs` · `Utils/FilePaths.cs` |
| Feature 04 (14) | `Controllers/PhoneExceptionsController.cs` · `Interfaces/IPhoneExceptionsOrchestrator.cs` · `Interfaces/IPhoneExceptionsRepository.cs` · `Models/PhoneExceptions/PhoneExceptionsRequests.cs` · `Models/PhoneExceptions/PhoneExceptionsResponses.cs` · `Models/PhoneExceptions/PhoneExceptionsRows.cs` · `Repository/PhoneExceptionsRepository.cs` · `Services/PhoneExceptions/PhoneExceptionsOrchestrator.cs` · `Services/PhoneExceptions/PhoneExceptionsRequestValidator.cs` · `Services/PhoneExceptions/PhoneRecordsAssembler.cs` · `Utils/PhoneExceptionsConstants.cs` · `Utils/PhoneNumbers.cs` · `Utils/StoredProcedures.PhoneExceptions.cs` |
| Feature 03 (12) | `Controllers/TraineeRestrictionsController.cs` · `Interfaces/ITraineeRestrictionsOrchestrator.cs` · `Interfaces/ITraineeRestrictionsRepository.cs` · `Models/TraineeRestrictions/TraineeRestrictionsRequests.cs` · `Models/TraineeRestrictions/TraineeRestrictionsResponses.cs` · `Models/TraineeRestrictions/TraineeRestrictionsRows.cs` · `Repository/TraineeRestrictionsRepository.cs` · `Services/TraineeRestrictions/TraineeRestrictionsOrchestrator.cs` · `Services/TraineeRestrictions/TraineeRestrictionsRequestValidator.cs` · `Services/TraineeRestrictions/TraineeRestrictionsAssembler.cs` · `Utils/TraineeRestrictionsConstants.cs` · `Utils/StoredProcedures.TraineeRestrictions.cs` |

### F.2 Adaptation points (the only places that may need a hand edit)

| # | Where | What to check | Decision |
|---|---|---|---|
| 1 | `Infrastructure/ActingUserId.cs` | The member of `ICurrentUserService` that holds the user id. The code reads `currentUserService.UserId` as a string and parses it to `int`; change the member name, or drop the parse if it is already an `int`. Also the `using Aviv_Service.Interfaces;` – change it to the namespace where `ICurrentUserService` really lives. One place for both features. | I-7, T-12 |
| 2 | `Infrastructure/ApiActionRunner.cs`, `Infrastructure/ApiErrors.cs` | `using Microsoft.Data.SqlClient;` – if the service uses `System.Data.SqlClient`, change the `using` in both files. | I-6 |
| 3 | `Utils/StoredProcedures.PhoneExceptions.cs`, `Utils/StoredProcedures.TraineeRestrictions.cs` | The existing `StoredProcedures` class (the one with `GET_LOCATIONS`) must be `partial`, or copy the nine constants into it and delete the two files. | A-15 |
| 4 | `Repository/ProcedureParameters.cs` | `ToDataTable()` on `List<int>` – add the `using` of the namespace where the reference's extension lives (the file has `using Iwaf.Data;` as a guess). `ConnectionStrings.ZeroThree03` in the two repositories is the same constant `LocationsRepository` uses. | A-16 |
| 5 | `Repository/PhoneExceptionsRepository.cs`, `Repository/TraineeRestrictionsRepository.cs` | `IDataAccess.QueryMultiple(parameters, spName, dbName, reader => { ... })` – written against the reference's call shape (an `Action` over Dapper's `GridReader`). If the real signature takes a `Func` or returns a value, adjust the nine lambdas; nothing else changes. | A-16 |
| 6 | project file | Implicit usings (`StatusCodes`, `ILogger`, `IActionResult`, LINQ) and C# 12 (primary constructors, collection expressions `[]`, `with` on records). The reference already uses primary constructors, so .NET 8 defaults are expected. | I-16 |
| 7 | `Program.cs` (or wherever `ILocationsOrchestrator` is registered) | Add, with the new namespaces: `using Aviv_Service.Services.PhoneExceptions;` / `using Aviv_Service.Services.TraineeRestrictions;` and `builder.Services.AddScoped<IPhoneExceptionsOrchestrator, PhoneExceptionsOrchestrator>(); builder.Services.AddScoped<IPhoneExceptionsRepository, PhoneExceptionsRepository>(); builder.Services.AddScoped<ITraineeRestrictionsOrchestrator, TraineeRestrictionsOrchestrator>(); builder.Services.AddScoped<ITraineeRestrictionsRepository, TraineeRestrictionsRepository>();` | A-11, T-13 |
| 8 | project / `.editorconfig` | If the project enforces "namespace must match folder" (IDE0130) as an error, the sub-folder files already comply; if it enforces a *flat* namespace convention, the four sub-folder namespaces are the only thing to adjust. | TQ-6 |

- [ ] **F.3 Build.** Expected: zero errors. Nullable-reference warnings are acceptable. Any error must be one of the eight rows above; anything else is a defect to report back.

### F.4 Smoke tests against the API (Swagger or Postman, with the service's authentication)

Run after section D, so that the test scenario is in the database, and after 04 §F.4. Bodies are camelCase JSON; property names match the C# records (`System.Text.Json` default binding).

- [ ] **F.4.1 History.** `POST api/TraineeRestrictions/GetTraineeRestrictions` with `{ "idntTraineeList": [998001, 998002] }`. Expected 200 with `records` (7 after the saves of §D, 4 for 998001 alone before them). Spot-check one row with conditions and one without: `isEnded`, `dateStart` as `yyyy-MM-dd`, `numbDurationLimit` (10 on R1-new, null on R2-new), `timePermitStart` as `HH:mm` or null, `devices[]` with `id` / `name` (name empty), `textReason`, `approver.id` 999001 with empty `fullName` (the sentinel has no `A_WORKERS` row; a record saved with a real worker id shows the name – I-22), `approvedFile.fileName` = `trainee-restriction.pdf` derived from the path (D-13), `dateCreated` as `yyyy-MM-ddTHH:mm:ss`. No `restrictionUid`, `restrictionCode`, `isPermit`, `sourceRestriction` (TC-1, TC-2).
- [ ] **F.4.2 Empty body.** `POST` with no body. Expected 400 from `[ApiController]` – ASP.NET's `ProblemDetails` body, **not** `ApiErrorDto` (same as 04 §F.4.2).
- [ ] **F.4.3 Validator 400.** `{ "idntTraineeList": [] }` → 400 `{ "code": "VALIDATION_ERROR", "message": "idntTraineeList", "fieldErrors": { "idntTraineeList": "" } }`.
- [ ] **F.4.4 Create 200.** `POST CreateTraineeRestriction` with `idntTraineeList` [998001], `dateRestrictionStart` today, `dateRestrictionEnd` +30 days, `numbDurationLimit` 15, `timePermitStart` "16:00", `timePermitEnd` "18:00", `idntDeviceList` [999001], `textRestrictionReason` a text, `codeRestrictionReason` 1 (I-23), `idntUserApproval` 999001, `textFile` a path. Expected 200 `{ "createdIds": [a] }`; the history then shows it with `isEnded` false, `numbDurationLimit` 15, the hours and one device; in SSMS the restriction row carries `IDNT_USER_UPDATE` = the logged-in user's id (not 999999) and the inline row carries `NUMB_DURATION_LIMIT` NULL (T-2). No column holds the reason code yet.
- [ ] **F.4.5 Create 200 without conditions.** Same call with `numbDurationLimit` null, no times, `idntDeviceList` []. Expected 200; in SSMS one `AVIV_TRAINEE_RESTRICTION` row and **no** `AVIV_PERMITS_FOR_RESTRICTION` row for it.
- [ ] **F.4.6 Create 400s**, one field at a time; expected `message` = the field: end before start → `dateRestrictionEnd`; a date not in `yyyy-MM-dd` → `dateRestrictionStart`; `timePermitStart` without `timePermitEnd` → `timePermitEnd`; end time before start → `timePermitEnd`; `numbDurationLimit` 0 or 121 → `numbDurationLimit`; empty or blank `textRestrictionReason` → `textRestrictionReason`; `codeRestrictionReason` 0 or missing → `codeRestrictionReason` (I-23); `idntUserApproval` 0 → `idntUserApproval`; empty `textFile` → `textFile`; `idntDeviceList` [0] → `idntDeviceList`; `idntTraineeList` [0] → `idntTraineeList`.
- [ ] **F.4.7 Update 409.** `PUT UpdateTraineeRestriction` with `idntPrevious` of a row the test script already replaced (the old R2 row from D.1). Expected 409 `{ "code": "CONFLICT", "message": "idntPrevious", "fieldErrors": { "idntPrevious": "" } }` (thrown by the procedure, translated by `SqlErrorMapper` inside `ApiActionRunner`). The same with the ended R3 row.
- [ ] **F.4.8 Update 200.** `PUT UpdateTraineeRestriction` with `idntPrevious` = the id from F.4.4, the same body without hours and devices. Expected 200 a new id; the history shows the new row only, with `devices` empty and times null; in SSMS the old row, its inline row and its device are `LOGI_ACTIVE` 0.
- [ ] **F.4.9 Update 400.** `idntPrevious` 0 → 400 `idntPrevious` (validator, before any database call).
- [ ] **F.4.10 500 path.** Covered by 04 §F.4.11 (the shared `ApiActionRunner` logs and returns `SERVER_ERROR`); 03 has no lock to hold. Optional: stop the SQL Server service and call the history → 500 with one log line `Error at GetTraineeRestrictions`.

---

## G. End-to-end with the client

### G.1 Prerequisite: the C-list applied in the client

**Done on 2026-11-09** (client-alignment session): the client follows the combined C-list, with I-22 / I-23. What remains for section G is pointing `src/config/serviceEndpoints.ts` at the real service. For the record, the list was: apply the deferred changes of **both** features from the combined summary in [decisions.md section C](decisions.md): the shared items (C-1, C-2, C-4, C-7, C-8, C-11, C-12 for 03 and 04; C-3, C-5, C-6, C-9, C-10 for 04 only) and the 03-only items TC-1 (`restrictionCode`), TC-2 (`restrictionUid`), TC-3 (`traineeId` in the update request). The "where to start" column of the 03 table and the 04 checklist §G.1 point at the client files. Also point `src/config/serviceEndpoints.ts` at the real service; the three 03 paths already match the controller.

Note: the trainees list ("מוגבל עד", the restriction flags and filter) still comes from the client's mock until the trainees query exists (Q-8, deferred); only the history and the form of 03 go through the service here.

### G.2 Flows (mobile in Chrome device mode, and the desktop drawer)

- [ ] **History list** for trainee 998001 (or a real trainee after real saves): the records appear with the type label ("הגבלה מלאה" / "הגבלת משך שיחה - עד 10 דק׳" from `numbDurationLimit`), "פעילה" / "הסתיימה" from `isEnded` (R4, the future one, shows "פעילה" – OQ-01), hours and devices per spec 03 §3.2 ("כל היום" / "כל המכשירים" / "לא הוגדרו"), "סיבה" as "לא צוין" (C-2), details, approver shown by id or the client's fallback (C-8), the file name from the path.
- [ ] **Empty state**: trainee 998002 before the saves → "לא נמצאו הגבלות".
- [ ] **Error state**: service stopped → "לא ניתן לטעון את ההגבלות" + "טעינה מחדש", not a blank screen.
- [ ] **Create**: full restriction with nothing; duration-limited; with hours; with devices; with everything. Each validator 400 lands on its slot per spec 03 form §6.3 with the server names (C-4); a 400 for a hidden field (`idntTraineeList`) shows as a general error.
- [ ] **Edit (new version)**: edit an active record → the history shows the new row only; edit a future record → allowed; the card of an ended record offers "יצירת הגבלה דומה" instead of "עריכה". Two tabs editing the same record: the second save gets 409 and the client shows its conflict message.
- [ ] **Create based on** an ended record: the form opens prefilled (type, minutes, hours, devices, details), dates today / tomorrow, approver and file empty; save creates a new record and the ended one is unchanged.
- [ ] **Approval file**: `textFile` round-trips; the card shows the file name derived from the path (D-13).
- [ ] **Desktop drawer**: the same flows in the history layer and the form layer.

---

## H. What the run settles – record the outcome in decisions.md

| Item | Settled by | Record as |
|---|---|---|
| TQ-1 nullability of `RESTRICTION_UID` | A.2 | nullable yes / no, and the chosen variant of T-1 if not |
| TQ-2 real column list, length and collation of `TEXT_RESTRICTION_REASON` | A.1, A.4, D.9 | the differences from the assumed list; the real `max_length`; Hebrew survives yes / no |
| T-5 `CODE_RESTRICTION` nullable | A.3 | confirmed |
| I-11 IDENTITY key | A.5 | confirmed |
| I-18 nullability of the audit columns | A.6 | tightened the `Rows` or left nullable |
| TQ-4 pre-existing rows and type-1 rows with flag 0 | B.3 | counts, and what their owner decided |
| TQ-6 project settings for the moved files | F.2 row 8, F.3 | nothing to change / what was changed |
| I-7 `ICurrentUserService` member (shared) | F.2 row 1 | the member name and the namespace |
| I-6 SqlClient namespace (shared) | F.2 row 2 | which one |
| T-11 set-based create | D.5 Save 1 | two rows from one call, mapping correct |
| T-2 hybrid | D.5 Saves 2 and 4, F.4.4 | duration on the restriction row, NULL on the inline row |
| I-22 `A_WORKERS` columns (approver name) | A.7, F.4.1 | confirmed / corrected names (shared with 04 §H) |
| I-23 reason code accepted, not stored | F.4.4, F.4.6 | 400 on 0; saves succeed; no column written |

Anything that did not match an expectation above is a defect in the procedures or the service: report it with the grid or the response body, and the fix lands in a batch 5 together with the 04 fixes.
