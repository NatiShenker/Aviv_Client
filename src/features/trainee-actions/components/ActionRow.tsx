import { Link } from "react-router-dom";
import AppIcon from "@/shared/icons/AppIcon";
import type { AppIconName } from "@/shared/icons/appIcons";

interface ActionRowContentProps {
  label: string;
  icon: AppIconName;
}

interface ActionLinkRowProps extends ActionRowContentProps {
  to: string;
}

interface ActionButtonRowProps extends ActionRowContentProps {
  onClick: () => void;
}

// כרטיס על רקע העמוד: לבן ובלי מסגרת, בפינות של כרטיס (design.md)
const ROW_CLASS = "flex h-15 w-full items-center gap-3 rounded-card bg-paper px-3";

/*
 * שורה בתפריט החניך: אייקון בעיגול, תווית וחץ (ספק 02 §3.2).
 * המראה משותף, ומה שהשורה עושה נקבע לפי הפריסה: במובייל קישור לעמוד של הפעולה, בדסקטופ מעבר למסך במגירה.
 */

/** שורה שמובילה לעמוד של הפעולה (מובייל) */
export function ActionLinkRow({ label, icon, to }: ActionLinkRowProps) {
  return (
    <Link to={to} className={`${ROW_CLASS} text-text-primary`}>
      <RowContent label={label} icon={icon} />
    </Link>
  );
}

/** שורה שפותחת את המסך של הפעולה בתוך המגירה (דסקטופ) */
export function ActionButtonRow({ label, icon, onClick }: ActionButtonRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${ROW_CLASS} cursor-pointer text-start text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
    >
      <RowContent label={label} icon={icon} />
    </button>
  );
}

/** שורה של פעולה שאין לה עדיין יעד (OQ-08) - מוצגת מנוטרלת */
export function DisabledActionRow({ label, icon }: ActionRowContentProps) {
  return (
    <div aria-disabled="true" className={`${ROW_CLASS} text-text-disabled`}>
      <RowContent label={label} icon={icon} />
    </div>
  );
}

function RowContent({ label, icon }: ActionRowContentProps) {
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
