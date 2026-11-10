using Aviv_Service.Models;
using Aviv_Service.Models;
using Aviv_Service.Utils;

namespace Aviv_Service.Services;

/// <summary>
/// הרכבת רשימת החניכים מהשורות השטוחות של SP_AVIV_GET_TRAINEES ומנתוני סלקום (L-7, 02-architecture.md §8):
/// האגף והמיקום כזוגות מזהה+שם, הדגלים כאובייקט, התאריך כמחרוזת (I-5). ששת דגלי הפרוצדורה עוברים כמו שהם (I-19);
/// HasBalance הוא הנגזרת היחידה כאן, כי המקור שלו אינו ב-DB (L-6).
/// </summary>
public static class TraineesAssembler
{
    // L-6: חניך שספק סלקום אינו מכיר – אין עליו נתון
    private static readonly CellcomTraineeBalance NoBalanceData = new(NumbRemainingMinutes: 0, HasCellcomDiscrepancy: false);

    public static List<TraineeDto> BuildList(List<TraineeRow> rows, IReadOnlyDictionary<int, CellcomTraineeBalance> balances)
    {
        List<TraineeDto> trainees = [];

        foreach (TraineeRow row in rows)
        {
            CellcomTraineeBalance balance = balances.GetValueOrDefault(row.IdntTrainee, NoBalanceData);
            trainees.Add(ToTrainee(row, balance));
        }

        // B-5: המיון והסינון הם של הקליינט; הפרוצדורה כבר מחזירה לפי שם (L-13)
        return trainees;
    }

    private static TraineeDto ToTrainee(TraineeRow row, CellcomTraineeBalance balance)
    {
        return new TraineeDto
        {
            IdntTrainee = row.IdntTrainee,
            NumbPersonalNumber = row.NumbPersonalNumber ?? 0,
            TextFullName = row.TextFullName ?? "",
            IdntInstitution = row.IdntInstitution,
            Wing = new LookupItemDto { Id = row.IdntWing ?? 0, Name = row.TextWingName ?? "" },
            Location = ToLocation(row),
            DateRestrictedUntil = row.DateRestrictedUntil is DateTime restrictedUntil ? DateTimeStrings.FormatDate(restrictedUntil) : null,
            NumbRemainingMinutes = balance.NumbRemainingMinutes,
            Flags = ToFlags(row, balance),
        };
    }

    /// <summary>L-2: חניך בלי מיקום → null, לא זוג ריק.</summary>
    private static LookupItemDto? ToLocation(TraineeRow row)
    {
        if (row.IdntLocation is not int locationId)
        {
            return null;
        }

        return new LookupItemDto { Id = locationId, Name = row.TextLocationName ?? "" };
    }

    private static TraineeFlagsDto ToFlags(TraineeRow row, CellcomTraineeBalance balance)
    {
        return new TraineeFlagsDto
        {
            HasActiveFullRestriction = row.HasActiveFullRestriction,
            HasActiveMinutesRestriction = row.HasActiveMinutesRestriction,
            HasActivePhoneRestriction = row.HasActivePhoneRestriction,
            HasActivePhonePermit = row.HasActivePhonePermit,
            HasActiveMessage = row.HasActiveMessage,
            HasActiveInteractiveMessage = row.HasActiveInteractiveMessage,
            HasBalance = balance.NumbRemainingMinutes > 0,
            HasCellcomDiscrepancy = balance.HasCellcomDiscrepancy,
        };
    }
}
