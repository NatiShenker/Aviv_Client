import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATTERNS, ROUTES, parseRouteId } from "@/config/routes";
import RecordHistoryLayout from "@/features/records/mobile/RecordHistoryLayout";
import { useRecordFormRoute } from "@/features/records/mobile/useRecordFormRoute";
import { useRecordFormSlot } from "@/features/records/mobile/useRecordFormSlot";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import type { RestrictionFormTarget } from "../form/useRestrictionFormSession";
import RestrictionCard from "../history/RestrictionCard";
import { matchesRestrictionId, restrictionRecordKey } from "../history/traineeRestrictionsLogic";
import { useRestrictionsHistory } from "../history/useRestrictionsHistory";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import RestrictionFormSheet from "./RestrictionFormSheet";

interface RestrictionsHistoryProps {
  traineeId: number;
  /** כותרת המסך. נעוצה יחד עם שורת הכלים, והרשימה נגללת מתחת לשתיהן */
  header: ReactNode;
}

/**
 * רשימת ההגבלות של החניך עם חיפוש, מיון וכרטיסים נפתחים, וכפתור "הגבלה חדשה" (ספק 03 history),
 * וטופס ההגבלה מעליה (ספק 03 form).
 */
export default function RestrictionsHistory({ traineeId, header }: RestrictionsHistoryProps) {
  const navigate = useNavigate();
  const { restrictions, history } = useRestrictionsHistory(traineeId);

  const renderCard = (record: TraineeRestrictionRecordDto) => (
    <RestrictionCard
      record={record}
      isOpen={history.isRecordOpen(record.id)}
      onToggle={() => history.toggleRecord(record.id)}
      onEdit={() => navigate(ROUTES.editTraineeRestriction(traineeId, record.id))}
      onCreateBasedOn={() => navigate(ROUTES.newTraineeRestriction(traineeId, record.id))}
    />
  );

  return (
    <>
      <RecordHistoryLayout
        header={header}
        texts={TRAINEE_RESTRICTIONS_TEXTS}
        records={restrictions}
        history={history}
        getRecordKey={restrictionRecordKey}
        renderCard={renderCard}
        onCreate={() => navigate(ROUTES.newTraineeRestriction(traineeId))}
      />
      <RestrictionFormSlot traineeId={traineeId} restrictions={restrictions} onSaved={history.showSavedRecord} />
    </>
  );
}

interface RestrictionFormSlotProps {
  traineeId: number;
  restrictions: AsyncResource<TraineeRestrictionRecordDto[]>;
  onSaved: (savedRecordId: number) => void;
}

// הטופס נשאר mounted לאורך כל המסך, כדי שייסגר באנימציה גם כשהכתובת חוזרת להיסטוריה
function RestrictionFormSlot({ traineeId, restrictions, onSaved }: RestrictionFormSlotProps) {
  const slot = useRecordFormSlot({
    formTarget: useRestrictionFormRoute(),
    records: restrictions,
    matchesRecordRef: matchesRestrictionId,
    historyPath: ROUTES.traineeRestrictions(traineeId),
    onSaved,
  });

  return (
    <RestrictionFormSheet
      target={slot.openTarget}
      traineeId={traineeId}
      editRecord={slot.editRecord}
      basedOnRecord={slot.basedOnRecord}
      onClose={slot.close}
      onSaved={slot.saveAndClose}
    />
  );
}

/** הטופס שהכתובת מבקשת לפתוח. null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
function useRestrictionFormRoute(): RestrictionFormTarget | null {
  return useRecordFormRoute({
    createPattern: ROUTE_PATTERNS.newTraineeRestriction,
    editPattern: ROUTE_PATTERNS.editTraineeRestriction,
    recordParam: "recordId",
    parseRecordRef: parseRouteId,
  });
}
