USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   09-11-26
-- Description:   עדכון "הגבלה לחניך" – גרסה חדשה (D-1): השורה הקודמת נתפסת ומכובה (LOGI_ACTIVE = 0) יחד עם שורת
--                התנאים הצמודה שלה ומכשיריה, ונוצרת שורת הגבלה חדשה לאותו חניך, עם שורת תנאים חדשה כשיש שעות או
--                מכשירים. החניך נלקח מהשורה הקודמת ב-DB, לא מהבקשה (T-9). אין הצבעה מחדש – שום דבר מלבד שורת
--                התנאים אינו מצביע על הגבלת חניך (T-7). בדיקה: השורה הקודמת קיימת, פעילה ולא הסתיימה (409).
--                התוצאה: המזהה החדש. 02-architecture.md §9.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_UPDATE_TRAINEE_RESTRICTION]
    @IDNT_PREVIOUS              INT,                      -- שורת ההגבלה הקודמת (AVIV_TRAINEE_RESTRICTION)
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
    DROP TABLE IF EXISTS #Devices;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @Now DATETIME                = GETDATE();
    DECLARE @Today DATE                  = CAST(GETDATE() AS DATE);  -- P-10, A-8: השוואות ברמת יום, יום הסיום כלול
    DECLARE @RestrictionTypeTrainee INT  = 1;                        -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלת חניך
    DECLARE @HasInlineConditions BIT;
    DECLARE @FileId INT;

    -- הגרסה הקודמת
    DECLARE @TraineeId INT, @PreviousInlineConditionsId INT;

    -- הגרסה החדשה
    DECLARE @TraineeRestrictionId INT, @InlineConditionsId INT;

    -- ===========================================
    -- רשימות הבקשה
    -- ===========================================
    CREATE TABLE #Devices (DeviceId INT PRIMARY KEY);     -- A-1: כפילויות מכשירים נמנעות כאן

    INSERT INTO #Devices (DeviceId)
    SELECT  DISTINCT DEVICE_LIST.IDNT_GENERAL
    FROM    @IDNT_DEVICE_LIST AS DEVICE_LIST;

    -- T-2: שורת תנאים נוצרת רק כשיש שעות או מכשירים; המשך לבדו יושב על שורת ההגבלה ואינו מצריך אותה
    SET @HasInlineConditions = CASE
                                   WHEN @TIME_PERMIT_START IS NOT NULL
                                     OR EXISTS (SELECT 1 FROM #Devices) THEN 1
                                   ELSE 0
                               END;

    BEGIN TRANSACTION;

    -- ===========================================
    -- מפתחות הגרסה הקודמת
    -- ===========================================
    -- T-9: החניך נלקח מהשורה הקודמת, לא מהבקשה
    SELECT  @TraineeId = IDNT_TRAINEE
    FROM    dbo.AVIV_TRAINEE_RESTRICTION
    WHERE   IDNT_AVIV_TRAINEE_RESTRICTION = @IDNT_PREVIOUS;

    -- ===========================================
    -- תפיסת הגרסה הקודמת
    -- ===========================================
    -- A-2: משפט אחד תופס את השורה הקודמת; אם אינה קיימת, כבר הוחלפה או הסתיימה – 409 (ספק 03 form §1–§2: עורכים רק רשומה פעילה או עתידית)
    UPDATE  dbo.AVIV_TRAINEE_RESTRICTION
    SET     LOGI_ACTIVE = 0, DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID
    WHERE   IDNT_AVIV_TRAINEE_RESTRICTION = @IDNT_PREVIOUS
      AND   LOGI_ACTIVE = 1
      AND   CAST(DATE_RESTRICTION_END AS DATE) >= @Today;

    IF @@ROWCOUNT = 0 THROW 50409, 'idntPrevious', 1;

    -- ===========================================
    -- כיבוי שורת התנאים הקודמת ומכשיריה
    -- ===========================================
    -- P-4: שורות הבנים מכובות יחד עם הגרסה שהוחלפה, בין שלגרסה החדשה יש תנאים ובין שלא
    SELECT  @PreviousInlineConditionsId = IDNT_AVIV_PERMITS_FOR_RESTRICTION
    FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION
    WHERE   IDNT_AVIV_RESTRICTION_TABLE = @IDNT_PREVIOUS
      AND   CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee
      AND   LOGI_RESTRICTION_INLINE_PERMIT = 1
      AND   LOGI_ACTIVE = 1;

    UPDATE  dbo.AVIV_PERMITS_FOR_RESTRICTION
    SET     LOGI_ACTIVE = 0, DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID
    WHERE   IDNT_AVIV_PERMITS_FOR_RESTRICTION = @PreviousInlineConditionsId;

    UPDATE  dbo.AVIV_PERMITS_DEVICE
    SET     LOGI_ACTIVE = 0, DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID
    WHERE   IDNT_AVIV_PERMITS_FOR_RESTRICTION = @PreviousInlineConditionsId
      AND   LOGI_ACTIVE = 1;

    -- ===========================================
    -- קובץ האישור
    -- ===========================================
    -- D-13: שורת קובץ אחת לכל גרסה, באותה טרנזקציה
    INSERT INTO dbo.AVIV_FILE
            (TEXT_FILE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@TEXT_FILE, @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @FileId = SCOPE_IDENTITY();

    -- ===========================================
    -- שורת ההגבלה החדשה
    -- ===========================================
    -- T-1, T-5: RESTRICTION_UID ו-CODE_RESTRICTION אינם נכתבים
    INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION
            (IDNT_TRAINEE, DATE_RESTRICTION_START, DATE_RESTRICTION_END, NUMB_DURATION_LIMIT,
             TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@TraineeId, @DATE_RESTRICTION_START, @DATE_RESTRICTION_END, @NUMB_DURATION_LIMIT,
             @TEXT_RESTRICTION_REASON, @FileId, @IDNT_USER_APPROVAL,
             @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @TraineeRestrictionId = SCOPE_IDENTITY();

    -- ===========================================
    -- שורת התנאים הפנימית ומכשיריה
    -- ===========================================
    -- D-2, D-3: שורת היתר צמודה (דגל 1); I-2: תאריכי ההגבלה מועתקים אליה;
    -- T-2: בלי NUMB_DURATION_LIMIT (הוא על שורת ההגבלה); P-3: בלי פירוט ואישור
    IF @HasInlineConditions = 1
    BEGIN
        INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
                (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
                 DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END,
                 DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
        VALUES  (@TraineeRestrictionId, @RestrictionTypeTrainee, @TraineeId, 1,
                 @DATE_RESTRICTION_START, @DATE_RESTRICTION_END, @TIME_PERMIT_START, @TIME_PERMIT_END,
                 @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

        SET @InlineConditionsId = SCOPE_IDENTITY();

        INSERT INTO dbo.AVIV_PERMITS_DEVICE
                (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE,
                 DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
        SELECT  @InlineConditionsId, DEVICES.DeviceId,
                @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
        FROM    #Devices AS DEVICES;
    END

    -- T-7: אין הצבעה מחדש – להגבלת חניך אין היתרי משתמש שמצביעים עליה

    COMMIT TRANSACTION;

    -- ===========================================
    -- המזהה שנוצר (CreatedIdRow)
    -- ===========================================
    SELECT  @TraineeRestrictionId AS CreatedId;
END
GO
