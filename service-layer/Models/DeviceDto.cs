namespace Aviv_Service.Models;

// רשימת המכשירים (ספק 00 §6): הבקשה והתשובה באותו קובץ, כמו WingDto.cs בסרביס (E-12).
// E-6: אין שורה נפרדת – Dapper ממלא את DeviceDto ישירות, והתשובה היא רשימה חשופה שלו, כמו UnifiedLocationDto.

/// <summary>
/// POST Devices/GetInstituteDevices – המכשירים הפעילים של פנימיות ו/או אגפים (E-7), בשמות בסגנון ה-DB (A-7).
/// מכשיר נכלל כשהפנימייה שלו ברשימה הראשונה או האגף הלוגי שלו ברשימה השנייה; לפחות אחת מהרשימות אינה ריקה (הקונטרולר בודק).
/// </summary>
public record DeviceRequestDto(int[] IdntInstitutionList, int[] IdntWingList);

/// <summary>מכשיר פעיל אחד (AVIV_DEVICE_DATA), עם השם המורכב והאגף שהוא מקובץ תחתיו. הכינויים ב-SQL הם שמות המאפיינים.</summary>
public class DeviceDto
{
    /// <summary>AVIV_DEVICE_DATA.IDNT_DEVICE – גם המספר שמופיע בשם.</summary>
    public int IdntDevice { get; set; }

    /// <summary>"מכשיר {מזהה}, {המיקום המלא}" – מורכב בפרוצדורה, המקום היחיד שבו נבנה שם מכשיר (E-3, E-8).</summary>
    public string TextDeviceName { get; set; } = "";

    /// <summary>האגף לקיבוץ בבורר: אגף אמיתי כשהמיקום תחת אגף, אחרת האגף הווירטואלי 99999 ("מיקומים שונים") (E-4).</summary>
    public int IdntWing { get; set; }

    public int IdntInstitution { get; set; }
}
