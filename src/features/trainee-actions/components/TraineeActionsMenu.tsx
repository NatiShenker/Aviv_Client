import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import { INSTITUTES_TEXTS } from "@/features/institutes/institutesTexts";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import { buildPermittedTraineeMenu, isTraineeMenuEmpty } from "../traineeActionsLogic";
import type { TraineeMenuItem } from "../traineeActionsOptions";
import { TRAINEE_ACTIONS_TEXTS } from "../traineeActionsTexts";
import ActionRow from "./ActionRow";

const TEXTS = TRAINEE_ACTIONS_TEXTS;

const SKELETON_ROW_KEYS = [1, 2, 3];

interface TraineeActionsMenuProps {
  traineeId: number;
}

/** מקטעי "פעולות" ו"מידע נוסף", לפי ההרשאות של המשתמש בפנימייה */
export default function TraineeActionsMenu({ traineeId }: TraineeActionsMenuProps) {
  const { permissions } = useInstitutes();

  switch (permissions.status) {
    case "idle":
    case "loading":
      return <MenuSkeleton />;
    case "error":
      return (
        <ScreenStateMessage
          tone="error"
          message={INSTITUTES_TEXTS.permissionsLoadFailed}
          actionLabel={INSTITUTES_TEXTS.retry}
          onAction={permissions.reload}
        />
      );
    case "empty":
    case "success": {
      const menu = buildPermittedTraineeMenu(permissions.data ?? []);
      if (isTraineeMenuEmpty(menu)) {
        return <ScreenStateMessage message={TEXTS.states.noPermittedActions} />;
      }

      const hasActions = menu.actionItems.length > 0;
      const hasAdditionalInfo = menu.additionalInfoItems.length > 0;
      return (
        <>
          {hasActions && (
            <MenuSection title={TEXTS.sections.actions} items={menu.actionItems} traineeId={traineeId} />
          )}
          {hasActions && hasAdditionalInfo && <div className="mx-4 mt-6 border-t border-divider" />}
          {hasAdditionalInfo && (
            <MenuSection
              title={TEXTS.sections.additionalInfo}
              items={menu.additionalInfoItems}
              traineeId={traineeId}
              isTitleEmphasized
            />
          )}
        </>
      );
    }
  }
}

interface MenuSectionProps {
  title: string;
  items: TraineeMenuItem[];
  traineeId: number;
  /** כותרת "מידע נוסף" מודגשת (ספק 02 §3.3) */
  isTitleEmphasized?: boolean;
}

function MenuSection({ title, items, traineeId, isTitleEmphasized = false }: MenuSectionProps) {
  return (
    <section className="mt-7 px-5">
      <h2 className={`text-base ${isTitleEmphasized ? "font-medium" : ""}`}>{title}</h2>
      <ul className="mt-4 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.key}>
            <ActionRow
              label={item.label}
              icon={item.icon}
              to={item.buildPath ? item.buildPath(traineeId) : null}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

// שלד בצורת שורות התפריט, עד שההרשאות מגיעות. ההבהוב פועל רק כשהמשתמש לא ביקש להפחית תנועה
function MenuSkeleton() {
  return (
    <div role="status" className="mt-7 px-5">
      <span className="sr-only">{TEXTS.states.loadingActions}</span>
      <div aria-hidden="true" className="flex flex-col gap-1 motion-safe:animate-pulse">
        <div className="h-5 w-16 rounded-sm bg-grey-100" />
        <div className="mt-3 flex flex-col gap-1">
          {SKELETON_ROW_KEYS.map((key) => (
            <div key={key} className="h-15 rounded-card bg-paper" />
          ))}
        </div>
      </div>
    </div>
  );
}
