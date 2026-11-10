# Trainees list – server side, phase 3: manual test checklist

Status: written 2026-11-10 together with the code. Everything in `service-layer/` and `stored-procedures/` is carried by hand to the real .NET 8 service and to SSMS; nothing in this repository runs it. Decisions referenced here are in [decisions.md](decisions.md) (L-n, LI-n, LQ-n, LC-n) and in the 03 / 04 logs; the design is in [02-architecture.md](02-architecture.md).

How to use: the three queries of this session (trainees list, devices, lookups) are deployed together with 03 and 04. Section 0 gives the combined order; sections A–D are SSMS only and belong to this query; section F covers the C# of this query (the shared build is the one of 03 §F, extended); section G needs the client of step ד.

---

## 0. Combined run order (03, 04 and the three queries of 2026-11-10)

| Step | What | Checklist |
|---|---|---|
| 1 | Environment checks, read-only | 04 §A, 03 §A, then **this §A**, [devices §A](../devices/03-manual-test-checklist.md), [lookups §A](../lookups/03-manual-test-checklist.md) |
| 2 | DDL: the 04 and 03 schema scripts (nothing new here; §1 of the 04 script is superseded, K-5) | 04 §B, 03 §B |
| 3 | Procedures: the six of 04 and the three of 03 (three of them changed on 2026-11-10, E-8), then `trainees-list/`, `devices/`, `lookups/` | 04 §C, 03 §C, this §C, devices §C, lookups §C |
| 4 | Test data: 04, 03, then `trainees-list/00-test-data.sql` (devices and lookups have none: E-9, K-5) | 04 §D–§E, 03 §D, this §D |
| 5 | C# of everything in one build: 03 §F.1 (37 files, two of them changed) + the 33 new files of the three queries | 03 §F, then this §F, devices §F, lookups §F |
| 6 | Smoke tests | 04 §F.4, 03 §F.4, this §F.4, devices §F.4, lookups §F.4 |
| 7 | Client of step ד against the service | this §G, devices §G, lookups §G |
| 8 | Record what the run settled | §H of each |

---

## A. Environment checks (SSMS, read-only, once)

Run on `ZeroThree03`. The three tables of LQ-1 are read with one query each; a column name that differs from the assumption is corrected in `SP_AVIV_GET_TRAINEES.sql` only (the `Rows` aliases do not change).

- [ ] **A.1 Columns of `TRAINEE_SNAPSHOT` (LQ-1).** Expected: `IDNT_TRAINEE`, `IDNT_INSTITUTION`, `LOGI_ACTIVE` (confirmed) and the assumed `NUMB_PERSONAL_NUMBER`, `TEXT_FIRST_NAME`, `TEXT_LAST_NAME`, `IDNT_WING`, `IDNT_LOCATION`. Write down every differing name.

```sql
SELECT COLUMNS.column_id, COLUMNS.name, TYPES.name AS type_name, COLUMNS.max_length, COLUMNS.is_nullable
FROM   ODSINTERNALDATA.sys.columns AS COLUMNS
JOIN   ODSINTERNALDATA.sys.types   AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
WHERE  COLUMNS.object_id = OBJECT_ID('ODSINTERNALDATA.dbo.TRAINEE_SNAPSHOT')
ORDER BY COLUMNS.column_id;
```

- [ ] **A.2 Columns of `MAIN_WINGS_TABLE` (LQ-1).** Expected: `IDNT_WING`, `IDNT_INSTITUTION` and the assumed `TEXT_WING_NAME`. Same query with `OBJECT_ID('ODSINTERNALDATA.dbo.MAIN_WINGS_TABLE')`.
- [ ] **A.3 Columns of `AVIV_TRAINEE_MESSAGE` (LQ-1).** Expected: `IDNT_TRAINEE`, `DATE_MESSAGE_END`, `LOGI_INTERACTIVE_MESSAGE` (confirmed) and the assumed `DATE_MESSAGE_START`, `LOGI_ACTIVE`, plus the generic audit columns (`LAST_REQUEST_UID` is what the test script stamps). Any `NOT NULL` column without a default that the test script does not insert → add it to the two message inserts of `00-test-data.sql`.

```sql
SELECT COLUMNS.column_id, COLUMNS.name, TYPES.name AS type_name, COLUMNS.max_length, COLUMNS.is_nullable
FROM   sys.columns AS COLUMNS
JOIN   sys.types   AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
WHERE  COLUMNS.object_id = OBJECT_ID('dbo.AVIV_TRAINEE_MESSAGE')
ORDER BY COLUMNS.column_id;
```

- [ ] **A.4 One active row per trainee (L-1).** Expected: no rows. A row here means the `PRIMARY KEY` of `#Trainees` will fail for that institute; report it before creating the procedure.

```sql
SELECT IDNT_TRAINEE, COUNT(*) AS active_rows
FROM   ODSINTERNALDATA..TRAINEE_SNAPSHOT
WHERE  LOGI_ACTIVE = 1
GROUP BY IDNT_TRAINEE
HAVING COUNT(*) > 1;
```

- [ ] **A.5 Location id space (LQ-2).** Expected: `missing_locations` = 0 – every location id of an active trainee exists in `A_LOCATION`. A count above 0 means some trainees sit in virtual locations (then a second `LEFT JOIN` to `AVIV_VIRTUAL_WING_DATA` is added to the result step) or the column is not an `A_LOCATION` id.

```sql
SELECT COUNT(*) AS missing_locations
FROM   ODSINTERNALDATA..TRAINEE_SNAPSHOT AS TRAINEE
WHERE  TRAINEE.LOGI_ACTIVE = 1 AND TRAINEE.IDNT_LOCATION IS NOT NULL
  AND  NOT EXISTS (SELECT 1 FROM ODSINTERNALDATA..A_LOCATION AS LOCAT WHERE LOCAT.IDNT_LOCATION_TRAINEE = TRAINEE.IDNT_LOCATION);
```

- [ ] **A.6 Leading zeros of the personal number (LQ-3).** `SELECT TOP (20) NUMB_PERSONAL_NUMBER FROM ODSINTERNALDATA..TRAINEE_SNAPSHOT WHERE LOGI_ACTIVE = 1;` – if the numbers have fewer than 7 digits, the client pads to 7 for display (one line in the card logic); if the column turns out to be text, `TraineeRow.NumbPersonalNumber` becomes `string?` and the DTO `string`.
- [ ] **A.7 Server clock and compatibility level.** Settled by 04 §A.1 / §A.3; nothing to repeat.

---

## B. Schema

Nothing: the query reads existing tables; no DDL, no DECODE row, no index (A-1).

---

## C. Create the procedure (`stored-procedures/trainees-list/SP_AVIV_GET_TRAINEES.sql`)

- [ ] **C.1** Run the file (`CREATE OR ALTER`, re-runnable). It needs the 04 DDL (`LOGI_RESTRICTION_INLINE_PERMIT`) and the 03 DDL (`IDNT_TRAINEE` on `AVIV_TRAINEE_RESTRICTION`). A failure here is almost always a column name of §A.1–§A.3.
- [ ] **C.2 Verify.** `SELECT name, modify_date FROM sys.procedures WHERE name = 'SP_AVIV_GET_TRAINEES';` – one row.

---

## D. Run the test script (`stored-procedures/trainees-list/00-test-data.sql`)

Set `@TestInstitutionId` and `@TestTraineeId` at the top (a development institute and one of its current trainees). Run the whole file (F5) and read the grids top to bottom. Re-runnable: the cleanup block removes the stamped rows first (L-10). Dates are relative to today.

- [ ] **D.1 Setup grid absent.** If the first grid says "Set @TestInstitutionId and @TestTraineeId", the ids are still 0.
- [ ] **D.2 Read 0 – before the scenario.** `TraineeFound` = 1; `TraineesInInstitute` = the number of current trainees of the institute (compare with `SELECT COUNT(*) FROM ODSINTERNALDATA..TRAINEE_SNAPSHOT WHERE IDNT_INSTITUTION = … AND LOGI_ACTIVE = 1`); the trainee's `TextWingName` and `TextLocationName` filled (or the location NULL if the trainee has none); flags as the real data leaves them.
- [ ] **D.3 Messages T5, T6.** `inserted`. If `NOT inserted`, the grid shows the SQL error: add the missing `AVIV_TRAINEE_MESSAGE` columns to the script (A.3) and re-run; `HasActiveInteractiveMessage` stays 0 until then.
- [ ] **D.4 Read 1 – after the scenario.** `Result` = `OK`: `DateRestrictedUntil` = today + 30, Full 0, Minutes 1, PhoneRestriction 1, PhonePermit 1, Message 0; `HasActiveInteractiveMessage` 1 when D.3 inserted.
- [ ] **D.5 Read 2 – by the trainee's wing.** `TraineeFound` 1, `TraineesOfOtherWings` 0, `TraineesInWing` ≤ `TraineesInInstitute`.
- [ ] **D.6 Read 3 – institute and its wing.** `Trainees` = `TraineesInInstitute` of Read 0 (the wing was dropped from `#ReqWings` because its institute is requested).
- [ ] **D.7 Read 4 – both lists empty.** `Trainees` 0, no error.
- [ ] **D.8 Test rows by table.** 2 / 1 / 1 / 1 / 2 (or 0) / 1.
- [ ] **D.9 Response time (LQ-6).** For the largest institute of the environment: `SET STATISTICS TIME ON; EXEC dbo.SP_AVIV_GET_TRAINEES @IDNT_INSTITUTION_LIST = …, @IDNT_WINGS_LIST = …;` – write down the elapsed time. Above ~2 s, an index on `IDNT_TRAINEE` of `AVIV_TRAINEE_RESTRICTION`, `AVIV_TRAINEE_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` and `AVIV_TRAINEE_MESSAGE` is the first remedy (A-1 left indexes for later).
- [ ] **D.10 After the API smoke tests**, run the cleanup block alone (the constants + the `BEGIN TRANSACTION … COMMIT` block) to remove the stamped rows from the real trainee.

---

## F. Wire the C# into the real service (`service-layer/`)

Builds on 03 §F (the 37 files of 03 / 04, with the two shared files changed on 2026-11-10 – E-8 – and `RequestRules.cs` extended).

### F.1 Copy the files (13 new)

| Group | Files |
|---|---|
| Trainees list (11) | `Controllers/TraineesController.cs` · `Interfaces/ITraineesOrchestrator.cs` · `Interfaces/ITraineesRepository.cs` · `Interfaces/ICellcomBalanceProvider.cs` · `Models/Trainees/TraineeDto.cs` · `Models/Trainees/CellcomTraineeBalance.cs` · `Repository/TraineesRepository.cs` · `Services/Trainees/TraineesOrchestrator.cs` · `Services/Trainees/TraineesAssembler.cs` · `Services/Trainees/CellcomBalanceStandIn.cs` · `Utils/StoredProcedures.Trainees.cs` |
| Shared, re-copied | `Repository/ProcedureParameters.cs` (`AddIdList` accepts `null`, removes duplicates), `Models/RecordRows.cs`, `Services/RecordPartsAssembler.cs` (E-8) |

### F.2 Adaptation points

| # | Where | What to check | Decision |
|---|---|---|---|
| 1–6, 8 | as 03 §F.2 | `ICurrentUserService` (not used by this query), `Microsoft.Data.SqlClient`, `partial StoredProcedures`, `ToDataTable()`, the `QueryMultiple` lambda shape, implicit usings / C# 12, namespace analyzer | I-6, I-7, A-15, A-16, I-16, TQ-6 |
| 7 | `Program.cs` | Add: `using Aviv_Service.Services.Trainees;` and `builder.Services.AddScoped<ITraineesOrchestrator, TraineesOrchestrator>(); builder.Services.AddScoped<ITraineesRepository, TraineesRepository>(); builder.Services.AddSingleton<ICellcomBalanceProvider, CellcomBalanceStandIn>();` | L-6, LI-4 |
| 9 | `Models/Trainees/TraineeDto.cs` | If §A.6 shows a text personal number: `TraineeRow.NumbPersonalNumber` → `string?` and `TraineeDto.NumbPersonalNumber` → `string`; the assembler's `?? 0` becomes `?? ""`. | LQ-3 |

- [ ] **F.3 Build.** Zero errors. The two 03 / 04 assemblers compile against `ToDeviceIds` (E-8).

### F.4 Smoke tests against the API

Run after §D (the scenario rows exist). Bodies are camelCase JSON.

- [ ] **F.4.1 List.** `POST api/Trainees/GetTrainees` with `{ "idntInstitutionList": [<dev institute>], "idntWingList": [] }`. Expected 200 with a bare array `[ … ]` (L-15), one item per current trainee, ordered by name. Spot-check the test trainee: `idntTrainee`, `numbPersonalNumber`, `textFullName`, `idntInstitution`, `wing: { id, name }`, `location: { id, name }` or `null`, `dateRestrictedUntil` = today + 30 as `yyyy-MM-dd`, `numbRemainingMinutes` 0, `flags` with the six procedure flags as in D.4 and `hasBalance` false, `hasCellcomDiscrepancy` false (the stand-in, L-6). No `firstName`, `lastName`, `lastActivityDate` (L-12).
- [ ] **F.4.2 Wings only.** `{ "idntInstitutionList": [], "idntWingList": [<the trainee's wing>] }` → 200, the trainees of that wing.
- [ ] **F.4.3 Input check 400.** `{ "idntInstitutionList": [], "idntWingList": [] }` → 400 with the plain-text body `"Invalid request values."` (the `LocationsController` shape, L-15). `{ "idntInstitutionList": [0] }` → 200 `[]` (an unknown id matches nothing; no field-level validation in a read).
- [ ] **F.4.4 Omitted wings and duplicates.** `{ "idntInstitutionList": [<dev institute>] }` (no `idntWingList`) → 200; `{ "idntInstitutionList": [<dev institute>, <dev institute>] }` → 200 with the same list (duplicates removed in `ProcedureParameters.AddIdList`, not a `PRIMARY KEY` error).
- [ ] **F.4.5 Empty body.** → 400 `ProblemDetails` from `[ApiController]`, as 04 §F.4.2.
- [ ] **F.4.6 Unknown institute.** `{ "idntInstitutionList": [999999999] }` → 200 `[]` (no error for a read that finds nothing).
- [ ] **F.4.7 500 path.** Stop the SQL Server service and call the list → 500 with the plain-text body `"An error occurred while retrieving trainees."` and one log line `Error at GetTrainees` (the repository does not catch, A-6; the controller does, L-15).

---

## G. End-to-end with the client (step ד applied)

- [ ] **Home screen** for the development institute: the cards show the real trainees with name, personal number (7 digits – LQ-3), wing and location; the test trainee shows "מוגבל עד" with today + 30, the minutes-restriction icon, the phone restriction and permit icons and the interactive-message icon; minutes show 0 and the balance filter "יש יתרה" shows nobody (L-6, until Cellcom).
- [ ] **Filters**: by wing and by location (the location ids match `GetLocationsAndVirtualLocations`, LQ-2); the restriction / message / phone filters follow the flags.
- [ ] **Sort**: by name, status, minutes, wing, location – client side, unchanged.
- [ ] **Drawer / record screens** read the trainee from the cached list (`findTrainee`): header name and personal number.
- [ ] **After a save** in 03 or 04 the list reloads and the flags change accordingly (`clearCachedTrainees`).
- [ ] **Photo**: the placeholder shows (the service has no photo action, L-8); the real image appears once the external API base is configured (LQ-4).
- [ ] **Error state**: service stopped → the list's error text and "טעינה מחדש".

---

## H. What the run settles – record the outcome in decisions.md

| Item | Settled by | Record as |
|---|---|---|
| LQ-1 assumed column names | A.1–A.3, C.1 | confirmed / corrected names |
| L-1 one active row per trainee | A.4 | confirmed, or the institutes with duplicates |
| LQ-2 location id space | A.5, G | 0 missing / the count and the decision |
| LQ-3 leading zeros | A.6, G | pad in the client / text column |
| LQ-6 response time | D.9 | the elapsed time of the largest institute |
| L-5 `AVIV_TRAINEE_MESSAGE` columns | A.3, D.3 | the missing columns added to the test script, if any |
| L-6 stand-in behaviour | F.4.1, G | minutes 0, no balance – as designed |
