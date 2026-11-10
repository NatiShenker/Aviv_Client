/* ============================================================================
   Aviv - trainees list
   Test data for SSMS: Aviv rows for ONE real trainee of the development
   environment, so that every flag of SP_AVIV_GET_TRAINEES can be seen lit,
   plus example EXEC calls for the three ways of filtering (institutes, wings,
   both).

   The trainees themselves live in ODSINTERNALDATA..TRAINEE_SNAPSHOT, which this
   repository never writes (L-10). Set the two ids at the top:
     @TestInstitutionId - a development institute
     @TestTraineeId     - a trainee of that institute (LOGI_ACTIVE = 1 row)
   Without them the script prints a message and stops.

   Re-runnable: every row this script inserts carries the sentinel
   LAST_REQUEST_UID @TestRequestUid, and the cleanup block removes exactly those
   rows - nothing else of the real trainee is touched. To remove the rows after
   the API smoke tests, run the cleanup block alone (it is self-contained).

   Prerequisites:
     - The 04 and 03 schema scripts applied; SP_AVIV_GET_TRAINEES created.
     - AVIV_TRAINEE_MESSAGE: its columns beyond IDNT_TRAINEE, DATE_MESSAGE_END and
       LOGI_INTERACTIVE_MESSAGE are assumed (LQ-1). The two message inserts run in
       their own TRY / CATCH, so a NOT NULL column this script does not know fails
       as a grid, not as a rollback of the whole scenario.

   Scenario for the trainee (today-relative dates):
     T1  03 restriction, 10 minutes, active        (-5 .. +30)  -> HasActiveMinutesRestriction 1, DateRestrictedUntil = today + 30
     T2  03 restriction, full, ended               (-60 .. -10) -> no effect
     T3  04 trainee-scope number restriction       (-5 .. +30)  -> HasActivePhoneRestriction 1 (own restriction, L-4)
     T4  04 permit on T3, active, by its own dates (today .. +20) -> HasActivePhonePermit 1
     T5  05 interactive message, active            (-1 .. +10)  -> HasActiveInteractiveMessage 1
     T6  05 regular message, ended                 (-20 .. -2)  -> no effect (HasActiveMessage 0)
   Expected row of the trainee after the inserts: Full 0, Minutes 1, PhoneRestriction 1,
   PhonePermit 1, Message 0, Interactive 1, DateRestrictedUntil = today + 30.
   ============================================================================ */

USE [ZeroThree03];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ===========================================
-- קבועי הבדיקה (L-10)
-- ===========================================
DECLARE @TestInstitutionId      INT = 0;                 -- ← למלא: פנימיית פיתוח
DECLARE @TestTraineeId          INT = 0;                 -- ← למלא: חניך אמיתי של אותה פנימייה (שורה פעילה ב-TRAINEE_SNAPSHOT)
DECLARE @TestApprover           INT = 999001;            -- IDNT_USER_APPROVAL – סנטינל, כמו ב-03/04
DECLARE @TestUser               INT = 999999;            -- IDNT_USER_UPDATE – המשתמש הפועל
DECLARE @TestRequestUid         UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000998101';   -- החותמת: הניקוי מוחק רק לפיה
DECLARE @TestPhoneNumber        VARCHAR(20) = '0599998101';   -- מספר סנטינל להגבלת המספר של התרחיש

DECLARE @RestrictionTypeNumber  INT = 2;                 -- D-10: סוג הגבלה – הגבלה למספר
DECLARE @ScopeTrainee           INT = 2;                 -- D-5: היקף הגבלה – חניך

DECLARE @Today  DATE     = CAST(GETDATE() AS DATE);
DECLARE @Now    DATETIME = GETDATE();

IF @TestInstitutionId = 0 OR @TestTraineeId = 0
BEGIN
    SELECT 'Setup' AS Scenario, 'Set @TestInstitutionId and @TestTraineeId at the top of the script (a real trainee of the development environment), then run again' AS Message;
    RETURN;
END

-- ===========================================
-- ניקוי: כל השורות שנושאות את חותמת הבדיקה, מהבנים אל האבות (L-10)
-- ===========================================
-- ניתן להריץ את הבלוק הזה לבדו (עם הקבועים שמעליו) כדי להסיר את שורות הבדיקה אחרי בדיקות ה-API
BEGIN TRANSACTION;

DELETE PERMIT_DEVICE
FROM   dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE
JOIN   dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT ON PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION = PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION
WHERE  PERMIT.LAST_REQUEST_UID = @TestRequestUid;

DELETE FROM dbo.AVIV_PERMITS_FOR_RESTRICTION    WHERE LAST_REQUEST_UID = @TestRequestUid;
DELETE FROM dbo.AVIV_TRAINEE_RESTRICTION_NUMBER WHERE LAST_REQUEST_UID = @TestRequestUid;
DELETE FROM dbo.AVIV_RESTRICTION_NUMBER         WHERE LAST_REQUEST_UID = @TestRequestUid;
DELETE FROM dbo.AVIV_LIST_PHONE_NUMBER          WHERE LAST_REQUEST_UID = @TestRequestUid;
DELETE FROM dbo.AVIV_TRAINEE_RESTRICTION        WHERE LAST_REQUEST_UID = @TestRequestUid;
DELETE FROM dbo.AVIV_TRAINEE_MESSAGE            WHERE LAST_REQUEST_UID = @TestRequestUid;   -- משוער: עמודת החותמת קיימת גם כאן (LQ-1)
DELETE FROM dbo.AVIV_FILE                       WHERE LAST_REQUEST_UID = @TestRequestUid;

COMMIT TRANSACTION;

-- ===========================================
-- רשימות הקלט לפרוצדורה
-- ===========================================
DECLARE @InstitutionList dbo.INT_TABLE;
INSERT INTO @InstitutionList (IDNT_GENERAL) VALUES (@TestInstitutionId);

DECLARE @EmptyList dbo.INT_TABLE;

-- האגף של חניך הבדיקה, מהשורה הפעילה שלו – לדוגמת הסינון לפי אגפים
DECLARE @TestWingId INT = (SELECT TOP (1) IDNT_WING                      -- משוער (LQ-1)
                           FROM   ODSINTERNALDATA..TRAINEE_SNAPSHOT
                           WHERE  IDNT_TRAINEE = @TestTraineeId AND LOGI_ACTIVE = 1);

DECLARE @WingList dbo.INT_TABLE;
INSERT INTO @WingList (IDNT_GENERAL) SELECT @TestWingId WHERE @TestWingId IS NOT NULL;

-- התוצאה נאספת לטבלה כדי להציג את שורת חניך הבדיקה לבדה ליד הציפיות (הפנימייה כולה יכולה להחזיר מאות שורות)
DECLARE @Result TABLE (
    IdntTrainee INT, NumbPersonalNumber INT NULL, TextFullName NVARCHAR(400) NULL, IdntInstitution INT,
    IdntWing INT NULL, TextWingName NVARCHAR(200) NULL, IdntLocation INT NULL, TextLocationName NVARCHAR(200) NULL,
    DateRestrictedUntil DATETIME NULL,
    HasActiveFullRestriction BIT, HasActiveMinutesRestriction BIT, HasActivePhoneRestriction BIT,
    HasActivePhonePermit BIT, HasActiveMessage BIT, HasActiveInteractiveMessage BIT
);

/* ============================================================================
   Read 0 - before the scenario: the trainee's row as the real data leaves it
   ============================================================================ */

-- ===========================================
-- קריאה 0: הפנימייה לפני התרחיש
-- ===========================================
-- Expected: the trainee appears (a current row in the snapshot); its flags reflect real data only - usually all 0 and
--           DateRestrictedUntil NULL. 'Trainee found' must be 1; 0 means the ids at the top are wrong (LQ-2 if the location is missing).
INSERT INTO @Result
EXEC dbo.SP_AVIV_GET_TRAINEES @IDNT_INSTITUTION_LIST = @InstitutionList, @IDNT_WINGS_LIST = @EmptyList;

SELECT  'Read 0 - before the scenario' AS Scenario,
        (SELECT COUNT(*) FROM @Result) AS TraineesInInstitute,
        (SELECT COUNT(*) FROM @Result WHERE IdntTrainee = @TestTraineeId) AS TraineeFound,         -- expected 1
        RESULT.TextFullName, RESULT.NumbPersonalNumber, RESULT.IdntWing, RESULT.TextWingName, RESULT.IdntLocation, RESULT.TextLocationName,
        RESULT.DateRestrictedUntil, RESULT.HasActiveFullRestriction, RESULT.HasActiveMinutesRestriction,
        RESULT.HasActivePhoneRestriction, RESULT.HasActivePhonePermit, RESULT.HasActiveMessage, RESULT.HasActiveInteractiveMessage
FROM    @Result AS RESULT
WHERE   RESULT.IdntTrainee = @TestTraineeId;

/* ============================================================================
   The scenario rows, stamped with @TestRequestUid
   ============================================================================ */

BEGIN TRANSACTION;

-- ===========================================
-- קובץ אישור אחד לכל רשומות התרחיש
-- ===========================================
DECLARE @FileId INT;

INSERT INTO dbo.AVIV_FILE (TEXT_FILE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES (N'/sites/aviv/approvals/test-data/trainees-list.pdf', @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @FileId = SCOPE_IDENTITY();

-- ===========================================
-- T1: הגבלה לחניך (03), 10 דקות, פעילה → HasActiveMinutesRestriction, DateRestrictedUntil = היום + 30 (L-3)
-- ===========================================
INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
        (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@TestTraineeId, DATEADD(DAY, -5, @Today), DATEADD(DAY, 30, @Today), 10,
         N'בדיקה – רשימת החניכים: הגבלת משך שיחה פעילה', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);

-- ===========================================
-- T2: הגבלה מלאה שהסתיימה → ללא השפעה על הדגלים (לא "פעילה היום")
-- ===========================================
INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
        (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@TestTraineeId, DATEADD(DAY, -60, @Today), DATEADD(DAY, -10, @Today), NULL,
         N'בדיקה – רשימת החניכים: הגבלה מלאה שהסתיימה', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);

-- ===========================================
-- T3: הגבלת מספר של החניך (04, היקף חניך) → HasActivePhoneRestriction (L-4)
-- ===========================================
DECLARE @PhoneNumberId INT, @RestrictionNumberId INT;

INSERT INTO dbo.AVIV_LIST_PHONE_NUMBER (TEXT_PHONE_NUMBER, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES (@TestPhoneNumber, @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @PhoneNumberId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_RESTRICTION_NUMBER
        (IDNT_AVIV_LIST_PHONE_NUMBER, CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END,
         TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@PhoneNumberId, @ScopeTrainee, DATEADD(DAY, -5, @Today), DATEADD(DAY, 30, @Today),
         N'בדיקה – רשימת החניכים: הגבלת מספר של החניך', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);
SET @RestrictionNumberId = SCOPE_IDENTITY();

INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION_NUMBER
        (IDNT_AVIV_RESTRICTION_NUMBER, IDNT_TRAINEE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionNumberId, @TestTraineeId, @Now, @Now, 1, @TestUser, @TestRequestUid);

-- ===========================================
-- T4: היתר של החניך על T3, פעיל לפי תאריכיו שלו → HasActivePhonePermit (L-4)
-- ===========================================
-- D-3: היתר של משתמש = LOGI_RESTRICTION_INLINE_PERMIT 0
INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
        (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
         DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, NUMB_DURATION_LIMIT,
         TEXT_PERMIT_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
         DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
VALUES  (@RestrictionNumberId, @RestrictionTypeNumber, @TestTraineeId, 0,
         @Today, DATEADD(DAY, 20, @Today), CAST('16:00' AS DATETIME), CAST('19:00' AS DATETIME), 15,
         N'בדיקה – רשימת החניכים: היתר פעיל', @FileId, @TestApprover,
         @Now, @Now, 1, @TestUser, @TestRequestUid);

COMMIT TRANSACTION;

-- ===========================================
-- T5, T6: הודעות קוליות (05) – חוזרת פעילה → HasActiveInteractiveMessage; רגילה שהסתיימה → ללא השפעה (L-5)
-- ===========================================
-- העמודות משוערות (LQ-1), ולכן בנפרד וב-TRY/CATCH: כישלון על עמודת NOT NULL לא ידועה מופיע כטבלה ולא מפיל את התרחיש
BEGIN TRY
    INSERT INTO dbo.AVIV_TRAINEE_MESSAGE
            (IDNT_TRAINEE, DATE_MESSAGE_START, DATE_MESSAGE_END, LOGI_INTERACTIVE_MESSAGE,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@TestTraineeId, DATEADD(DAY, -1, @Today), DATEADD(DAY, 10, @Today), 1,
             @Now, @Now, 1, @TestUser, @TestRequestUid),
            (@TestTraineeId, DATEADD(DAY, -20, @Today), DATEADD(DAY, -2, @Today), 0,
             @Now, @Now, 1, @TestUser, @TestRequestUid);

    SELECT 'Messages T5, T6' AS Scenario, 'inserted' AS Result;
END TRY
BEGIN CATCH
    SELECT 'Messages T5, T6' AS Scenario, 'NOT inserted - add the missing columns of AVIV_TRAINEE_MESSAGE to this script (LQ-1)' AS Result,
           ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;

/* ============================================================================
   Read procedure
   ============================================================================ */

-- ===========================================
-- קריאה 1: הפנימייה אחרי התרחיש – שורת חניך הבדיקה ליד הציפיות
-- ===========================================
-- Expected: DateRestrictedUntil = today + 30 (T1; T2 ended), HasActiveFullRestriction 0, HasActiveMinutesRestriction 1,
--           HasActivePhoneRestriction 1 (T3), HasActivePhonePermit 1 (T4), HasActiveMessage 0 (T6 ended),
--           HasActiveInteractiveMessage 1 (T5; 0 if the message inserts failed above). Other trainees: unchanged from Read 0.
DELETE FROM @Result;

INSERT INTO @Result
EXEC dbo.SP_AVIV_GET_TRAINEES @IDNT_INSTITUTION_LIST = @InstitutionList, @IDNT_WINGS_LIST = @EmptyList;

SELECT  'Read 1 - after the scenario' AS Scenario,
        RESULT.IdntTrainee, RESULT.TextFullName,
        RESULT.DateRestrictedUntil,                 -- expected today + 30
        RESULT.HasActiveFullRestriction,            -- expected 0
        RESULT.HasActiveMinutesRestriction,         -- expected 1
        RESULT.HasActivePhoneRestriction,           -- expected 1
        RESULT.HasActivePhonePermit,                -- expected 1
        RESULT.HasActiveMessage,                    -- expected 0
        RESULT.HasActiveInteractiveMessage,         -- expected 1
        CASE WHEN CAST(RESULT.DateRestrictedUntil AS DATE) = DATEADD(DAY, 30, @Today)
              AND RESULT.HasActiveFullRestriction = 0 AND RESULT.HasActiveMinutesRestriction = 1
              AND RESULT.HasActivePhoneRestriction = 1 AND RESULT.HasActivePhonePermit = 1
              AND RESULT.HasActiveMessage = 0
             THEN 'OK' ELSE 'FAIL' END AS Result   -- the interactive flag is checked by eye (depends on the message inserts)
FROM    @Result AS RESULT
WHERE   RESULT.IdntTrainee = @TestTraineeId;

-- ===========================================
-- קריאה 2: לפי האגף של חניך הבדיקה בלבד (L-1: התאמה על IDNT_WING)
-- ===========================================
-- Expected: only the trainees of that wing; the test trainee among them; TraineesInInstitute of Read 0 >= TraineesInWing.
DELETE FROM @Result;

INSERT INTO @Result
EXEC dbo.SP_AVIV_GET_TRAINEES @IDNT_INSTITUTION_LIST = @EmptyList, @IDNT_WINGS_LIST = @WingList;

SELECT  'Read 2 - by the trainee''s wing only' AS Scenario, @TestWingId AS WingId,
        (SELECT COUNT(*) FROM @Result) AS TraineesInWing,
        (SELECT COUNT(*) FROM @Result WHERE IdntTrainee = @TestTraineeId) AS TraineeFound,         -- expected 1
        (SELECT COUNT(*) FROM @Result WHERE IdntWing <> @TestWingId) AS TraineesOfOtherWings;      -- expected 0

-- ===========================================
-- קריאה 3: פנימייה + אגף שלה – האגף נזרק מהרשימה (הפנימייה כבר מבוקשת) והתוצאה כמו קריאה 1
-- ===========================================
DELETE FROM @Result;

INSERT INTO @Result
EXEC dbo.SP_AVIV_GET_TRAINEES @IDNT_INSTITUTION_LIST = @InstitutionList, @IDNT_WINGS_LIST = @WingList;

SELECT  'Read 3 - institute and its wing' AS Scenario,
        (SELECT COUNT(*) FROM @Result) AS Trainees,                                                -- expected = TraineesInInstitute of Read 0
        (SELECT COUNT(*) FROM @Result WHERE IdntTrainee = @TestTraineeId) AS TraineeFound;         -- expected 1

-- ===========================================
-- קריאה 4: שתי רשימות ריקות – אף חניך, בלי שגיאה (הוולידטור בסרביס עוצר את זה ב-400 עוד קודם, L-9)
-- ===========================================
DELETE FROM @Result;

INSERT INTO @Result
EXEC dbo.SP_AVIV_GET_TRAINEES @IDNT_INSTITUTION_LIST = @EmptyList, @IDNT_WINGS_LIST = @EmptyList;

SELECT  'Read 4 - both lists empty' AS Scenario, (SELECT COUNT(*) FROM @Result) AS Trainees;       -- expected 0

-- ===========================================
-- שורות הבדיקה שנשארו (לניקוי בהרצה הבאה, או בבלוק הניקוי לבדו)
-- ===========================================
SELECT  'Test rows by table' AS Scenario,
        (SELECT COUNT(*) FROM dbo.AVIV_TRAINEE_RESTRICTION        WHERE LAST_REQUEST_UID = @TestRequestUid) AS TraineeRestrictions,   -- 2
        (SELECT COUNT(*) FROM dbo.AVIV_RESTRICTION_NUMBER         WHERE LAST_REQUEST_UID = @TestRequestUid) AS NumberRestrictions,    -- 1
        (SELECT COUNT(*) FROM dbo.AVIV_TRAINEE_RESTRICTION_NUMBER WHERE LAST_REQUEST_UID = @TestRequestUid) AS TraineeNumberRows,     -- 1
        (SELECT COUNT(*) FROM dbo.AVIV_PERMITS_FOR_RESTRICTION    WHERE LAST_REQUEST_UID = @TestRequestUid) AS Permits,               -- 1
        (SELECT COUNT(*) FROM dbo.AVIV_TRAINEE_MESSAGE            WHERE LAST_REQUEST_UID = @TestRequestUid) AS Messages,              -- 2 (0 if the inserts failed)
        (SELECT COUNT(*) FROM dbo.AVIV_FILE                       WHERE LAST_REQUEST_UID = @TestRequestUid) AS Files;                 -- 1
GO
