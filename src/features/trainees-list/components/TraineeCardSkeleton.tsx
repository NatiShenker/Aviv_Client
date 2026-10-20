// שלד בצורת כרטיס חניך, באותו מבנה כמו הכרטיס: תמונה, שם ומספר ותגית; ומתחת לקו - מיקום ודקות.
// ההבהוב פועל רק כשהמשתמש לא ביקש להפחית תנועה
export default function TraineeCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-card bg-paper p-4 motion-safe:animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="size-15 shrink-0 rounded-input bg-grey-100" />
          <div className="flex flex-1 flex-col gap-1.5 pt-1">
            <div className="h-4 w-2/3 rounded-sm bg-grey-100" />
            <div className="h-3 w-1/4 rounded-sm bg-grey-100" />
          </div>
        </div>
        <div className="h-6 w-14 shrink-0 rounded-full bg-grey-100" />
      </div>
      <div className="mt-4 border-t border-divider" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="h-3 w-1/3 rounded-sm bg-grey-100" />
        <div className="h-3 w-1/5 rounded-sm bg-grey-100" />
      </div>
    </div>
  );
}
