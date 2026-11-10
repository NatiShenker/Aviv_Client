namespace Aviv_Service.Utils;

/// <summary>
/// תוספת למחלקה הקיימת StoredProcedures (זו שמכילה את GET_LOCATIONS): שם הפרוצדורה של טבלאות הקוד (A-15, K-9).
/// אם המחלקה בסרביס אינה מסומנת partial, מוסיפים לה את המילה partial או מעתיקים את הקבוע לתוכה.
/// </summary>
public static partial class StoredProcedures
{
    public const string GET_DECODE = "SP_AVIV_GET_DECODE";
}
