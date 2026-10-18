import AppPage from "@/shared/components/AppPage";
import PageHeader from "@/shared/components/PageHeader";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import { useScrollToTopOnOpen } from "@/shared/hooks/useScrollToTopOnOpen";
import { buildTraineeDisplayName } from "@/shared/trainee/traineeDisplay";
import { TRAINEE_TEXTS } from "@/shared/trainee/traineeTexts";
import { useRouteTrainee } from "@/shared/trainee/useRouteTrainee";
import TraineeActionsMenu from "./components/TraineeActionsMenu";

/** מסך הפעולות של חניך: כניסה לפעולות ולמידע הנוסף, לפי ההרשאות (ספק 02) */
export default function TraineeActionsScreen() {
  useScrollToTopOnOpen();

  return (
    <AppPage className="pb-10 pt-12">
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
