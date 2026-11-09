using Aviv_Service.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Aviv_Service.Interfaces;


[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LocationsController(
    ILocationsOrchestrator locationsOrchestrator,
    ILogger<LocationsController> logger) : ControllerBase
{
    [HttpPost("GetLocationsAndVirtualLocations")]
    public async Task<IActionResult> GetLocationsAndVirtualLocations([FromBody] WingRequestDto request)
    {
        bool isEmpty = (request.ClientObject is null or []) || (request.IdntInstitution is null or []);

        if (isEmpty)
        {
            return BadRequest("Invalid request values.");
        }

        try
        {
            var result = await locationsOrchestrator.GetLocationsAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error at {nameof(GetLocationsAndVirtualLocations)}");
            return StatusCode(500, "An error occurred while retrieving locations.");
        }
    }

}
