import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IpsButton } from "ui-library";
import HistoryCardsList from "@/features/records/history/HistoryCardsList";
import {
  DEFAULT_HISTORY_SORT_OPTION,
  HISTORY_SORT_ROWS,
  findHistorySortOption,
} from "@/features/records/history/historySort";
import HistoryToolbar from "@/features/records/history/HistoryToolbar";
import { useHistoryFormTarget } from "@/features/records/history/useHistoryFormTarget";
import { useRevealSavedRecord } from "@/features/records/history/useRevealSavedRecord";
import { ROUTES } from "@/routes";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import AppIcon from "@/shared/icons/AppIcon";
import { useNavigateBack } from "@/shells/mobile/navigation/useNavigateBack";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import SortSheet from "@/shells/mobile/SortSheet";
import StickyActionBar from "@/shells/mobile/StickyActionBar";
import { useVoiceMessageFormRoute } from "../form/useVoiceMessageFormRoute";
import VoiceMessageFormSheet from "../form/VoiceMessageFormSheet";
import { filterAndSortVoiceMessages, voiceMessageCardDomId } from "../voiceMessagesLogic";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import { useVoiceMessagesData } from "./useVoiceMessagesData";
import VoiceMessageCard from "./VoiceMessageCard";

const TEXTS = VOICE_MESSAGES_TEXTS;

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_RECORDS: TraineeVoiceMessageRecordDto[] = [];

const getRecordKey = (record: TraineeVoiceMessageRecordDto) => record.id;

interface VoiceMessagesHistoryProps {
  traineeId: number;
  /** השם שמושמע בתוכן ההודעה */
  traineeFullName: string;
  /** כותרת המסך. נעוצה יחד עם שורת הכלים, והרשימה נגללת מתחת לשתיהן */
  header: ReactNode;
}

/**
 * כל ההודעות לנמען של החניך, כל מספר בכרטיס נפרד, עם חיפוש ומיון (ספק 05 history),
 * וטופס ההודעה מעליה (ספק 05 form).
 */
export default function VoiceMessagesHistory({ traineeId, traineeFullName, header }: VoiceMessagesHistoryProps) {
  const navigate = useNavigate();
  const voiceMessages = useVoiceMessagesData(traineeId);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState(DEFAULT_HISTORY_SORT_OPTION);
  const [isSortOpen, setIsSortOpen] = useState(false);
  // רק כרטיס אחד פתוח בכל רגע
  const [openRecordId, setOpenRecordId] = useState<number | null>(null);
  const revealSavedRecord = useRevealSavedRecord(voiceMessages.data);

  const records = voiceMessages.data ?? NO_RECORDS;
  const visibleRecords = useMemo(
    () => filterAndSortVoiceMessages(records, searchQuery, sort),
    [records, searchQuery, sort],
  );

  const toggleRecord = (recordId: number) => {
    setOpenRecordId((currentId) => (currentId === recordId ? null : recordId));
  };

  // אחרי שמירה: ההיסטוריה נטענת מחדש, וההודעה הראשונה שנשמרה פתוחה וגלויה (ספק 00 §4.1)
  const handleSaved = (savedRecordId: number) => {
    setOpenRecordId(savedRecordId);
    revealSavedRecord(voiceMessageCardDomId(savedRecordId));
    voiceMessages.reload();
  };

  const renderCard = (record: TraineeVoiceMessageRecordDto) => (
    <VoiceMessageCard
      record={record}
      isOpen={openRecordId === record.id}
      onToggle={() => toggleRecord(record.id)}
      onEdit={() => navigate(ROUTES.editVoiceMessage(traineeId, record.id))}
      onCreateBasedOn={() => navigate(ROUTES.newVoiceMessage(traineeId, record.id))}
    />
  );

  return (
    <>
      <PinnedPageTop>
        {header}
        <HistoryToolbar
          title={TEXTS.toolbar.sectionTitle}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchLabel={TEXTS.toolbar.searchLabel}
          searchPlaceholder={TEXTS.toolbar.searchPlaceholder}
          onSortClick={() => setIsSortOpen(true)}
          isDisabled={voiceMessages.status !== "success"}
        />
      </PinnedPageTop>

      <HistoryCardsList
        records={voiceMessages}
        visibleRecords={visibleRecords}
        getRecordKey={getRecordKey}
        renderCard={renderCard}
        texts={TEXTS.states}
      />

      <SortSheet
        open={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        rows={HISTORY_SORT_ROWS}
        selectedValue={sort.key}
        onChange={(key) => setSort(findHistorySortOption(key))}
      />

      <StickyActionBar>
        <IpsButton
          variant="contained"
          size="large"
          fullWidth
          endIcon={<AppIcon name="add" />}
          onClick={() => navigate(ROUTES.newVoiceMessage(traineeId))}
        >
          {TEXTS.newRecord}
        </IpsButton>
      </StickyActionBar>

      <VoiceMessageFormSlot
        traineeId={traineeId}
        traineeFullName={traineeFullName}
        voiceMessages={voiceMessages}
        onSaved={handleSaved}
      />
    </>
  );
}

interface VoiceMessageFormSlotProps {
  traineeId: number;
  traineeFullName: string;
  voiceMessages: AsyncResource<TraineeVoiceMessageRecordDto[]>;
  onSaved: (savedRecordId: number) => void;
}

// הטופס נשאר mounted לאורך כל המסך, כדי שייסגר באנימציה גם כשהכתובת חוזרת להיסטוריה
function VoiceMessageFormSlot({ traineeId, traineeFullName, voiceMessages, onSaved }: VoiceMessageFormSlotProps) {
  const closeForm = useNavigateBack();
  const { openTarget, editRecord, basedOnRecord } = useHistoryFormTarget({
    formTarget: useVoiceMessageFormRoute(),
    records: voiceMessages,
    matchesRecordRef: (record, recordId) => record.id === recordId,
    historyPath: ROUTES.voiceMessages(traineeId),
  });

  const handleSaved = (savedRecordId: number) => {
    onSaved(savedRecordId);
    closeForm();
  };

  return (
    <VoiceMessageFormSheet
      target={openTarget}
      traineeId={traineeId}
      traineeFullName={traineeFullName}
      editRecord={editRecord}
      basedOnRecord={basedOnRecord}
      onClose={closeForm}
      onSaved={handleSaved}
    />
  );
}
