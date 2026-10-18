import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IpsButton } from "ui-library";
import { ROUTES } from "@/routes";
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
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import AppIcon from "@/shared/icons/AppIcon";
import { useNavigateBack } from "@/shells/mobile/navigation/useNavigateBack";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import StickyActionBar from "@/shells/mobile/StickyActionBar";
import RestrictionFormSheet from "../form/RestrictionFormSheet";
import { useRestrictionFormRoute } from "../form/useRestrictionFormRoute";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import RestrictionCard from "./RestrictionCard";
import { filterAndSortRestrictions, restrictionCardDomId } from "./traineeRestrictionsLogic";
import { useTraineeRestrictionsData } from "./useTraineeRestrictionsData";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS;

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_RECORDS: TraineeRestrictionRecordDto[] = [];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState(DEFAULT_HISTORY_SORT_OPTION);
  const [isSortOpen, setIsSortOpen] = useState(false);
  // רק כרטיס אחד פתוח בכל רגע
  const [openRecordId, setOpenRecordId] = useState<number | null>(null);
  const revealSavedRecord = useRevealSavedRecord(restrictions.data);

  const records = restrictions.data ?? NO_RECORDS;
  const visibleRecords = useMemo(
    () => filterAndSortRestrictions(records, searchQuery, sort),
    [records, searchQuery, sort],
  );

  const toggleRecord = (recordId: number) => {
    setOpenRecordId((currentId) => (currentId === recordId ? null : recordId));
  };

  // אחרי שמירה: ההיסטוריה נטענת מחדש, והרשומה שנשמרה פתוחה וגלויה (ספק 00 §4.1)
  const handleSaved = (savedRecordId: number) => {
    setOpenRecordId(savedRecordId);
    revealSavedRecord(restrictionCardDomId(savedRecordId));
    restrictions.reload();
  };

  const renderCard = (record: TraineeRestrictionRecordDto) => (
    <RestrictionCard
      record={record}
      isOpen={openRecordId === record.id}
      onToggle={() => toggleRecord(record.id)}
      onEdit={() => navigate(ROUTES.editTraineeRestriction(traineeId, record.id))}
      onCreateBasedOn={() => navigate(ROUTES.newTraineeRestriction(traineeId, record.id))}
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
          isDisabled={restrictions.status !== "success"}
        />
      </PinnedPageTop>

      <HistoryCardsList
        records={restrictions}
        visibleRecords={visibleRecords}
        getRecordKey={getRecordKey}
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
          onClick={() => navigate(ROUTES.newTraineeRestriction(traineeId))}
        >
          {TEXTS.newRestriction}
        </IpsButton>
      </StickyActionBar>

      <RestrictionFormSlot traineeId={traineeId} restrictions={restrictions} onSaved={handleSaved} />
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
  const closeForm = useNavigateBack();
  const { openTarget, editRecord, basedOnRecord } = useHistoryFormTarget({
    formTarget: useRestrictionFormRoute(),
    records: restrictions,
    matchesRecordRef: (record, recordId) => record.id === recordId,
    historyPath: ROUTES.traineeRestrictions(traineeId),
  });

  const handleSaved = (savedRecordId: number) => {
    onSaved(savedRecordId);
    closeForm();
  };

  return (
    <RestrictionFormSheet
      target={openTarget}
      traineeId={traineeId}
      editRecord={editRecord}
      basedOnRecord={basedOnRecord}
      onClose={closeForm}
      onSaved={handleSaved}
    />
  );
}
