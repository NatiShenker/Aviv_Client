namespace Aviv_Service.Models.TraineeRestrictions;

// בקשות "הגבלות לחניך" (פיצ'ר 03), בשמות בסגנון ה-DB כמו שאר הסרביס (A-7).
// תאריכים ושעות כמחרוזות "yyyy-MM-dd" / "HH:mm" (A-8). TextFileName לתצוגה בלבד; הפרוצדורות מקבלות @TEXT_FILE בלבד (D-13).

/// <summary>POST TraineeRestrictions/GetTraineeRestrictions – ההיסטוריה המלאה של חניכים (B-5).</summary>
public record GetTraineeRestrictionsRequestDto(int[] IdntTraineeList);

/// <summary>
/// POST TraineeRestrictions/CreateTraineeRestriction – "הגבלה לחניך" לחניכים, רשומה לכל חניך (P-12).
/// NumbDurationLimit ריק = הגבלה מלאה (ספק 03 §2.2); שעות ומכשירים ריקים = כל היממה / כל המכשירים.
/// CodeRestrictionReason – קוד הסיבה מהרשימה הסגורה; מתקבל ועובר לפרוצדורה, לא נשמר עד שתהיה עמודה (I-23, Q-12).
/// </summary>
public record CreateTraineeRestrictionRequestDto(
    int[] IdntTraineeList,
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
/// PUT TraineeRestrictions/UpdateTraineeRestriction – גרסה חדשה של "הגבלה לחניך" (D-1, T-7).
/// IdntPrevious הוא מזהה השורה הקודמת (AVIV_TRAINEE_RESTRICTION); החניך נלקח ממנה ב-DB ולא נשלח (T-9).
/// </summary>
public record UpdateTraineeRestrictionRequestDto(
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
