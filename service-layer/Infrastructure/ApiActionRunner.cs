using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Aviv_Service.Infrastructure;

/// <summary>
/// הזרימה המשותפת לכל פעולת API של ההגבלות וההיתרים (A-11, T-12): קריאה לאורקסטרטור ותרגום השגיאות לגוף אחיד (§5.3).
/// ApiException מהוולידטור, או THROW 50400 / 50409 מהפרוצדורה (A-2) → 400 / 409 עם שם השדה; כל חריגה אחרת → לוג ו-500 (A-6).
/// גוף חסר או לא תקין נעצר עוד קודם ב-[ApiController] (400). הלוג נכתב כאן בלבד, ורק על חריגה לא צפויה.
/// I-6: SqlException של Microsoft.Data.SqlClient; אם הסרביס עובד עם System.Data.SqlClient, משנים את ה-using בלבד.
/// </summary>
public static class ApiActionRunner
{
    public static async Task<IActionResult> RunAsync<TRequest, TResponse>(
        TRequest request,
        Func<TRequest, Task<TResponse>> action,
        string actionName,
        ILogger logger)
    {
        try
        {
            TResponse response = await action(request);
            return new OkObjectResult(response);
        }
        catch (ApiException exception)
        {
            return ErrorResponses.FromApiException(exception);
        }
        catch (SqlException exception) when (SqlErrorMapper.IsBusinessError(exception))
        {
            return ErrorResponses.FromApiException(SqlErrorMapper.ToApiException(exception));
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error at {ActionName}", actionName);
            return ErrorResponses.ServerError();
        }
    }
}
