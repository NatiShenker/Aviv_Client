# Decisions log – number restrictions and permits (server side)

Every question raised in the reviews, with its answer. IDs are stable; later phases refer to them. Status: **Closed** (decided by the owner), **Adopted** (proposed by the analysis, accepted unless objected), **Open**, **Deferred**.

Dates: phase 1 rounds on 2026-11-04 and 2026-11-05; phase 2 rounds on 2026-11-06 and 2026-11-07.

---

## D – core model (phase 1)

| ID | Topic | Tables | Decision | Status |
|---|---|---|---|---|
| D-1 | Versioning and the permits that point at a restriction | `AVIV_RESTRICTION_NUMBER`, `AVIV_TRAINEE_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | An update inserts a new row and sets `LOGI_ACTIVE = 0` on the old one. In the same transaction the active user permits are **re-pointed** to the new parent row (`UPDATE AVIV_PERMITS_FOR_RESTRICTION SET IDNT_AVIV_RESTRICTION_TABLE = @NewId WHERE IDNT_AVIV_RESTRICTION_TABLE = @OldId AND CODE_RESTRICTION_TYPE = <number restriction> AND LOGI_RESTRICTION_INLINE_PERMIT = 0 AND LOGI_ACTIVE = 1`). Conditions: only active permits; the in-place pointer update was approved by the DBA; the rule is written identically in every procedure that creates a restriction version (see A-3); a permit update takes its restriction from the previous permit row in the DB, not from the request. No UID columns. | Closed |
| D-2 | Where a trainee's number-restriction conditions live (duration / hours / devices) | `AVIV_PERMITS_FOR_RESTRICTION`, `AVIV_PERMITS_DEVICE` | As an inline permit row pointing to `AVIV_RESTRICTION_NUMBER`, with the trainee in `IDNT_TRAINEE` and the flag of D-3. On a new restriction version the inline row is re-created; user permits are re-pointed. `NUMB_DURATION_LIMIT` is the type of the restriction or permit (NULL = full) and exists only when there is a trainee, so it is **not** added to `AVIV_RESTRICTION_NUMBER`. | Closed |
| D-3 | Name of the flag | `AVIV_PERMITS_FOR_RESTRICTION` | `LOGI_RESTRICTION_INLINE_PERMIT bit NOT NULL DEFAULT 0`: 1 = the row is the restriction's own conditions, 0 = a permit the user created. | Closed |
| D-4 | What a number permit points to | `AVIV_PERMITS_FOR_RESTRICTION` | Always the parent `AVIV_RESTRICTION_NUMBER` (`CODE_RESTRICTION_TYPE` = number restriction). The table is shared with feature 03, whose "permits inside the restriction" point to `AVIV_TRAINEE_RESTRICTION`. The DBA's "????" (pointing to `AVIV_TRAINEE_RESTRICTION_NUMBER`) is not needed. The column name `IDNT_AVIV_RESTRICTION_TABLE` stays. | Closed |
| D-5 | Scope | `AVIV_RESTRICTION_NUMBER` | New `CODE_RESTRICTION_SCOPE int NOT NULL`: 1 = **general** (one type; some general restrictions are narrowed to one or more institutes through `AVIV_INSTITUTES_RESTRICTION_NUMBER`), 2 = trainee. The client's three-valued `scope` (national / institute / trainee) is a display derivation: general without institute rows → national, with institute rows → institute. A narrowed general restriction must have at least one active institute link (procedure rule). | Closed |
| D-6 | Free-text details ("פירוט") | `AVIV_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | The `TEXT_…` columns hold the details: `TEXT_RESTRICTION_REASON` exists; add `TEXT_PERMIT_REASON` for permits. | Closed |
| D-7 | Reason from the closed list | all record tables | Not stored for now (`reason` / `reasonCode` from the client are dropped). No `Lookups/GetPhoneExceptionReasons`. Client consequence: C-2. | Closed |
| D-8 | `CODE_RESTRICTION` | `AVIV_TRAINEE_RESTRICTION` | Not stored for now. | Closed |
| D-9 | Feature 03 | `AVIV_TRAINEE_RESTRICTION` | Out of scope. The shared design (permits table, devices table, the flag) fits it; 03 keeps its hybrid (duration on the restriction row, hours/devices as an inline row). | Closed |
| D-10 | Code values | `DECODE` (`CODE_TABLE` per set) | `AVIV_RESTRICTION_TYPE` = {1 trainee restriction (`AVIV_TRAINEE_RESTRICTION`), 2 number restriction (`AVIV_RESTRICTION_NUMBER`)}; `AVIV_RESTRICTION_SCOPE` = {1 general, 2 trainee}. Values proposed; the DBA inserts the rows. The polymorphic pair stays as it is. | Closed |
| D-11 | Parent ↔ trainee link cardinality | `AVIV_RESTRICTION_NUMBER` ↔ `AVIV_TRAINEE_RESTRICTION_NUMBER` | 1:1 for trainee scope (one parent per trainee and number; spec 04 §2.4 edits each record on its own and the dates live on the parent). Guaranteed by the procedures; no unique index (A-1). | Closed |
| D-12 | Trainee key | `AVIV_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_DATA` | Everything is unified to `IDNT_TRAINEE` (DBA change in 03, outside this scope). The trainees table lives in another database; the 04 procedures do not join it – the client sends trainee ids and the institute id. | Closed |
| D-13 | Approval file | `AVIV_FILE` (`IDNT_AVIV_FILE`, `TEXT_FILE` = SharePoint path) | The client uploads to SharePoint directly. The save request carries the path; the save procedure inserts the `AVIV_FILE` row in the same transaction and uses its id (atomic, no orphan rows, one file row per version). No `Files/RegisterApprovedFile`. The display name is derived from the path's last segment (or `TEXT_FILE_NAME` if the DBA adds it). Client consequence: C-1. | Closed |
| D-14 | Approver and acting user | `IDNT_USER_APPROVAL`, `IDNT_USER_UPDATE` | The client sends the approver id (`IdntUserApproval` → `IDNT_USER_APPROVAL`); the service takes the acting user from `ICurrentUserService` (string → `int`) → `@IDNT_USER` → `IDNT_USER_UPDATE`. | Closed |
| D-15 | Audit | all tables | No `IDNT_USER_CREATE` ("every action is an update"). On deactivation: `DATE_UPDATED = now`, `IDNT_USER_UPDATE = acting user`. | Closed |
| D-16 | Cancellation | `IDNT_CANCELLED_FILE` | Out of scope (OQ-02). | Closed |
| D-17 | Permissions | – | Out of scope: enforced on entry to the application; the 04 procedures and service do not check permissions. | Closed |
| D-18 | Server validation scope (deviation from spec 00 §7 and 04 form §5 / §6.3) | all record tables | **Integrity rules only**: CHECK constraints for date order, duration (NULL or 1–120), hours pair (both or none; end after start); in the procedures: permit dates inside the restriction, restriction active and applicable to the trainee (409), required fields and existing ids. Form messages are not replicated; 400 carries the field name. | Closed |
| D-19 | Cellcom sync columns and `syncStatus` | all tables | The push to Cellcom is a background job, not ours. The service generates one GUID per save and passes `@REQUEST_UID`; the procedure stamps `LAST_REQUEST_UID` on every inserted or updated row; `LAST_SUCCESS_REQUEST_UID` is never touched. `syncStatus` and `requestUid` are returned empty (no screen uses them). The per-trainee Cellcom gap (`hasCellcomDiscrepancy`) belongs to the trainees query, not to this feature. To confirm with the job owner (Q-6). | Closed |

## B – business rules (phase 1)

| ID | Topic | Decision | Status |
|---|---|---|---|
| B-1 | Duplicate restriction (same trainee and number, overlapping periods) | Allowed. | Closed |
| B-2 | Overlapping permits on the same restriction (OQ-12) | Allowed. | Closed |
| B-3 | Updating a permit whose restriction has ended | 409. An ended restriction is never returned by the lookup, so it cannot be chosen. | Closed |
| B-4 | Trainee's institute in the permit lookup | Taken from the client (`IdntInstitution` in the request), not derived on the server. | Closed |
| B-5 | History query | All `LOGI_ACTIVE = 1` rows of the trainee, active and ended, no time limit; the client sorts and searches. No paging (dozens of rows per trainee, hundreds at most). Full paging will be designed for the future general lists. | Closed |
| B-6 | `CODE_SOURCE_RECORD_TYPE` (`AVIV_LIST_PHONE_NUMBER`) | "Where the first block of this number came from" – no longer relevant; left NULL. | Closed |
| B-7 | `PHONE_NUMBER_UID` | Cellcom's identifier; the procedures do not fill it (unless the DBA defines a default). | Closed |

## A – architecture (phase 2)

| ID | Topic | Decision | Status |
|---|---|---|---|
| A-1 | Indexes | Only what matters: unique `TEXT_PHONE_NUMBER` (closes the concurrency window of get-or-create), and one index by `IDNT_TRAINEE` on `AVIV_TRAINEE_RESTRICTION_NUMBER` and on `AVIV_PERMITS_FOR_RESTRICTION` (history, trainee flags). Device duplicates are prevented with `DISTINCT` in the procedure. The structural unique indexes (1:1 link, one inline row), the phone/parent/institute indexes and the device unique index were dropped as overkill. | Closed |
| A-2 | Business failure codes | Two: **400** wrong input (with the field), **409** the referenced record is no longer valid (not found, replaced, ended). 404 merged into 409. Mechanism: `THROW 50400 / 50409, '<fieldName>', 1` with `SET XACT_ABORT ON`; CHECK violations (547) → 400 by constraint name; one `SqlErrorMapper` in the service. | Closed |
| A-3 | Structure of the save procedures | **One self-contained procedure per operation** (six procedures). A procedure never calls another. Merging create and update into a SAVE procedure was rejected (a mode switch hurts readability); building blocks orchestrated in a C# transaction were rejected in favour of one readable flow per operation. Drift mitigation: identical section headers for the repeated "new parent version" and "re-point permits" blocks, and this checklist (02-architecture.md §9). Extraction is reconsidered if a fourth copy appears (the general client). | Closed |
| A-4 | Composing nested responses | Several result sets from one procedure, assembled in the orchestrator (`PhoneRecordsAssembler`), as `SP_AVIV_GET_LOCATIONS` already does. No `FOR JSON`. One `TraineePhoneRecordDto` class with `Type = "restriction" | "permit"`, set by the assembler from the originating set. | Closed |
| A-5 | Scope wording | General restrictions are one type (`CODE_RESTRICTION_SCOPE = 1`), optionally narrowed to institutes. The lookup has one condition for them: no active institute link, or a link to the trainee's institute. national / institute is a display derivation. | Closed |
| A-6 | Exceptions in repositories | Not caught. Read repositories too: a database failure must reach the client as 500 ("cannot load"), not as an empty list. | Closed |
| A-7 | Field names in the server DTOs | DB style as the existing DTOs (`IdntTrainee`, `TextPhoneNumber`, `DateStart`…). Client consequence: C-7. Controller route `api/PhoneExceptions/<Action>` keeps the client's paths. | Closed |
| A-8 | Date and time types | The columns stay `datetime` (P-8 withdrawn for now). JSON carries strings `"yyyy-MM-dd"` / `"HH:mm"` as the client sends them; one helper converts to `DateTime` (times on the base date 1900-01-01, SQL's own conversion of a time literal) and back; `DbType.DateTime` to the procedures; every date comparison casts both sides to `DATE` so the end day is inclusive. | Closed |
| A-9 | Passing the phone numbers | One comma-separated `VARCHAR(500)` + `STRING_SPLIT` + `DISTINCT` into a temp table. Order is not a requirement: `createdIds` only tells the client which record to open after a save, and any saved record is acceptable. `VARCHAR_TABLE` (P-13) withdrawn. | Closed |
| A-10 | Explicit sizes, no `MAX` | `@TEXT_PHONE_NUMBER VARCHAR(15)`, `@PHONE_NUMBER_LIST VARCHAR(500)`, `@TEXT_RESTRICTION_REASON` / `@TEXT_PERMIT_REASON NVARCHAR(1000)`, `@TEXT_FILE NVARCHAR(500)`. | Closed |
| A-11 | C# responsibilities | One thin controller (routing, null check, error translation), one orchestrator, two helper classes: `PhoneRecordsAssembler` (rows → DTOs) and `PhoneExceptionsRequestValidator` (structural validation). | Closed |
| A-12 | Validation placement | Structural validation in the orchestrator's validator, 400 with the field through `ApiException`. The controller only checks for a null body. | Closed |
| A-13 | Error body | Structured `{ code, message, fieldErrors }` on 400 / 409 (spec 00 §7); `fieldErrors` carries the field name with an empty text. | Closed |
| A-14 | Save response | `createdIds` only. The client reloads the history after every save (its current behaviour) and opens `createdIds[0]`. | Closed |
| A-15 | Procedure names | `SP_AVIV_GET_TRAINEE_PHONE_RECORDS`, `SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT`, `SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER`, `SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER`, `SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER`, `SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER`. | Closed |
| A-16 | Connection and data access | `ConnectionStrings.ZeroThree03` (the AVIV tables' database); `IDataAccess.QueryMultiple` for every call, saves included (the last result set is the created ids); TVPs through the existing `ToDataTable()` + `DbType.Object`. | Closed |
| A-17 | Phase 3 | Implementation starts in a **new session** from the phase-2 documents, only after the owner's explicit go-ahead. | Closed |

## P – proposals adopted unless objected (phase 1; updated in phase 2)

| ID | Topic | Tables | Proposal | Status |
|---|---|---|---|---|
| P-1 | `IDNT_REPLACED_BY` | – | Not now (cancellation is out of scope; `LOGI_ACTIVE = 0` means replaced). | Adopted |
| P-2 | Idempotency key | – | Not now (the client disables the save button; duplicates are allowed). | Adopted |
| P-3 | Approval columns on rows that are not a user-visible record | `AVIV_TRAINEE_RESTRICTION_NUMBER`, `AVIV_INSTITUTES_RESTRICTION_NUMBER`, `AVIV_PERMITS_DEVICE`, the inline conditions row | Left NULL. The restriction's approval is on `AVIV_RESTRICTION_NUMBER`; the permit's on `AVIV_PERMITS_FOR_RESTRICTION` (flag = 0). | Adopted |
| P-4 | Child rows of a deactivated version | `AVIV_PERMITS_DEVICE` | Deactivated together with their permit / conditions row (one extra UPDATE), so `LOGI_ACTIVE = 1` means the same in every table. `AVIV_LIST_PHONE_NUMBER` rows are never deactivated. | Closed (phase 2) |
| P-5 | `IDNT_INSTITUTE` on the trainee link row | `AVIV_TRAINEE_RESTRICTION_NUMBER` | Not now (no screen needs it; the trainees table is in another database). | Adopted |
| P-6 | `IDNT_INSTITUTE` / `IDNT_LOCATION` on permits | `AVIV_PERMITS_FOR_RESTRICTION` | Left NULL, no constraint, until an institute- or location-level permit is defined. | Adopted |
| P-7 | Phone number column | `AVIV_LIST_PHONE_NUMBER.TEXT_PHONE_NUMBER` | `varchar(15) NOT NULL`, digits only, **local format** as the client sends it (0 + 8–9 digits), unique index. E.164 conversion (`972` instead of the leading 0) is done by whoever sends to Cellcom. See Q-5. | Adopted |
| P-8 | Date and time types | `AVIV_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | Withdrawn: the columns stay `datetime` (A-8). | Withdrawn |
| P-9 | Hebrew free text | `TEXT_RESTRICTION_REASON`, `TEXT_PERMIT_REASON` | `nvarchar(1000)`; `varchar` is acceptable only if the DB collation is Hebrew. See Q-2. | Adopted |
| P-10 | "Today" | – | `CAST(GETDATE() AS DATE)` everywhere; check once that the SQL Server clock is Israel time. See Q-3. | Adopted |
| P-11 | Shortening a restriction that has permits outside the new period | `AVIV_RESTRICTION_NUMBER` ↔ `AVIV_PERMITS_FOR_RESTRICTION` | Allowed (outside the restriction there is no block, so the permit is moot and harmless). | Adopted |
| P-12 | Bulk create | `IdntTraineeList` × `PhoneNumberList` | Supported now in one call and one transaction (all or nothing); the created ids are returned for every trainee × number. | Adopted |
| P-13 | Passing strings to procedures | – | Withdrawn in favour of a comma-separated `VARCHAR(500)` + `STRING_SPLIT` (A-9). `INT_TABLE` is left as it is. | Withdrawn |
| P-14 | Note to the Cellcom job owner | – | Inform about `CODE_RESTRICTION_SCOPE`, `LOGI_RESTRICTION_INLINE_PERMIT` and the re-pointing (the job reads these tables). | Adopted |

## G – guidelines for phases 2 and 3

| ID | Guideline |
|---|---|
| G-1 | Readability and maintainability first. In procedures prefer not to split, but readable wins over unsplit. |
| G-2 | The procedures and the service code are kept in this repository (`stored-procedures/`, `service-layer/`) so that gaps and bugs can be traced through those layers later. |
| G-3 | Design the queries too: (a) history per trainee, no paging; (b) restrictions on a number, general ones included, for choosing a permit's restriction. |
| G-4 | The examples in `reference/` (`SP_AVIV_GET_LOCATIONS.sql`, `reference/service/*`) are conceptual – they show the house style, not a template to copy 1:1. Decide locally per case (for example, no temp table for a one-row TVP). |
| G-5 | Response time: one procedure per save (one round trip); a C# transaction spanning several calls is avoided unless a procedure would otherwise become unreadable. |

## C – client changes deferred

| ID | Change |
|---|---|
| C-1 | Save requests send `TextFile` (+ `TextFileName`) instead of `approvedFileId`; remove `Files/RegisterApprovedFile`, `approvedFilesService`, the registration step in `ApprovalFileField`. |
| C-2 | `reason` / `reasonCode` are not stored; "סיבה" on the card and "create similar" (matched by name) stay empty until adapted; no reasons lookup endpoint. |
| C-3 | `syncStatus` / `requestUid` come back empty; the comment in `common.schema.ts` about deriving them from `LAST_*_UID` no longer applies. |
| C-4 | Validation messages stay in the client; the server returns 400 with field names only (empty texts), and 409. |
| C-5 | Fix the comment on `TraineePhonePermitRecordDto` (the table `AVIV_TRAINEE_PERMITS_FOR_RESTRICTION_NUMBER` does not exist). |
| C-6 | `IdntInstitution` is added to the create-permit request (needed to check that an institute-narrowed general restriction applies to the trainee). |
| C-7 | Request and response field names follow the DB style of the service (`IdntTrainee`, `TextPhoneNumber`, `DateStart`…); the client's schema files and mock are adapted. |
| C-8 | Approver name and role, institute names and device names may arrive empty until the reference tables are joined (Q-1, Q-9, Q-10); the client falls back to its caches (devices) or shows the id. |

## Q – open

None blocks phase 3; Q-2 to Q-6 are answered during implementation. Q-1, Q-9, Q-10 are mocked until the tables are known.

| ID | Question | Tables | Needed for | Status |
|---|---|---|---|---|
| Q-1 | Approver name and role for GET (`approver.fullName` / `roleTitle`). The users table is in another database. | users | the history SELECT | **Mocked** – the service fills a fixed name until a join is possible |
| Q-2 | Is the database collation Hebrew? (decides `varchar` vs `nvarchar` for the details columns) | `AVIV_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | DDL | Open |
| Q-3 | Is the SQL Server clock Israel time? (`SELECT GETDATE(), SYSDATETIMEOFFSET()`) | – | "today" | Open |
| Q-4 | Is `READ_COMMITTED_SNAPSHOT` on? (`SELECT is_read_committed_snapshot_on FROM sys.databases WHERE name = DB_NAME()`) | – | locking hints | Open |
| Q-5 | Does the Cellcom job expect the local format or E.164 in `TEXT_PHONE_NUMBER`? | `AVIV_LIST_PHONE_NUMBER` | P-7 | Open |
| Q-6 | Confirm with the job owner that our stamping of `LAST_REQUEST_UID` matches what the job expects (D-19). | all tables | D-19 | Open |
| Q-7 | `Devices/GetInstituteDevices` does not exist yet – later, outside this scope. | – | – | Deferred |
| Q-8 | `Trainees/GetTrainees` flags (`hasActivePhoneRestriction`, `hasActivePhonePermit`) – later; read-only, derived from these tables. | – | – | Deferred |
| Q-9 | Device names for the response: table and name column (`AVIV_DEVICE_DATA`, seen in `SP_AVIV_GET_LOCATIONS`; name column unknown). | devices | history and lookup SELECTs | Open – ids with empty names until known |
| Q-10 | Institute names for the source-restriction summary: table and name column (another database?). | institutes | history and lookup SELECTs | Open – ids with empty names until known |
