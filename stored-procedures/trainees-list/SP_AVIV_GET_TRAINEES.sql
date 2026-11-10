USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   10-11-26
-- Description:   רשימת החניכים הנוכחיים של פנימיות ו/או אגפים (מסך הבית, ספק 01) – שורה לחניך:
--                פרטי החניך מהשורה הפעילה ב-ODSINTERNALDATA..TRAINEE_SNAPSHOT (L-1), שם האגף ושם המיקום (L-2),
--                "מוגבל עד" ושישה דגלים שמחושבים כאן מטבלאות AVIV (I-19; L-3, L-4, L-5). נתוני סלקום אינם כאן (L-6).
--                הסינון לפי פנימיות או אגפים הוא של SP_AVIV_GET_LOCATIONS; אותו בלוק, באותה כותרת, ב-SP_AVIV_GET_DEVICES (A-3).
--                L-14: רצף צעדים קצרים, טבלה זמנית לכל צעד, וה-SELECT האחרון רק מצרף.
--                שמות עמודות המסומנים "משוער" מאומתים בצ'קליסט §A לפני היצירה (LQ-1).
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_GET_TRAINEES]
    @IDNT_INSTITUTION_LIST dbo.INT_TABLE READONLY,
    @IDNT_WINGS_LIST       dbo.INT_TABLE READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- ===========================================
    -- מחיקת טבלאות זמניות
    -- ===========================================
    DROP TABLE IF EXISTS #ReqInstitutions, #ReqWings, #Trainees, #TraineeRestrictionFlags, #PhoneRestrictionFlags, #PhonePermitFlags, #MessageFlags;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @VirtualLocationWingId INT  = 99999;                    -- האגף הווירטואלי המוסכם בין הסרביס לקליינט; לחניכים אין בו משמעות (L-1)
    DECLARE @RestrictionTypeNumber INT  = 2;                        -- D-10: סוג הגבלה – הגבלה למספר (AVIV_RESTRICTION_NUMBER); קבוע, לא נקרא מ-AVIV_DECODE (K-7)
    DECLARE @Today DATE                 = CAST(GETDATE() AS DATE);  -- P-10, A-8: "פעילה היום" ברמת יום לפי שעון השרת; יום הסיום כלול

    -- ===========================================
    -- מיפוי הפנימיות והאגפים
    -- ===========================================
    -- הבלוק של SP_AVIV_GET_LOCATIONS, מילה במילה; אותו בלוק ב-SP_AVIV_GET_DEVICES (A-3)
    -- יחידות
    CREATE TABLE #ReqInstitutions (IDNT_INSTITUTION_REQ INT PRIMARY KEY);

    INSERT INTO #ReqInstitutions (IDNT_INSTITUTION_REQ)
    SELECT  IDNT_GENERAL
    FROM    @IDNT_INSTITUTION_LIST;

    -- אגפים, נוודא שאין אגף שמשויך לפנימייה שכבר נמצאת בפרמטר שלה
    CREATE TABLE #ReqWings (IDNT_WING_REQ INT PRIMARY KEY);

    INSERT INTO #ReqWings (IDNT_WING_REQ)
    SELECT  WINGS_LIST.IDNT_GENERAL
    FROM    @IDNT_WINGS_LIST AS WINGS_LIST
    WHERE   WINGS_LIST.IDNT_GENERAL = @VirtualLocationWingId
       OR   EXISTS (
                SELECT  1
                FROM    ODSINTERNALDATA..MAIN_WINGS_TABLE AS WINGS_TABLE (NOLOCK)
                WHERE   WINGS_TABLE.IDNT_WING = WINGS_LIST.IDNT_GENERAL
                  AND   NOT EXISTS (SELECT 1 FROM #ReqInstitutions AS REQ WHERE REQ.IDNT_INSTITUTION_REQ = WINGS_TABLE.IDNT_INSTITUTION)
            );

    -- ===========================================
    -- החניכים הנבחרים
    -- ===========================================
    -- L-1: השורה הפעילה של כל חניך היא השמתו הנוכחית, ולחניך שעזב אין שורה פעילה; המפתח הראשי יכשל בקול אם לחניך יש יותר משורה פעילה אחת.
    -- חניך נכלל כשהפנימייה שלו ברשימה או כשהאגף שלו ברשימה (התאמה על IDNT_WING בלבד).
    CREATE TABLE #Trainees (
        IdntTrainee        INT PRIMARY KEY,
        IdntInstitution    INT NOT NULL,
        IdntWing           INT NULL,
        IdntLocation       INT NULL,
        NumbPersonalNumber INT NULL,
        TextFirstName      NVARCHAR(200) NULL,
        TextLastName       NVARCHAR(200) NULL
    );

    INSERT INTO #Trainees (IdntTrainee, IdntInstitution, IdntWing, IdntLocation, NumbPersonalNumber, TextFirstName, TextLastName)
    SELECT  TRAINEE.IDNT_TRAINEE,
            TRAINEE.IDNT_INSTITUTION,
            TRAINEE.IDNT_WING,              -- משוער (LQ-1)
            TRAINEE.IDNT_LOCATION,          -- משוער (LQ-1); מזהה A_LOCATION, כמו המזהים ש-GetLocationsAndVirtualLocations מחזיר (LQ-2)
            TRAINEE.NUMB_PERSONAL_NUMBER,   -- משוער (LQ-1)
            TRAINEE.TEXT_FIRST_NAME,        -- משוער (LQ-1)
            TRAINEE.TEXT_LAST_NAME          -- משוער (LQ-1)
    FROM    ODSINTERNALDATA..TRAINEE_SNAPSHOT AS TRAINEE (NOLOCK)
    WHERE   TRAINEE.LOGI_ACTIVE = 1
      AND   (
                EXISTS (SELECT 1 FROM #ReqInstitutions AS REQ WHERE REQ.IDNT_INSTITUTION_REQ = TRAINEE.IDNT_INSTITUTION)
             OR EXISTS (SELECT 1 FROM #ReqWings        AS REQ WHERE REQ.IDNT_WING_REQ        = TRAINEE.IDNT_WING)
            );

    -- ===========================================
    -- דגלי "הגבלה לחניך" (03)
    -- ===========================================
    -- L-3: מההגבלות הפעילות היום – "מוגבל עד" הוא תאריך הסיום המאוחר (B-1); מלאה = NUMB_DURATION_LIMIT ריק (T-2), דקות = עם ערך.
    -- LI-2: הדגלים נצברים כ-0/1 (MAX אינו מקבל BIT) ומומרים ל-BIT פעם אחת, בתוצאה.
    CREATE TABLE #TraineeRestrictionFlags (
        IdntTrainee                 INT PRIMARY KEY,
        DateRestrictedUntil         DATETIME NOT NULL,
        HasActiveFullRestriction    INT NOT NULL,
        HasActiveMinutesRestriction INT NOT NULL
    );

    INSERT INTO #TraineeRestrictionFlags (IdntTrainee, DateRestrictedUntil, HasActiveFullRestriction, HasActiveMinutesRestriction)
    SELECT  RESTRICTION.IDNT_TRAINEE,
            MAX(RESTRICTION.DATE_RESTRICTION_END),
            MAX(CASE WHEN RESTRICTION.NUMB_DURATION_LIMIT IS NULL     THEN 1 ELSE 0 END),
            MAX(CASE WHEN RESTRICTION.NUMB_DURATION_LIMIT IS NOT NULL THEN 1 ELSE 0 END)
    FROM    dbo.AVIV_TRAINEE_RESTRICTION AS RESTRICTION (NOLOCK)
    JOIN    #Trainees AS TRAINEE
            ON TRAINEE.IdntTrainee = RESTRICTION.IDNT_TRAINEE
    WHERE   RESTRICTION.LOGI_ACTIVE = 1
      AND   CAST(RESTRICTION.DATE_RESTRICTION_START AS DATE) <= @Today
      AND   CAST(RESTRICTION.DATE_RESTRICTION_END   AS DATE) >= @Today
    GROUP BY RESTRICTION.IDNT_TRAINEE;

    -- ===========================================
    -- דגלי "הגבלות והיתרים למספר" (04)
    -- ===========================================
    -- L-4: הגבלת מספר של החניך עצמו בלבד – שורת חניך פעילה (D-11) שהגבלת-האם שלה פעילה היום.
    -- הגבלה כללית או פנימייתית שחלה על החניך אינה מדליקה את הדגל.
    CREATE TABLE #PhoneRestrictionFlags (
        IdntTrainee               INT PRIMARY KEY,
        HasActivePhoneRestriction INT NOT NULL
    );

    INSERT INTO #PhoneRestrictionFlags (IdntTrainee, HasActivePhoneRestriction)
    SELECT  DISTINCT TRAINEE_RESTRICTION.IDNT_TRAINEE, 1
    FROM    dbo.AVIV_TRAINEE_RESTRICTION_NUMBER AS TRAINEE_RESTRICTION (NOLOCK)
    JOIN    #Trainees AS TRAINEE
            ON TRAINEE.IdntTrainee = TRAINEE_RESTRICTION.IDNT_TRAINEE
    JOIN    dbo.AVIV_RESTRICTION_NUMBER AS RESTRICTION (NOLOCK)
            ON RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER = TRAINEE_RESTRICTION.IDNT_AVIV_RESTRICTION_NUMBER
    WHERE   TRAINEE_RESTRICTION.LOGI_ACTIVE = 1
      AND   RESTRICTION.LOGI_ACTIVE = 1
      AND   CAST(RESTRICTION.DATE_RESTRICTION_START AS DATE) <= @Today
      AND   CAST(RESTRICTION.DATE_RESTRICTION_END   AS DATE) >= @Today;

    -- L-4: היתר למספר – שורת היתר של משתמש (סוג 2, LOGI_RESTRICTION_INLINE_PERMIT = 0; D-2, D-3) שפעילה היום לפי תאריכיה שלה,
    -- בלי בדיקה של הגבלת המקור (OQ-11 פתוחה). LI-3: טבלה נפרדת לכל דגל – כל כלל במשפט אחד משלו.
    CREATE TABLE #PhonePermitFlags (
        IdntTrainee          INT PRIMARY KEY,
        HasActivePhonePermit INT NOT NULL
    );

    INSERT INTO #PhonePermitFlags (IdntTrainee, HasActivePhonePermit)
    SELECT  DISTINCT PERMIT.IDNT_TRAINEE, 1
    FROM    dbo.AVIV_PERMITS_FOR_RESTRICTION AS PERMIT (NOLOCK)
    JOIN    #Trainees AS TRAINEE
            ON TRAINEE.IdntTrainee = PERMIT.IDNT_TRAINEE
    WHERE   PERMIT.CODE_RESTRICTION_TYPE = @RestrictionTypeNumber
      AND   PERMIT.LOGI_RESTRICTION_INLINE_PERMIT = 0
      AND   PERMIT.LOGI_ACTIVE = 1
      AND   CAST(PERMIT.DATE_PERMIT_START AS DATE) <= @Today
      AND   CAST(PERMIT.DATE_PERMIT_END   AS DATE) >= @Today;

    -- ===========================================
    -- דגלי "הודעות קוליות" (05)
    -- ===========================================
    -- L-5: הודעות פעילות היום; "הודעה חוזרת" = LOGI_INTERACTIVE_MESSAGE = 1, "הודעה רגילה" = 0 (ריק נחשב רגילה).
    CREATE TABLE #MessageFlags (
        IdntTrainee                 INT PRIMARY KEY,
        HasActiveMessage            INT NOT NULL,
        HasActiveInteractiveMessage INT NOT NULL
    );

    INSERT INTO #MessageFlags (IdntTrainee, HasActiveMessage, HasActiveInteractiveMessage)
    SELECT  MESSAGE.IDNT_TRAINEE,
            MAX(CASE WHEN ISNULL(MESSAGE.LOGI_INTERACTIVE_MESSAGE, 0) = 1 THEN 0 ELSE 1 END),
            MAX(CASE WHEN ISNULL(MESSAGE.LOGI_INTERACTIVE_MESSAGE, 0) = 1 THEN 1 ELSE 0 END)
    FROM    dbo.AVIV_TRAINEE_MESSAGE AS MESSAGE (NOLOCK)
    JOIN    #Trainees AS TRAINEE
            ON TRAINEE.IdntTrainee = MESSAGE.IDNT_TRAINEE
    WHERE   MESSAGE.LOGI_ACTIVE = 1                                   -- משוער (LQ-1)
      AND   CAST(MESSAGE.DATE_MESSAGE_START AS DATE) <= @Today         -- משוער (LQ-1)
      AND   CAST(MESSAGE.DATE_MESSAGE_END   AS DATE) >= @Today
    GROUP BY MESSAGE.IDNT_TRAINEE;

    -- ===========================================
    -- תוצאה: חניך לשורה (TraineeRow)
    -- ===========================================
    -- L-2: שמות האגף והמיקום ב-LEFT JOIN, ריקים כשאין שורת ייחוס (I-15, C-8); חניך בלי מיקום → IdntLocation NULL, והסרביס מחזיר null.
    -- LI-1: שם מלא בלי רווח מיותר כשחלק ממנו חסר. L-13: לפי שם, והקליינט ממיין בעצמו (B-5).
    SELECT  TRAINEE.IdntTrainee                                                                            AS IdntTrainee,
            TRAINEE.NumbPersonalNumber                                                                     AS NumbPersonalNumber,
            LTRIM(RTRIM(ISNULL(TRAINEE.TextFirstName, N'') + N' ' + ISNULL(TRAINEE.TextLastName, N'')))    AS TextFullName,
            TRAINEE.IdntInstitution                                                                        AS IdntInstitution,
            TRAINEE.IdntWing                                                                               AS IdntWing,
            ISNULL(WING.TEXT_WING_NAME, N'')                                                               AS TextWingName,        -- משוער (LQ-1)
            TRAINEE.IdntLocation                                                                           AS IdntLocation,
            ISNULL(TRAINEE_LOCATION.TEXT_NAME_LOCATION, N'')                                               AS TextLocationName,
            TRAINEE_RESTRICTION_FLAGS.DateRestrictedUntil                                                  AS DateRestrictedUntil,
            CAST(ISNULL(TRAINEE_RESTRICTION_FLAGS.HasActiveFullRestriction, 0) AS BIT)                     AS HasActiveFullRestriction,
            CAST(ISNULL(TRAINEE_RESTRICTION_FLAGS.HasActiveMinutesRestriction, 0) AS BIT)                  AS HasActiveMinutesRestriction,
            CAST(ISNULL(PHONE_RESTRICTION_FLAGS.HasActivePhoneRestriction, 0) AS BIT)                      AS HasActivePhoneRestriction,
            CAST(ISNULL(PHONE_PERMIT_FLAGS.HasActivePhonePermit, 0) AS BIT)                                AS HasActivePhonePermit,
            CAST(ISNULL(MESSAGE_FLAGS.HasActiveMessage, 0) AS BIT)                                         AS HasActiveMessage,
            CAST(ISNULL(MESSAGE_FLAGS.HasActiveInteractiveMessage, 0) AS BIT)                              AS HasActiveInteractiveMessage
    FROM    #Trainees AS TRAINEE
    LEFT JOIN ODSINTERNALDATA..MAIN_WINGS_TABLE AS WING (NOLOCK)
            ON WING.IDNT_WING = TRAINEE.IdntWing
    LEFT JOIN ODSINTERNALDATA..A_LOCATION AS TRAINEE_LOCATION (NOLOCK)
            ON TRAINEE_LOCATION.IDNT_LOCATION_TRAINEE = TRAINEE.IdntLocation
    LEFT JOIN #TraineeRestrictionFlags AS TRAINEE_RESTRICTION_FLAGS
            ON TRAINEE_RESTRICTION_FLAGS.IdntTrainee = TRAINEE.IdntTrainee
    LEFT JOIN #PhoneRestrictionFlags AS PHONE_RESTRICTION_FLAGS
            ON PHONE_RESTRICTION_FLAGS.IdntTrainee = TRAINEE.IdntTrainee
    LEFT JOIN #PhonePermitFlags AS PHONE_PERMIT_FLAGS
            ON PHONE_PERMIT_FLAGS.IdntTrainee = TRAINEE.IdntTrainee
    LEFT JOIN #MessageFlags AS MESSAGE_FLAGS
            ON MESSAGE_FLAGS.IdntTrainee = TRAINEE.IdntTrainee
    ORDER BY TextFullName, TRAINEE.IdntTrainee;
END
GO
