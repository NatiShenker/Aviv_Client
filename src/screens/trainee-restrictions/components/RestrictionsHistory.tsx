import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IpsButton } from "ui-library";
import { ROUTES } from "@/routes";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import HistorySortDrawer from "@/shared/components/history/HistorySortDrawer";
import HistoryToolbar from "@/shared/components/history/HistoryToolbar";
import PinnedPageTop from "@/shared/components/PinnedPageTop";
import StickyActionBar from "@/shared/components/StickyActionBar";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import AppIcon from "@/shared/icons/AppIcon";
import { useNavigateBack } from "@/shared/navigation/useNavigateBack";
import { filterAndSortRestrictions } from "../traineeRestrictionsLogic";
import {
  DEFAULT_RESTRICTION_SORT_OPTION,
  RESTRICTION_SORT_OPTIONS,
  findRestrictionSortOption,
} from "../traineeRestrictionsOptions";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import { useRestrictionFormRoute } from "../useRestrictionFormRoute";
import { useRevealSavedRecord } from "../useRevealSavedRecord";
import { useTraineeRestrictionsData } from "../useTraineeRestrictionsData";
import RestrictionFormSheet from "./RestrictionFormSheet";
import RestrictionsList from "./RestrictionsList";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS;

const SORT_ROWS = RESTRICTION_SORT_OPTIONS.map((option) => ({ value: option.key, label: option.label }));

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_RECORDS: TraineeRestrictionRecordDto[] = [];

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
  const [sort, setSort] = useState(DEFAULT_RESTRICTION_SORT_OPTION);
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
    revealSavedRecord(savedRecordId);
    restrictions.reload();
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
          isDisabled={restrictions.status !== "success"}
        />
      </PinnedPageTop>

      <RestrictionsList
        restrictions={restrictions}
        visibleRecords={visibleRecords}
        openRecordId={openRecordId}
        onToggleRecord={toggleRecord}
        onEditRecord={(recordId) => navigate(ROUTES.editTraineeRestriction(traineeId, recordId))}
      />

      <HistorySortDrawer
        open={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        rows={SORT_ROWS}
        selectedValue={sort.key}
        onChange={(key) => setSort(findRestrictionSortOption(key))}
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
  const navigate = useNavigate();
  const formTarget = useRestrictionFormRoute();
  const historyPath = ROUTES.traineeRestrictions(traineeId);
  const closeForm = useNavigateBack();

  // בעריכה הרשומה נלקחת מההיסטוריה שכבר נטענה, והטופס נפתח רק כשהיא קיימת
  const editRecordId = formTarget?.mode === "edit" ? formTarget.recordId : null;
  const editRecord = restrictions.data?.find((record) => record.id === editRecordId) ?? null;
  const isEditRecordMissing = editRecordId !== null && restrictions.status === "success" && editRecord === null;
  const openTarget = editRecordId !== null && editRecord === null ? null : formTarget;

  // רשומה לא קיימת (למשל כתובת ישנה): חזרה להיסטוריה במקום הכתובת הנוכחית (ספק 03 form §2)
  useEffect(() => {
    if (isEditRecordMissing) {
      navigate(historyPath, { replace: true });
    }
  }, [isEditRecordMissing, navigate, historyPath]);

  const handleSaved = (savedRecordId: number) => {
    onSaved(savedRecordId);
    closeForm();
  };

  return (
    <RestrictionFormSheet
      target={openTarget}
      traineeId={traineeId}
      editRecord={editRecord}
      onClose={closeForm}
      onSaved={handleSaved}
    />
  );
}
