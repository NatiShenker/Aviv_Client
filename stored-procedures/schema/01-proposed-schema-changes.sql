/* ============================================================================
   Aviv - number restrictions and permits (feature 04)
   Proposed schema changes for the DBA - phase 1 output

   Source of every item: service-layer/docs/decisions.md (IDs D-n, P-n, Q-n).

   Markers:
     CLOSED   - decided with the product owner; please apply.
     PROPOSED - recommended by the analysis, adopted unless objected.
     OPEN     - depends on an answer (see the Q-n in decisions.md).

   The script is written to be re-runnable (every step checks before it acts).
   Constraint and index names follow the pattern used below; rename to the
   house convention if there is one.

   NOT in this script, by decision: UID columns, NUMB_DURATION_LIMIT on the
   parent table, a reason-code column, IDNT_REPLACED_BY, IDNT_USER_CREATE,
   an idempotency key, any change to the INT_TABLE type.
   ============================================================================ */

SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   1. DECODE - two new code sets                                      CLOSED (D-10)
   The DECODE table's column names were not exported. Adjust the column list
   below to the real structure (CODE_TABLE + code + text is assumed).
   ---------------------------------------------------------------------------- */
-- OPEN: confirm the DECODE column names before running.
-- INSERT INTO dbo.DECODE (CODE_TABLE, CODE, TEXT_DESCRIPTION) VALUES
--   ('AVIV_RESTRICTION_TYPE',  1, N'Trainee restriction (AVIV_TRAINEE_RESTRICTION)'),
--   ('AVIV_RESTRICTION_TYPE',  2, N'Number restriction (AVIV_RESTRICTION_NUMBER)'),
--   ('AVIV_RESTRICTION_SCOPE', 1, N'General'),
--   ('AVIV_RESTRICTION_SCOPE', 2, N'Trainee');
GO

/* ----------------------------------------------------------------------------
   2. AVIV_RESTRICTION_NUMBER (the parent)
   ---------------------------------------------------------------------------- */

-- 2.1 Scope: 1 = general (all institutes, or narrowed through
--     AVIV_INSTITUTES_RESTRICTION_NUMBER), 2 = trainee.                CLOSED (D-5)
IF COL_LENGTH('dbo.AVIV_RESTRICTION_NUMBER', 'CODE_RESTRICTION_SCOPE') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_RESTRICTION_NUMBER
        ADD CODE_RESTRICTION_SCOPE int NOT NULL
            CONSTRAINT DF_AVIV_RESTRICTION_NUMBER_SCOPE DEFAULT (1);
END;
GO
IF OBJECT_ID('dbo.CK_AVIV_RESTRICTION_NUMBER_SCOPE', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_RESTRICTION_NUMBER WITH CHECK
        ADD CONSTRAINT CK_AVIV_RESTRICTION_NUMBER_SCOPE
            CHECK (CODE_RESTRICTION_SCOPE IN (1, 2));
END;
GO

-- 2.2 Free-text details live in TEXT_RESTRICTION_REASON.               CLOSED (D-6)
--     Hebrew text: nvarchar unless the DB collation is Hebrew.          OPEN (Q-2)
-- ALTER TABLE dbo.AVIV_RESTRICTION_NUMBER ALTER COLUMN TEXT_RESTRICTION_REASON nvarchar(1000) NULL;

-- 2.3 Date columns as date (end day inclusive, no time part).          PROPOSED (P-8)
--     If kept as datetime, every comparison must CAST both sides to date.
-- ALTER TABLE dbo.AVIV_RESTRICTION_NUMBER ALTER COLUMN DATE_RESTRICTION_START date NOT NULL;
-- ALTER TABLE dbo.AVIV_RESTRICTION_NUMBER ALTER COLUMN DATE_RESTRICTION_END   date NOT NULL;

-- 2.4 Integrity: end not before start.                                  CLOSED (D-18)
IF OBJECT_ID('dbo.CK_AVIV_RESTRICTION_NUMBER_DATES', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_RESTRICTION_NUMBER WITH CHECK
        ADD CONSTRAINT CK_AVIV_RESTRICTION_NUMBER_DATES
            CHECK (DATE_RESTRICTION_END >= DATE_RESTRICTION_START);
END;
GO

-- 2.5 Index for the permit lookup (restrictions of a number).           CLOSED
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_AVIV_RESTRICTION_NUMBER_PHONE_ACTIVE'
                 AND object_id = OBJECT_ID('dbo.AVIV_RESTRICTION_NUMBER'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AVIV_RESTRICTION_NUMBER_PHONE_ACTIVE
        ON dbo.AVIV_RESTRICTION_NUMBER (IDNT_AVIV_LIST_PHONE_NUMBER)
        INCLUDE (CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END)
        WHERE LOGI_ACTIVE = 1;
END;
GO

/* ----------------------------------------------------------------------------
   3. AVIV_TRAINEE_RESTRICTION_NUMBER (the trainee link, 1:1 with the parent)
   ---------------------------------------------------------------------------- */

-- 3.1 History per trainee and the trainee flags.                        CLOSED
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_AVIV_TRAINEE_RESTRICTION_NUMBER_TRAINEE_ACTIVE'
                 AND object_id = OBJECT_ID('dbo.AVIV_TRAINEE_RESTRICTION_NUMBER'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AVIV_TRAINEE_RESTRICTION_NUMBER_TRAINEE_ACTIVE
        ON dbo.AVIV_TRAINEE_RESTRICTION_NUMBER (IDNT_TRAINEE)
        INCLUDE (IDNT_AVIV_RESTRICTION_NUMBER)
        WHERE LOGI_ACTIVE = 1;
END;
GO

-- 3.2 One active trainee link per parent (the 1:1 rule).                CLOSED (D-11)
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_AVIV_TRAINEE_RESTRICTION_NUMBER_PARENT_ACTIVE'
                 AND object_id = OBJECT_ID('dbo.AVIV_TRAINEE_RESTRICTION_NUMBER'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_AVIV_TRAINEE_RESTRICTION_NUMBER_PARENT_ACTIVE
        ON dbo.AVIV_TRAINEE_RESTRICTION_NUMBER (IDNT_AVIV_RESTRICTION_NUMBER)
        WHERE LOGI_ACTIVE = 1;
END;
GO

/* ----------------------------------------------------------------------------
   4. AVIV_INSTITUTES_RESTRICTION_NUMBER (narrowing a general restriction)
   ---------------------------------------------------------------------------- */

-- 4.1 An institute appears once per active restriction.                 CLOSED
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_AVIV_INSTITUTES_RESTRICTION_NUMBER_ACTIVE'
                 AND object_id = OBJECT_ID('dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_AVIV_INSTITUTES_RESTRICTION_NUMBER_ACTIVE
        ON dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER (IDNT_AVIV_RESTRICTION_NUMBER, IDNT_INSTITUTE)
        WHERE LOGI_ACTIVE = 1;
END;
GO

/* ----------------------------------------------------------------------------
   5. AVIV_PERMITS_FOR_RESTRICTION (permits, and inline conditions rows)
   ---------------------------------------------------------------------------- */

-- 5.1 The flag: 1 = the row is the restriction's own conditions,
--     0 = a permit the user created.                                     CLOSED (D-2, D-3)
IF COL_LENGTH('dbo.AVIV_PERMITS_FOR_RESTRICTION', 'LOGI_RESTRICTION_INLINE_PERMIT') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION
        ADD LOGI_RESTRICTION_INLINE_PERMIT bit NOT NULL
            CONSTRAINT DF_AVIV_PERMITS_FOR_RESTRICTION_INLINE DEFAULT (0);
END;
GO

-- 5.2 Free-text details of a permit.                                     CLOSED (D-6)
--     OPEN (Q-2): varchar instead of nvarchar if the collation is Hebrew.
IF COL_LENGTH('dbo.AVIV_PERMITS_FOR_RESTRICTION', 'TEXT_PERMIT_REASON') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION
        ADD TEXT_PERMIT_REASON nvarchar(1000) NULL;
END;
GO

-- 5.3 Time of day as time(0), dates as date.                             PROPOSED (P-8)
-- ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION ALTER COLUMN TIME_PERMIT_START time(0) NULL;
-- ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION ALTER COLUMN TIME_PERMIT_END   time(0) NULL;
-- ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION ALTER COLUMN DATE_PERMIT_START date NOT NULL;
-- ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION ALTER COLUMN DATE_PERMIT_END   date NOT NULL;

-- 5.4 Integrity rules the DB enforces.                                   CLOSED (D-18)
--     The time comparison casts to time so it is correct whether the
--     columns stay datetime or become time(0).
IF OBJECT_ID('dbo.CK_AVIV_PERMITS_FOR_RESTRICTION_DATES', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION WITH CHECK
        ADD CONSTRAINT CK_AVIV_PERMITS_FOR_RESTRICTION_DATES
            CHECK (DATE_PERMIT_END >= DATE_PERMIT_START);
END;
GO
IF OBJECT_ID('dbo.CK_AVIV_PERMITS_FOR_RESTRICTION_TIMES', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION WITH CHECK
        ADD CONSTRAINT CK_AVIV_PERMITS_FOR_RESTRICTION_TIMES
            CHECK (
                (TIME_PERMIT_START IS NULL AND TIME_PERMIT_END IS NULL)
                OR (TIME_PERMIT_START IS NOT NULL AND TIME_PERMIT_END IS NOT NULL
                    AND CAST(TIME_PERMIT_END AS time) > CAST(TIME_PERMIT_START AS time))
            );
END;
GO
IF OBJECT_ID('dbo.CK_AVIV_PERMITS_FOR_RESTRICTION_DURATION', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_PERMITS_FOR_RESTRICTION WITH CHECK
        ADD CONSTRAINT CK_AVIV_PERMITS_FOR_RESTRICTION_DURATION
            CHECK (NUMB_DURATION_LIMIT IS NULL OR NUMB_DURATION_LIMIT BETWEEN 1 AND 120);
END;
GO

-- 5.5 History per trainee and the trainee flags. The flag column is in
--     the key: the flags query must exclude inline rows.                 CLOSED
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_AVIV_PERMITS_FOR_RESTRICTION_TRAINEE_ACTIVE'
                 AND object_id = OBJECT_ID('dbo.AVIV_PERMITS_FOR_RESTRICTION'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AVIV_PERMITS_FOR_RESTRICTION_TRAINEE_ACTIVE
        ON dbo.AVIV_PERMITS_FOR_RESTRICTION (IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT)
        INCLUDE (DATE_PERMIT_START, DATE_PERMIT_END, IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE)
        WHERE LOGI_ACTIVE = 1;
END;
GO

-- 5.6 Permits of one restriction: the re-pointing on a new version,
--     "existing permits" in the lookup, the inline row of the history.   CLOSED
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_AVIV_PERMITS_FOR_RESTRICTION_PARENT_ACTIVE'
                 AND object_id = OBJECT_ID('dbo.AVIV_PERMITS_FOR_RESTRICTION'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AVIV_PERMITS_FOR_RESTRICTION_PARENT_ACTIVE
        ON dbo.AVIV_PERMITS_FOR_RESTRICTION (CODE_RESTRICTION_TYPE, IDNT_AVIV_RESTRICTION_TABLE, IDNT_TRAINEE)
        INCLUDE (LOGI_RESTRICTION_INLINE_PERMIT, DATE_PERMIT_START, DATE_PERMIT_END)
        WHERE LOGI_ACTIVE = 1;
END;
GO

-- 5.7 At most one active inline conditions row per restriction version
--     and trainee.                                                       CLOSED
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_AVIV_PERMITS_FOR_RESTRICTION_INLINE_ACTIVE'
                 AND object_id = OBJECT_ID('dbo.AVIV_PERMITS_FOR_RESTRICTION'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_AVIV_PERMITS_FOR_RESTRICTION_INLINE_ACTIVE
        ON dbo.AVIV_PERMITS_FOR_RESTRICTION (CODE_RESTRICTION_TYPE, IDNT_AVIV_RESTRICTION_TABLE, IDNT_TRAINEE)
        WHERE LOGI_RESTRICTION_INLINE_PERMIT = 1 AND LOGI_ACTIVE = 1;
END;
GO

/* ----------------------------------------------------------------------------
   6. AVIV_PERMITS_DEVICE
   ---------------------------------------------------------------------------- */

-- 6.1 A device appears once per permit row.                              CLOSED
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_AVIV_PERMITS_DEVICE_PERMIT_DEVICE'
                 AND object_id = OBJECT_ID('dbo.AVIV_PERMITS_DEVICE'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_AVIV_PERMITS_DEVICE_PERMIT_DEVICE
        ON dbo.AVIV_PERMITS_DEVICE (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE);
END;
GO

/* ----------------------------------------------------------------------------
   7. AVIV_LIST_PHONE_NUMBER
   ---------------------------------------------------------------------------- */

-- 7.1 Digits only, local format (0 + 8-9 digits), room for E.164 later.
--     PROPOSED (P-7); stored format OPEN (Q-5).
-- ALTER TABLE dbo.AVIV_LIST_PHONE_NUMBER ALTER COLUMN TEXT_PHONE_NUMBER varchar(15) NOT NULL;
IF OBJECT_ID('dbo.CK_AVIV_LIST_PHONE_NUMBER_DIGITS', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.AVIV_LIST_PHONE_NUMBER WITH CHECK
        ADD CONSTRAINT CK_AVIV_LIST_PHONE_NUMBER_DIGITS
            CHECK (TEXT_PHONE_NUMBER NOT LIKE '%[^0-9]%' AND LEN(TEXT_PHONE_NUMBER) BETWEEN 9 AND 15);
END;
GO

-- 7.2 One row per number; also protects the get-or-create in the save
--     procedure against concurrent inserts.                              PROPOSED (P-7)
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_AVIV_LIST_PHONE_NUMBER_TEXT'
                 AND object_id = OBJECT_ID('dbo.AVIV_LIST_PHONE_NUMBER'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_AVIV_LIST_PHONE_NUMBER_TEXT
        ON dbo.AVIV_LIST_PHONE_NUMBER (TEXT_PHONE_NUMBER);
END;
GO

/* ----------------------------------------------------------------------------
   8. AVIV_FILE                                                           CLOSED (D-13)
   No change required: the save procedure inserts the row.
   Optional: a display-name column; otherwise the name is derived from the path.
   ---------------------------------------------------------------------------- */
-- ALTER TABLE dbo.AVIV_FILE ADD TEXT_FILE_NAME nvarchar(255) NULL;   -- optional

/* ----------------------------------------------------------------------------
   9. AVIV_TRAINEE_RESTRICTION (feature 03 - outside this scope)         CLOSED (D-12)
   The trainee key is unified to IDNT_TRAINEE across all tables.
   ---------------------------------------------------------------------------- */
-- EXEC sp_rename 'dbo.AVIV_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_DATA', 'IDNT_TRAINEE', 'COLUMN';

/* ----------------------------------------------------------------------------
   10. Table type for passing strings (phone numbers) with their order    PROPOSED (P-13)
   INT_TABLE is left untouched.
   ---------------------------------------------------------------------------- */
IF TYPE_ID('dbo.VARCHAR_TABLE') IS NULL
BEGIN
    CREATE TYPE dbo.VARCHAR_TABLE AS TABLE
    (
        NUMB_ORDER   int         NOT NULL PRIMARY KEY,
        TEXT_GENERAL varchar(20) NOT NULL
    );
END;
GO

/* ----------------------------------------------------------------------------
   11. Environment checks (answers to Q-2, Q-3, Q-4; read-only, run once)
   ---------------------------------------------------------------------------- */
-- SELECT GETDATE() AS server_now, SYSDATETIMEOFFSET() AS server_now_with_offset;                       -- Q-3
-- SELECT name, collation_name, is_read_committed_snapshot_on FROM sys.databases WHERE name = DB_NAME(); -- Q-2, Q-4
