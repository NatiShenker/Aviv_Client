using System.Data;
using Aviv_Service.Utils;
using Dapper;
using Iwaf.Data;

namespace Aviv_Service.Repository;

/// <summary>
/// הוספת הפרמטרים של פרוצדורות השמירה והקריאה (T-12): אותם שמות ואותם סוגים בכל הפרוצדורות (02-architecture.md §3).
/// ההמרות של A-8 (מחרוזות תאריך ושעה → DateTime, רשימת מספרים → מחרוזת אחת) נעשות כאן, בשורת הוספת הפרמטר.
/// TVP dbo.INT_TABLE דרך ההרחבה הקיימת ToDataTable, כמו ב-LocationsRepository (A-16; ה-using של ההרחבה מותאם בסרביס האמיתי, צ'קליסט 03 §F.2).
/// TI-7: AddPhoneNumberList משמש היום רק את 04 ויושב כאן ליד שאר הפרמטרים.
/// </summary>
public static class ProcedureParameters
{
    /// <summary>
    /// רשימת מזהים כ-TVP dbo.INT_TABLE. רשימה חסרה נשלחת ריקה וכפילויות מוסרות כאן (כמו הנרמול ב-LocationsRepository),
    /// כי הפרוצדורות ממלאות מהרשימות טבלאות זמניות עם מפתח ראשי; בשמירות הוולידטור כבר עשה זאת (I-4).
    /// </summary>
    public static void AddIdList(DynamicParameters parameters, string parameterName, int[]? ids)
    {
        List<int> distinctIds = (ids ?? []).Distinct().ToList();
        parameters.Add(parameterName, distinctIds.ToDataTable(), DbType.Object);
    }

    /// <summary>A-9: המספרים המנורמלים עוברים כמחרוזת אחת מופרדת בפסיקים (@PHONE_NUMBER_LIST), ונפרקים בפרוצדורה ב-STRING_SPLIT.</summary>
    public static void AddPhoneNumberList(DynamicParameters parameters, string[] normalizedNumbers)
    {
        parameters.Add("@PHONE_NUMBER_LIST", PhoneNumbers.JoinForProcedure(normalizedNumbers), DbType.AnsiString, size: PhoneNumbers.ListMaxLength);
    }

    /// <summary>A-8: מחרוזות "yyyy-MM-dd" שכבר עברו את הוולידטור הופכות כאן ל-DATETIME של הפרוצדורה.</summary>
    public static void AddDateRange(DynamicParameters parameters, string startParameterName, string startDate, string endParameterName, string endDate)
    {
        parameters.Add(startParameterName, DateTimeStrings.ParseDate(startDate), DbType.DateTime);
        parameters.Add(endParameterName, DateTimeStrings.ParseDate(endDate), DbType.DateTime);
    }

    /// <summary>תנאי ההיתר או ההגבלה: משך, שעות ("HH:mm" על תאריך הבסיס, A-8; ריק = כל היממה) ומכשירים (D-2).</summary>
    public static void AddConditions(DynamicParameters parameters, int? durationMinutes, string? timePermitStart, string? timePermitEnd, int[] deviceIds)
    {
        parameters.Add("@NUMB_DURATION_LIMIT", durationMinutes, DbType.Int32);
        parameters.Add("@TIME_PERMIT_START", DateTimeStrings.ParseTimeOrNull(timePermitStart), DbType.DateTime);
        parameters.Add("@TIME_PERMIT_END", DateTimeStrings.ParseTimeOrNull(timePermitEnd), DbType.DateTime);
        AddIdList(parameters, "@IDNT_DEVICE_LIST", deviceIds);
    }

    /// <summary>
    /// הפירוט (varchar, P-9; שם הפרמטר ואורך העמודה הם של כל פיצ'ר, I-14), קוד הסיבה (I-23: שם הפרמטר לפי הפעולה –
    /// @CODE_RESTRICTION_REASON / @CODE_PERMIT_REASON; הפרוצדורה מקבלת ולא כותבת עד שתהיה עמודה), המאשר וקובץ האישור (D-13).
    /// </summary>
    public static void AddApproval(
        DynamicParameters parameters,
        string detailsParameterName,
        string details,
        int detailsMaxLength,
        string codeReasonParameterName,
        int codeReason,
        int approverId,
        string textFile)
    {
        parameters.Add(detailsParameterName, details, DbType.AnsiString, size: detailsMaxLength);
        parameters.Add(codeReasonParameterName, codeReason, DbType.Int32);
        parameters.Add("@IDNT_USER_APPROVAL", approverId, DbType.Int32);
        parameters.Add("@TEXT_FILE", textFile, DbType.String, size: FilePaths.TextFileMaxLength);
    }

    /// <summary>D-14, D-19: המשתמש הפועל ומזהה הבקשה, נחתמים על כל שורה שנכתבת.</summary>
    public static void AddActingUser(DynamicParameters parameters, int actingUserId, Guid requestUid)
    {
        parameters.Add("@IDNT_USER", actingUserId, DbType.Int32);
        parameters.Add("@REQUEST_UID", requestUid, DbType.Guid);
    }
}
