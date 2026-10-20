import type { ReactNode } from "react";
import { INSTITUTES_TEXTS } from "@/features/institutes/institutesTexts";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import { useInstitutes } from "@/store/institutesContext";
import { buildPermittedTraineeMenu, isTraineeMenuEmpty } from "./traineeActionsLogic";
import type { TraineeMenuItem } from "./traineeActionsOptions";
import { TRAINEE_ACTIONS_TEXTS } from "./traineeActionsTexts";

const TEXTS = TRAINEE_ACTIONS_TEXTS;

const SKELETON_ROW_KEYS = [1, 2, 3];

interface TraineeActionsMenuProps {
  /** השורה של כל פריט. כל פריסה קובעת מה השורה עושה (במובייל - קישור לעמוד של הפעולה) */
  renderItemRow: (item: TraineeMenuItem) => ReactNode;
}

/**
 * מקטעי "פעולות" ו"מידע נוסף", לפי ההרשאות של המשתמש בפנימייה.
 * בלי ריווח בצדדים - הוא שייך למכולה של כל פריסה
 */
export default function TraineeActionsMenu({ renderItemRow }: TraineeActionsMenuProps) {
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
            <MenuSection title={TEXTS.sections.actions} items={menu.actionItems} renderItemRow={renderItemRow} />
          )}
          {hasActions && hasAdditionalInfo && <div className="mt-6 border-t border-divider" />}
          {hasAdditionalInfo && (
            <MenuSection
              title={TEXTS.sections.additionalInfo}
              items={menu.additionalInfoItems}
              renderItemRow={renderItemRow}
            />
          )}
        </>
      );
    }
  }
}

// המקטעים מוזחים מעט פנימה ביחס לקו המפריד (ספק 02: קו ב-16px, מקטעים ב-19px)
const SECTION_INSET_CLASS = "px-1";

interface MenuSectionProps {
  title: string;
  items: TraineeMenuItem[];
  renderItemRow: (item: TraineeMenuItem) => ReactNode;
}

// כל כותרות המקטעים באותו משקל - בלי הדגשה של מקטע אחד (ספק 02 §3.3, הוחלט 2026-10-19)
function MenuSection({ title, items, renderItemRow }: MenuSectionProps) {
  return (
    <section className={`mt-7 ${SECTION_INSET_CLASS}`}>
      <h2 className="text-base">{title}</h2>
      <ul className="mt-4 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.key}>{renderItemRow(item)}</li>
        ))}
      </ul>
    </section>
  );
}

// שלד בצורת שורות התפריט, עד שההרשאות מגיעות. ההבהוב פועל רק כשהמשתמש לא ביקש להפחית תנועה
function MenuSkeleton() {
  return (
    <div role="status" className={`mt-7 ${SECTION_INSET_CLASS}`}>
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
