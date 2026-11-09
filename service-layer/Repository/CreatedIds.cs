using Aviv_Service.Models;
using Dapper;
using Iwaf.Data;

namespace Aviv_Service.Repository;

/// <summary>
/// קריאת סט התוצאה של פרוצדורת שמירה: המזהים שנוצרו (A-14), דרך QueryMultiple כמו כל קריאה אחרת (A-16).
/// משותף לכל ה-repositories (T-12); חריגות אינן נתפסות כאן (A-6).
/// </summary>
public static class CreatedIds
{
    public static async Task<List<int>> ReadAsync(IDataAccess dataAccess, string databaseName, string procedureName, DynamicParameters parameters)
    {
        List<int> createdIds = [];

        await dataAccess.QueryMultiple(parameters, procedureName, databaseName, reader =>
        {
            createdIds.AddRange(reader.Read<CreatedIdRow>().Select(row => row.CreatedId));
        });

        return createdIds;
    }
}
