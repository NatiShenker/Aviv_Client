import AppIcon from "@/shared/components/AppIcon";
import type { AppIconName } from "@/shared/components/appIcons";

/*
 * שורה בתפריט החניך: אייקון בעיגול, תווית וחץ (ספק 02 §3.2).
 * המראה משותף, ומה שהשורה עושה נקבע לפי הפריסה: במובייל קישור לעמוד של הפעולה (מסך הפעולות),
 * בדסקטופ מעבר למסך במגירה (DrawerActionsScreen).
 */

export interface ActionRowContentProps {
  label: string;
  icon: AppIconName;
}

// כרטיס על רקע העמוד: לבן ובלי מסגרת, בפינות של כרטיס (design.md)
export const ACTION_ROW_CLASS = "flex h-15 w-full items-center gap-3 rounded-card bg-paper px-3";

/** שורה של פעולה שאין לה עדיין יעד (OQ-08) - מוצגת מנוטרלת */
export function DisabledActionRow({ label, icon }: ActionRowContentProps) {
  return (
    <div aria-disabled="true" className={`${ACTION_ROW_CLASS} text-text-disabled`}>
      <ActionRowContent label={label} icon={icon} />
    </div>
  );
}

/** התוכן של כל שורה: אייקון בעיגול, תווית וחץ */
export function ActionRowContent({ label, icon }: ActionRowContentProps) {
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft">
        <AppIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1 text-base">{label}</span>
      <AppIcon name="chevronLeft" className="shrink-0" />
    </>
  );
}
