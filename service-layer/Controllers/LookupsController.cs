using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aviv_Service.Controllers;

/// <summary>
/// api/Lookups/&lt;Action&gt; – טבלאות הקוד של AVIV_DECODE (K-3): פעולה גנרית אחת שמקבלת מזהי טבלאות ומחזירה לכל טבלה את מספרה,
/// את שמה (לדיבוג) ואת שורותיה. הקליינט בוחר לפי נתון (מזהה טבלה), ולכן הפעולה גנרית ולא בשם הסט (K-8).
/// K-10: שליפה בדפוס של LocationsController – בדיקת קלט כאן (הרישום DecodeTables הוא רשימת המותרים), try/catch כאן, רשימה חשופה בתשובה.
/// D-17: הרשאות נאכפות בכניסה לאפליקציה, לא כאן.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LookupsController(
    ILookupsOrchestrator lookupsOrchestrator,
    ILogger<LookupsController> logger) : ControllerBase
{
    [HttpPost("GetDecode")]
    public async Task<IActionResult> GetDecode([FromBody] DecodeRequestDto request)
    {
        // K-3: רשימה לא ריקה, וכל מזהה מוכר לרישום
        bool isInvalid = request.CodeTableList is null or [] || request.CodeTableList.Any(codeTable => !DecodeTables.IsKnown(codeTable));

        if (isInvalid)
        {
            return BadRequest("Invalid request values.");
        }

        try
        {
            List<DecodeTableDto> tables = await lookupsOrchestrator.GetDecodeAsync(request);
            return Ok(tables);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error at {ActionName}", nameof(GetDecode));
            return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving code tables.");
        }
    }
}
