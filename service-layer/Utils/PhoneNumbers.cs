using System.Text.RegularExpressions;

namespace Aviv_Service.Utils;

/// <summary>נרמול ואימות של מספרי טלפון בפורמט המקומי (§6), וחיבורם למחרוזת אחת לפרוצדורות (A-9).</summary>
public static class PhoneNumbers
{
    private static readonly Regex LocalNumberPattern = new(@"^0\d{8,9}$", RegexOptions.Compiled);

    // תווי עיצוב שמשתמשים מקלידים ואינם חלק מהמספר
    private static readonly char[] IgnoredCharacters = [' ', '-', '(', ')'];

    private const string ProcedureListSeparator = ",";

    /// <summary>מסיר רווחים, מקפים וסוגריים. הפורמט נבדק אחר כך ב-IsValid.</summary>
    public static string Normalize(string? raw)
    {
        if (string.IsNullOrEmpty(raw))
        {
            return string.Empty;
        }

        return string.Concat(raw.Where(character => !IgnoredCharacters.Contains(character)));
    }

    /// <summary>מספר מקומי: אפס ואחריו 8 או 9 ספרות.</summary>
    public static bool IsValid(string normalizedNumber)
    {
        return LocalNumberPattern.IsMatch(normalizedNumber);
    }

    /// <summary>A-9: הרשימה עוברת לפרוצדורה כמחרוזת אחת מופרדת בפסיקים (@PHONE_NUMBER_LIST), ונפרקת שם ב-STRING_SPLIT.</summary>
    public static string JoinForProcedure(IEnumerable<string> normalizedNumbers)
    {
        return string.Join(ProcedureListSeparator, normalizedNumbers);
    }
}
