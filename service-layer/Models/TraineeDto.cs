namespace Aviv_Service.Models;

// רשימת החניכים (ספק 01): הבקשה, התשובה והשורה השטוחה של הפרוצדורה – באותו קובץ, כמו WingDto.cs בסרביס (L-15).
// L-7: TraineeRow היא מה ש-Dapper ממלא; TraineesAssembler מרכיב ממנה את TraineeDto המקונן ומוסיף את נתוני סלקום (L-6).
// I-19: ששת הדגלים מגיעים מהפרוצדורה כמו שהם; HasBalance נגזר ב-assembler כי המקור שלו אינו ב-DB.
// LookupItemDto המשותף יושב ב-Aviv_Service.Models (T-12).

/// <summary>
/// POST Trainees/GetTrainees – החניכים הנוכחיים של פנימיות ו/או אגפים (L-1, L-9), בשמות בסגנון ה-DB (A-7).
/// חניך נכלל כשהפנימייה שלו ברשימה הראשונה או האגף שלו ברשימה השנייה; לפחות אחת מהרשימות אינה ריקה (הקונטרולר בודק).
/// הקליינט שולח היום פנימיות בלבד, ולכן רשימת האגפים יכולה להגיע ריקה או חסרה.
/// </summary>
public record TraineeRequestDto(int[] IdntInstitutionList, int[] IdntWingList);

/// <summary>חניך אחד ברשימה: השורה הפעילה שלו ב-TRAINEE_SNAPSHOT, שמות האגף והמיקום, "מוגבל עד" והדגלים. התשובה היא רשימה חשופה של אלה (L-15).</summary>
public class TraineeDto
{
    /// <summary>TRAINEE_SNAPSHOT.IDNT_TRAINEE – המפתח שכל טבלאות AVIV מצביעות עליו (D-12).</summary>
    public int IdntTrainee { get; set; }

    /// <summary>המספר האישי, מספרי (LQ-1, LQ-3); הקליינט מעצב אותו לתצוגה.</summary>
    public int NumbPersonalNumber { get; set; }

    /// <summary>שם פרטי + שם משפחה, מורכב בפרוצדורה.</summary>
    public string TextFullName { get; set; } = "";

    public int IdntInstitution { get; set; }

    /// <summary>האגף מ-MAIN_WINGS_TABLE; שם ריק כשאין שורת ייחוס (C-8).</summary>
    public LookupItemDto Wing { get; set; } = new();

    /// <summary>המיקום באגף מ-A_LOCATION; null כשלחניך אין מיקום (L-2).</summary>
    public LookupItemDto? Location { get; set; }

    /// <summary>"מוגבל עד": תאריך הסיום המאוחר של הגבלות החניך הפעילות היום, yyyy-MM-dd; null כשאין (L-3).</summary>
    public string? DateRestrictedUntil { get; set; }

    /// <summary>יתרת הדקות מסלקום; 0 מה-stand-in (L-6).</summary>
    public int NumbRemainingMinutes { get; set; }

    public TraineeFlagsDto Flags { get; set; } = new();
}

/// <summary>הדגלים שהכרטיס והמסננים קוראים: "קיימת היום רשומה פעילה" לכל סוג, ושני דגלי סלקום.</summary>
public class TraineeFlagsDto
{
    /// <summary>הגבלה לחניך פעילה היום בלי משך (הרמטית, T-2) – מהפרוצדורה (L-3).</summary>
    public bool HasActiveFullRestriction { get; set; }

    /// <summary>הגבלה לחניך פעילה היום עם משך שיחה – מהפרוצדורה (L-3).</summary>
    public bool HasActiveMinutesRestriction { get; set; }

    /// <summary>הגבלת מספר של החניך עצמו פעילה היום (היקף חניך בלבד) – מהפרוצדורה (L-4).</summary>
    public bool HasActivePhoneRestriction { get; set; }

    /// <summary>היתר למספר פעיל היום לפי תאריכיו – מהפרוצדורה (L-4).</summary>
    public bool HasActivePhonePermit { get; set; }

    /// <summary>הודעה קולית רגילה פעילה היום – מהפרוצדורה (L-5).</summary>
    public bool HasActiveMessage { get; set; }

    /// <summary>הודעה קולית חוזרת (אינטראקטיבית) פעילה היום – מהפרוצדורה (L-5).</summary>
    public bool HasActiveInteractiveMessage { get; set; }

    /// <summary>NumbRemainingMinutes &gt; 0 – נגזר ב-assembler (L-6).</summary>
    public bool HasBalance { get; set; }

    /// <summary>פער בנתונים מול סלקום – מספק סלקום; false מה-stand-in (L-6).</summary>
    public bool HasCellcomDiscrepancy { get; set; }
}

/// <summary>
/// התוצאה האחת של SP_AVIV_GET_TRAINEES: שורה שטוחה לחניך. הכינויים ב-SQL הם שמות המאפיינים (Dapper ממפה לפי שם).
/// nullable בכל מקום שה-ODS עשוי להחזיק NULL (I-18): NULL למאפיין לא-nullable מפיל את המיפוי של כל הרשימה. הדגלים BIT → bool (LI-2).
/// </summary>
public class TraineeRow
{
    public int IdntTrainee { get; set; }
    public int? NumbPersonalNumber { get; set; }
    public string? TextFullName { get; set; }
    public int IdntInstitution { get; set; }
    public int? IdntWing { get; set; }
    public string? TextWingName { get; set; }
    public int? IdntLocation { get; set; }
    public string? TextLocationName { get; set; }

    /// <summary>MAX(DATE_RESTRICTION_END) של ההגבלות הפעילות היום; null כשאין (L-3).</summary>
    public DateTime? DateRestrictedUntil { get; set; }

    public bool HasActiveFullRestriction { get; set; }
    public bool HasActiveMinutesRestriction { get; set; }
    public bool HasActivePhoneRestriction { get; set; }
    public bool HasActivePhonePermit { get; set; }
    public bool HasActiveMessage { get; set; }
    public bool HasActiveInteractiveMessage { get; set; }
}
