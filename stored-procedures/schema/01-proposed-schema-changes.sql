/* ============================================================================
   Aviv - number restrictions and permits (feature 04)
   Schema changes for the DBA - phase 1 output, trimmed in phase 2, reduced
   again on 2026-11-08 by the product owner's decision (see below).

   Source of every item: service-layer/docs/number-restrictions/decisions.md (IDs D-n, A-n, P-n, Q-n, I-n).

   WHAT THIS SCRIPT DOES: adds three columns (with the defaults that an
   ADD ... NOT NULL needs on a populated table) and proposes two DECODE sets.
   Nothing else. The script is re-runnable (every step checks before it acts).

   NOT APPLIED, by the owner's decision of 2026-11-08 (decisions.md D-18, A-1, P-7, P-9):
     - CHECK constraints (date order, duration 1-120, time pair, digits-only
       phone number, scope values). The service validator enforces these rules;
       the database trusts its writers.
     - Indexes, including the unique index on AVIV_LIST_PHONE_NUMBER.TEXT_PHONE_NUMBER.
       The get-or-create of phone numbers is serialized with sp_getapplock inside
       SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER instead (I-13). Performance
       indexes can be added later without any code change.
     - Converting TEXT_RESTRICTION_REASON to nvarchar: the column stays varchar,
       and TEXT_PERMIT_REASON is created as varchar as well. Characters outside
       the column's code page are stored as '?'.

   NOT in this script, by earlier decisions: UID columns, NUMB_DURATION_LIMIT on
   the parent table, a reason-code column, IDNT_REPLACED_BY, IDNT_USER_CREATE,
   an idempotency key, a VARCHAR table type, any change to INT_TABLE, and any
   change of the datetime columns (they stay datetime, A-8).
   ============================================================================ */

SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   1. DECODE - two new code sets                                      CLOSED (D-10)
   SUPERSEDED 2026-11-10 (lookups, K-5): the table is dbo.AVIV_DECODE, its set
   key CODE_TABLE is numeric, and the DBA fills it. Nothing below is to be run.
   The type and scope codes (1 trainee / 2 number; 1 general / 2 trainee) stay
   the documented DECLARE constants of the procedures (K-7). Kept for history.
   ---------------------------------------------------------------------------- */
-- SUPERSEDED: do not run; see service-layer/docs/lookups/decisions.md K-5.
-- INSERT INTO dbo.DECODE (CODE_TABLE, CODE, TEXT_DESCRIPTION) VALUES
--   ('AVIV_RESTRICTION_TYPE',  1, N'Trainee restriction (AVIV_TRAINEE_RESTRICTION)'),
--   ('AVIV_RESTRICTION_TYPE',  2, N'Number restriction (AVIV_RESTRICTION_NUMBER)'),
--   ('AVIV_RESTRICTION_SCOPE', 1, N'General (all institutes, or narrowed through AVIV_INSTITUTES_RESTRICTION_NUMBER)'),
--   ('AVIV_RESTRICTION_SCOPE', 2, N'Trainee');
GO

/* ----------------------------------------------------------------------------
   2. AVIV_RESTRICTION_NUMBER (the parent)
   ---------------------------------------------------------------------------- */

-- 2.1 Scope: 1 = general, 2 = trainee.                                 CLOSED (D-5, A-5)
--     The default fills the existing rows; the procedures always set the value.
IF COL_LENGTH('dbo.AVIV_RESTRICTION_NUMBER', 'CODE_RESTRICTION_SCOPE') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_RESTRICTION_NUMBER
        ADD CODE_RESTRICTION_SCOPE int NOT NULL
            CONSTRAINT DF_AVIV_RESTRICTION_NUMBER_SCOPE DEFAULT (1);
END;
GO

-- 2.2 Free-text details live in TEXT_RESTRICTION_REASON.               CLOSED (D-6, P-9)
--     The column stays varchar (decided 2026-11-08). No change here.
--     The procedures and the service assume 1000 characters (I-14); if the
--     column is shorter, set its length in the @TEXT_RESTRICTION_REASON and
--     @TEXT_PERMIT_REASON parameters and in the service validator.

/* ----------------------------------------------------------------------------
   3. AVIV_TRAINEE_RESTRICTION_NUMBER (the trainee link, 1:1 with the parent
      for trainee scope - guaranteed by the procedures, D-11)
   No change. The index by IDNT_TRAINEE was not applied (A-1, 2026-11-08).
   ---------------------------------------------------------------------------- */

/* ----------------------------------------------------------------------------
   4. AVIV_PERMITS_FOR_RESTRICTION (permits, and inline conditions rows)
   ---------------------------------------------------------------------------- */

-- 4.1 The flag: 1 = the row is the restriction's own conditions,
--     0 = a permit the user created.                                     CLOSED (D-2, D-3)
IF COL_LENGTH('dbo.AVIV_PERMITS_FOR_RESTRICTION', 'LOGI_RESTRICTION_INLINE_PERMIT') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION
        ADD LOGI_RESTRICTION_INLINE_PERMIT bit NOT NULL
            CONSTRAINT DF_AVIV_PERMITS_FOR_RESTRICTION_INLINE DEFAULT (0);
END;
GO

-- 4.2 Free-text details of a permit, varchar like TEXT_RESTRICTION_REASON.  CLOSED (D-6, P-9)
IF COL_LENGTH('dbo.AVIV_PERMITS_FOR_RESTRICTION', 'TEXT_PERMIT_REASON') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION
        ADD TEXT_PERMIT_REASON varchar(1000) NULL;
END;
GO

/* ----------------------------------------------------------------------------
   5. AVIV_PERMITS_DEVICE
   No change: duplicates are prevented with DISTINCT in the procedures (A-1);
   rows of a replaced permit are deactivated with it (P-4).
   ---------------------------------------------------------------------------- */

/* ----------------------------------------------------------------------------
   6. AVIV_LIST_PHONE_NUMBER
   No change. Local format (0 + 8-9 digits) as the client sends it (P-7, Q-5);
   the digits-only rule is enforced by the service validator. No unique index:
   concurrent creation of the same number is serialized in the create
   procedure with sp_getapplock (I-13).
   ---------------------------------------------------------------------------- */

/* ----------------------------------------------------------------------------
   7. AVIV_FILE                                                           CLOSED (D-13)
   No change required: the save procedure inserts the row.
   Optional: a display-name column; otherwise the name is derived from the path.
   ---------------------------------------------------------------------------- */
-- ALTER TABLE dbo.AVIV_FILE ADD TEXT_FILE_NAME nvarchar(255) NULL;   -- optional

/* ----------------------------------------------------------------------------
   8. AVIV_TRAINEE_RESTRICTION (feature 03)                              CLOSED (D-12)
   The trainee key is unified to IDNT_TRAINEE across all tables. The rename
   lives in the feature 03 script, delivered together with this one:
   stored-procedures/schema/02-proposed-schema-changes-trainee-restrictions.sql
   ---------------------------------------------------------------------------- */

/* ----------------------------------------------------------------------------
   9. Environment checks (read-only, run once)
   ---------------------------------------------------------------------------- */
-- Q-3: is the server clock Israel time?
-- SELECT GETDATE() AS server_now, SYSDATETIMEOFFSET() AS server_now_with_offset;

-- Q-4: locking behaviour of the database
-- SELECT name, collation_name, is_read_committed_snapshot_on FROM sys.databases WHERE name = DB_NAME();

-- Q-2 / I-14: the details columns stay varchar - their collation decides which
-- characters survive, and their length must match the 1000 assumed in the code.
-- SELECT COLUMNS.name, TYPES.name AS type_name, COLUMNS.max_length, COLUMNS.collation_name
-- FROM   sys.columns AS COLUMNS
-- JOIN   sys.types AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
-- WHERE  COLUMNS.object_id IN (OBJECT_ID('dbo.AVIV_RESTRICTION_NUMBER'), OBJECT_ID('dbo.AVIV_PERMITS_FOR_RESTRICTION'), OBJECT_ID('dbo.AVIV_LIST_PHONE_NUMBER'))
--   AND  COLUMNS.name IN ('TEXT_RESTRICTION_REASON', 'TEXT_PERMIT_REASON', 'TEXT_PHONE_NUMBER');

-- STRING_SPLIT needs compatibility level 130 or higher.
-- SELECT name, compatibility_level FROM sys.databases WHERE name = DB_NAME();
