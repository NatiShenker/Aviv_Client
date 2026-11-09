namespace Aviv_Service.Utils;

/// <summary>
/// תוספת למחלקה הקיימת StoredProcedures (זו שמכילה את GET_LOCATIONS): שמות שלוש הפרוצדורות של "הגבלות לחניך" (A-15, T-14).
/// אם המחלקה בסרביס אינה מסומנת partial, מוסיפים לה את המילה partial או מעתיקים את שלושת הקבועים לתוכה.
/// </summary>
public static partial class StoredProcedures
{
    public const string GET_TRAINEE_RESTRICTIONS = "SP_AVIV_GET_TRAINEE_RESTRICTIONS";
    public const string CREATE_TRAINEE_RESTRICTION = "SP_AVIV_CREATE_TRAINEE_RESTRICTION";
    public const string UPDATE_TRAINEE_RESTRICTION = "SP_AVIV_UPDATE_TRAINEE_RESTRICTION";
}
