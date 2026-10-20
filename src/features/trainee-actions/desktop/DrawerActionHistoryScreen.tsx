import type { ReactNode } from "react";
import PermissionBlockedMessage from "@/features/institutes/PermissionBlockedMessage";
import { PERMISSION_IDS, type PermissionId } from "@/features/institutes/permissions";
import { usePermissionCheck } from "@/features/institutes/usePermissionCheck";
import NumberRestrictionsDrawerHistory from "@/features/number-restrictions/desktop/NumberRestrictionsDrawerHistory";
import { NUMBER_RESTRICTIONS_TEXTS } from "@/features/number-restrictions/numberRestrictionsTexts";
import { renderDrawerCardFrame } from "@/features/records/desktop/DrawerHistoryLayout";
import HistorySkeleton from "@/features/records/history/HistorySkeleton";
import TraineeRestrictionsDrawerHistory from "@/features/trainee-restrictions/desktop/TraineeRestrictionsDrawerHistory";
import { TRAINEE_RESTRICTIONS_TEXTS } from "@/features/trainee-restrictions/traineeRestrictionsTexts";
import VoiceMessagesDrawerHistory from "@/features/voice-messages/desktop/VoiceMessagesDrawerHistory";
import { VOICE_MESSAGES_TEXTS } from "@/features/voice-messages/voiceMessagesTexts";
import { DRAWER_SCROLL_AREA_CLASS } from "@/shells/desktop/drawer/drawerSpacing";
import DrawerTopBar from "@/shells/desktop/drawer/DrawerTopBar";
import type { TraineeListItemDto } from "@/types/trainees.schema";
import DrawerActionNavigation from "./DrawerActionNavigation";
import type { DrawerActionKey } from "./traineeDrawerScreens";

interface DrawerActionHistoryProps {
  trainee: TraineeListItemDto;
  navigation: ReactNode;
  onRecordSaved: () => void;
}

interface DrawerActionView {
  permissionId: PermissionId;
  /** טקסט השלד בזמן שההרשאות נטענות */
  loadingLabel: string;
  renderHistory: (props: DrawerActionHistoryProps) => ReactNode;
}

// המסך של כל פעולה במגירה - המקבילה של הנתיבים במובייל
const DRAWER_ACTION_VIEWS: Record<DrawerActionKey, DrawerActionView> = {
  traineeRestriction: {
    permissionId: PERMISSION_IDS.traineeRestriction,
    loadingLabel: TRAINEE_RESTRICTIONS_TEXTS.states.loading,
    renderHistory: ({ trainee, navigation, onRecordSaved }) => (
      <TraineeRestrictionsDrawerHistory traineeId={trainee.id} navigation={navigation} onRecordSaved={onRecordSaved} />
    ),
  },
  numberRestriction: {
    permissionId: PERMISSION_IDS.numberRestriction,
    loadingLabel: NUMBER_RESTRICTIONS_TEXTS.states.loading,
    renderHistory: ({ trainee, navigation, onRecordSaved }) => (
      <NumberRestrictionsDrawerHistory traineeId={trainee.id} navigation={navigation} onRecordSaved={onRecordSaved} />
    ),
  },
  voiceMessage: {
    permissionId: PERMISSION_IDS.voiceMessage,
    loadingLabel: VOICE_MESSAGES_TEXTS.states.loading,
    renderHistory: ({ trainee, navigation, onRecordSaved }) => (
      <VoiceMessagesDrawerHistory
        traineeId={trainee.id}
        traineeFullName={trainee.fullName}
        navigation={navigation}
        onRecordSaved={onRecordSaved}
      />
    ),
  },
};

interface DrawerActionHistoryScreenProps {
  actionKey: DrawerActionKey;
  trainee: TraineeListItemDto;
  onBack: () => void;
  onSwitchAction: (actionKey: DrawerActionKey) => void;
  /** אחרי שמירה בטופס של הפעולה */
  onRecordSaved: () => void;
}

/**
 * מסך של פעולה במגירה: ההיסטוריה שלה, או - לפני שההרשאות נטענו או בלי הרשאה - השורה העליונה והמצב (ספק 02 §7).
 * החזרה ומחליף הפעולה זמינים בכל מצב
 */
export default function DrawerActionHistoryScreen({
  actionKey,
  trainee,
  onBack,
  onSwitchAction,
  onRecordSaved,
}: DrawerActionHistoryScreenProps) {
  const view = DRAWER_ACTION_VIEWS[actionKey];
  const permission = usePermissionCheck(view.permissionId);
  const navigation = <DrawerActionNavigation actionKey={actionKey} onBack={onBack} onSwitchAction={onSwitchAction} />;

  if (permission.status === "granted") {
    return <>{view.renderHistory({ trainee, navigation, onRecordSaved })}</>;
  }

  return (
    <>
      <DrawerTopBar>{navigation}</DrawerTopBar>
      <div className={`min-h-0 flex-1 pb-6 ${DRAWER_SCROLL_AREA_CLASS}`}>
        {permission.status === "loading" ? (
          <HistorySkeleton loadingLabel={view.loadingLabel} renderCardFrame={renderDrawerCardFrame} />
        ) : (
          <PermissionBlockedMessage permission={permission} />
        )}
      </div>
    </>
  );
}
