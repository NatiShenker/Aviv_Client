import { useState, type ReactNode } from "react";
import DrawerHistoryLayout from "@/features/records/desktop/DrawerHistoryLayout";
import DrawerFormHost from "@/shells/desktop/drawer/DrawerFormHost";
import type { TraineePhoneRecordDto } from "@/types/phone-exceptions.schema";
import type { NumberRecordFormTarget } from "../form/useNumberRecordFormSession";
import NumberRecordCard from "../history/NumberRecordCard";
import { useNumberRestrictionsHistory } from "../history/useNumberRestrictionsHistory";
import { buildNumberRecordKey, numberRecordRefOf } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import NumberRecordDrawerForm from "./NumberRecordDrawerForm";

interface NumberRestrictionsDrawerHistoryProps {
  traineeId: number;
  /** חזרה ושם הפעולה, בתחילת השורה העליונה */
  navigation: ReactNode;
  /** אחרי שמירה - למשל כדי שרשימת החניכים שמאחור תתעדכן */
  onRecordSaved: () => void;
}

/** ההגבלות וההיתרים של החניך למספרים במגירה, וטופס ההגבלה / ההיתר מעליה (ספק 04, פריסת דסקטופ) */
export default function NumberRestrictionsDrawerHistory({
  traineeId,
  navigation,
  onRecordSaved,
}: NumberRestrictionsDrawerHistoryProps) {
  const { phoneRecords, history, resultsCountText } = useNumberRestrictionsHistory(traineeId);
  // הטופס שנפתח מעל ההיסטוריה. בזכרון בלבד, כמו כל המגירה
  const [formTarget, setFormTarget] = useState<NumberRecordFormTarget | null>(null);

  // אחרי שמירה: חזרה להיסטוריה, עם הרשומה הראשונה שנשמרה פתוחה (ספק 04 history §2)
  const handleSaved = (savedRecordKey: string) => {
    setFormTarget(null);
    history.showSavedRecord(savedRecordKey);
    onRecordSaved();
  };

  const renderCard = (record: TraineePhoneRecordDto) => {
    const recordKey = buildNumberRecordKey(record);
    return (
      <NumberRecordCard
        record={record}
        isOpen={history.isRecordOpen(recordKey)}
        onToggle={() => history.toggleRecord(recordKey)}
        onEdit={() => setFormTarget({ mode: "edit", recordRef: numberRecordRefOf(record) })}
        onCreateBasedOn={() => setFormTarget({ mode: "create", basedOnRef: numberRecordRefOf(record) })}
      />
    );
  };

  const renderForm = (target: NumberRecordFormTarget) => (
    <NumberRecordDrawerForm
      target={target}
      traineeId={traineeId}
      phoneRecords={phoneRecords}
      onClose={() => setFormTarget(null)}
      onSaved={handleSaved}
    />
  );

  return (
    <DrawerFormHost formTarget={formTarget} renderForm={renderForm}>
      <DrawerHistoryLayout
        navigation={navigation}
        texts={NUMBER_RESTRICTIONS_TEXTS}
        records={phoneRecords}
        history={history}
        resultsCountText={resultsCountText}
        getRecordKey={buildNumberRecordKey}
        renderCard={renderCard}
        onCreate={() => setFormTarget({ mode: "create", basedOnRef: null })}
      />
    </DrawerFormHost>
  );
}
