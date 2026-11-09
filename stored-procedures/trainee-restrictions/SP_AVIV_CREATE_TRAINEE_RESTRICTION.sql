USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   09-11-26
-- Description:   יצירת "הגבלה לחניך" לחניכים: שורה אחת ב-AVIV_TRAINEE_RESTRICTION לכל חניך (P-12), בטרנזקציה אחת –
--                הכול או כלום. משך השיחה נשמר על שורת ההגבלה (T-2); כשיש שעות או מכשירים נוצרת לכל חניך שורת תנאים
--                צמודה ב-AVIV_PERMITS_FOR_RESTRICTION (דגל 1) ומכשיריה. T-11: מבוסס-סט – שלוש הוספות עם OUTPUT INTO,
--                כי שורת ההגבלה נושאת את IDNT_TRAINEE והמיפוי חוזר מעצמו. התוצאה: המזהים שנוצרו (A-14).
--                02-architecture.md §10.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_CREATE_TRAINEE_RESTRICTION]
    @IDNT_TRAINEE_LIST          dbo.INT_TABLE READONLY,
    @DATE_RESTRICTION_START     DATETIME,
    @DATE_RESTRICTION_END       DATETIME,
    @NUMB_DURATION_LIMIT        INT = NULL,               -- NULL = הגבלה מלאה (ספק 03 §2.2); T-2: נשמר על שורת ההגבלה
    @TIME_PERMIT_START          DATETIME = NULL,          -- A-8: שעה על תאריך הבסיס 1900-01-01
    @TIME_PERMIT_END            DATETIME = NULL,
    @IDNT_DEVICE_LIST           dbo.INT_TABLE READONLY,
    @TEXT_RESTRICTION_REASON    VARCHAR(1000),            -- T-3: הפירוט החופשי; varchar כמו העמודה (P-9), אורך לפי I-14 / TQ-2
    @CODE_RESTRICTION_REASON    INT = NULL,               -- I-23, Q-12: קוד הסיבה מהרשימה – מתקבל ולא נכתב עד שה-DBA יוסיף את העמודה CODE_RESTRICTION_REASON
    @IDNT_USER_APPROVAL         INT,
    @TEXT_FILE                  NVARCHAR(500),            -- D-13: נתיב הקובץ ב-SharePoint
    @IDNT_USER                  INT,                      -- D-14: המשתמש הפועל
    @REQUEST_UID                UNIQUEIDENTIFIER          -- D-19: מזהה הבקשה, נחתם על כל שורה
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- ===========================================
    -- מחיקת טבלאות זמניות
    -- ===========================================
    DROP TABLE IF EXISTS #Trainees, #Devices, #Created, #InlineRows;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @Now DATETIME                = GETDATE();
    DECLARE @RestrictionTypeTrainee INT  = 1;             -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלת חניך
    DECLARE @HasInlineConditions BIT;
    DECLARE @FileId INT;

    -- ===========================================
    -- רשימות הבקשה
    -- ===========================================
    CREATE TABLE #Trainees (TraineeId INT PRIMARY KEY);

    INSERT INTO #Trainees (TraineeId)
    SELECT  DISTINCT TRAINEE_LIST.IDNT_GENERAL
    FROM    @IDNT_TRAINEE_LIST AS TRAINEE_LIST;

    CREATE TABLE #Devices (DeviceId INT PRIMARY KEY);     -- A-1: כפילויות מכשירים נמנעות כאן

    INSERT INTO #Devices (DeviceId)
    SELECT  DISTINCT DEVICE_LIST.IDNT_GENERAL
    FROM    @IDNT_DEVICE_LIST AS DEVICE_LIST;

    -- D-18, I-12: שדות חובה
    IF NOT EXISTS (SELECT 1 FROM #Trainees) THROW 50400, 'idntTraineeList', 1;

    -- T-2: שורת תנאים נוצרת רק כשיש שעות או מכשירים; המשך לבדו יושב על שורת ההגבלה ואינו מצריך אותה
    SET @HasInlineConditions = CASE
                                   WHEN @TIME_PERMIT_START IS NOT NULL
                                     OR EXISTS (SELECT 1 FROM #Devices) THEN 1
                                   ELSE 0
                               END;

    -- ===========================================
    -- המזהים שנוצרים
    -- ===========================================
    CREATE TABLE #Created (
        TraineeRestrictionId INT PRIMARY KEY,
        TraineeId            INT NOT NULL
    );

    CREATE TABLE #InlineRows (InlineConditionsId INT PRIMARY KEY);

    BEGIN TRANSACTION;

    -- ===========================================
    -- קובץ האישור
    -- ===========================================
    -- D-13: שורת קובץ אחת לכל שמירה, באותה טרנזקציה
    INSERT INTO dbo.AVIV_FILE
            (TEXT_FILE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@TEXT_FILE, @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @FileId = SCOPE_IDENTITY();

    -- ===========================================
    -- שורות ההגבלה: אחת לכל חניך
    -- ===========================================
    -- T-1, T-5: RESTRICTION_UID ו-CODE_RESTRICTION אינם נכתבים
    INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
            (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
             TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    OUTPUT  INSERTED.IDNT_AVIV_TRAINEE_RESTRICTION, INSERTED.IDNT_TRAINEE INTO #Created (TraineeRestrictionId, TraineeId)
    SELECT  TRAINEES.TraineeId, @DATE_RESTRICTION_START, @DATE_RESTRICTION_END, @NUMB_DURATION_LIMIT,
            @TEXT_RESTRICTION_REASON, @FileId, @IDNT_USER_APPROVAL,
            @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
    FROM    #Trainees AS TRAINEES;

    -- ===========================================
    -- שורת התנאים הפנימית ומכשיריה
    -- ===========================================
    -- D-2, D-3: שורת היתר צמודה (דגל 1) לכל הגבלה שנוצרה; I-2: תאריכי ההגבלה מועתקים אליה;
    -- T-2: בלי NUMB_DURATION_LIMIT (הוא על שורת ההגבלה); P-3: בלי פירוט ואישור
    IF @HasInlineConditions = 1
    BEGIN
        INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
                (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
                 DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END,
                 DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
        OUTPUT  INSERTED.IDNT_AVIV_PERMITS_FOR_RESTRICTION INTO #InlineRows (InlineConditionsId)
        SELECT  CREATED.TraineeRestrictionId, @RestrictionTypeTrainee, CREATED.TraineeId, 1,
                @DATE_RESTRICTION_START, @DATE_RESTRICTION_END, @TIME_PERMIT_START, @TIME_PERMIT_END,
                @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
        FROM    #Created AS CREATED;

        INSERT INTO dbo.AVIV_PERMITS_DEVICE
                (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE,
                 DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
        SELECT  INLINE_ROWS.InlineConditionsId, DEVICES.DeviceId,
                @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
        FROM    #InlineRows AS INLINE_ROWS
        CROSS JOIN #Devices AS DEVICES;
    END

    COMMIT TRANSACTION;

    -- ===========================================
    -- המזהים שנוצרו (CreatedIdRow)
    -- ===========================================
    SELECT  TraineeRestrictionId AS CreatedId
    FROM    #Created
    ORDER BY TraineeRestrictionId;
END
GO
