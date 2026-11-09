using Aviv_Service.Infrastructure;
using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Models.TraineeRestrictions;

namespace Aviv_Service.Services.TraineeRestrictions;

/// <summary>
/// האורקסטרטור של "הגבלות לחניך" (A-11): מאמת את הבקשה, לוקח את המשתמש הפועל, יוצר מזהה בקשה לכל שמירה,
/// קורא ל-repository ומרכיב את התשובה. חריגות אינן נתפסות כאן – ApiActionRunner מתרגם אותן ל-HTTP (A-6).
/// </summary>
public class TraineeRestrictionsOrchestrator(
    ITraineeRestrictionsRepository traineeRestrictionsRepository,
    ICurrentUserService currentUserService) : ITraineeRestrictionsOrchestrator
{
    // ===========================================
    // קריאה
    // ===========================================

    public async Task<TraineeRestrictionsResponseDto> GetTraineeRestrictionsAsync(GetTraineeRestrictionsRequestDto request)
    {
        GetTraineeRestrictionsRequestDto validRequest = TraineeRestrictionsRequestValidator.ValidateGetRestrictions(request);
        TraineeRestrictionsRowSets rows = await traineeRestrictionsRepository.GetTraineeRestrictionsAsync(validRequest);

        return TraineeRestrictionsAssembler.BuildHistory(rows);
    }

    // ===========================================
    // שמירה – D-19: מזהה בקשה אחד (Guid) לכל שמירה, נחתם על כל שורה שהפרוצדורה כותבת (LAST_REQUEST_UID)
    // ===========================================

    public async Task<MutationResultDto> CreateTraineeRestrictionAsync(CreateTraineeRestrictionRequestDto request)
    {
        CreateTraineeRestrictionRequestDto validRequest = TraineeRestrictionsRequestValidator.ValidateCreate(request);
        List<int> createdIds = await traineeRestrictionsRepository.CreateTraineeRestrictionAsync(validRequest, ActingUserId.From(currentUserService), Guid.NewGuid());

        return new MutationResultDto { CreatedIds = createdIds };
    }

    public async Task<MutationResultDto> UpdateTraineeRestrictionAsync(UpdateTraineeRestrictionRequestDto request)
    {
        UpdateTraineeRestrictionRequestDto validRequest = TraineeRestrictionsRequestValidator.ValidateUpdate(request);
        List<int> createdIds = await traineeRestrictionsRepository.UpdateTraineeRestrictionAsync(validRequest, ActingUserId.From(currentUserService), Guid.NewGuid());

        return new MutationResultDto { CreatedIds = createdIds };
    }
}
