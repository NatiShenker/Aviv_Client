import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import RecordHistoryLayout from "@/features/records/history/RecordHistoryLayout";
import { useRecordFormSlot } from "@/features/records/history/useRecordFormSlot";
import { useRecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import { ROUTES } from "@/routes";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import RestrictionFormSheet from "../form/RestrictionFormSheet";
import { useRestrictionFormRoute } from "../form/useRestrictionFormRoute";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import RestrictionCard from "./RestrictionCard";
import { filterAndSortRestrictions, restrictionCardDomId } from "./traineeRestrictionsLogic";
import { useTraineeRestrictionsData } from "./useTraineeRestrictionsData";

const getRecordKey = (record: TraineeRestrictionRecordDto) => record.id;

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
  const restrictions = useTraineeRestrictionsData(traineeId);
  const history = useRecordHistoryState({
    records: restrictions,
    filterAndSort: filterAndSortRestrictions,
    cardDomIdOf: restrictionCardDomId,
  });

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
        getRecordKey={getRecordKey}
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
    matchesRecordRef: (record, recordId) => record.id === recordId,
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
