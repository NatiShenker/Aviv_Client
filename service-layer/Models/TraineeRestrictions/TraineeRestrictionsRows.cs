namespace Aviv_Service.Models.TraineeRestrictions;

// השורות השטוחות שהפרוצדורות של "הגבלות לחניך" מחזירות. הכינויים ב-SQL הם שמות המאפיינים (Dapper ממפה לפי שם).
// תאריכים כ-DateTime; המחרוזות נוצרות ב-TraineeRestrictionsAssembler (I-5). DeviceRow ו-CreatedIdRow משותפים (T-12).

/// <summary>תוצאה 1 של SP_AVIV_GET_TRAINEE_RESTRICTIONS: הגבלה אחת – שורת ההגבלה, שורת התנאים הפנימית שלה (אם יש) והקובץ.</summary>
public class TraineeRestrictionRow
{
    public int Id { get; set; }
    public bool IsEnded { get; set; }

    /// <summary>שורת התנאים הפנימית שאליה שייכים המכשירים של תוצאה 2 (D-2); null כשאין שעות ומכשירים (T-2).</summary>
    public int? ConditionsRowId { get; set; }

    public int TraineeId { get; set; }
    public DateTime DateStart { get; set; }
    public DateTime DateEnd { get; set; }

    /// <summary>משורת ההגבלה (T-2); null = הגבלה מלאה.</summary>
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
}

/// <summary>שני סטי התוצאה של SP_AVIV_GET_TRAINEE_RESTRICTIONS, בסדר שבו הפרוצדורה מחזירה אותם (T-6).</summary>
public record TraineeRestrictionsRowSets(
    List<TraineeRestrictionRow> Restrictions,
    List<DeviceRow> Devices);
