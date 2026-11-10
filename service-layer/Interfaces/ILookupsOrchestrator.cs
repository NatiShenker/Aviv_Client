using Aviv_Service.Models;

namespace Aviv_Service.Interfaces;

/// <summary>טבלאות הקוד של AVIV_DECODE לפי מזהי טבלה (K-3): טבלה לכל מזהה שנתבקש. הבקשה כבר נבדקה בקונטרולר (K-10).</summary>
public interface ILookupsOrchestrator
{
    Task<List<DecodeTableDto>> GetDecodeAsync(DecodeRequestDto request);
}
