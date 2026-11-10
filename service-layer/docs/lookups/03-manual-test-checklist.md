# Lookups (DECODE) – server side, phase 3: manual test checklist

Status: written 2026-11-10 together with the code. Decisions referenced here are in [decisions.md](decisions.md) (K-n, KI-n, KQ-n, KC-n); the design is in [02-architecture.md](02-architecture.md). The combined run order is in [../trainees-list/03-manual-test-checklist.md §0](../trainees-list/03-manual-test-checklist.md).

No test-data script (K-5): the DBA fills `AVIV_DECODE`; this checklist reads what is there, and the client stays on its mock lists for every set that is still empty (K-6).

---

## A. Environment checks (SSMS, read-only, once)

- [ ] **A.1 Columns of `AVIV_DECODE` (KQ-2).** Expected: `CODE_TABLE` (int), `LOGI_ACTIVE`, `SORT_ORDER` (confirmed) and the assumed `CODE_VALUE`, `TEXT_DESCRIPTION`. A differing code or text column name is corrected in `SP_AVIV_GET_DECODE.sql` only.

```sql
SELECT COLUMNS.column_id, COLUMNS.name, TYPES.name AS type_name, COLUMNS.max_length, COLUMNS.is_nullable, COLUMNS.collation_name
FROM   sys.columns AS COLUMNS
JOIN   sys.types   AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
WHERE  COLUMNS.object_id = OBJECT_ID('dbo.AVIV_DECODE')
ORDER BY COLUMNS.column_id;
```

- [ ] **A.2 Which sets exist, and their numbers (KQ-1).** Write down the `CODE_TABLE` values and what they hold. Then set the three numbers in `Utils/DecodeTables.cs` **and** in `src/config/decodeTables.ts` (today 1 / 2 / 3 provisional).

```sql
SELECT CODE_TABLE, COUNT(*) AS rows_total, SUM(CASE WHEN LOGI_ACTIVE = 1 THEN 1 ELSE 0 END) AS rows_active
FROM   dbo.AVIV_DECODE
GROUP BY CODE_TABLE
ORDER BY CODE_TABLE;
```

- [ ] **A.3 Text column collation.** If `TEXT_DESCRIPTION` is `varchar` with a non-Hebrew collation, the reasons would show as `?` (P-9 reasoning); expected `nvarchar` or a Hebrew collation.

---

## B. Schema

Nothing. The §1 proposal of `stored-procedures/schema/01-proposed-schema-changes.sql` is marked superseded (K-5) and is not run.

---

## C. Create the procedure (`stored-procedures/lookups/SP_AVIV_GET_DECODE.sql`)

- [ ] **C.1** Run the file (`CREATE OR ALTER`). A failure is a column name of §A.1.
- [ ] **C.2 Verify.** `SELECT name, modify_date FROM sys.procedures WHERE name = 'SP_AVIV_GET_DECODE';` – one row.

---

## D. Run the procedure

```sql
DECLARE @OneTable dbo.INT_TABLE;    INSERT INTO @OneTable (IDNT_GENERAL) VALUES (1);
DECLARE @ThreeTables dbo.INT_TABLE; INSERT INTO @ThreeTables (IDNT_GENERAL) VALUES (1), (2), (3);
DECLARE @Unknown dbo.INT_TABLE;     INSERT INTO @Unknown (IDNT_GENERAL) VALUES (999);
EXEC dbo.SP_AVIV_GET_DECODE @CODE_TABLE_LIST = @OneTable;
EXEC dbo.SP_AVIV_GET_DECODE @CODE_TABLE_LIST = @ThreeTables;
EXEC dbo.SP_AVIV_GET_DECODE @CODE_TABLE_LIST = @Unknown;
```

(Use the real numbers of §A.2 in place of 1, 2, 3.)

- [ ] **D.1 One table.** Its active rows, in `SORT_ORDER`; columns `CodeTable`, `Id`, `Name`. An inactive row (`LOGI_ACTIVE = 0`) is absent.
- [ ] **D.2 Three tables.** The rows of all three, grouped by `CodeTable` in ascending order, each group in `SORT_ORDER`. A set the DBA has not filled yet contributes no rows (the service still returns it, empty – K-3).
- [ ] **D.3 Unknown table.** No rows, no error (the service stops an unknown number earlier with 400).

---

## F. Wire the C# into the real service (`service-layer/`)

### F.1 Copy the files (8)

`Controllers/LookupsController.cs` · `Interfaces/ILookupsOrchestrator.cs` · `Interfaces/ILookupsRepository.cs` · `Models/Lookups/DecodeDto.cs` · `Repository/LookupsRepository.cs` · `Services/Lookups/LookupsOrchestrator.cs` · `Utils/DecodeTables.cs` · `Utils/StoredProcedures.Lookups.cs` (8 files, K-10)

### F.2 Adaptation points

| # | Where | What to check | Decision |
|---|---|---|---|
| 1–6, 8 | as 03 §F.2 | the shared adaptation points | |
| 7 | `Program.cs` | Add: `using Aviv_Service.Services.Lookups;` and `builder.Services.AddScoped<ILookupsOrchestrator, LookupsOrchestrator>(); builder.Services.AddScoped<ILookupsRepository, LookupsRepository>();` | A-11 |
| 9 | `Utils/DecodeTables.cs` | The three numbers from §A.2 (KQ-1); the same numbers in the client's `src/config/decodeTables.ts`. | KI-3 |

- [ ] **F.3 Build.** Zero errors.

### F.4 Smoke tests against the API

- [ ] **F.4.1 Three tables.** `POST api/Lookups/GetDecode` with `{ "codeTableList": [1, 2, 3] }` → 200 with a bare array `[ { "codeTable": 1, "codeTableName": "TraineeRestrictionReasons", "items": [ { "id", "name" }, … ] }, { "codeTable": 2, "codeTableName": "PhoneExceptionReasons", … }, { "codeTable": 3, "codeTableName": "VoiceMessageReasons", … } ]` (K-10) – three tables in the request's order, names from the registry, items in `SORT_ORDER`. A set the DBA has not filled → `"items": []`, the table still present (K-3).
- [ ] **F.4.2 One table.** `{ "codeTableList": [2] }` → one table.
- [ ] **F.4.3 Input check 400.** `{ "codeTableList": [] }` → 400 with the plain-text body `"Invalid request values."`; `[999]` and `[1, 999]` → the same 400 (unknown to the registry, K-3); `[0]` → 400 (0 is unknown too); `[1, 1]` → 200 with one table (duplicates collapsed in the orchestrator). A stopped SQL Server → 500 `"An error occurred while retrieving code tables."` with one log line `Error at GetDecode`.
- [ ] **F.4.4 Empty body.** → 400 `ProblemDetails` from `[ApiController]`.

---

## G. End-to-end with the client (step ד applied)

- [ ] **Forms** (03 restriction, 04 restriction / permit, 05 message): the reason select shows the real list of its set once the DBA filled it, in `SORT_ORDER`; a set still empty shows the mock list (K-6) – the same five values as before.
- [ ] **Prefetch**: after the trainees list loads, one `POST Lookups/GetDecode` with the three numbers appears in the network tab, before any form is opened; the forms open with the lists ready.
- [ ] **Save**: `codeRestrictionReason` / `codePermitReason` carry the `id` of the chosen item (I-23).
- [ ] **Error state**: service stopped before the prefetch → opening a form loads the lists again and shows its "לא ניתן לטעון את רשימת הסיבות" + "טעינה מחדש".

---

## H. What the run settles – record the outcome in decisions.md

| Item | Settled by | Record as |
|---|---|---|
| KQ-1 the three set numbers | A.2 | the numbers, set in both registries |
| KQ-2 code and text column names | A.1, C.1 | confirmed / corrected |
| K-6 mock fallback | G | which sets were still empty; remove the fallback when all three are filled (pending-decisions) |
| A.3 collation | A.3, G | Hebrew survives yes / no |
