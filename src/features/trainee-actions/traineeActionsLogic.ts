import { isPermitted } from "@/features/institutes/permissionsLogic";
import {
  ADDITIONAL_INFO_ITEMS,
  ADDITIONAL_INFO_PERMISSION_ID,
  TRAINEE_ACTION_ITEMS,
  type TraineeActionItem,
  type TraineeMenuItem,
} from "./traineeActionsOptions";

/** תפריט החניך לפי ההרשאות. אחיד לכל החניכים בפנימייה */
export interface PermittedTraineeMenu {
  actionItems: TraineeActionItem[];
  additionalInfoItems: TraineeMenuItem[];
}

export function buildPermittedTraineeMenu(permissionIds: number[]): PermittedTraineeMenu {
  return {
    actionItems: TRAINEE_ACTION_ITEMS.filter((item) => isPermitted(permissionIds, item.permissionId)),
    additionalInfoItems: isPermitted(permissionIds, ADDITIONAL_INFO_PERMISSION_ID) ? ADDITIONAL_INFO_ITEMS : [],
  };
}

export function isTraineeMenuEmpty(menu: PermittedTraineeMenu): boolean {
  return menu.actionItems.length === 0 && menu.additionalInfoItems.length === 0;
}
