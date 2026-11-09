USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   07-11-26
-- Description:   יצירת "הגבלה למספר" לחניכים: רשומה לכל זוג חניך × מספר (P-12), בטרנזקציה אחת – הכול או כלום.
--                לכל זוג: שורת אב ב-AVIV_RESTRICTION_NUMBER (scope חניך), שורת חניך ב-AVIV_TRAINEE_RESTRICTION_NUMBER,
--                וכשיש תנאים (משך / שעות / מכשירים) שורת תנאים צמודה ב-AVIV_PERMITS_FOR_RESTRICTION ומכשיריה (D-2).
--                התוצאה: המזהים שנוצרו בשורת החניך (A-14). 02-architecture.md §10.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER]
    @IDNT_TRAINEE_LIST          dbo.INT_TABLE READONLY,
    @PHONE_NUMBER_LIST          VARCHAR(500),             -- A-9: מספרים מנורמלים מופרדים בפסיק
    @DATE_RESTRICTION_START     DATETIME,
    @DATE_RESTRICTION_END       DATETIME,
    @NUMB_DURATION_LIMIT        INT = NULL,               -- NULL = הגבלה מלאה
    @TIME_PERMIT_START          DATETIME = NULL,          -- A-8: שעה על תאריך הבסיס 1900-01-01
    @TIME_PERMIT_END            DATETIME = NULL,
    @IDNT_DEVICE_LIST           dbo.INT_TABLE READONLY,
    @TEXT_RESTRICTION_REASON    VARCHAR(1000),            -- D-6: הפירוט החופשי; varchar כמו העמודה (P-9), אורך לפי I-14
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
    DROP TABLE IF EXISTS #Numbers, #Devices, #Pairs;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @Now DATETIME               = GETDATE();
    DECLARE @RestrictionTypeNumber INT  = 2;              -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלה למספר
    DECLARE @ScopeTrainee INT           = 2;              -- D-5: DECODE AVIV_RESTRICTION_SCOPE – חניך
    DECLARE @HasConditions BIT;
    DECLARE @FileId INT;
    DECLARE @LockTimeoutMilliseconds INT = 5000;          -- I-13: המתנה לנעילת ה-get-or-create
    DECLARE @LockResult INT;

    -- ===========================================
    -- רשימות הבקשה
    -- ===========================================
    CREATE TABLE #Numbers (
        PhoneNumber   VARCHAR(15) PRIMARY KEY,
        PhoneNumberId INT NULL
    );

    INSERT INTO #Numbers (PhoneNumber)
    SELECT  DISTINCT LTRIM(RTRIM(SPLIT.value))
    FROM    STRING_SPLIT(@PHONE_NUMBER_LIST, ',') AS SPLIT
    WHERE   LTRIM(RTRIM(SPLIT.value)) <> '';

    CREATE TABLE #Devices (DeviceId INT PRIMARY KEY);     -- A-1: כפילויות מכשירים נמנעות כאן

    INSERT INTO #Devices (DeviceId)
    SELECT  DISTINCT DEVICE_LIST.IDNT_GENERAL
    FROM    @IDNT_DEVICE_LIST AS DEVICE_LIST;

    -- D-18: שדות חובה
    IF NOT EXISTS (SELECT 1 FROM @IDNT_TRAINEE_LIST) THROW 50400, 'idntTraineeList', 1;
    IF NOT EXISTS (SELECT 1 FROM #Numbers)           THROW 50400, 'phoneNumberList', 1;

    -- D-2: שורת תנאים נוצרת רק כשיש מה לשים בה
    SET @HasConditions = CASE
                             WHEN @NUMB_DURATION_LIMIT IS NOT NULL
                               OR @TIME_PERMIT_START IS NOT NULL
                               OR EXISTS (SELECT 1 FROM #Devices) THEN 1
                             ELSE 0
                         END;

    BEGIN TRANSACTION;

    -- ===========================================
    -- נעילת ה-get-or-create של המספרים
    -- ===========================================
    -- I-13: אין אינדקס ייחודי על TEXT_PHONE_NUMBER, ולכן שתי שמירות מקבילות של אותו מספר חדש היו יוצרות שתי שורות מילון.
    --       נעילת אפליקציה אחת מסדרת לתור את יצירת המספרים עד סוף הטרנזקציה (משוחררת ב-COMMIT או ב-ROLLBACK).
    --       אי-קבלת הנעילה היא שגיאת שרת (500, "נסה שוב"), לא שגיאת קלט.
    EXEC @LockResult = sp_getapplock
         @Resource    = 'AVIV_LIST_PHONE_NUMBER_GET_OR_CREATE',
         @LockMode    = 'Exclusive',
         @LockOwner   = 'Transaction',
         @LockTimeout = @LockTimeoutMilliseconds;

    IF @LockResult < 0 THROW 50500, 'AVIV_LIST_PHONE_NUMBER_GET_OR_CREATE lock was not acquired', 1;

    -- ===========================================
    -- מספרי הטלפון: יצירת החסרים ושליפת המזהים
    -- ===========================================
    -- הנעילה שלמעלה מבטיחה שרק שמירה אחת בכל רגע מגיעה לכאן, ולכן NOT EXISTS מספיק
    INSERT INTO dbo.AVIV_LIST_PHONE_NUMBER
            (TEXT_PHONE_NUMBER, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    SELECT  NUMBERS.PhoneNumber, @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
    FROM    #Numbers AS NUMBERS
    WHERE   NOT EXISTS (
                SELECT 1
                FROM   dbo.AVIV_LIST_PHONE_NUMBER AS EXISTING_NUMBER
                WHERE  EXISTING_NUMBER.TEXT_PHONE_NUMBER = NUMBERS.PhoneNumber
            );

    UPDATE  NUMBERS
    SET     PhoneNumberId = PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER
    FROM    #Numbers AS NUMBERS
    JOIN    dbo.AVIV_LIST_PHONE_NUMBER AS PHONE_NUMBER
            ON PHONE_NUMBER.TEXT_PHONE_NUMBER = NUMBERS.PhoneNumber;

    -- ===========================================
    -- קובץ האישור
    -- ===========================================
    -- D-13: שורת קובץ אחת לכל שמירה, באותה טרנזקציה
    INSERT INTO dbo.AVIV_FILE
            (TEXT_FILE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@TEXT_FILE, @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @FileId = SCOPE_IDENTITY();

    -- ===========================================
    -- הרשומות: זוג חניך × מספר בכל סיבוב
    -- ===========================================
    -- I-1: לולאה פשוטה במקום INSERT מבוסס-סט, כי כל שורת אב צריכה את שורת החניך שלה והכמויות זעירות
    CREATE TABLE #Pairs (
        Seq                        INT IDENTITY(1, 1) PRIMARY KEY,
        TraineeId                  INT NOT NULL,
        PhoneNumberId              INT NOT NULL,
        TraineeRestrictionNumberId INT NULL                -- מתמלא בסיבוב
    );

    INSERT INTO #Pairs (TraineeId, PhoneNumberId)
    SELECT  DISTINCT TRAINEE_LIST.IDNT_GENERAL, NUMBERS.PhoneNumberId
    FROM    @IDNT_TRAINEE_LIST AS TRAINEE_LIST
    CROSS JOIN #Numbers AS NUMBERS;

    DECLARE @Seq INT = 1;
    DECLARE @LastSeq INT = (SELECT MAX(Seq) FROM #Pairs);
    DECLARE @TraineeId INT, @PhoneNumberId INT;
    DECLARE @RestrictionNumberId INT, @TraineeRestrictionNumberId INT, @InlineConditionsId INT;

    WHILE @Seq <= @LastSeq
    BEGIN
        SELECT  @TraineeId = TraineeId, @PhoneNumberId = PhoneNumberId
        FROM    #Pairs
        WHERE   Seq = @Seq;

        -- שורת האב: המספר, התאריכים, הפירוט והאישור
        INSERT INTO dbo.AVIV_RESTRICTION_NUMBER
                (IDNT_AVIV_LIST_PHONE_NUMBER, CODE_RESTRICTION_SCOPE, DATE_RESTRICTION_START, DATE_RESTRICTION_END,
                 TEXT_RESTRICTION_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
                 DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
        VALUES  (@PhoneNumberId, @ScopeTrainee, @DATE_RESTRICTION_START, @DATE_RESTRICTION_END,
                 @TEXT_RESTRICTION_REASON, @FileId, @IDNT_USER_APPROVAL,
                 @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

        SET @RestrictionNumberId = SCOPE_IDENTITY();

        -- שורת החניך (D-11: אחת לאב; המזהה שלה הוא ה-id של הרשומה בקליינט)
        INSERT INTO dbo.AVIV_TRAINEE_RESTRICTION_NUMBER
                (IDNT_AVIV_RESTRICTION_NUMBER, IDNT_TRAINEE,
                 DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
        VALUES  (@RestrictionNumberId, @TraineeId,
                 @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

        SET @TraineeRestrictionNumberId = SCOPE_IDENTITY();

        -- שורת התנאים הצמודה ומכשיריה (D-2, D-3; I-2: תאריכי ההגבלה מועתקים אליה; P-3: בלי פירוט ואישור)
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

        UPDATE  #Pairs
        SET     TraineeRestrictionNumberId = @TraineeRestrictionNumberId
        WHERE   Seq = @Seq;

        SET @Seq += 1;
    END

    COMMIT TRANSACTION;

    -- ===========================================
    -- המזהים שנוצרו (CreatedIdRow)
    -- ===========================================
    SELECT  TraineeRestrictionNumberId AS CreatedId
    FROM    #Pairs
    ORDER BY Seq;
END
GO
