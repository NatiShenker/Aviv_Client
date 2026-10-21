import { useEffect, useId, useState } from "react";
import { FOCUS_RING_CLASS } from "@/shared/components/focusRing";
import { SectionHeadingLevelProvider } from "@/shared/components/SectionHeading";
import { DRAWER_SCROLL_AREA_CLASS } from "@/shells/desktop/drawer/drawerSpacing";
import {
  ACTION_ROW_CLASS,
  ActionRowContent,
  DisabledActionRow,
  type ActionRowContentProps,
} from "../ActionRow";
import TraineeActionsMenu from "../TraineeActionsMenu";
import type { TraineeMenuItem } from "../traineeActionsOptions";
import { drawerActionKeyOf, type DrawerActionKey } from "./traineeDrawerScreens";

interface DrawerActionsScreenProps {
  onSelectAction: (actionKey: DrawerActionKey) => void;
  /** בחזרה ממסך של פעולה - השורה שלה מקבלת את הפוקוס, כדי שהמקלדת תמשיך מאותו מקום */
  focusActionKeyOnMount: DrawerActionKey | null;
}

// שורה על משטח לבן מקבלת מסגרת (design.md). המסגרת על העוטף, כדי שהשורה תישאר זהה למובייל
const DRAWER_ROW_FRAME_CLASS = "rounded-card border border-divider";

// במגירה המקטעים בלי הזחה: אין במסך הזה חץ חזרה להתיישר אליו, והתמונה בכותרת יושבת על קו התוכן
const NO_SECTION_INSET_CLASS = "";

// המקטעים יושבים ישר מתחת לשם החניך (h2) שבכותרת המגירה
const SECTION_HEADING_LEVEL = 3;

/** מסך הפעולות במגירה: אותם מקטעים כמו במובייל (ספק 02), וכל פעולה פותחת מסך בתוך המגירה */
export default function DrawerActionsScreen({ onSelectAction, focusActionKeyOnMount }: DrawerActionsScreenProps) {
  const rowIdPrefix = useId();
  const rowIdOf = (actionKey: DrawerActionKey) => `${rowIdPrefix}-${actionKey}`;
  // רק בעלייה: מסך שחוזרים אליו
  const [actionKeyToFocus] = useState(focusActionKeyOnMount);

  useEffect(() => {
    if (actionKeyToFocus === null) return;
    // בלי גלילה: המסך עדיין באמצע ההחלקה פנימה
    document.getElementById(`${rowIdPrefix}-${actionKeyToFocus}`)?.focus({ preventScroll: true });
  }, [actionKeyToFocus, rowIdPrefix]);

  return (
    <div className={`min-h-0 flex-1 pb-6 ${DRAWER_SCROLL_AREA_CLASS}`}>
      <SectionHeadingLevelProvider level={SECTION_HEADING_LEVEL}>
        <TraineeActionsMenu
          renderItemRow={(item) => (
            <DrawerActionRow item={item} rowIdOf={rowIdOf} onSelectAction={onSelectAction} />
          )}
          renderSkeletonRowFrame={(skeletonRow) => <div className={DRAWER_ROW_FRAME_CLASS}>{skeletonRow}</div>}
          sectionInsetClass={NO_SECTION_INSET_CLASS}
        />
      </SectionHeadingLevelProvider>
    </div>
  );
}

interface DrawerActionRowProps {
  item: TraineeMenuItem;
  rowIdOf: (actionKey: DrawerActionKey) => string;
  onSelectAction: (actionKey: DrawerActionKey) => void;
}

function DrawerActionRow({ item, rowIdOf, onSelectAction }: DrawerActionRowProps) {
  const actionKey = drawerActionKeyOf(item.key);

  if (actionKey === null) {
    return (
      <div className={DRAWER_ROW_FRAME_CLASS}>
        <DisabledActionRow label={item.label} icon={item.icon} />
      </div>
    );
  }

  return (
    <div className={`${DRAWER_ROW_FRAME_CLASS} transition-colors hover:border-border-strong`}>
      <ActionButtonRow
        id={rowIdOf(actionKey)}
        label={item.label}
        description={item.description}
        icon={item.icon}
        onClick={() => onSelectAction(actionKey)}
      />
    </div>
  );
}

interface ActionButtonRowProps extends ActionRowContentProps {
  id: string;
  onClick: () => void;
}

/** שורה שפותחת את המסך של הפעולה בתוך המגירה */
function ActionButtonRow({ id, label, description, icon, onClick }: ActionButtonRowProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`${ACTION_ROW_CLASS} cursor-pointer text-start text-text-primary ${FOCUS_RING_CLASS}`}
    >
      <ActionRowContent label={label} description={description} icon={icon} />
    </button>
  );
}
