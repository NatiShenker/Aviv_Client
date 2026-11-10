# Lookups (DECODE) – server side, phase 2: architecture

Status: approved by the product owner on 2026-11-10 together with phase 1. **Revised the same day after the owner's review of the written code (K-10):** the query follows the shape of `LocationsController` / `WingDto.cs` in `reference/service/` – the input check and the `try/catch` in the controller, one DTO file, a bare list in the response; the orchestrator stays because it holds the one piece of logic (grouping the rows into a table per requested id). Phase 1 is in [01-business-analysis.md](01-business-analysis.md); decisions in [decisions.md](decisions.md) (K-n, KQ-n, KC-n) and in the 03 / 04 logs.

Scope: `POST Lookups/GetDecode` – one generic HTTP action, one generic stored procedure, the service layers and the registry of known code tables.

---

## 1. Principles the design follows

1. **Generic where the layers are identical** (K-3, K-8): procedure, repository and orchestrator know nothing about reasons; they move rows of `(CodeTable, Id, Name)`. The only place that knows what a number means is `Utils/DecodeTables.cs`.
2. **The response explains itself** (K-3): every table comes back with its number **and** its name, so a log line or a Swagger body reads "reasons for a trainee restriction", not "7".
3. **An unknown table is a 400** (K-3): the registry is the allowed list, checked in the controller. A requested, known table with no rows is returned with empty `items`, so the client can fall back per key (K-6).
4. **A read looks like `Locations`** (K-10): one-line check and `try/catch` in the controller, no validator class, no `ApiActionRunner`, the list itself in the response.
5. **One call for all the sets a screen needs** (K-2, spec 00 §7): the procedure takes a TVP of table ids.
6. **No catch in the repository** (A-6); **no permission check** (D-17).

---

## 2. Layers and files

Namespaces: `Aviv_Service.Models.Lookups`, `Aviv_Service.Services.Lookups`, and the flat ones (T-13).

### 2.1 Files (8)

| File | Responsibility |
|---|---|
| `Controllers/LookupsController.cs` | `[Authorize] [ApiController] [Route("api/[controller]")]`; one action `GetDecode` (POST): `isInvalid` check (empty list, or an id unknown to `DecodeTables`) → `BadRequest("Invalid request values.")`, `try` → `Ok(list)`, `catch` → log + `500`. |
| `Interfaces/ILookupsOrchestrator.cs`, `Services/Lookups/LookupsOrchestrator.cs` | Calls the repository and builds one `DecodeTableDto` per **requested** id, in the request's order, with its name from the registry and its rows (possibly none) (§8). |
| `Interfaces/ILookupsRepository.cs`, `Repository/LookupsRepository.cs` | One method `GetDecodeAsync(DecodeRequestDto)`: one TVP through `ProcedureParameters.AddIdList("@CODE_TABLE_LIST", …)`, one `QueryMultiple`, one `Read<DecodeRow>()`. |
| `Models/Lookups/DecodeDto.cs` | `DecodeRequestDto`, `DecodeTableDto`, `DecodeRow` in one file, like `WingDto.cs` (§7). |
| `Utils/DecodeTables.cs` | The registry: `record DecodeTable(int CodeTable, string Name)` and the static class `DecodeTables` with one field per known set, `All`, `IsKnown(int)`, `NameOf(int)`. The numbers are the DBA's (KQ-1); each field carries a comment naming the column its set serves (K-1). |
| `Utils/StoredProcedures.Lookups.cs` | `GET_DECODE`, a `partial` addition to `StoredProcedures`. |

No shared file changes beyond `ProcedureParameters.AddIdList` (see [../trainees-list/02-architecture.md §2.2](../trainees-list/02-architecture.md)). The response items are the shared `LookupItemDto` (`Models/RecordDtos.cs`).

### 2.2 The resulting additions to the layout of `service-layer/`

```
Controllers/     LookupsController.cs
Interfaces/      ILookupsOrchestrator.cs, ILookupsRepository.cs
Models/          Lookups/  DecodeDto.cs
Repository/      LookupsRepository.cs
Services/        Lookups/  LookupsOrchestrator.cs
Utils/           DecodeTables.cs, StoredProcedures.Lookups.cs
```

The stored procedure lives in `stored-procedures/lookups/SP_AVIV_GET_DECODE.sql`. No test-data script: the DBA fills the table (K-5).

---

## 3. Action → procedure

| Action | Procedure | Parameters | Result set | HTTP response |
|---|---|---|---|---|
| `POST GetDecode` | `SP_AVIV_GET_DECODE` | `@CODE_TABLE_LIST dbo.INT_TABLE READONLY` | 1 `DecodeRow` – every active row of the requested tables: `CodeTable`, `Id`, `Name`, ordered by table then `SORT_ORDER` | `200` with `List<DecodeTableDto>` – a bare JSON array, one element per requested table (K-10) |

---

## 4. Procedure conventions and structure

Unchanged by the revision. One statement under one header ("תוצאה: שורות הטבלאות המבוקשות (DecodeRow)"): `dbo.AVIV_DECODE (NOLOCK)` ⋈ `@CODE_TABLE_LIST` on `CODE_TABLE = IDNT_GENERAL`, `WHERE LOGI_ACTIVE = 1`, `ORDER BY CODE_TABLE, SORT_ORDER`. The two assumed column names (`CODE_VALUE`, `TEXT_DESCRIPTION`) are marked (KQ-2).

---

## 5. Business checks and the error contract

- **Procedure:** none.
- **Controller (K-10):** `codeTableList` empty or holding an id unknown to the registry → `400` `"Invalid request values."`; any exception → log `Error at GetDecode` + `500` `"An error occurred while retrieving code tables."`. Plain strings, as `LocationsController`.

---

## 6. Input check

One line in the controller: `request.CodeTableList is null or [] || request.CodeTableList.Any(codeTable => !DecodeTables.IsKnown(codeTable))` → `400`. Duplicates are collapsed by the orchestrator (`Distinct()`), so `[1, 1]` yields one table.

---

## 7. Data shapes (`Models/Lookups/DecodeDto.cs`)

```csharp
public record DecodeRequestDto(int[] CodeTableList);

public class DecodeTableDto                               // one element of the bare response array
{
    public int CodeTable { get; set; }                   // AVIV_DECODE.CODE_TABLE
    public string CodeTableName { get; set; } = "";      // DecodeTables registry, for debugging (K-3)
    public List<LookupItemDto> Items { get; set; } = []; // active rows in SORT_ORDER; empty when the DBA has not filled the set yet
}

public class DecodeRow { public int CodeTable { get; set; } public int Id { get; set; } public string? Name { get; set; } }
```

JSON: `[ { "codeTable": 1, "codeTableName": "TraineeRestrictionReasons", "items": [ { "id": 1, "name": "הפרת משמעת" }, … ] }, … ]`.

Registry (`Utils/DecodeTables.cs`): `TraineeRestrictionReasons = (1, …)`, `PhoneExceptionReasons = (2, …)`, `VoiceMessageReasons = (3, …)` – **provisional** numbers until the DBA fixes them (KQ-1); the client's `config/decodeTables.ts` mirrors them.

---

## 8. Composing the response (`LookupsOrchestrator`)

1. Read the rows; group them by `CodeTable`.
2. For every distinct id in the request, in its order: `DecodeTableDto { CodeTable = id, CodeTableName = DecodeTables.NameOf(id), Items = rows of that id → LookupItemDto }` – an id with no rows gets an empty list, never disappears.
3. Return the list.

---

## 9. Client changes (C-list)

[decisions.md section C](decisions.md): KC-1 (`serviceEndpoints.lookups.getDecode`; `config/decodeTables.ts`; `reasonsService.getReasons()` fetches the three tables in one call, prefetched with the devices, splits into the three cache keys; the response is a bare array), KC-2 (empty `items` → the mock list of that key), KC-3 (the mock handler answers `POST Lookups/GetDecode`).

---

## 10. Phase 3 – what was written

1. **SQL.** `stored-procedures/lookups/SP_AVIV_GET_DECODE.sql`; a "superseded" note in §1 of `stored-procedures/schema/01-proposed-schema-changes.sql`.
2. **C#.** The eight files of §2.1. Written first with a validator, a separate assembler and three model files, and slimmed the same day to the Locations shape (K-10).
3. **Docs.** `03-manual-test-checklist.md` of this folder.
