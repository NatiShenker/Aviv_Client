USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   09-11-26
-- Description:   שליפת ההיסטוריה המלאה של "הגבלות לחניך" של חניכים – כל השורות הפעילות (LOGI_ACTIVE = 1),
--                גם אלה שהסתיימו (B-5). שתי תוצאות, מורכבות לתשובה אחת בסרביס (T-6, 02-architecture.md §3):
--                1 ההגבלות (שורת ההגבלה + שורת התנאים הפנימית + נתיב הקובץ), 2 המכשירים של שורות התנאים.
--                I-19: הדגל IsEnded ומזהה שורת התנאים (ConditionsRowId) מחושבים כאן, והסרביס מעביר אותם כמו שהם.
--                T-2: משך השיחה יושב על שורת ההגבלה; השעות והמכשירים על השורה הפנימית, שקיימת רק כשיש אותם.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_GET_TRAINEE_RESTRICTIONS]
    @IDNT_TRAINEE_LIST dbo.INT_TABLE READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- ===========================================
    -- מחיקת טבלאות זמניות
    -- ===========================================
    DROP TABLE IF EXISTS #Restrictions;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @RestrictionTypeTrainee INT = 1;                        -- D-10: DECODE AVIV_RESTRICTION_TYPE – הגבלת חניך (AVIV_TRAINEE_RESTRICTION)
    DECLARE @Today DATE                 = CAST(GETDATE() AS DATE);  -- I-19: IsEnded ברמת יום, לפי שעון השרת (Q-3); יום הסיום כלול (A-8)

    -- ===========================================
    -- איסוף מפתחות: ההגבלות של החניכים ושורות התנאים שלהן
    -- ===========================================
    CREATE TABLE #Restrictions (
        TraineeRestrictionId INT PRIMARY KEY,
        InlineConditionsId   INT NULL
    );

    INSERT INTO #Restrictions (TraineeRestrictionId, InlineConditionsId)
    SELECT  RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION,
            INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION
    FROM    dbo.AVIV_TRAINEE_RESTRICTION AS RESTRICTION (NOLOCK)
    JOIN    @IDNT_TRAINEE_LIST AS TRAINEE_LIST
            ON TRAINEE_LIST.IDNT_GENERAL = RESTRICTION.IDNT_TRAINEE
    -- D-2, D-3, T-2: שעות ומכשירים יושבים בשורת היתר צמודה עם הדגל LOGI_RESTRICTION_INLINE_PERMIT = 1; בלי שעות ומכשירים אין שורה
    LEFT JOIN dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS (NOLOCK)
            ON  INLINE_CONDITIONS.IDNT_AVIV_RESTRICTION_TABLE = RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION
            AND INLINE_CONDITIONS.CODE_RESTRICTION_TYPE = @RestrictionTypeTrainee
            AND INLINE_CONDITIONS.LOGI_RESTRICTION_INLINE_PERMIT = 1
            AND INLINE_CONDITIONS.LOGI_ACTIVE = 1
    WHERE   RESTRICTION.LOGI_ACTIVE = 1;

    -- ===========================================
    -- תוצאה 1: ההגבלות (TraineeRestrictionRow)
    -- ===========================================
    -- ConditionsRowId: שורת התנאים הצמודה, שאליה שייכים המכשירים של תוצאה 2; NULL כשאין שעות ומכשירים
    SELECT  KEYS.TraineeRestrictionId                       AS Id,
            CAST(CASE WHEN CAST(RESTRICTION.DATE_RESTRICTION_END AS DATE) < @Today THEN 1 ELSE 0 END AS BIT) AS IsEnded,
            KEYS.InlineConditionsId                         AS ConditionsRowId,
            RESTRICTION.IDNT_TRAINEE                        AS TraineeId,
            RESTRICTION.DATE_RESTRICTION_START              AS DateStart,
            RESTRICTION.DATE_RESTRICTION_END                AS DateEnd,
            RESTRICTION.NUMB_DURATION_LIMIT                 AS NumbDurationLimit,      -- T-2: על שורת ההגבלה; NULL = הגבלה מלאה
            INLINE_CONDITIONS.TIME_PERMIT_START             AS TimePermitStart,
            INLINE_CONDITIONS.TIME_PERMIT_END               AS TimePermitEnd,
            RESTRICTION.TEXT_RESTRICTION_REASON             AS TextReason,             -- T-3: הפירוט החופשי
            RESTRICTION.IDNT_USER_APPROVAL                  AS IdntUserApproval,
            RESTRICTION.IDNT_APPROVED_FILE                  AS IdntApprovedFile,
            APPROVED_FILE.TEXT_FILE                         AS TextFile,
            RESTRICTION.DATE_CREATED                        AS DateCreated,
            RESTRICTION.DATE_UPDATED                        AS DateUpdated,
            RESTRICTION.IDNT_USER_UPDATE                    AS IdntUserUpdate
    FROM    #Restrictions AS KEYS
    JOIN    dbo.AVIV_TRAINEE_RESTRICTION AS RESTRICTION (NOLOCK)
            ON RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION = KEYS.TraineeRestrictionId
    LEFT JOIN dbo.AVIV_PERMITS_FOR_RESTRICTION AS INLINE_CONDITIONS (NOLOCK)
            ON INLINE_CONDITIONS.IDNT_AVIV_PERMITS_FOR_RESTRICTION = KEYS.InlineConditionsId
    LEFT JOIN dbo.AVIV_FILE AS APPROVED_FILE (NOLOCK)
            ON APPROVED_FILE.IDNT_AVIV_FILE = RESTRICTION.IDNT_APPROVED_FILE;

    -- ===========================================
    -- תוצאה 2: מכשירים של שורות התנאים (DeviceRow)
    -- ===========================================
    -- I-15: השם הוא תווית בלבד, ולכן LEFT JOIN בלי סינון פעילות – מכשיר שהוסר עדיין מוצג בהיסטוריה; בלי שורה – שם ריק (C-8)
    SELECT  PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION AS ConditionsRowId,
            PERMIT_DEVICE.IDNT_DEVICE                       AS DeviceId,
            ISNULL(DEVICE.TEXT_DEVICE_NAME, N'')            AS DeviceName
    FROM    #Restrictions AS KEYS
    JOIN    dbo.AVIV_PERMITS_DEVICE AS PERMIT_DEVICE (NOLOCK)
            ON PERMIT_DEVICE.IDNT_AVIV_PERMITS_FOR_RESTRICTION = KEYS.InlineConditionsId
    LEFT JOIN dbo.AVIV_DEVICE_DATA AS DEVICE (NOLOCK)
            ON DEVICE.IDNT_DEVICE = PERMIT_DEVICE.IDNT_DEVICE
    WHERE   KEYS.InlineConditionsId IS NOT NULL
      AND   PERMIT_DEVICE.LOGI_ACTIVE = 1;
END
GO
