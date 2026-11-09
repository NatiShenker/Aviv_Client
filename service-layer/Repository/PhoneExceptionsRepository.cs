using System.Data;
using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Models.PhoneExceptions;
using Aviv_Service.Utils;
using Dapper;
using Iwaf.Data;

namespace Aviv_Service.Repository;

/// <summary>
/// הגישה לפרוצדורות של "הגבלות והיתרים למספר": שיטה אחת לכל פרוצדורה, כל הקריאות דרך QueryMultiple – גם השמירות,
/// שמחזירות את המזהים שנוצרו בסט התוצאה האחרון (A-16, CreatedIds). הפרמטרים נוספים דרך ProcedureParameters (T-12 של 03),
/// וההמרות של A-8 נעשות שם. חריגות אינן נתפסות כאן (A-6): שגיאה עסקית מהפרוצדורה מתורגמת ב-ApiActionRunner,
/// וכל שגיאה אחרת חייבת להגיע לקליינט כ-500.
/// </summary>
public class PhoneExceptionsRepository(IDataAccess dataAccess) : IPhoneExceptionsRepository
{
    private static readonly string DatabaseName = ConnectionStrings.ZeroThree03;

    // ===========================================
    // קריאה
    // ===========================================

    public async Task<TraineePhoneRecordsRowSets> GetTraineeNumberRestrictionsAndPermitsAsync(GetTraineePhoneRecordsRequestDto request)
    {
        var parameters = new DynamicParameters();
        ProcedureParameters.AddIdList(parameters, "@IDNT_TRAINEE_LIST", request.IdntTraineeList);

        List<PhoneRecordRow> records = [];
        List<DeviceRow> devices = [];
        List<InstituteRow> institutes = [];

        await dataAccess.QueryMultiple(parameters, StoredProcedures.GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS, DatabaseName, reader =>
        {
            // תוצאות 1 ו-2 (הגבלות, היתרים) מחזירות אותם כינויים ונקראות לאותה רשימה; IsPermit מבחין ביניהן (I-19)
            records.AddRange(reader.Read<PhoneRecordRow>());
            records.AddRange(reader.Read<PhoneRecordRow>());
            devices.AddRange(reader.Read<DeviceRow>());
            institutes.AddRange(reader.Read<InstituteRow>());
        });

        return new TraineePhoneRecordsRowSets(records, devices, institutes);
    }

    public async Task<RestrictionsForPermitRowSets> GetRestrictionsForPermitAsync(LookupRestrictionsForPermitRequestDto request)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@IDNT_TRAINEE", request.IdntTrainee, DbType.Int32);
        parameters.Add("@IDNT_INSTITUTION", request.IdntInstitution, DbType.Int32);
        ProcedureParameters.AddPhoneNumberList(parameters, request.PhoneNumberList);

        List<SourceRestrictionRow> restrictions = [];
        List<InstituteRow> institutes = [];
        List<ExistingPermitRow> existingPermits = [];
        List<DeviceRow> permitDevices = [];

        await dataAccess.QueryMultiple(parameters, StoredProcedures.GET_RESTRICTIONS_FOR_PERMIT, DatabaseName, reader =>
        {
            restrictions.AddRange(reader.Read<SourceRestrictionRow>());
            institutes.AddRange(reader.Read<InstituteRow>());
            existingPermits.AddRange(reader.Read<ExistingPermitRow>());
            permitDevices.AddRange(reader.Read<DeviceRow>());
        });

        return new RestrictionsForPermitRowSets(restrictions, institutes, existingPermits, permitDevices);
    }

    // ===========================================
    // שמירה
    // ===========================================

    public Task<List<int>> CreateTraineeRestrictionNumberAsync(CreateTraineeRestrictionNumberRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        ProcedureParameters.AddIdList(parameters, "@IDNT_TRAINEE_LIST", request.IdntTraineeList);
        ProcedureParameters.AddPhoneNumberList(parameters, request.PhoneNumberList);
        ProcedureParameters.AddDateRange(parameters, "@DATE_RESTRICTION_START", request.DateRestrictionStart, "@DATE_RESTRICTION_END", request.DateRestrictionEnd);
        ProcedureParameters.AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ProcedureParameters.AddApproval(parameters, "@TEXT_RESTRICTION_REASON", request.TextRestrictionReason, PhoneExceptionsLimits.DetailsMaxLength, "@CODE_RESTRICTION_REASON", request.CodeRestrictionReason, request.IdntUserApproval, request.TextFile);
        ProcedureParameters.AddActingUser(parameters, actingUserId, requestUid);

        return CreatedIds.ReadAsync(dataAccess, DatabaseName, StoredProcedures.CREATE_TRAINEE_RESTRICTION_NUMBER, parameters);
    }

    public Task<List<int>> UpdateTraineeRestrictionNumberAsync(UpdateTraineeRestrictionNumberRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@IDNT_PREVIOUS", request.IdntPrevious, DbType.Int32);
        ProcedureParameters.AddDateRange(parameters, "@DATE_RESTRICTION_START", request.DateRestrictionStart, "@DATE_RESTRICTION_END", request.DateRestrictionEnd);
        ProcedureParameters.AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ProcedureParameters.AddApproval(parameters, "@TEXT_RESTRICTION_REASON", request.TextRestrictionReason, PhoneExceptionsLimits.DetailsMaxLength, "@CODE_RESTRICTION_REASON", request.CodeRestrictionReason, request.IdntUserApproval, request.TextFile);
        ProcedureParameters.AddActingUser(parameters, actingUserId, requestUid);

        return CreatedIds.ReadAsync(dataAccess, DatabaseName, StoredProcedures.UPDATE_TRAINEE_RESTRICTION_NUMBER, parameters);
    }

    public Task<List<int>> CreateTraineePermitForRestrictionNumberAsync(CreateTraineePermitRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        ProcedureParameters.AddIdList(parameters, "@IDNT_TRAINEE_LIST", request.IdntTraineeList);
        parameters.Add("@IDNT_INSTITUTION", request.IdntInstitution, DbType.Int32);
        parameters.Add("@IDNT_AVIV_RESTRICTION_NUMBER", request.IdntAvivRestrictionNumber, DbType.Int32);
        ProcedureParameters.AddDateRange(parameters, "@DATE_PERMIT_START", request.DatePermitStart, "@DATE_PERMIT_END", request.DatePermitEnd);
        ProcedureParameters.AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ProcedureParameters.AddApproval(parameters, "@TEXT_PERMIT_REASON", request.TextPermitReason, PhoneExceptionsLimits.DetailsMaxLength, "@CODE_PERMIT_REASON", request.CodePermitReason, request.IdntUserApproval, request.TextFile);
        ProcedureParameters.AddActingUser(parameters, actingUserId, requestUid);

        return CreatedIds.ReadAsync(dataAccess, DatabaseName, StoredProcedures.CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER, parameters);
    }

    public Task<List<int>> UpdateTraineePermitForRestrictionNumberAsync(UpdateTraineePermitRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@IDNT_PREVIOUS", request.IdntPrevious, DbType.Int32);
        ProcedureParameters.AddDateRange(parameters, "@DATE_PERMIT_START", request.DatePermitStart, "@DATE_PERMIT_END", request.DatePermitEnd);
        ProcedureParameters.AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ProcedureParameters.AddApproval(parameters, "@TEXT_PERMIT_REASON", request.TextPermitReason, PhoneExceptionsLimits.DetailsMaxLength, "@CODE_PERMIT_REASON", request.CodePermitReason, request.IdntUserApproval, request.TextFile);
        ProcedureParameters.AddActingUser(parameters, actingUserId, requestUid);

        return CreatedIds.ReadAsync(dataAccess, DatabaseName, StoredProcedures.UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER, parameters);
    }
}
