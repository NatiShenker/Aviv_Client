import { useState, type ReactNode } from "react";
import DrawerHistoryLayout from "@/features/records/history/desktop/DrawerHistoryLayout";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import type { RestrictionFormTarget } from "../form/useRestrictionFormRoute";
import RestrictionCard from "../history/RestrictionCard";
import { useRestrictionsHistory } from "../history/useRestrictionsHistory";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";

const getRecordKey = (record: TraineeRestrictionRecordDto) => record.id;

interface RestrictionsDrawerHistoryProps {
  traineeId: number;
  /** חזרה ושם הפעולה, בתחילת השורה העליונה */
  navigation: ReactNode;
}

/** היסטוריית ההגבלות של החניך במגירה (ספק 03 history, פריסת דסקטופ) */
export default function RestrictionsDrawerHistory({ traineeId, navigation }: RestrictionsDrawerHistoryProps) {
  const { restrictions, history } = useRestrictionsHistory(traineeId);
  // הטופס שנפתח מעל ההיסטוריה. בזכרון בלבד, כמו כל המגירה
  const [, setFormTarget] = useState<RestrictionFormTarget | null>(null);

  const renderCard = (record: TraineeRestrictionRecordDto) => (
    <RestrictionCard
      record={record}
      isOpen={history.isRecordOpen(record.id)}
      onToggle={() => history.toggleRecord(record.id)}
      onEdit={() => setFormTarget({ mode: "edit", recordRef: record.id })}
      onCreateBasedOn={() => setFormTarget({ mode: "create", basedOnRef: record.id })}
    />
  );

  return (
    <DrawerHistoryLayout
      navigation={navigation}
      texts={TRAINEE_RESTRICTIONS_TEXTS}
      records={restrictions}
      history={history}
      getRecordKey={getRecordKey}
      renderCard={renderCard}
      onCreate={() => setFormTarget({ mode: "create", basedOnRef: null })}
    />
  );
}
