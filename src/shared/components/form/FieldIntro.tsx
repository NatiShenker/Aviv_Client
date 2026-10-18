interface FieldIntroProps {
  title: string;
  /** שורה אחת. טקסט ארוך נחתך, והטקסט המלא מופיע ב-tooltip */
  description: string;
  /** תיאור בגופן קטן יותר */
  isCompact?: boolean;
}

/** כותרת ושורת תיאור מעל קבוצת שדות (ספק 00 §3.3) */
export default function FieldIntro({ title, description, isCompact = false }: FieldIntroProps) {
  return (
    <div>
      <h3 className="text-sm text-text-primary">{title}</h3>
      <p title={description} className={`truncate text-text-muted ${isCompact ? "text-xs" : "text-sm"}`}>
        {description}
      </p>
    </div>
  );
}
