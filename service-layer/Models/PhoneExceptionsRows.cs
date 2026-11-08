namespace Aviv_Service.Models;

// השורות השטוחות שהפרוצדורות של "הגבלות והיתרים למספר" מחזירות. הכינויים ב-SQL הם שמות המאפיינים (Dapper ממפה לפי שם).
// תאריכים כ-DateTime; המחרוזות נוצרות ב-PhoneRecordsAssembler (I-5).

/// <summary>
/// תוצאות 1 ו-2 של SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS: הגבלה (IsPermit = 0) או היתר (IsPermit = 1), אותם כינויים בשתיהן.
/// העמודות של היתר בלבד (Source*) חסרות בתוצאת ההגבלות, ולכן הן nullable ונשארות ריקות שם.
/// </summary>
public class PhoneRecordRow
{
    public int Id { get; set; }
    public bool IsPermit { get; set; }
    public bool IsEnded { get; set; }

    /// <summary>הגבלת המספר (AVIV_RESTRICTION_NUMBER): ההורה של הגבלה, או הגבלת המקור של היתר.</summary>
    public int RestrictionNumberId { get; set; }

    /// <summary>השורה שאליה שייכים המכשירים (D-2): שורת התנאים הצמודה של הגבלה (null כשאין תנאים), או ההיתר עצמו.</summary>
    public int? ConditionsRowId { get; set; }

    public int TraineeId { get; set; }
    public int PhoneNumberId { get; set; }
    public string PhoneNumber { get; set; } = "";
    public DateTime DateStart { get; set; }
    public DateTime DateEnd { get; set; }
    public int? NumbDurationLimit { get; set; }
    public DateTime? TimePermitStart { get; set; }
    public DateTime? TimePermitEnd { get; set; }
    public string? TextReason { get; set; }
    public int? IdntUserApproval { get; set; }
    public int? IdntApprovedFile { get; set; }
    public string? TextFile { get; set; }

    // I-18: עמודות הביקורת nullable – שורות שנכתבו לפני הפיצ'ר עשויות להיות בלי ערך, ו-Dapper נופל על NULL למאפיין לא-nullable
    public DateTime? DateCreated { get; set; }
    public DateTime? DateUpdated { get; set; }
    public int? IdntUserUpdate { get; set; }

    // היתר בלבד: תקציר הגבלת המקור
    public int? SourceCodeRestrictionScope { get; set; }
    public DateTime? SourceDateStart { get; set; }
    public DateTime? SourceDateEnd { get; set; }
    public string? SourceTextReason { get; set; }
    public int? SourceTraineeRestrictionNumberId { get; set; }
}

/// <summary>תוצאה 1 של SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT: הגבלה שחלה על החניך עבור מספר מהבקשה (A-5).</summary>
public class SourceRestrictionRow
{
    public string PhoneNumber { get; set; } = "";
    public int RestrictionNumberId { get; set; }

    /// <summary>שורת החניך, רק להגבלת חניך.</summary>
    public int? TraineeRestrictionNumberId { get; set; }

    public int PhoneNumberId { get; set; }

    /// <summary>CODE_RESTRICTION_SCOPE: 1 כללית, 2 חניך (D-5).</summary>
    public int CodeRestrictionScope { get; set; }

    public DateTime DateStart { get; set; }
    public DateTime DateEnd { get; set; }
    public string? TextReason { get; set; }
}

/// <summary>פנימייה המקושרת להגבלה כללית (AVIV_INSTITUTES_RESTRICTION_NUMBER). היסטוריה תוצאה 4, lookup תוצאה 2. שם ריק כשאין שורת ייחוס (I-15).</summary>
public class InstituteRow
{
    public int RestrictionNumberId { get; set; }
    public int InstituteId { get; set; }
    public string InstituteName { get; set; } = "";
}

/// <summary>תוצאה 3 של SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT: היתר קיים של החניך על הגבלת מקור, שלא הסתיים.</summary>
public class ExistingPermitRow
{
    public int PermitId { get; set; }
    public int RestrictionNumberId { get; set; }
    public DateTime DateStart { get; set; }
    public DateTime DateEnd { get; set; }
    public int? NumbDurationLimit { get; set; }
    public DateTime? TimePermitStart { get; set; }
    public DateTime? TimePermitEnd { get; set; }
}

/// <summary>
/// מכשיר של שורת תנאים או של היתר (AVIV_PERMITS_DEVICE). היסטוריה תוצאה 3, lookup תוצאה 4.
/// ConditionsRowId – השורה ב-AVIV_PERMITS_FOR_RESTRICTION שאליה שייך המכשיר. שם ריק כשאין שורת ייחוס (I-15).
/// </summary>
public class DeviceRow
{
    public int ConditionsRowId { get; set; }
    public int DeviceId { get; set; }
    public string DeviceName { get; set; } = "";
}

/// <summary>סט התוצאה האחרון של כל פרוצדורת שמירה: המזהים שנוצרו (A-14).</summary>
public class CreatedIdRow
{
    public int CreatedId { get; set; }
}

/// <summary>סטי התוצאה של SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS: הרשומות (הגבלות והיתרים יחד), המכשירים, הפנימיות.</summary>
public record TraineePhoneRecordsRowSets(
    List<PhoneRecordRow> Records,
    List<DeviceRow> Devices,
    List<InstituteRow> Institutes);

/// <summary>ארבעת סטי התוצאה של SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT, בסדר שבו הפרוצדורה מחזירה אותם.</summary>
public record RestrictionsForPermitRowSets(
    List<SourceRestrictionRow> Restrictions,
    List<InstituteRow> Institutes,
    List<ExistingPermitRow> ExistingPermits,
    List<DeviceRow> PermitDevices);
