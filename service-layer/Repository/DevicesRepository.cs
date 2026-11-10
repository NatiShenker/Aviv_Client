using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Utils;
using Dapper;
using Iwaf.Data;

namespace Aviv_Service.Repository;

/// <summary>
/// הגישה לפרוצדורה של רשימת המכשירים: שתי רשימות מזהים כ-TVP דרך ProcedureParameters (T-12), קריאה אחת דרך QueryMultiple (A-16),
/// תוצאה אחת שנקראת ישירות ל-DeviceDto (E-6), כמו UnifiedLocationDto ב-LocationsRepository. חריגות אינן נתפסות כאן (A-6) – הקונטרולר רושם לוג ומחזיר 500.
/// </summary>
public class DevicesRepository(IDataAccess dataAccess) : IDevicesRepository
{
    private static readonly string DatabaseName = ConnectionStrings.ZeroThree03;

    public async Task<List<DeviceDto>> GetDevicesAsync(DeviceRequestDto request)
    {
        var parameters = new DynamicParameters();
        ProcedureParameters.AddIdList(parameters, "@IDNT_INSTITUTION_LIST", request.IdntInstitutionList);
        ProcedureParameters.AddIdList(parameters, "@IDNT_WINGS_LIST", request.IdntWingList);

        List<DeviceDto> devices = [];

        await dataAccess.QueryMultiple(parameters, StoredProcedures.GET_DEVICES, DatabaseName, reader =>
        {
            devices.AddRange(reader.Read<DeviceDto>());
        });

        return devices;
    }
}
