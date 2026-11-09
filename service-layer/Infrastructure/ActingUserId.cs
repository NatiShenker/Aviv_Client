using Aviv_Service.Interfaces;

namespace Aviv_Service.Infrastructure;

/// <summary>
/// המשתמש הפועל (D-14), שנרשם ב-IDNT_USER_UPDATE של כל שורה שנכתבת. משותף לכל האורקסטרטורים (T-12).
/// I-7: החבר של ICurrentUserService אינו ידוע מהרפרנס; זו הנקודה היחידה שמתאימים בסרביס האמיתי (גם ה-using של הממשק).
/// </summary>
public static class ActingUserId
{
    public static int From(ICurrentUserService currentUserService)
    {
        string? userId = currentUserService.UserId;

        if (!int.TryParse(userId, out int actingUserId))
        {
            throw new InvalidOperationException("The current user id is missing or is not a number.");
        }

        return actingUserId;
    }
}
