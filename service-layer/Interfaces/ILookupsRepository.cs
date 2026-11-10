using Aviv_Service.Models;

namespace Aviv_Service.Interfaces;

/// <summary>שיטה אחת לפרוצדורה האחת של טבלאות הקוד (A-15, K-9).</summary>
public interface ILookupsRepository
{
    /// <returns>כל השורות הפעילות של הטבלאות שנשלחו, לפי טבלה ואז לפי סדר התצוגה (K-2). טבלה בלי שורות אינה מופיעה.</returns>
    Task<List<DecodeRow>> GetDecodeAsync(DecodeRequestDto request);
}
