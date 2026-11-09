# Number restrictions and permits – server side, phase 3: manual test checklist

Status: batch 4 of phase 3, written 2026-11-09. Everything in `service-layer/` and `stored-procedures/` is carried by hand to the real .NET 8 service and to SSMS; nothing in this repository runs it. This checklist is the order in which to carry it, what to look at after each step, and which open items the run settles. Decisions referenced here (D-n, A-n, P-n, I-n, Q-n, C-n) are in [decisions.md](decisions.md); the design is in [02-architecture.md](02-architecture.md).

How to use: work top to bottom, tick each box, and write what you saw next to any box that did not match. Sections A–E are SSMS only. Section F needs the service solution. Section G needs the client with the C-list applied (section G.1).

---

## A. Environment checks (SSMS, read-only, once)

Run on `ZeroThree03`. Each item names the decision it settles.

- [ ] **A.1 Compatibility level ≥ 130.** `STRING_SPLIT` (A-9) and `DROP TABLE IF EXISTS` need it.

```sql
SELECT name, compatibility_level FROM sys.databases WHERE name = DB_NAME();
```

- [ ] **A.2 Collation of the database vs. tempdb (Q-13).** The two save-side temp tables `#Numbers` are `VARCHAR(15)` without `COLLATE`, so they take tempdb's collation, and the procedures compare them column-to-column with `AVIV_LIST_PHONE_NUMBER.TEXT_PHONE_NUMBER`. Same collation → fine. Different → error 468 ("Cannot resolve the collation conflict") on every create and every lookup, regardless of the data. In that case add `COLLATE DATABASE_DEFAULT` to `PhoneNumber` in `SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER` (line 57) and `SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT` (line 43) before section C.

```sql
SELECT name, collation_name, is_read_committed_snapshot_on
FROM   sys.databases
WHERE  name IN (DB_NAME(), 'tempdb');
```

- [ ] **A.3 Server clock (Q-3).** `IsEnded` in the history and "not ended" in the lookup use `CAST(GETDATE() AS DATE)` (I-19, P-10). The server must be on Israel time, or a record ends a day early or late.

```sql
SELECT GETDATE() AS server_now, SYSDATETIMEOFFSET() AS server_now_with_offset;
```

- [ ] **A.4 Primary keys are IDENTITY (I-11).** The save procedures use `SCOPE_IDENTITY()`, and the test script inserts without keys. Expected: one row per table, seven rows.

```sql
SELECT OBJECT_NAME(object_id) AS table_name, name AS identity_column
FROM   sys.identity_columns
WHERE  object_id IN (OBJECT_ID('dbo.AVIV_LIST_PHONE_NUMBER'), OBJECT_ID('dbo.AVIV_RESTRICTION_NUMBER'),
                     OBJECT_ID('dbo.AVIV_TRAINEE_RESTRICTION_NUMBER'), OBJECT_ID('dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER'),
                     OBJECT_ID('dbo.AVIV_PERMITS_FOR_RESTRICTION'), OBJECT_ID('dbo.AVIV_PERMITS_DEVICE'), OBJECT_ID('dbo.AVIV_FILE'));
```

- [ ] **A.5 Details and phone columns: type, length, collation (I-14, Q-2, P-7).** `TEXT_RESTRICTION_REASON` is assumed to hold 1000 characters. If `max_length` is smaller, change the three places listed in I-14 (`@TEXT_RESTRICTION_REASON` / `@TEXT_PERMIT_REASON` in the four save procedures, `PhoneExceptionsLimits.DetailsMaxLength`). A non-Hebrew collation on a `varchar` column stores Hebrew as `?` (P-9; the owner accepted this). `TEXT_PHONE_NUMBER` is expected `varchar(15)`.

```sql
SELECT OBJECT_NAME(COLUMNS.object_id) AS table_name, COLUMNS.name, TYPES.name AS type_name, COLUMNS.max_length, COLUMNS.collation_name, COLUMNS.is_nullable
FROM   sys.columns AS COLUMNS
JOIN   sys.types   AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
WHERE  COLUMNS.object_id IN (OBJECT_ID('dbo.AVIV_RESTRICTION_NUMBER'), OBJECT_ID('dbo.AVIV_PERMITS_FOR_RESTRICTION'), OBJECT_ID('dbo.AVIV_LIST_PHONE_NUMBER'))
  AND  COLUMNS.name IN ('TEXT_RESTRICTION_REASON', 'TEXT_PERMIT_REASON', 'TEXT_PHONE_NUMBER');
```

- [ ] **A.6 Nullability of the audit and approval columns (I-18).** The `Rows` classes declare `DateCreated`, `DateUpdated`, `IdntUserUpdate`, `TextReason`, `IdntUserApproval`, `IdntApprovedFile` as nullable because the real definitions are unknown. If every one of them is `NOT NULL` in all three tables, the properties in `Models/PhoneExceptionsRows.cs` can be tightened; if any is nullable, leave them. Either way the DTOs are unaffected.

```sql
SELECT OBJECT_NAME(object_id) AS table_name, name, is_nullable
FROM   sys.columns
WHERE  object_id IN (OBJECT_ID('dbo.AVIV_RESTRICTION_NUMBER'), OBJECT_ID('dbo.AVIV_TRAINEE_RESTRICTION_NUMBER'), OBJECT_ID('dbo.AVIV_PERMITS_FOR_RESTRICTION'))
  AND  name IN ('DATE_CREATED', 'DATE_UPDATED', 'IDNT_USER_UPDATE', 'TEXT_RESTRICTION_REASON', 'TEXT_PERMIT_REASON', 'IDNT_USER_APPROVAL', 'IDNT_APPROVED_FILE')
ORDER BY table_name, name;
```

- [ ] **A.7 Lookup tables and columns (I-15).** The read procedures join names by these exact columns. The location columns are the ones `SP_AVIV_GET_LOCATIONS` uses; `TEXT_DEVICE_NAME` is an assumption. A wrong name fails at `CREATE PROCEDURE` time, not at run time, so this check is cheap. Both queries must return rows.

```sql
SELECT TOP (1) IDNT_DEVICE, TEXT_DEVICE_NAME FROM dbo.AVIV_DEVICE_DATA;
SELECT TOP (1) IDNT_LOCATION_TRAINEE, TEXT_NAME_LOCATION, CODE_SUG_LOCATION
FROM   ODSINTERNALDATA..A_LOCATION WHERE CODE_SUG_LOCATION = 3330016;   -- institute type, as in SP_AVIV_GET_LOCATIONS
```

- [ ] **A.8 `dbo.INT_TABLE` has the column `IDNT_GENERAL`** (used by the reference; all six procedures rely on it).
- [ ] **A.9 `DECODE` column names.** Section 1 of the DDL script is commented out until the real column list is known. Write the names down for B.3.

---

## B. Apply the schema changes (`stored-procedures/schema/01-proposed-schema-changes.sql`)

- [ ] **B.1 Run the script** on `ZeroThree03`. It is re-runnable; every step checks before it acts. Expected: no errors, "Commands completed successfully".
- [ ] **B.2 Verify the three columns.** Expected: three rows, `CODE_RESTRICTION_SCOPE int NOT NULL` default 1, `LOGI_RESTRICTION_INLINE_PERMIT bit NOT NULL` default 0, `TEXT_PERMIT_REASON varchar(1000) NULL`.

```sql
SELECT OBJECT_NAME(COLUMNS.object_id) AS table_name, COLUMNS.name, TYPES.name AS type_name, COLUMNS.max_length, COLUMNS.is_nullable
FROM   sys.columns AS COLUMNS
JOIN   sys.types   AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
WHERE  COLUMNS.name IN ('CODE_RESTRICTION_SCOPE', 'LOGI_RESTRICTION_INLINE_PERMIT', 'TEXT_PERMIT_REASON');
```

- [ ] **B.3 Insert the two `DECODE` sets** (`AVIV_RESTRICTION_TYPE` 1–2, `AVIV_RESTRICTION_SCOPE` 1–2) with the column names from A.9, then uncomment or adapt section 1 of the script so that it stays the single source (D-10).
- [ ] **B.4 Existing rows.** All pre-existing `AVIV_RESTRICTION_NUMBER` rows now carry `CODE_RESTRICTION_SCOPE = 1` (general) and all pre-existing `AVIV_PERMITS_FOR_RESTRICTION` rows carry the flag 0 (user permit). Confirm with the owner of those rows that this reading is right (Q-11).

---

## C. Create the six procedures (`stored-procedures/number-restrictions/`)

Each file starts with `USE [ZeroThree03]` and uses `CREATE OR ALTER`, so the order does not matter and re-running is safe. If A.2 found different collations, apply the `COLLATE DATABASE_DEFAULT` change first.

- [ ] **C.1** `SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS.sql`
- [ ] **C.2** `SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT.sql`
- [ ] **C.3** `SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER.sql`
- [ ] **C.4** `SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER.sql`
- [ ] **C.5** `SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER.sql`
- [ ] **C.6** `SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER.sql`
- [ ] **C.7 Verify.** Expected: six rows.

```sql
SELECT name, modify_date FROM sys.procedures WHERE name LIKE 'SP_AVIV_%RESTRICTION%' OR name LIKE 'SP_AVIV_%PERMIT%' ORDER BY name;
```

A failure at this step is almost always a column name (A.7) or a missing DDL column (B.2).

---

## D. Run the test script (`stored-procedures/number-restrictions/00-test-data.sql`)

Run the whole file (F5) and read the grids top to bottom. The script is re-runnable: it removes everything of the test number series `05999900xx` first, including rows that the save examples created. Reference ids (trainee 999001, institute 999001, approver 999001, user 999999, devices 999001 / 999002) exist nowhere else, so `DeviceName` and `InstituteName` come back empty on purpose (I-15, C-8).

Dates are relative to today, so the expectations hold whenever the script runs.

### D.1 Scenario ids

- [ ] One grid, 13 rows, every `Id` filled. Keep it open: the ids are used when calling the procedures by hand.

### D.2 Read 1 – history of the trainee (four grids)

- [ ] **Set 1 – restrictions:** 2 rows, `IsPermit` 0.
  - N3 (`0599990003`): `IsEnded` 0, `ConditionsRowId` set, `NumbDurationLimit` 10, `TimePermitStart` 08:00, `TimePermitEnd` 20:00, `TextReason` filled, `TextFile` = the test path.
  - N4 (`0599990004`): `IsEnded` 1, `ConditionsRowId` NULL, conditions NULL.
- [ ] **Set 2 – permits:** 3 rows, `IsPermit` 1, `ConditionsRowId` = `Id`.
  - N2 active: `IsEnded` 0, 16:00–19:00, 15 minutes, `SourceCodeRestrictionScope` 1, `SourceTraineeRestrictionNumberId` NULL.
  - N2 ended: `IsEnded` 1, `SourceCodeRestrictionScope` 1.
  - N4 permit: `IsEnded` 0 (it still runs although its restriction ended, P-11), `SourceCodeRestrictionScope` 2, `SourceTraineeRestrictionNumberId` = N4's trainee row.
- [ ] **Set 3 – devices:** 3 rows keyed by `ConditionsRowId`: N3's conditions row → 999001 and 999002; the active N2 permit → 999001. `DeviceName` empty.
- [ ] **Set 4 – institutes:** 0 rows (N2 is national, N4 is the trainee's own).

### D.3 Read 2 – lookup from the trainee's institute, four numbers (four grids)

- [ ] **Set 1 – restrictions:** 3 rows: N1 narrowed to institute 999001 (`CodeRestrictionScope` 1), N2 national (`CodeRestrictionScope` 1), N3 the trainee's own (`CodeRestrictionScope` 2, `TraineeRestrictionNumberId` set). Not returned: N1's other-institute restriction, N4 (ended). `0599990004` has no row.
- [ ] **Set 2 – institutes:** 1 row, N1 → 999001.
- [ ] **Set 3 – existing permits:** 1 row, the active N2 permit (the ended one is excluded).
- [ ] **Set 4 – permit devices:** 1 row, device 999001.

### D.4 Read 3 – the same lookup from another institute

- [ ] Set 1: N1's **other-institute** restriction, N2, N3. The trainee's own restriction does not depend on the institute.

### D.5 Read 4 – a number without restrictions (`0599990099`)

- [ ] Four empty grids, no error.

### D.6 Saves 1–6 (one grid each)

- [ ] **Save 1 – create restriction on two new numbers:** 2 rows (one trainee row per number), `NumbDurationLimit` 20, 10:00–12:00, `DeviceRows` 1 (the duplicate device was removed, A-1). `0599990005` and `0599990006` now exist in `AVIV_LIST_PHONE_NUMBER`.
- [ ] **Save 2 – create permit on the trainee restriction:** 1 row, `CreatedId` filled.
- [ ] **Save 3 – update restriction, re-pointing:** `Result` OK, `PermitPointsTo` = `NewRestrictionNumberId`, `OldTraineeRowActive` 0, `OldParentActive` 0, `OldInlineActive` 0, `OldInlineActiveDevices` 0.
- [ ] **Save 4 – create permit on the institute-narrowed restriction:** 1 row.
- [ ] **Save 5 – update permit:** `OldPermitActive` 0, `OldPermitActiveDevices` 0, `Result` OK, `NewPermitActiveDevices` 1.
- [ ] **Save 6 – create permit with `@IDNT_INSTITUTION = NULL`:** 1 row (the check is skipped, C-6; the same call with the trainee's institute is Error 6).

### D.7 Errors 1–12 (one grid each)

Every grid must show `ErrorNumber` and `ErrorMessage` equal to its `Expected` column. A grid with `FAIL: no error raised` is a defect.

| # | Call | Expected |
|---|---|---|
| 1 | update restriction – ended (N4) | 50409 `idntPrevious` |
| 2 | update restriction – already replaced (old N3 row) | 50409 `idntPrevious` |
| 3 | update restriction – unknown id | 50409 `idntPrevious` |
| 4 | create restriction – list `' , '` | 50400 `phoneNumberList` |
| 5 | create permit – restriction ended (N4) | 50409 `idntAvivRestrictionNumber` |
| 6 | create permit – another institute's restriction | 50409 `idntAvivRestrictionNumber` |
| 7 | create permit – another trainee on a trainee restriction (I-3) | 50409 `idntAvivRestrictionNumber` |
| 8 | create permit – end date beyond the restriction | 50400 `datePermitStart` |
| 9 | update permit – ended | 50409 `idntPrevious` |
| 10 | update permit – its restriction ended (B-3) | 50409 `idntAvivRestrictionNumber`, and `PermitStillActive` 1 (the claim was rolled back) |
| 11 | update permit – end date beyond the restriction | 50400 `datePermitStart` |
| 12 | update permit – already replaced (old N2 permit) | 50409 `idntPrevious` |

- [ ] All twelve match.

### D.8 Read 5 – history after the saves (four grids)

- [ ] **Set 1:** 4 rows: N3's new version (`ConditionsRowId` NULL, IsEnded 0), N4 (`IsEnded` 1), `0599990005` and `0599990006` (`ConditionsRowId` set, 20 minutes, 10:00–12:00).
- [ ] **Set 2:** 6 rows: the new N2 permit (Save 5), the ended N2 permit (`IsEnded` 1), the N4 permit, the permit on N3 now pointing to the new parent (`RestrictionNumberId` = `NewRestrictionNumberId` of Save 3), the permit on N1 (Save 4), the permit of Save 6.
- [ ] **Set 3:** 3 rows, all device 999002: one for each of the two new conditions rows, one for the new N2 permit.
- [ ] **Set 4:** 2 rows: N1's restriction → 999001, the other-institute restriction → 999002.

### D.9 After the run

- [ ] **Messages tab:** no red error text outside the twelve CATCH grids.
- [ ] **Hebrew in `varchar` (Q-2):** open the inserted details. Readable Hebrew means the collation is Hebrew; `????` means it is not (accepted by P-9, but record it).

```sql
SELECT TEXT_RESTRICTION_REASON FROM dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION
JOIN   dbo.AVIV_LIST_PHONE_NUMBER AS PHONE_NUMBER ON PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER = RESTRICTION.IDNT_AVIV_LIST_PHONE_NUMBER
WHERE  PHONE_NUMBER.TEXT_PHONE_NUMBER LIKE '05999900%';
```

- [ ] **Audit stamps (D-14, D-19):** every row written by one save carries the same `LAST_REQUEST_UID`, `IDNT_USER_UPDATE` 999999 and the same `DATE_CREATED`.
- [ ] **Run the script a second time:** same grids, no leftovers from the first run.

---

## E. Concurrency test of the phone-number get-or-create (I-13, two SSMS windows)

The exact statements are at the end of `00-test-data.sql`.

- [ ] **E.1** Window A: `BEGIN TRANSACTION` and create a restriction on `0599990077`; do not commit.
- [ ] **E.2** Window B: the same call. Expected: B **waits** (the application lock `AVIV_LIST_PHONE_NUMBER_GET_OR_CREATE` is held by A).
- [ ] **E.3** Commit A within 5 seconds. Expected: B completes right after A. `SELECT COUNT(*) ... WHERE TEXT_PHONE_NUMBER = '0599990077'` returns 1.
- [ ] **E.4** Repeat, but keep A open longer than 5 seconds. Expected: B fails with error 50500 (the service turns this into 500). After A commits, the count is still 1.
- [ ] **E.5** Clean up by running `00-test-data.sql` again (the number belongs to the test series).

---

## F. Wire the C# into the real service (`service-layer/`)

### F.1 Copy the sixteen files into the existing folders

`Controllers/PhoneExceptionsController.cs` · `Infrastructure/ApiException.cs` · `Infrastructure/ApiErrors.cs` · `Interfaces/IPhoneExceptionsOrchestrator.cs` · `Interfaces/IPhoneExceptionsRepository.cs` · `Models/PhoneExceptionsRequests.cs` · `Models/PhoneExceptionsResponses.cs` · `Models/PhoneExceptionsRows.cs` · `Repository/PhoneExceptionsRepository.cs` · `Services/PhoneExceptionsOrchestrator.cs` · `Services/PhoneExceptionsRequestValidator.cs` · `Services/PhoneRecordsAssembler.cs` · `Utils/DateTimeStrings.cs` · `Utils/PhoneExceptionsConstants.cs` · `Utils/PhoneNumbers.cs` · `Utils/StoredProcedures.PhoneExceptions.cs`

`Infrastructure/` is a new folder (namespace `Aviv_Service.Infrastructure`). All files are UTF-8 with BOM; the comments are Hebrew.

### F.2 Adaptation points (the only places that may need a hand edit)

| # | Where | What to check | Decision |
|---|---|---|---|
| 1 | `Services/PhoneExceptionsOrchestrator.cs`, `GetActingUserId()` | The member of `ICurrentUserService` that holds the user id. The code reads `currentUserService.UserId` as a string and parses it to `int`. Change the member name, or drop the parse if it is already an `int`. | I-7 |
| 2 | `Controllers/PhoneExceptionsController.cs`, `Infrastructure/ApiErrors.cs` | `using Microsoft.Data.SqlClient;` – if the service uses `System.Data.SqlClient`, change the `using` in both files. | I-6 |
| 3 | `Utils/StoredProcedures.PhoneExceptions.cs` | The existing `StoredProcedures` class (the one with `GET_LOCATIONS`) must be `partial`, or copy the six constants into it and delete this file. | A-15 |
| 4 | `Repository/PhoneExceptionsRepository.cs` | `ToDataTable()` on `List<int>` – add the `using` of the namespace where the reference's extension lives. `ConnectionStrings.ZeroThree03` is the same constant `LocationsRepository` uses. | A-16, P-13 |
| 5 | `Repository/PhoneExceptionsRepository.cs` | `IDataAccess.QueryMultiple(parameters, spName, dbName, reader => { ... })` – written against the reference's call shape (an `Action` over Dapper's `GridReader`). If the real signature takes a `Func` or returns a value, adjust the six lambdas; nothing else changes. | A-16 |
| 6 | project file | The code relies on implicit usings (`StatusCodes`, `ILogger<T>`, `IActionResult`, LINQ) and on C# 12 (primary constructors, collection expressions `[]`, `with` on records). The reference already uses primary constructors, so .NET 8 defaults are expected. | I-16 |
| 7 | `Program.cs` (or wherever `ILocationsOrchestrator` is registered) | Add: `builder.Services.AddScoped<IPhoneExceptionsOrchestrator, PhoneExceptionsOrchestrator>();` and `builder.Services.AddScoped<IPhoneExceptionsRepository, PhoneExceptionsRepository>();` | A-11 |

- [ ] **F.3 Build.** Expected: zero errors. Nullable-reference warnings are acceptable. Any error must be one of the seven rows above; anything else is a defect to report back.

### F.4 Smoke tests against the API (Swagger or Postman, with the service's authentication)

Run after section D, so that the test scenario is in the database. Bodies are camelCase JSON; property names match the C# records (`System.Text.Json` default binding).

- [ ] **F.4.1 History.** `POST api/PhoneExceptions/GetTraineePhoneRecords` with `{ "idntTraineeList": [999001] }`. Expected 200 with `records` (count = set 1 + set 2 of D.8 if the saves ran, i.e. 10). Spot-check one restriction and one permit: `isPermit`, `isEnded`, `dateStart` as `yyyy-MM-dd`, `timePermitStart` as `HH:mm`, `devices[]` with `id` / `name` (name empty), `dateCreated` as `yyyy-MM-ddTHH:mm:ss`; on a permit `sourceRestriction.codeRestrictionScope` (1 or 2) and `institutes[]`; on a restriction `sourceRestriction` null.
- [ ] **F.4.2 Empty body.** `POST` with no body. Expected 400 from `[ApiController]` – ASP.NET's `ProblemDetails` body, **not** `ApiErrorDto`. The client treats any 400 without `fieldErrors` as a generic error; note this difference (C-4).
- [ ] **F.4.3 Validator 400.** `{ "idntTraineeList": [] }`. Expected 400 `{ "code": "VALIDATION_ERROR", "message": "idntTraineeList", "fieldErrors": { "idntTraineeList": "" } }`.
- [ ] **F.4.4 Lookup.** `POST LookupPhoneRestrictionsForPermit` with `{ "idntTrainee": 999001, "idntInstitution": 999001, "phoneNumberList": ["059-9990002", "0599990001", "0599990099"] }`. Expected 200, `results` in request order with the **normalized** numbers (`0599990002` first), each with `activeRestrictions` sorted general-national → general-institute → trainee, then by `dateStart`; `0599990099` with an empty list. `existingTraineePermits` filled on N2.
- [ ] **F.4.5 Lookup 400.** `phoneNumberList: ["12345"]` → 400 `phoneNumberList`; `idntInstitution: 0` → 400 `idntInstitution`.
- [ ] **F.4.6 Create restriction 200.** `POST CreateTraineePhoneRestriction` with two numbers, `dateRestrictionStart` today, `dateRestrictionEnd` +30 days, `numbDurationLimit` 20, `timePermitStart` "10:00", `timePermitEnd` "12:00", `idntDeviceList` [999002], a reason, `idntUserApproval` 999001, `textFile` a path. Expected 200 `{ "createdIds": [a, b] }`; the history then shows both with `isEnded` false; the rows carry `IDNT_USER_UPDATE` = the logged-in user's id (not 999999).
- [ ] **F.4.7 Create restriction 400s**, one field at a time; expected `message` = the field: end before start → `dateRestrictionEnd`; `timePermitStart` without `timePermitEnd` → `timePermitEnd`; `numbDurationLimit` 0 or 121 → `numbDurationLimit`; empty `textRestrictionReason` → `textRestrictionReason`; `idntUserApproval` 0 → `idntUserApproval`; empty `textFile` → `textFile`; `idntDeviceList` [0] → `idntDeviceList`; a number with letters → `phoneNumberList`.
- [ ] **F.4.8 Update restriction 409.** `PUT UpdateTraineePhoneRestriction` with `idntPrevious` of a row the test script already replaced (the old N3 trainee row from D.1). Expected 409 `{ "code": "CONFLICT", "message": "idntPrevious", "fieldErrors": { "idntPrevious": "" } }`.
- [ ] **F.4.9 Create permit 409 / 400 from the procedure.** On N4's parent → 409 `idntAvivRestrictionNumber`; on N2's parent with `datePermitEnd` +100 days → 400 `datePermitStart` (thrown by the procedure, translated by `SqlErrorMapper`).
- [ ] **F.4.10 Create and update permit 200.** Create on N2's parent with `idntInstitution` 999001 → 200 one id; update it with `PUT UpdateTraineePhonePermit` → 200 a new id; the history shows only the new one.
- [ ] **F.4.11 500 path.** Hold window A of section E open, then `POST CreateTraineePhoneRestriction` on a new number. Expected after 5 seconds: 500 `{ "code": "SERVER_ERROR", "message": "An unexpected error occurred." }` and one log line `Error at CreateTraineePhoneRestriction` with the `SqlException` 50500. Commit A afterwards and clean up (E.5).

---

## G. End-to-end with the client

### G.1 Prerequisite: the C-list applied in the client

The client is not changed in this task. Before section G, apply the deferred changes (decisions.md section C, architecture §11). File pointers are the places found while writing the server; the client session verifies them.

| ID | Change | Where to start in the client |
|---|---|---|
| C-1 | Save requests send `textFile` (+ `textFileName`); the file-registration step goes away | `src/services/phoneExceptionsService.ts`, `src/services/approvedFilesService.ts`, the approval-file field of the form |
| C-2, C-12 | `reason` / `reasonCode`, `isActive`, `syncStatus`, `requestUid` are not returned; the mutation result holds `createdIds` only | `src/types/phone-exceptions.schema.ts`, `src/types/common.schema.ts`, card and "create similar" logic |
| C-3 | `syncStatus` / `requestUid` comments removed | `src/types/common.schema.ts` |
| C-4 | 400 carries field names only; texts stay in the client | `src/features/number-restrictions/form/numberRecordValidation.ts` (the server-field slot map must use the **server** names: `phoneNumberList`, `idntAvivRestrictionNumber`, `idntTraineeList`, `dateRestrictionStart`…) |
| C-5 | Fix the table-name comment on the permit DTO | `src/types/phone-exceptions.schema.ts` |
| C-6 | `idntInstitution` added to the create-permit request | form save logic, `phoneExceptionsService.ts` |
| C-7 | DB-style field names in requests and responses | `src/types/phone-exceptions.schema.ts`, `phoneExceptionsService.ts`, mock handlers and data |
| C-8 | Empty institute / device names and mocked approver fall back to caches or the id | card and summary components |
| C-9 | `codeRestrictionScope` + `institutes` instead of `scope` | `src/features/number-restrictions/numberRestrictionsLogic.ts` (`buildScopeLabel`), `src/mock-server/data/globalPhoneRestrictionsMockData.ts` |
| C-10 | `isPermit` instead of `type`; `inlinePermitId` gone | record union and type guards in `phone-exceptions.schema.ts` and `numberRestrictionsLogic.ts` |
| C-11 | `isEnded` instead of `temporalStatus`, in the shared `AuditMetadataDto` (histories 03, 04, 05) | `src/types/common.schema.ts`, the shared record-status helper (`isRecordActive = !isEnded`), mocks of the three histories |

Also point `src/config/serviceEndpoints.ts` at the real service; the six paths already match the controller.

### G.2 Flows (mobile in Chrome device mode, and the desktop drawer)

- [ ] **History list** for trainee 999001 (or a real trainee after real saves): restrictions and permits appear; "פעיל" / "הסתיים" from `isEnded`; a permit card shows its source label – "הגבלה ארצית" for N2, "הגבלת פנימייה – …" for N1 (name empty with the sentinel institute), "הגבלה לחניך" for N3 / N4; devices shown on N3 and on the N2 permit; conditions (minutes, hours) shown.
- [ ] **Empty state**: a trainee without records.
- [ ] **Error state**: service stopped → the list shows its error state, not a blank screen.
- [ ] **Create restriction**: one number; several numbers (one record per number appears); with duration, hours and devices; without conditions. Each validator 400 lands on its own field; a 400 for a hidden field (e.g. `idntTraineeList`) shows as a general error.
- [ ] **Create permit**: type a number → lookup → cards sorted national → institute → trainee, each with its existing permits summary → choose → save → the permit appears with the source label. A number without restrictions → the "no restrictions" message. Pick a restriction, end it in SSMS, save → 409 shown as "the restriction is no longer active".
- [ ] **Edit (new version)**: edit a restriction → the history shows the new row only (the old one is `LOGI_ACTIVE` 0 and not returned); a permit that sat on it is still listed and still opens. Edit a permit → same.
- [ ] **Create based on** an ended record: the form opens prefilled, save creates a new record.
- [ ] **Approval file**: `textFile` round-trips; the card shows the file name derived from the path (D-13).

---

## H. What the run settles – record the outcome in decisions.md

| Item | Settled by | Record as |
|---|---|---|
| Q-2 Hebrew in `varchar` | A.5, D.9 | collation name and whether Hebrew survives |
| Q-3 server clock | A.3 | Israel time yes / no |
| Q-13 temp-table collation | A.2 | same / different; whether `COLLATE DATABASE_DEFAULT` was added |
| I-11 IDENTITY keys | A.4 | confirmed / which table is not |
| I-14 details length | A.5 | the real `max_length` |
| I-15 lookup column names | A.7, C.7 | confirmed / corrected names |
| I-18 nullability of audit columns | A.6 | tightened the `Rows` or left nullable |
| I-7 `ICurrentUserService` member | F.2 row 1 | the member name |
| I-6 SqlClient namespace | F.2 row 2 | which one |
| Q-11 writers of general restrictions | B.4 | who writes them; the lock-name convention (I-13) communicated |

Anything that did not match an expectation above is a defect in the procedures or the service: report it with the grid or the response body, and the fix lands in a batch 5.
