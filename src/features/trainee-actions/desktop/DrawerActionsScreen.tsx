import { FOCUS_RING_CLASS } from "@/shared/components/focusRing";
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
}

// שורה על משטח לבן מקבלת מסגרת (design.md). המסגרת על העוטף, כדי שהשורה תישאר זהה למובייל
const DRAWER_ROW_FRAME_CLASS = "rounded-card border border-divider";

/** מסך הפעולות במגירה: אותם מקטעים כמו במובייל (ספק 02), וכל פעולה פותחת מסך בתוך המגירה */
export default function DrawerActionsScreen({ onSelectAction }: DrawerActionsScreenProps) {
  return (
    <div className={`min-h-0 flex-1 pb-6 ${DRAWER_SCROLL_AREA_CLASS}`}>
      <TraineeActionsMenu
        renderItemRow={(item) => <DrawerActionRow item={item} onSelectAction={onSelectAction} />}
        renderSkeletonRowFrame={(skeletonRow) => <div className={DRAWER_ROW_FRAME_CLASS}>{skeletonRow}</div>}
      />
    </div>
  );
}

interface DrawerActionRowProps {
  item: TraineeMenuItem;
  onSelectAction: (actionKey: DrawerActionKey) => void;
}

function DrawerActionRow({ item, onSelectAction }: DrawerActionRowProps) {
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
        label={item.label}
        description={item.description}
        icon={item.icon}
        onClick={() => onSelectAction(actionKey)}
      />
    </div>
  );
}

interface ActionButtonRowProps extends ActionRowContentProps {
  onClick: () => void;
}

/** שורה שפותחת את המסך של הפעולה בתוך המגירה */
function ActionButtonRow({ label, description, icon, onClick }: ActionButtonRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${ACTION_ROW_CLASS} cursor-pointer text-start text-text-primary ${FOCUS_RING_CLASS}`}
    >
      <ActionRowContent label={label} description={description} icon={icon} />
    </button>
  );
}
