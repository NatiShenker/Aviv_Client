using Aviv_Service.Infrastructure;
using Aviv_Service.Models;
using Aviv_Service.Utils;

namespace Aviv_Service.Services;

/// <summary>
/// האימות המבני של כל בקשה, לפני כל פנייה ל-DB (§6, A-12). הכלל הראשון שנכשל בשדה הופך ל-ApiException(400, שם השדה).
/// D-18: אין אילוצי CHECK ב-DB, ולכן סדר התאריכים, טווח המשך, זוג השעות ופורמט המספר נבדקים כאן בלבד.
/// I-4: כל שיטה מחזירה עותק מנורמל של הבקשה (record עם with) – מספרים מנורמלים וללא כפילויות, מזהים ללא כפילויות –
/// והעותק הזה הוא שממשיך ל-repository.
/// </summary>
public static class PhoneExceptionsRequestValidator
{
    public static GetTraineePhoneRecordsRequestDto ValidateGetRecords(GetTraineePhoneRecordsRequestDto request)
    {
        int[] traineeIds = RequireIdList(request.IdntTraineeList, PhoneExceptionsRequestFields.IdntTraineeList);

        return request with { IdntTraineeList = traineeIds };
    }

    public static LookupRestrictionsForPermitRequestDto ValidateLookup(LookupRestrictionsForPermitRequestDto request)
    {
        RequirePositive(request.IdntTrainee, PhoneExceptionsRequestFields.IdntTrainee);
        RequirePositive(request.IdntInstitution, PhoneExceptionsRequestFields.IdntInstitution);
        string[] phoneNumbers = NormalizePhoneNumbers(request.PhoneNumberList, PhoneExceptionsRequestFields.PhoneNumberList);

        return request with { PhoneNumberList = phoneNumbers };
    }

    public static CreateTraineeRestrictionNumberRequestDto ValidateCreateRestriction(CreateTraineeRestrictionNumberRequestDto request)
    {
        int[] traineeIds = RequireIdList(request.IdntTraineeList, PhoneExceptionsRequestFields.IdntTraineeList);
        string[] phoneNumbers = NormalizePhoneNumbers(request.PhoneNumberList, PhoneExceptionsRequestFields.PhoneNumberList);
        RequireDateRange(request.DateRestrictionStart, request.DateRestrictionEnd, PhoneExceptionsRequestFields.DateRestrictionStart, PhoneExceptionsRequestFields.DateRestrictionEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidateApproval(request.TextRestrictionReason, PhoneExceptionsRequestFields.TextRestrictionReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntTraineeList = traineeIds, PhoneNumberList = phoneNumbers, IdntDeviceList = deviceIds };
    }

    public static UpdateTraineeRestrictionNumberRequestDto ValidateUpdateRestriction(UpdateTraineeRestrictionNumberRequestDto request)
    {
        RequirePositive(request.IdntPrevious, PhoneExceptionsRequestFields.IdntPrevious);
        RequireDateRange(request.DateRestrictionStart, request.DateRestrictionEnd, PhoneExceptionsRequestFields.DateRestrictionStart, PhoneExceptionsRequestFields.DateRestrictionEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidateApproval(request.TextRestrictionReason, PhoneExceptionsRequestFields.TextRestrictionReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntDeviceList = deviceIds };
    }

    public static CreateTraineePermitRequestDto ValidateCreatePermit(CreateTraineePermitRequestDto request)
    {
        int[] traineeIds = RequireIdList(request.IdntTraineeList, PhoneExceptionsRequestFields.IdntTraineeList);
        RequirePositiveWhenPresent(request.IdntInstitution, PhoneExceptionsRequestFields.IdntInstitution);
        RequirePositive(request.IdntAvivRestrictionNumber, PhoneExceptionsRequestFields.IdntAvivRestrictionNumber);
        RequireDateRange(request.DatePermitStart, request.DatePermitEnd, PhoneExceptionsRequestFields.DatePermitStart, PhoneExceptionsRequestFields.DatePermitEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidateApproval(request.TextPermitReason, PhoneExceptionsRequestFields.TextPermitReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntTraineeList = traineeIds, IdntDeviceList = deviceIds };
    }

    public static UpdateTraineePermitRequestDto ValidateUpdatePermit(UpdateTraineePermitRequestDto request)
    {
        RequirePositive(request.IdntPrevious, PhoneExceptionsRequestFields.IdntPrevious);
        RequireDateRange(request.DatePermitStart, request.DatePermitEnd, PhoneExceptionsRequestFields.DatePermitStart, PhoneExceptionsRequestFields.DatePermitEnd);
        int[] deviceIds = ValidateConditions(request.NumbDurationLimit, request.TimePermitStart, request.TimePermitEnd, request.IdntDeviceList);
        ValidateApproval(request.TextPermitReason, PhoneExceptionsRequestFields.TextPermitReason, request.IdntUserApproval, request.TextFile);

        return request with { IdntDeviceList = deviceIds };
    }

    // ===========================================
    // רשימות מזהים ומספרים
    // ===========================================

    /// <summary>רשימה שאינה ריקה, כולה חיובית, ללא כפילויות.</summary>
    private static int[] RequireIdList(int[]? ids, string fieldName)
    {
        int[] distinctIds = DistinctPositiveIds(ids, fieldName);

        if (distinctIds.Length == 0)
        {
            throw ApiException.Validation(fieldName);
        }

        return distinctIds;
    }

    /// <summary>רשימה שיכולה להיות ריקה (מכשירים: ריק = כל המכשירים), כולה חיובית, ללא כפילויות.</summary>
    private static int[] DistinctPositiveIds(int[]? ids, string fieldName)
    {
        if (ids is null)
        {
            return [];
        }

        if (ids.Any(id => id <= 0))
        {
            throw ApiException.Validation(fieldName);
        }

        return ids.Distinct().ToArray();
    }

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
        if (PhoneNumbers.JoinForProcedure(normalizedNumbers).Length > PhoneExceptionsLimits.PhoneNumberListMaxLength)
        {
            throw ApiException.Validation(fieldName);
        }

        return normalizedNumbers.ToArray();
    }

    // ===========================================
    // ערכים בודדים
    // ===========================================

    private static void RequirePositive(int value, string fieldName)
    {
        if (value <= 0)
        {
            throw ApiException.Validation(fieldName);
        }
    }

    private static void RequirePositiveWhenPresent(int? value, string fieldName)
    {
        if (value is <= 0)
        {
            throw ApiException.Validation(fieldName);
        }
    }

    /// <summary>שני התאריכים קיימים, בפורמט yyyy-MM-dd, והסיום אינו לפני ההתחלה (יום הסיום כלול, A-8).</summary>
    private static void RequireDateRange(string? start, string? end, string startFieldName, string endFieldName)
    {
        if (!DateTimeStrings.TryParseDate(start, out DateTime startDate))
        {
            throw ApiException.Validation(startFieldName);
        }

        if (!DateTimeStrings.TryParseDate(end, out DateTime endDate))
        {
            throw ApiException.Validation(endFieldName);
        }

        if (endDate < startDate)
        {
            throw ApiException.Validation(endFieldName);
        }
    }

    // ===========================================
    // תנאי ההיתר או ההגבלה, והאישור
    // ===========================================

    /// <summary>משך ריק או 1–120; שעות שתיהן או אף אחת; מכשירים חיוביים ללא כפילויות (ריק = כל המכשירים).</summary>
    private static int[] ValidateConditions(int? durationMinutes, string? timePermitStart, string? timePermitEnd, int[]? deviceIds)
    {
        if (durationMinutes is < PhoneExceptionsLimits.DurationMinutesMin or > PhoneExceptionsLimits.DurationMinutesMax)
        {
            throw ApiException.Validation(PhoneExceptionsRequestFields.NumbDurationLimit);
        }

        ValidateTimeWindow(timePermitStart, timePermitEnd);

        return DistinctPositiveIds(deviceIds, PhoneExceptionsRequestFields.IdntDeviceList);
    }

    private static void ValidateTimeWindow(string? timePermitStart, string? timePermitEnd)
    {
        bool hasStart = !string.IsNullOrWhiteSpace(timePermitStart);
        bool hasEnd = !string.IsNullOrWhiteSpace(timePermitEnd);

        if (!hasStart && !hasEnd)
        {
            return;
        }

        // שעה אחת בלי השנייה: השדה החסר הוא השגוי
        if (!hasStart)
        {
            throw ApiException.Validation(PhoneExceptionsRequestFields.TimePermitStart);
        }

        if (!hasEnd)
        {
            throw ApiException.Validation(PhoneExceptionsRequestFields.TimePermitEnd);
        }

        if (!DateTimeStrings.TryParseTime(timePermitStart, out DateTime start))
        {
            throw ApiException.Validation(PhoneExceptionsRequestFields.TimePermitStart);
        }

        if (!DateTimeStrings.TryParseTime(timePermitEnd, out DateTime end))
        {
            throw ApiException.Validation(PhoneExceptionsRequestFields.TimePermitEnd);
        }

        if (end <= start)
        {
            throw ApiException.Validation(PhoneExceptionsRequestFields.TimePermitEnd);
        }
    }

    private static void ValidateApproval(string? details, string detailsFieldName, int approverId, string? textFile)
    {
        RequireText(details, PhoneExceptionsLimits.DetailsMaxLength, detailsFieldName);
        RequirePositive(approverId, PhoneExceptionsRequestFields.IdntUserApproval);
        RequireText(textFile, PhoneExceptionsLimits.TextFileMaxLength, PhoneExceptionsRequestFields.TextFile);
    }

    private static void RequireText(string? text, int maxLength, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length > maxLength)
        {
            throw ApiException.Validation(fieldName);
        }
    }
}
