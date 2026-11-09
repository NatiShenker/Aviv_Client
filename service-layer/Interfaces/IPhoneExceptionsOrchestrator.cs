using Aviv_Service.Models;
using Aviv_Service.Models.PhoneExceptions;

namespace Aviv_Service.Interfaces;

/// <summary>הפעולות של "הגבלות והיתרים למספר" (פיצ'ר 04), בשמות שהקליינט קורא (A-7). שגיאות קלט נזרקות כ-ApiException.</summary>
public interface IPhoneExceptionsOrchestrator
{
    Task<TraineePhoneRecordsResponseDto> GetTraineePhoneRecordsAsync(GetTraineePhoneRecordsRequestDto request);

    Task<LookupRestrictionsForPermitResponseDto> LookupPhoneRestrictionsForPermitAsync(LookupRestrictionsForPermitRequestDto request);

    Task<MutationResultDto> CreateTraineePhoneRestrictionAsync(CreateTraineeRestrictionNumberRequestDto request);

    Task<MutationResultDto> UpdateTraineePhoneRestrictionAsync(UpdateTraineeRestrictionNumberRequestDto request);

    Task<MutationResultDto> CreateTraineePhonePermitAsync(CreateTraineePermitRequestDto request);

    Task<MutationResultDto> UpdateTraineePhonePermitAsync(UpdateTraineePermitRequestDto request);
}
