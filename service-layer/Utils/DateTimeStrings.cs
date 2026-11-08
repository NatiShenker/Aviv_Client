using System.Globalization;

namespace Aviv_Service.Utils;

/// <summary>
/// ההמרה הלוך ושוב בין המחרוזות של ה-JSON ל-DateTime של הפרוצדורות (A-8, I-5):
/// תאריכים "yyyy-MM-dd", שעות "HH:mm" על תאריך הבסיס 1900-01-01 (מה ש-SQL נותן ל-CAST של שעה ל-DATETIME),
/// וחותמות ביקורת "yyyy-MM-ddTHH:mm:ss" בזמן השרת, בלי אזור זמן (I-18).
/// </summary>
public static class DateTimeStrings
{
    public const string DateFormat = "yyyy-MM-dd";
    public const string TimeFormat = "HH:mm";
    public const string TimestampFormat = "yyyy-MM-dd'T'HH:mm:ss";

    public static readonly DateTime TimeBaseDate = new(1900, 1, 1);

    private static readonly CultureInfo Culture = CultureInfo.InvariantCulture;

    public static bool TryParseDate(string? text, out DateTime date)
    {
        return DateTime.TryParseExact(text, DateFormat, Culture, DateTimeStyles.None, out date);
    }

    public static bool TryParseTime(string? text, out DateTime time)
    {
        if (TimeOnly.TryParseExact(text, TimeFormat, Culture, DateTimeStyles.None, out TimeOnly timeOfDay))
        {
            time = TimeBaseDate.Add(timeOfDay.ToTimeSpan());
            return true;
        }

        time = default;
        return false;
    }

    /// <summary>לשימוש אחרי האימות בלבד: מחרוזת שכבר עברה TryParseDate.</summary>
    public static DateTime ParseDate(string text)
    {
        if (!TryParseDate(text, out DateTime date))
        {
            throw new FormatException($"'{text}' is not a date in the format {DateFormat}.");
        }

        return date;
    }

    /// <summary>לשימוש אחרי האימות בלבד. null או ריק נשארים null (כל היממה).</summary>
    public static DateTime? ParseTimeOrNull(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        if (!TryParseTime(text, out DateTime time))
        {
            throw new FormatException($"'{text}' is not a time in the format {TimeFormat}.");
        }

        return time;
    }

    /// <summary>null (עמודה של היתר בלבד בשורת הגבלה) → מחרוזת ריקה.</summary>
    public static string FormatDate(DateTime? value)
    {
        return value?.ToString(DateFormat, Culture) ?? "";
    }

    public static string? FormatTime(DateTime? value)
    {
        return value?.ToString(TimeFormat, Culture);
    }

    public static string? FormatTimestamp(DateTime? value)
    {
        return value?.ToString(TimestampFormat, Culture);
    }
}
