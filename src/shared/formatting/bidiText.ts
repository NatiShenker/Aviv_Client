// תווי בידוד כיווניות של Unicode (LRI ... PDI)
const LEFT_TO_RIGHT_ISOLATE = "⁦";
const POP_DIRECTIONAL_ISOLATE = "⁩";

/**
 * קטע שנקרא משמאל לימין (תאריכים, טווחים) בתוך טקסט עברי, כשאין אפשרות לעטוף אותו ב-span עם dir="ltr"
 * (למשל ערך מחרוזת אחד שמשלב תווית וטווח).
 */
export function isolateLtr(text: string): string {
  return `${LEFT_TO_RIGHT_ISOLATE}${text}${POP_DIRECTIONAL_ISOLATE}`;
}
