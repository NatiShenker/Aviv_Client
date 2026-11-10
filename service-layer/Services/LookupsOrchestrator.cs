using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Models;
using Aviv_Service.Utils;

namespace Aviv_Service.Services;

/// <summary>
/// האורקסטרטור של טבלאות הקוד: קורא ל-repository ומרכיב טבלה לכל מזהה שנתבקש, בסדר הבקשה, עם שמה מהרישום ושורותיה (K-3).
/// טבלה בלי שורות חוזרת ריקה – כך הקליינט נופל ל-mock לפי מפתח (K-6). גנרי: אינו יודע מה הסטים מכילים (K-8).
/// הבקשה כבר נבדקה בקונטרולר (K-10); חריגות אינן נתפסות כאן – הקונטרולר רושם לוג ומחזיר 500 (A-6).
/// </summary>
public class LookupsOrchestrator(ILookupsRepository lookupsRepository) : ILookupsOrchestrator
{
    public async Task<List<DecodeTableDto>> GetDecodeAsync(DecodeRequestDto request)
    {
        List<DecodeRow> rows = await lookupsRepository.GetDecodeAsync(request);
        ILookup<int, DecodeRow> rowsByCodeTable = rows.ToLookup(row => row.CodeTable);

        return request.CodeTableList
            .Distinct()
            .Select(codeTable => ToTable(codeTable, rowsByCodeTable[codeTable]))
            .ToList();
    }

    private static DecodeTableDto ToTable(int codeTable, IEnumerable<DecodeRow> rows)
    {
        return new DecodeTableDto
        {
            CodeTable = codeTable,
            CodeTableName = DecodeTables.NameOf(codeTable),
            Items = rows.Select(row => new LookupItemDto { Id = row.Id, Name = row.Name ?? "" }).ToList(),
        };
    }
}
