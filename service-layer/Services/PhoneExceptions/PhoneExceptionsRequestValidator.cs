using Aviv_Service.Infrastructure;
using Aviv_Service.Models.PhoneExceptions;
using Aviv_Service.Utils;

namespace Aviv_Service.Services.PhoneExceptions;

/// <summary>
/// האימות המבני של כל בקשה, לפני כל פנייה ל-DB (§6, A-12), מורכב מכללי RequestRules המשותפים (T-12 של 03) עם שמות השדות
/// של PhoneExceptionsRequestFields (I-21). הכלל הראשון שנכשל בשדה הופך ל-ApiException(400, שם השדה).
/// D-18: אין אילוצי CHECK ב-DB, ולכן סדר התאריכים, טווח המשך, זוג השעות ופורמט המספר נבדקים כאן בלבד.
/// I-4: כל שיטה מחזירה עותק מנורמל של הבקשה (record עם with) – מספרים מנורמלים וללא כפילויות, מזהים ללא כפילויות –
/// והעותק הזה הוא שממשיך ל-repository.
/// </summary>
public static class PhoneExceptionsRequestValidator
{
    public static GetTraineePhoneRecordsRequestDto ValidateGetRecords(GetTraineePhoneRecordsRequestDto request)
    {
        int[] traineeIds = RequestRules.RequireIdList(request.IdntTraineeList, PhoneExceptionsRequestFields.IdntTraineeList);

        return request with { IdntTraineeList = traineeIds };
    }

    public static LookupRestrictionsForPermitRequestDto ValidateLookup(LookupRestrictionsForPermitRequestDto request)
    {
        RequestRules.RequirePositive(request.IdntTrainee, PhoneExceptionsRequestFields.IdntTrainee);
        RequestRules.RequirePositive(request.IdntInstitution, PhoneExceptionsRequestFields.IdntInstitution);
        string[] phoneNumbers = NormalizePhoneNumbers(request.PhoneNumberList, PhoneExceptionsRequestFields.PhoneNumberList);

        return request with { PhoneNumberList = phoneNumbers };
    }

    public static CreateTraineeRestrictionNumberRequestDto ValidateCreateRestriction(CreateTraineeRestrictionNumberRequestDto request)
    {
        int[] traineeIds = RequestRules.RequireIdList(request.IdntTraineeList, PhoneExceptionsRequestFields.IdntTraineeList);
        string[] phoneNumbers = NormalizePhoneNumbers(request.PhoneNumberList, PhoneExceptionsRequestFields.PhoneNumberList);
        RequestRules.RequireDateRange(request.DateRestrictionStart, request.DateRestrictionEnd, PhoneExceptionsRequestFields.DateRestrictionStart, PhoneExceptionsRequestFields.DateRestrictionEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidateRestrictionApproval(request.TextRestrictionReason, request.CodeRestrictionReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntTraineeList = traineeIds, PhoneNumberList = phoneNumbers, IdntDeviceList = deviceIds };
    }

    public static UpdateTraineeRestrictionNumberRequestDto ValidateUpdateRestriction(UpdateTraineeRestrictionNumberRequestDto request)
    {
        RequestRules.RequirePositive(request.IdntPrevious, PhoneExceptionsRequestFields.IdntPrevious);
        RequestRules.RequireDateRange(request.DateRestrictionStart, request.DateRestrictionEnd, PhoneExceptionsRequestFields.DateRestrictionStart, PhoneExceptionsRequestFields.DateRestrictionEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidateRestrictionApproval(request.TextRestrictionReason, request.CodeRestrictionReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntDeviceList = deviceIds };
    }

    public static CreateTraineePermitRequestDto ValidateCreatePermit(CreateTraineePermitRequestDto request)
    {
        int[] traineeIds = RequestRules.RequireIdList(request.IdntTraineeList, PhoneExceptionsRequestFields.IdntTraineeList);
        RequestRules.RequirePositiveWhenPresent(request.IdntInstitution, PhoneExceptionsRequestFields.IdntInstitution);
        RequestRules.RequirePositive(request.IdntAvivRestrictionNumber, PhoneExceptionsRequestFields.IdntAvivRestrictionNumber);
        RequestRules.RequireDateRange(request.DatePermitStart, request.DatePermitEnd, PhoneExceptionsRequestFields.DatePermitStart, PhoneExceptionsRequestFields.DatePermitEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidatePermitApproval(request.TextPermitReason, request.CodePermitReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntTraineeList = traineeIds, IdntDeviceList = deviceIds };
    }

    public static UpdateTraineePermitRequestDto ValidateUpdatePermit(UpdateTraineePermitRequestDto request)
    {
        RequestRules.RequirePositive(request.IdntPrevious, PhoneExceptionsRequestFields.IdntPrevious);
        RequestRules.RequireDateRange(request.DatePermitStart, request.DatePermitEnd, PhoneExceptionsRequestFields.DatePermitStart, PhoneExceptionsRequestFields.DatePermitEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidatePermitApproval(request.TextPermitReason, request.CodePermitReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntDeviceList = deviceIds };
    }

    // ===========================================
    // מספרי טלפון – הכלל היחיד שהוא של 04 בלבד
    // ===========================================

    private static string[] NormalizePhoneNumbers(string[]? phoneNumbers, string fieldName)
    {
        if (phoneNumbers is null || phoneNumbers.Length == 0)
        {
            throw ApiException.Validation(fieldName);
        }

        var normalizedNumbers = new List<string>();

        foreach (string rawNumber in phoneNumbers)
        {
            string number = PhoneNumbers.Normalize(rawNumber);

            if (!PhoneNumbers.IsValid(number))
            {
                throw ApiException.Validation(fieldName);
            }

            if (!normalizedNumbers.Contains(number))
            {
                normalizedNumbers.Add(number);
            }
        }

        // I-17: הרשימה עוברת לפרוצדורה כמחרוזת אחת VARCHAR(500) (A-9); מעבר לכך היא הייתה נקטעת בשקט
        if (PhoneNumbers.JoinForProcedure(normalizedNumbers).Length > PhoneNumbers.ListMaxLength)
        {
            throw ApiException.Validation(fieldName);
        }

        return normalizedNumbers.ToArray();
    }

    // ===========================================
    // תנאי ההיתר או ההגבלה, והאישור
    // ===========================================

    /// <summary>משך ריק או 1–120; שעות שתיהן או אף אחת; מכשירים חיוביים ללא כפילויות (ריק = כל המכשירים).</summary>
    private static int[] ValidateConditions(int? durationMinutes, string? timePermitStart, string? timePermitEnd, int[]? deviceIds)
    {
        RequestRules.RequireDurationRange(durationMinutes, PhoneExceptionsRequestFields.NumbDurationLimit);
        RequestRules.ValidateTimeWindow(timePermitStart, timePermitEnd, PhoneExceptionsRequestFields.TimePermitStart, PhoneExceptionsRequestFields.TimePermitEnd);

        return RequestRules.DistinctPositiveIds(deviceIds, PhoneExceptionsRequestFields.IdntDeviceList);
    }

    /// <summary>הגבלה: פירוט חובה עד אורך העמודה (I-14), קוד סיבה חובה (I-23), מאשר, ונתיב קובץ חובה (D-13).</summary>
    private static void ValidateRestrictionApproval(string? details, int codeReason, int approverId, string? textFile)
    {
        RequestRules.RequireText(details, PhoneExceptionsLimits.DetailsMaxLength, PhoneExceptionsRequestFields.TextRestrictionReason);
        RequestRules.RequirePositive(codeReason, PhoneExceptionsRequestFields.CodeRestrictionReason);
        ValidateApproverAndFile(approverId, textFile);
    }

    /// <summary>היתר: אותם כללים, עם שמות השדות של ההיתר.</summary>
    private static void ValidatePermitApproval(string? details, int codeReason, int approverId, string? textFile)
    {
        RequestRules.RequireText(details, PhoneExceptionsLimits.DetailsMaxLength, PhoneExceptionsRequestFields.TextPermitReason);
        RequestRules.RequirePositive(codeReason, PhoneExceptionsRequestFields.CodePermitReason);
        ValidateApproverAndFile(approverId, textFile);
    }

    private static void ValidateApproverAndFile(int approverId, string? textFile)
    {
        RequestRules.RequirePositive(approverId, PhoneExceptionsRequestFields.IdntUserApproval);
        RequestRules.RequireText(textFile, FilePaths.TextFileMaxLength, PhoneExceptionsRequestFields.TextFile);
    }
}
