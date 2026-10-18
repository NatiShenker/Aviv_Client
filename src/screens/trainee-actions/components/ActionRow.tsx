import { Link } from "react-router-dom";
import AppIcon from "@/shared/icons/AppIcon";
import type { AppIconName } from "@/shared/icons/appIcons";

interface ActionRowProps {
  label: string;
  icon: AppIconName;
  /** הכתובת שהשורה מובילה אליה. null = אין עדיין יעד, והשורה מוצגת מנוטרלת */
  to: string | null;
  /** שורות הפעולות עם מסגרת; שורות "מידע נוסף" בלי (ספק 02 §3.3) */
  bordered: boolean;
}

/** שורה בתפריט החניך: אייקון בעיגול, תווית וחץ (ספק 02 §3.2) */
export default function ActionRow({ label, icon, to, bordered }: ActionRowProps) {
  const borderClass = bordered ? "border border-divider" : "";
  const rowClass = `flex h-15 w-full items-center gap-3 rounded-base bg-paper px-3 ${borderClass}`;

  if (to === null) {
    return (
      <div aria-disabled="true" className={`${rowClass} text-text-disabled`}>
        <RowContent label={label} icon={icon} />
      </div>
    );
  }

  return (
    <Link to={to} className={`${rowClass} text-text-primary`}>
      <RowContent label={label} icon={icon} />
    </Link>
  );
}

function RowContent({ label, icon }: Pick<ActionRowProps, "label" | "icon">) {
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
