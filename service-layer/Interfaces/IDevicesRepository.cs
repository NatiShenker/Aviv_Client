using Aviv_Service.Models;

namespace Aviv_Service.Interfaces;

/// <summary>שיטה אחת לפרוצדורה האחת של רשימת המכשירים (A-15, E-11). הקונטרולר קורא ישירות – אין אורקסטרטור (E-12).</summary>
public interface IDevicesRepository
{
    /// <returns>מכשיר פעיל לכל שורה, של הפנימיות או האגפים שנשלחו, עם השם המורכב והאגף לקיבוץ (E-3, E-4).</returns>
    Task<List<DeviceDto>> GetDevicesAsync(DeviceRequestDto request);
}
