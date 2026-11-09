using Aviv_Service.Infrastructure;
using Aviv_Service.Interfaces;
using Aviv_Service.Models.PhoneExceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aviv_Service.Controllers;

/// <summary>
/// api/PhoneExceptions/&lt;Action&gt; – "הגבלות והיתרים למספר" (פיצ'ר 04). שש פעולות דקות בשמות שהקליינט קורא (A-7),
/// כולן דרך ApiActionRunner: קריאה לאורקסטרטור ותרגום השגיאות לגוף אחיד (§5.3; משותף – T-12 של 03).
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
        return ApiActionRunner.RunAsync(request, phoneExceptionsOrchestrator.GetTraineePhoneRecordsAsync, nameof(GetTraineePhoneRecords), logger);
    }

    [HttpPost("LookupPhoneRestrictionsForPermit")]
    public Task<IActionResult> LookupPhoneRestrictionsForPermit([FromBody] LookupRestrictionsForPermitRequestDto request)
    {
        return ApiActionRunner.RunAsync(request, phoneExceptionsOrchestrator.LookupPhoneRestrictionsForPermitAsync, nameof(LookupPhoneRestrictionsForPermit), logger);
    }

    [HttpPost("CreateTraineePhoneRestriction")]
    public Task<IActionResult> CreateTraineePhoneRestriction([FromBody] CreateTraineeRestrictionNumberRequestDto request)
    {
        return ApiActionRunner.RunAsync(request, phoneExceptionsOrchestrator.CreateTraineePhoneRestrictionAsync, nameof(CreateTraineePhoneRestriction), logger);
    }

    [HttpPut("UpdateTraineePhoneRestriction")]
    public Task<IActionResult> UpdateTraineePhoneRestriction([FromBody] UpdateTraineeRestrictionNumberRequestDto request)
    {
        return ApiActionRunner.RunAsync(request, phoneExceptionsOrchestrator.UpdateTraineePhoneRestrictionAsync, nameof(UpdateTraineePhoneRestriction), logger);
    }

    [HttpPost("CreateTraineePhonePermit")]
    public Task<IActionResult> CreateTraineePhonePermit([FromBody] CreateTraineePermitRequestDto request)
    {
        return ApiActionRunner.RunAsync(request, phoneExceptionsOrchestrator.CreateTraineePhonePermitAsync, nameof(CreateTraineePhonePermit), logger);
    }

    [HttpPut("UpdateTraineePhonePermit")]
    public Task<IActionResult> UpdateTraineePhonePermit([FromBody] UpdateTraineePermitRequestDto request)
    {
        return ApiActionRunner.RunAsync(request, phoneExceptionsOrchestrator.UpdateTraineePhonePermitAsync, nameof(UpdateTraineePhonePermit), logger);
    }
}
