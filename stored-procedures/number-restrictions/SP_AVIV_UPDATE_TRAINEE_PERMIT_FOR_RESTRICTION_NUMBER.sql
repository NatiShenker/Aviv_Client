USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   07-11-26
-- Description:   עדכון "היתר למספר" של חניך – גרסה חדשה (D-1): ההיתר הקודם נתפס ומכובה (LOGI_ACTIVE = 0) יחד
--                עם מכשיריו, ונוצר היתר חדש על אותה הגבלה ולאותו חניך. ההגבלה והחניך נלקחים מההיתר הקודם
--                ב-DB, לא מהבקשה. בדיקות: ההגבלה לא הסתיימה (409, B-3); תאריכי ההיתר בתוך ההגבלה (400).
--                התוצאה: מזהה ההיתר החדש. 02-architecture.md §9.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER]
    @IDNT_PREVIOUS              INT,                      -- ההיתר הקודם (AVIV_PERMITS_FOR_RESTRICTION, דגל 0)
    @DATE_PERMIT_START          DATETIME,
    @DATE_PERMIT_END            DATETIME,
    @NUMB_DURATION_LIMIT        INT = NULL,               -- NULL = היתר מלא
    @TIME_PERMIT_START          DATETIME = NULL,          -- A-8: שעה על תאריך הבסיס 1900-01-01
    @TIME_PERMIT_END            DATETIME = NULL,
    @IDNT_DEVICE_LIST           dbo.INT_TABLE READONLY,
    @TEXT_PERMIT_REASON         VARCHAR(1000),            -- D-6: הפירוט החופשי; varchar כמו העמודה (P-9), אורך לפי I-14
    @CODE_PERMIT_REASON         INT = NULL,               -- I-23, Q-12: קוד הסיבה מהרשימה – מתקבל ולא נכתב עד שה-DBA יוסיף את העמודה CODE_PERMIT_REASON
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
    DECLARE @FileId INT;

    -- ההיתר הקודם והגבלת המקור שלו
    DECLARE @RestrictionNumberId INT, @TraineeId INT;
    DECLARE @RestrictionDateStart DATE, @RestrictionDateEnd DATE;

    -- ההיתר החדש
    DECLARE @PermitId INT;

    -- ===========================================
    -- רשימות הבקשה
    -- ===========================================
    CREATE TABLE #Devices (DeviceId INT PRIMARY KEY);     -- A-1: כפילויות מכשירים נמנעות כאן

    INSERT INTO #Devices (DeviceId)
    SELECT  DISTINCT DEVICE_LIST.IDNT_GENERAL
    FROM    @IDNT_DEVICE_LIST AS DEVICE_LIST;

    BEGIN TRANSACTION;

    -- ===========================================
    -- מפתחות ההיתר הקודם
    -- ===========================================
    -- D-1: ההגבלה והחניך נלקחים מההיתר הקודם, לא מהבקשה
    SELECT  @RestrictionNumberId = IDNT_AVIV_RESTRICTION_TABLE,
            @TraineeId           = IDNT_TRAINEE
    FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION
    WHERE   IDNT_AVIV_PERMITS_FOR_RESTRICTION = @IDNT_PREVIOUS
      AND   CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
      AND   LOGI_RESTRICTION_INLINE_PERMIT = 0;

    -- ===========================================
    -- תפיסת ההיתר הקודם
    -- ===========================================
    -- A-2: משפט אחד תופס את ההיתר הקודם; אם אינו קיים, כבר הוחלף או הסתיים – 409
    UPDATE  dbo.AVIV_PERMITS_FOR_RESTRICTION
    SET     LOGI_ACTIVE = 0, DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID
    WHERE   IDNT_AVIV_PERMITS_FOR_RESTRICTION = @IDNT_PREVIOUS
      AND   CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
      AND   LOGI_RESTRICTION_INLINE_PERMIT = 0
      AND   LOGI_ACTIVE = 1
      AND   CAST(DATE_PERMIT_END AS DATE) >= @Today;

    IF @@ROWCOUNT = 0 THROW 50409, 'idntPrevious', 1;

    -- ===========================================
    -- בדיקת הגבלת המקור
    -- ===========================================
    -- B-3: הגבלה שהסתיימה (או הוחלפה בלי הצבעה מחדש) – 409
    SELECT  @RestrictionDateStart = CAST(DATE_RESTRICTION_START AS DATE),
            @RestrictionDateEnd   = CAST(DATE_RESTRICTION_END AS DATE)
    FROM    dbo.AVIV_RESTRICTION_NUMBER
    WHERE   IDNT_AVIV_RESTRICTION_NUMBER = @RestrictionNumberId
      AND   LOGI_ACTIVE = 1
      AND   CAST(DATE_RESTRICTION_END AS DATE) >= @Today;

    IF @RestrictionDateEnd IS NULL THROW 50409, 'idntAvivRestrictionNumber', 1;

    -- ===========================================
    -- בדיקת תאריכי ההיתר
    -- ===========================================
    -- ספק 04 §2.3: תאריכי ההיתר בתוך תקופת ההגבלה (A-8: ברמת יום)
    IF CAST(@DATE_PERMIT_START AS DATE) < @RestrictionDateStart OR CAST(@DATE_PERMIT_END AS DATE) > @RestrictionDateEnd
        THROW 50400, 'datePermitStart', 1;

    -- ===========================================
    -- קובץ האישור
    -- ===========================================
    -- D-13: שורת קובץ אחת לכל גרסה, באותה טרנזקציה
    INSERT INTO dbo.AVIV_FILE
            (TEXT_FILE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@TEXT_FILE, @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @FileId = SCOPE_IDENTITY();

    -- ===========================================
    -- ההיתר החדש ומכשיריו
    -- ===========================================
    -- P-6: IDNT_INSTITUTE ו-IDNT_LOCATION נשארים NULL
    INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
            (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
             DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, NUMB_DURATION_LIMIT,
             TEXT_PERMIT_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@RestrictionNumberId, @RestrictionTypeNumber, @TraineeId, 0,
             @DATE_PERMIT_START, @DATE_PERMIT_END, @TIME_PERMIT_START, @TIME_PERMIT_END, @NUMB_DURATION_LIMIT,
             @TEXT_PERMIT_REASON, @FileId, @IDNT_USER_APPROVAL,
             @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @PermitId = SCOPE_IDENTITY();

    INSERT INTO dbo.AVIV_PERMITS_DEVICE
            (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    SELECT  @PermitId, DEVICES.DeviceId,
            @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
    FROM    #Devices AS DEVICES;

    -- ===========================================
    -- כיבוי מכשירי ההיתר הקודם
    -- ===========================================
    -- P-4: שורות הבנים מכובות יחד עם ההיתר שהוחלף
    UPDATE  dbo.AVIV_PERMITS_DEVICE
    SET     LOGI_ACTIVE = 0, DATE_UPDATED = @Now, IDNT_USER_UPDATE = @IDNT_USER, LAST_REQUEST_UID = @REQUEST_UID
    WHERE   IDNT_AVIV_PERMITS_FOR_RESTRICTION = @IDNT_PREVIOUS
      AND   LOGI_ACTIVE = 1;

    COMMIT TRANSACTION;

    -- ===========================================
    -- המזהה שנוצר (CreatedIdRow)
    -- ===========================================
    SELECT  @PermitId AS CreatedId;
END
GO
