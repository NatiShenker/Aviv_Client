import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import { TRAINEE_TEXTS } from "./traineeTexts";

/** השם המוצג: "שם מלא | מספר אישי" - בכרטיס ברשימת החניכים ובכותרת מסך הפעולות */
export function buildTraineeDisplayName(trainee: Pick<TraineeListItemDto, "fullName" | "traineeCode">): string {
  return `${trainee.fullName}${TRAINEE_TEXTS.nameSeparator}${trainee.traineeCode}`;
}
