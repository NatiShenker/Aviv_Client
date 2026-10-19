import type { ReactNode } from "react";

interface DesktopPageProps {
  children: ReactNode;
}

/**
 * השורש של כל מסך בדסקטופ: כיוון RTL, רקע, וגובה המסך המלא.
 * הדף עצמו לא נגלל - כל מסך קובע איזה אזור בתוכו גולל (למשל רשימת הכרטיסים).
 * אין כאן אנימציית מעבר ואין הוקים של החלון, בניגוד למעטפת המובייל
 */
export default function DesktopPage({ children }: DesktopPageProps) {
  return (
    <main dir="rtl" lang="he" className="flex h-dvh flex-col gap-4 bg-background px-8 py-6 text-text-primary">
      {children}
    </main>
  );
}
