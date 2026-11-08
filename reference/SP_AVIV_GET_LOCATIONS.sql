USE [ZeroThree03]

GO

/****** Object:  StoredProcedure [dbo].[SP_AVIV_GET_LOCATIONS]    Script Date: 10/29/2026 11:09:48 PM ******/

SET ANSI_NULLS ON

GO

SET QUOTED_IDENTIFIER ON

GO

 

-- =============================================

-- Author:                            John Doe

-- Create date: 27-08-26

-- Description:    שליפת מיקומים כולל וירטואליים, לפי פנימיות ואגפים

-- =============================================

ALTER PROCEDURE [dbo].[SP_AVIV_GET_LOCATIONS]

                @IDNT_INSTITUTION_LIST dbo.INT_TABLE READONLY,

                @IDNT_WINGS_LIST dbo.INT_TABLE READONLY,

                @INCLUDE_VIRTUAL_LOCATION BIT = 0,

                @WITH_DEVICES_ONLY BIT = 0

 

               

                AS

                BEGIN

                                -- SET NOCOUNT ON added to prevent extra result sets from

                                -- interfering with SELECT statements.

                                SET NOCOUNT ON;


                                --                             ===========================================

--                             מחיקת טבלאות זמניות

--                             ===========================================

                               DROP TABLE IF EXISTS #ReqInstitutions, #ReqWings;

 

 

--                             ===========================================

--                             משתנים

--                             ===========================================

                               DECLARE @VirtualLocationWingId INT       = 99999; -- פיקטיבי מוסכם על ידי הסרביס והקליינט

                               DECLARE @CodeSugLocationAWing INT                    = 3330017;

                                

--                             ===========================================

--                             מיפוי הפנימיות והאגפים

--                             ===========================================

                                -- יחידות

                                CREATE TABLE    #ReqInstitutions (IDNT_INSTITUTION_REQ INT PRIMARY KEY);

                                INSERT INTO                       #ReqInstitutions (IDNT_INSTITUTION_REQ)

                                SELECT                                  IDNT_GENERAL

                                FROM                                   @IDNT_INSTITUTION_LIST;

 

                                -- אגפים, נוודא שאין אגף שמשוייך לפנימייה שכבר נמצאת בפרמטר שלה

                                CREATE TABLE    #ReqWings (IDNT_WING_REQ INT PRIMARY KEY);

                                INSERT INTO                       #ReqWings (IDNT_WING_REQ)

                                SELECT                                  WINGS_LIST.IDNT_GENERAL

                                FROM                                   @IDNT_WINGS_LIST AS WINGS_LIST

                                WHERE                                 WINGS_LIST.IDNT_GENERAL = @VirtualLocationWingId

                                                                                                OR EXISTS (

                                                                                                                SELECT  1

                                                                                                                FROM   [OdsInternalData].[dbo].[MAIN_WINGS_TABLE] WINGS_TABLE (NOLOCK)

                                                                                                                WHERE WINGS_TABLE.IDNT_WING = WINGS_LIST.IDNT_GENERAL

                                                                                                                                                AND NOT EXISTS (SELECT 1 FROM #ReqInstitutions R WHERE R.IDNT_INSTITUTION_REQ = WINGS_TABLE.IDNT_INSTITUTION));

 

 

--                             ===========================================

--                             שליפת מיקומים רגילים

--                             ===========================================

                                SELECT

                                                LOCAT.IDNT_LOCATION_TRAINEE                                                                                                                                                      AS LocationId

                                                ,LOCAT.TEXT_NAME_LOCATION                                                                                                                                                 AS LocationName

                                                ,LOCAT.IDNT_INSTITUTION                                                                                                                                                                          AS InstitutionId

                                                ,CalcParent.IDNT_PARENT_FOR_CLIENT                                                                                                 AS ParentId

                                                ,0                                                                                                                                                                                                                                            AS IsVirtual

                                                ,ISNULL(CalcDevice.HasDevice, 0)                                                                                                              AS HasDevice

                                FROM                   ODSINTERNALDATA..A_LOCATION AS LOCAT (NOLOCK)

 

                                JOIN                      ODSINTERNALDATA..A_LOCATION            AS LOCATION_PARENT (NOLOCK)

                                ON                                         LOCATION_PARENT.IDNT_LOCATION_TRAINEE = LOCAT.IDNT_LOCATION_AV

   

                                -- בדיקה מי יהיה ה"אגף" של המיקום

                                CROSS APPLY      (

                                                SELECT CASE

                                                                WHEN LOCATION_PARENT.CODE_SUG_LOCATION = @CodeSugLocationWing THEN LOCAT.IDNT_WING          -- אם זה בן של אגף, האבא הוא האגף

                                                                ELSE @VirtualLocationWingId                                                                                                                                                                                                     -- אחרת, האבא "הלוגי" הוא 99999

                                                END       AS IDNT_PARENT_FOR_CLIENT

                                ) AS CalcParent

 

                                -- בדיקה אם קיים מכשיר אחד לפחות במיקום

                                OUTER APPLY (

                                                SELECT  TOP 1 1 AS HasDevice

                                                FROM   [AVIV_DEVICE_DATA] DD (NOLOCK)

                                                WHERE DD.IDNT_WING = LOCAT.IDNT_LOCATION_TRAINEE AND DD.LOGI_ACTIVE = 1

                                                -- העמודה שכיום נקראת אגף, צריכה להשתנות ולהיקרא כמיקום

                                ) AS CalcDevice

 

                                WHERE                 (

                                                -- סינון לפי הפנימיות והאגפים שנשלחו

                                                EXISTS (SELECT 1 FROM #ReqInstitutions RY WHERE RY.IDNT_INSTITUTION_REQ = LOCAT.IDNT_INSTITUTION)

                                                OR EXISTS (SELECT 1 FROM #ReqWings RA WHERE RA.IDNT_WING_REQ = CalcParent.IDNT_PARENT_FOR_CLIENT)

                                )

                                AND       (

                                                -- סינון לפי המכשירים שקיימים במיקומים

                                                @WITH_DEVICES_ONLY = 0

                                                OR CalcDevice.HasDevice = 1

                                )

                                AND LOCAT.LOGI_PAIL = 1

                                AND LOCAT.CODE_SUG_LOCATION NOT IN (3330016, 3330017) -- סינון סוג: פנימייה, אגף

                               

                                ORDER BY            LOCAT.IDNT_INSTITUTION

                                                                                ,CalcParent.IDNT_PARENT_FOR_CLIENT;

 

 

--                             ===========================================

--                             שליפת מיקומים וירטואליים

--                             ===========================================

                                -- העמודה שכיום נקראת אגף, צריכה להשתנות ולהיקרא כמיקום

                                IF @INCLUDE_VIRTUAL_LOCATION = 1

                                BEGIN

                                                SELECT

                                                                VIRTUAL_LOCAT.IDNT_WING                                                                                                                                                                                                                                                      AS LocationId

                                                                ,VIRTUAL_LOCAT.TEXT_WING_NAME                                                                                                                                                                                                                       AS LocationName

                                                                ,VIRTUAL_LOCAT.IDNT_UNIT                                                                                                                                                                                                                                       AS UnitId

                                                                ,@VirtualLocationWingId                                                                                                                                                                                                                                                              AS ParentId

                                                                ,1                                                                                                                                                                                                                                                                                                                                            AS IsVirtual

                                                                ,ISNULL(CalcDevice.HasDevice, 0)                                                                                                                                                                                                              AS HasDevice

                                                FROM                   [ZeroThree03].[dbo].[AVIV_VIRTUAL_WING_DATA] VIRTUAL_LOCATION (NOLOCK)

 

                                                -- בדיקה אם קיים מכשיר אחד לפחות במיקום

                                                OUTER APPLY (

                                                                SELECT  TOP 1 1 AS HasDevice

                                                                FROM   [AVIV_DEVICE_DATA] DD (NOLOCK)

                                                                WHERE DD.IDNT_WING = VIRTUAL_LOCAT.IDNT_WING AND DD.LOGI_ACTIVE = 1

                                                                -- העמודה שכיום נקראת אגף, צריכה להשתנות ולהיקרא כמיקום

                                                ) AS CalcDevice

 

                                                WHERE                 (

                                                                -- סינון לפי היחידות והאגפים שנשלחו

                                                                EXISTS (SELECT 1 FROM #ReqInstitutions RY WHERE RY.IDNT_INSTITUTION_REQ = VIRTUAL_LOCAT.IDNT_UNIT)

                                                                OR EXISTS (SELECT 1 FROM #ReqWings RA WHERE RA.IDNT_WING_REQ = @VirtualLocationWingId)

                                                )

                                                AND (

                                                                -- סינון לפי המכשירים שקיימים במיקומים

                                                                @WITH_DEVICES_ONLY = 0

                                                                OR CalcDevice.HasDevice = 1

                                                )

                                                AND VIRTUAL_LOCAT.LOGI_IS_ACTIVE = 1

                                               

                                                ORDER BY            VIRTUAL_LOCAT.IDNT_UNIT

                                                                                                ,VIRTUAL_LOCAT.IDNT_WING;

                                END

 

 

END

...

...

 