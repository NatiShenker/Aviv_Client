using Aviv_Service.Models;
using Aviv_Service.Utils;

namespace Aviv_Service.Services;

/// <summary>
/// החלקים שכל assembler מרכיב אותו דבר מתוך שורות הפרוצדורות (T-12): מכשירים, פנימיות, המאשר וקובץ האישור.
/// TI-7: ToInstitutes משמש היום רק את 04 ויושב כאן ליד אחיו.
/// </summary>
public static class RecordPartsAssembler
{
    public static List<LookupItemDto> ToDevices(IEnumerable<DeviceRow> devices)
    {
        return devices
            .Select(device => new LookupItemDto { Id = device.DeviceId, Name = device.DeviceName })
            .ToList();
    }

    public static List<LookupItemDto> ToInstitutes(IEnumerable<InstituteRow> institutes)
    {
        return institutes
            .Select(institute => new LookupItemDto { Id = institute.InstituteId, Name = institute.InstituteName })
            .ToList();
    }

    /// <summary>I-22: השם מגיע מהפרוצדורה (JOIN ל-A_WORKERS); ריק כשאין שורת ייחוס (C-8). התפקיד לא מצורף.</summary>
    public static ApproverDto ToApprover(int? approverId, string? approverName)
    {
        return new ApproverDto { Id = approverId ?? 0, FullName = approverName ?? "" };
    }

    /// <summary>D-13: שם הקובץ נגזר מהקטע האחרון של הנתיב ב-SharePoint (FilePaths).</summary>
    public static FileDto ToFile(int? fileId, string? textFile)
    {
        string path = textFile ?? "";

        return new FileDto { Id = fileId ?? 0, FileName = FilePaths.FileNameFromPath(path), TextFile = path };
    }
}
