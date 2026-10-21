import SectionHeading, { useSubsectionHeadingLevel } from "../SectionHeading";

interface FieldIntroProps {
  title: string;
  /** שורה אחת. טקסט ארוך נחתך, והטקסט המלא מופיע ב-tooltip. בלי תיאור - רק הכותרת */
  description?: string;
  /** תיאור בגופן קטן יותר */
  isCompact?: boolean;
}

/** כותרת ושורת תיאור מעל קבוצת שדות (ספק 00 §3.3). הכותרת רמה אחת מתחת לבלוק שהיא בתוכו */
export default function FieldIntro({ title, description, isCompact = false }: FieldIntroProps) {
  const headingLevel = useSubsectionHeadingLevel();

  return (
    <div>
      <SectionHeading level={headingLevel} className="text-sm text-text-primary">
        {title}
      </SectionHeading>
      {description && (
        <p title={description} className={`truncate text-text-muted ${isCompact ? "text-xs" : "text-sm"}`}>
          {description}
        </p>
      )}
    </div>
  );
}
