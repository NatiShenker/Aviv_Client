USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   07-11-26
-- Description:   יצירת "היתר למספר" לחניכים על הגבלת מקור אחת (D-4: ההיתר מצביע על האב AVIV_RESTRICTION_NUMBER).
--                בדיקות: ההגבלה פעילה, לא הסתיימה וחלה על החניכים (409); תאריכי ההיתר בתוך ההגבלה (400).
--                לכל חניך שורת היתר (דגל 0) ומכשיריה, בטרנזקציה אחת. התוצאה: מזהי ההיתרים שנוצרו (A-14).
--                02-architecture.md §5.1, §10.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER]
    @IDNT_TRAINEE_LIST          dbo.INT_TABLE READONLY,
    @IDNT_INSTITUTION           INT = NULL,               -- C-6: פנימיית החניכים; NULL מדלג על בדיקת הצמצום לפנימייה
    @IDNT_AVIV_RESTRICTION_NUMBER INT,                    -- הגבלת המקור (האב)
    @DATE_PERMIT_START          DATETIME,
    @DATE_PERMIT_END            DATETIME,
    @NUMB_DURATION_LIMIT        INT = NULL,               -- NULL = היתר מלא
    @TIME_PERMIT_START          DATETIME = NULL,          -- A-8: שעה על תאריך הבסיס 1900-01-01
    @TIME_PERMIT_END            DATETIME = NULL,
    @IDNT_DEVICE_LIST           dbo.INT_TABLE READONLY,
    @TEXT_PERMIT_REASON         VARCHAR(1000),            -- D-6: הפירוט החופשי; varchar כמו העמודה (P-9), אורך לפי I-14
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
    DROP TABLE IF EXISTS #Trainees, #Devices, #CreatedPermits;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @Now DATETIME               = GETDATE();
    DECLARE @Today DATE                 = CAST(GETDATE() AS DATE);   -- P-10, A-8: השוואות ברמת יום, יום הסיום כלול
    DECLARE @RestrictionTypeNumber INT  = 2;                         -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלה למספר
    DECLARE @ScopeGeneral INT           = 1;                         -- D-5: DECODE AVIV_RESTRICTION_SCOPE – כללית
    DECLARE @ScopeTrainee INT           = 2;                         -- D-5: DECODE AVIV_RESTRICTION_SCOPE – חניך
    DECLARE @FileId INT;

    -- הגבלת המקור
    DECLARE @RestrictionScopeCode INT, @RestrictionDateStart DATE, @RestrictionDateEnd DATE;
    DECLARE @IsNarrowedToInstitutes BIT, @IsLinkedToTraineeInstitute BIT, @HasTraineeOutsideRestriction BIT;

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

    -- D-18: שדות חובה
    IF NOT EXISTS (SELECT 1 FROM #Trainees) THROW 50400, 'idntTraineeList', 1;

    BEGIN TRANSACTION;

    -- ===========================================
    -- בדיקת הגבלת המקור
    -- ===========================================
    -- ההגבלה קיימת, פעילה ולא הסתיימה (B-3) – אחרת 409
    SELECT  @RestrictionScopeCode = CODE_RESTRICTION_SCOPE,
            @RestrictionDateStart = CAST(DATE_RESTRICTION_START AS DATE),
            @RestrictionDateEnd   = CAST(DATE_RESTRICTION_END AS DATE)
    FROM    dbo.AVIV_RESTRICTION_NUMBER
    WHERE   IDNT_AVIV_RESTRICTION_NUMBER = @IDNT_AVIV_RESTRICTION_NUMBER
      AND   LOGI_ACTIVE = 1
      AND   CAST(DATE_RESTRICTION_END AS DATE) >= @Today;

    IF @RestrictionScopeCode IS NULL THROW 50409, 'idntAvivRestrictionNumber', 1;

    -- הגבלה כללית המצומצמת לפנימיות חלה רק כשיש קישור פעיל לפנימיית החניכים (A-5)
    SET @IsNarrowedToInstitutes = CASE
                                      WHEN EXISTS (SELECT 1
                                                   FROM   dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER
                                                   WHERE  IDNT_AVIV_RESTRICTION_NUMBER = @IDNT_AVIV_RESTRICTION_NUMBER
                                                     AND  LOGI_ACTIVE = 1) THEN 1
                                      ELSE 0
                                  END;

    SET @IsLinkedToTraineeInstitute = CASE
                                          WHEN EXISTS (SELECT 1
                                                       FROM   dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER
                                                       WHERE  IDNT_AVIV_RESTRICTION_NUMBER = @IDNT_AVIV_RESTRICTION_NUMBER
                                                         AND  IDNT_INSTITUTE = @IDNT_INSTITUTION
                                                         AND  LOGI_ACTIVE = 1) THEN 1
                                          ELSE 0
                                      END;

    IF @RestrictionScopeCode = @ScopeGeneral AND @IDNT_INSTITUTION IS NOT NULL
       AND @IsNarrowedToInstitutes = 1 AND @IsLinkedToTraineeInstitute = 0
        THROW 50409, 'idntAvivRestrictionNumber', 1;

    -- הגבלת חניך חלה רק על החניך שלה (D-11); I-3: בבקשה מרובת חניכים כולם חייבים להיות אותו חניך
    SET @HasTraineeOutsideRestriction = CASE
                                            WHEN EXISTS (SELECT 1
                                                         FROM   #Trainees AS TRAINEES
                                                         WHERE  NOT EXISTS (SELECT 1
                                                                            FROM   dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION
                                                                            WHERE  TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = @IDNT_AVIV_RESTRICTION_NUMBER
                                                                              AND  TRAINEE_RESTRICTION.IDNT_TRAINEE = TRAINEES.TraineeId
                                                                              AND  TRAINEE_RESTRICTION.LOGI_ACTIVE = 1)) THEN 1
                                            ELSE 0
                                        END;

    IF @RestrictionScopeCode = @ScopeTrainee AND @HasTraineeOutsideRestriction = 1
        THROW 50409, 'idntAvivRestrictionNumber', 1;

    -- ===========================================
    -- בדיקת תאריכי ההיתר
    -- ===========================================
    -- ספק 04 §2.3: תאריכי ההיתר בתוך תקופת ההגבלה (A-8: ברמת יום)
    IF CAST(@DATE_PERMIT_START AS DATE) < @RestrictionDateStart OR CAST(@DATE_PERMIT_END AS DATE) > @RestrictionDateEnd
        THROW 50400, 'datePermitStart', 1;

    -- ===========================================
    -- קובץ האישור
    -- ===========================================
    -- D-13: שורת קובץ אחת לכל שמירה, באותה טרנזקציה
    INSERT INTO dbo.AVIV_FILE
            (TEXT_FILE, DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    VALUES  (@TEXT_FILE, @Now, @Now, 1, @IDNT_USER, @REQUEST_UID);

    SET @FileId = SCOPE_IDENTITY();

    -- ===========================================
    -- ההיתרים ומכשיריהם
    -- ===========================================
    -- היתר אחד לכל חניך, אותם ערכים (P-12); P-6: IDNT_INSTITUTE ו-IDNT_LOCATION נשארים NULL
    CREATE TABLE #CreatedPermits (PermitId INT PRIMARY KEY);

    INSERT INTO dbo.AVIV_PERMITS_FOR_RESTRICTION
            (IDNT_AVIV_RESTRICTION_TABLE, CODE_RESTRICTION_TYPE, IDNT_TRAINEE, LOGI_RESTRICTION_INLINE_PERMIT,
             DATE_PERMIT_START, DATE_PERMIT_END, TIME_PERMIT_START, TIME_PERMIT_END, NUMB_DURATION_LIMIT,
             TEXT_PERMIT_REASON, IDNT_APPROVED_FILE, IDNT_USER_APPROVAL,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    OUTPUT  INSERTED.IDNT_AVIV_PERMITS_FOR_RESTRICTION INTO #CreatedPermits (PermitId)
    SELECT  @IDNT_AVIV_RESTRICTION_NUMBER, @RestrictionTypeNumber, TRAINEES.TraineeId, 0,
            @DATE_PERMIT_START, @DATE_PERMIT_END, @TIME_PERMIT_START, @TIME_PERMIT_END, @NUMB_DURATION_LIMIT,
            @TEXT_PERMIT_REASON, @FileId, @IDNT_USER_APPROVAL,
            @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
    FROM    #Trainees AS TRAINEES;

    INSERT INTO dbo.AVIV_PERMITS_DEVICE
            (IDNT_AVIV_PERMITS_FOR_RESTRICTION, IDNT_DEVICE,
             DATE_CREATED, DATE_UPDATED, LOGI_ACTIVE, IDNT_USER_UPDATE, LAST_REQUEST_UID)
    SELECT  CREATED_PERMITS.PermitId, DEVICES.DeviceId,
            @Now, @Now, 1, @IDNT_USER, @REQUEST_UID
    FROM    #CreatedPermits AS CREATED_PERMITS
    CROSS JOIN #Devices AS DEVICES;

    COMMIT TRANSACTION;

    -- ===========================================
    -- המזהים שנוצרו (CreatedIdRow)
    -- ===========================================
    SELECT  PermitId AS CreatedId
    FROM    #CreatedPermits
    ORDER BY PermitId;
END
GO
