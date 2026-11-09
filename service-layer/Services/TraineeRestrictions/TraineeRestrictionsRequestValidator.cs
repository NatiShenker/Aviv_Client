using Aviv_Service.Models.TraineeRestrictions;
using Aviv_Service.Utils;

namespace Aviv_Service.Services.TraineeRestrictions;

/// <summary>
/// האימות המבני של כל בקשה של "הגבלות לחניך", לפני כל פנייה ל-DB (02-architecture.md §6, A-12), מורכב מכללי RequestRules
/// עם שמות השדות של TraineeRestrictionsRequestFields (T-12, I-21). הכלל הראשון שנכשל בשדה הופך ל-ApiException(400, שם השדה).
/// I-4: כל שיטה מחזירה עותק מנורמל של הבקשה (record עם with) – מזהים ללא כפילויות – והעותק הזה הוא שממשיך ל-repository.
/// </summary>
public static class TraineeRestrictionsRequestValidator
{
    public static GetTraineeRestrictionsRequestDto ValidateGetRestrictions(GetTraineeRestrictionsRequestDto request)
    {
        int[] traineeIds = RequestRules.RequireIdList(request.IdntTraineeList, TraineeRestrictionsRequestFields.IdntTraineeList);

        return request with { IdntTraineeList = traineeIds };
    }

    public static CreateTraineeRestrictionRequestDto ValidateCreate(CreateTraineeRestrictionRequestDto request)
    {
        int[] traineeIds = RequestRules.RequireIdList(request.IdntTraineeList, TraineeRestrictionsRequestFields.IdntTraineeList);
        RequestRules.RequireDateRange(request.DateRestrictionStart, request.DateRestrictionEnd, TraineeRestrictionsRequestFields.DateRestrictionStart, TraineeRestrictionsRequestFields.DateRestrictionEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidateApproval(request.TextRestrictionReason, request.CodeRestrictionReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntTraineeList = traineeIds, IdntDeviceList = deviceIds };
    }

    public static UpdateTraineeRestrictionRequestDto ValidateUpdate(UpdateTraineeRestrictionRequestDto request)
    {
        RequestRules.RequirePositive(request.IdntPrevious, TraineeRestrictionsRequestFields.IdntPrevious);
        RequestRules.RequireDateRange(request.DateRestrictionStart, request.DateRestrictionEnd, TraineeRestrictionsRequestFields.DateRestrictionStart, TraineeRestrictionsRequestFields.DateRestrictionEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidateApproval(request.TextRestrictionReason, request.CodeRestrictionReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntDeviceList = deviceIds };
    }

    // ===========================================
    // תנאי ההגבלה, והאישור
    // ===========================================

    /// <summary>משך ריק או 1–120; שעות שתיהן או אף אחת; מכשירים חיוביים ללא כפילויות (ריק = כל המכשירים).</summary>
    private static int[] ValidateConditions(int? durationMinutes, string? timePermitStart, string? timePermitEnd, int[]? deviceIds)
    {
        RequestRules.RequireDurationRange(durationMinutes, TraineeRestrictionsRequestFields.NumbDurationLimit);
        RequestRules.ValidateTimeWindow(timePermitStart, timePermitEnd, TraineeRestrictionsRequestFields.TimePermitStart, TraineeRestrictionsRequestFields.TimePermitEnd);

        return RequestRules.DistinctPositiveIds(deviceIds, TraineeRestrictionsRequestFields.IdntDeviceList);
    }

    /// <summary>פירוט חובה עד אורך העמודה (T-3, I-14), קוד סיבה חובה (I-23), מאשר, ונתיב קובץ חובה (D-13).</summary>
    private static void ValidateApproval(string? details, int codeReason, int approverId, string? textFile)
    {
        RequestRules.RequireText(details, TraineeRestrictionsLimits.DetailsMaxLength, TraineeRestrictionsRequestFields.TextRestrictionReason);
        RequestRules.RequirePositive(codeReason, TraineeRestrictionsRequestFields.CodeRestrictionReason);
        RequestRules.RequirePositive(approverId, TraineeRestrictionsRequestFields.IdntUserApproval);
        RequestRules.RequireText(textFile, FilePaths.TextFileMaxLength, TraineeRestrictionsRequestFields.TextFile);
    }
}
