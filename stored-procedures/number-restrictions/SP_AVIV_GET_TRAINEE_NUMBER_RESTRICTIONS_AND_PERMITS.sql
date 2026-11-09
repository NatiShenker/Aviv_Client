USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   07-11-26
-- Description:   שליפת ההיסטוריה המלאה של "הגבלות והיתרים למספר" של חניכים –
--                כל השורות הפעילות (LOGI_ACTIVE = 1), גם אלה שהסתיימו (B-5).
--                ארבע תוצאות, מורכבות לתשובה אחת בסרביס (A-4, 02-architecture.md §3):
--                1 הגבלות, 2 היתרים (אותן עמודות + תקציר הגבלת המקור), 3 מכשירים של שתיהן, 4 פנימיות של הגבלות המקור.
--                I-19: הדגלים IsPermit ו-IsEnded מחושבים כאן, והסרביס מעביר אותם כמו שהם.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS]
    @IDNT_TRAINEE_LIST dbo.INT_TABLE READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- ===========================================
    -- מחיקת טבלאות זמניות
    -- ===========================================
    DROP TABLE IF EXISTS #TraineeRestrictions, #Permits;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @RestrictionTypeNumber INT      = 2;                        -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלה למספר (AVIV_RESTRICTION_NUMBER)
    DECLARE @CodeSugLocationInstitute INT   = 3330016;                  -- I-15: סוג מיקום "פנימייה" ב-A_LOCATION, כמו ב-SP_AVIV_GET_LOCATIONS
    DECLARE @Today DATE                     = CAST(GETDATE() AS DATE);  -- I-19: IsEnded ברמת יום, לפי שעון השרת (Q-3); יום הסיום כלול (A-8)

    -- ===========================================
    -- איסוף מפתחות: הגבלות המספר של החניכים
    -- ===========================================
    CREATE TABLE #TraineeRestrictions (
        TraineeRestrictionNumberId INT PRIMARY KEY,
        RestrictionNumberId        INT NOT NULL,
        InlinePermitId             INT NULL
    );

    INSERT INTO #TraineeRestrictions (TraineeRestrictionNumberId, RestrictionNumberId, InlinePermitId)
    SELECT  TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER,
            TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER,
            INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION
    FROM    dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION (NOLOCK)
    JOIN    @IDNT_TRAINEE_LIST AS TRAINEE_LIST
            ON TRAINEE_LIST.IDNT_GENERAL = TRAINEE_RESTRICTION.IDNT_TRAINEE
    -- D-2, D-3: תנאי ההגבלה (משך / שעות / מכשירים) יושבים בשורת היתר צמודה עם הדגל LOGI_RESTRICTION_INLINE_PERMIT = 1
    LEFT JOIN dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS (NOLOCK)
            ON  INLINE_CONDITIONS.IDNT_AVIV_RESTRICTION_TABLE = TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
            AND INLINE_CONDITIONS.CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
            AND INLINE_CONDITIONS.IDNT_TRAINEE = TRAINEE_RESTRICTION.IDNT_TRAINEE
            AND INLINE_CONDITIONS.LOGI_RESTRICTION_INLINE_PERMIT = 1
            AND INLINE_CONDITIONS.LOGI_ACTIVE = 1
    WHERE   TRAINEE_RESTRICTION.LOGI_ACTIVE = 1;

    -- ===========================================
    -- איסוף מפתחות: היתרי המספר של החניכים
    -- ===========================================
    CREATE TABLE #Permits (
        PermitId            INT PRIMARY KEY,
        RestrictionNumberId INT NOT NULL
    );

    INSERT INTO #Permits (PermitId, RestrictionNumberId)
    SELECT  PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION,
            PERMIT.IDNT_AVIV_RESTRICTION_TABLE
    FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT (NOLOCK)
    JOIN    @IDNT_TRAINEE_LIST AS TRAINEE_LIST
            ON TRAINEE_LIST.IDNT_GENERAL = PERMIT.IDNT_TRAINEE
    WHERE   PERMIT.CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
      AND   PERMIT.LOGI_RESTRICTION_INLINE_PERMIT = 0      -- D-3: רק היתרים שמשתמש יצר; שורת התנאים אינה רשומה בפני עצמה
      AND   PERMIT.LOGI_ACTIVE = 1;

    -- ===========================================
    -- תוצאה 1: הגבלות (PhoneRecordRow, IsPermit = 0)
    -- ===========================================
    -- ConditionsRowId: שורת התנאים הצמודה, שאליה שייכים המכשירים של תוצאה 3 (D-2)
    SELECT  KEYS.TraineeRestrictionNumberId                 AS Id,
            CAST(0 AS BIT)                                  AS IsPermit,
            CAST(CASE WHEN CAST(RESTRICTION.DATE_RESTRICTION_END AS DATE) < @Today THEN 1 ELSE 0 END AS BIT) AS IsEnded,
            KEYS.RestrictionNumberId                        AS RestrictionNumberId,
            KEYS.InlinePermitId                             AS ConditionsRowId,
            TRAINEE_RESTRICTION.IDNT_TRAINEE                AS TraineeId,
            PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER        AS PhoneNumberId,
            PHONE_NUMBER.TEXT_PHONE_NUMBER                  AS PhoneNumber,
            RESTRICTION.DATE_RESTRICTION_START              AS DateStart,
            RESTRICTION.DATE_RESTRICTION_END                AS DateEnd,
            INLINE_CONDITIONS.NUMB_DURATION_LIMIT           AS NumbDurationLimit,
            INLINE_CONDITIONS.TIME_PERMIT_START             AS TimePermitStart,
            INLINE_CONDITIONS.TIME_PERMIT_END               AS TimePermitEnd,
            RESTRICTION.TEXT_RESTRICTION_REASON             AS TextReason,
            RESTRICTION.IDNT_USER_APPROVAL                  AS IdntUserApproval,
            RESTRICTION.IDNT_APPROVED_FILE                  AS IdntApprovedFile,
            APPROVED_FILE.TEXT_FILE                         AS TextFile,
            RESTRICTION.DATE_CREATED                        AS DateCreated,
            RESTRICTION.DATE_UPDATED                        AS DateUpdated,
            RESTRICTION.IDNT_USER_UPDATE                    AS IdntUserUpdate
    FROM    #TraineeRestrictions AS KEYS
    JOIN    dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION (NOLOCK)
            ON TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER = KEYS.TraineeRestrictionNumberId
    JOIN    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION (NOLOCK)
            ON RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = KEYS.RestrictionNumberId
    JOIN    dbo.AVIV_LIST_PHONE_NUMBER AS PHONE_NUMBER (NOLOCK)
            ON PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER = RESTRICTION.IDNT_AVIV_LIST_PHONE_NUMBER
    LEFT JOIN dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS (NOLOCK)
            ON INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION = KEYS.InlinePermitId
    LEFT JOIN dbo.AVIV_FILE AS APPROVED_FILE (NOLOCK)
            ON APPROVED_FILE.IDNT_AVIV_FILE = RESTRICTION.IDNT_APPROVED_FILE;

    -- ===========================================
    -- תוצאה 2: היתרים (PhoneRecordRow, IsPermit = 1) כולל תקציר הגבלת המקור
    -- ===========================================
    -- אותן עמודות כמו בתוצאה 1 ואותם כינויים, ולכן בסרביס שתי התוצאות נקראות לאותה רשימה.
    -- ConditionsRowId של היתר הוא ההיתר עצמו: המכשירים שלו בתוצאה 3 מפתחים לפיו.
    SELECT  KEYS.PermitId                                   AS Id,
            CAST(1 AS BIT)                                  AS IsPermit,
            CAST(CASE WHEN CAST(PERMIT.DATE_PERMIT_END AS DATE) < @Today THEN 1 ELSE 0 END AS BIT) AS IsEnded,
            RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER        AS RestrictionNumberId,
            KEYS.PermitId                                   AS ConditionsRowId,
            PERMIT.IDNT_TRAINEE                             AS TraineeId,
            PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER        AS PhoneNumberId,
            PHONE_NUMBER.TEXT_PHONE_NUMBER                  AS PhoneNumber,
            PERMIT.DATE_PERMIT_START                        AS DateStart,
            PERMIT.DATE_PERMIT_END                          AS DateEnd,
            PERMIT.NUMB_DURATION_LIMIT                      AS NumbDurationLimit,
            PERMIT.TIME_PERMIT_START                        AS TimePermitStart,
            PERMIT.TIME_PERMIT_END                          AS TimePermitEnd,
            PERMIT.TEXT_PERMIT_REASON                       AS TextReason,
            PERMIT.IDNT_USER_APPROVAL                       AS IdntUserApproval,
            PERMIT.IDNT_APPROVED_FILE                       AS IdntApprovedFile,
            APPROVED_FILE.TEXT_FILE                         AS TextFile,
            PERMIT.DATE_CREATED                             AS DateCreated,
            PERMIT.DATE_UPDATED                             AS DateUpdated,
            PERMIT.IDNT_USER_UPDATE                         AS IdntUserUpdate,
            -- תקציר הגבלת המקור (SourceRestrictionSummaryDto); הקוד עובר כמו שהוא, הקליינט גוזר ארצי/פנימייתי מהפנימיות של תוצאה 4 (A-5, C-9)
            RESTRICTION.CODE_RESTRICTION_SCOPE              AS SourceCodeRestrictionScope,
            RESTRICTION.DATE_RESTRICTION_START              AS SourceDateStart,
            RESTRICTION.DATE_RESTRICTION_END                AS SourceDateEnd,
            RESTRICTION.TEXT_RESTRICTION_REASON             AS SourceTextReason,
            SOURCE_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION_NUMBER AS SourceTraineeRestrictionNumberId
    FROM    #Permits AS KEYS
    JOIN    dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT (NOLOCK)
            ON PERMIT.IDNT_AVIV_PERMITS_FOR_RESTRICTION = KEYS.PermitId
    JOIN    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION (NOLOCK)
            ON RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = KEYS.RestrictionNumberId
    JOIN    dbo.AVIV_LIST_PHONE_NUMBER AS PHONE_NUMBER (NOLOCK)
            ON PHONE_NUMBER.IDNT_AVIV_LIST_PHONE_NUMBER = RESTRICTION.IDNT_AVIV_LIST_PHONE_NUMBER
    -- D-11: להגבלת חניך יש שורת חניך פעילה אחת; להגבלה כללית אין שורה כזו
    LEFT JOIN dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS SOURCE_TRAINEE_RESTRICTION (NOLOCK)
            ON  SOURCE_TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
            AND SOURCE_TRAINEE_RESTRICTION.LOGI_ACTIVE = 1
    LEFT JOIN dbo.AVIV_FILE AS APPROVED_FILE (NOLOCK)
            ON APPROVED_FILE.IDNT_AVIV_FILE = PERMIT.IDNT_APPROVED_FILE;

    -- ===========================================
    -- תוצאה 3: מכשירים של שורות התנאים ושל ההיתרים (DeviceRow)
    -- ===========================================
    -- שני סוגי השורות יושבים באותה טבלה (AVIV_PERMITS_FOR_RESTRICTION), ולכן סט אחד עם המפתח ConditionsRowId מספיק לשניהם.
    -- I-15: השם הוא תווית בלבד, ולכן LEFT JOIN בלי סינון פעילות – מכשיר שהוסר עדיין מוצג בהיסטוריה; בלי שורה – שם ריק (C-8)
    SELECT  PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION AS ConditionsRowId,
            PERMIT_DEVICE.IDNT_DEVICE                       AS DeviceId,
            ISNULL(DEVICE.TEXT_DEVICE_NAME, N'')            AS DeviceName
    FROM    (
                SELECT  InlinePermitId AS ConditionsRowId
                FROM    #TraineeRestrictions
                WHERE   InlinePermitId IS NOT NULL
                UNION ALL
                SELECT  PermitId
                FROM    #Permits
            ) AS KEYS
    JOIN    dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE (NOLOCK)
            ON PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = KEYS.ConditionsRowId
    LEFT JOIN dbo.AVIV_DEVICE_DATA AS DEVICE (NOLOCK)
            ON DEVICE.IDNT_DEVICE = PERMIT_DEVICE.IDNT_DEVICE
    WHERE   PERMIT_DEVICE.LOGI_ACTIVE = 1;

    -- ===========================================
    -- תוצאה 4: פנימיות של הגבלות המקור (InstituteRow)
    -- ===========================================
    -- נדרשת רק להיתרים: הקליינט גוזר מהן את תווית ה-scope של הגבלת המקור ("הגבלת פנימייה – {שם}", C-9).
    -- להגבלות של החניך עצמו (תוצאה 1) אין קישורי פנימייה.
    -- I-15: הפנימיות הן שורות A_LOCATION מסוג "פנימייה", כמו ב-SP_AVIV_GET_LOCATIONS; בלי שורה – שם ריק (C-8)
    SELECT  INSTITUTE_LINK.IDNT_AVIV_RESTRICTION_NUMBER     AS RestrictionNumberId,
            INSTITUTE_LINK.IDNT_INSTITUTE                   AS InstituteId,
            ISNULL(INSTITUTE.TEXT_NAME_LOCATION, N'')       AS InstituteName
    FROM    (SELECT DISTINCT RestrictionNumberId FROM #Permits) AS KEYS
    JOIN    dbo.AVIV_INSTITUTES_RESTRICTION_NUMBER AS INSTITUTE_LINK (NOLOCK)
            ON INSTITUTE_LINK.IDNT_AVIV_RESTRICTION_NUMBER = KEYS.RestrictionNumberId
    LEFT JOIN ODSINTERNALDATA..A_LOCATION AS INSTITUTE (NOLOCK)
            ON  INSTITUTE.IDNT_LOCATION_TRAINEE = INSTITUTE_LINK.IDNT_INSTITUTE
            AND INSTITUTE.CODE_SUG_LOCATION = @CodeSugLocationInstitute
    WHERE   INSTITUTE_LINK.LOGI_ACTIVE = 1;
END
GO
