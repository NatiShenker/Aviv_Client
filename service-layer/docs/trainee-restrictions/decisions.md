# Decisions log – trainee restrictions (server side, feature 03)

Feature 03, "הגבלות לחניך": a restriction of **all** calls of one trainee for a date range (table `AVIV_TRAINEE_RESTRICTION`), built right after feature 04 with the same three gated phases and deployed together with it.

How this log relates to feature 04's log ([../number-restrictions/decisions.md](../number-restrictions/decisions.md)):

- Decisions closed in 04 are **not re-decided**. Section V lists each one that touches 03 and says whether it holds as is ("verified"), holds with a 03-specific reading, or does not apply. Later phases cite them by their 04 id (D-n, B-n, A-n, P-n, G-n, I-n, C-n, Q-n).
- What is new in 03 gets its own ids: **T-n** for decisions (section T), **TQ-n** for open items (section Q), **TC-n** for client changes unique to 03 (section C).
- Shared infrastructure files under `service-layer/` (`Infrastructure/ApiException.cs`, `Infrastructure/ApiErrors.cs`, `Utils/DateTimeStrings.cs`) are reused; if one of them has to change for 03, the change is recorded here because it serves 04 too. Phase 2 added a deliberate set of shared files extracted from the 04 code (T-12) and a folder layout for both features (T-13); the 04 files these decisions touch are listed in [02-architecture.md §2.3](02-architecture.md).

Status values as in 04: **Closed** (decided by the owner), **Adopted** (proposed by the analysis, accepted unless objected), **Open**.

Dates: phase 1 review on 2026-11-09 (one round in two parts: schema topics, then contract and flow); phase 2 review on 2026-11-09 (one round in two parts: procedures and shared code, then the folder layout). Also on 2026-11-09, outside the phases: the folders were renamed by feature (`stored-procedures/number-restrictions/`, `service-layer/docs/number-restrictions/`), see T-13.

---

## T – decisions of feature 03 (phases 1 and 2)

| ID | Topic | Tables | Decision | Status |
|---|---|---|---|---|
| T-1 | `RESTRICTION_UID` (`uniqueidentifier`) | `AVIV_TRAINEE_RESTRICTION` | **Left empty for now.** The procedures never write it and the history does not return it; the client's `restrictionUid` leaves the DTO (TC-2). Reading: the column has no counterpart on `AVIV_RESTRICTION_NUMBER` and sits in the same naming family as `PHONE_NUMBER_UID`, which 04 identified as Cellcom's identifier (B-7); `LAST_REQUEST_UID` (D-19) is a different thing – one GUID per save, so it gives no lineage across versions. If the DBA says the column is ours, the change is two lines: `NEWID()` on create, copied from the previous row on update. Nullability is checked before the first run (TQ-1). | Closed |
| T-2 | Where a trainee restriction's conditions live (the D-9 hybrid, re-examined) | `AVIV_TRAINEE_RESTRICTION`, `AVIV_PERMITS_FOR_RESTRICTION`, `AVIV_PERMITS_DEVICE` | **The hybrid stays.** The call-duration cap is `AVIV_TRAINEE_RESTRICTION.NUMB_DURATION_LIMIT` (NULL = full restriction, spec 03 §2.2). Permitted hours and devices live on one inline row in `AVIV_PERMITS_FOR_RESTRICTION` (`CODE_RESTRICTION_TYPE = 1`, `LOGI_RESTRICTION_INLINE_PERMIT = 1`, `IDNT_AVIV_RESTRICTION_TABLE` = the restriction row, `IDNT_TRAINEE` = the trainee, dates copied as in I-2) plus its `AVIV_PERMITS_DEVICE` rows. **The inline row exists only when there are hours or devices**; its own `NUMB_DURATION_LIMIT` stays NULL for type 1. Considerations recorded in [01-business-analysis.md §5.2](01-business-analysis.md): spec 03 §2.1 ("dates and call duration belong to the restriction"); the DBA placed the column on `AVIV_TRAINEE_RESTRICTION` and on `AVIV_PERMITS_FOR_RESTRICTION` but not on `AVIV_RESTRICTION_NUMBER`, which is exactly this model; the trainees list (spec 01 flags and filter) reads the type from one table; the common "duration only" case is one row; a future user permit inside a trainee restriction fits as a flag-0 row of type 1 with its own cap; the only cost is documentation (T-10). The 04 reasoning of D-2 ("the parent is shared, so the duration cannot sit on it") does not apply: in 03 the restriction row is already per trainee. | Closed |
| T-3 | Free-text details ("פירוט") | `AVIV_TRAINEE_RESTRICTION` | The column **`TEXT_RESTRICTION_REASON` exists** on the table (owner, 2026-11-09); no DBA request. The DBA export of 2026-10-29 (`AVIV.xlsx`, `COLUMNS.txt`) does not list it, so the export predates the column: the real column list is re-read in SSMS before phase 3 runs (TQ-2). Same reading as D-6 (`TEXT_…_REASON` = details), `varchar` like 04 (P-9), length assumed 1000 (I-14) until TQ-2 confirms it. | Closed |
| T-4 | Approval columns vs the client's `DecisionApprovalDto` | `AVIV_TRAINEE_RESTRICTION`, `AVIV_FILE` | `approver.id` ← `IDNT_USER_APPROVAL` (name empty, Q-1); `approvedFile` ← `IDNT_APPROVED_FILE` → `AVIV_FILE.TEXT_FILE`, name derived from the path (D-13); `details` ← `TEXT_RESTRICTION_REASON` (T-3); `reason` not stored (D-7). The inline row and the device rows keep their approval columns NULL (P-3). No further column is needed. | Closed |
| T-5 | `CODE_RESTRICTION` | `AVIV_TRAINEE_RESTRICTION` | Not stored (D-8). The column is `int NULL` (owner, 2026-11-09), so the procedures simply do not write it. The product question behind it – the form requires a reason that the server drops – is 04's Q-12 and applies to 03 as well (TQ-3, belongs in `.agent/pending-decisions.md`). | Closed |
| T-6 | What the history returns, and whether 03 needs another query | `AVIV_TRAINEE_RESTRICTION`, `AVIV_PERMITS_FOR_RESTRICTION`, `AVIV_PERMITS_DEVICE`, `AVIV_FILE` | All `LOGI_ACTIVE = 1` restrictions of the requested trainees (B-5), active and ended, with the procedure flags `IsEnded` (I-19) and `ConditionsRowId` (the inline row's id, NULL when there is none). **Two result sets**: 1 restrictions (restriction row + inline row + file path), 2 devices keyed by `ConditionsRowId`. No `IsPermit` (one kind of record), no institutes, no scope. **No further query**: 03 is three actions and three procedures (history, create, update). The devices list for the form is `Devices/GetInstituteDevices` (Q-7, deferred, outside this scope); the reasons list is not built (D-7). The trainees-list flags stay in Q-8 (deferred). | Closed |
| T-7 | The update rule of a trainee restriction | `AVIV_TRAINEE_RESTRICTION`, `AVIV_PERMITS_FOR_RESTRICTION`, `AVIV_PERMITS_DEVICE`, `AVIV_FILE` | One transaction with `SET XACT_ABORT ON`: (1) read the previous row's `IDNT_TRAINEE`; (2) **claim** the previous row – `UPDATE … SET LOGI_ACTIVE = 0` + audit columns `WHERE IDNT_AVIV_TRAINEE_RESTRICTION = @IDNT_PREVIOUS AND LOGI_ACTIVE = 1 AND CAST(DATE_RESTRICTION_END AS DATE) >= @Today`, `@@ROWCOUNT = 0` → `THROW 50409, 'idntPrevious', 1` (not found, already replaced, or ended; spec 03 form §1–§2 allows editing active and future records only); (3) deactivate the previous inline row (type 1, flag 1, pointing at `@IDNT_PREVIOUS`) and its device rows (P-4); (4) insert the `AVIV_FILE` row (D-13); (5) insert the new restriction row – trainee from the previous row, dates, duration, details, approver, file; (6) when the request has hours or devices, insert the inline row (dates copied, I-2) and its devices with `DISTINCT` (A-1); (7) **no re-pointing** – nothing points at a trainee restriction except its own inline row, which is re-created; (8) `SELECT @NewId AS CreatedId`. Simpler than 04 §9: one table to claim, no parent, no permits to move. The step-by-step version with parameter names is written in phase 2. | Closed |
| T-8 | Schema changes of 03 | `AVIV_TRAINEE_RESTRICTION`, `DECODE` | **One change**: `sp_rename 'dbo.AVIV_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_DATA', 'IDNT_TRAINEE', 'COLUMN'` (D-12), moved from section 8 of `stored-procedures/schema/01-proposed-schema-changes.sql` into a new script `stored-procedures/schema/02-proposed-schema-changes-trainee-restrictions.sql` (phase 3, batch 1); section 8 of the 04 script keeps a pointer only. Nothing else: the details column exists (T-3), `CODE_RESTRICTION` is nullable (T-5), `RESTRICTION_UID` is left alone (T-1), the `DECODE` value `AVIV_RESTRICTION_TYPE = 1` is already in the 04 script (D-10), no CHECK constraints and no indexes (D-18, A-1). Both scripts go to the DBA as one request. | Closed |
| T-9 | The update request carries no trainee | – | `UpdateTraineeRestrictionRequest` sends `previousRestrictionId` only; the server takes `IDNT_TRAINEE` from the row it claims (the 04 rule of D-1 for permits). A restriction can never be moved to another trainee through an update, not even by a hand-made call. Client consequence: TC-3. | Closed |
| T-10 | Note to the owner of the Cellcom job (extends P-14) | all 03 tables | Two sentences to pass on: (a) for `CODE_RESTRICTION_TYPE = 1` the duration cap is on `AVIV_TRAINEE_RESTRICTION.NUMB_DURATION_LIMIT` and the inline row (flag 1) carries hours and devices only; for type 2 the cap is on the inline row (04, D-2); (b) a trainee with a full trainee restriction (03) and a number permit (04) on the same dates – which one wins is an interpretation on the side that talks to the devices, not something Aviv stores. | Adopted |
| T-11 | Create procedure: loop or set-based | `AVIV_TRAINEE_RESTRICTION`, `AVIV_PERMITS_FOR_RESTRICTION` | Differs from I-1: in 04 the parent row carried nothing that identified its trainee × number pair, which forced a loop. `AVIV_TRAINEE_RESTRICTION` carries `IDNT_TRAINEE`, so `INSERT … OUTPUT INSERTED.IDNT_AVIV_TRAINEE_RESTRICTION, INSERTED.IDNT_TRAINEE INTO #Created` maps each new row to its trainee, and the inline rows can follow set-based with their own `OUTPUT` (`IDNT_AVIV_RESTRICTION_TABLE` is on the row). **Phase 2 (2026-11-09): set-based.** Three `INSERT … OUTPUT INTO` statements (restrictions, inline rows, devices by `CROSS JOIN`), about 40 lines without the ~15 lines of loop plumbing; the idiom is the one 04 already uses to create permits. The loop was weighed for its sameness with 04's create-restriction and rejected for the plumbing. [02-architecture.md §10](02-architecture.md). | Closed |
| T-12 | Code shared between 03 and 04 | – | **Extracted into feature-neutral files, named by what they hold** (option C of the phase-2 review; the alternatives were B "touch nothing in 04, duplicate ~130 lines per feature" and A "extract the field-name constants too"). What moves: the `RunAsync` error translation of the controller (25 lines) → `Infrastructure/ApiActionRunner.cs`; `GetActingUserId()` (10) → `Infrastructure/ActingUserId.cs`; the private input rules of the validator (~90, including the time-window rule and the duration range) → `Services/RequestRules.cs`, pure functions that take the field name as a parameter; the Dapper parameter helpers of the repository (~45) → `Repository/ProcedureParameters.cs`; the D-13 file-name rule and the file-path length → `Utils/FilePaths.cs`; the DTOs and rows both features return, which cannot be duplicated in one namespace (`LookupItemDto`, `ApproverDto` + `FileDto`, `MutationResultDto`, `DeviceRow`, `CreatedIdRow`) → one file per concept in `Models/`. Each feature keeps its own `…RequestFields` list (I-21) and its own `DetailsMaxLength` (per table, I-14). Why: the rules that must stay identical across features – the error body, the input rules, the file name – otherwise exist twice from the first deployment and three times with 05; both features are deployed together and nothing is deployed yet, so the moves are cheapest now; in C# a static class is the native reuse mechanism (G-4), unlike SQL where A-3 had to accept copies. Cost: every 04 C# file except `Infrastructure/` and `Utils/DateTimeStrings.cs` is edited mechanically (moves, removed members, `using` lines, no logic) and re-delivered in phase 3 batch 3; the 04 checklist §F.1 / §F.2 are amended. The owner rejected the first name `Models/SharedRecordModels.cs` as saying nothing: shared files carry no "Shared" / "Common" prefix, their name is the concept. | Closed |
| T-13 | Folder layout of `service-layer/` | – | **Layer first, then feature, in `Models/` and `Services/` only**: the shared files at the folder root, one sub-folder per feature (`Models/PhoneExceptions/`, `Models/TraineeRestrictions/`, `Services/PhoneExceptions/`, `Services/TraineeRestrictions/`), and the namespace follows the folder (`Aviv_Service.Models.TraineeRestrictions`, …) so that a file added later in Visual Studio lands in the same namespace as its neighbours. `Controllers/`, `Interfaces/`, `Repository/`, `Infrastructure/` stay flat (one or two files per feature, the file name says the feature); **`Utils/` stays flat by the owner's decision** (2026-11-09) although it has the same mix – its files are small and few. The real service's existing files (`Models/LocationDto.cs`, `WingDto.cs`, the Locations layers) are outside this scope and are not moved. The same rule gave the repository folders their names: `stored-procedures/<feature>/` and `service-layer/docs/<feature>/` follow the client's feature folders (`number-restrictions`, `trainee-restrictions`), not the controller name (`PhoneExceptions`), which stays for file and class names as the client itself does (`phone-exceptions.schema.ts` next to `features/number-restrictions`). Amends I-16 ("flat layout") by one nesting level; the rest of I-16 holds. | Closed |
| T-14 | Procedure and action names | – | `SP_AVIV_GET_TRAINEE_RESTRICTIONS`, `SP_AVIV_CREATE_TRAINEE_RESTRICTION`, `SP_AVIV_UPDATE_TRAINEE_RESTRICTION` (A-15: the tables' vocabulary; the table is `AVIV_TRAINEE_RESTRICTION`). Controller `TraineeRestrictionsController`, route `api/TraineeRestrictions`, actions `GetTraineeRestrictions`, `CreateTraineeRestriction`, `UpdateTraineeRestriction` – the client's paths in `serviceEndpoints.ts` as they are (A-7). | Closed |
| T-15 | Test-data id series of 03 | – | Trainees `998001` (the scenario) and `998002` (empty history, bulk create); devices `999001` / `999002`, approver `999001`, acting user `999999` as in 04. The 03 test script cleans by these trainee ids (every `AVIV_TRAINEE_RESTRICTION` row of theirs, its inline rows, devices and files); the 04 script cleans by its phone-number series, so the two scripts never touch each other's rows and can run in any order. | Closed |

## V – decisions of 04 verified for 03

| 04 id | Short form | In 03 | Note |
|---|---|---|---|
| D-1 | Update = new row, `LOGI_ACTIVE = 0` on the old one, active permits re-pointed | Verified, **without re-pointing** | Spec 03 has no user permits; the only row that points at a trainee restriction is its inline row, which is re-created (T-7) |
| D-2, D-3, D-4 | Conditions as an inline row with `LOGI_RESTRICTION_INLINE_PERMIT = 1`; permits point at the parent | Verified with `CODE_RESTRICTION_TYPE = 1` and `IDNT_AVIV_RESTRICTION_TABLE` → `AVIV_TRAINEE_RESTRICTION` | The DBA's TABLE_NAMES lists `AVIV_PERMITS_FOR_RESTRICTION` as a child of `AVIV_TRAINEE_RESTRICTION` too. Duration is the exception – T-2 |
| D-5, D-11 | Scope code; 1:1 parent ↔ trainee link | Not applicable | 03 has no scope and no parent / child split |
| D-6 | `TEXT_…_REASON` holds the details | Verified | `AVIV_TRAINEE_RESTRICTION.TEXT_RESTRICTION_REASON` exists (T-3) |
| D-7 | Reason from the list not stored; no reasons lookup | Verified | `Lookups/GetTraineeRestrictionReasons` is not built (C-2); Q-12 applies (TQ-3) |
| D-8 | `CODE_RESTRICTION` not stored | Verified | The column is `int NULL` (T-5); `restrictionCode` leaves the client DTO (TC-1) |
| D-9 | 03 keeps the hybrid | Re-examined and **kept** | T-2 |
| D-10 | `DECODE` sets | Verified | Value 1 of `AVIV_RESTRICTION_TYPE` is 03's; already in the 04 script |
| D-12 | `IDNT_AVIV_TRAINEE_DATA` → `IDNT_TRAINEE` | Verified | The `sp_rename` moves to the 03 script (T-8) |
| D-13 | File path in the request, `AVIV_FILE` row written by the procedure | Verified | One file row per save |
| D-14, D-15 | Acting user from `ICurrentUserService`; no `IDNT_USER_CREATE` | Verified | |
| D-16 | Cancellation out of scope | Verified | Spec 03 §2.4, OQ-02 |
| D-17 | Permissions out of scope | Verified | |
| D-18 | Structural validation in the service, cross-row checks in the procedure, no CHECK | Verified | Procedure checks of 03: required trainee list (I-12), the claim (T-7). The rest in the validator |
| D-19 | `LAST_REQUEST_UID` stamped per save; `syncStatus` / `requestUid` not returned | Verified | Independent of `RESTRICTION_UID` (T-1) |
| B-1 | Duplicates and overlaps allowed | Verified | Two overlapping trainee restrictions are allowed; the trainees list shows the later end date (`restrictedUntilDate`) |
| B-2, B-3, B-4 | Permits: overlaps, ended restriction, institute from the client | Not applicable | No permits, no institute in 03 |
| B-5 | History = all `LOGI_ACTIVE = 1` rows, no paging | Verified | Spec 03 history §6: the client sorts and searches |
| B-6, B-7 | `CODE_SOURCE_RECORD_TYPE`, `PHONE_NUMBER_UID` left to others | Not applicable; same spirit as T-1 | |
| A-1 | No indexes; device duplicates removed with `DISTINCT` | Verified | |
| A-2 | 400 / 409 through `THROW 50400 / 50409, '<field>'`; `SqlErrorMapper` | Verified | Same `Infrastructure/ApiErrors.cs` |
| A-3 | One self-contained procedure per operation, no procedure calls a procedure | Verified | Three procedures (T-6) |
| A-4 | Several result sets assembled in the service | Verified | Two sets (T-6); the 03 assembler is its own class |
| A-5 | Scope wording | Not applicable | |
| A-6 | No catch in repositories | Verified | |
| A-7 | DB-style field names in the server DTOs; the controller route keeps the client's paths | Verified | `api/TraineeRestrictions/<Action>` with the client's action names |
| A-8 | `datetime` columns; strings `yyyy-MM-dd` / `HH:mm`; comparisons cast to `DATE` | Verified | Same `Utils/DateTimeStrings.cs` |
| A-9, A-10 | Phone list as `VARCHAR(500)`; explicit sizes, no MAX | A-9 not applicable; A-10 verified | No phone numbers in 03 |
| A-11, A-12, A-13, A-14 | Thin controller with shared `RunAsync`, validator, assembler; error body; `createdIds` only | Verified | `RunAsync` is now the shared `ApiActionRunner` (T-12), used by both controllers |
| A-15 | Procedure names speak the tables' vocabulary | Verified | T-14 |
| A-16 | `ConnectionStrings.ZeroThree03`, `IDataAccess.QueryMultiple` for every call, TVP through `ToDataTable()` | Verified | |
| P-3 | Approval columns NULL on rows that are not a user-visible record | Verified | Inline row and device rows |
| P-4 | Child rows deactivated with their parent | Verified | T-7 step 3 |
| P-6 | `IDNT_INSTITUTE` / `IDNT_LOCATION` NULL on permit rows | Verified | On the inline row |
| P-9 | Free text stays `varchar` | Verified | `TEXT_RESTRICTION_REASON` of 03 |
| P-10 | "Today" = `CAST(GETDATE() AS DATE)` | Verified | |
| P-11 | Shortening a restriction below its permits | Not applicable | |
| P-12 | Bulk create in one call, one record per trainee | Verified | `IdntTraineeList`; one `AVIV_TRAINEE_RESTRICTION` row per trainee |
| P-14 | Note to the Cellcom job owner | Verified and extended | T-10 |
| G-1 … G-5 | Guidelines | Verified | Apply as written |
| I-1 | Loop in the create procedure | **Differs** | Set-based in 03 (T-11): the row carries the trainee, so `OUTPUT` returns the mapping |
| I-2 | Inline row copies the restriction's dates | Verified | |
| I-3 | Permit on a trainee-scope restriction | Not applicable | |
| I-4, I-5, I-6, I-7 | Validator returns a normalized copy; `DateTimeStrings`; `Microsoft.Data.SqlClient`; `ICurrentUserService` member isolated | Verified | Same adaptation points as 04's checklist §F.2; the `ICurrentUserService` member now lives in one place for both features, `Infrastructure/ActingUserId.cs` (T-12) |
| I-8 | Approver name empty | Verified | |
| I-9 | Audit columns of a record come from the parent row | Verified, trivially | One row holds everything |
| I-11 | Primary keys assumed `IDENTITY` | Verified | `IDNT_AVIV_TRAINEE_RESTRICTION` to confirm in the checklist |
| I-12 | Required-field checks in the save procedures | Verified | Empty trainee list → 400 `idntTraineeList` |
| I-13 | `sp_getapplock` around the phone-number get-or-create | Not applicable | No dictionary table in 03 |
| I-14 | Details length assumed 1000 | Verified | TQ-2 confirms the real length |
| I-15 | Device names joined from `AVIV_DEVICE_DATA`, `LEFT JOIN`, `ISNULL(name, '')` | Verified | Same join, same columns to confirm (Q-9) |
| I-16 | Flat C# layout, one namespace per folder, `partial StoredProcedures` | **Amended** | One nesting level by feature in `Models/` and `Services/`, namespace following the folder (T-13); the shared code is extracted, not duplicated (T-12); everything else in I-16 holds (no inheritance, no nested classes, file-scoped namespaces, primary constructors, `partial StoredProcedures`) |
| I-17 | Phone-number list length | Not applicable | |
| I-18 | Timestamps `yyyy-MM-ddTHH:mm:ss`; nullable audit columns in the `Rows` | Verified | |
| I-19 | Flags come from the procedure (`IsEnded`, `ConditionsRowId`) | Verified | No `IsPermit` in 03 (T-6) |
| I-20 | Placeholder fields not returned | Verified | Plus `restrictionCode`, `restrictionUid` (TC-1, TC-2) |
| I-21 | Batch-3 design review outcomes kept | Verified, with one reading | Each feature keeps its own `…RequestFields` list, as I-21 asks; the shared `RequestRules` take the field name as a parameter so that no shared list of names is needed (T-12). The other I-21 outcomes (one controller / orchestrator / repository per domain, flat request records, `TraineeId` non-nullable) stand |
| Q-1, Q-9, Q-10 | Approver name mocked; device and institute names | Q-1, Q-9 verified; Q-10 not applicable | No institutes in 03 |
| Q-3, Q-4, Q-6, Q-13 | Server clock, RCSI, job expectations, temp-table collation | Q-3, Q-4, Q-6 verified (shared environment); Q-13 not applicable | No `VARCHAR` temp tables in 03 |
| Q-11 | Who else writes the tables | Verified in spirit | TQ-4 |
| Q-12 | The form requires a reason the server drops | Verified | TQ-3 |

## C – client changes deferred

The client is adapted later, in a separate session, from this list. "Shared with 04" names the 04 item that already describes the change; the 03 column says where it lands in 03. Items unique to 03 carry TC ids.

| ID | Change in 03 | Shared with 04 | Where to start in the client |
|---|---|---|---|
| C-1 | Save requests send `TextFile` (+ `TextFileName`) instead of `approvedFileId`; the file-registration step goes away | C-1 | `src/services/traineeRestrictionsService.ts`, `src/features/trainee-restrictions/form/useTraineeRestrictionForm.ts`, the approval-file field |
| C-2 | `reason` / `reasonCode` are not stored and not returned; `Lookups/GetTraineeRestrictionReasons` is not built; "סיבה" on the card stays "לא צוין" and "create similar" has no reason to match | C-2 | `src/types/trainee-restrictions.schema.ts`, `src/types/common.schema.ts`, `src/config/serviceEndpoints.ts` (`lookups.getTraineeRestrictionReasons`), `src/services/reasonsService.ts`, the form's reason field |
| C-4 | 400 carries field names only; the slot map of spec 03 form §6.3 uses the **server** names: `idntTraineeList`, `dateRestrictionStart`, `dateRestrictionEnd`, `numbDurationLimit`, `timePermitStart`, `timePermitEnd`, `idntDeviceList`, `textRestrictionReason`, `idntUserApproval`, `textFile`, `idntPrevious` | C-4 | `src/features/trainee-restrictions/form/traineeRestrictionFormLogic.ts` |
| C-7 | DB-style names in requests and responses: `IdntTraineeList`, `IdntPrevious`, `DateRestrictionStart` / `End`, `NumbDurationLimit`, `TimePermitStart` / `End`, `IdntDeviceList`, `TextRestrictionReason`, `IdntUserApproval`, `TextFile` (+ `TextFileName`); response `Id`, `IdntTrainee`, `DateStart` / `DateEnd`, `IsEnded`, `NumbDurationLimit`, `TimePermitStart` / `End`, `Devices`, `TextReason`, `Approver`, `ApprovedFile`, `DateCreated` / `DateUpdated` / `IdntUserUpdate` (final, [02-architecture.md §7](02-architecture.md)) | C-7 | `src/types/trainee-restrictions.schema.ts`, `traineeRestrictionsService.ts`, `src/mock-server/handlers/traineeRestrictionsHandlers.ts`, `src/mock-server/data/traineeRestrictionsMockData.ts` |
| C-8 | `approver.fullName` / `roleTitle` empty (Q-1); device names empty when the lookup row is missing | C-8 | card and form summary components of `src/features/trainee-restrictions/` |
| C-11 | `isEnded` instead of `temporalStatus` in the shared `AuditMetadataDto` | C-11 | `src/types/common.schema.ts`, `recordStatus.ts`, the 03 mock builders |
| C-12 | `isActive`, `syncStatus` (record) and `requestUid`, `syncStatus` (mutation result) are not returned; `createdIds` only | C-12 | `src/types/common.schema.ts`, `traineeRestrictionsHandlers.ts` |
| TC-1 | `restrictionCode` leaves `TraineeRestrictionRecordDto` (D-8, T-5) | – | `src/types/trainee-restrictions.schema.ts`, `traineeRestrictionsMockData.ts`, `traineeRestrictionsHandlers.ts` (`PLACEHOLDER_RESTRICTION_CODE`) |
| TC-2 | `restrictionUid` leaves `TraineeRestrictionRecordDto` (T-1) | – | same files (`RESTRICTION_UID_PREFIX`) |
| TC-3 | `traineeId` leaves `UpdateTraineeRestrictionRequest`; the server takes the trainee from the previous row (T-9) | – | `src/types/trainee-restrictions.schema.ts`, `useTraineeRestrictionForm.ts`, `traineeRestrictionsHandlers.ts` |

### Combined summary – all client changes of 03 + 04

Final at the end of phase 2 (2026-11-09): the one list the future client session works from. The details of each 04 item are in [../number-restrictions/decisions.md section C](../number-restrictions/decisions.md) and its checklist §G.1; the details of each 03 item are in the table above.

| 04 id | Applies to | 03-only ids |
|---|---|---|
| C-1 file path instead of file id | 03, 04 | |
| C-2 reason not stored, no reasons endpoints | 03, 04 | |
| C-3 `syncStatus` / `requestUid` comments | 04 (`common.schema.ts`, shared) | |
| C-4 400 with server field names | 03, 04 | |
| C-5 comment fix on the permit DTO | 04 | |
| C-6 `IdntInstitution` in create-permit | 04 | |
| C-7 DB-style names | 03, 04 | |
| C-8 empty names, mocked approver | 03, 04 | |
| C-9 `codeRestrictionScope` + institutes | 04 | |
| C-10 `isPermit` instead of `type` | 04 | |
| C-11 `isEnded` instead of `temporalStatus` | 03, 04, 05 (shared `AuditMetadataDto`) | |
| C-12 placeholder fields not returned | 03, 04 | |
| | 03 | TC-1 `restrictionCode`, TC-2 `restrictionUid`, TC-3 `traineeId` in update |

## Q – open items of 03

| ID | Question | Tables | Needed for | Status |
|---|---|---|---|---|
| TQ-1 | Is `RESTRICTION_UID` nullable? The procedures leave it empty (T-1); a `NOT NULL` column without a default would fail every insert. Checked with one `sys.columns` query in the checklist, before the procedures are created. If `NOT NULL`: ask the DBA who owns the column, then either a default or the two-line "ours" variant of T-1. | `AVIV_TRAINEE_RESTRICTION` | create and update | Open – checklist |
| TQ-2 | The real column list of `AVIV_TRAINEE_RESTRICTION`. The DBA export of 2026-10-29 lacks `TEXT_RESTRICTION_REASON`, which exists (T-3), so other columns may have changed too. Re-run the query in `COLUMNS.txt` in SSMS before phase 3 runs, compare with [01-business-analysis.md §2](01-business-analysis.md), and record the length and collation of `TEXT_RESTRICTION_REASON` (I-14, Q-2). | `AVIV_TRAINEE_RESTRICTION` | procedures, validator limit | Open – checklist |
| TQ-3 | Q-12 for 03: spec 03 form §5 requires a reason from the closed list (decided 2026-10-19), the server does not store it (D-7, T-5). Either `CODE_RESTRICTION` starts holding the reason's code and `Lookups/GetTraineeRestrictionReasons` comes back, or the field leaves the form. **Belongs in `.agent/pending-decisions.md`** (the owner moves it). | `AVIV_TRAINEE_RESTRICTION` | product decision | Open |
| TQ-4 | Who else writes `AVIV_TRAINEE_RESTRICTION` and its inline rows (Q-11 analog)? Pre-existing rows, if any, must follow the same reading: duration on the restriction row, inline row with flag 1 for hours and devices, `LOGI_ACTIVE` for soft delete. Note: the 04 DDL gives every pre-existing `AVIV_PERMITS_FOR_RESTRICTION` row the flag 0, so a pre-existing hours row of a trainee restriction would be read as a user permit and ignored by the 03 history (which reads flag 1 only). Checked with the owner of those rows when the DDL is applied (04 checklist §B.4). | `AVIV_TRAINEE_RESTRICTION`, `AVIV_PERMITS_FOR_RESTRICTION` | history | Open |
| TQ-5 | Pass T-10 to the owner of the Cellcom job together with P-14. | all | – | Open – communication |
| TQ-6 | The real service's project settings for the moved 04 files (T-13): if the project enforces the "namespace must match folder" analyzer (IDE0130) as an error, or if `Program.cs` registers the 04 services with a fully qualified name, the moves need the matching edits. Checked at the build step of the checklist (04 §F.3) when batch 3 is carried over. | – | phase 3, batch 3 | Open – checklist |
