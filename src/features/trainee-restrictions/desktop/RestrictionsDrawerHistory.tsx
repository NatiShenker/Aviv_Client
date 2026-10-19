import { useState, type ReactNode } from "react";
import DrawerHistoryLayout from "@/features/records/history/desktop/DrawerHistoryLayout";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import DrawerFormHost from "@/shells/desktop/DrawerFormHost";
import type { RestrictionFormTarget } from "../form/useRestrictionFormRoute";
import RestrictionCard from "../history/RestrictionCard";
import { useRestrictionsHistory } from "../history/useRestrictionsHistory";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import RestrictionDrawerForm from "./RestrictionDrawerForm";

const getRecordKey = (record: TraineeRestrictionRecordDto) => record.id;

interface RestrictionsDrawerHistoryProps {
  traineeId: number;
  /** חזרה ושם הפעולה, בתחילת השורה העליונה */
  navigation: ReactNode;
  /** אחרי שמירה - למשל כדי שרשימת החניכים שמאחור תתעדכן */
  onRecordSaved: () => void;
}

/** היסטוריית ההגבלות של החניך במגירה, וטופס ההגבלה מעליה (ספק 03, פריסת דסקטופ) */
export default function RestrictionsDrawerHistory({ traineeId, navigation, onRecordSaved }: RestrictionsDrawerHistoryProps) {
  const { restrictions, history } = useRestrictionsHistory(traineeId);
  // הטופס שנפתח מעל ההיסטוריה. בזכרון בלבד, כמו כל המגירה
  const [formTarget, setFormTarget] = useState<RestrictionFormTarget | null>(null);

  // אחרי שמירה: חזרה להיסטוריה, עם הרשומה שנשמרה פתוחה (ספק 00 §4.1)
  const handleSaved = (savedRecordId: number) => {
    setFormTarget(null);
    history.showSavedRecord(savedRecordId);
    onRecordSaved();
  };

  const renderCard = (record: TraineeRestrictionRecordDto) => (
    <RestrictionCard
      record={record}
      isOpen={history.isRecordOpen(record.id)}
      onToggle={() => history.toggleRecord(record.id)}
      onEdit={() => setFormTarget({ mode: "edit", recordRef: record.id })}
      onCreateBasedOn={() => setFormTarget({ mode: "create", basedOnRef: record.id })}
    />
  );

  const renderForm = (target: RestrictionFormTarget) => (
    <RestrictionDrawerForm
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
        getRecordKey={getRecordKey}
        renderCard={renderCard}
        onCreate={() => setFormTarget({ mode: "create", basedOnRef: null })}
      />
    </DrawerFormHost>
  );
}
