/** פרט אחד ברשומה פתוחה */
export interface DetailItem {
  key: string;
  label: string;
  value: string;
  /** תאריכים, שעות וטלפונים נקראים משמאל לימין */
  isLtr?: boolean;
  /** פרט שתופס את שתי העמודות (למשל פירוט) */
  isFullWidth?: boolean;
}

interface DetailGridProps {
  items: DetailItem[];
}

/** רשימת פרטים בשתי עמודות; הפרט הראשון בכל שורה מימין (ספק 00 §3.21) */
export default function DetailGrid({ items }: DetailGridProps) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
      {items.map((item) => (
        <div key={item.key} className={`min-w-0 ${item.isFullWidth ? "col-span-2" : ""}`}>
          <dt className="text-sm text-text-muted">{item.label}</dt>
          <dd className="mt-0.5 whitespace-pre-line break-words text-base text-text-primary">
            {item.isLtr ? <span dir="ltr">{item.value}</span> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
