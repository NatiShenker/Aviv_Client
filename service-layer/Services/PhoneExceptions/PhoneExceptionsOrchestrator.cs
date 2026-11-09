using Aviv_Service.Infrastructure;
using Aviv_Service.Interfaces;
using Aviv_Service.Models;
using Aviv_Service.Models.PhoneExceptions;

namespace Aviv_Service.Services.PhoneExceptions;

/// <summary>
/// האורקסטרטור של "הגבלות והיתרים למספר" (A-11): מאמת את הבקשה, לוקח את המשתמש הפועל, יוצר מזהה בקשה לכל שמירה,
/// קורא ל-repository ומרכיב את התשובה. חריגות אינן נתפסות כאן – ApiActionRunner מתרגם אותן ל-HTTP (A-6).
/// </summary>
public class PhoneExceptionsOrchestrator(
    IPhoneExceptionsRepository phoneExceptionsRepository,
    ICurrentUserService currentUserService) : IPhoneExceptionsOrchestrator
{
    // ===========================================
    // קריאה
    // ===========================================

    public async Task<TraineePhoneRecordsResponseDto> GetTraineePhoneRecordsAsync(GetTraineePhoneRecordsRequestDto request)
    {
        GetTraineePhoneRecordsRequestDto validRequest = PhoneExceptionsRequestValidator.ValidateGetRecords(request);
        TraineePhoneRecordsRowSets rows = await phoneExceptionsRepository.GetTraineeNumberRestrictionsAndPermitsAsync(validRequest);

        return PhoneRecordsAssembler.BuildHistory(rows);
    }

    public async Task<LookupRestrictionsForPermitResponseDto> LookupPhoneRestrictionsForPermitAsync(LookupRestrictionsForPermitRequestDto request)
    {
        LookupRestrictionsForPermitRequestDto validRequest = PhoneExceptionsRequestValidator.ValidateLookup(request);
        RestrictionsForPermitRowSets rows = await phoneExceptionsRepository.GetRestrictionsForPermitAsync(validRequest);

        return PhoneRecordsAssembler.BuildLookup(rows, validRequest.PhoneNumberList);
    }

    // ===========================================
    // שמירה – D-19: מזהה בקשה אחד (Guid) לכל שמירה, נחתם על כל שורה שהפרוצדורה כותבת (LAST_REQUEST_UID)
    // D-14, I-7: המשתמש הפועל נקרא דרך ActingUserId (משותף, T-12 של 03)
    // ===========================================

    public async Task<MutationResultDto> CreateTraineePhoneRestrictionAsync(CreateTraineeRestrictionNumberRequestDto request)
    {
        CreateTraineeRestrictionNumberRequestDto validRequest = PhoneExceptionsRequestValidator.ValidateCreateRestriction(request);
        List<int> createdIds = await phoneExceptionsRepository.CreateTraineeRestrictionNumberAsync(validRequest, ActingUserId.From(currentUserService), Guid.NewGuid());

        return new MutationResultDto { CreatedIds = createdIds };
    }

    public async Task<MutationResultDto> UpdateTraineePhoneRestrictionAsync(UpdateTraineeRestrictionNumberRequestDto request)
    {
        UpdateTraineeRestrictionNumberRequestDto validRequest = PhoneExceptionsRequestValidator.ValidateUpdateRestriction(request);
        List<int> createdIds = await phoneExceptionsRepository.UpdateTraineeRestrictionNumberAsync(validRequest, ActingUserId.From(currentUserService), Guid.NewGuid());

        return new MutationResultDto { CreatedIds = createdIds };
    }

    public async Task<MutationResultDto> CreateTraineePhonePermitAsync(CreateTraineePermitRequestDto request)
    {
        CreateTraineePermitRequestDto validRequest = PhoneExceptionsRequestValidator.ValidateCreatePermit(request);
        List<int> createdIds = await phoneExceptionsRepository.CreateTraineePermitForRestrictionNumberAsync(validRequest, ActingUserId.From(currentUserService), Guid.NewGuid());

        return new MutationResultDto { CreatedIds = createdIds };
    }

    public async Task<MutationResultDto> UpdateTraineePhonePermitAsync(UpdateTraineePermitRequestDto request)
    {
        UpdateTraineePermitRequestDto validRequest = PhoneExceptionsRequestValidator.ValidateUpdatePermit(request);
        List<int> createdIds = await phoneExceptionsRepository.UpdateTraineePermitForRestrictionNumberAsync(validRequest, ActingUserId.From(currentUserService), Guid.NewGuid());

        return new MutationResultDto { CreatedIds = createdIds };
    }
}
