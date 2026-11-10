using Aviv_Service.Interfaces;
using Aviv_Service.Models;

namespace Aviv_Service.Services;

/// <summary>
/// האורקסטרטור של רשימת החניכים: קורא ל-repository, מביא את נתוני סלקום של החניכים שחזרו (L-6) ומרכיב את התשובה (L-7).
/// הבקשה כבר נבדקה בקונטרולר (L-15); חריגות אינן נתפסות כאן – הקונטרולר רושם לוג ומחזיר 500 (A-6).
/// </summary>
public class TraineesOrchestrator(
    ITraineesRepository traineesRepository,
    ICellcomBalanceProvider cellcomBalanceProvider) : ITraineesOrchestrator
{
    public async Task<List<TraineeDto>> GetTraineesAsync(TraineeRequestDto request)
    {
        List<TraineeRow> rows = await traineesRepository.GetTraineesAsync(request);

        // L-6: קריאה אחת לספק סלקום עבור כל החניכים שחזרו, לא קריאה לכל חניך
        List<int> traineeIds = rows.Select(row => row.IdntTrainee).ToList();
        IReadOnlyDictionary<int, CellcomTraineeBalance> balances = await cellcomBalanceProvider.GetBalancesAsync(traineeIds);

        return TraineesAssembler.BuildList(rows, balances);
    }
}
