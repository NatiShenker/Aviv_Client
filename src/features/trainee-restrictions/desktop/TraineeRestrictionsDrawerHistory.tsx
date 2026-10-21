import { useState, type ReactNode } from "react";
import DrawerHistoryLayout from "@/features/records/desktop/DrawerHistoryLayout";
import DrawerFormHost from "@/shells/desktop/drawer/DrawerFormHost";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import type { TraineeRestrictionFormTarget } from "../form/useTraineeRestrictionFormSession";
import TraineeRestrictionCard from "../history/TraineeRestrictionCard";
import { traineeRestrictionRecordKey } from "../history/traineeRestrictionsLogic";
import { useTraineeRestrictionsHistory } from "../history/useTraineeRestrictionsHistory";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import TraineeRestrictionDrawerForm from "./TraineeRestrictionDrawerForm";

interface TraineeRestrictionsDrawerHistoryProps {
  traineeId: number;
  /** חזרה ושם הפעולה, בתחילת השורה העליונה */
  navigation: ReactNode;
  /** אחרי שמירה - למשל כדי שרשימת החניכים שמאחור תתעדכן */
  onRecordSaved: () => void;
}

/** היסטוריית ההגבלות של החניך במגירה, וטופס ההגבלה מעליה (ספק 03, פריסת דסקטופ) */
export default function TraineeRestrictionsDrawerHistory({ traineeId, navigation, onRecordSaved }: TraineeRestrictionsDrawerHistoryProps) {
  const { restrictions, history, resultsCountText } = useTraineeRestrictionsHistory(traineeId);
  // הטופס שנפתח מעל ההיסטוריה. בזכרון בלבד, כמו כל המגירה
  const [formTarget, setFormTarget] = useState<TraineeRestrictionFormTarget | null>(null);

  // אחרי שמירה: חזרה להיסטוריה, עם הרשומה שנשמרה פתוחה (ספק 00 §4.1)
  const handleSaved = (savedRecordId: number) => {
    setFormTarget(null);
    history.showSavedRecord(savedRecordId);
    onRecordSaved();
  };

  const renderCard = (record: TraineeRestrictionRecordDto) => (
    <TraineeRestrictionCard
      record={record}
      isOpen={history.isRecordOpen(record.id)}
      onToggle={() => history.toggleRecord(record.id)}
      onEdit={() => setFormTarget({ mode: "edit", recordRef: record.id })}
      onCreateBasedOn={() => setFormTarget({ mode: "create", basedOnRef: record.id })}
    />
  );

  const renderForm = (target: TraineeRestrictionFormTarget) => (
    <TraineeRestrictionDrawerForm
      target={target}
      traineeId={traineeId}
      restrictions={restrictions}
      onClose={() => setFormTarget(null)}
      onSaved={handleSaved}
    />
  );

  return (
    <DrawerFormHost formTarget={formTarget} renderForm={renderForm}>
      <DrawerHistoryLayout
        navigation={navigation}
        texts={TRAINEE_RESTRICTIONS_TEXTS}
        records={restrictions}
        history={history}
        resultsCountText={resultsCountText}
        getRecordKey={traineeRestrictionRecordKey}
        renderCard={renderCard}
        onCreate={() => setFormTarget({ mode: "create", basedOnRef: null })}
      />
    </DrawerFormHost>
  );
}
