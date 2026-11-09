namespace Aviv_Service.Models;

// השורות השטוחות שפרוצדורות הקריאה והשמירה של כל הפיצ'רים מחזירות באותה צורה (T-12). הכינויים ב-SQL הם שמות המאפיינים.
// TI-7: InstituteRow משמש היום רק את 04, ויושב כאן ליד DeviceRow כי זה אותו סוג שורה (מזהה + שם לפי הורה).

/// <summary>
/// שורת מכשיר של שורת תנאים או של היתר (AVIV_PERMITS_DEVICE). ConditionsRowId – השורה ב-AVIV_PERMITS_FOR_RESTRICTION שאליה שייך המכשיר.
/// השם מ-AVIV_DEVICE_DATA; ריק כשאין שורת ייחוס (I-15).
/// </summary>
public class DeviceRow
{
    public int ConditionsRowId { get; set; }
    public int DeviceId { get; set; }
    public string DeviceName { get; set; } = "";
}

/// <summary>פנימייה המקושרת להגבלה כללית (AVIV_INSTITUTES_RESTRICTION_NUMBER). השם מ-A_LOCATION; ריק כשאין שורת ייחוס (I-15).</summary>
public class InstituteRow
{
    public int RestrictionNumberId { get; set; }
    public int InstituteId { get; set; }
    public string InstituteName { get; set; } = "";
}

/// <summary>סט התוצאה האחרון של כל פרוצדורת שמירה: המזהים שנוצרו (A-14).</summary>
public class CreatedIdRow
{
    public int CreatedId { get; set; }
}
