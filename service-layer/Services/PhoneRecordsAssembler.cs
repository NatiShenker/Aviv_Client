using Aviv_Service.Models;
using Aviv_Service.Utils;

namespace Aviv_Service.Services;

/// <summary>
/// הרכבת התשובות מסטי התוצאה של הפרוצדורות (A-4, §8): הצמדת מכשירים, פנימיות והיתרים קיימים להורים לפי מזהה,
/// והמרת תאריכים ושעות למחרוזות (I-5). הדגלים (IsPermit, IsEnded) וקוד ה-scope עוברים מהפרוצדורה כמו שהם (I-19).
/// </summary>
public static class PhoneRecordsAssembler
{
    // ===========================================
    // היסטוריה
    // ===========================================

    public static TraineePhoneRecordsResponseDto BuildHistory(TraineePhoneRecordsRowSets rows)
    {
        ILookup<int, DeviceRow> devicesByConditionsRowId = rows.Devices.ToLookup(device => device.ConditionsRowId);
        ILookup<int, InstituteRow> institutesByRestrictionId = rows.Institutes.ToLookup(institute => institute.RestrictionNumberId);

        var response = new TraineePhoneRecordsResponseDto();

        foreach (PhoneRecordRow row in rows.Records)
        {
            response.Records.Add(ToRecord(row, devicesByConditionsRowId, institutesByRestrictionId));
        }

        // B-5: המיון והחיפוש הם של הקליינט
        return response;
    }

    private static TraineePhoneRecordDto ToRecord(
        PhoneRecordRow row,
        ILookup<int, DeviceRow> devicesByConditionsRowId,
        ILookup<int, InstituteRow> institutesByRestrictionId)
    {
        // D-2: המכשירים יושבים על שורת התנאים (של הגבלה – השורה הצמודה; של היתר – ההיתר עצמו). הגבלה בלי תנאים – בלי שורה ובלי מכשירים
        List<LookupItemDto> devices = row.ConditionsRowId is int conditionsRowId
            ? ToDevices(devicesByConditionsRowId[conditionsRowId])
            : [];

        var record = new TraineePhoneRecordDto
        {
            IsPermit = row.IsPermit,
            Id = row.Id,
            IdntAvivRestrictionNumber = row.RestrictionNumberId,
            IdntTrainee = row.TraineeId,
            IdntAvivListPhoneNumber = row.PhoneNumberId,
            TextPhoneNumber = row.PhoneNumber,
            DateStart = DateTimeStrings.FormatDate(row.DateStart),
            DateEnd = DateTimeStrings.FormatDate(row.DateEnd),
            IsEnded = row.IsEnded,
            NumbDurationLimit = row.NumbDurationLimit,
            TimePermitStart = DateTimeStrings.FormatTime(row.TimePermitStart),
            TimePermitEnd = DateTimeStrings.FormatTime(row.TimePermitEnd),
            Devices = devices,
            TextReason = row.TextReason ?? "",
            Approver = new ApproverDto { Id = row.IdntUserApproval ?? 0 },
            ApprovedFile = ToFile(row.IdntApprovedFile, row.TextFile),
            DateCreated = DateTimeStrings.FormatTimestamp(row.DateCreated) ?? "",
            DateUpdated = DateTimeStrings.FormatTimestamp(row.DateUpdated),
            IdntUserUpdate = row.IdntUserUpdate ?? 0,
        };

        if (row.IsPermit)
        {
            record.SourceRestriction = ToSourceSummary(row, institutesByRestrictionId[row.RestrictionNumberId]);
        }

        return record;
    }

    /// <summary>תקציר הגבלת המקור של היתר בהיסטוריה, מעמודות Source* של שורת ההיתר. ההיתרים הקיימים אינם ממולאים כאן (§8).</summary>
    private static SourceRestrictionSummaryDto ToSourceSummary(PhoneRecordRow permitRow, IEnumerable<InstituteRow> institutes)
    {
        return new SourceRestrictionSummaryDto
        {
            IdntAvivRestrictionNumber = permitRow.RestrictionNumberId,
            IdntAvivTraineeRestrictionNumber = permitRow.SourceTraineeRestrictionNumberId,
            IdntAvivListPhoneNumber = permitRow.PhoneNumberId,
            TextPhoneNumber = permitRow.PhoneNumber,
            CodeRestrictionScope = permitRow.SourceCodeRestrictionScope ?? 0,
            Institutes = ToInstitutes(institutes),
            DateStart = DateTimeStrings.FormatDate(permitRow.SourceDateStart),
            DateEnd = DateTimeStrings.FormatDate(permitRow.SourceDateEnd),
            TextReason = permitRow.SourceTextReason ?? "",
        };
    }

    // ===========================================
    // איתור הגבלות להיתר
    // ===========================================

    /// <param name="requestedPhoneNumbers">המספרים המנורמלים של הבקשה; לכל אחד תוצאה, בסדר הזה, גם כשאין לו הגבלות.</param>
    public static LookupRestrictionsForPermitResponseDto BuildLookup(RestrictionsForPermitRowSets rows, string[] requestedPhoneNumbers)
    {
        ILookup<int, InstituteRow> institutesByRestrictionId = rows.Institutes.ToLookup(institute => institute.RestrictionNumberId);
        ILookup<int, ExistingPermitRow> existingPermitsByRestrictionId = rows.ExistingPermits.ToLookup(permit => permit.RestrictionNumberId);
        ILookup<int, DeviceRow> devicesByPermitId = rows.PermitDevices.ToLookup(device => device.ConditionsRowId);

        var response = new LookupRestrictionsForPermitResponseDto();

        foreach (string phoneNumber in requestedPhoneNumbers)
        {
            // ספק 04 §2.7: ארצי → פנימייה → חניך, ואז לפי תאריך ההתחלה.
            // קוד 1 (כללית) לפני 2 (חניך); בתוך הכלליות – בלי פנימיות (ארצית) לפני עם פנימיות (D-5)
            List<SourceRestrictionSummaryDto> restrictions = rows.Restrictions
                .Where(restriction => restriction.PhoneNumber == phoneNumber)
                .Select(restriction => ToSourceSummary(restriction, institutesByRestrictionId, existingPermitsByRestrictionId, devicesByPermitId))
                .OrderBy(summary => summary.CodeRestrictionScope)
                .ThenBy(summary => summary.Institutes.Count > 0)
                .ThenBy(summary => summary.DateStart)
                .ToList();

            response.Results.Add(new PhoneLookupResultDto { TextPhoneNumber = phoneNumber, ActiveRestrictions = restrictions });
        }

        return response;
    }

    private static SourceRestrictionSummaryDto ToSourceSummary(
        SourceRestrictionRow row,
        ILookup<int, InstituteRow> institutesByRestrictionId,
        ILookup<int, ExistingPermitRow> existingPermitsByRestrictionId,
        ILookup<int, DeviceRow> devicesByPermitId)
    {
        List<ExistingPermitDto> existingPermits = existingPermitsByRestrictionId[row.RestrictionNumberId]
            .Select(permit => ToExistingPermit(permit, devicesByPermitId))
            .ToList();

        return new SourceRestrictionSummaryDto
        {
            IdntAvivRestrictionNumber = row.RestrictionNumberId,
            IdntAvivTraineeRestrictionNumber = row.TraineeRestrictionNumberId,
            IdntAvivListPhoneNumber = row.PhoneNumberId,
            TextPhoneNumber = row.PhoneNumber,
            CodeRestrictionScope = row.CodeRestrictionScope,
            Institutes = ToInstitutes(institutesByRestrictionId[row.RestrictionNumberId]),
            DateStart = DateTimeStrings.FormatDate(row.DateStart),
            DateEnd = DateTimeStrings.FormatDate(row.DateEnd),
            TextReason = row.TextReason ?? "",
            ExistingTraineePermits = existingPermits,
        };
    }

    private static ExistingPermitDto ToExistingPermit(ExistingPermitRow row, ILookup<int, DeviceRow> devicesByPermitId)
    {
        return new ExistingPermitDto
        {
            Id = row.PermitId,
            DateStart = DateTimeStrings.FormatDate(row.DateStart),
            DateEnd = DateTimeStrings.FormatDate(row.DateEnd),
            NumbDurationLimit = row.NumbDurationLimit,
            TimePermitStart = DateTimeStrings.FormatTime(row.TimePermitStart),
            TimePermitEnd = DateTimeStrings.FormatTime(row.TimePermitEnd),
            Devices = ToDevices(devicesByPermitId[row.PermitId]),
        };
    }

    // ===========================================
    // פריטי משנה
    // ===========================================

    private static List<LookupItemDto> ToDevices(IEnumerable<DeviceRow> devices)
    {
        return devices
            .Select(device => new LookupItemDto { Id = device.DeviceId, Name = device.DeviceName })
            .ToList();
    }

    private static List<LookupItemDto> ToInstitutes(IEnumerable<InstituteRow> institutes)
    {
        return institutes
            .Select(institute => new LookupItemDto { Id = institute.InstituteId, Name = institute.InstituteName })
            .ToList();
    }

    /// <summary>D-13: שם הקובץ נגזר מהקטע האחרון של הנתיב ב-SharePoint.</summary>
    private static FileDto ToFile(int? fileId, string? textFile)
    {
        string path = textFile ?? "";

        return new FileDto { Id = fileId ?? 0, FileName = FileNameFromPath(path), TextFile = path };
    }

    private static string FileNameFromPath(string path)
    {
        int lastSeparator = path.LastIndexOfAny(['/', '\\']);

        return lastSeparator < 0 ? path : path[(lastSeparator + 1)..];
    }
}
