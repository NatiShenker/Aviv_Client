using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Aviv_Service.Infrastructure;

/// <summary>
/// גוף השגיאה ב-400 / 409 / 500 (A-13, ספק 00 §7). Code: VALIDATION_ERROR / CONFLICT / SERVER_ERROR.
/// ב-400 וב-409 Message הוא שם השדה, ו-FieldErrors מכיל אותו עם טקסט ריק – ההודעות בעברית נשארות בקליינט (C-4).
/// </summary>
public class ApiErrorDto
{
    public string Code { get; set; } = "";
    public string Message { get; set; } = "";
    public Dictionary<string, string>? FieldErrors { get; set; }
}

/// <summary>ערכי Code בגוף השגיאה (A-13, ספק 00 §7).</summary>
public static class ApiErrorCodes
{
    public const string ValidationError = "VALIDATION_ERROR";
    public const string Conflict = "CONFLICT";
    public const string ServerError = "SERVER_ERROR";
}

/// <summary>בניית תשובות השגיאה של הקונטרולר (§5.3): גוף ApiErrorDto אחיד ל-400, 409 ו-500.</summary>
public static class ErrorResponses
{
    private const string ServerErrorMessage = "An unexpected error occurred.";

    /// <summary>400 או 409 עם שם השדה; הטקסט ריק כי ההודעות בעברית נשארות בקליינט (C-4).</summary>
    public static IActionResult FromApiException(ApiException exception)
    {
        var body = new ApiErrorDto
        {
            Code = CodeFor(exception.StatusCode),
            Message = exception.FieldName,
            FieldErrors = new Dictionary<string, string> { [exception.FieldName] = "" },
        };

        return new ObjectResult(body) { StatusCode = exception.StatusCode };
    }

    public static IActionResult ServerError()
    {
        var body = new ApiErrorDto { Code = ApiErrorCodes.ServerError, Message = ServerErrorMessage };
        return new ObjectResult(body) { StatusCode = StatusCodes.Status500InternalServerError };
    }

    private static string CodeFor(int statusCode)
    {
        return statusCode switch
        {
            StatusCodes.Status400BadRequest => ApiErrorCodes.ValidationError,
            StatusCodes.Status409Conflict => ApiErrorCodes.Conflict,
            _ => ApiErrorCodes.ServerError,
        };
    }
}

/// <summary>
/// תרגום שגיאה עסקית מפרוצדורה (§5.2): הפרוצדורות זורקות THROW 50400 / 50409 עם שם השדה כהודעה, והמספר פחות 50000 הוא קוד ה-HTTP.
/// כל שגיאת DB אחרת – כולל 50500 של נעילת ה-applock (I-13) – אינה עסקית, ממשיכה הלאה והופכת ל-500 (A-6).
/// I-6: SqlException של Microsoft.Data.SqlClient; אם הסרביס עובד עם System.Data.SqlClient, משנים את ה-using בלבד.
/// </summary>
public static class SqlErrorMapper
{
    private const int BusinessErrorBase = 50000;
    private const int FirstBusinessErrorNumber = 50400;
    private const int LastBusinessErrorNumber = 50499;

    public static bool IsBusinessError(SqlException exception)
    {
        return exception.Number is >= FirstBusinessErrorNumber and <= LastBusinessErrorNumber;
    }

    /// <summary>לקריאה אחרי IsBusinessError בלבד.</summary>
    public static ApiException ToApiException(SqlException exception)
    {
        return new ApiException(exception.Number - BusinessErrorBase, exception.Message);
    }
}
