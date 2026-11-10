namespace Aviv_Service.Utils;

/// <summary>טבלת קוד מוכרת ב-AVIV_DECODE: מספרה (CODE_TABLE) והשם שחוזר לקליינט לדיבוג (K-3).</summary>
public record DecodeTable(int CodeTable, string Name);

/// <summary>
/// רישום טבלאות הקוד שהקליינט רשאי לבקש (K-3): גם מפת מספר → שם, גם רשימת המותרים – מספר לא מוכר הוא 400.
/// KQ-1: המספרים זמניים (1–3, בסדר של ספק 00 §6) עד שה-DBA יקבע אותם; הקליינט מחזיק אותם ב-src/config/decodeTables.ts, ושינוי הוא עריכה אחת בכל צד.
/// KI-1: הרשומה והרישום באותו קובץ – מושג אחד. ליד כל טבלה – העמודה שהסט שלה משרת, לשמירת האחידות עם שמות הטבלאות (K-1).
/// סוג ההגבלה והיקפה (D-10) אינם כאן: הפרוצדורות מחזיקות אותם כקבועים והקליינט אינו מבקש אותם (K-7).
/// </summary>
public static class DecodeTables
{
    /// <summary>סיבות להגבלה לחניך (03) – AVIV_TRAINEE_RESTRICTION.CODE_RESTRICTION_REASON (I-23, העמודה טרם נוספה).</summary>
    public static readonly DecodeTable TraineeRestrictionReasons = new(1, nameof(TraineeRestrictionReasons));

    /// <summary>סיבות להגבלה ולהיתר למספר (04) – CODE_RESTRICTION_REASON / CODE_PERMIT_REASON (I-23).</summary>
    public static readonly DecodeTable PhoneExceptionReasons = new(2, nameof(PhoneExceptionReasons));

    /// <summary>סיבות להודעה קולית (05).</summary>
    public static readonly DecodeTable VoiceMessageReasons = new(3, nameof(VoiceMessageReasons));

    public static readonly IReadOnlyList<DecodeTable> All = [TraineeRestrictionReasons, PhoneExceptionReasons, VoiceMessageReasons];

    public static bool IsKnown(int codeTable)
    {
        return All.Any(table => table.CodeTable == codeTable);
    }

    /// <summary>לקריאה אחרי IsKnown בלבד (הוולידטור בודק את כל הבקשה קודם).</summary>
    public static string NameOf(int codeTable)
    {
        return All.First(table => table.CodeTable == codeTable).Name;
    }
}
