namespace Aviv_Service.Utils;

/// <summary>גבולות הקלט של "הגבלות והיתרים למספר" (§6). האורכים שווים לגודלי הפרמטרים בפרוצדורות (A-10) ומשמשים את הוולידטור ואת ה-repository.</summary>
public static class PhoneExceptionsLimits
{
    /// <summary>I-14: אורך עמודות הפירוט הוא הנחה; אם העמודה קצרה יותר, משנים כאן ובפרוצדורות.</summary>
    public const int DetailsMaxLength = 1000;

    public const int TextFileMaxLength = 500;

    /// <summary>A-9, I-17: @PHONE_NUMBER_LIST הוא VARCHAR(500); מחרוזת ארוכה יותר הייתה נקטעת בשקט והמספר האחרון אובד.</summary>
    public const int PhoneNumberListMaxLength = 500;

    public const int DurationMinutesMin = 1;
    public const int DurationMinutesMax = 120;
}

/// <summary>שמות השדות כפי שהם מוחזרים ב-400: camelCase כמו ה-JSON וכמו ה-THROW בפרוצדורות (A-2).</summary>
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
