namespace Aviv_Service.Models.PhoneExceptions;

// בקשות "הגבלות והיתרים למספר" (פיצ'ר 04), בשמות בסגנון ה-DB כמו שאר הסרביס (A-7).
// תאריכים ושעות כמחרוזות "yyyy-MM-dd" / "HH:mm" (A-8). TextFileName לתצוגה בלבד; הפרוצדורות מקבלות @TEXT_FILE בלבד (D-13).

/// <summary>POST PhoneExceptions/GetTraineePhoneRecords – ההיסטוריה המלאה של חניכים (B-5).</summary>
public record GetTraineePhoneRecordsRequestDto(int[] IdntTraineeList);

/// <summary>
/// POST PhoneExceptions/LookupPhoneRestrictionsForPermit – ההגבלות שחלות על החניך עבור מספרים, לבחירת הגבלת המקור של היתר (G-3b).
/// B-4: פנימיית החניך מגיעה מהקליינט.
/// </summary>
public record LookupRestrictionsForPermitRequestDto(int IdntTrainee, int IdntInstitution, string[] PhoneNumberList);

/// <summary>
/// POST PhoneExceptions/CreateTraineePhoneRestriction – "הגבלה למספר" לחניכים, רשומה לכל זוג חניך × מספר (P-12).
/// CodeRestrictionReason – קוד הסיבה מהרשימה הסגורה; מתקבל ועובר לפרוצדורה, לא נשמר עד שתהיה עמודה (I-23, Q-12).
/// </summary>
public record CreateTraineeRestrictionNumberRequestDto(
    int[] IdntTraineeList,
    string[] PhoneNumberList,
    string DateRestrictionStart,
    string DateRestrictionEnd,
    int? NumbDurationLimit,
    string? TimePermitStart,
    string? TimePermitEnd,
    int[] IdntDeviceList,
    string TextRestrictionReason,
    int CodeRestrictionReason,
    int IdntUserApproval,
    string TextFile,
    string? TextFileName);

/// <summary>
/// PUT PhoneExceptions/UpdateTraineePhoneRestriction – גרסה חדשה של "הגבלה למספר" (D-1).
/// IdntPrevious הוא מזהה שורת החניך הקודמת (AVIV_TRAINEE_RESTRICTION_NUMBER); המספר והחניך נלקחים ממנה ב-DB.
/// </summary>
public record UpdateTraineeRestrictionNumberRequestDto(
    int IdntPrevious,
    string DateRestrictionStart,
    string DateRestrictionEnd,
    int? NumbDurationLimit,
    string? TimePermitStart,
    string? TimePermitEnd,
    int[] IdntDeviceList,
    string TextRestrictionReason,
    int CodeRestrictionReason,
    int IdntUserApproval,
    string TextFile,
    string? TextFileName);

/// <summary>
/// POST PhoneExceptions/CreateTraineePhonePermit – "היתר למספר" לחניכים על הגבלת מקור אחת (D-4).
/// C-6: IdntInstitution נדרש לבדיקה שהגבלה כללית המצומצמת לפנימיות חלה על החניכים; null מדלג על הבדיקה.
/// CodePermitReason – קוד הסיבה מהרשימה הסגורה; מתקבל ועובר לפרוצדורה, לא נשמר עד שתהיה עמודה (I-23, Q-12).
/// </summary>
public record CreateTraineePermitRequestDto(
    int[] IdntTraineeList,
    int? IdntInstitution,
    int IdntAvivRestrictionNumber,
    string DatePermitStart,
    string DatePermitEnd,
    int? NumbDurationLimit,
    string? TimePermitStart,
    string? TimePermitEnd,
    int[] IdntDeviceList,
    string TextPermitReason,
    int CodePermitReason,
    int IdntUserApproval,
    string TextFile,
    string? TextFileName);

/// <summary>
/// PUT PhoneExceptions/UpdateTraineePhonePermit – גרסה חדשה של "היתר למספר" (D-1).
/// IdntPrevious הוא מזהה ההיתר הקודם; ההגבלה והחניך נלקחים ממנו ב-DB, לא מהבקשה.
/// </summary>
public record UpdateTraineePermitRequestDto(
    int IdntPrevious,
    string DatePermitStart,
    string DatePermitEnd,
    int? NumbDurationLimit,
    string? TimePermitStart,
    string? TimePermitEnd,
    int[] IdntDeviceList,
    string TextPermitReason,
    int CodePermitReason,
    int IdntUserApproval,
    string TextFile,
    string? TextFileName);
