using Aviv_Service.Models;

namespace Aviv_Service.Interfaces;

/// <summary>רשימת החניכים (מסך הבית, ספק 01), בשם שהקליינט קורא (A-7, L-11). הבקשה כבר נבדקה בקונטרולר (L-15).</summary>
public interface ITraineesOrchestrator
{
    Task<List<TraineeDto>> GetTraineesAsync(TraineeRequestDto request);
}
