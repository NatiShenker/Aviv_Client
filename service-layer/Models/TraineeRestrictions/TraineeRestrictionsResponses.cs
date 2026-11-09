namespace Aviv_Service.Models.TraineeRestrictions;

// תשובות "הגבלות לחניך". תאריכים "yyyy-MM-dd", שעות "HH:mm", חותמות ביקורת "yyyy-MM-ddTHH:mm:ss" (A-8, I-18).
// I-19: הדגל IsEnded מגיע מהפרוצדורה כמו שהוא; הקליינט גוזר ממנו את התווית, את כפתור הכרטיס, את המיון ואת חסימת העריכה.
// הטיפוסים המשותפים (LookupItemDto, ApproverDto, FileDto, MutationResultDto) יושבים ב-Aviv_Service.Models (T-12).

/// <summary>תשובת GetTraineeRestrictions; המיון והחיפוש הם של הקליינט (B-5).</summary>
public class TraineeRestrictionsResponseDto
{
    public List<TraineeRestrictionRecordDto> Records { get; set; } = [];
}

/// <summary>רשומה אחת בהיסטוריית ההגבלות של חניך: שורת AVIV_TRAINEE_RESTRICTION עם תנאיה.</summary>
public class TraineeRestrictionRecordDto
{
    /// <summary>AVIV_TRAINEE_RESTRICTION.IDNT_AVIV_TRAINEE_RESTRICTION; IdntPrevious של עדכון.</summary>
    public int Id { get; set; }

    public int IdntTrainee { get; set; }
    public string DateStart { get; set; } = "";
    public string DateEnd { get; set; } = "";

    /// <summary>הסתיימה לפי שעון השרת, ברמת יום (I-19). רשומה עתידית אינה "הסתיימה" (C-11).</summary>
    public bool IsEnded { get; set; }

    /// <summary>משך שיחה מרבי בדקות, משורת ההגבלה (T-2). null = הגבלה מלאה (ספק 03 §2.2).</summary>
    public int? NumbDurationLimit { get; set; }

    // שעות ומכשירים מותרים, מהשורה הפנימית (D-2); null / ריק = כל היממה / כל המכשירים
    public string? TimePermitStart { get; set; }
    public string? TimePermitEnd { get; set; }
    public List<LookupItemDto> Devices { get; set; } = [];

    /// <summary>הפירוט החופשי (TEXT_RESTRICTION_REASON, T-3).</summary>
    public string TextReason { get; set; } = "";

    public ApproverDto Approver { get; set; } = new();
    public FileDto ApprovedFile { get; set; } = new();

    public string DateCreated { get; set; } = "";
    public string? DateUpdated { get; set; }
    public int IdntUserUpdate { get; set; }
}
