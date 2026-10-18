import AppIcon from "@/shared/icons/AppIcon";
import type { AppIconName } from "@/shared/icons/appIcons";

/** צבע עיגול האייקון: אדום להגבלות והיתרים, כחול להודעות לנמען (ספק 00 §3.20) */
export type RecordIconTone = "danger" | "info";

const ICON_TONE_CLASS: Record<RecordIconTone, string> = {
  danger: "bg-error-soft text-error",
  info: "bg-primary-soft text-primary",
};

interface RecordIconCircleProps {
  icon: AppIconName;
  tone: RecordIconTone;
}

/** אייקון הרשומה בעיגול, בכרטיס ההיסטוריה ובכרטיס הנעול של העריכה */
export default function RecordIconCircle({ icon, tone }: RecordIconCircleProps) {
  return (
    <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${ICON_TONE_CLASS[tone]}`}>
      <AppIcon name={icon} />
    </span>
  );
}
