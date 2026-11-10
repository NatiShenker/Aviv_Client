import type { TraineeListItemDto } from "@/types/trainees.schema";
import { TRAINEE_TEXTS } from "./traineeTexts";

type TraineeIdentity = Pick<TraineeListItemDto, "textFullName" | "numbPersonalNumber">;

/**
 * המספר האישי לתצוגה. השרת מחזיר אותו מספרי (LC-1); אם יתברר שיש מספרים עם אפס מוביל, הריפוד ל-7 ספרות
 * נוסף כאן בלבד (LQ-3, pending-decisions)
 */
export function formatPersonalNumber(numbPersonalNumber: number): string {
  return String(numbPersonalNumber);
}

/** השם המוצג בשורה אחת: "שם מלא | מספר אישי" - בכותרות ההיסטוריה והטופס במובייל */
export function buildTraineeDisplayName(trainee: TraineeIdentity): string {
  return `${trainee.textFullName}${TRAINEE_TEXTS.nameSeparator}${formatPersonalNumber(trainee.numbPersonalNumber)}`;
}

/** השם בתוך שם נגיש (למשל של כפתור): "שם מלא, מספר אישי" */
export function buildTraineeAccessibleName(trainee: TraineeIdentity): string {
  return `${trainee.textFullName}${TRAINEE_TEXTS.accessibleNameSeparator}${formatPersonalNumber(trainee.numbPersonalNumber)}`;
}
