import { IpsIconButton } from "ui-library";
import AppIcon from "@/shared/icons/AppIcon";
import { NAVIGATION_TEXTS } from "@/shared/navigation/navigationTexts";
import { useNavigateBack } from "@/shared/navigation/useNavigateBack";

interface PageHeaderProps {
  /** ריק בזמן שהכותרת עוד נטענת (למשל שם החניך) */
  title: string;
}

/** כותרת של מסך פנימי: חץ "חזרה" ושם המסך, עם קו תחתון (ספק 00 §3.1) */
export default function PageHeader({ title }: PageHeaderProps) {
  const navigateBack = useNavigateBack();

  return (
    <header className="mx-4 flex items-center gap-2 border-b border-divider pb-1">
      <IpsIconButton
        edge="start"
        size="large"
        icon={<AppIcon name="back" />}
        aria-label={NAVIGATION_TEXTS.back}
        onClick={navigateBack}
      />
      <h1 className="min-w-0 truncate text-xl font-medium">{title}</h1>
    </header>
  );
}
