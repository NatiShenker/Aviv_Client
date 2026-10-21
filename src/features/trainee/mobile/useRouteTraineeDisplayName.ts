import { buildTraineeDisplayName } from "../traineeDisplay";
import { useRouteTrainee } from "./useRouteTrainee";

/**
 * "שם מלא | מספר אישי" של החניך שבנתיב - לשורת המשנה בכותרת ההיסטוריה והטופס, כדי שבפעולה רגישה
 * יראו על מי פועלים (ספק 00 §3.1). ריק עד שהחניך נטען, או כשהוא לא נמצא
 */
export function useRouteTraineeDisplayName(): string {
  const { trainee } = useRouteTrainee();
  return trainee.data ? buildTraineeDisplayName(trainee.data) : "";
}
