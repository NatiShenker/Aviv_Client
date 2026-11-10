namespace Aviv_Service.Models;

// טבלאות הקוד של AVIV_DECODE (K-3): הבקשה, התשובה והשורה השטוחה של הפרוצדורה – באותו קובץ, כמו WingDto.cs בסרביס (K-10).
// התשובה היא רשימה חשופה של DecodeTableDto – טבלה לכל מזהה שנתבקש, בסדר הבקשה, גם כשאין לה שורות (כך הקליינט נופל ל-mock לפי מפתח, K-6).
// הפריטים הם LookupItemDto המשותף (Aviv_Service.Models, T-12).

/// <summary>
/// POST Lookups/GetDecode – שורות של טבלאות קוד לפי מזהי הטבלאות (CODE_TABLE, מספרי; K-1).
/// המזהים הם של הרישום DecodeTables; הקליינט מחזיק אותם בקונפיג שלו (KQ-1). לא ריק וכולם מוכרים (הקונטרולר בודק).
/// </summary>
public record DecodeRequestDto(int[] CodeTableList);

/// <summary>טבלת קוד אחת: מספרה, שמה מהרישום (לדיבוג) ושורותיה הפעילות בסדר התצוגה.</summary>
public class DecodeTableDto
{
    /// <summary>AVIV_DECODE.CODE_TABLE.</summary>
    public int CodeTable { get; set; }

    /// <summary>השם מהרישום DecodeTables – כדי שבדיבוג רואים מה המספר אומר (K-3).</summary>
    public string CodeTableName { get; set; } = "";

    /// <summary>השורות הפעילות לפי SORT_ORDER; ריק כשה-DBA עוד לא מילא את הסט (K-5).</summary>
    public List<LookupItemDto> Items { get; set; } = [];
}

/// <summary>
/// התוצאה האחת של SP_AVIV_GET_DECODE: שורה אחת של טבלת קוד. הכינויים ב-SQL הם שמות המאפיינים (Dapper ממפה לפי שם).
/// KI-4: Name nullable – טקסט חסר בטבלה שמולאה ביד אינו מפיל את כל התשובה.
/// </summary>
public class DecodeRow
{
    public int CodeTable { get; set; }
    public int Id { get; set; }
    public string? Name { get; set; }
}
