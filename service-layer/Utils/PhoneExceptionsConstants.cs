namespace Aviv_Service.Utils;

/// <summary>
/// גבולות הקלט הייחודיים ל"הגבלות והיתרים למספר" (§6). כל גבול אחר יושב ליד מה שהוא מגביל:
/// RequestRules.DurationMinutesMin / Max, FilePaths.TextFileMaxLength, PhoneNumbers.ListMaxLength (T-12 של 03).
/// </summary>
public static class PhoneExceptionsLimits
{
    /// <summary>I-14: אורך עמודות הפירוט הוא הנחה; אם העמודה קצרה יותר, משנים כאן ובפרוצדורות.</summary>
    public const int DetailsMaxLength = 1000;
}

/// <summary>שמות השדות כפי שהם מוחזרים ב-400: camelCase כמו ה-JSON וכמו ה-THROW בפרוצדורות (A-2, I-21).</summary>
public static class PhoneExceptionsRequestFields
{
    public const string IdntTraineeList = "idntTraineeList";
    public const string IdntTrainee = "idntTrainee";
    public const string IdntInstitution = "idntInstitution";
    public const string PhoneNumberList = "phoneNumberList";
    public const string IdntAvivRestrictionNumber = "idntAvivRestrictionNumber";
    public const string IdntPrevious = "idntPrevious";
    public const string DateRestrictionStart = "dateRestrictionStart";
    public const string DateRestrictionEnd = "dateRestrictionEnd";
    public const string DatePermitStart = "datePermitStart";
    public const string DatePermitEnd = "datePermitEnd";
    public const string NumbDurationLimit = "numbDurationLimit";
    public const string TimePermitStart = "timePermitStart";
    public const string TimePermitEnd = "timePermitEnd";
    public const string IdntDeviceList = "idntDeviceList";
    public const string TextRestrictionReason = "textRestrictionReason";
    public const string TextPermitReason = "textPermitReason";
    public const string IdntUserApproval = "idntUserApproval";
    public const string TextFile = "textFile";
}
