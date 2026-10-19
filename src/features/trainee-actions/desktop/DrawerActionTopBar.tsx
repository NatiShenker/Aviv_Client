import { IpsIconButton, IpsSelect } from "ui-library";
import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import AppIcon from "@/shared/icons/AppIcon";
import { CONTEXT_SELECT_SX } from "@/shells/desktop/contextSelectSx";
import { DRAWER_SIDE_GUTTER_CLASS } from "@/shells/desktop/drawerSpacing";
import { buildPermittedTraineeMenu } from "../traineeActionsLogic";
import { TRAINEE_ACTIONS_TEXTS } from "../traineeActionsTexts";
import { drawerActionKeyOf, type DrawerActionKey } from "./traineeDrawerScreens";

const TEXTS = TRAINEE_ACTIONS_TEXTS;

interface DrawerActionTopBarProps {
  actionKey: DrawerActionKey;
  onBack: () => void;
  onSwitchAction: (actionKey: DrawerActionKey) => void;
}

/** השורה העליונה של מסך פעולה במגירה: חזרה למסך הפעולות, והפעולה הנוכחית - עם מעבר לפעולה אחרת */
export default function DrawerActionTopBar({ actionKey, onBack, onSwitchAction }: DrawerActionTopBarProps) {
  return (
    <div className={`flex shrink-0 items-center gap-2 py-2 ${DRAWER_SIDE_GUTTER_CLASS}`}>
      <IpsIconButton edge="start" icon={<AppIcon name="back" />} aria-label={TEXTS.drawer.backToActions} onClick={onBack} />
      <ActionSwitcher actionKey={actionKey} onSwitchAction={onSwitchAction} />
    </div>
  );
}

interface ActionSwitcherProps {
  actionKey: DrawerActionKey;
  onSwitchAction: (actionKey: DrawerActionKey) => void;
}

/**
 * הפעולה הנוכחית, כבורר בסגנון בורר הפנימייה (טקסט וחץ, בלי מסגרת) עם הפעולות המותרות בלבד.
 * כשאין לאן לעבור (פעולה מותרת אחת) - כותרת רגילה
 */
function ActionSwitcher({ actionKey, onSwitchAction }: ActionSwitcherProps) {
  const { permissions } = useInstitutes();
  const permittedActions = buildPermittedTraineeMenu(permissions.data ?? []).actionItems;
  const canSwitch = permittedActions.length > 1 && permittedActions.some((item) => item.key === actionKey);

  if (!canSwitch) {
    return <h2 className="min-w-0 truncate text-lg font-medium">{TEXTS.items[actionKey]}</h2>;
  }

  const handleChange = (selectedValue: unknown) => {
    const selectedItem = permittedActions.find((item) => item.key === selectedValue);
    const selectedActionKey = selectedItem ? drawerActionKeyOf(selectedItem.key) : null;
    if (selectedActionKey !== null && selectedActionKey !== actionKey) {
      onSwitchAction(selectedActionKey);
    }
  };

  return (
    // הבורר יורש את הגופן והצבע מהעוטף
    <div className="min-w-0 text-lg font-medium text-text-primary">
      <IpsSelect
        // aria-label חייב לעבור דרך inputProps: ברמה העליונה הוא נוחת על העוטף ולא על הפקד
        inputProps={{ "aria-label": TEXTS.drawer.switchAction }}
        options={permittedActions.map((item) => ({ value: item.key, label: item.label }))}
        value={actionKey}
        onChange={handleChange}
        sx={CONTEXT_SELECT_SX}
      />
    </div>
  );
}
