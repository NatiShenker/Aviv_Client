import { PERMISSION_IDS, type PermissionId } from "@/features/institutes/permissionIds";
import { ROUTES } from "@/routes";
import type { AppIconName } from "@/shared/icons/appIcons";
import { TRAINEE_ACTIONS_TEXTS } from "./traineeActionsTexts";

const ITEM_TEXTS = TRAINEE_ACTIONS_TEXTS.items;

export interface TraineeMenuItem {
  key: string;
  label: string;
  icon: AppIconName;
  /** הכתובת שהשורה מובילה אליה, או null כשאין לה עדיין מסך (השורה מוצגת מנוטרלת) */
  buildPath: ((traineeId: number) => string) | null;
}

/** פעולה על החניך - לכל פעולה הרשאה משלה */
export interface TraineeActionItem extends TraineeMenuItem {
  permissionId: PermissionId;
}

// הסדר והאייקונים לפי ספק 02 §3.2
export const TRAINEE_ACTION_ITEMS: TraineeActionItem[] = [
  {
    key: "traineeRestriction",
    label: ITEM_TEXTS.traineeRestriction,
    icon: "traineeRestriction",
    permissionId: PERMISSION_IDS.traineeRestriction,
    buildPath: ROUTES.traineeRestrictions,
  },
  {
    key: "numberRestriction",
    label: ITEM_TEXTS.numberRestriction,
    icon: "numberRestriction",
    permissionId: PERMISSION_IDS.numberRestriction,
    buildPath: ROUTES.numberRestrictions,
  },
  {
    key: "voiceMessage",
    label: ITEM_TEXTS.voiceMessage,
    icon: "voiceMessage",
    permissionId: PERMISSION_IDS.voiceMessage,
    buildPath: ROUTES.voiceMessages,
  },
];

/** כל המקטע "מידע נוסף" דורש הרשאה כללית אחת */
export const ADDITIONAL_INFO_PERMISSION_ID = PERMISSION_IDS.additionalInfo;

export const ADDITIONAL_INFO_ITEMS: TraineeMenuItem[] = [
  {
    key: "minutesHistory",
    label: ITEM_TEXTS.minutesHistory,
    icon: "clock",
    // אין לשורה יעד מוגדר (OQ-08)
    buildPath: null,
  },
];
