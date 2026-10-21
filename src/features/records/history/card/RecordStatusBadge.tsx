interface RecordStatusBadgeProps {
  isActive: boolean;
  /** "פעילה" (הגבלה, הודעה קולית) או "פעיל" (היתר) */
  activeLabel: string;
  /** "הסתיימה" (הגבלה, הודעה קולית) או "הסתיים" (היתר) - באותו מין כמו activeLabel */
  endedLabel: string;
}

// "הסתיימה" באפור כהה על רקע אפור: שקטה מ"פעילה", אבל קריאה (ניגודיות AA)
const TONE_CLASS = {
  active: "bg-success-soft text-success",
  ended: "bg-grey-100 text-text-secondary",
} as const;

/** תגית הסטטוס של רשומה בהיסטוריה: פעילה או הסתיימה (ספק 00 §3.18) */
export default function RecordStatusBadge({ isActive, activeLabel, endedLabel }: RecordStatusBadgeProps) {
  const toneClass = isActive ? TONE_CLASS.active : TONE_CLASS.ended;

  return (
    <span className={`flex h-5 shrink-0 items-center rounded-full px-2 text-xs ${toneClass}`}>
      {isActive ? activeLabel : endedLabel}
    </span>
  );
}
