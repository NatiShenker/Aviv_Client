namespace Aviv_Service.Utils;

/// <summary>
/// נתיב קובץ האישור ב-SharePoint (AVIV_FILE.TEXT_FILE, D-13), משותף לכל הפיצ'רים (T-12):
/// גודל הפרמטר @TEXT_FILE NVARCHAR(500) (A-10), ושם הקובץ לתצוגה שנגזר מהקטע האחרון של הנתיב.
/// </summary>
public static class FilePaths
{
    public const int TextFileMaxLength = 500;

    private static readonly char[] PathSeparators = ['/', '\\'];

    /// <summary>D-13: שם הקובץ הוא הקטע האחרון של הנתיב; נתיב בלי מפריד הוא שם הקובץ עצמו.</summary>
    public static string FileNameFromPath(string path)
    {
        int lastSeparator = path.LastIndexOfAny(PathSeparators);

        return lastSeparator < 0 ? path : path[(lastSeparator + 1)..];
    }
}
