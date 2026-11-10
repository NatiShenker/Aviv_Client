# Decisions log – lookups, DECODE (server side)

`POST Lookups/GetDecode`: the rows of one or more code tables of `AVIV_DECODE`, by numeric table id; today the three reason lists of the forms (spec 00 §4.3, §6). Written on 2026-11-10 in one session together with the trainees list and the devices list.

How this log relates to the other logs: decisions of 04 and 03 are not re-decided (section V); new decisions are **K-n**, implementation notes **KI-n**, open items **KQ-n**, client changes **KC-n**. 04's D-10 and the §1 of its schema script are superseded in part (K-5).

Status values: **Closed**, **Adopted**, **Open**. Dates: review rounds on 2026-11-10 (including one conflict notice resolved for spec 00); phases 2 and 3 written the same day in sequence by the owner's instruction.

---

## K – decisions

| ID | Topic | Tables | Decision | Status |
|---|---|---|---|---|
| K-1 | The table and its columns | `AVIV_DECODE` | **`AVIV_DECODE`** in `ZeroThree03` (ours), not `DECODE`. `CODE_TABLE` is a **number** (the set id), the code is a number, `LOGI_ACTIVE` and `SORT_ORDER` exist (owner). The code and text columns are assumed `CODE_VALUE` / `TEXT_DESCRIPTION` (KQ-2). Set *names* do not exist in the database; they exist only as the fields of the server registry (K-3), each with a comment naming the column its set serves – which keeps the naming consistent with the tables, as the owner asked (ש-16). | Closed |
| K-2 | One generic procedure with a list | `AVIV_DECODE` | `SP_AVIV_GET_DECODE (@CODE_TABLE_LIST dbo.INT_TABLE)` → `CodeTable, Id, Name`, active rows only, `ORDER BY CODE_TABLE, SORT_ORDER`. A TVP because spec 00 §7 wants array-capable lookups, every procedure of ours takes one, and the owner asked for the three lists "together". The procedure knows no set names. | Closed |
| K-3 | The API: one generic action, numbers plus names | – | **`POST Lookups/GetDecode { codeTableList: int[] }` → `[{ codeTable, codeTableName, items: [{ id, name }] }]`** – a bare array, one element per requested table (K-10). The owner chose the generic shape over three named actions (`Get…Reasons`) and asked to add, beside the number, "השם (של הדומיין או של המשתנה), ככה שבדיבוג נוכל לראות מול העיניים". Therefore the server holds a **registry** (`Utils/DecodeTables.cs`: number → name, one field per known set) that is also the **allowed list**: an unknown number is 400 `codeTableList`, not an empty table. Every requested known table is returned, with empty `items` when it has no rows, so the client can fall back per key (K-6). Price accepted: a new set needs a constant on both sides (client config + server registry) instead of the client only. Considerations recorded in the planning file §4ב.3 and §4ב.6 א2 (named vs generic; fetching together is worth a little – forms open with the lists ready, one fallback point – and costs ~10 lines). | Closed |
| K-4 | Three reason lists, not one (conflict resolved for the spec) | `AVIV_DECODE` | In review the owner wrote "כל הסיבות זהות בכל הפעולות"; that contradicts spec 00 §4.3 ("except for the reason list") and §6 (three different lists, "a DECODE set per list"), on which the client is built. Raised as **⚠️ Conflict Detected**; the owner chose **three lists – as in the spec**. Three sets, three client keys, three registry fields. | Closed |
| K-5 | Who fills the table; what happens to the 04 proposal | `AVIV_DECODE` | **The DBA** inserts the rows (owner). No schema script and no test data here. The §1 of `stored-procedures/schema/01-proposed-schema-changes.sql` (an insert proposal into `dbo.DECODE` with text set names, D-10) is marked **superseded** – the type and scope codes are documented values, not rows this repository proposes. | Closed |
| K-6 | The client keeps its mock as a fallback | – | Owner's instruction (ש-16): wherever the client receives a reasons list, it keeps using the mock list **when the server returns an empty list for that key**, until `AVIV_DECODE` is populated. Implemented in `reasonsService.ts` (the service layer, never in components – CLAUDE.md), per key; a pending-decisions row says to remove it when the table is filled. | Closed |
| K-7 | Type and scope constants stay `DECLARE`d | – | `@RestrictionTypeTrainee = 1`, `@RestrictionTypeNumber = 2`, `@ScopeGeneral = 1`, `@ScopeTrainee = 2` stay literal constants in the procedures (ש-18: a run-time read from `AVIV_DECODE` adds a join without a readability gain). Those sets are not in the client-facing registry because the client never asks for them. | Closed |
| K-8 | The rule for "generic vs named" (recorded for future lookups) | – | Generic is right in the layers that are truly identical (procedure, repository, orchestrator, assembler); the consumer-facing layer may be generic too **when the consumer chooses by data** (a set id) rather than by a domain operation – and then the response must name what the number means (K-3). Named actions remain the rule for operations with their own semantics (03 / 04, A-7). | Adopted |
| K-9 | Names | – | Procedure `SP_AVIV_GET_DECODE` (A-15); controller `LookupsController` (the client's controller name), route `api/Lookups`, action `GetDecode`; parameter `@CODE_TABLE_LIST`; request `codeTableList`. The three placeholder paths `Lookups/Get*Reasons` are removed from the client (KC-1). | Closed |
| K-10 | **Reads follow the shape of `reference/service` (Locations)** – the owner's review of the written code, 2026-11-10 | – | As L-15 of the trainees list: the input check (empty list, or an id unknown to `DecodeTables`) and the `try/catch` are in the controller, with plain-text 400 / 500 bodies; no validator class, no `…RequestFields`, no `ApiActionRunner`, no response wrapper – the response is the bare list of `DecodeTableDto`. One DTO file (`Models/Lookups/DecodeDto.cs`: request record, `DecodeTableDto`, `DecodeRow`), like `WingDto.cs`. The orchestrator **stays**, because the grouping of rows into a table per requested id with its name is real logic and needs one home; the separate assembler class was folded into it. Lookups and Devices stay separate controllers (owner). The repository does not catch (A-6). The first version (validator + assembler + three model files + runner) was written and removed the same day. | Closed |

## KI – implementation notes (phase 3)

| ID | Decision | Why |
|---|---|---|
| KI-1 | `DecodeTable` (the record) and `DecodeTables` (the registry) share one file, `Utils/DecodeTables.cs`. | One concept – the registry of known code tables; a `Models/` file for a two-field record used only by `Utils` and the assembler would split it for no reader's benefit. `Utils/` stays free of `Models` dependencies, as TI-7 asks. |
| KI-2 | The "known table" check is one line in the controller (`DecodeTables.IsKnown` over the list), next to the emptiness check. | K-10: the controller is the only place that validates a read; `RequestRules` holds rules of the saves and must not learn about the DECODE registry. |
| KI-3 | The provisional numbers are 1, 2, 3 in the order of spec 00 §6; `nameof(field)` is the name returned to the client. | A single place to edit when the DBA fixes the numbers (KQ-1); `nameof` keeps the name and the field from drifting apart. |
| KI-4 | `DecodeRow.Name` is nullable and the assembler writes `Name ?? ""`. | A `TEXT_DESCRIPTION` NULL in a hand-filled table must not turn the whole response into a 500 (I-18 reasoning). |

## V – decisions of 03 and 04 verified for the lookups

| id | Short form | Here | Note |
|---|---|---|---|
| D-7 | Reason not stored; no reasons lookup | **Superseded in part** | The lookup now exists (this query); storing stays pending (I-23) |
| D-10 | `DECODE` sets `AVIV_RESTRICTION_TYPE`, `AVIV_RESTRICTION_SCOPE` proposed as text names | **Amended** | The table is `AVIV_DECODE` with numeric set ids; the type and scope codes remain the documented constants of the procedures (K-7); the §1 insert proposal is superseded (K-5) |
| D-17 | No permission check | Verified | |
| A-1 | No indexes | Verified | A five-row-per-set table |
| A-3, A-6, A-7, A-16 | One procedure; no catch in the repository; names; `QueryMultiple` + TVP | Verified | A-7 read with K-8: the action is generic because the consumer chooses by data |
| A-11, A-12, A-13, A-14 | Shared `RunAsync`, validator, structured error body, wrapped responses | **Not applied to reads** (K-10, L-15) | Controller in the `LocationsController` shape; plain-text 400 / 500; bare list; recorded difference from the 03 / 04 histories |
| A-15 | Procedure names speak the tables' vocabulary | Verified | `GET_DECODE` for `AVIV_DECODE` |
| G-1 … G-5 | Guidelines | Verified | |
| I-4 | Normalized request copy | Not applicable (K-10) | `ProcedureParameters.AddIdList` normalizes `null` and duplicates; the orchestrator groups by distinct ids |
| I-18 | Nullable row text | Verified | KI-4 |
| I-20 | No placeholder fields | Verified | `CodeTableName` is real information (the registry), not a constant pretending to be data |
| I-23 | Reason codes accepted, not stored | Verified | The codes the client sends are the `Id` values this query returns |
| T-12, T-13 | Shared code; layout | Verified | `Models/Lookups/`, `Services/Lookups/`; `LookupItemDto` reused for the items |
| C-2 | No reasons endpoints; client placeholders | **Superseded** | One real endpoint (K-3); the client's mock stays only as a fallback (K-6) |
| Q-12 | The form requires a reason the server drops | Unchanged | Still pending the DBA's columns (I-23); unrelated to reading the lists |

## C – client changes deferred

Applied in the client on 2026-11-10, in step ד of the same session.

| ID | Change | Where to start in the client |
|---|---|---|
| KC-1 | One endpoint `Lookups/GetDecode` replaces the three `Lookups/Get*Reasons` paths; `src/config/decodeTables.ts` holds the three table numbers by `ReasonListKey` (mirrors `Utils/DecodeTables.cs`); `reasonsService.getReasons()` fetches all three in one `POST`, prefetched together with the devices after the trainees list, and fills `reasonsCache` for the three keys by `codeTable`; the response is a bare array (`DecodeTableDto[]`, K-10); `useReasons(listKey)` in the forms is unchanged | `src/config/serviceEndpoints.ts`, `src/config/decodeTables.ts` (new), `src/services/reasonsService.ts`, `useTraineesListData.ts` (prefetch) |
| KC-2 | Empty `items` for a key → the mock list of that key, inside `reasonsService.ts` (K-6); documented in `.agent/pending-decisions.md` as "remove when `AVIV_DECODE` is filled" | `reasonsService.ts`, `reasonsMockData.ts`, `.agent/pending-decisions.md` |
| KC-3 | The mock handler answers `POST Lookups/GetDecode` with the requested tables from the three mock lists; the three GET routes are removed | `src/mock-server/handlers/lookupsHandlers.ts`, `mockRoutes.ts`, `mockScenarios.ts` |

## Q – open items

| ID | Question | Tables | Needed for | Status |
|---|---|---|---|---|
| KQ-1 | The `CODE_TABLE` numbers of the three reason sets, from the DBA. Provisional 1 / 2 / 3 in `Utils/DecodeTables.cs` and `src/config/decodeTables.ts` until then (KI-3). | `AVIV_DECODE` | real lists in the client | Open – ask the DBA |
| KQ-2 | The code and text column names (assumed `CODE_VALUE`, `TEXT_DESCRIPTION`). One `sys.columns` query in the checklist §A before the procedure is created; a differing name is corrected in `SP_AVIV_GET_DECODE.sql` only. | `AVIV_DECODE` | procedure | Open – checklist |
| KQ-3 | Does the DBA keep a "table of tables" (number → name) next to `AVIV_DECODE`? If so, `CodeTableName` could come from the database and the server registry would shrink to the allowed list. Not needed now. | – | – | Open |
