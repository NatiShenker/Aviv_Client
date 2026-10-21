import { PERMISSION_IDS, type PermissionId } from "@/features/institutes/permissions";
import type { AppIconName } from "@/shared/components/appIcons";
import { TRAINEE_ACTIONS_TEXTS } from "./traineeActionsTexts";

const ITEM_TEXTS = TRAINEE_ACTIONS_TEXTS.items;
const DESCRIPTION_TEXTS = TRAINEE_ACTIONS_TEXTS.itemDescriptions;

export type TraineeMenuItemKey = "traineeRestriction" | "numberRestriction" | "voiceMessage" | "minutesHistory";

export interface TraineeMenuItem {
  key: TraineeMenuItemKey;
  label: string;
  /** שורת ההסבר במסך הפעולות. בתפריט ⋮ בדסקטופ - רק התווית */
  description?: string;
  icon: AppIconName;
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
    description: DESCRIPTION_TEXTS.traineeRestriction,
    icon: "traineeRestriction",
    permissionId: PERMISSION_IDS.traineeRestriction,
  },
  {
    key: "numberRestriction",
    label: ITEM_TEXTS.numberRestriction,
    description: DESCRIPTION_TEXTS.numberRestriction,
    icon: "numberRestriction",
    permissionId: PERMISSION_IDS.numberRestriction,
  },
  {
    key: "voiceMessage",
    label: ITEM_TEXTS.voiceMessage,
    description: DESCRIPTION_TEXTS.voiceMessage,
    icon: "voiceMessage",
    permissionId: PERMISSION_IDS.voiceMessage,
  },
];

/** כל המקטע "מידע נוסף" דורש הרשאה כללית אחת */
export const ADDITIONAL_INFO_PERMISSION_ID = PERMISSION_IDS.additionalInfo;

// ל"היסטוריית דקות" אין שורת הסבר (הוחלט 2026-10-21)
export const ADDITIONAL_INFO_ITEMS: TraineeMenuItem[] = [
  {
    key: "minutesHistory",
    label: ITEM_TEXTS.minutesHistory,
    icon: "clock",
  },
];
