using Aviv_Service.Models.TraineeRestrictions;

namespace Aviv_Service.Interfaces;

/// <summary>
/// שיטה אחת לכל פרוצדורה של "הגבלות לחניך" (A-15, A-16, T-14). שמות השיטות הם שמות הפרוצדורות.
/// הקלט הוא הבקשה אחרי הוולידטור (מנורמלת, I-4); השמירות מקבלות גם את המשתמש הפועל ואת מזהה הבקשה (D-14, D-19).
/// </summary>
public interface ITraineeRestrictionsRepository
{
    Task<TraineeRestrictionsRowSets> GetTraineeRestrictionsAsync(GetTraineeRestrictionsRequestDto request);

    /// <returns>מזהי שורות ההגבלה שנוצרו, אחד לכל חניך (P-12).</returns>
    Task<List<int>> CreateTraineeRestrictionAsync(CreateTraineeRestrictionRequestDto request, int actingUserId, Guid requestUid);

    /// <returns>מזהה שורת ההגבלה החדשה.</returns>
    Task<List<int>> UpdateTraineeRestrictionAsync(UpdateTraineeRestrictionRequestDto request, int actingUserId, Guid requestUid);
}
