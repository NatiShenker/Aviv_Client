/* ============================================================================
   Aviv - number restrictions and permits (feature 04)
   Test data for SSMS: one trainee's scenario, example EXEC calls for the two
   read procedures, and example calls for every path of the four save
   procedures (success, each 400 and 409, the re-pointing of permits).

   Re-runnable: the cleanup block removes everything that belongs to the test
   phone-number series (05999900xx) before inserting the scenario again, so the
   rows the save examples create are removed as well.

   How to use: run the whole script (F5) and read the result grids top to
   bottom. Every grid starts with a Scenario column; error examples show the
   error number and the field name the procedure threw (50400 / 50409).
   After the run, open TEXT_RESTRICTION_REASON of the inserted rows: the column
   is varchar, so a collation that is not Hebrew shows '????' instead of the
   Hebrew details (Q-2).

   Prerequisites:
     - stored-procedures/schema/01-proposed-schema-changes.sql applied
       (three columns and the DECODE rows; no CHECK constraints, no indexes).
     - The six procedures of this folder created.
     - The primary keys are IDENTITY columns (SCOPE_IDENTITY() is used, I-11).
     - Columns not listed in the inserts are nullable (PHONE_NUMBER_UID,
       CODE_SOURCE_RECORD_TYPE, IDNT_INSTITUTE, IDNT_LOCATION, IDNT_CANCELLED_FILE,
       LAST_SUCCESS_REQUEST_UID, approval columns of child rows - P-3, P-6, B-6, B-7).

   Reference tables (users, devices, institutes) are not touched: the ids below
   are sentinels that exist nowhere else (Q-1, Q-9, Q-10). The read procedures
   LEFT JOIN the institute name (I-15), so for these sentinel ids InstituteName
   comes back empty - that is expected here. Device sets return ids only (E-8).

   Scenario (today-relative dates, so it stays valid whenever it runs):
     N1 0599990001  general restriction narrowed to the trainee's institute (-30 .. +60)
                    + a second general restriction narrowed to ANOTHER institute (excluded by the lookup)
     N2 0599990002  general restriction for all institutes ("national", -10 .. +90)
                    + an active permit of the trainee (today .. +20, 16:00-19:00, 15 min, device 1)
                    + an ended permit of the trainee (-9 .. -1)
     N3 0599990003  the trainee's own restriction with conditions (-5 .. +30; 10 min, 08:00-20:00, devices 1 and 2)
     N4 0599990004  the trainee's own restriction that has ended (-60 .. -10)
                    + a permit of the trainee that still runs (today .. +5) although the restriction ended
                      (possible after a shortening, P-11; used to test B-3)
   ============================================================================ */

USE [ZeroThree03];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ===========================================
-- קבועי הבדיקה
-- ===========================================
DECLARE @TestTrainee            INT = 999001;
DECLARE @OtherTrainee           INT = 999002;       -- חניך אחר – להיתר על הגבלת חניך שאינה שלו
DECLARE @TestInstitute          INT = 999001;       -- פנימיית החניך
DECLARE @OtherInstitute         INT = 999002;       -- פנימייה אחרת – ההגבלה שלה לא אמורה להופיע ב-lookup
DECLARE @TestApprover           INT = 999001;       -- IDNT_USER_APPROVAL
DECLARE @TestUser               INT = 999999;       -- IDNT_USER_UPDATE – המשתמש הפועל
DECLARE @TestDevice1            INT = 999001;
DECLARE @TestDevice2            INT = 999002;
DECLARE @TestRequestUid         UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000999001';

DECLARE @TestNumberPattern      VARCHAR(15) = '05999900%';      -- כל מספרי הבדיקה שייכים לסדרה הזו
DECLARE @NumberGeneralNarrowed  VARCHAR(15) = '0599990001';
DECLARE @NumberNational         VARCHAR(15) = '0599990002';
DECLARE @NumberTraineeOwn       VARCHAR(15) = '0599990003';
DECLARE @NumberEnded            VARCHAR(15) = '0599990004';

DECLARE @RestrictionTypeNumber  INT = 2;            -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלה למספר
DECLARE @ScopeGeneral           INT = 1;            -- D-5
DECLARE @ScopeTrainee           INT = 2;            -- D-5

DECLARE @Today  DATE     = CAST(GETDATE() AS DATE);
DECLARE @Now    DATETIME = GETDATE();

BEGIN TRANSACTION;

-- ===========================================
-- ניקוי: כל מה ששייך לסדרת מספרי הבדיקה, מהבנים אל האבות
-- ===========================================
DECLARE @TestRestrictions TABLE (RestrictionNumberId INT PRIMARY KEY, FileId INT NULL);

INSERT INTO @TestRestrictions (RestrictionNumberId, FileId)
SELECT  RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER, RESTRICTION.IDNT_APPROVED_FILE
FROM    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION
JOIN    dbo.AVIV_LIST_PHONE_NUMBER AS PHONE_NUMBER
        ON PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER = RESTRICTION.IDNT_AVIV_LIST_PHONE_NUMBER
WHERE   PHONE_NUMBER.TEXT_PHONE_NUMBER LIKE @TestNumberPattern;

DECLARE @TestPermits TABLE (PermitId INT PRIMARY KEY, FileId INT NULL);

INSERT INTO @TestPermits (PermitId, FileId)
SELECT  PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION, PERMIT.IDNT_APPROVED_FILE
FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT
JOIN    @TestRestrictions AS TEST
        ON TEST.RestrictionNumberId = PERMIT.IDNT_AVIV_RESTRICTION_TABLE
WHERE   PERMIT.CODE_RESTRICTION_TYPE = @RestrictionTypeNumber;

DELETE  PERMIT_DEVICE
FROM    dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
JOIN    @TestPermits AS TEST ON TEST.PermitId = PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION;

DELETE  PERMIT
FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT
JOIN    @TestPermits AS TEST ON TEST.PermitId = PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION;

DELETE  TRAINEE_RESTRICTION
FROM    dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION
JOIN    @TestRestrictions AS TEST ON TEST.RestrictionNumberId = TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER;

DELETE  INSTITUTE_LINK
FROM    dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER AS INSTITUTE_LINK
JOIN    @TestRestrictions AS TEST ON TEST.RestrictionNumberId = INSTITUTE_LINK.IDNT_AVIV_RESTRICTION_NUMBER;

DELETE  RESTRICTION
FROM    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION
JOIN    @TestRestrictions AS TEST ON TEST.RestrictionNumberId = RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER;

DELETE FROM dbo.AVIV_LIST_PHONE_NUMBER WHERE TEXT_PHONE_NUMBER LIKE @TestNumberPattern;

DELETE FROM dbo.AVIV_FILE
WHERE  IDNT_AVIV_FILE IN (SELECT FileId FROM @TestRestrictions UNION SELECT FileId FROM @TestPermits);

-- ===========================================
-- קובץ אישור אחד לכל רשומות התרחיש
-- ===========================================
DECLARE @FileId INT;

INSERT INTO dbo.AVIV_FILE (TEXT_FILE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES (N'/sites/aviv/approvals/test-data/approval.pdf', @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @FileId = SCOPE_IDENTITY();

-- ===========================================
-- מספרי הטלפון
-- ===========================================
DECLARE @PhoneGeneralNarrowedId INT, @PhoneNationalId INT, @PhoneTraineeOwnId INT, @PhoneEndedId INT;

INSERT INTO dbo.AVIV_LIST_PHONE_NUMBER (TEXT_PHONE_NUMBER, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES (@NumberGeneralNarrowed, @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @PhoneGeneralNarrowedId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_LIST_PHONE_NUMBER (TEXT_PHONE_NUMBER, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES (@NumberNational, @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @PhoneNationalId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_LIST_PHONE_NUMBER (TEXT_PHONE_NUMBER, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES (@NumberTraineeOwn, @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @PhoneTraineeOwnId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_LIST_PHONE_NUMBER (TEXT_PHONE_NUMBER, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES (@NumberEnded, @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @PhoneEndedId = SCOPE_IDENTITY();

-- ===========================================
-- N1: הגבלה כללית מצומצמת לפנימיית החניך, ועוד אחת מצומצמת לפנימייה אחרת
-- ===========================================
DECLARE @RestrictionGeneralNarrowedId INT, @RestrictionOtherInstituteId INT;

INSERT INTO dbo.AVIV_RESTRICTION_NUMBER
        (IDNT_AVIV_LIST_PHONE_NUMBER, CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@PhoneGeneralNarrowedId, @ScopeGeneral, DATEADD(DAY, -30, @Today), DATEADD(DAY, 60, @Today),
         N'בדיקה – הגבלה כללית לפנימיית החניך', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionGeneralNarrowedId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER
        (IDNT_AVIV_RESTRICTION_NUMBER, IDNT_INSTITUTE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionGeneralNarrowedId, @TestInstitute, @Now, @Now, 1, @TestUser, @TestRequestUid);

INSERT INTO dbo.AVIV_RESTRICTION_NUMBER
        (IDNT_AVIV_LIST_PHONE_NUMBER, CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@PhoneGeneralNarrowedId, @ScopeGeneral, DATEADD(DAY, -30, @Today), DATEADD(DAY, 60, @Today),
         N'בדיקה – הגבלה כללית לפנימייה אחרת (לא אמורה להופיע)', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionOtherInstituteId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER
        (IDNT_AVIV_RESTRICTION_NUMBER, IDNT_INSTITUTE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionOtherInstituteId, @OtherInstitute, @Now, @Now, 1, @TestUser, @TestRequestUid);

-- ===========================================
-- N2: הגבלה כללית לכל הפנימיות ("ארצית") + היתר פעיל והיתר שהסתיים של החניך
-- ===========================================
DECLARE @RestrictionNationalId INT, @PermitNationalId INT, @PermitEndedId INT;

INSERT INTO dbo.AVIV_RESTRICTION_NUMBER
        (IDNT_AVIV_LIST_PHONE_NUMBER, CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@PhoneNationalId, @ScopeGeneral, DATEADD(DAY, -10, @Today), DATEADD(DAY, 90, @Today),
         N'בדיקה – הגבלה ארצית', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionNationalId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
        (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
         DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, NUMB_DURATION_LIMIT,
         TEXT_PERMIT_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionNationalId, @RestrictionTypeNumber, @TestTrainee, 0,
         @Today, DATEADD(DAY, 20, @Today), CAST('16:00' AS DATETIME), CAST('19:00' AS DATETIME), 15,
         N'בדיקה – היתר פעיל על ההגבלה הארצית', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @PermitNationalId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_PERMITS_DEVICE
        (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@PermitNationalId, @TestDevice1, @Now, @Now, 1, @TestUser, @TestRequestUid);

INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
        (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
         DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, NUMB_DURATION_LIMIT,
         TEXT_PERMIT_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionNationalId, @RestrictionTypeNumber, @TestTrainee, 0,
         DATEADD(DAY, -9, @Today), DATEADD(DAY, -1, @Today), NULL, NULL, NULL,
         N'בדיקה – היתר שהסתיים על ההגבלה הארצית', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @PermitEndedId = SCOPE_IDENTITY();

-- ===========================================
-- N3: הגבלה של החניך עם תנאים (שורת תנאים צמודה + מכשירים)
-- ===========================================
DECLARE @RestrictionTraineeOwnId INT, @TraineeRestrictionOwnId INT, @InlineConditionsId INT;

INSERT INTO dbo.AVIV_RESTRICTION_NUMBER
        (IDNT_AVIV_LIST_PHONE_NUMBER, CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@PhoneTraineeOwnId, @ScopeTrainee, DATEADD(DAY, -5, @Today), DATEADD(DAY, 30, @Today),
         N'בדיקה – הגבלת חניך עם שעות ומכשירים', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionTraineeOwnId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION_NUMBER
        (IDNT_AVIV_RESTRICTION_NUMBER, IDNT_TRAINEE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionTraineeOwnId, @TestTrainee, @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @TraineeRestrictionOwnId = SCOPE_IDENTITY();

-- D-2: התנאים יושבים בשורת היתר צמודה; I-2: תאריכי ההגבלה מועתקים אליה
INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
        (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
         DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, NUMB_DURATION_LIMIT,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionTraineeOwnId, @RestrictionTypeNumber, @TestTrainee, 1,
         DATEADD(DAY, -5, @Today), DATEADD(DAY, 30, @Today), CAST('08:00' AS DATETIME), CAST('20:00' AS DATETIME), 10,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @InlineConditionsId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_PERMITS_DEVICE
        (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@InlineConditionsId, @TestDevice1, @Now, @Now, 1, @TestUser, @TestRequestUid),
        (@InlineConditionsId, @TestDevice2, @Now, @Now, 1, @TestUser, @TestRequestUid);

-- ===========================================
-- N4: הגבלה של החניך שהסתיימה + היתר שעדיין רץ עליה (P-11; לבדיקת B-3)
-- ===========================================
DECLARE @RestrictionEndedId INT, @TraineeRestrictionEndedId INT, @PermitOnEndedRestrictionId INT;

INSERT INTO dbo.AVIV_RESTRICTION_NUMBER
        (IDNT_AVIV_LIST_PHONE_NUMBER, CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@PhoneEndedId, @ScopeTrainee, DATEADD(DAY, -60, @Today), DATEADD(DAY, -10, @Today),
         N'בדיקה – הגבלת חניך שהסתיימה', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionEndedId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION_NUMBER
        (IDNT_AVIV_RESTRICTION_NUMBER, IDNT_TRAINEE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionEndedId, @TestTrainee, @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @TraineeRestrictionEndedId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
        (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
         DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, NUMB_DURATION_LIMIT,
         TEXT_PERMIT_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionEndedId, @RestrictionTypeNumber, @TestTrainee, 0,
         @Today, DATEADD(DAY, 5, @Today), NULL, NULL, NULL,
         N'בדיקה – היתר על הגבלה שהסתיימה', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @PermitOnEndedRestrictionId = SCOPE_IDENTITY();

COMMIT TRANSACTION;

-- ===========================================
-- המזהים שנוצרו – לשימוש ידני בקריאות לפרוצדורות
-- ===========================================
SELECT 'Scenario ids' AS Scenario, 'TestTrainee' AS Name, @TestTrainee AS Id UNION ALL
SELECT 'Scenario ids', 'TestInstitute',                          @TestInstitute                UNION ALL
SELECT 'Scenario ids', 'RestrictionGeneralNarrowed (N1)',        @RestrictionGeneralNarrowedId UNION ALL
SELECT 'Scenario ids', 'RestrictionOtherInstitute (N1)',         @RestrictionOtherInstituteId  UNION ALL
SELECT 'Scenario ids', 'RestrictionNational (N2)',               @RestrictionNationalId        UNION ALL
SELECT 'Scenario ids', 'PermitNational (N2, active)',            @PermitNationalId             UNION ALL
SELECT 'Scenario ids', 'PermitEnded (N2)',                       @PermitEndedId                UNION ALL
SELECT 'Scenario ids', 'RestrictionTraineeOwn (N3, parent)',     @RestrictionTraineeOwnId      UNION ALL
SELECT 'Scenario ids', 'TraineeRestrictionOwn (N3, trainee row)',@TraineeRestrictionOwnId      UNION ALL
SELECT 'Scenario ids', 'InlineConditions (N3)',                  @InlineConditionsId           UNION ALL
SELECT 'Scenario ids', 'RestrictionEnded (N4, parent)',          @RestrictionEndedId           UNION ALL
SELECT 'Scenario ids', 'TraineeRestrictionEnded (N4, trainee row)', @TraineeRestrictionEndedId UNION ALL
SELECT 'Scenario ids', 'PermitOnEndedRestriction (N4)',          @PermitOnEndedRestrictionId;

/* ============================================================================
   Read procedures
   ============================================================================ */

-- ===========================================
-- קריאה 1: היסטוריית החניך
-- ===========================================
-- Expected:
--   set 1 (restrictions, IsPermit 0): 2 rows - N3 (ConditionsRowId set, 10 min, 08:00-20:00, IsEnded 0)
--                                     and N4 (IsEnded 1, ConditionsRowId NULL)
--   set 2 (permits, IsPermit 1):      3 rows - the active (IsEnded 0) and the ended (IsEnded 1) permit on N2
--                                     (SourceCodeRestrictionScope 1, SourceTraineeRestrictionNumberId NULL)
--                                     and the permit on N4 (SourceCodeRestrictionScope 2, SourceTraineeRestrictionNumberId = N4's trainee row)
--   set 3 (devices, by ConditionsRowId): 3 rows - N3's conditions row (devices 999001, 999002) and the active N2 permit (device 999001)
--   set 4 (institutes): 0 rows (N2 is national, N4 is the trainee's)
DECLARE @TraineeList dbo.INT_TABLE;
INSERT INTO @TraineeList (IDNT_GENERAL) VALUES (@TestTrainee);

EXEC dbo.SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS @IDNT_TRAINEE_LIST = @TraineeList;

-- ===========================================
-- קריאה 2: איתור הגבלות להיתר – כל ארבעת המספרים
-- ===========================================
-- Expected:
--   set 1 (restrictions): 3 rows - N1 narrowed to the trainee's institute (CodeRestrictionScope 1), N2 national (CodeRestrictionScope 1),
--                         N3 the trainee's own (CodeRestrictionScope 2, TraineeRestrictionNumberId set).
--                         Not returned: N1's other-institute restriction, N4 (ended).
--   set 2 (institutes):   1 row - N1 -> 999001
--   set 3 (existing permits): 1 row - the active permit on N2 (the ended one is excluded)
--   set 4 (permit devices): 1 row (device 999001)
EXEC dbo.SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT
     @IDNT_TRAINEE = @TestTrainee,
     @IDNT_INSTITUTION = @TestInstitute,
     @PHONE_NUMBER_LIST = '0599990001, 0599990002,0599990003,0599990004';

-- ===========================================
-- קריאה 3: אותו lookup מפנימייה אחרת – ההגבלה המצומצמת של N1 מתחלפת
-- ===========================================
-- Expected set 1: N1's other-institute restriction, N2, N3 (the trainee's own restriction does not depend on the institute).
EXEC dbo.SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT
     @IDNT_TRAINEE = @TestTrainee,
     @IDNT_INSTITUTION = @OtherInstitute,
     @PHONE_NUMBER_LIST = '0599990001,0599990002,0599990003';

-- ===========================================
-- קריאה 4: מספר ללא הגבלות – תוצאות ריקות
-- ===========================================
EXEC dbo.SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT
     @IDNT_TRAINEE = @TestTrainee,
     @IDNT_INSTITUTION = @TestInstitute,
     @PHONE_NUMBER_LIST = '0599990099';

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
DECLARE @SaveFile       NVARCHAR(500) = N'/sites/aviv/approvals/test-data/save.pdf';
DECLARE @SaveReason     VARCHAR(1000) = N'בדיקה – שמירה מתוך סקריפט הבדיקה';   -- varchar כמו העמודה (P-9)

DECLARE @TodayDateTime  DATETIME = @Today;
DECLARE @Minus3         DATETIME = DATEADD(DAY, -3, @Today);
DECLARE @Plus5          DATETIME = DATEADD(DAY, 5, @Today);
DECLARE @Plus20         DATETIME = DATEADD(DAY, 20, @Today);
DECLARE @Plus45         DATETIME = DATEADD(DAY, 45, @Today);
DECLARE @Plus100        DATETIME = DATEADD(DAY, 100, @Today);   -- מעבר לסיום ההגבלה הארצית (+90)
DECLARE @Time10         DATETIME = CAST('10:00' AS DATETIME);
DECLARE @Time12         DATETIME = CAST('12:00' AS DATETIME);
DECLARE @Time17         DATETIME = CAST('17:00' AS DATETIME);
DECLARE @Time19         DATETIME = CAST('19:00' AS DATETIME);

DECLARE @NoDevices dbo.INT_TABLE;                                -- ריק = כל המכשירים
DECLARE @Device2Twice dbo.INT_TABLE;                             -- כפילות מכוונת: הפרוצדורה מסירה אותה
INSERT INTO @Device2Twice (IDNT_GENERAL) VALUES (@TestDevice2), (@TestDevice2);
DECLARE @OtherTraineeList dbo.INT_TABLE;
INSERT INTO @OtherTraineeList (IDNT_GENERAL) VALUES (@OtherTrainee);

DECLARE @CreatedIds TABLE (CreatedId INT);

-- ===========================================
-- שמירה 1: יצירת הגבלה על שני מספרים חדשים, עם תנאים
-- ===========================================
-- Expected: 2 created ids (one trainee row per number); 0599990005 and 0599990006 appear in AVIV_LIST_PHONE_NUMBER;
--           each restriction has an inline conditions row (20 min, 10:00-12:00) with ONE device row (the duplicate removed).
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER
     @IDNT_TRAINEE_LIST = @TraineeList, @PHONE_NUMBER_LIST = '0599990005,0599990006',
     @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus45,
     @NUMB_DURATION_LIMIT = 20, @TIME_PERMIT_START = @Time10, @TIME_PERMIT_END = @Time12, @IDNT_DEVICE_LIST = @Device2Twice,
     @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

SELECT  'Save 1 - create restriction on two numbers' AS Scenario, CREATED.CreatedId,
        INLINE_CONDITIONS.NUMB_DURATION_LIMIT, INLINE_CONDITIONS.TIME_PERMIT_START, INLINE_CONDITIONS.TIME_PERMIT_END,
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
         WHERE PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION
           AND PERMIT_DEVICE.LOGI_ACTIVE = 1) AS DeviceRows                                     -- expected 1
FROM    @CreatedIds AS CREATED
JOIN    dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION
        ON TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER = CREATED.CreatedId
LEFT JOIN dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS
        ON  INLINE_CONDITIONS.IDNT_AVIV_RESTRICTION_TABLE = TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
        AND INLINE_CONDITIONS.CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
        AND INLINE_CONDITIONS.LOGI_RESTRICTION_INLINE_PERMIT = 1
        AND INLINE_CONDITIONS.LOGI_ACTIVE = 1;

-- ===========================================
-- שמירה 2: יצירת היתר על הגבלת החניך (N3)
-- ===========================================
-- Expected: 1 created id; the permit points to N3's parent and has no device rows.
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
     @IDNT_TRAINEE_LIST = @TraineeList, @IDNT_INSTITUTION = @TestInstitute, @IDNT_AVIV_RESTRICTION_NUMBER = @RestrictionTraineeOwnId,
     @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus5,
     @NUMB_DURATION_LIMIT = NULL, @TIME_PERMIT_START = @Time17, @TIME_PERMIT_END = @Time19, @IDNT_DEVICE_LIST = @NoDevices,
     @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

DECLARE @PermitOnTraineeRestrictionId INT = (SELECT MIN(CreatedId) FROM @CreatedIds);

SELECT 'Save 2 - create permit on the trainee restriction' AS Scenario, @PermitOnTraineeRestrictionId AS CreatedId;

-- ===========================================
-- שמירה 3: עדכון הגבלת החניך (N3) – גרסה חדשה בלי תנאים, וההיתר משמירה 2 מוצבע מחדש
-- ===========================================
-- Expected: Result = 'OK'; the old trainee row, old parent and old inline row are inactive; the old inline devices are inactive.
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER
     @IDNT_PREVIOUS = @TraineeRestrictionOwnId,
     @DATE_RESTRICTION_START = @Minus3, @DATE_RESTRICTION_END = @Plus45,
     @NUMB_DURATION_LIMIT = NULL, @TIME_PERMIT_START = NULL, @TIME_PERMIT_END = NULL, @IDNT_DEVICE_LIST = @NoDevices,
     @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

DECLARE @NewTraineeRestrictionOwnId INT = (SELECT MIN(CreatedId) FROM @CreatedIds);
DECLARE @NewRestrictionTraineeOwnId INT = (SELECT IDNT_AVIV_RESTRICTION_NUMBER FROM dbo.AVIV_TRAINEE_RESTRICTION_NUMBER
                                           WHERE IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER = @NewTraineeRestrictionOwnId);

SELECT  'Save 3 - update restriction, re-pointing' AS Scenario,
        @NewTraineeRestrictionOwnId AS CreatedId,
        @NewRestrictionTraineeOwnId AS NewRestrictionNumberId,
        PERMIT.IDNT_AVIV_RESTRICTION_TABLE AS PermitPointsTo,
        CASE WHEN PERMIT.IDNT_AVIV_RESTRICTION_TABLE = @NewRestrictionTraineeOwnId THEN 'OK' ELSE 'FAIL' END AS Result,
        OLD_TRAINEE_RESTRICTION.LOGI_ACTIVE AS OldTraineeRowActive,       -- expected 0
        OLD_RESTRICTION.LOGI_ACTIVE AS OldParentActive,                   -- expected 0
        OLD_INLINE_CONDITIONS.LOGI_ACTIVE AS OldInlineActive,             -- expected 0
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
         WHERE PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @InlineConditionsId
           AND PERMIT_DEVICE.LOGI_ACTIVE = 1) AS OldInlineActiveDevices    -- expected 0
FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT
JOIN    dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS OLD_TRAINEE_RESTRICTION
        ON OLD_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER = @TraineeRestrictionOwnId
JOIN    dbo.AVIV_RESTRICTION_NUMBER AS OLD_RESTRICTION
        ON OLD_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = @RestrictionTraineeOwnId
JOIN    dbo.AVIV_PERMITS_FOR_RESTRICTION AS OLD_INLINE_CONDITIONS
        ON OLD_INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @InlineConditionsId
WHERE   PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @PermitOnTraineeRestrictionId;

-- ===========================================
-- שמירה 4: יצירת היתר על ההגבלה הכללית המצומצמת לפנימיית החניך (N1)
-- ===========================================
-- Expected: 1 created id.
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
     @IDNT_TRAINEE_LIST = @TraineeList, @IDNT_INSTITUTION = @TestInstitute, @IDNT_AVIV_RESTRICTION_NUMBER = @RestrictionGeneralNarrowedId,
     @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus20,
     @NUMB_DURATION_LIMIT = 30, @TIME_PERMIT_START = NULL, @TIME_PERMIT_END = NULL, @IDNT_DEVICE_LIST = @NoDevices,
     @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

SELECT 'Save 4 - create permit on the institute-narrowed restriction' AS Scenario, CreatedId FROM @CreatedIds;

-- ===========================================
-- שמירה 5: עדכון ההיתר הפעיל על ההגבלה הארצית (N2)
-- ===========================================
-- Expected: 1 created id; the old permit and its device are inactive; the new permit points to the same restriction,
--           same trainee, and has one device row (device 999002).
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
     @IDNT_PREVIOUS = @PermitNationalId,
     @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus45,
     @NUMB_DURATION_LIMIT = NULL, @TIME_PERMIT_START = NULL, @TIME_PERMIT_END = NULL, @IDNT_DEVICE_LIST = @Device2Twice,
     @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

DECLARE @NewPermitNationalId INT = (SELECT MIN(CreatedId) FROM @CreatedIds);

SELECT  'Save 5 - update permit' AS Scenario,
        @NewPermitNationalId AS CreatedId,
        OLD_PERMIT.LOGI_ACTIVE AS OldPermitActive,                                        -- expected 0
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
         WHERE PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @PermitNationalId
           AND PERMIT_DEVICE.LOGI_ACTIVE = 1) AS OldPermitActiveDevices,                  -- expected 0
        CASE WHEN NEW_PERMIT.IDNT_AVIV_RESTRICTION_TABLE = @RestrictionNationalId
              AND NEW_PERMIT.IDNT_TRAINEE = @TestTrainee THEN 'OK' ELSE 'FAIL' END AS Result,
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
         WHERE PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @NewPermitNationalId
           AND PERMIT_DEVICE.LOGI_ACTIVE = 1) AS NewPermitActiveDevices                   -- expected 1
FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION AS OLD_PERMIT
JOIN    dbo.AVIV_PERMITS_FOR_RESTRICTION AS NEW_PERMIT
        ON NEW_PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @NewPermitNationalId
WHERE   OLD_PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION = @PermitNationalId;

-- ===========================================
-- שמירה 6: היתר על הגבלה המצומצמת לפנימייה אחרת, עם IDNT_INSTITUTION = NULL (C-6: הבדיקה מדולגת)
-- ===========================================
-- Expected: 1 created id (the same call with @IDNT_INSTITUTION = @TestInstitute is Error 6 below).
SET @SaveRequestUid = NEWID();
DELETE FROM @CreatedIds;

INSERT INTO @CreatedIds (CreatedId)
EXEC dbo.SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
     @IDNT_TRAINEE_LIST = @TraineeList, @IDNT_INSTITUTION = NULL, @IDNT_AVIV_RESTRICTION_NUMBER = @RestrictionOtherInstituteId,
     @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus5,
     @NUMB_DURATION_LIMIT = NULL, @TIME_PERMIT_START = NULL, @TIME_PERMIT_END = NULL, @IDNT_DEVICE_LIST = @NoDevices,
     @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
     @IDNT_USER = @TestUser, @REQUEST_UID = @SaveRequestUid;

SELECT 'Save 6 - create permit with NULL institution (check skipped)' AS Scenario, CreatedId FROM @CreatedIds;

/* ============================================================================
   Error paths. Each call is expected to fail; the CATCH block shows what came
   back: ErrorNumber 50400 / 50409 with the request field name in ErrorMessage.

   There are no CHECK constraints (owner's decision 2026-11-08, D-18): date
   order, duration range, time pair and phone format are enforced only by the
   service validator, so they have no example here. Sent straight to the
   procedures, such values are stored as given.
   ============================================================================ */

-- ===========================================
-- שגיאה 1: עדכון הגבלה שהסתיימה → 50409 idntPrevious
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER
         @IDNT_PREVIOUS = @TraineeRestrictionEndedId,
         @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 1 - update ended restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 1 - update ended restriction' AS Scenario, '50409 idntPrevious' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 2: עדכון הגבלה שכבר הוחלפה (שורת החניך הישנה של N3) → 50409 idntPrevious
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER
         @IDNT_PREVIOUS = @TraineeRestrictionOwnId,
         @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
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
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER
         @IDNT_PREVIOUS = -1,
         @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 3 - update unknown restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 3 - update unknown restriction' AS Scenario, '50409 idntPrevious' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 4: יצירת הגבלה בלי מספרים → 50400 phoneNumberList (I-12)
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER
         @IDNT_TRAINEE_LIST = @TraineeList, @PHONE_NUMBER_LIST = ' , ',
         @DATE_RESTRICTION_START = @TodayDateTime, @DATE_RESTRICTION_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_RESTRICTION_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 4 - create restriction, no numbers' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 4 - create restriction, no numbers' AS Scenario, '50400 phoneNumberList' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 5: היתר על הגבלה שהסתיימה (N4) → 50409 idntAvivRestrictionNumber
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
         @IDNT_TRAINEE_LIST = @TraineeList, @IDNT_INSTITUTION = @TestInstitute, @IDNT_AVIV_RESTRICTION_NUMBER = @RestrictionEndedId,
         @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 5 - permit on ended restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 5 - permit on ended restriction' AS Scenario, '50409 idntAvivRestrictionNumber' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 6: היתר על הגבלה המצומצמת לפנימייה אחרת → 50409 idntAvivRestrictionNumber
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
         @IDNT_TRAINEE_LIST = @TraineeList, @IDNT_INSTITUTION = @TestInstitute, @IDNT_AVIV_RESTRICTION_NUMBER = @RestrictionOtherInstituteId,
         @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 6 - permit on another institute''s restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 6 - permit on another institute''s restriction' AS Scenario, '50409 idntAvivRestrictionNumber' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 7: היתר לחניך אחר על הגבלת החניך (הגרסה החדשה של N3) → 50409 idntAvivRestrictionNumber (I-3)
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
         @IDNT_TRAINEE_LIST = @OtherTraineeList, @IDNT_INSTITUTION = @TestInstitute, @IDNT_AVIV_RESTRICTION_NUMBER = @NewRestrictionTraineeOwnId,
         @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 7 - permit for another trainee on a trainee restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 7 - permit for another trainee on a trainee restriction' AS Scenario, '50409 idntAvivRestrictionNumber' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 8: היתר עם תאריכים מחוץ להגבלה (N2 מסתיימת ב-+90) → 50400 datePermitStart
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
         @IDNT_TRAINEE_LIST = @TraineeList, @IDNT_INSTITUTION = @TestInstitute, @IDNT_AVIV_RESTRICTION_NUMBER = @RestrictionNationalId,
         @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus100, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 8 - permit dates outside the restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 8 - permit dates outside the restriction' AS Scenario, '50400 datePermitStart' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 9: עדכון היתר שהסתיים → 50409 idntPrevious
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
         @IDNT_PREVIOUS = @PermitEndedId,
         @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 9 - update ended permit' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 9 - update ended permit' AS Scenario, '50409 idntPrevious' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 10: עדכון היתר שההגבלה שלו הסתיימה (B-3) → 50409 idntAvivRestrictionNumber
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
         @IDNT_PREVIOUS = @PermitOnEndedRestrictionId,
         @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 10 - update permit whose restriction ended' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 10 - update permit whose restriction ended' AS Scenario, '50409 idntAvivRestrictionNumber' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage,
           (SELECT LOGI_ACTIVE FROM dbo.AVIV_PERMITS_FOR_RESTRICTION WHERE IDNT_AVIV_PERMITS_FOR_RESTRICTION = @PermitOnEndedRestrictionId) AS PermitStillActive;   -- expected 1 (the claim was rolled back)
END CATCH;

-- ===========================================
-- שגיאה 11: עדכון היתר עם תאריכים מחוץ להגבלה → 50400 datePermitStart
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
         @IDNT_PREVIOUS = @NewPermitNationalId,
         @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus100, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 11 - update permit, dates outside the restriction' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 11 - update permit, dates outside the restriction' AS Scenario, '50400 datePermitStart' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

-- ===========================================
-- שגיאה 12: עדכון היתר שכבר הוחלף (ההיתר הישן של N2) → 50409 idntPrevious
-- ===========================================
BEGIN TRY
    EXEC dbo.SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER
         @IDNT_PREVIOUS = @PermitNationalId,
         @DATE_PERMIT_START = @TodayDateTime, @DATE_PERMIT_END = @Plus5, @IDNT_DEVICE_LIST = @NoDevices,
         @TEXT_PERMIT_REASON = @SaveReason, @IDNT_USER_APPROVAL = @TestApprover, @TEXT_FILE = @SaveFile,
         @IDNT_USER = @TestUser, @REQUEST_UID = @TestRequestUid;
    SELECT 'Error 12 - update replaced permit' AS Scenario, 'FAIL: no error raised' AS Result;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT 'Error 12 - update replaced permit' AS Scenario, '50409 idntPrevious' AS Expected, ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

/* ============================================================================
   The history after the saves
   ============================================================================ */

-- ===========================================
-- קריאה 5: היסטוריית החניך אחרי השמירות
-- ===========================================
-- Expected:
--   set 1 (restrictions, IsPermit 0): 4 rows - N3's new version (ConditionsRowId NULL), N4 (IsEnded 1),
--                                     0599990005, 0599990006 (ConditionsRowId set, 20 min, 10:00-12:00)
--   set 2 (permits, IsPermit 1):      6 rows - the new N2 permit (Save 5), the ended N2 permit (IsEnded 1), the N4 permit,
--                                     the permit on N3 (now pointing to the new parent), the permit on N1 (Save 4), the permit of Save 6
--   set 3 (devices, by ConditionsRowId): 3 rows - device 999002 for each of the two new restrictions' conditions rows,
--                                     and device 999002 of the new N2 permit
--   set 4 (institutes): 2 rows - N1's restriction -> 999001, the other-institute restriction -> 999002
EXEC dbo.SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS @IDNT_TRAINEE_LIST = @TraineeList;
GO

/* ============================================================================
   Manual concurrency test for the get-or-create of phone numbers (I-13)
   Not part of the script above: it needs two SSMS windows.

   Window A:
       BEGIN TRANSACTION;
       DECLARE @T dbo.INT_TABLE; INSERT INTO @T VALUES (999001);
       DECLARE @D dbo.INT_TABLE;
       EXEC dbo.SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER
            @IDNT_TRAINEE_LIST = @T, @PHONE_NUMBER_LIST = '0599990077',
            @DATE_RESTRICTION_START = '2026-01-01', @DATE_RESTRICTION_END = '2026-12-31', @IDNT_DEVICE_LIST = @D,
            @TEXT_RESTRICTION_REASON = 'concurrency A', @IDNT_USER_APPROVAL = 999001, @TEXT_FILE = N'/test/a.pdf',
            @IDNT_USER = 999999, @REQUEST_UID = NEWID();
       -- do NOT commit yet

   Window B (same EXEC, @TEXT_RESTRICTION_REASON = 'concurrency B'): the call waits.
       With the lock timeout of 5 seconds in the procedure, B fails with error 50500
       if A keeps its transaction open longer than that - this is the expected 500.
       Commit A within 5 seconds instead, and B completes right after it.

   Then:  SELECT COUNT(*) FROM dbo.AVIV_LIST_PHONE_NUMBER WHERE TEXT_PHONE_NUMBER = '0599990077';   -- expected 1
   Clean-up: run this script again (the number belongs to the test series).
   ============================================================================ */
