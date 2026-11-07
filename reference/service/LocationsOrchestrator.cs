using Aviv_Service.Interfaces;
using Aviv_Service.Models;


namespace Aviv_Service.Services
{
    public class LocationsOrchestrator(
        ILocationsRepository locationsRepository,
        IClientConfigProvider clientConfigProvider) : ILocationsOrchestrator
    {
        public async Task<List<UnifiedLocationDto>> GetLocationsAsync(WingRequestDto request)
        {
            // 1. מיפוי לפי אסטרטגיה של הקליינטים
            bool shouldIncludeVirtualLocations = clientConfigProvider.AnyClientRequiresVirtualLocations(request.ClientObject);
            bool shouldFilterWithDevicesOnly = clientConfigProvider.AllClientsRequiresLocationsWithDevicesOnly(request.ClientObject);

            // 2. פנייה לפרוצדורה וקבלת הטבלה - מיקומים + מיקומים וירטואליים
            var unifiedLocations = await locationsRepository.GetLocationsAndVirtualLocationsAsync(
                request.IdntInstitution,
                request.IdntWing,
                shouldIncludeVirtualLocations,
                shouldFilterWithDevicesOnly);

            return unifiedLocations;
        }
    }

}
