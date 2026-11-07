using Aviv_Service.Models;
using Aviv_Service.Interfaces;
using Dapper;
using Iwaf.Data;
using Aviv_Service.Utils;


namespace Aviv_Service.Repository
{
    public class LocationsRepository(IDataAccess dataAccess, ILogger<LocationsRepository> logger) : ILocationsRepository
    {
        public async Task<List<UnifiedLocationDto>> GetLocationsAndVirtualLocationsAsync(
            IEnumerable<int> institutionIds,
            IEnumerable<int> wingIds,
            bool shouldIncludeVirtualLocations,
            bool shouldFilterWithDevicesOnly)
        {

            string spName = StoredProcedures.GET_LOCATIONS;
            string dbName = ConnectionStrings.ZeroThree03;
            DynamicParameters parameters = new DynamicParameters();

            if (institutionIds == null || institutionIds.All(id => id == 0))
                institutionIds = [];
            if (wingIds == null || wingIds.All(id => id == 0))
                wingIds = [];

            parameters.Add("@IDNT_INSTITUTION_LIST", institutionIds.ToList().ToDataTable(), System.Data.DbType.Object);
            parameters.Add("@IDNT_WINGS_LIST", wingIds.ToList().ToDataTable(), System.Data.DbType.Object);
            parameters.Add("@INCLUDE_VIRTUAL_LOCATION", shouldIncludeVirtualLocations, System.Data.DbType.Boolean);
            parameters.Add("@WITH_DEVICES_ONLY", shouldFilterWithDevicesOnly, System.Data.DbType.Boolean);

            List<UnifiedLocationDto> locations = new List<UnifiedLocationDto>();

            try
            {
                var res = await dataAccess.QueryMultiple(parameters, spName, dbName, result =>
                {
                    locations = (result.Read<UnifiedLocationDto>()).ToList();
                    if (shouldIncludeVirtualLocations)
                    {
                        var virtualLocations = (result.Read<UnifiedLocationDto>()).ToList();
                        locations.AddRange(virtualLocations);
                    }
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"Error at {nameof(GetLocationsAndVirtualLocationsAsync)}");
            }

            return locations;
        }
    }

}
