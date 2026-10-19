// שלד בצורת כרטיס חניך. ההבהוב פועל רק כשהמשתמש לא ביקש להפחית תנועה
export default function TraineeCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-card bg-paper p-4 motion-safe:animate-pulse">
      <div className="flex items-start gap-3">
        <div className="size-15 shrink-0 rounded-input bg-grey-100" />
        <div className="flex-1 pt-1">
          <div className="h-4 w-2/3 rounded-sm bg-grey-100" />
        </div>
      </div>
      <div className="mt-4 border-t border-divider" />
      <div className="mt-2 h-3 w-1/2 rounded-sm bg-grey-100" />
    </div>
  );
}
