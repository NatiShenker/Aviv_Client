using Aviv_Service.Models;
using Aviv_Service.Models.TraineeRestrictions;

namespace Aviv_Service.Interfaces;

/// <summary>הפעולות של "הגבלות לחניך" (פיצ'ר 03), בשמות שהקליינט קורא (A-7, T-14). שגיאות קלט נזרקות כ-ApiException.</summary>
public interface ITraineeRestrictionsOrchestrator
{
    Task<TraineeRestrictionsResponseDto> GetTraineeRestrictionsAsync(GetTraineeRestrictionsRequestDto request);

    Task<MutationResultDto> CreateTraineeRestrictionAsync(CreateTraineeRestrictionRequestDto request);

    Task<MutationResultDto> UpdateTraineeRestrictionAsync(UpdateTraineeRestrictionRequestDto request);
}
