import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  /** שורת הסבר מתחת לכותרת (למשל ההסבר על ההיתרים) */
  hint?: string;
  children: ReactNode;
}

/**
 * בלוק בטופס: כותרת ותוכן. הקו המפריד בין בלוקים בא מהעוטף (divide-y), כך שאין קו לפני הבלוק הראשון
 * (ספק 00 §3.2, §4.2).
 */
export default function FormSection({ title, hint, children }: FormSectionProps) {
  return (
    <section className="py-6">
      <h2 className="text-base">{title}</h2>
      {hint && <p className="mt-1 text-sm text-text-muted">{hint}</p>}
      <div className={hint ? "mt-2" : "mt-4"}>{children}</div>
    </section>
  );
}
