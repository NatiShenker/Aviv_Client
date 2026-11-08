namespace Aviv_Service.Infrastructure;

/// <summary>
/// תוצאה עסקית שאינה הצלחה (A-2): 400 – הקלט שגוי, עם השדה לתיקון; 409 – הרשומה שהבקשה מפנה אליה כבר אינה תקפה
/// (לא קיימת, הוחלפה או הסתיימה). ההודעה היא שם השדה ב-camelCase, כמו ב-JSON וכמו ב-THROW של הפרוצדורות.
/// </summary>
public class ApiException(int statusCode, string fieldName) : Exception(fieldName)
{
    public int StatusCode { get; } = statusCode;
    public string FieldName { get; } = fieldName;

    public static ApiException Validation(string fieldName) => new(StatusCodes.Status400BadRequest, fieldName);

    public static ApiException Conflict(string fieldName) => new(StatusCodes.Status409Conflict, fieldName);
}
