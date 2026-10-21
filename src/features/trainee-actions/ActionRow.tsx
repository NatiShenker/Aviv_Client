import AppIcon from "@/shared/components/AppIcon";
import type { AppIconName } from "@/shared/components/appIcons";

/*
 * שורה בתפריט החניך: אייקון בעיגול, תווית ושורת הסבר, וחץ (ספק 02 §3.2).
 * המראה משותף, ומה שהשורה עושה נקבע לפי הפריסה: במובייל קישור לעמוד של הפעולה (מסך הפעולות),
 * בדסקטופ מעבר למסך במגירה (DrawerActionsScreen).
 */

export interface ActionRowContentProps {
  label: string;
  /** שורת הסבר מתחת לתווית. בלעדיה - רק התווית */
  description?: string;
  icon: AppIconName;
}

// כרטיס על רקע העמוד: לבן ובלי מסגרת, בפינות של כרטיס (design.md).
// גובה מינימלי ולא קבוע, כדי ששורה עם הסבר תגדל
export const ACTION_ROW_CLASS = "flex min-h-15 w-full items-center gap-3 rounded-card bg-paper px-3 py-3";

/**
 * שורה של פעולה שאין לה עדיין יעד (OQ-08) - מוצגת מנוטרלת, בלי שורת הסבר.
 * role, כדי שקורא מסך יקריא אותה ככפתור שאינו זמין: aria-disabled לבדו לא חל על div בלי תפקיד
 */
export function DisabledActionRow({ label, icon }: ActionRowContentProps) {
  return (
    <div role="button" aria-disabled="true" className={`${ACTION_ROW_CLASS} text-text-disabled`}>
      <ActionRowContent label={label} icon={icon} />
    </div>
  );
}

/** התוכן של כל שורה: אייקון בעיגול, תווית ושורת הסבר, וחץ */
export function ActionRowContent({ label, description, icon }: ActionRowContentProps) {
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft">
        <AppIcon name={icon} />
      </span>
      {/* ההסבר כמו המספר מתחת לשם בכרטיס החניך */}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base">{label}</span>
        {description && <span className="mt-0.5 text-xs text-text-secondary">{description}</span>}
      </span>
      <AppIcon name="chevronLeft" className="shrink-0" />
    </>
  );
}
