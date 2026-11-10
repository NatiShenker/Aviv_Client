using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aviv_Service.Controllers;

/// <summary>
/// api/Devices/&lt;Action&gt; – מכשירי הפנימיות לבורר "מכשירים מותרים" בטפסי 03 ו-04 (ספק 00 §6). פעולה אחת בשם שהקליינט קורא (A-7, E-11).
/// E-12: שליפה בדפוס של LocationsController – בדיקת קלט של שורה אחת, try/catch כאן, רשימה חשופה בתשובה; בלי אורקסטרטור,
/// כי אין כאן לוגיקה מעבר לקריאת ה-repository. D-17: הרשאות נאכפות בכניסה לאפליקציה, לא כאן.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DevicesController(
    IDevicesRepository devicesRepository,
    ILogger<DevicesController> logger) : ControllerBase
{
    [HttpPost("GetInstituteDevices")]
    public async Task<IActionResult> GetInstituteDevices([FromBody] DeviceRequestDto request)
    {
        // E-7: פנימיות או אגפים – לפחות רשימה אחת
        bool isEmpty = (request.IdntInstitutionList is null or []) && (request.IdntWingList is null or []);

        if (isEmpty)
        {
            return BadRequest("Invalid request values.");
        }

        try
        {
            List<DeviceDto> devices = await devicesRepository.GetDevicesAsync(request);
            return Ok(devices);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error at {ActionName}", nameof(GetInstituteDevices));
            return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving devices.");
        }
    }
}
