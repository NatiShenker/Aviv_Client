namespace Aviv_Service.Models;

// תשובות "הגבלות והיתרים למספר". תאריכים "yyyy-MM-dd", שעות "HH:mm", חותמות ביקורת "yyyy-MM-ddTHH:mm:ss" (A-8, I-18).
// I-19: הדגלים IsPermit ו-IsEnded וקוד ה-scope מגיעים מהפרוצדורה כמו שהם; הקליינט מחזיק את ה-LOOKUP ומחליט מה להציג.

/// <summary>תשובת GetTraineePhoneRecords: הגבלות והיתרים באותה רשימה; המיון הוא של הקליינט (B-5).</summary>
public class TraineePhoneRecordsResponseDto
{
    public List<TraineePhoneRecordDto> Records { get; set; } = [];
}

/// <summary>רשומה אחת בהיסטוריית המספרים של חניך: הגבלה או היתר, לפי IsPermit (A-4).</summary>
public class TraineePhoneRecordDto
{
    /// <summary>false – הגבלה, Id הוא שורת החניך (AVIV_TRAINEE_RESTRICTION_NUMBER); true – היתר, Id הוא ההיתר (AVIV_PERMITS_FOR_RESTRICTION).</summary>
    public bool IsPermit { get; set; }

    public int Id { get; set; }

    /// <summary>הגבלת המספר (AVIV_RESTRICTION_NUMBER): ההורה של הגבלה, או הגבלת המקור של היתר.</summary>
    public int IdntAvivRestrictionNumber { get; set; }

    public int IdntTrainee { get; set; }
    public int IdntAvivListPhoneNumber { get; set; }
    public string TextPhoneNumber { get; set; } = "";
    public string DateStart { get; set; } = "";
    public string DateEnd { get; set; } = "";

    /// <summary>הסתיימה לפי שעון השרת, ברמת יום (I-19). הקליינט גוזר ממנה את התווית, את כפתור הכרטיס, את המיון ואת חסימת העריכה.</summary>
    public bool IsEnded { get; set; }

    // תנאי ההיתר או תנאי ההגבלה (D-2); null = מלא / כל היממה
    public int? NumbDurationLimit { get; set; }
    public string? TimePermitStart { get; set; }
    public string? TimePermitEnd { get; set; }
    public List<LookupItemDto> Devices { get; set; } = [];

    /// <summary>הפירוט החופשי (D-6).</summary>
    public string TextReason { get; set; } = "";

    public ApproverDto Approver { get; set; } = new();
    public FileDto ApprovedFile { get; set; } = new();

    public string DateCreated { get; set; } = "";
    public string? DateUpdated { get; set; }
    public int IdntUserUpdate { get; set; }

    /// <summary>היתר בלבד: תקציר הגבלת המקור ("חל על הגבלה").</summary>
    public SourceRestrictionSummaryDto? SourceRestriction { get; set; }
}

/// <summary>
/// תקציר הגבלת המקור: בתוצאות ה-lookup (כרטיס לבחירה) ובתוך רשומת היתר בהיסטוריה.
/// CodeRestrictionScope הוא DECODE AVIV_RESTRICTION_SCOPE כפי שהוא (1 כללית, 2 חניך; D-10). ארצי/פנימייתי נגזר בקליינט מ-Institutes (A-5, C-9).
/// </summary>
public class SourceRestrictionSummaryDto
{
    public int IdntAvivRestrictionNumber { get; set; }

    /// <summary>שורת החניך של הגבלת חניך; null להגבלה כללית.</summary>
    public int? IdntAvivTraineeRestrictionNumber { get; set; }

    public int IdntAvivListPhoneNumber { get; set; }
    public string TextPhoneNumber { get; set; } = "";
    public int CodeRestrictionScope { get; set; }
    public List<LookupItemDto> Institutes { get; set; } = [];
    public string DateStart { get; set; } = "";
    public string DateEnd { get; set; } = "";
    public string TextReason { get; set; } = "";

    /// <summary>היתרי החניך שכבר קיימים על ההגבלה ולא הסתיימו. ממולא ב-lookup בלבד; בהיסטוריה ריק (§8).</summary>
    public List<ExistingPermitDto> ExistingTraineePermits { get; set; } = [];
}

/// <summary>היתר קיים של החניך על הגבלת מקור, להצגה בכרטיס הבחירה ("קיים היתר: 16:00–19:00 · עד 15 דק׳").</summary>
public class ExistingPermitDto
{
    public int Id { get; set; }
    public string DateStart { get; set; } = "";
    public string DateEnd { get; set; } = "";
    public int? NumbDurationLimit { get; set; }
    public string? TimePermitStart { get; set; }
    public string? TimePermitEnd { get; set; }
    public List<LookupItemDto> Devices { get; set; } = [];
}

/// <summary>תשובת LookupPhoneRestrictionsForPermit: תוצאה לכל מספר שנשלח, בסדר הבקשה.</summary>
public class LookupRestrictionsForPermitResponseDto
{
    public List<PhoneLookupResultDto> Results { get; set; } = [];
}

/// <summary>ההגבלות שחלות על החניך עבור מספר אחד, ממוינות ארצי → פנימייה → חניך → תאריך התחלה (ספק 04 §2.7). ריק = אין הגבלה על המספר.</summary>
public class PhoneLookupResultDto
{
    public string TextPhoneNumber { get; set; } = "";
    public List<SourceRestrictionSummaryDto> ActiveRestrictions { get; set; } = [];
}

/// <summary>מזהה ושם לתצוגה (מכשיר, פנימייה). שם ריק כשאין שורת ייחוס (C-8).</summary>
public class LookupItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

/// <summary>הגורם המאשר (IDNT_USER_APPROVAL). Q-1, I-8: טבלת המשתמשים במסד אחר – השם ריק עד שיהיה JOIN; הקליינט מציג את המזהה.</summary>
public class ApproverDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string? RoleTitle { get; set; }
}

/// <summary>קובץ האישור (AVIV_FILE). D-13: TextFile הוא הנתיב ב-SharePoint, FileName נגזר מהקטע האחרון שלו.</summary>
public class FileDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = "";
    public string TextFile { get; set; } = "";
}

/// <summary>תשובת כל שמירה (A-14): המזהים שנוצרו בלבד. הקליינט טוען מחדש את ההיסטוריה ופותח את CreatedIds[0].</summary>
public class MutationResultDto
{
    public List<int> CreatedIds { get; set; } = [];
}
