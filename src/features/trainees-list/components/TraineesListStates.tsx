import type { ReactNode } from "react";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineeListItemDto } from "@/types/trainees.schema";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";

const TEXTS = TRAINEES_LIST_TEXTS.states;

interface TraineesListStatesProps {
  hasSelectedInstitute: boolean;
  trainees: AsyncResource<TraineeListItemDto[]>;
  /** הרשימה אחרי חיפוש, סינון ומיון */
  visibleTrainees: TraineeListItemDto[];
  /** השלד שמוצג בזמן הטעינה - כל פלטפורמה בפריסה שלה */
  loadingContent: ReactNode;
  /** הכרטיסים עצמם - כל פלטפורמה בפריסה שלה */
  renderCards: (visibleTrainees: TraineeListItemDto[]) => ReactNode;
}

/** אזור הרשימה: בחירת פנימייה, טעינה, שגיאה, ריק, או הכרטיסים */
export default function TraineesListStates({
  hasSelectedInstitute,
  trainees,
  visibleTrainees,
  loadingContent,
  renderCards,
}: TraineesListStatesProps) {
  if (!hasSelectedInstitute) {
    return <ScreenStateMessage message={TEXTS.selectInstitute} />;
  }

  switch (trainees.status) {
    case "idle":
    case "loading":
      return loadingContent;
    case "error":
      return (
        <ScreenStateMessage
          tone="error"
          message={TEXTS.loadFailed}
          actionLabel={TEXTS.retry}
          onAction={trainees.reload}
        />
      );
    case "empty":
      return <ScreenStateMessage message={TEXTS.noResults} />;
    case "success":
      if (visibleTrainees.length === 0) {
        return <ScreenStateMessage message={TEXTS.noResults} />;
      }
      return renderCards(visibleTrainees);
  }
}
