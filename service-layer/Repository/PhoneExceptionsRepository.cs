using System.Data;
using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Utils;
using Dapper;
using Iwaf.Data;

namespace Aviv_Service.Repository;

/// <summary>
/// הגישה לפרוצדורות של "הגבלות והיתרים למספר": שיטה אחת לכל פרוצדורה, כל הקריאות דרך QueryMultiple – גם השמירות,
/// שמחזירות את המזהים שנוצרו בסט התוצאה האחרון (A-16). הבקשה המאומתת היא המקור לפרמטרים; ההמרות של A-8
/// (מחרוזות תאריך ושעה → DateTime, רשימת מספרים → מחרוזת אחת) נעשות כאן, בשורת הוספת הפרמטר.
/// חריגות אינן נתפסות כאן (A-6): שגיאה עסקית מהפרוצדורה מתורגמת בקונטרולר, וכל שגיאה אחרת חייבת להגיע לקליינט כ-500.
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
        AddIdList(parameters, "@IDNT_TRAINEE_LIST", request.IdntTraineeList);

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
        AddPhoneNumberList(parameters, request.PhoneNumberList);

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
        AddIdList(parameters, "@IDNT_TRAINEE_LIST", request.IdntTraineeList);
        AddPhoneNumberList(parameters, request.PhoneNumberList);
        AddDateRange(parameters, "@DATE_RESTRICTION_START", request.DateRestrictionStart, "@DATE_RESTRICTION_END", request.DateRestrictionEnd);
        AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        AddApproval(parameters, "@TEXT_RESTRICTION_REASON", request.TextRestrictionReason, request.IdntUserApproval, request.TextFile);
        AddActingUser(parameters, actingUserId, requestUid);

        return ReadCreatedIdsAsync(StoredProcedures.CREATE_TRAINEE_RESTRICTION_NUMBER, parameters);
    }

    public Task<List<int>> UpdateTraineeRestrictionNumberAsync(UpdateTraineeRestrictionNumberRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@IDNT_PREVIOUS", request.IdntPrevious, DbType.Int32);
        AddDateRange(parameters, "@DATE_RESTRICTION_START", request.DateRestrictionStart, "@DATE_RESTRICTION_END", request.DateRestrictionEnd);
        AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        AddApproval(parameters, "@TEXT_RESTRICTION_REASON", request.TextRestrictionReason, request.IdntUserApproval, request.TextFile);
        AddActingUser(parameters, actingUserId, requestUid);

        return ReadCreatedIdsAsync(StoredProcedures.UPDATE_TRAINEE_RESTRICTION_NUMBER, parameters);
    }

    public Task<List<int>> CreateTraineePermitForRestrictionNumberAsync(CreateTraineePermitRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        AddIdList(parameters, "@IDNT_TRAINEE_LIST", request.IdntTraineeList);
        parameters.Add("@IDNT_INSTITUTION", request.IdntInstitution, DbType.Int32);
        parameters.Add("@IDNT_AVIV_RESTRICTION_NUMBER", request.IdntAvivRestrictionNumber, DbType.Int32);
        AddDateRange(parameters, "@DATE_PERMIT_START", request.DatePermitStart, "@DATE_PERMIT_END", request.DatePermitEnd);
        AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        AddApproval(parameters, "@TEXT_PERMIT_REASON", request.TextPermitReason, request.IdntUserApproval, request.TextFile);
        AddActingUser(parameters, actingUserId, requestUid);

        return ReadCreatedIdsAsync(StoredProcedures.CREATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER, parameters);
    }

    public Task<List<int>> UpdateTraineePermitForRestrictionNumberAsync(UpdateTraineePermitRequestDto request, int actingUserId, Guid requestUid)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@IDNT_PREVIOUS", request.IdntPrevious, DbType.Int32);
        AddDateRange(parameters, "@DATE_PERMIT_START", request.DatePermitStart, "@DATE_PERMIT_END", request.DatePermitEnd);
        AddConditions(parameters, request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        AddApproval(parameters, "@TEXT_PERMIT_REASON", request.TextPermitReason, request.IdntUserApproval, request.TextFile);
        AddActingUser(parameters, actingUserId, requestUid);

        return ReadCreatedIdsAsync(StoredProcedures.UPDATE_TRAINEE_PERMIT_FOR_RESTRICTION_NUMBER, parameters);
    }

    private async Task<List<int>> ReadCreatedIdsAsync(string procedureName, DynamicParameters parameters)
    {
        List<int> createdIds = [];

        await dataAccess.QueryMultiple(parameters, procedureName, DatabaseName, reader =>
        {
            createdIds.AddRange(reader.Read<CreatedIdRow>().Select(row => row.CreatedId));
        });

        return createdIds;
    }

    // ===========================================
    // פרמטרים משותפים (אותם שמות וסוגים בכל הפרוצדורות, §3)
    // ===========================================

    /// <summary>TVP dbo.INT_TABLE דרך ההרחבה הקיימת ToDataTable, כמו ב-LocationsRepository.</summary>
    private static void AddIdList(DynamicParameters parameters, string parameterName, int[] ids)
    {
        parameters.Add(parameterName, ids.ToList().ToDataTable(), DbType.Object);
    }

    /// <summary>A-9: המספרים המנורמלים עוברים כמחרוזת אחת מופרדת בפסיקים, ונפרקים בפרוצדורה ב-STRING_SPLIT.</summary>
    private static void AddPhoneNumberList(DynamicParameters parameters, string[] normalizedNumbers)
    {
        parameters.Add("@PHONE_NUMBER_LIST", PhoneNumbers.JoinForProcedure(normalizedNumbers), DbType.AnsiString, size: PhoneExceptionsLimits.PhoneNumberListMaxLength);
    }

    /// <summary>A-8: מחרוזות "yyyy-MM-dd" שכבר עברו את הוולידטור הופכות כאן ל-DATETIME של הפרוצדורה.</summary>
    private static void AddDateRange(DynamicParameters parameters, string startParameterName, string startDate, string endParameterName, string endDate)
    {
        parameters.Add(startParameterName, DateTimeStrings.ParseDate(startDate), DbType.DateTime);
        parameters.Add(endParameterName, DateTimeStrings.ParseDate(endDate), DbType.DateTime);
    }

    /// <summary>תנאי ההיתר או ההגבלה: משך, שעות ("HH:mm" על תאריך הבסיס, A-8; ריק = כל היממה) ומכשירים (D-2).</summary>
    private static void AddConditions(DynamicParameters parameters, int? durationMinutes, string? timePermitStart, string? timePermitEnd, int[] deviceIds)
    {
        parameters.Add("@NUMB_DURATION_LIMIT", durationMinutes, DbType.Int32);
        parameters.Add("@TIME_PERMIT_START", DateTimeStrings.ParseTimeOrNull(timePermitStart), DbType.DateTime);
        parameters.Add("@TIME_PERMIT_END", DateTimeStrings.ParseTimeOrNull(timePermitEnd), DbType.DateTime);
        AddIdList(parameters, "@IDNT_DEVICE_LIST", deviceIds);
    }

    /// <summary>הפירוט (varchar, P-9, אורך לפי I-14), המאשר וקובץ האישור (D-13).</summary>
    private static void AddApproval(DynamicParameters parameters, string detailsParameterName, string details, int approverId, string textFile)
    {
        parameters.Add(detailsParameterName, details, DbType.AnsiString, size: PhoneExceptionsLimits.DetailsMaxLength);
        parameters.Add("@IDNT_USER_APPROVAL", approverId, DbType.Int32);
        parameters.Add("@TEXT_FILE", textFile, DbType.String, size: PhoneExceptionsLimits.TextFileMaxLength);
    }

    /// <summary>D-14, D-19: המשתמש הפועל ומזהה הבקשה, נחתמים על כל שורה שנכתבת.</summary>
    private static void AddActingUser(DynamicParameters parameters, int actingUserId, Guid requestUid)
    {
        parameters.Add("@IDNT_USER", actingUserId, DbType.Int32);
        parameters.Add("@REQUEST_UID", requestUid, DbType.Guid);
    }
}
