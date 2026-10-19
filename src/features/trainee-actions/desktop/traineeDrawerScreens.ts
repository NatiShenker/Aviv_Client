import type { TraineeMenuItemKey } from "../traineeActionsOptions";

/** פעולה שיש לה מסך משלה במגירה (ההיסטוריה שלה) */
export type DrawerActionKey = "traineeRestriction" | "numberRestriction" | "voiceMessage";

/** המסך שמוצג במגירת החניך. המצב בזכרון בלבד - הכתובת לא משתנה (החלטת שלב 2 בדסקטופ) */
export type TraineeDrawerScreen = { name: "actions" } | { name: "history"; actionKey: DrawerActionKey };

export const ACTIONS_SCREEN: TraineeDrawerScreen = { name: "actions" };

/** מזהה יציב לכל מסך במגירה - המסך שיוצא במעבר נשאר אותו מופע עד סוף היציאה */
export function drawerScreenKeyOf(screen: TraineeDrawerScreen): string {
  return screen.name === "actions" ? "actions" : `history-${screen.actionKey}`;
}

// בדסקטופ כל פעולה היא מסך בתוך המגירה. null = לפריט אין עדיין מסך (OQ-08), והשורה מוצגת מנוטרלת
const DRAWER_ACTION_KEYS: Record<TraineeMenuItemKey, DrawerActionKey | null> = {
  traineeRestriction: "traineeRestriction",
  numberRestriction: "numberRestriction",
  voiceMessage: "voiceMessage",
  minutesHistory: null,
};

/** המסך של פריט בתפריט החניך, או null כשלפריט אין עדיין מסך */
export function drawerActionKeyOf(itemKey: TraineeMenuItemKey): DrawerActionKey | null {
  return DRAWER_ACTION_KEYS[itemKey];
}
