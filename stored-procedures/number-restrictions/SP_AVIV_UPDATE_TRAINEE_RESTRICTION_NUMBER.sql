USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   07-11-26
-- Description:   עדכון "הגבלה למספר" של חניך – גרסה חדשה (D-1): הגרסה הקודמת נתפסת ומכובה (LOGI_ACTIVE = 0),
--                נוצרים אב חדש, שורת חניך חדשה ושורת תנאים חדשה כשיש תנאים, והיתרי המשתמש הפעילים
--                מוצבעים מחדש אל האב החדש. המספר וה-scope נלקחים מהגרסה הקודמת, לא מהבקשה.
--                התוצאה: המזהה החדש בשורת החניך. 02-architecture.md §9.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER]
    @IDNT_PREVIOUS              INT,                      -- שורת החניך הקודמת (AVIV_TRAINEE_RESTRICTION_NUMBER)
    @DATE_RESTRICTION_START     DATETIME,
    @DATE_RESTRICTION_END       DATETIME,
    @NUMB_DURATION_LIMIT        INT = NULL,               -- NULL = הגבלה מלאה
    @TIME_PERMIT_START          DATETIME = NULL,          -- A-8: שעה על תאריך הבסיס 1900-01-01
    @TIME_PERMIT_END            DATETIME = NULL,
    @IDNT_DEVICE_LIST           dbo.INT_TABLE READONLY,
    @TEXT_RESTRICTION_REASON    VARCHAR(1000),            -- D-6: הפירוט החופשי; varchar כמו העמודה (P-9), אורך לפי I-14
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
    DECLARE @Now DATETIME               = GETDATE();
    DECLARE @Today DATE                 = CAST(GETDATE() AS DATE);   -- P-10, A-8: השוואות ברמת יום, יום הסיום כלול
    DECLARE @RestrictionTypeNumber INT  = 2;                         -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלה למספר
    DECLARE @HasConditions BIT;
    DECLARE @FileId INT;

    -- הגרסה הקודמת
    DECLARE @PreviousRestrictionNumberId INT, @PreviousInlineConditionsId INT;
    DECLARE @TraineeId INT, @PhoneNumberId INT, @ScopeCode INT;

    -- הגרסה החדשה
    DECLARE @RestrictionNumberId INT, @TraineeRestrictionNumberId INT, @InlineConditionsId INT;

    -- ===========================================
    -- רשימות הבקשה
    -- ===========================================
    CREATE TABLE #Devices (DeviceId INT PRIMARY KEY);     -- A-1: כפילויות מכשירים נמנעות כאן

    INSERT INTO #Devices (DeviceId)
    SELECT  DISTINCT DEVICE_LIST.IDNT_GENERAL
    FROM    @IDNT_DEVICE_LIST AS DEVICE_LIST;

    -- D-2: שורת תנאים נוצרת רק כשיש מה לשים בה
    SET @HasConditions = CASE
                             WHEN @NUMB_DURATION_LIMIT IS NOT NULL
                               OR @TIME_PERMIT_START IS NOT NULL
                               OR EXISTS (SELECT 1 FROM #Devices) THEN 1
                             ELSE 0
                         END;

    BEGIN TRANSACTION;

    -- ===========================================
    -- מפתחות הגרסה הקודמת
    -- ===========================================
    SELECT  @PreviousRestrictionNumberId = TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER,
            @TraineeId                   = TRAINEE_RESTRICTION.IDNT_TRAINEE,
            @PhoneNumberId               = RESTRICTION.IDNT_AVIV_LIST_PHONE_NUMBER,
            @ScopeCode                   = RESTRICTION.CODE_RESTRICTION_SCOPE
    FROM    dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION
    JOIN    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION
            ON RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
    WHERE   TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER = @IDNT_PREVIOUS;

    -- ===========================================
    -- תפיסת הגרסה הקודמת
    -- ===========================================
    -- A-2: משפט אחד תופס את שורת החניך הקודמת; אם אינה קיימת, כבר הוחלפה או הסתיימה – 409
    UPDATE  TRAINEE_RESTRICTION
    SET     LOGI_ACTIVE = 0, DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID
    FROM    dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION
    JOIN    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION
            ON RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
    WHERE   TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER = @IDNT_PREVIOUS
      AND   TRAINEE_RESTRICTION.LOGI_ACTIVE = 1
      AND   CAST(RESTRICTION.DATE_RESTRICTION_END AS DATE) >= @Today;

    IF @@ROWCOUNT = 0 THROW 50409, 'idntPrevious', 1;

    -- כיבוי האב הקודם
    UPDATE  dbo.AVIV_RESTRICTION_NUMBER
    SET     LOGI_ACTIVE = 0, DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID
    WHERE   IDNT_AVIV_RESTRICTION_NUMBER = @PreviousRestrictionNumberId;

    -- כיבוי שורת התנאים הקודמת ומכשיריה (P-4: בכל טבלה LOGI_ACTIVE = 1 אומר אותו דבר)
    SELECT  @PreviousInlineConditionsId = IDNT_AVIV_PERMITS_FOR_RESTRICTION
    FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION
    WHERE   IDNT_AVIV_RESTRICTION_TABLE = @PreviousRestrictionNumberId
      AND   CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
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
    -- החלפת גרסת האב
    -- ===========================================
    -- A-3: הבלוק הזה חוזר בכל פרוצדורה שיוצרת גרסה של הגבלה, תחת אותה כותרת
    INSERT INTO dbo.AVIV_RESTRICTION_NUMBER
            (IDNT_AVIV_LIST_PHONE_NUMBER, CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END,
             TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@PhoneNumberId, @ScopeCode, @DATE_RESTRICTION_START, @DATE_RESTRICTION_END,
             @TEXT_RESTRICTION_REASON, @FileId, @IDNT_USER_APPROVAL,
             @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @RestrictionNumberId = SCOPE_IDENTITY();

    INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION_NUMBER
            (IDNT_AVIV_RESTRICTION_NUMBER, IDNT_TRAINEE,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@RestrictionNumberId, @TraineeId,
             @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @TraineeRestrictionNumberId = SCOPE_IDENTITY();

    -- ===========================================
    -- תנאי ההגבלה: שורת תנאים צמודה ומכשיריה
    -- ===========================================
    -- D-2, D-3; I-2: תאריכי ההגבלה מועתקים לשורת התנאים; P-3: בלי פירוט ואישור
    IF @HasConditions = 1
    BEGIN
        INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
                (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
                 DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, NUMB_DURATION_LIMIT,
                 DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
        VALUES  (@RestrictionNumberId, @RestrictionTypeNumber, @TraineeId, 1,
                 @DATE_RESTRICTION_START, @DATE_RESTRICTION_END, @TIME_PERMIT_START, @TIME_PERMIT_END, @NUMB_DURATION_LIMIT,
                 @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

        SET @InlineConditionsId = SCOPE_IDENTITY();

        INSERT INTO dbo.AVIV_PERMITS_DEVICE
                (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE,
                 DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
        SELECT  @InlineConditionsId, DEVICES.DeviceId,
                @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
        FROM    #Devices AS DEVICES;
    END

    -- ===========================================
    -- הצבעה מחדש של ההיתרים
    -- ===========================================
    -- D-1: היתרי המשתמש הפעילים עוברים לגרסת האב החדשה; שורת התנאים (דגל 1) כבר כובתה למעלה
    UPDATE  dbo.AVIV_PERMITS_FOR_RESTRICTION
    SET     IDNT_AVIV_RESTRICTION_TABLE = @RestrictionNumberId,
            DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID
    WHERE   IDNT_AVIV_RESTRICTION_TABLE = @PreviousRestrictionNumberId
      AND   CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
      AND   LOGI_RESTRICTION_INLINE_PERMIT = 0
      AND   LOGI_ACTIVE = 1;

    COMMIT TRANSACTION;

    -- ===========================================
    -- המזהה שנוצר (CreatedIdRow)
    -- ===========================================
    SELECT  @TraineeRestrictionNumberId AS CreatedId;
END
GO
