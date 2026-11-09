/* ============================================================================
   Aviv - trainee restrictions (feature 03)
   Schema changes for the DBA - phase 1 output (2026-11-09), delivered together
   with 01-proposed-schema-changes.sql (feature 04) as one request.

   Source of every item: service-layer/docs/trainee-restrictions/decisions.md
   (IDs T-n, TQ-n) and service-layer/docs/number-restrictions/decisions.md
   (IDs D-n, A-n, P-n, I-n).

   WHAT THIS SCRIPT DOES: renames one column of AVIV_TRAINEE_RESTRICTION
   (IDNT_AVIV_TRAINEE_DATA -> IDNT_TRAINEE, D-12 / T-8). Nothing else.
   The script is re-runnable: the rename runs only while the old name exists.

   NOT APPLIED, by decision:
     - No new columns. The details column TEXT_RESTRICTION_REASON already exists
       on AVIV_TRAINEE_RESTRICTION (T-3); the DBA export of 2026-10-29 predates
       it, which is why section 2 re-reads the column list.
     - RESTRICTION_UID is left alone: the procedures neither write nor return
       it (T-1). It must be nullable - see TQ-1 in section 2.
     - CODE_RESTRICTION (int NULL) is left alone: not written (D-8, T-5).
     - No DECODE rows: the value AVIV_RESTRICTION_TYPE = 1 ("trainee
       restriction") is proposed in section 1 of the feature 04 script (D-10).
     - No CHECK constraints and no indexes (D-18, A-1): the service validator
       enforces the input rules, the procedures keep the cross-row checks.
   ============================================================================ */

SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   1. AVIV_TRAINEE_RESTRICTION - the trainee key                      CLOSED (D-12, T-8)
   Unified to IDNT_TRAINEE like every other table. sp_rename keeps the data
   and the column position; objects that reference the old name (none are
   expected - the AVIV procedures are created after this script) must be
   checked by the DBA.
   ---------------------------------------------------------------------------- */
IF COL_LENGTH('dbo.AVIV_TRAINEE_RESTRICTION', 'IDNT_AVIV_TRAINEE_DATA') IS NOT NULL
   AND COL_LENGTH('dbo.AVIV_TRAINEE_RESTRICTION', 'IDNT_TRAINEE') IS NULL
BEGIN
    EXEC sp_rename 'dbo.AVIV_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_DATA', 'IDNT_TRAINEE', 'COLUMN';
END;
GO

/* ----------------------------------------------------------------------------
   2. Environment checks (read-only, run once before the procedures are created)
   ---------------------------------------------------------------------------- */
-- TQ-2: the real column list of AVIV_TRAINEE_RESTRICTION. The code assumes, beside
--       the generic columns (DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE,
--       LAST_REQUEST_UID, LAST_SUCCESS_REQUEST_UID, IDNT_CANCELLED_FILE):
--         IDNT_AVIV_TRAINEE_RESTRICTION (PK, IDENTITY)   IDNT_TRAINEE
--         RESTRICTION_UID (uniqueidentifier, NULL)        CODE_RESTRICTION (int, NULL)
--         DATE_RESTRICTION_START / DATE_RESTRICTION_END (datetime)
--         NUMB_DURATION_LIMIT (int, NULL)                 TEXT_RESTRICTION_REASON (varchar, ~1000)
--         IDNT_APPROVED_FILE (int)                        IDNT_USER_APPROVAL (int)
--       Compare the grid below with this list and record the differences in decisions.md (TQ-2).
-- SELECT COLUMNS.column_id, COLUMNS.name, TYPES.name AS type_name, COLUMNS.max_length,
--        COLUMNS.is_nullable, COLUMNS.is_identity, COLUMNS.collation_name
-- FROM   sys.columns AS COLUMNS
-- JOIN   sys.types   AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
-- WHERE  COLUMNS.object_id = OBJECT_ID('dbo.AVIV_TRAINEE_RESTRICTION')
-- ORDER BY COLUMNS.column_id;

-- TQ-1: RESTRICTION_UID must show is_nullable = 1 in the grid above. If it does not, the
--       inserts of the two save procedures fail; then either the DBA adds a default or allows
--       NULL, or the "ours" variant of T-1 (NEWID() on create, copied on update) is applied.

-- I-14 / TQ-2: max_length of TEXT_RESTRICTION_REASON against the 1000 assumed in
--       @TEXT_RESTRICTION_REASON (both save procedures) and TraineeRestrictionsLimits.DetailsMaxLength.
--       A non-Hebrew collation on this varchar column stores Hebrew as '?' (P-9, accepted).

-- I-11: is_identity = 1 on IDNT_AVIV_TRAINEE_RESTRICTION. The save procedures rely on it
--       (SCOPE_IDENTITY() and OUTPUT INSERTED), and the test script inserts without keys.

/* ----------------------------------------------------------------------------
   3. DECODE, CHECK constraints, indexes
   Nothing here: AVIV_RESTRICTION_TYPE = 1 is in the feature 04 script (D-10);
   no CHECK constraints and no indexes by decision (D-18, A-1).
   ---------------------------------------------------------------------------- */
