USE [ZeroThree03]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:        Aviv service
-- Create date:   10-11-26
-- Description:   שורות של טבלאות קוד מ-AVIV_DECODE לפי מזהי טבלה (CODE_TABLE מספרי, K-1) – שורות פעילות בלבד, בסדר התצוגה (K-2).
--                גנרית: אינה מכירה שמות של סטים; השמות (לדיבוג) ורשימת הטבלאות המותרות יושבים בסרביס (Utils/DecodeTables.cs, K-3).
--                היום משרתת את שלוש רשימות הסיבות של הטפסים (ספק 00 §6, K-4). טבלה מבוקשת בלי שורות פשוט אינה מופיעה –
--                הסרביס מחזיר אותה ריקה. את הטבלה ממלא ה-DBA (K-5).
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[SP_AVIV_GET_DECODE]
    @CODE_TABLE_LIST dbo.INT_TABLE READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- ===========================================
    -- תוצאה: שורות הטבלאות המבוקשות (DecodeRow)
    -- ===========================================
    -- KQ-2: שמות העמודות CODE_VALUE ו-TEXT_DESCRIPTION משוערים, מאומתים בצ'קליסט §A לפני היצירה
    SELECT  DECODE.CODE_TABLE       AS CodeTable,
            DECODE.CODE_VALUE       AS Id,
            DECODE.TEXT_DESCRIPTION AS Name
    FROM    dbo.AVIV_DECODE AS DECODE (NOLOCK)
    JOIN    @CODE_TABLE_LIST AS CODE_TABLE_LIST
            ON CODE_TABLE_LIST.IDNT_GENERAL = DECODE.CODE_TABLE
    WHERE   DECODE.LOGI_ACTIVE = 1
    ORDER BY DECODE.CODE_TABLE, DECODE.SORT_ORDER;
END
GO
