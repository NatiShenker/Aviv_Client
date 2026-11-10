using Aviv_Service.Models;

namespace Aviv_Service.Interfaces;

/// <summary>
/// נתוני היתרה של סלקום לחניכים (L-6): יתרת הדקות ודגל "פער בנתונים" לכל חניך. התפר היחיד בין רשימת החניכים לסלקום.
/// היום רשום מימוש אחד, CellcomBalanceStandIn, שמחזיר מילון ריק; המימוש האמיתי (קריאת HTTP, LQ-5) מחליף אותו בשורת DI אחת.
/// </summary>
public interface ICellcomBalanceProvider
{
    /// <returns>מילון לפי מזהה חניך. חניך שאינו במילון – אין עליו נתון: 0 דקות, בלי יתרה, בלי פער.</returns>
    Task<IReadOnlyDictionary<int, CellcomTraineeBalance>> GetBalancesAsync(IReadOnlyCollection<int> traineeIds);
}
