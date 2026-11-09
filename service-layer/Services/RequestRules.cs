using Aviv_Service.Infrastructure;
using Aviv_Service.Utils;

namespace Aviv_Service.Services;

/// <summary>
/// כללי הקלט המשותפים לכל בקשות השמירה והקריאה (D-18, T-12): כל כלל מקבל את שם השדה כפרמטר וזורק ApiException(400, שם השדה)
/// על הכלל הראשון שנכשל. הוולידטור של כל פיצ'ר מרכיב מהם את הבדיקה שלו עם רשימת שמות השדות שלו (I-21).
/// D-18: אין אילוצי CHECK ב-DB, ולכן סדר התאריכים, טווח המשך וזוג השעות נבדקים כאן בלבד.
/// </summary>
public static class RequestRules
{
    // ספק 03 / 04 form §5: משך שיחה בדקות, מספר שלם בין 1 ל-120
    public const int DurationMinutesMin = 1;
    public const int DurationMinutesMax = 120;

    // ===========================================
    // רשימות מזהים
    // ===========================================

    /// <summary>רשימה שאינה ריקה, כולה חיובית, ללא כפילויות.</summary>
    public static int[] RequireIdList(int[]? ids, string fieldName)
    {
        int[] distinctIds = DistinctPositiveIds(ids, fieldName);

        if (distinctIds.Length == 0)
        {
            throw ApiException.Validation(fieldName);
        }

        return distinctIds;
    }

    /// <summary>רשימה שיכולה להיות ריקה (מכשירים: ריק = כל המכשירים), כולה חיובית, ללא כפילויות.</summary>
    public static int[] DistinctPositiveIds(int[]? ids, string fieldName)
    {
        if (ids is null)
        {
            return [];
        }

        if (ids.Any(id => id <= 0))
        {
            throw ApiException.Validation(fieldName);
        }

        return ids.Distinct().ToArray();
    }

    // ===========================================
    // ערכים בודדים
    // ===========================================

    public static void RequirePositive(int value, string fieldName)
    {
        if (value <= 0)
        {
            throw ApiException.Validation(fieldName);
        }
    }

    public static void RequirePositiveWhenPresent(int? value, string fieldName)
    {
        if (value is <= 0)
        {
            throw ApiException.Validation(fieldName);
        }
    }

    /// <summary>שני התאריכים קיימים, בפורמט yyyy-MM-dd, והסיום אינו לפני ההתחלה (יום הסיום כלול, A-8).</summary>
    public static void RequireDateRange(string? start, string? end, string startFieldName, string endFieldName)
    {
        if (!DateTimeStrings.TryParseDate(start, out DateTime startDate))
        {
            throw ApiException.Validation(startFieldName);
        }

        if (!DateTimeStrings.TryParseDate(end, out DateTime endDate))
        {
            throw ApiException.Validation(endFieldName);
        }

        if (endDate < startDate)
        {
            throw ApiException.Validation(endFieldName);
        }
    }

    /// <summary>משך שיחה ריק (מלא / כל היממה) או בטווח 1–120.</summary>
    public static void RequireDurationRange(int? minutes, string fieldName)
    {
        if (minutes is < DurationMinutesMin or > DurationMinutesMax)
        {
            throw ApiException.Validation(fieldName);
        }
    }

    /// <summary>שעות: שתיהן ריקות (כל היממה) או שתיהן קיימות בפורמט HH:mm, והסיום אחרי ההתחלה באותו יום (OQ-13).</summary>
    public static void ValidateTimeWindow(string? start, string? end, string startFieldName, string endFieldName)
    {
        bool hasStart = !string.IsNullOrWhiteSpace(start);
        bool hasEnd = !string.IsNullOrWhiteSpace(end);

        if (!hasStart && !hasEnd)
        {
            return;
        }

        // שעה אחת בלי השנייה: השדה החסר הוא השגוי
        if (!hasStart)
        {
            throw ApiException.Validation(startFieldName);
        }

        if (!hasEnd)
        {
            throw ApiException.Validation(endFieldName);
        }

        if (!DateTimeStrings.TryParseTime(start, out DateTime startTime))
        {
            throw ApiException.Validation(startFieldName);
        }

        if (!DateTimeStrings.TryParseTime(end, out DateTime endTime))
        {
            throw ApiException.Validation(endFieldName);
        }

        if (endTime <= startTime)
        {
            throw ApiException.Validation(endFieldName);
        }
    }

    /// <summary>טקסט חובה: לא ריק (רווחים בלבד נחשבים ריק, ספק 00 §4.3) ועד האורך הנתון.</summary>
    public static void RequireText(string? text, int maxLength, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length > maxLength)
        {
            throw ApiException.Validation(fieldName);
        }
    }
}
