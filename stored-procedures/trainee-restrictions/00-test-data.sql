/* ============================================================================
   Aviv - trainee restrictions (feature 03)
   Test data for SSMS: one trainee's scenario, example EXEC calls for the read
   procedure, and example calls for every path of the two save procedures
   (success, each 400 and 409).

   Re-runnable: the cleanup block removes everything that belongs to the two
   test trainees (998001, 998002) before inserting the scenario again, so the
   rows the save examples create are removed as well. The feature 04 script
   cleans by its phone-number series, so the two scripts never touch each
   other's rows and can run in any order (T-15).

   How to use: run the whole file (F5) and read the result grids top to
   bottom. Every grid starts with a Scenario column; error examples show the
   error number and the field name the procedure threw (50400 / 50409).

   Prerequisites:
     - stored-procedures/schema/01-proposed-schema-changes.sql applied (feature 04:
       LOGI_RESTRICTION_INLINE_PERMIT on AVIV_PERMITS_FOR_RESTRICTION, the DECODE rows).
     - stored-procedures/schema/02-proposed-schema-changes-trainee-restrictions.sql
       applied (the trainee column is named IDNT_TRAINEE).
     - The three procedures of this folder created.
     - The primary keys are IDENTITY columns (I-11).
     - Columns not listed in the inserts are nullable: RESTRICTION_UID (T-1, TQ-1),
       CODE_RESTRICTION (T-5), IDNT_CANCELLED_FILE, LAST_SUCCESS_REQUEST_UID, and on
       the inline rows NUMB_DURATION_LIMIT, TEXT_PERMIT_REASON, the approval,
       institute and location columns (T-2, P-3, P-6).

   Reference tables (users, devices) are not touched: the ids below are
   sentinels that exist nowhere else (Q-1, Q-9). The read procedure LEFT JOINs
   the device names (I-15), so DeviceName comes back empty here - expected.

   Scenario for trainee 998001 (today-relative dates, valid whenever it runs):
     R1  duration-limited, 10 minutes, no hours, no devices   (-5 .. +30)  -> one row only (T-2)
     R2  full, hours 16:00-18:00, devices 999001 and 999002    (-2 .. +20)  -> row + inline row + 2 device rows
     R3  full, ended                                           (-60 .. -10)
     R4  full, future, hours 08:00-12:00 only                  (+3 .. +10)  -> row + inline row, no devices
   Trainee 998002 has no rows (empty history; receives a row in Save 1).
   ============================================================================ */

USE [ZeroThree03];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ===========================================
-- קבועי הבדיקה (T-15)
-- ===========================================
DECLARE @TestTrainee            INT = 998001;       -- החניך של התרחיש
DECLARE @SecondTrainee          INT = 998002;       -- חניך בלי רשומות; מקבל רשומה ביצירה המרובה
DECLARE @TestApprover           INT = 999001;       -- IDNT_USER_APPROVAL
DECLARE @TestUser               INT = 999999;       -- IDNT_USER_UPDATE – המשתמש הפועל
DECLARE @TestDevice1            INT = 999001;
DECLARE @TestDevice2            INT = 999002;
DECLARE @TestRequestUid         UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000998001';

DECLARE @RestrictionTypeTrainee INT = 1;            -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלת חניך

DECLARE @Today  DATE     = CAST(GETDATE() AS DATE);
DECLARE @Now    DATETIME = GETDATE();

BEGIN TRANSACTION;

-- ===========================================
-- ניקוי: כל מה ששייך לשני חניכי הבדיקה, מהבנים אל האבות
-- ===========================================
DECLARE @TestRestrictions TABLE (TraineeRestrictionId INT PRIMARY KEY, FileId INT NULL);

INSERT INTO @TestRestrictions (TraineeRestrictionId, FileId)
SELECT  IDNT_AVIV_TRAINEE_RESTRICTION, IDNT_APPROVED_FILE
FROM    dbo.AVIV_TRAINEE_RESTRICTION
WHERE   IDNT_TRAINEE IN (@TestTrainee, @SecondTrainee);

DECLARE @TestInlineRows TABLE (InlineConditionsId INT PRIMARY KEY);

INSERT INTO @TestInlineRows (InlineConditionsId)
SELECT  INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION
FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS
JOIN    @TestRestrictions AS TEST
        ON TEST.TraineeRestrictionId = INLINE_CONDITIONS.IDNT_AVIV_RESTRICTION_TABLE
WHERE   INLINE_CONDITIONS.CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee;

DELETE  PERMIT_DEVICE
FROM    dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
JOIN    @TestInlineRows AS TEST ON TEST.InlineConditionsId = PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION;

DELETE  INLINE_CONDITIONS
FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS
JOIN    @TestInlineRows AS TEST ON TEST.InlineConditionsId = INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION;

DELETE  RESTRICTION
FROM    dbo.AVIV_TRAINEE_RESTRICTION AS RESTRICTION
JOIN    @TestRestrictions AS TEST ON TEST.TraineeRestrictionId = RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION;

DELETE FROM dbo.AVIV_FILE
WHERE  IDNT_AVIV_FILE IN (SELECT FileId FROM @TestRestrictions WHERE FileId IS NOT NULL);

-- ===========================================
-- קובץ אישור אחד לכל רשומות התרחיש
-- ===========================================
DECLARE @FileId INT;

INSERT INTO dbo.AVIV_FILE (TEXT_FILE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES (N'/sites/aviv/approvals/test-data/trainee-restriction.pdf', @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @FileId = SCOPE_IDENTITY();

-- ===========================================
-- R1: הגבלת משך שיחה, 10 דקות, בלי שעות ומכשירים – שורה אחת בלבד (T-2)
-- ===========================================
DECLARE @RestrictionDurationOnlyId INT;

INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
        (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@TestTrainee, DATEADD(DAY, -5, @Today), DATEADD(DAY, 30, @Today), 10,
         N'בדיקה – הגבלת משך שיחה, 10 דקות, בלי שעות ומכשירים', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionDurationOnlyId = SCOPE_IDENTITY();

-- ===========================================
-- R2: הגבלה מלאה עם שעות ומכשירים – שורה + שורת תנאים צמודה + שני מכשירים
-- ===========================================
DECLARE @RestrictionFullWithConditionsId INT, @InlineConditionsFullId INT;

INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
        (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@TestTrainee, DATEADD(DAY, -2, @Today), DATEADD(DAY, 20, @Today), NULL,
         N'בדיקה – הגבלה מלאה עם שעות ומכשירים', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionFullWithConditionsId = SCOPE_IDENTITY();

-- D-2, D-3: השעות והמכשירים בשורת היתר צמודה (דגל 1); I-2: תאריכי ההגבלה מועתקים אליה; T-2: בלי משך
INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
        (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
         DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionFullWithConditionsId, @RestrictionTypeTrainee, @TestTrainee, 1,
         DATEADD(DAY, -2, @Today), DATEADD(DAY, 20, @Today), CAST('16:00' AS DATETIME), CAST('18:00' AS DATETIME),
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @InlineConditionsFullId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_PERMITS_DEVICE
        (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@InlineConditionsFullId, @TestDevice1, @Now, @Now, 1, @TestUser, @TestRequestUid),
        (@InlineConditionsFullId, @TestDevice2, @Now, @Now, 1, @TestUser, @TestRequestUid);

-- ===========================================
-- R3: הגבלה מלאה שהסתיימה
-- ===========================================
DECLARE @RestrictionEndedId INT;

INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
        (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@TestTrainee, DATEADD(DAY, -60, @Today), DATEADD(DAY, -10, @Today), NULL,
         N'בדיקה – הגבלה מלאה שהסתיימה', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionEndedId = SCOPE_IDENTITY();

-- ===========================================
-- R4: הגבלה מלאה עתידית עם שעות בלבד – שורה + שורת תנאים בלי מכשירים
-- ===========================================
DECLARE @RestrictionFutureId INT, @InlineConditionsFutureId INT;

INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
        (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@TestTrainee, DATEADD(DAY, 3, @Today), DATEADD(DAY, 10, @Today), NULL,
         N'בדיקה – הגבלה עתידית עם שעות בלבד', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionFutureId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
        (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
         DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionFutureId, @RestrictionTypeTrainee, @TestTrainee, 1,
         DATEADD(DAY, 3, @Today), DATEADD(DAY, 10, @Today), CAST('08:00' AS DATETIME), CAST('12:00' AS DATETIME),
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @InlineConditionsFutureId = SCOPE_IDENTITY();

COMMIT TRANSACTION;

-- ===========================================
-- המזהים שנוצרו – לשימוש ידני בקריאות לפרוצדורות
-- ===========================================
SELECT 'Scenario ids' AS Scenario, 'TestTrainee' AS Name, @TestTrainee AS Id UNION ALL
SELECT 'Scenario ids', 'SecondTrainee (no rows)',                 @SecondTrainee                   UNION ALL
SELECT 'Scenario ids', 'R1 RestrictionDurationOnly',              @RestrictionDurationOnlyId       UNION ALL
SELECT 'Scenario ids', 'R2 RestrictionFullWithConditions',        @RestrictionFullWithConditionsId UNION ALL
SELECT 'Scenario ids', 'R2 InlineConditions',                     @InlineConditionsFullId          UNION ALL
SELECT 'Scenario ids', 'R3 RestrictionEnded',                     @RestrictionEndedId              UNION ALL
SELECT 'Scenario ids', 'R4 RestrictionFuture',                    @RestrictionFutureId             UNION ALL
SELECT 'Scenario ids', 'R4 InlineConditions',                     @InlineConditionsFutureId;

/* ============================================================================
   Read procedure
   ============================================================================ */

DECLARE @TraineeList dbo.INT_TABLE;
INSERT INTO @TraineeList (IDNT_GENERAL) VALUES (@TestTrainee);

DECLARE @SecondTraineeList dbo.INT_TABLE;
INSERT INTO @SecondTraineeList (IDNT_GENERAL) VALUES (@SecondTrainee);

DECLARE @BothTraineesList dbo.INT_TABLE;
INSERT INTO @BothTraineesList (IDNT_GENERAL) VALUES (@TestTrainee), (@SecondTrainee);

-- ===========================================
-- קריאה 1: היסטוריית החניך
-- ===========================================
-- Expected:
--   set 1 (restrictions): 4 rows
--     R1: IsEnded 0, ConditionsRowId NULL, NumbDurationLimit 10, times NULL
--     R2: IsEnded 0, ConditionsRowId = R2 InlineConditions, NumbDurationLimit NULL, 16:00-18:00
--     R3: IsEnded 1, ConditionsRowId NULL
--     R4: IsEnded 0 (future counts as not ended, C-11), ConditionsRowId = R4 InlineConditions, 08:00-12:00
--     every row: TextReason filled, TextFile = the test path, IdntUserApproval 999001
--   set 2 (devices, by ConditionsRowId): 2 rows - R2's conditions row -> 999001 and 999002, DeviceName empty
EXEC dbo.SP_AVIV_GET_TRAINEE_RESTRICTIONS @IDNT_TRAINEE_LIST = @TraineeList;

-- ===========================================
-- קריאה 2: חניך בלי הגבלות – שתי תוצאות ריקות, בלי שגיאה
-- ===========================================
EXEC dbo.SP_AVIV_GET_TRAINEE_RESTRICTIONS @IDNT_TRAINEE_LIST = @SecondTraineeList;

-- ===========================================
-- קריאה 3: שני חניכים בקריאה אחת (P-12 בצד הקריאה) – כמו קריאה 1
-- ===========================================
EXEC dbo.SP_AVIV_GET_TRAINEE_RESTRICTIONS @IDNT_TRAINEE_LIST = @BothTraineesList;

/* ============================================================================
   Save procedures
   EXEC parameters must be variables, so the dates, times and lists are
   prepared here once. Error examples run inside TRY / CATCH, so the batch
   continues after each expected failure.
   ============================================================================ */

-- ===========================================
-- הכנות לדוגמאות השמירה
-- ===========================================
DECLARE @SaveRequestUid UNIQUEIDENTIFIER;
DECLARE @SaveFile       NVARCHAR(500) = N'/sites/aviv/approvals/test-data/trainee-restriction-save.pdf';
DECLARE @SaveReason     VARCHAR(1000) = N'בדיקה – שמירה מתוך סקריפט הבדיקה';   -- varchar כמו העמודה (P-9)

DECLARE @TodayDateTime  DATETIME = @Today;
DECLARE @Plus10         DATETIME = DATEADD(DAY, 10, @Today);
DECLARE @Plus15         DATETIME = DATEADD(DAY, 15, @Today);
DECLARE @Plus30         DATETIME = DATEADD(DAY, 30, @Today);
DECLARE @Time17         DATETIME = CAST('17:00' AS DATETIME);
DECLARE @Time19         DATETIME = CAST('19:00' AS DATETIME);

DECLARE @NoDevices dbo.INT_TABLE;                                -- ריק = כל המכשירים
DECLARE @Device2Twice dbo.INT_TABLE;                             -- כפילות מכוונת: הפרוצדורה מסירה אותה (A-1)
INSERT INTO @Device2Twice (IDNT_GENERAL) VALUES (@TestDevice2), (@TestDevice2);
DECLARE @EmptyTraineeList dbo.INT_TABLE;                         -- לדוגמת השגיאה 50400

DECLARE @CreatedIds TABLE (CreatedId INT);

-- ===========================================
-- שמירה 1: יצירה לשני חניכים, בלי משך ושעות, עם מכשיר כפול
-- ===========================================
-- Expected: 2 rows (one restriction per trainee, P-12); each has an inline conditions row (devices exist, T-2)
--           with ONE device row (the duplicate removed, A-1); NumbDurationLimit NULL; times NULL.
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_CREATE_TRAINEE_RESTRICTION
     @IDNT_TRAINEE_LIST = @BothTraineesList,
     @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus15,
     @NUMB_DURATION_LIMIT = NULL, @TIME_PERMIT_START = NULL, @TIME_PERMIT_END = NULL, @IDNT_DEVICE_LIST = @Device2Twice,
     @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

SELECT  'Save 1 - create for two trainees, duplicate device' AS Scenario, CREATED.CreatedId,
        RESTRICTION.IDNT_TRAINEE AS TraineeId,
        RESTRICTION.NUMB_DURATION_LIMIT,                                                     -- expected NULL
        INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION AS InlineConditionsId,           -- expected set
        INLINE_CONDITIONS.TIME_PERMIT_START, INLINE_CONDITIONS.TIME_PERMIT_END,              -- expected NULL
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
         WHERE PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION
           AND PERMIT_DEVICE.LOGI_ACTIVE = 1) AS DeviceRows                                  -- expected 1
FROM    @CreatedIds AS CREATED
JOIN    dbo.AVIV_TRAINEE_RESTRICTION AS RESTRICTION
        ON RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION = CREATED.CreatedId
LEFT JOIN dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS
        ON  INLINE_CONDITIONS.IDNT_AVIV_RESTRICTION_TABLE = RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION
        AND INLINE_CONDITIONS.CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee
        AND INLINE_CONDITIONS.LOGI_RESTRICTION_INLINE_PERMIT = 1
        AND INLINE_CONDITIONS.LOGI_ACTIVE = 1
ORDER BY CREATED.CreatedId;

-- ===========================================
-- שמירה 2: יצירת "משך בלבד" – 20 דקות, בלי שעות ומכשירים
-- ===========================================
-- Expected: 1 row, NumbDurationLimit 20 on the restriction row, InlineConditionsId NULL (no inline row, T-2).
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_CREATE_TRAINEE_RESTRICTION
     @IDNT_TRAINEE_LIST = @TraineeList,
     @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus10,
     @NUMB_DURATION_LIMIT = 20, @TIME_PERMIT_START = NULL, @TIME_PERMIT_END = NULL, @IDNT_DEVICE_LIST = @NoDevices,
     @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

SELECT  'Save 2 - create duration only' AS Scenario, CREATED.CreatedId,
        RESTRICTION.NUMB_DURATION_LIMIT,                                                     -- expected 20
        INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION AS InlineConditionsId            -- expected NULL
FROM    @CreatedIds AS CREATED
JOIN    dbo.AVIV_TRAINEE_RESTRICTION AS RESTRICTION
        ON RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION = CREATED.CreatedId
LEFT JOIN dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS
        ON  INLINE_CONDITIONS.IDNT_AVIV_RESTRICTION_TABLE = RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION
        AND INLINE_CONDITIONS.CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee
        AND INLINE_CONDITIONS.LOGI_RESTRICTION_INLINE_PERMIT = 1
        AND INLINE_CONDITIONS.LOGI_ACTIVE = 1;

-- ===========================================
-- שמירה 3: עדכון R2 – השעות והמכשירים מוסרים, ההגבלה נשארת מלאה
-- ===========================================
-- Expected: Result 'OK'; the old row, its inline row and its devices are inactive; the new version has no
--           inline row (one active row for the restriction across all tables, T-7); the trainee is taken from
--           the previous row (T-9).
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION
     @IDNT_PREVIOUS = @RestrictionFullWithConditionsId,
     @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus30,
     @NUMB_DURATION_LIMIT = NULL, @TIME_PERMIT_START = NULL, @TIME_PERMIT_END = NULL, @IDNT_DEVICE_LIST = @NoDevices,
     @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

DECLARE @NewRestrictionFullId INT = (SELECT MIN(CreatedId) FROM @CreatedIds);

SELECT  'Save 3 - update R2, hours and devices removed' AS Scenario,
        @NewRestrictionFullId AS CreatedId,
        OLD_RESTRICTION.LOGI_ACTIVE AS OldRowActive,                                          -- expected 0
        OLD_INLINE_CONDITIONS.LOGI_ACTIVE AS OldInlineActive,                                 -- expected 0
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
         WHERE PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @InlineConditionsFullId
           AND PERMIT_DEVICE.LOGI_ACTIVE = 1) AS OldInlineActiveDevices,                      -- expected 0
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_FOR_RESTRICTION AS NEW_INLINE_CONDITIONS
         WHERE NEW_INLINE_CONDITIONS.IDNT_AVIV_RESTRICTION_TABLE = @NewRestrictionFullId
           AND NEW_INLINE_CONDITIONS.CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee
           AND NEW_INLINE_CONDITIONS.LOGI_ACTIVE = 1) AS NewInlineRows,                        -- expected 0
        NEW_RESTRICTION.IDNT_TRAINEE AS NewTraineeId,                                         -- expected 998001
        NEW_RESTRICTION.NUMB_DURATION_LIMIT AS NewDuration,                                   -- expected NULL
        CASE WHEN NEW_RESTRICTION.IDNT_TRAINEE = @TestTrainee AND NEW_RESTRICTION.LOGI_ACTIVE = 1
              AND OLD_RESTRICTION.LOGI_ACTIVE = 0 THEN 'OK' ELSE 'FAIL' END AS Result
FROM    dbo.AVIV_TRAINEE_RESTRICTION AS OLD_RESTRICTION
JOIN    dbo.AVIV_PERMITS_FOR_RESTRICTION AS OLD_INLINE_CONDITIONS
        ON OLD_INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @InlineConditionsFullId
JOIN    dbo.AVIV_TRAINEE_RESTRICTION AS NEW_RESTRICTION
        ON NEW_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION = @NewRestrictionFullId
WHERE   OLD_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION = @RestrictionFullWithConditionsId;

-- ===========================================
-- שמירה 4: עדכון R1 – שעות נוספות, המשך נשאר 10
-- ===========================================
-- Expected: the new row has NumbDurationLimit 10 (T-2), a new inline row with 17:00-19:00 and NULL duration,
--           no device rows; the old row is inactive.
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION
     @IDNT_PREVIOUS = @RestrictionDurationOnlyId,
     @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus30,
     @NUMB_DURATION_LIMIT = 10, @TIME_PERMIT_START = @Time17, @TIME_PERMIT_END = @Time19, @IDNT_DEVICE_LIST = @NoDevices,
     @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

DECLARE @NewRestrictionDurationId INT = (SELECT MIN(CreatedId) FROM @CreatedIds);

SELECT  'Save 4 - update R1, hours added' AS Scenario,
        @NewRestrictionDurationId AS CreatedId,
        NEW_RESTRICTION.NUMB_DURATION_LIMIT AS NewDuration,                                   -- expected 10
        NEW_INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION AS NewInlineConditionsId,     -- expected set
        NEW_INLINE_CONDITIONS.TIME_PERMIT_START, NEW_INLINE_CONDITIONS.TIME_PERMIT_END,       -- 17:00, 19:00
        NEW_INLINE_CONDITIONS.NUMB_DURATION_LIMIT AS InlineDuration,                          -- expected NULL (T-2)
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
         WHERE PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = NEW_INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION
           AND PERMIT_DEVICE.LOGI_ACTIVE = 1) AS NewInlineDevices,                            -- expected 0
        OLD_RESTRICTION.LOGI_ACTIVE AS OldRowActive                                           -- expected 0
FROM    dbo.AVIV_TRAINEE_RESTRICTION AS NEW_RESTRICTION
LEFT JOIN dbo.AVIV_PERMITS_FOR_RESTRICTION AS NEW_INLINE_CONDITIONS
        ON  NEW_INLINE_CONDITIONS.IDNT_AVIV_RESTRICTION_TABLE = NEW_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION
        AND NEW_INLINE_CONDITIONS.CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee
        AND NEW_INLINE_CONDITIONS.LOGI_RESTRICTION_INLINE_PERMIT = 1
        AND NEW_INLINE_CONDITIONS.LOGI_ACTIVE = 1
JOIN    dbo.AVIV_TRAINEE_RESTRICTION AS OLD_RESTRICTION
        ON OLD_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION = @RestrictionDurationOnlyId
WHERE   NEW_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION = @NewRestrictionDurationId;

/* ============================================================================
   Error paths. Each call is expected to fail; the CATCH block shows what came
   back: ErrorNumber 50400 / 50409 with the request field name in ErrorMessage.

   There are no CHECK constraints (D-18): date order, duration range and the
   time pair are enforced only by the service validator, so they have no
   example here. Sent straight to the procedures, such values are stored as given.
   ============================================================================ */

-- ===========================================
-- שגיאה 1: עדכון הגבלה שהסתיימה (R3) → 50409 idntPrevious
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION
         @IDNT_PREVIOUS = @RestrictionEndedId,
         @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus10, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 1 - update ended restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 1 - update ended restriction' AS Scenario, '50409 idntPrevious' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 2: עדכון הגבלה שכבר הוחלפה (השורה הישנה של R2) → 50409 idntPrevious
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION
         @IDNT_PREVIOUS = @RestrictionFullWithConditionsId,
         @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus10, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 2 - update replaced restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 2 - update replaced restriction' AS Scenario, '50409 idntPrevious' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 3: עדכון הגבלה שאינה קיימת → 50409 idntPrevious
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION
         @IDNT_PREVIOUS = -1,
         @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus10, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 3 - update unknown restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 3 - update unknown restriction' AS Scenario, '50409 idntPrevious' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 4: יצירה בלי חניכים → 50400 idntTraineeList (I-12)
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_CREATE_TRAINEE_RESTRICTION
         @IDNT_TRAINEE_LIST = @EmptyTraineeList,
         @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus10, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 4 - create, no trainees' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 4 - create, no trainees' AS Scenario, '50400 idntTraineeList' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

/* ============================================================================
   The history after the saves
   ============================================================================ */

-- ===========================================
-- קריאה 4: היסטוריית שני החניכים אחרי השמירות
-- ===========================================
-- Expected:
--   set 1 (restrictions): 7 rows
--     trainee 998001 (6): R1's new version (10 min, ConditionsRowId set, 17:00-19:00), R2's new version
--       (NULL duration, ConditionsRowId NULL), R3 (IsEnded 1), R4 (future, ConditionsRowId set), the Save 1 row
--       (ConditionsRowId set, times NULL), the Save 2 row (20 min, ConditionsRowId NULL)
--     trainee 998002 (1): the Save 1 row
--     not returned: the replaced versions of R1 and R2 (LOGI_ACTIVE 0)
--   set 2 (devices, by ConditionsRowId): 2 rows - device 999002 for each of the two Save 1 conditions rows.
--     Not returned: R2's old devices (inactive); R1-new and R4 have hours only.
EXEC dbo.SP_AVIV_GET_TRAINEE_RESTRICTIONS @IDNT_TRAINEE_LIST = @BothTraineesList;

-- ===========================================
-- חותמות הביקורת (D-14, D-19): כל שורה שנכתבה בשמירה אחת נושאת אותו LAST_REQUEST_UID ואותו IDNT_USER_UPDATE
-- ===========================================
SELECT  'Audit stamps' AS Scenario,
        RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION AS Id, RESTRICTION.IDNT_TRAINEE AS TraineeId,
        RESTRICTION.LOGI_ACTIVE, RESTRICTION.IDNT_USER_UPDATE, RESTRICTION.LAST_REQUEST_UID, RESTRICTION.DATE_CREATED, RESTRICTION.DATE_UPDATED
FROM    dbo.AVIV_TRAINEE_RESTRICTION AS RESTRICTION
WHERE   RESTRICTION.IDNT_TRAINEE IN (@TestTrainee, @SecondTrainee)
ORDER BY RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION;
GO
