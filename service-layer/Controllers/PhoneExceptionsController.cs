using Aviv_Service.Infrastructure;
using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Aviv_Service.Controllers;

/// <summary>
/// api/PhoneExceptions/&lt;Action&gt; – "הגבלות והיתרים למספר" (פיצ'ר 04). שש פעולות דקות בשמות שהקליינט קורא (A-7),
/// כולן דרך RunAsync: קריאה לאורקסטרטור ותרגום השגיאות לגוף אחיד (§5.3). הלוג נכתב כאן בלבד, ורק על חריגה לא צפויה.
/// D-17: הרשאות נאכפות בכניסה לאפליקציה, לא כאן.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PhoneExceptionsController(
    IPhoneExceptionsOrchestrator phoneExceptionsOrchestrator,
    ILogger<PhoneExceptionsController> logger) : ControllerBase
{
    [HttpPost("GetTraineePhoneRecords")]
    public Task<IActionResult> GetTraineePhoneRecords([FromBody] GetTraineePhoneRecordsRequestDto request)
    {
        return RunAsync(request, phoneExceptionsOrchestrator.GetTraineePhoneRecordsAsync, nameof(GetTraineePhoneRecords));
    }

    [HttpPost("LookupPhoneRestrictionsForPermit")]
    public Task<IActionResult> LookupPhoneRestrictionsForPermit([FromBody] LookupRestrictionsForPermitRequestDto request)
    {
        return RunAsync(request, phoneExceptionsOrchestrator.LookupPhoneRestrictionsForPermitAsync, nameof(LookupPhoneRestrictionsForPermit));
    }

    [HttpPost("CreateTraineePhoneRestriction")]
    public Task<IActionResult> CreateTraineePhoneRestriction([FromBody] CreateTraineeRestrictionNumberRequestDto request)
    {
        return RunAsync(request, phoneExceptionsOrchestrator.CreateTraineePhoneRestrictionAsync, nameof(CreateTraineePhoneRestriction));
    }

    [HttpPut("UpdateTraineePhoneRestriction")]
    public Task<IActionResult> UpdateTraineePhoneRestriction([FromBody] UpdateTraineeRestrictionNumberRequestDto request)
    {
        return RunAsync(request, phoneExceptionsOrchestrator.UpdateTraineePhoneRestrictionAsync, nameof(UpdateTraineePhoneRestriction));
    }

    [HttpPost("CreateTraineePhonePermit")]
    public Task<IActionResult> CreateTraineePhonePermit([FromBody] CreateTraineePermitRequestDto request)
    {
        return RunAsync(request, phoneExceptionsOrchestrator.CreateTraineePhonePermitAsync, nameof(CreateTraineePhonePermit));
    }

    [HttpPut("UpdateTraineePhonePermit")]
    public Task<IActionResult> UpdateTraineePhonePermit([FromBody] UpdateTraineePermitRequestDto request)
    {
        return RunAsync(request, phoneExceptionsOrchestrator.UpdateTraineePhonePermitAsync, nameof(UpdateTraineePhonePermit));
    }

    /// <summary>
    /// הזרימה המשותפת לכל פעולה. גוף חסר או לא תקין נעצר עוד קודם ב-[ApiController] (400).
    /// ApiException מהוולידטור, או THROW 50400 / 50409 מהפרוצדורה (A-2) → 400 / 409 עם שם השדה; כל חריגה אחרת → לוג ו-500 (A-6).
    /// </summary>
    private async Task<IActionResult> RunAsync<TRequest, TResponse>(
        TRequest request,
        Func<TRequest, Task<TResponse>> action,
        string actionName)
    {
        try
        {
            TResponse response = await action(request);
            return Ok(response);
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
