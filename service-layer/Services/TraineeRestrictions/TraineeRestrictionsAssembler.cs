using Aviv_Service.Models;
using Aviv_Service.Models.TraineeRestrictions;
using Aviv_Service.Utils;

namespace Aviv_Service.Services.TraineeRestrictions;

/// <summary>
/// הרכבת תשובת ההיסטוריה משני סטי התוצאה של SP_AVIV_GET_TRAINEE_RESTRICTIONS (A-4, 02-architecture.md §8):
/// הצמדת המכשירים לשורת התנאים שלהם לפי ConditionsRowId, והמרת תאריכים ושעות למחרוזות (I-5).
/// החלקים המשותפים לכל רשומה (מכשירים, מאשר, קובץ) נבנים ב-RecordPartsAssembler (T-12). הדגל IsEnded עובר מהפרוצדורה כמו שהוא (I-19).
/// </summary>
public static class TraineeRestrictionsAssembler
{
    public static TraineeRestrictionsResponseDto BuildHistory(TraineeRestrictionsRowSets rows)
    {
        ILookup<int, DeviceRow> devicesByConditionsRowId = rows.Devices.ToLookup(device => device.ConditionsRowId);

        var response = new TraineeRestrictionsResponseDto();

        foreach (TraineeRestrictionRow row in rows.Restrictions)
        {
            response.Records.Add(ToRecord(row, devicesByConditionsRowId));
        }

        // B-5: המיון והחיפוש הם של הקליינט
        return response;
    }

    private static TraineeRestrictionRecordDto ToRecord(TraineeRestrictionRow row, ILookup<int, DeviceRow> devicesByConditionsRowId)
    {
        // D-2, T-2: המכשירים יושבים על שורת התנאים הפנימית; הגבלה בלי שעות ומכשירים – בלי שורה ובלי מכשירים
        List<LookupItemDto> devices = row.ConditionsRowId is int conditionsRowId
            ? RecordPartsAssembler.ToDevices(devicesByConditionsRowId[conditionsRowId])
            : [];

        return new TraineeRestrictionRecordDto
        {
            Id = row.Id,
            IdntTrainee = row.TraineeId,
            DateStart = DateTimeStrings.FormatDate(row.DateStart),
            DateEnd = DateTimeStrings.FormatDate(row.DateEnd),
            IsEnded = row.IsEnded,
            NumbDurationLimit = row.NumbDurationLimit,
            TimePermitStart = DateTimeStrings.FormatTime(row.TimePermitStart),
            TimePermitEnd = DateTimeStrings.FormatTime(row.TimePermitEnd),
            Devices = devices,
            TextReason = row.TextReason ?? "",
            Approver = RecordPartsAssembler.ToApprover(row.IdntUserApproval, row.ApproverName),
            ApprovedFile = RecordPartsAssembler.ToFile(row.IdntApprovedFile, row.TextFile),
            DateCreated = DateTimeStrings.FormatTimestamp(row.DateCreated) ?? "",
            DateUpdated = DateTimeStrings.FormatTimestamp(row.DateUpdated),
            IdntUserUpdate = row.IdntUserUpdate ?? 0,
        };
    }
}
