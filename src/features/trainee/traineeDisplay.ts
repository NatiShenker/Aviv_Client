import type { TraineeListItemDto } from "@/types/trainees.schema";
import { TRAINEE_TEXTS } from "./traineeTexts";

type TraineeIdentity = Pick<TraineeListItemDto, "fullName" | "traineeCode">;

/** השם המוצג בשורה אחת: "שם מלא | מספר אישי" - בכותרות ההיסטוריה והטופס במובייל */
export function buildTraineeDisplayName(trainee: TraineeIdentity): string {
  return `${trainee.fullName}${TRAINEE_TEXTS.nameSeparator}${trainee.traineeCode}`;
}

/** השם בתוך שם נגיש (למשל של כפתור): "שם מלא, מספר אישי" */
export function buildTraineeAccessibleName(trainee: TraineeIdentity): string {
  return `${trainee.fullName}${TRAINEE_TEXTS.accessibleNameSeparator}${trainee.traineeCode}`;
}
