import { buildTraineeDisplayName } from "@/features/trainee/traineeDisplay";
import { TRAINEE_TEXTS } from "@/features/trainee/traineeTexts";
import { useRouteTrainee } from "@/features/trainee/useRouteTrainee";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import AppPage from "@/shells/mobile/AppPage";
import { useScrollToTopOnOpen } from "@/shells/mobile/hooks/useScrollToTopOnOpen";
import PageHeader from "@/shells/mobile/PageHeader";
import { SCREEN_TOP_SPACING_CLASS } from "@/shells/mobile/screenSpacing";
import TraineeActionsMenu from "./components/TraineeActionsMenu";

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
      <TraineeActionsMenu traineeId={traineeId} />
    </>
  );
}
