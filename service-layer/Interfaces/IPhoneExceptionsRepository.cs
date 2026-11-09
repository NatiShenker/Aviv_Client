using Aviv_Service.Models.PhoneExceptions;

namespace Aviv_Service.Interfaces;

/// <summary>
/// שיטה אחת לכל פרוצדורה של "הגבלות והיתרים למספר" (A-15, A-16). שמות השיטות הם שמות הפרוצדורות.
/// הקלט הוא הבקשה אחרי הוולידטור (מנורמלת, I-4); השמירות מקבלות גם את המשתמש הפועל ואת מזהה הבקשה (D-14, D-19).
/// </summary>
public interface IPhoneExceptionsRepository
{
    Task<TraineePhoneRecordsRowSets> GetTraineeNumberRestrictionsAndPermitsAsync(GetTraineePhoneRecordsRequestDto request);

    Task<RestrictionsForPermitRowSets> GetRestrictionsForPermitAsync(LookupRestrictionsForPermitRequestDto request);

    /// <returns>מזהי שורות החניך שנוצרו, אחד לכל זוג חניך × מספר (P-12).</returns>
    Task<List<int>> CreateTraineeRestrictionNumberAsync(CreateTraineeRestrictionNumberRequestDto request, int actingUserId, Guid requestUid);

    /// <returns>מזהה שורת החניך החדשה.</returns>
    Task<List<int>> UpdateTraineeRestrictionNumberAsync(UpdateTraineeRestrictionNumberRequestDto request, int actingUserId, Guid requestUid);

    /// <returns>מזהי ההיתרים שנוצרו, אחד לכל חניך.</returns>
    Task<List<int>> CreateTraineePermitForRestrictionNumberAsync(CreateTraineePermitRequestDto request, int actingUserId, Guid requestUid);

    /// <returns>מזהה ההיתר החדש.</returns>
    Task<List<int>> UpdateTraineePermitForRestrictionNumberAsync(UpdateTraineePermitRequestDto request, int actingUserId, Guid requestUid);
}
