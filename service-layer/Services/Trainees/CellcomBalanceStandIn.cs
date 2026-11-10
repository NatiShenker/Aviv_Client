using Aviv_Service.Interfaces;
using Aviv_Service.Models;

namespace Aviv_Service.Services;

/// <summary>
/// המימוש הזמני של ICellcomBalanceProvider (L-6): אין עדיין חיבור לסלקום, ולכן אין נתון על אף חניך – מילון ריק,
/// והרשימה מציגה 0 דקות, בלי יתרה ובלי פער. כשהקריאה לסלקום תיבנה (LQ-5), המימוש האמיתי מחליף את המחלקה הזו ברישום ה-DI בלבד.
/// LI-4: חסר מצב ובלי I/O – נרשם כ-singleton.
/// </summary>
public class CellcomBalanceStandIn : ICellcomBalanceProvider
{
    private static readonly IReadOnlyDictionary<int, CellcomTraineeBalance> NoData = new Dictionary<int, CellcomTraineeBalance>();

    public Task<IReadOnlyDictionary<int, CellcomTraineeBalance>> GetBalancesAsync(IReadOnlyCollection<int> traineeIds)
    {
        return Task.FromResult(NoData);
    }
}
