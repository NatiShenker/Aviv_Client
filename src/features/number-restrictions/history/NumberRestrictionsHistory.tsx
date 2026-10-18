import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IpsButton } from "ui-library";
import HistoryCardsList from "@/features/records/history/HistoryCardsList";
import {
  DEFAULT_HISTORY_SORT_OPTION,
  HISTORY_SORT_ROWS,
  findHistorySortOption,
} from "@/features/records/history/historySort";
import HistorySortDrawer from "@/features/records/history/HistorySortDrawer";
import HistoryToolbar from "@/features/records/history/HistoryToolbar";
import { useHistoryFormTarget } from "@/features/records/history/useHistoryFormTarget";
import { useRevealSavedRecord } from "@/features/records/history/useRevealSavedRecord";
import { ROUTES } from "@/routes";
import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import AppIcon from "@/shared/icons/AppIcon";
import { useNavigateBack } from "@/shells/mobile/navigation/useNavigateBack";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import StickyActionBar from "@/shells/mobile/StickyActionBar";
import NumberRecordFormSheet from "../form/NumberRecordFormSheet";
import { useNumberRecordFormRoute } from "../form/useNumberRecordFormRoute";
import {
  buildNumberRecordKey,
  filterAndSortNumberRecords,
  matchesNumberRecordRef,
  numberRecordCardDomId,
} from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import NumberRecordCard from "./NumberRecordCard";
import { useNumberRestrictionsData } from "./useNumberRestrictionsData";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS;

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_RECORDS: TraineePhoneRecordDto[] = [];

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
  const phoneRecords = useNumberRestrictionsData(traineeId);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState(DEFAULT_HISTORY_SORT_OPTION);
  const [isSortOpen, setIsSortOpen] = useState(false);
  // רק כרטיס אחד פתוח בכל רגע
  const [openRecordKey, setOpenRecordKey] = useState<string | null>(null);
  const revealSavedRecord = useRevealSavedRecord(phoneRecords.data);

  const records = phoneRecords.data ?? NO_RECORDS;
  const visibleRecords = useMemo(
    () => filterAndSortNumberRecords(records, searchQuery, sort),
    [records, searchQuery, sort],
  );

  const toggleRecord = (recordKey: string) => {
    setOpenRecordKey((currentKey) => (currentKey === recordKey ? null : recordKey));
  };

  // אחרי שמירה: ההיסטוריה נטענת מחדש, והרשומה הראשונה שנשמרה פתוחה וגלויה (ספק 00 §4.1)
  const handleSaved = (savedRecordKey: string) => {
    setOpenRecordKey(savedRecordKey);
    revealSavedRecord(numberRecordCardDomId(savedRecordKey));
    phoneRecords.reload();
  };

  const renderCard = (record: TraineePhoneRecordDto) => {
    const recordKey = buildNumberRecordKey(record);
    return (
      <NumberRecordCard
        record={record}
        isOpen={openRecordKey === recordKey}
        onToggle={() => toggleRecord(recordKey)}
        onEdit={() => navigate(ROUTES.editNumberRecord(traineeId, recordKey))}
        onCreateBasedOn={() => navigate(ROUTES.newNumberRecord(traineeId, recordKey))}
      />
    );
  };

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
          isDisabled={phoneRecords.status !== "success"}
        />
      </PinnedPageTop>

      <HistoryCardsList
        records={phoneRecords}
        visibleRecords={visibleRecords}
        getRecordKey={buildNumberRecordKey}
        renderCard={renderCard}
        texts={TEXTS.states}
      />

      <HistorySortDrawer
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
          onClick={() => navigate(ROUTES.newNumberRecord(traineeId))}
        >
          {TEXTS.newRecord}
        </IpsButton>
      </StickyActionBar>

      <NumberRecordFormSlot traineeId={traineeId} phoneRecords={phoneRecords} onSaved={handleSaved} />
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
  const closeForm = useNavigateBack();
  const { openTarget, editRecord, basedOnRecord } = useHistoryFormTarget({
    formTarget: useNumberRecordFormRoute(),
    records: phoneRecords,
    matchesRecordRef: matchesNumberRecordRef,
    historyPath: ROUTES.numberRestrictions(traineeId),
  });

  const handleSaved = (savedRecordKey: string) => {
    onSaved(savedRecordKey);
    closeForm();
  };

  return (
    <NumberRecordFormSheet
      target={openTarget}
      traineeId={traineeId}
      editRecord={editRecord}
      basedOnRecord={basedOnRecord}
      onClose={closeForm}
      onSaved={handleSaved}
    />
  );
}
