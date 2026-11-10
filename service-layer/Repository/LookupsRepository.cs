using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Utils;
using Dapper;
using Iwaf.Data;

namespace Aviv_Service.Repository;

/// <summary>
/// הגישה לפרוצדורה של טבלאות הקוד: רשימת מזהי טבלאות כ-TVP דרך ProcedureParameters (T-12), קריאה אחת דרך QueryMultiple (A-16),
/// תוצאה אחת. חריגות אינן נתפסות כאן (A-6) – הקונטרולר רושם לוג ומחזיר 500.
/// </summary>
public class LookupsRepository(IDataAccess dataAccess) : ILookupsRepository
{
    private static readonly string DatabaseName = ConnectionStrings.ZeroThree03;

    public async Task<List<DecodeRow>> GetDecodeAsync(DecodeRequestDto request)
    {
        var parameters = new DynamicParameters();
        ProcedureParameters.AddIdList(parameters, "@CODE_TABLE_LIST", request.CodeTableList);

        List<DecodeRow> rows = [];

        await dataAccess.QueryMultiple(parameters, StoredProcedures.GET_DECODE, DatabaseName, reader =>
        {
            rows.AddRange(reader.Read<DecodeRow>());
        });

        return rows;
    }
}
