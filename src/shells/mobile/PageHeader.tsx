import { IpsIconButton } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import { MOBILE_SHELL_TEXTS } from "./mobileShellTexts";
import { useNavigateBack } from "./navigation/useNavigateBack";

interface PageHeaderProps {
  /** ריק בזמן שהכותרת עוד נטענת (למשל שם החניך) */
  title: string;
  /** שורת משנה מתחת לכותרת (למשל החניך שעליו פועלים). ריקה - לא מוצגת */
  subtitle?: string;
}

/**
 * כותרת של מסך פנימי: חץ "חזרה" ושם המסך, עם קו תחתון (ספק 00 §3.1).
 * החץ מיושר לשורת הכותרת גם כשיש מתחתיה שורת משנה
 */
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const navigateBack = useNavigateBack();

  return (
    <header className="mx-4 flex items-start gap-2 border-b border-divider pb-1">
      <IpsIconButton
        edge="start"
        size="large"
        icon={<AppIcon name="back" />}
        aria-label={MOBILE_SHELL_TEXTS.navigation.back}
        onClick={navigateBack}
      />
      <div className="min-w-0 pt-2">
        <h1 className="truncate text-xl font-medium">{title}</h1>
        {subtitle && <p className="truncate text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </header>
  );
}
