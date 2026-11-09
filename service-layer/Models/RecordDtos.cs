namespace Aviv_Service.Models;

// הטיפוסים שכל רשומה (הגבלה, היתר, הודעה) מחזירה באותה צורה, לכל הפיצ'רים (T-12).
// "Record" הוא המונח של הקליינט (src/features/records) למה שמשותף להגבלה, להיתר ולהודעה.

/// <summary>מזהה ושם לתצוגה (מכשיר, פנימייה). שם ריק כשאין שורת ייחוס (C-8).</summary>
public class LookupItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

/// <summary>הגורם המאשר (IDNT_USER_APPROVAL). I-22: השם מצורף בפרוצדורות מ-ODSINTERNALDATA..A_WORKERS; ריק כשאין שורת ייחוס (C-8). התפקיד לא מצורף.</summary>
public class ApproverDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string? RoleTitle { get; set; }
}

/// <summary>קובץ האישור (AVIV_FILE). D-13: TextFile הוא הנתיב ב-SharePoint, FileName נגזר מהקטע האחרון שלו (FilePaths).</summary>
public class FileDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = "";
    public string TextFile { get; set; } = "";
}

/// <summary>תשובת כל שמירה (A-14, I-20): המזהים שנוצרו בלבד. הקליינט טוען מחדש את ההיסטוריה ופותח את CreatedIds[0].</summary>
public class MutationResultDto
{
    public List<int> CreatedIds { get; set; } = [];
}
