import { Fragment, type ReactNode } from "react";
import { INSTITUTES_TEXTS } from "@/features/institutes/institutesTexts";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import SectionHeading, { useSectionHeadingLevel } from "@/shared/components/SectionHeading";
import { useInstitutes } from "@/store/institutesContext";
import { ACTION_ROW_CLASS } from "./ActionRow";
import { buildPermittedTraineeMenu, isTraineeMenuEmpty } from "./traineeActionsLogic";
import type { TraineeMenuItem } from "./traineeActionsOptions";
import { TRAINEE_ACTIONS_TEXTS } from "./traineeActionsTexts";

const TEXTS = TRAINEE_ACTIONS_TEXTS;

const SKELETON_ROW_KEYS = [1, 2, 3];

type RenderRowFrame = (row: ReactNode) => ReactNode;

// בלי עוטף - השורה כמו שהיא (במובייל השורות על רקע העמוד, בלי מסגרת)
const showRowAsIs: RenderRowFrame = (row) => row;

// במובייל המקטעים מוזחים מעט פנימה ביחס לקו המפריד (ספק 02: קו ב-16px, מקטעים ב-19px) - יישור אופטי מכוון:
// השורות מתיישרות לקצה הנראה של חץ החזרה שבכותרת העמוד, שהקו שלו כ-4px בתוך הריבוע שלו
const MOBILE_SECTION_INSET_CLASS = "px-1";

interface TraineeActionsMenuProps {
  /** השורה של כל פריט. כל פריסה קובעת מה השורה עושה (במובייל - קישור לעמוד של הפעולה) */
  renderItemRow: (item: TraineeMenuItem) => ReactNode;
  /** העוטף של כל שורה בשלד - אותה מסגרת כמו של השורות האמיתיות בפריסה */
  renderSkeletonRowFrame?: RenderRowFrame;
  /**
   * הזחת המקטעים. ברירת המחדל - של המובייל. במגירה בדסקטופ אין חץ חזרה במסך הפעולות, והתמונה בכותרת
   * יושבת על קו התוכן, ולכן שם בלי הזחה (הוחלט 2026-10-21)
   */
  sectionInsetClass?: string;
}

/**
 * מקטעי "פעולות" ו"מידע נוסף", לפי ההרשאות של המשתמש בפנימייה.
 * בלי ריווח בצדדים - הוא שייך למכולה של כל פריסה
 */
export default function TraineeActionsMenu({
  renderItemRow,
  renderSkeletonRowFrame = showRowAsIs,
  sectionInsetClass = MOBILE_SECTION_INSET_CLASS,
}: TraineeActionsMenuProps) {
  const { permissions } = useInstitutes();

  switch (permissions.status) {
    case "idle":
    case "loading":
      return <MenuSkeleton renderRowFrame={renderSkeletonRowFrame} insetClass={sectionInsetClass} />;
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
            <MenuSection
              title={TEXTS.sections.actions}
              items={menu.actionItems}
              renderItemRow={renderItemRow}
              insetClass={sectionInsetClass}
            />
          )}
          {hasActions && hasAdditionalInfo && <div className="mt-6 border-t border-divider" />}
          {hasAdditionalInfo && (
            <MenuSection
              title={TEXTS.sections.additionalInfo}
              items={menu.additionalInfoItems}
              renderItemRow={renderItemRow}
              insetClass={sectionInsetClass}
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
  renderItemRow: (item: TraineeMenuItem) => ReactNode;
  insetClass: string;
}

// כל כותרות המקטעים באותו משקל - בלי הדגשה של מקטע אחד (ספק 02 §3.3, הוחלט 2026-10-19).
// רמת הכותרת לפי המסגרת: במובייל h2 מתחת לכותרת העמוד, במגירה מתחת לשם החניך
function MenuSection({ title, items, renderItemRow, insetClass }: MenuSectionProps) {
  const headingLevel = useSectionHeadingLevel();

  return (
    <section className={`mt-7 ${insetClass}`}>
      <SectionHeading level={headingLevel} className="text-base">
        {title}
      </SectionHeading>
      <ul className="mt-4 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.key}>{renderItemRow(item)}</li>
        ))}
      </ul>
    </section>
  );
}

interface MenuSkeletonProps {
  renderRowFrame: RenderRowFrame;
  insetClass: string;
}

/**
 * שלד בצורת מקטע "פעולות", עד שההרשאות מגיעות: אותם גבהים כמו הכותרת והשורות האמיתיות (עם שורת ההסבר),
 * כדי שהמסך לא יקפוץ. ההבהוב פועל רק כשהמשתמש לא ביקש להפחית תנועה
 */
function MenuSkeleton({ renderRowFrame, insetClass }: MenuSkeletonProps) {
  return (
    <div role="status" className={`mt-7 ${insetClass}`}>
      <span className="sr-only">{TEXTS.states.loadingActions}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {/* בגובה שורת הכותרת (16/24) */}
        <div className="flex h-6 items-center">
          <div className="h-4 w-16 rounded-sm bg-grey-100" />
        </div>
        <div className="mt-4 flex flex-col gap-1">
          {SKELETON_ROW_KEYS.map((key) => (
            <Fragment key={key}>{renderRowFrame(<SkeletonActionRow />)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// כמו ActionRowContent: עיגול, ותווית (16/24) ומתחתיה שורת הסבר (12/16)
function SkeletonActionRow() {
  return (
    <div className={ACTION_ROW_CLASS}>
      <div className="size-9 shrink-0 rounded-full bg-grey-100" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-6 items-center">
          <div className="h-4 w-1/3 rounded-sm bg-grey-100" />
        </div>
        <div className="mt-0.5 flex h-4 items-center">
          <div className="h-3 w-2/3 rounded-sm bg-grey-100" />
        </div>
      </div>
    </div>
  );
}
