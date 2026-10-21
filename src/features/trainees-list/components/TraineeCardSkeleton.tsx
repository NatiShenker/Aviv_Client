// שלד בצורת כרטיס חניך, באותו מבנה כמו הכרטיס: תמונה, שם ומספר; ומתחת לקו - מיקום ודקות.
// בלי מקום לתגית - רוב החניכים בלי הגבלה, ולכן בלי תגית.
// ההבהוב פועל רק כשהמשתמש לא ביקש להפחית תנועה
export default function TraineeCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-card bg-paper p-4 motion-safe:animate-pulse">
      <div className="flex min-w-0 items-start gap-3">
        <div className="size-15 shrink-0 rounded-input bg-grey-100" />
        <div className="flex flex-1 flex-col gap-1.5 pt-1">
          <div className="h-4 w-2/3 rounded-sm bg-grey-100" />
          <div className="h-3 w-1/4 rounded-sm bg-grey-100" />
        </div>
      </div>
      <div className="mt-4 border-t border-grey-100" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="h-3 w-1/3 rounded-sm bg-grey-100" />
        <div className="h-3 w-1/5 rounded-sm bg-grey-100" />
      </div>
    </div>
  );
}
