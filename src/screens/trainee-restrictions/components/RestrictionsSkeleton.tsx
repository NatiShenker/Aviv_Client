import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";

const SKELETON_CARD_KEYS = [1, 2, 3];

/** שלד בצורת כרטיסים סגורים, בזמן טעינת ההרשאות או ההגבלות. ההבהוב פועל רק כשלא ביקשו להפחית תנועה */
export default function RestrictionsSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-2 px-4">
      <span className="sr-only">{TRAINEE_RESTRICTIONS_TEXTS.states.loading}</span>
      {SKELETON_CARD_KEYS.map((key) => (
        <div
          key={key}
          aria-hidden="true"
          className="flex items-center gap-3 rounded-base bg-paper p-4 motion-safe:animate-pulse"
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
