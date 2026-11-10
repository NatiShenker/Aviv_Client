USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   10-11-26
-- Description:   המכשירים הפעילים של פנימיות ו/או אגפים, לבורר "מכשירים מותרים" בטפסי 03 ו-04 (ספק 00 §6; Q-7 של 04).
--                שם המכשיר מורכב כאן, ורק כאן (E-3, E-8): "מכשיר {IDNT_DEVICE}, {המיקום המלא}" – מיקום אמיתי לפי
--                A_LOCATION.TEXT_NAME_FULL, מיקום וירטואלי (AVIV_VIRTUAL_WING_DATA) לפי שם הפנימייה ושם המיקום.
--                האגף לקיבוץ בבורר (IdntWing) מחושב כמו CalcParent ב-SP_AVIV_GET_LOCATIONS: אגף אמיתי כשההורה הוא אגף, אחרת 99999 (E-4).
--                הסינון לפי פנימיות או אגפים הוא של SP_AVIV_GET_LOCATIONS; אותו בלוק, באותה כותרת, ב-SP_AVIV_GET_TRAINEES (A-3).
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_GET_DEVICES]
    @IDNT_INSTITUTION_LIST dbo.INT_TABLE READONLY,
    @IDNT_WINGS_LIST       dbo.INT_TABLE READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- ===========================================
    -- מחיקת טבלאות זמניות
    -- ===========================================
    DROP TABLE IF EXISTS #ReqInstitutions, #ReqWings, #Devices;

    -- ===========================================
    -- משתנים
    -- ===========================================
    DECLARE @VirtualLocationWingId    INT = 99999;      -- האגף הווירטואלי המוסכם בין הסרביס לקליינט ("מיקומים שונים"), כמו ב-SP_AVIV_GET_LOCATIONS
    DECLARE @CodeSugLocationWing      INT = 3330017;    -- סוג מיקום "אגף" ב-A_LOCATION
    DECLARE @CodeSugLocationInstitute INT = 3330016;    -- סוג מיקום "פנימייה" ב-A_LOCATION (I-15)

    -- ===========================================
    -- מיפוי הפנימיות והאגפים
    -- ===========================================
    -- הבלוק של SP_AVIV_GET_LOCATIONS, מילה במילה; אותו בלוק ב-SP_AVIV_GET_TRAINEES (A-3)
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
    -- מכשירים במיקומים אמיתיים
    -- ===========================================
    -- E-2: IDNT_LOCATION של מכשיר מצביע על A_LOCATION (כאן) או על AVIV_VIRTUAL_WING_DATA (בצעד הבא); מרחבי המזהים אינם מתנגשים (EQ-1),
    -- ולכן המפתח הראשי יכשל בקול אם מכשיר יופיע בשניהם. E-5: מכשירים פעילים בלבד.
    -- EI-1: האגף הלוגי מחושב ב-CROSS APPLY כמו CalcParent ברפרנס, כי הוא נדרש גם ברשימת העמודות וגם בסינון.
    CREATE TABLE #Devices (
        IdntDevice           INT PRIMARY KEY,
        IdntInstitution      INT NOT NULL,
        IdntWing             INT NOT NULL,
        TextLocationFullName NVARCHAR(500) NULL
    );

    INSERT INTO #Devices (IdntDevice, IdntInstitution, IdntWing, TextLocationFullName)
    SELECT  DEVICE.IDNT_DEVICE,
            LOCAT.IDNT_INSTITUTION,
            LogicalWing.IdntWing,
            LOCAT.TEXT_NAME_FULL                                         -- E-3: ההיררכיה המלאה של המיקום בעמודה אחת (EQ-2)
    FROM    dbo.AVIV_DEVICE_DATA AS DEVICE (NOLOCK)
    JOIN    ODSINTERNALDATA..A_LOCATION AS LOCAT (NOLOCK)
            ON LOCAT.IDNT_LOCATION_TRAINEE = DEVICE.IDNT_LOCATION
    JOIN    ODSINTERNALDATA..A_LOCATION AS LOCATION_PARENT (NOLOCK)
            ON LOCATION_PARENT.IDNT_LOCATION_TRAINEE = LOCAT.IDNT_LOCATION_AV
    -- E-4: מי ה"אגף" של המיקום לצורך הקיבוץ – אגף אמיתי כשההורה הוא אגף, אחרת האגף הווירטואלי
    CROSS APPLY (
        SELECT  CASE WHEN LOCATION_PARENT.CODE_SUG_LOCATION = @CodeSugLocationWing
                     THEN LOCAT.IDNT_WING
                     ELSE @VirtualLocationWingId
                END AS IdntWing
    ) AS LogicalWing
    WHERE   DEVICE.LOGI_ACTIVE = 1
      AND   (
                EXISTS (SELECT 1 FROM #ReqInstitutions AS REQ WHERE REQ.IDNT_INSTITUTION_REQ = LOCAT.IDNT_INSTITUTION)
             OR EXISTS (SELECT 1 FROM #ReqWings        AS REQ WHERE REQ.IDNT_WING_REQ        = LogicalWing.IdntWing)
            );

    -- ===========================================
    -- מכשירים במיקומים וירטואליים
    -- ===========================================
    -- E-2, E-3: מיקום וירטואלי פעיל; אין לו TEXT_NAME_FULL, ולכן שם המיקום מורכב משם הפנימייה (שורת A_LOCATION מסוג "פנימייה", I-15) ושם המיקום.
    -- E-4: האגף לקיבוץ הוא תמיד הווירטואלי; נכלל כשהפנימייה ברשימה או כשהאגף הווירטואלי ברשימה – כמו ברפרנס.
    -- EI-2: הרכבת שם המיקום נעשית כאן, בצעד של המקרה, כדי שהתוצאה תטפל בשני המקרים אותו דבר.
    INSERT INTO #Devices (IdntDevice, IdntInstitution, IdntWing, TextLocationFullName)
    SELECT  DEVICE.IDNT_DEVICE,
            VIRTUAL_LOCATION.IDNT_UNIT,
            @VirtualLocationWingId,
            ISNULL(INSTITUTE.TEXT_NAME_LOCATION + N', ', N'') + ISNULL(VIRTUAL_LOCATION.TEXT_WING_NAME, N'')
    FROM    dbo.AVIV_DEVICE_DATA AS DEVICE (NOLOCK)
    JOIN    dbo.AVIV_VIRTUAL_WING_DATA AS VIRTUAL_LOCATION (NOLOCK)
            ON VIRTUAL_LOCATION.IDNT_WING = DEVICE.IDNT_LOCATION
    LEFT JOIN ODSINTERNALDATA..A_LOCATION AS INSTITUTE (NOLOCK)
            ON  INSTITUTE.IDNT_LOCATION_TRAINEE = VIRTUAL_LOCATION.IDNT_UNIT
            AND INSTITUTE.CODE_SUG_LOCATION = @CodeSugLocationInstitute
    WHERE   DEVICE.LOGI_ACTIVE = 1
      AND   VIRTUAL_LOCATION.LOGI_IS_ACTIVE = 1
      AND   (
                EXISTS (SELECT 1 FROM #ReqInstitutions AS REQ WHERE REQ.IDNT_INSTITUTION_REQ = VIRTUAL_LOCATION.IDNT_UNIT)
             OR EXISTS (SELECT 1 FROM #ReqWings        AS REQ WHERE REQ.IDNT_WING_REQ        = @VirtualLocationWingId)
            );

    -- ===========================================
    -- תוצאה: מכשיר לשורה (DeviceListItemDto)
    -- ===========================================
    -- E-3: "מכשיר {מזהה}, {המיקום המלא}" – המקום היחיד שבו נבנה שם של מכשיר (E-8). E-10: סדר יציב לקיבוץ בבורר.
    SELECT  DEVICE.IdntDevice                                                                                   AS IdntDevice,
            N'מכשיר ' + CAST(DEVICE.IdntDevice AS NVARCHAR(10)) + N', ' + ISNULL(DEVICE.TextLocationFullName, N'') AS TextDeviceName,
            DEVICE.IdntWing                                                                                     AS IdntWing,
            DEVICE.IdntInstitution                                                                              AS IdntInstitution
    FROM    #Devices AS DEVICE
    ORDER BY DEVICE.IdntInstitution, DEVICE.IdntWing, DEVICE.IdntDevice;
END
GO
