namespace Aviv_Service.Utils;

/// <summary>
/// גבולות הקלט הייחודיים ל"הגבלות לחניך". הגבולות המשותפים לכל הפיצ'רים יושבים ליד מה שהם מגבילים:
/// RequestRules.DurationMinutesMin / Max ו-FilePaths.TextFileMaxLength (T-12).
/// </summary>
public static class TraineeRestrictionsLimits
{
    /// <summary>אורך AVIV_TRAINEE_RESTRICTION.TEXT_RESTRICTION_REASON – הנחה (I-14) עד שהעמודה נבדקת ב-SSMS (TQ-2); משתנה כאן ובפרוצדורות.</summary>
    public const int DetailsMaxLength = 1000;
}

/// <summary>שמות השדות של בקשות "הגבלות לחניך" כפי שהם מוחזרים ב-400: camelCase כמו ה-JSON וכמו ה-THROW בפרוצדורות (A-2, I-21).</summary>
public static class TraineeRestrictionsRequestFields
{
    public const string IdntTraineeList = "idntTraineeList";
    public const string IdntPrevious = "idntPrevious";
    public const string DateRestrictionStart = "dateRestrictionStart";
    public const string DateRestrictionEnd = "dateRestrictionEnd";
    public const string NumbDurationLimit = "numbDurationLimit";
    public const string TimePermitStart = "timePermitStart";
    public const string TimePermitEnd = "timePermitEnd";
    public const string IdntDeviceList = "idntDeviceList";
    public const string TextRestrictionReason = "textRestrictionReason";
    public const string IdntUserApproval = "idntUserApproval";
    public const string TextFile = "textFile";
}
