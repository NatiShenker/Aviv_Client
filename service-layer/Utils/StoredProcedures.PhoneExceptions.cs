namespace Aviv_Service.Utils;

/// <summary>
/// תוספת למחלקה הקיימת StoredProcedures (זו שמכילה את GET_LOCATIONS): שמות ששת הפרוצדורות של "הגבלות והיתרים למספר" (A-15).
/// אם המחלקה בסרביס אינה מסומנת partial, מוסיפים לה את המילה partial או מעתיקים את ששת הקבועים לתוכה.
/// </summary>
public static partial class StoredProcedures
{
    public const string GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS = "SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS";
    public const string GET_RESTRICTIONS_FOR_PERMIT = "SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT";
    public const string CREATE_TRAINEE_RESTRICTION_NUMBER = "SP_AVIV_CREATE_TRAINEE_RESTRICTION_NUMBER";
    public const string UPDATE_TRAINEE_RESTRICTION_NUMBER = "SP_AVIV_UPDATE_TRAINEE_RESTRICTION_NUMBER";
    public const string CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER = "SP_AVIV_CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER";
    public const string UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER = "SP_AVIV_UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER";
}
