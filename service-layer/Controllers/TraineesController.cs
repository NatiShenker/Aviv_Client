using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aviv_Service.Controllers;

/// <summary>
/// api/Trainees/&lt;Action&gt; – רשימת החניכים של מסך הבית (ספק 01). פעולה אחת בשם שהקליינט קורא (A-7, L-11).
/// L-15: שליפה בדפוס של LocationsController – בדיקת קלט של שורה אחת, try/catch כאן, ורשימה חשופה בתשובה; בלי ApiActionRunner,
/// כי הפרוצדורה אינה זורקת שגיאות עסקיות ואין שדות ל-400 שהקליינט ממפה (אלה שייכים לשמירות של 03/04).
/// D-17: הרשאות נאכפות בכניסה לאפליקציה, לא כאן. תמונת החניך אינה כאן – הדפדפן פונה ל-API החיצוני ישירות (L-8).
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TraineesController(
    ITraineesOrchestrator traineesOrchestrator,
    ILogger<TraineesController> logger) : ControllerBase
{
    [HttpPost("GetTrainees")]
    public async Task<IActionResult> GetTrainees([FromBody] TraineeRequestDto request)
    {
        // L-9: פנימיות או אגפים – לפחות רשימה אחת
        bool isEmpty = (request.IdntInstitutionList is null or []) && (request.IdntWingList is null or []);

        if (isEmpty)
        {
            return BadRequest("Invalid request values.");
        }

        try
        {
            List<TraineeDto> trainees = await traineesOrchestrator.GetTraineesAsync(request);
            return Ok(trainees);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error at {ActionName}", nameof(GetTrainees));
            return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving trainees.");
        }
    }
}
