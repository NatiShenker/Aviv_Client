import { Link } from "react-router-dom";
import { useRouteTrainee } from "@/features/trainee/mobile/useRouteTrainee";
import { buildTraineeDisplayName } from "@/features/trainee/traineeDisplay";
import { TRAINEE_TEXTS } from "@/features/trainee/traineeTexts";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import AppPage from "@/shells/mobile/AppPage";
import { useScrollToTopOnOpen } from "@/shells/mobile/navigation/useScrollToTopOnOpen";
import PageHeader from "@/shells/mobile/PageHeader";
import { SCREEN_SIDE_GUTTER_CLASS, SCREEN_TOP_SPACING_CLASS } from "@/shells/mobile/screenSpacing";
import {
  ACTION_ROW_CLASS,
  ActionRowContent,
  DisabledActionRow,
  type ActionRowContentProps,
} from "../ActionRow";
import TraineeActionsMenu from "../TraineeActionsMenu";
import type { TraineeMenuItem } from "../traineeActionsOptions";
import { traineeActionPath } from "./traineeActionPaths";

/** מסך הפעולות של חניך: כניסה לפעולות ולמידע הנוסף, לפי ההרשאות (ספק 02) */
export default function TraineeActionsScreen() {
  useScrollToTopOnOpen();

  return (
    <AppPage className={`pb-10 ${SCREEN_TOP_SPACING_CLASS}`}>
      <TraineeActionsContent />
    </AppPage>
  );
}

// השם והמספר מגיעים מרשימת החניכים. עד שהם מגיעים (או אם הטעינה נכשלה) הכותרת ריקה והתפריט עובד (ספק 02 §7)
function TraineeActionsContent() {
  const { traineeId, trainee } = useRouteTrainee();
  const header = <PageHeader title={trainee.data ? buildTraineeDisplayName(trainee.data) : ""} />;

  // חניך שכבר לא ברשימת הפנימייה (הרשימה נטענת מחדש אחרי שינוי נתונים)
  if (traineeId === null || trainee.status === "empty") {
    return (
      <>
        {header}
        <ScreenStateMessage message={TRAINEE_TEXTS.notFound} />
      </>
    );
  }

  return (
    <>
      {header}
      <div className={SCREEN_SIDE_GUTTER_CLASS}>
        <TraineeActionsMenu renderItemRow={(item) => <MobileActionRow item={item} traineeId={traineeId} />} />
      </div>
    </>
  );
}

interface MobileActionRowProps {
  item: TraineeMenuItem;
  traineeId: number;
}

// במובייל כל פעולה היא עמוד בכתובת משלו
function MobileActionRow({ item, traineeId }: MobileActionRowProps) {
  const path = traineeActionPath(item.key, traineeId);
  if (path === null) {
    return <DisabledActionRow label={item.label} icon={item.icon} />;
  }
  return <ActionLinkRow label={item.label} icon={item.icon} to={path} />;
}

interface ActionLinkRowProps extends ActionRowContentProps {
  to: string;
}

/** שורה שמובילה לעמוד של הפעולה */
function ActionLinkRow({ label, icon, to }: ActionLinkRowProps) {
  return (
    <Link to={to} className={`${ACTION_ROW_CLASS} text-text-primary`}>
      <ActionRowContent label={label} icon={icon} />
    </Link>
  );
}
