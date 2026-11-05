# Decisions log – number restrictions and permits (server side)

Every question raised in the phase-1 review, with its answer. IDs are stable; later phases refer to them. Status: **Closed** (decided by the owner), **Adopted** (proposed by the analysis, accepted unless objected), **Open**.

Dates: round 1 on 2026-11-04, round 2 on 2026-11-05.

---

## D – core model

| ID | Topic | Tables | Decision | Status |
|---|---|---|---|---|
| D-1 | Versioning and the permits that point at a restriction | `AVIV_RESTRICTION_NUMBER`, `AVIV_TRAINEE_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | An update inserts a new row and sets `LOGI_ACTIVE = 0` on the old one. In the same transaction the active user permits are **re-pointed** to the new parent row (`UPDATE AVIV_PERMITS_FOR_RESTRICTION SET IDNT_AVIV_RESTRICTION_TABLE = @NewId WHERE IDNT_AVIV_RESTRICTION_TABLE = @OldId AND CODE_RESTRICTION_TYPE = <number restriction> AND LOGI_RESTRICTION_INLINE_PERMIT = 0 AND LOGI_ACTIVE = 1`). Conditions: only active permits; the in-place pointer update was approved by the DBA; one shared procedure creates a restriction version (also for the future national client); a permit update takes its restriction from the previous permit row in the DB, not from the request. No UID columns. | Closed |
| D-2 | Where a trainee's number-restriction conditions live (duration / hours / devices) | `AVIV_PERMITS_FOR_RESTRICTION`, `AVIV_PERMITS_DEVICE` | As an inline permit row pointing to `AVIV_RESTRICTION_NUMBER`, with the trainee in `IDNT_TRAINEE` and the flag of D-3. On a new restriction version the inline row is re-created; user permits are re-pointed. `NUMB_DURATION_LIMIT` is the type of the restriction or permit (NULL = full) and exists only when there is a trainee, so it is **not** added to `AVIV_RESTRICTION_NUMBER`. | Closed |
| D-3 | Name of the flag | `AVIV_PERMITS_FOR_RESTRICTION` | `LOGI_RESTRICTION_INLINE_PERMIT bit NOT NULL DEFAULT 0`: 1 = the row is the restriction's own conditions, 0 = a permit the user created. | Closed |
| D-4 | What a number permit points to | `AVIV_PERMITS_FOR_RESTRICTION` | Always the parent `AVIV_RESTRICTION_NUMBER` (`CODE_RESTRICTION_TYPE` = number restriction). The table is shared with feature 03, whose "permits inside the restriction" point to `AVIV_TRAINEE_RESTRICTION`. The DBA's "????" (pointing to `AVIV_TRAINEE_RESTRICTION_NUMBER`) is not needed. The column name `IDNT_AVIV_RESTRICTION_TABLE` stays. | Closed |
| D-5 | Scope | `AVIV_RESTRICTION_NUMBER` | New `CODE_RESTRICTION_SCOPE int NOT NULL`: 1 = general (all institutes, or narrowed through `AVIV_INSTITUTES_RESTRICTION_NUMBER`), 2 = trainee. The client's three-valued `scope` is derived in the SELECT. A narrowed general restriction must have at least one active institute link (procedure rule). | Closed |
| D-6 | Free-text details ("פירוט") | `AVIV_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | The `TEXT_…` columns hold the details: `TEXT_RESTRICTION_REASON` exists; add `TEXT_PERMIT_REASON` for permits. | Closed |
| D-7 | Reason from the closed list | all record tables | Not stored for now (`reason` / `reasonCode` from the client are dropped). No `Lookups/GetPhoneExceptionReasons`. Client consequence: C-2. | Closed |
| D-8 | `CODE_RESTRICTION` | `AVIV_TRAINEE_RESTRICTION` | Not stored for now. | Closed |
| D-9 | Feature 03 | `AVIV_TRAINEE_RESTRICTION` | Out of scope. The shared design (permits table, devices table, the flag) fits it; 03 keeps its hybrid (duration on the restriction row, hours/devices as an inline row). | Closed |
| D-10 | Code values | `DECODE` (`CODE_TABLE` per set) | `AVIV_RESTRICTION_TYPE` = {1 trainee restriction (`AVIV_TRAINEE_RESTRICTION`), 2 number restriction (`AVIV_RESTRICTION_NUMBER`)}; `AVIV_RESTRICTION_SCOPE` = {1 general, 2 trainee}. Values proposed; the DBA inserts the rows. The polymorphic pair stays as it is. | Closed |
| D-11 | Parent ↔ trainee link cardinality | `AVIV_RESTRICTION_NUMBER` ↔ `AVIV_TRAINEE_RESTRICTION_NUMBER` | 1:1 for trainee scope (one parent per trainee and number; spec 04 §2.4 edits each record on its own and the dates live on the parent). Enforced by a filtered unique index. | Closed |
| D-12 | Trainee key | `AVIV_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_DATA` | Everything is unified to `IDNT_TRAINEE` (DBA change in 03, outside this scope). The trainees table lives in another database; the 04 procedures do not join it – the client sends trainee ids and the institute id. | Closed |
| D-13 | Approval file | `AVIV_FILE` (`IDNT_AVIV_FILE`, `TEXT_FILE` = SharePoint path) | The client uploads to SharePoint directly. The save request carries the path; the save procedure inserts the `AVIV_FILE` row in the same transaction and uses its id (atomic, no orphan rows, one file row per version). No `Files/RegisterApprovedFile`. The display name is derived from the path's last segment (or `TEXT_FILE_NAME` if the DBA adds it). Client consequence: C-1. | Closed |
| D-14 | Approver and acting user | `IDNT_USER_APPROVAL`, `IDNT_USER_UPDATE` | The client sends the approver id (`approverId` → `IDNT_USER_APPROVAL`); the service sends the acting user (`@UserId` → `IDNT_USER_UPDATE`). | Closed |
| D-15 | Audit | all tables | No `IDNT_USER_CREATE` ("every action is an update"). On deactivation: `DATE_UPDATED = now`, `IDNT_USER_UPDATE = acting user`. | Closed |
| D-16 | Cancellation | `IDNT_CANCELLED_FILE` | Out of scope (OQ-02). | Closed |
| D-17 | Permissions | – | Out of scope: enforced on entry to the application; the 04 procedures and service do not check permissions. | Closed |
| D-18 | Server validation scope (deviation from spec 00 §7 and 04 form §5 / §6.3) | all record tables | **Integrity rules only**: CHECK constraints for date order, duration (NULL or 1–120), hours pair (both or none; end after start); in the procedures: permit dates inside the restriction, restriction active and applicable to the trainee (409), required fields and existing ids. Form messages are not replicated; 400 carries the field name. | Closed |
| D-19 | Cellcom sync columns and `syncStatus` | all tables | The push to Cellcom is a background job, not ours. The service generates one GUID per save and passes `@RequestUid`; the procedure stamps `LAST_REQUEST_UID` on every inserted or updated row; `LAST_SUCCESS_REQUEST_UID` is never touched. `syncStatus` and `requestUid` are returned empty (no screen uses them). The per-trainee Cellcom gap (`hasCellcomDiscrepancy`) belongs to the trainees query, not to this feature. To confirm with the job owner (Q-6). | Closed |

## B – business rules

| ID | Topic | Decision | Status |
|---|---|---|---|
| B-1 | Duplicate restriction (same trainee and number, overlapping periods) | Allowed. | Closed |
| B-2 | Overlapping permits on the same restriction (OQ-12) | Allowed. | Closed |
| B-3 | Updating a permit whose restriction has ended | 409. An ended restriction is never returned by the lookup, so it cannot be chosen. | Closed |
| B-4 | Trainee's institute in the permit lookup | Taken from the client (`instituteId` in the request), not derived on the server. | Closed |
| B-5 | History query | All `LOGI_ACTIVE = 1` rows of the trainee, active and ended, no time limit, sorted by start date descending. No paging (dozens of rows per trainee, hundreds at most; search and sort stay in the client). Full paging will be designed for the future general lists. | Closed |
| B-6 | `CODE_SOURCE_RECORD_TYPE` (`AVIV_LIST_PHONE_NUMBER`) | "Where the first block of this number came from" – no longer relevant; left NULL. | Closed |
| B-7 | `PHONE_NUMBER_UID` | Cellcom's identifier; the procedures do not fill it (unless the DBA defines a default). | Closed |

## P – proposals adopted unless objected

| ID | Topic | Tables | Proposal | Status |
|---|---|---|---|---|
| P-1 | `IDNT_REPLACED_BY` | – | Not now (cancellation is out of scope; `LOGI_ACTIVE = 0` means replaced). | Adopted |
| P-2 | Idempotency key | – | Not now (the client disables the save button; duplicates are allowed). | Adopted |
| P-3 | Approval columns on rows that are not a user-visible record | `AVIV_TRAINEE_RESTRICTION_NUMBER`, `AVIV_INSTITUTES_RESTRICTION_NUMBER`, `AVIV_PERMITS_DEVICE`, the inline conditions row | Left NULL. The restriction's approval is on `AVIV_RESTRICTION_NUMBER`; the permit's on `AVIV_PERMITS_FOR_RESTRICTION` (flag = 0). | Adopted |
| P-4 | Child rows of a deactivated version | `AVIV_PERMITS_DEVICE` | Deactivated together with their permit / conditions row, so `LOGI_ACTIVE = 1` means the same in every table. `AVIV_LIST_PHONE_NUMBER` rows are never deactivated. | Adopted |
| P-5 | `IDNT_INSTITUTE` on the trainee link row | `AVIV_TRAINEE_RESTRICTION_NUMBER` | Not now (no screen needs it; the trainees table is in another database). | Adopted |
| P-6 | `IDNT_INSTITUTE` / `IDNT_LOCATION` on permits | `AVIV_PERMITS_FOR_RESTRICTION` | Left NULL, no constraint, until an institute- or location-level permit is defined. | Adopted |
| P-7 | Phone number column | `AVIV_LIST_PHONE_NUMBER.TEXT_PHONE_NUMBER` | `varchar(15) NOT NULL`, digits only, **local format** as the client sends it (0 + 8–9 digits), unique index. E.164 conversion (`972` instead of the leading 0) is done by whoever sends to Cellcom. See Q-5. | Adopted |
| P-8 | Date and time types | `AVIV_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | `DATE_*` → `date`, `TIME_PERMIT_*` → `time(0)`. If the DBA keeps `datetime`, every comparison uses `CAST(... AS date)` on both sides so the end day is inclusive. | Adopted |
| P-9 | Hebrew free text | `TEXT_RESTRICTION_REASON`, `TEXT_PERMIT_REASON` | `nvarchar(1000)`; `varchar` is acceptable only if the DB collation is Hebrew. See Q-2. | Adopted |
| P-10 | "Today" | – | `CAST(GETDATE() AS date)` everywhere; check once that the SQL Server clock is Israel time. See Q-3. | Adopted |
| P-11 | Shortening a restriction that has permits outside the new period | `AVIV_RESTRICTION_NUMBER` ↔ `AVIV_PERMITS_FOR_RESTRICTION` | Allowed (outside the restriction there is no block, so the permit is moot and harmless). | Adopted |
| P-12 | Bulk create | `traineeIds[]` × `phoneNumbers[]` | Supported now (one INSERT from the cross join of the two table parameters), all-or-nothing, `createdIds` in input order. | Adopted |
| P-13 | Passing strings to procedures | new type | `VARCHAR_TABLE (NUMB_ORDER int, TEXT_GENERAL varchar(20))`; `INT_TABLE` is left as it is (changing it would touch existing procedures). | Adopted |
| P-14 | Note to the Cellcom job owner | – | Inform about `CODE_RESTRICTION_SCOPE`, `LOGI_RESTRICTION_INLINE_PERMIT` and the re-pointing (the job reads these tables). | Adopted |

## G – guidelines for phases 2 and 3

| ID | Guideline |
|---|---|
| G-1 | Readability and maintainability first. In procedures prefer not to split, but readable wins over unsplit. |
| G-2 | The procedures and the service code are kept in this repository (`stored-procedures/`, `service-layer/`) so that gaps and bugs can be traced through those layers later. |
| G-3 | Design the queries too: (a) history per trainee, no paging; (b) restrictions on a number, general ones included, for choosing a permit's restriction. |

## C – client changes deferred

| ID | Change |
|---|---|
| C-1 | Save requests send `approvedFilePath` (+ file name) instead of `approvedFileId`; remove `Files/RegisterApprovedFile`, `approvedFilesService`, the registration step in `ApprovalFileField`. |
| C-2 | `reason` / `reasonCode` are not stored; "סיבה" on the card and "create similar" (matched by name) stay empty until adapted; no reasons lookup endpoint. |
| C-3 | `syncStatus` / `requestUid` come back empty; the comment in `common.schema.ts` about deriving them from `LAST_*_UID` no longer applies. |
| C-4 | Validation messages stay in the client; the server returns 400 with field names only, and 409. |
| C-5 | Fix the comment on `TraineePhonePermitRecordDto` (the table `AVIV_TRAINEE_PERMITS_FOR_RESTRICTION_NUMBER` does not exist). |

## Q – open

None blocks phase 2. Q-1 to Q-6 must be closed before the procedures are written (phase 3).

| ID | Question | Tables | Needed for | Status |
|---|---|---|---|---|
| Q-1 | Which table gives the approver's name and role for GET (`ApproverRef.fullName` / `roleTitle`)? Or does the client show only the id for now? | users | the history SELECT | Open |
| Q-2 | Is the database collation Hebrew? (decides `varchar` vs `nvarchar` for the details columns) | `AVIV_RESTRICTION_NUMBER`, `AVIV_PERMITS_FOR_RESTRICTION` | DDL | Open |
| Q-3 | Is the SQL Server clock Israel time? (`SELECT GETDATE(), SYSDATETIMEOFFSET()`) | – | "today" | Open |
| Q-4 | Is `READ_COMMITTED_SNAPSHOT` on? (`SELECT is_read_committed_snapshot_on FROM sys.databases WHERE name = DB_NAME()`) | – | locking hints | Open |
| Q-5 | Does the Cellcom job expect the local format or E.164 in `TEXT_PHONE_NUMBER`? | `AVIV_LIST_PHONE_NUMBER` | P-7 | Open |
| Q-6 | Confirm with the job owner that our stamping of `LAST_REQUEST_UID` matches what the job expects (D-19). | all tables | D-19 | Open |
| Q-7 | `Devices/GetInstituteDevices` does not exist yet – later, outside this scope. | – | – | Deferred |
| Q-8 | `Trainees/GetTrainees` flags (`hasActivePhoneRestriction`, `hasActivePhonePermit`) – later; read-only, derived from these tables. | – | – | Deferred |
