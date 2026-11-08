USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   07-11-26
-- Description:   איתור ההגבלות שחלות על חניך עבור מספרי טלפון, לבחירת ההגבלה שעליה ייווצר היתר (G-3b).
--                מוחזרות רק הגבלות פעילות שלא הסתיימו (B-3): כלליות לכל הפנימיות, כלליות המצומצמות
--                לפנימיית החניך, ושל החניך עצמו (A-5). ארבע תוצאות (02-architecture.md §3):
--                1 הגבלות, 2 הפנימיות שלהן, 3 היתרי החניך הקיימים עליהן (לא הסתיימו), 4 מכשירי ההיתרים.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT]
    @IDNT_TRAINEE       INT,
    @IDNT_INSTITUTION   INT,              -- B-4: פנימיית החניך מגיעה מהקליינט
    @PHONE_NUMBER_LIST  VARCHAR(500)      -- A-9: מספרים מנורמלים מופרדים בפסיק
AS
BEGIN
    SET NOCOUNT ON;

    -- ===========================================
    -- מחיקת טבלאות זמניות
    -- ===========================================
    DROP TABLE IF EXISTS #Numbers, #Restrictions, #ExistingPermits;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @Today DATE                 = CAST(GETDATE() AS DATE);   -- P-10, A-8: השוואות תאריך ברמת יום, יום הסיום כלול
    DECLARE @RestrictionTypeNumber INT  = 2;                         -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלה למספר
    DECLARE @ScopeGeneral INT           = 1;                         -- D-5: DECODE AVIV_RESTRICTION_SCOPE – כללית
    DECLARE @ScopeTrainee INT           = 2;                         -- D-5: DECODE AVIV_RESTRICTION_SCOPE – חניך
    DECLARE @CodeSugLocationInstitute INT = 3330016;                 -- I-15: סוג מיקום "פנימייה" ב-A_LOCATION, כמו ב-SP_AVIV_GET_LOCATIONS

    -- ===========================================
    -- מספרי הטלפון של הבקשה
    -- ===========================================
    CREATE TABLE #Numbers (PhoneNumber VARCHAR(15) PRIMARY KEY);

    INSERT INTO #Numbers (PhoneNumber)
    SELECT  DISTINCT LTRIM(RTRIM(SPLIT.value))
    FROM    STRING_SPLIT(@PHONE_NUMBER_LIST, ',') AS SPLIT
    WHERE   LTRIM(RTRIM(SPLIT.value)) <> '';

    -- ===========================================
    -- ההגבלות שחלות על החניך
    -- ===========================================
    CREATE TABLE #Restrictions (
        RestrictionNumberId        INT PRIMARY KEY,
        TraineeRestrictionNumberId INT NULL
    );

    INSERT INTO #Restrictions (RestrictionNumberId, TraineeRestrictionNumberId)
    SELECT  RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER,
            TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER
    FROM    #Numbers AS NUMBERS
    JOIN    dbo.AVIV_LIST_PHONE_NUMBER AS PHONE_NUMBER (NOLOCK)
            ON PHONE_NUMBER.TEXT_PHONE_NUMBER = NUMBERS.PhoneNumber
    JOIN    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION (NOLOCK)
            ON RESTRICTION.IDNT_AVIV_LIST_PHONE_NUMBER = PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER
    LEFT JOIN dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION (NOLOCK)
            ON  TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
            AND TRAINEE_RESTRICTION.IDNT_TRAINEE = @IDNT_TRAINEE
            AND TRAINEE_RESTRICTION.LOGI_ACTIVE = 1
    WHERE   RESTRICTION.LOGI_ACTIVE = 1
      AND   CAST(RESTRICTION.DATE_RESTRICTION_END AS DATE) >= @Today
      AND   (
                -- הגבלה כללית: בלי צמצום לפנימיות, או מצומצמת לפנימיית החניך
                (
                    RESTRICTION.CODE_RESTRICTION_SCOPE = @ScopeGeneral
                    AND (
                        NOT EXISTS (
                            SELECT 1
                            FROM   dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER AS ANY_INSTITUTE_LINK (NOLOCK)
                            WHERE  ANY_INSTITUTE_LINK.IDNT_AVIV_RESTRICTION_NUMBER = RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
                              AND  ANY_INSTITUTE_LINK.LOGI_ACTIVE = 1
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM   dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER AS TRAINEE_INSTITUTE_LINK (NOLOCK)
                            WHERE  TRAINEE_INSTITUTE_LINK.IDNT_AVIV_RESTRICTION_NUMBER = RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
                              AND  TRAINEE_INSTITUTE_LINK.IDNT_INSTITUTE = @IDNT_INSTITUTION
                              AND  TRAINEE_INSTITUTE_LINK.LOGI_ACTIVE = 1
                        )
                    )
                )
                -- הגבלה של החניך עצמו
                OR (
                    RESTRICTION.CODE_RESTRICTION_SCOPE = @ScopeTrainee
                    AND TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER IS NOT NULL
                )
            );

    -- ===========================================
    -- היתרי החניך הקיימים על ההגבלות האלה, שלא הסתיימו
    -- ===========================================
    CREATE TABLE #ExistingPermits (
        PermitId            INT PRIMARY KEY,
        RestrictionNumberId INT NOT NULL
    );

    INSERT INTO #ExistingPermits (PermitId, RestrictionNumberId)
    SELECT  PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION,
            PERMIT.IDNT_AVIV_RESTRICTION_TABLE
    FROM    #Restrictions AS KEYS
    JOIN    dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT (NOLOCK)
            ON  PERMIT.IDNT_AVIV_RESTRICTION_TABLE = KEYS.RestrictionNumberId
            AND PERMIT.CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
    WHERE   PERMIT.IDNT_TRAINEE = @IDNT_TRAINEE
      AND   PERMIT.LOGI_RESTRICTION_INLINE_PERMIT = 0      -- D-3: רק היתרים שמשתמש יצר
      AND   PERMIT.LOGI_ACTIVE = 1
      AND   CAST(PERMIT.DATE_PERMIT_END AS DATE) >= @Today;

    -- ===========================================
    -- תוצאה 1: ההגבלות (SourceRestrictionRow)
    -- ===========================================
    SELECT  PHONE_NUMBER.TEXT_PHONE_NUMBER                  AS PhoneNumber,
            RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER        AS RestrictionNumberId,
            KEYS.TraineeRestrictionNumberId                 AS TraineeRestrictionNumberId,
            PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER        AS PhoneNumberId,
            RESTRICTION.CODE_RESTRICTION_SCOPE              AS CodeRestrictionScope,
            RESTRICTION.DATE_RESTRICTION_START              AS DateStart,
            RESTRICTION.DATE_RESTRICTION_END                AS DateEnd,
            RESTRICTION.TEXT_RESTRICTION_REASON             AS TextReason
    FROM    #Restrictions AS KEYS
    JOIN    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION (NOLOCK)
            ON RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = KEYS.RestrictionNumberId
    JOIN    dbo.AVIV_LIST_PHONE_NUMBER AS PHONE_NUMBER (NOLOCK)
            ON PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER = RESTRICTION.IDNT_AVIV_LIST_PHONE_NUMBER
    ORDER BY PHONE_NUMBER.TEXT_PHONE_NUMBER,
             RESTRICTION.CODE_RESTRICTION_SCOPE,
             RESTRICTION.DATE_RESTRICTION_START;

    -- ===========================================
    -- תוצאה 2: הפנימיות של ההגבלות (InstituteRow)
    -- ===========================================
    -- C-9: הקוד עובר לקליינט כמו שהוא; הקליינט גוזר מהפנימיות את התווית (הגבלה כללית בלי פנימיות = "ארצית", עם פנימיות = "הגבלת פנימייה – {שמות}").
    -- I-15: הפנימיות הן שורות A_LOCATION מסוג "פנימייה", כמו ב-SP_AVIV_GET_LOCATIONS; בלי שורה – שם ריק (C-8)
    SELECT  INSTITUTE_LINK.IDNT_AVIV_RESTRICTION_NUMBER     AS RestrictionNumberId,
            INSTITUTE_LINK.IDNT_INSTITUTE                   AS InstituteId,
            ISNULL(INSTITUTE.TEXT_NAME_LOCATION, N'')       AS InstituteName
    FROM    #Restrictions AS KEYS
    JOIN    dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER AS INSTITUTE_LINK (NOLOCK)
            ON INSTITUTE_LINK.IDNT_AVIV_RESTRICTION_NUMBER = KEYS.RestrictionNumberId
    LEFT JOIN ODSINTERNALDATA..A_LOCATION AS INSTITUTE (NOLOCK)
            ON  INSTITUTE.IDNT_LOCATION_TRAINEE = INSTITUTE_LINK.IDNT_INSTITUTE
            AND INSTITUTE.CODE_SUG_LOCATION = @CodeSugLocationInstitute
    WHERE   INSTITUTE_LINK.LOGI_ACTIVE = 1;

    -- ===========================================
    -- תוצאה 3: היתרי החניך הקיימים (ExistingPermitRow)
    -- ===========================================
    SELECT  KEYS.PermitId                                   AS PermitId,
            KEYS.RestrictionNumberId                        AS RestrictionNumberId,
            PERMIT.DATE_PERMIT_START                        AS DateStart,
            PERMIT.DATE_PERMIT_END                          AS DateEnd,
            PERMIT.NUMB_DURATION_LIMIT                      AS NumbDurationLimit,
            PERMIT.TIME_PERMIT_START                        AS TimePermitStart,
            PERMIT.TIME_PERMIT_END                          AS TimePermitEnd
    FROM    #ExistingPermits AS KEYS
    JOIN    dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT (NOLOCK)
            ON PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION = KEYS.PermitId
    ORDER BY PERMIT.DATE_PERMIT_START;

    -- ===========================================
    -- תוצאה 4: מכשירי ההיתרים הקיימים (DeviceRow)
    -- ===========================================
    -- I-15: השם הוא תווית בלבד – LEFT JOIN בלי סינון פעילות; בלי שורה – שם ריק (C-8)
    SELECT  PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION AS ConditionsRowId,
            PERMIT_DEVICE.IDNT_DEVICE                       AS DeviceId,
            ISNULL(DEVICE.TEXT_DEVICE_NAME, N'')            AS DeviceName
    FROM    #ExistingPermits AS KEYS
    JOIN    dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE (NOLOCK)
            ON PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = KEYS.PermitId
    LEFT JOIN dbo.AVIV_DEVICE_DATA AS DEVICE (NOLOCK)
            ON DEVICE.IDNT_DEVICE = PERMIT_DEVICE.IDNT_DEVICE
    WHERE   PERMIT_DEVICE.LOGI_ACTIVE = 1;
END
GO
