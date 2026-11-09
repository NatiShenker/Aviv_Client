using Aviv_Service.Infrastructure;
using Aviv_Service.Interfaces;
using Aviv_Service.Models.TraineeRestrictions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aviv_Service.Controllers;

/// <summary>
/// api/TraineeRestrictions/&lt;Action&gt; – "הגבלות לחניך" (פיצ'ר 03). שלוש פעולות דקות בשמות שהקליינט קורא (A-7, T-14),
/// כולן דרך ApiActionRunner: קריאה לאורקסטרטור ותרגום השגיאות לגוף אחיד (T-12). D-17: הרשאות נאכפות בכניסה לאפליקציה, לא כאן.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TraineeRestrictionsController(
    ITraineeRestrictionsOrchestrator traineeRestrictionsOrchestrator,
    ILogger<TraineeRestrictionsController> logger) : ControllerBase
{
    [HttpPost("GetTraineeRestrictions")]
    public Task<IActionResult> GetTraineeRestrictions([FromBody] GetTraineeRestrictionsRequestDto request)
    {
        return ApiActionRunner.RunAsync(request, traineeRestrictionsOrchestrator.GetTraineeRestrictionsAsync, nameof(GetTraineeRestrictions), logger);
    }

    [HttpPost("CreateTraineeRestriction")]
    public Task<IActionResult> CreateTraineeRestriction([FromBody] CreateTraineeRestrictionRequestDto request)
    {
        return ApiActionRunner.RunAsync(request, traineeRestrictionsOrchestrator.CreateTraineeRestrictionAsync, nameof(CreateTraineeRestriction), logger);
    }

    [HttpPut("UpdateTraineeRestriction")]
    public Task<IActionResult> UpdateTraineeRestriction([FromBody] UpdateTraineeRestrictionRequestDto request)
    {
        return ApiActionRunner.RunAsync(request, traineeRestrictionsOrchestrator.UpdateTraineeRestrictionAsync, nameof(UpdateTraineeRestriction), logger);
    }
}
