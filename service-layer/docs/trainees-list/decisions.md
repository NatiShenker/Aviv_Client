# Decisions log – trainees list (server side)

The query behind the home screen: `POST Trainees/GetTrainees`, the current trainees of one or more institutes with their wing, location, "מוגבל עד" date and status flags (spec `01_children_list.md`). Written on 2026-11-10 in one session together with the devices list and the DECODE lookup, the three queries the client still lacked after features 03 and 04.

How this log relates to the other logs:

- Decisions closed in 04 ([../number-restrictions/decisions.md](../number-restrictions/decisions.md)) and 03 ([../trainee-restrictions/decisions.md](../trainee-restrictions/decisions.md)) are **not re-decided**. Section V lists each one that touches this query. Later text cites them by their ids (D-n, B-n, A-n, P-n, G-n, I-n, C-n, Q-n; T-n, TI-n).
- What is new here gets its own ids: **L-n** for decisions, **LI-n** for implementation notes, **LQ-n** for open items, **LC-n** for client changes.
- The sibling logs of the same session: [../devices/decisions.md](../devices/decisions.md) (E-n) and [../lookups/decisions.md](../lookups/decisions.md) (K-n).

Status values as in 04: **Closed** (decided by the owner), **Adopted** (proposed by the analysis, accepted unless objected), **Open**.

Dates: investigation and two review rounds on 2026-11-10 (answers inline in the planning file, then in the dialog); phases 2 and 3 written the same day in sequence by the owner's instruction ("תייצר את כל השלבים, אחד אחרי השני").

---

## L – decisions

| ID | Topic | Tables | Decision | Status |
|---|---|---|---|---|
| L-1 | Which trainees, and how the two lists filter | `ODSINTERNALDATA..TRAINEE_SNAPSHOT`, `ODSINTERNALDATA..MAIN_WINGS_TABLE` | The snapshot holds several rows per trainee and **exactly one with `LOGI_ACTIVE = 1`**, the current placement; a trainee who left the network has no active row (owner). The list returns the active rows whose **institute is in `@IDNT_INSTITUTION_LIST` or whose wing is in `@IDNT_WINGS_LIST`** – the semantics and the `#ReqInstitutions` / `#ReqWings` block of `SP_AVIV_GET_LOCATIONS` (a wing whose institute is already requested is dropped through `MAIN_WINGS_TABLE`). A trainee matches a wing on `TRAINEE_SNAPSHOT.IDNT_WING` only; the virtual wing `99999` has no meaning for trainees and matches nothing. No status or leave-date column is read. | Closed |
| L-2 | Wing and location names | `MAIN_WINGS_TABLE`, `ODSINTERNALDATA..A_LOCATION` | Wing: `LEFT JOIN MAIN_WINGS_TABLE` on `IDNT_WING`, name `TEXT_WING_NAME` (assumed, LQ-1). Location: `LEFT JOIN A_LOCATION` on `IDNT_LOCATION_TRAINEE = TRAINEE_SNAPSHOT.IDNT_LOCATION` (assumed, LQ-1), name `TEXT_NAME_LOCATION`; null location → null in the DTO. Both `ISNULL(name, N'')` like every label join (I-15, C-8). The location ids must be the ones `GetLocationsAndVirtualLocations` returns, because the client's location filter compares them (LQ-2). | Closed |
| L-3 | "מוגבל עד" and the two 03 flags | `AVIV_TRAINEE_RESTRICTION` | From the rows active today (`LOGI_ACTIVE = 1`, `CAST(DATE_RESTRICTION_START AS DATE) <= @Today`, `CAST(DATE_RESTRICTION_END AS DATE) >= @Today` – P-10, A-8): `DateRestrictedUntil = MAX(DATE_RESTRICTION_END)` (two overlapping restrictions → the later date, B-1, OQ-03), `HasActiveFullRestriction` = any row with `NUMB_DURATION_LIMIT IS NULL` (T-2), `HasActiveMinutesRestriction` = any row with a value. Computed in the procedure, one `GROUP BY` step (I-19). | Closed |
| L-4 | The two 04 flags | `AVIV_TRAINEE_RESTRICTION_NUMBER`, `AVIV_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | `HasActivePhoneRestriction`: **trainee-scope restrictions only** – an active `AVIV_TRAINEE_RESTRICTION_NUMBER` row of the trainee whose `AVIV_RESTRICTION_NUMBER` parent is active and inside its dates today (D-11). A general or institute restriction that applies to the trainee does not light the flag (owner: the flag means "this trainee has a number restriction of their own"). `HasActivePhonePermit`: an `AVIV_PERMITS_FOR_RESTRICTION` row with `CODE_RESTRICTION_TYPE = 2`, `LOGI_RESTRICTION_INLINE_PERMIT = 0`, `LOGI_ACTIVE = 1` and `DATE_PERMIT_START/END` around today – **by the permit's own dates**, without re-checking the source restriction (OQ-11 stays open; the same reading the 04 history uses for `IsEnded`). | Closed |
| L-5 | The two 05 flags | `AVIV_TRAINEE_MESSAGE` | The table exists and holds rows (owner): `IDNT_TRAINEE`, `DATE_MESSAGE_END`, `LOGI_INTERACTIVE_MESSAGE` confirmed; `DATE_MESSAGE_START` and `LOGI_ACTIVE` assumed (LQ-1). Active today by the same rule; `HasActiveInteractiveMessage` = any active row with `LOGI_INTERACTIVE_MESSAGE = 1` ("הודעה חוזרת", `repeatDuringCall`), `HasActiveMessage` = any active row with 0. Feature 05's own three operations stay outside this scope. | Closed |
| L-6 | Cellcom: minutes, balance, discrepancy | – | Not in the database and not prioritized yet (owner: it should be a live call, like option b of the planning file, "but not now"). The procedure returns nothing about minutes. The service defines **`ICellcomBalanceProvider`** (`GetBalancesAsync(traineeIds)` → dictionary by trainee of `CellcomTraineeBalance(NumbRemainingMinutes, HasCellcomDiscrepancy)`) with one registered implementation, **`CellcomBalanceStandIn`**, that returns an empty dictionary. The assembler fills 0 / false for a trainee without an entry and derives `HasBalance = NumbRemainingMinutes > 0` (the client filters on it). The real implementation replaces the stand-in in one DI line (LQ-5). Consequence for the client until then: the balance filter "יש יתרה" shows nobody – honest, not a fake. | Closed |
| L-7 | Shape of the response: flat or nested | – | **Nested.** The procedure returns one flat row per trainee (`TraineeRow`); `TraineesAssembler` builds `TraineeDto` with `Wing` / `Location` as `LookupItemDto` (null location = one null) and `Flags` as `TraineeFlagsDto`; the response is the bare list of them (L-15). Considerations (planning file §4ב.2): flat saves one class and ~20 lines and keeps the column → field trace trivial, but ties id / name pairs only by naming, needs two nullable fields for "no location", and has to be filled in two steps anyway because the Cellcom data comes from C#; nested is the Rows → Assembler → DTO pattern of 03 / 04, gives the pairs a type, groups the flags the client filters on, and gives the Cellcom merge a home. The owner chose nested. | Closed |
| L-8 | The trainee photo | – | **The browser calls the external photo API directly**: `<img src>` built in the client from a base URL in its config and the trainee id; no server code (the alternative, a proxy action streaming the image through the service, is needed only if the browser cannot reach the API or a server credential is required – not the case per the owner). The client already renders the URL in `TraineePhoto.tsx` and falls back to a placeholder on error; only the base changes when the address is known (LQ-4, LC-3). | Closed |
| L-9 | Request contract and what it does not carry | – | `TraineeRequestDto(int[] IdntInstitutionList, int[] IdntWingList)` – DB-style names (A-7, C-7). Check (L-15): **at least one list non-empty**, otherwise `400` from the controller; `null` lists and duplicates are normalized by `ProcedureParameters.AddIdList`; an unknown id matches nothing. No `clientIds` (the service does not require `ClientObject` on these queries – owner). No permission check (D-17 verified: `GetInstitutionsAndWings` already filters the institutes a user may see, and the list trusts the client to ask only for those). | Closed |
| L-10 | Test data without writing the ODS | all | The trainees are ODS rows this repository never inserts. `00-test-data.sql` takes `@TestInstitutionId` and `@TestTraineeId` (a real trainee of the development environment, set by hand at the top), inserts **for that trainee** one 03 restriction, one 04 restriction (parent + trainee row + phone number), one 04 permit and one 05 message – all stamped with a sentinel `LAST_REQUEST_UID` – runs the query before and after, and removes exactly the rows carrying the stamp. Nothing else of the real trainee is touched; nothing in `ODSINTERNALDATA` is written. | Closed |
| L-11 | Names | – | Procedure `SP_AVIV_GET_TRAINEES` (A-15: the vocabulary of `TRAINEE_SNAPSHOT`); controller `TraineesController`, route `api/Trainees`, action `GetTrainees` – the client's path in `serviceEndpoints.ts` as it is (A-7). Parameters `@IDNT_INSTITUTION_LIST`, `@IDNT_WINGS_LIST` – the names of `SP_AVIV_GET_LOCATIONS`, so the two procedures that share the input block read the same. | Closed |
| L-12 | Fields dropped from the client contract | – | `firstName`, `lastName` (the card shows `fullName`, which the procedure composes), `lastActivityDate` (OQ-07: not shown, not a sort key) are not returned (I-20). The personal number travels as the numeric column it is (`NumbPersonalNumber`); the client formats it for display (LC-1, LQ-3). | Closed |
| L-13 | Order of the result | – | `ORDER BY TextFullName` in the procedure – deterministic grids in SSMS and a sensible default; the client keeps its own sort and search (B-5). | Adopted |
| L-15 | **Reads follow the shape of `reference/service` (Locations), not the save machinery of 03 / 04** – the owner's review of the written code, 2026-11-10 | – | The controller checks the input in one line and returns `BadRequest("Invalid request values.")`, wraps the call in `try/catch` and returns `500` with a plain-text body and one log line, and returns **the list itself** (a bare JSON array) – exactly `LocationsController` / `LocationsRepository`. No validator class, no `…RequestFields` constants, no `ApiActionRunner`, no response wrapper class: those exist for the saves of 03 / 04, where the procedures throw business errors and the client maps 400 field names (A-2, A-13, C-4); a read procedure throws nothing and the client never sends a field a user typed. Models: the request record, the response classes and the row in **one file per domain** (`Models/Trainees/TraineeDto.cs`), like `WingDto.cs`; the orchestrator and the assembler stay only where there is work (here: the Cellcom merge and the nesting). The repository does not catch (A-6, confirmed by the owner): a failure is a 500, not an empty list. **Recorded difference:** the 03 / 04 histories keep their wrapped responses (`{ records }`, `{ results }`) and the saves `{ createdIds }`; the reads of this session (trainees, devices, lookups) return bare arrays like `GetLocationsAndVirtualLocations` – the owner chose this over changing 03 / 04 (option א of the planning file). The first version (validator + constants + three model files + runner) was written and removed the same day. | Closed |
| L-14 | Readability of the procedure (the owner's emphasis) | – | A sequence of numbered steps, each under its own Hebrew section header and filling one temp table named for what it holds (`#Trainees`, `#TraineeRestrictionFlags`, `#PhoneFlags`, `#MessageFlags`); the final `SELECT` only joins. No nested sub-queries, no `OUTER APPLY` with logic, no `CASE` that hides a rule. "Active today" is written out in each step with that table's own date columns (A-3). The same rule applies to `SP_AVIV_GET_DEVICES` and `SP_AVIV_GET_DECODE`. | Closed |

## LI – implementation notes (phase 3)

Decisions the implementation had to take where the phase-2 document left room. Code comments refer to them by ID.

| ID | Decision | Why |
|---|---|---|
| LI-1 | The full name is `LTRIM(RTRIM(ISNULL(first, N'') + N' ' + ISNULL(last, N'')))`, so a missing part does not leave a stray space. | The ODS may hold a NULL name part; the card shows the string as is. |
| LI-2 | The six flags are returned as `BIT` through `CAST(ISNULL(FLAGS.Column, 0) AS BIT)`; the flag tables hold `BIT` columns filled by `MAX(CASE …)` as `INT`. | Dapper maps `BIT` to `bool`; `MAX` does not accept `BIT`, so the aggregation works on 0 / 1 integers and the cast happens once, in the result. |
| LI-3 | `#PhoneFlags` is filled in two statements – `INSERT` for the restriction flag, then `MERGE`-free `INSERT … WHERE NOT EXISTS` + `UPDATE` for the permit flag – instead of one query with two `EXISTS`. | L-14: each rule in its own statement with its own comment; a trainee may have one flag without the other. |
| LI-4 | `CellcomBalanceStandIn` is registered as a singleton; `ICellcomBalanceProvider.GetBalancesAsync` is `async`-less and returns `Task.FromResult` of an empty dictionary. | Stateless, no I/O; the real implementation will be scoped with an `HttpClient`. |
| LI-5 | The test script does not call the 03 / 04 save procedures to create its rows; it inserts them directly, as the 03 / 04 test scripts do. | The save procedures need a file path, an approver and a request GUID and would add `AVIV_FILE` rows; direct inserts keep the script short and the cleanup exact (by the sentinel stamp). |

## V – decisions of 03 and 04 verified for the trainees list

| id | Short form | Here | Note |
|---|---|---|---|
| D-2, D-3 | Conditions row vs user permit (`LOGI_RESTRICTION_INLINE_PERMIT`) | Verified | The permit flag reads flag-0 rows of type 2 only (L-4) |
| D-10 | `DECODE` codes: type 1 trainee, 2 number | Verified | `@RestrictionTypeNumber INT = 2` declared, not read from `AVIV_DECODE` (K-7) |
| D-11 | One active trainee row per trainee-scope restriction | Verified | The restriction flag goes through `AVIV_TRAINEE_RESTRICTION_NUMBER` (L-4) |
| D-12 | `IDNT_TRAINEE` on every Aviv table | Verified | The snapshot key is the same `IDNT_TRAINEE` (owner) |
| D-17 | No permission check in the service | Verified | L-9 |
| B-1 | Overlapping restrictions allowed | Verified | `MAX(DATE_RESTRICTION_END)` (L-3) |
| B-5 | No paging; the client sorts and searches | Verified | One list per institute; L-13 only orders by name. Response time for a large institute is LQ-6 |
| A-1 | No indexes | Verified | The flag steps join by `IDNT_TRAINEE`; performance is measured in the checklist, not pre-empted |
| A-3 | One self-contained procedure; repeated blocks under identical headers | Verified | The input block is shared with `SP_AVIV_GET_DEVICES` by copy (L-1, L-14) |
| A-4 | Several result sets assembled in the service | Not applicable | One result set; the assembler nests, it does not join (L-7) |
| A-6 | No catch in repositories | Verified | |
| A-7 | DB-style names; the controller keeps the client's paths | Verified | L-9, L-11 |
| A-8, P-10 | `datetime` columns; comparisons cast to `DATE`, end day inclusive; "today" by the server clock | Verified | The "active today" rule of L-3 / L-4 / L-5 |
| A-11, A-12, A-13 | Thin controller with the shared `RunAsync`, validator, structured error body | **Not applied to reads** (L-15) | The controller checks the input in one line and catches exceptions itself, like `LocationsController`; plain-text 400 / 500 bodies; no validator class; the assembler stays (A-4 reasoning) |
| A-14 | Save response `{ createdIds }` only; histories `{ records }` | Differs by design (L-15) | Reads return the bare list, like `GetLocationsAndVirtualLocations`; recorded difference |
| A-16 | `ConnectionStrings.ZeroThree03`, `QueryMultiple`, TVP through `ToDataTable()` | Verified | Cross-database reads (`ODSINTERNALDATA..`) run on the same connection, as `SP_AVIV_GET_LOCATIONS` does |
| G-1 … G-5 | Guidelines | Verified | L-14 restates G-1 for this procedure |
| I-4 | Validator returns a normalized copy | Not applicable (L-15) | `ProcedureParameters.AddIdList` sends a `null` list as empty and removes duplicates, as `LocationsRepository` normalizes its lists |
| I-15 | Label joins: `LEFT JOIN`, `ISNULL(name, '')` | Verified for wing and location | The device part of I-15 is amended by E-8 |
| I-18 | Nullable row properties where the DB may hold NULL | Verified | `TraineeRow` |
| I-19 | Flags from the procedure | Verified | Six flags; `HasBalance` is the one C# derivation because its input is not in the DB (L-6) |
| I-20 | Placeholder fields not returned | Verified | L-12 |
| I-21 | One controller / orchestrator / repository per domain; flat request records; a `…RequestFields` list per feature | Verified, except the field-name list | No 400 field names in a read (L-15), so no list |
| T-2 | Cap on the restriction row; NULL = full | Verified | `HasActiveFullRestriction` (L-3) |
| T-12, T-13 | Shared files; layout by layer then feature | Verified | `Models/Trainees/`, `Services/Trainees/`; the one shared change is `ProcedureParameters.AddIdList` (null and duplicates) |
| Q-3 | Server clock | Verified (shared) | |
| Q-8 | Trainees flags – deferred | **Closed by this query** | L-3, L-4 |

## C – client changes deferred

Applied in the client on 2026-11-10, in step ד of the same session (see `.agent/pending-decisions.md`).

| ID | Change | Where to start in the client |
|---|---|---|
| LC-1 | DB-style names in the record: `idntTrainee`, `numbPersonalNumber` (number; the client formats the 7-digit display string), `textFullName`, `idntInstitution`, `wing`, `location`, `dateRestrictedUntil`, `numbRemainingMinutes`, `flags.{hasActiveFullRestriction, hasActiveMinutesRestriction, hasActivePhoneRestriction, hasActivePhonePermit, hasActiveMessage, hasActiveInteractiveMessage, hasBalance, hasCellcomDiscrepancy}`; `firstName`, `lastName`, `lastActivityDate` leave the DTO (L-12). The response is a bare array (`TraineeListItemDto[]`), not `{ trainees }` (L-15) | `src/types/trainees.schema.ts`, `traineesListLogic.ts` (search, sort), `TraineeCard.tsx`, the drawer header, `traineesMockData.ts` |
| LC-2 | Request names: `idntInstitutionList`, `idntWingList` (L-9) | `trainees.schema.ts`, `traineesService.ts`, `traineesHandlers.ts` |
| LC-3 | The photo URL is built from the external API base (L-8) – when the address is known; until then unchanged | `traineePhotosService.ts`, `config/` |
| LC-4 | The mock handler and data return the new shape; the mock keeps deriving the flags from its 03 / 04 / 05 records | `src/mock-server/handlers/traineesHandlers.ts`, `traineesMockData.ts` |

## Q – open items

| ID | Question | Tables | Needed for | Status |
|---|---|---|---|---|
| LQ-1 | The assumed column names: `TRAINEE_SNAPSHOT.NUMB_PERSONAL_NUMBER`, `TEXT_FIRST_NAME`, `TEXT_LAST_NAME`, `IDNT_WING`, `IDNT_LOCATION`; `MAIN_WINGS_TABLE.TEXT_WING_NAME`; `AVIV_TRAINEE_MESSAGE.DATE_MESSAGE_START`, `LOGI_ACTIVE`. The owner chose to continue with the assumptions; the checklist (§A) runs one `sys.columns` query per table before the procedure is created, and a differing name is corrected in `SP_AVIV_GET_TRAINEES.sql` only (the `Rows` aliases do not change). | `TRAINEE_SNAPSHOT`, `MAIN_WINGS_TABLE`, `AVIV_TRAINEE_MESSAGE` | procedure | Open – checklist |
| LQ-2 | Is `TRAINEE_SNAPSHOT.IDNT_LOCATION` an `A_LOCATION.IDNT_LOCATION_TRAINEE` id (the id space `GetLocationsAndVirtualLocations` returns)? The client's location filter depends on it. A trainee placed in a *virtual* location (`AVIV_VIRTUAL_WING_DATA`) would need a second `LEFT JOIN`; not expected (the owner: "כמו שאמרת"). | `TRAINEE_SNAPSHOT`, `A_LOCATION` | location filter | Open – checklist |
| LQ-3 | Can a personal number start with 0? A numeric column drops the leading zero; the card shows 7 digits. If yes, the client pads to 7 (`padStart`) – a one-line display rule – or the column turns out to be text. | `TRAINEE_SNAPSHOT` | card display | Open – checklist |
| LQ-4 | The address of the photo API and its authentication from the browser (L-8). Until known, the client keeps its current URL (`Trainees/GetTraineePhoto` on the service, which does not exist → placeholder). | – | client | Open |
| LQ-5 | The Cellcom API: endpoint, batch shape (ids in, balances out), auth. Lands as the HTTP implementation of `ICellcomBalanceProvider` (L-6). | – | minutes, balance, discrepancy | Open – not prioritized |
| LQ-6 | Response time of `SP_AVIV_GET_TRAINEES` for the largest institute (no paging, B-5). Measured in the checklist with `SET STATISTICS TIME ON`; an index on `IDNT_TRAINEE` of the flag tables is the first remedy if needed (A-1 left indexes for later). | all | – | Open – checklist |
