using Aviv_Service.Models;

namespace Aviv_Service.Interfaces;

/// <summary>שיטה אחת לפרוצדורה האחת של רשימת החניכים (A-15, L-11).</summary>
public interface ITraineesRepository
{
    /// <returns>שורה לכל חניך נוכחי של הפנימיות או האגפים שנשלחו, עם הדגלים שהפרוצדורה חישבה (I-19).</returns>
    Task<List<TraineeRow>> GetTraineesAsync(TraineeRequestDto request);
}
