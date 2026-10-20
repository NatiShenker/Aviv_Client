import { ROUTES } from "@/config/routes";
import type { TraineeMenuItemKey } from "../traineeActionsOptions";

/** במובייל כל פעולה היא מסך בכתובת משלו. null = לפעולה אין עדיין מסך (OQ-08), והשורה מוצגת מנוטרלת */
const TRAINEE_ACTION_PATHS: Record<TraineeMenuItemKey, ((traineeId: number) => string) | null> = {
  traineeRestriction: ROUTES.traineeRestrictions,
  numberRestriction: ROUTES.numberRestrictions,
  voiceMessage: ROUTES.voiceMessages,
  minutesHistory: null,
};

/** הכתובת של הפעולה עבור החניך, או null כשלפעולה אין עדיין מסך */
export function traineeActionPath(actionKey: TraineeMenuItemKey, traineeId: number): string | null {
  const buildPath = TRAINEE_ACTION_PATHS[actionKey];
  return buildPath ? buildPath(traineeId) : null;
}
