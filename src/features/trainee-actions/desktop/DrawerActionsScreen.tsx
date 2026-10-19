import { DRAWER_SIDE_GUTTER_CLASS } from "@/shells/desktop/drawerSpacing";
import { ActionButtonRow, DisabledActionRow } from "../components/ActionRow";
import TraineeActionsMenu from "../components/TraineeActionsMenu";
import type { TraineeMenuItem } from "../traineeActionsOptions";
import { drawerActionKeyOf, type DrawerActionKey } from "./traineeDrawerScreens";

interface DrawerActionsScreenProps {
  onSelectAction: (actionKey: DrawerActionKey) => void;
}

/** מסך הפעולות במגירה: אותם מקטעים כמו במובייל (ספק 02), וכל פעולה פותחת מסך בתוך המגירה */
export default function DrawerActionsScreen({ onSelectAction }: DrawerActionsScreenProps) {
  return (
    <div className={`min-h-0 flex-1 overflow-y-auto pb-6 ${DRAWER_SIDE_GUTTER_CLASS}`}>
      <TraineeActionsMenu renderItemRow={(item) => <DrawerActionRow item={item} onSelectAction={onSelectAction} />} />
    </div>
  );
}

interface DrawerActionRowProps {
  item: TraineeMenuItem;
  onSelectAction: (actionKey: DrawerActionKey) => void;
}

// שורה על משטח לבן מקבלת מסגרת (design.md). המסגרת על העוטף, כדי שהשורה תישאר זהה למובייל
function DrawerActionRow({ item, onSelectAction }: DrawerActionRowProps) {
  const actionKey = drawerActionKeyOf(item.key);

  if (actionKey === null) {
    return (
      <div className="rounded-card border border-divider">
        <DisabledActionRow label={item.label} icon={item.icon} />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-divider transition-colors hover:border-border-strong">
      <ActionButtonRow label={item.label} icon={item.icon} onClick={() => onSelectAction(actionKey)} />
    </div>
  );
}
