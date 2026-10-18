const SKELETON_CARD_KEYS = [1, 2, 3];

interface HistorySkeletonProps {
  /** הטקסט שקורא מסך משמיע בזמן הטעינה */
  loadingLabel: string;
}

/** שלד בצורת כרטיסים סגורים, בזמן טעינת ההרשאות או הרשומות. ההבהוב פועל רק כשלא ביקשו להפחית תנועה */
export default function HistorySkeleton({ loadingLabel }: HistorySkeletonProps) {
  return (
    <div role="status" className="flex flex-col gap-2 px-4">
      <span className="sr-only">{loadingLabel}</span>
      {SKELETON_CARD_KEYS.map((key) => (
        <div
          key={key}
          aria-hidden="true"
          className="flex items-center gap-3 rounded-card bg-paper p-4 motion-safe:animate-pulse"
        >
          <div className="size-11 shrink-0 rounded-full bg-grey-100" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-1/2 rounded-sm bg-grey-100" />
            <div className="h-4 w-1/3 rounded-sm bg-grey-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
