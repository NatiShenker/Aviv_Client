using System.Data;
using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Models.TraineeRestrictions;
using Aviv_Service.Utils;
using Dapper;
using Iwaf.Data;

namespace Aviv_Service.Repository;

/// <summary>
/// הגישה לפרוצדורות של "הגבלות לחניך": שיטה אחת לכל פרוצדורה, כל הקריאות דרך QueryMultiple – גם השמירות,
/// שמחזירות את המזהים שנוצרו בסט התוצאה האחרון (A-16, CreatedIds). הפרמטרים נוספים דרך ProcedureParameters (T-12),
/// וההמרות של A-8 נעשות שם. חריגות אינן נתפסות כאן (A-6): שגיאה עסקית מהפרוצדורה מתורגמת ב-ApiActionRunner,
/// וכל שגיאה אחרת חייבת להגיע לקליינט כ-500.
/// </summary>
public class TraineeRestrictionsRepository(IDataAccess dataAccess) : ITraineeRestrictionsRepository
{
    private static readonly string DatabaseName = ConnectionStrings.ZeroThree03;

    // ===========================================
    // קריאה
    // ===========================================

    public async Task<TraineeRestrictionsRowSets> GetTraineeRestrictionsAsync(GetTraineeRestrictionsRequestDto request)
    {
        var parameters = new DynamicParameters();
        ProcedureParameters.AddIdList(parameters, "@IDNT_TRAINEE_LIST", request.IdntTraineeList);

        List<TraineeRestrictionRow> restrictions = [];
        List<DeviceRow> devices = [];

        await dataAccess.QueryMultiple(parameters, StoredProcedures.GET_TRAINEE_RESTRICTIONS, DatabaseName, reader =>
        {
            restrictions.AddRange(reader.Read<TraineeRestrictionRow>());
            devices.AddRange(reader.Read<DeviceRow>());
        });

        return new TraineeRestrictionsRowSets(restrictions, devices);
    }

    // ===========================================
    // שמירה
    // ===========================================

    public Task<List<int>> CreateTraineeRestrictionAsync(CreateTraineeRestrictionRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        ProcedureParameters.AddIdList(parameters, "@IDNT_TRAINEE_LIST", request.IdntTraineeList);
        ProcedureParameters.AddDateRange(parameters, "@DATE_RESTRICTION_START", request.DateRestrictionStart, "@DATE_RESTRICTION_END", request.DateRestrictionEnd);
        ProcedureParameters.AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ProcedureParameters.AddApproval(parameters, "@TEXT_RESTRICTION_REASON", request.TextRestrictionReason, TraineeRestrictionsLimits.DetailsMaxLength, request.IdntUserApproval, request.TextFile);
        ProcedureParameters.AddActingUser(parameters, actingUserId, requestUid);

        return CreatedIds.ReadAsync(dataAccess, DatabaseName, StoredProcedures.CREATE_TRAINEE_RESTRICTION, parameters);
    }

    public Task<List<int>> UpdateTraineeRestrictionAsync(UpdateTraineeRestrictionRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@IDNT_PREVIOUS", request.IdntPrevious, DbType.Int32);
        ProcedureParameters.AddDateRange(parameters, "@DATE_RESTRICTION_START", request.DateRestrictionStart, "@DATE_RESTRICTION_END", request.DateRestrictionEnd);
        ProcedureParameters.AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ProcedureParameters.AddApproval(parameters, "@TEXT_RESTRICTION_REASON", request.TextRestrictionReason, TraineeRestrictionsLimits.DetailsMaxLength, request.IdntUserApproval, request.TextFile);
        ProcedureParameters.AddActingUser(parameters, actingUserId, requestUid);

        return CreatedIds.ReadAsync(dataAccess, DatabaseName, StoredProcedures.UPDATE_TRAINEE_RESTRICTION, parameters);
    }
}
