import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import RecordHistoryLayout from "@/features/records/history/RecordHistoryLayout";
import { useRecordFormSlot } from "@/features/records/history/useRecordFormSlot";
import { ROUTES } from "@/routes";
import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import NumberRecordFormSheet from "../form/NumberRecordFormSheet";
import { useNumberRecordFormRoute } from "../form/useNumberRecordFormRoute";
import { buildNumberRecordKey, matchesNumberRecordRef } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import NumberRecordCard from "./NumberRecordCard";
import { useNumberRestrictionsHistory } from "./useNumberRestrictionsHistory";

interface NumberRestrictionsHistoryProps {
  traineeId: number;
  /** כותרת המסך. נעוצה יחד עם שורת הכלים, והרשימה נגללת מתחת לשתיהן */
  header: ReactNode;
}

/**
 * כל ההגבלות וההיתרים של החניך למספרים, כל רשומה בכרטיס נפרד, עם חיפוש ומיון (ספק 04 history),
 * וטופס ההגבלה / ההיתר מעליה (ספק 04 form).
 */
export default function NumberRestrictionsHistory({ traineeId, header }: NumberRestrictionsHistoryProps) {
  const navigate = useNavigate();
  const { phoneRecords, history } = useNumberRestrictionsHistory(traineeId);

  const renderCard = (record: TraineePhoneRecordDto) => {
    const recordKey = buildNumberRecordKey(record);
    return (
      <NumberRecordCard
        record={record}
        isOpen={history.isRecordOpen(recordKey)}
        onToggle={() => history.toggleRecord(recordKey)}
        onEdit={() => navigate(ROUTES.editNumberRecord(traineeId, recordKey))}
        onCreateBasedOn={() => navigate(ROUTES.newNumberRecord(traineeId, recordKey))}
      />
    );
  };

  return (
    <>
      <RecordHistoryLayout
        header={header}
        texts={NUMBER_RESTRICTIONS_TEXTS}
        records={phoneRecords}
        history={history}
        getRecordKey={buildNumberRecordKey}
        renderCard={renderCard}
        onCreate={() => navigate(ROUTES.newNumberRecord(traineeId))}
      />
      <NumberRecordFormSlot traineeId={traineeId} phoneRecords={phoneRecords} onSaved={history.showSavedRecord} />
    </>
  );
}

interface NumberRecordFormSlotProps {
  traineeId: number;
  phoneRecords: AsyncResource<TraineePhoneRecordDto[]>;
  onSaved: (savedRecordKey: string) => void;
}

// הטופס נשאר mounted לאורך כל המסך, כדי שייסגר באנימציה גם כשהכתובת חוזרת להיסטוריה
function NumberRecordFormSlot({ traineeId, phoneRecords, onSaved }: NumberRecordFormSlotProps) {
  const slot = useRecordFormSlot({
    formTarget: useNumberRecordFormRoute(),
    records: phoneRecords,
    matchesRecordRef: matchesNumberRecordRef,
    historyPath: ROUTES.numberRestrictions(traineeId),
    onSaved,
  });

  return (
    <NumberRecordFormSheet
      target={slot.openTarget}
      traineeId={traineeId}
      editRecord={slot.editRecord}
      basedOnRecord={slot.basedOnRecord}
      onClose={slot.close}
      onSaved={slot.saveAndClose}
    />
  );
}
