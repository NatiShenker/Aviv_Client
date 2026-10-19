import type { VoiceMessageScope } from "@/schemas/voice-messages.schema";
import type { RadioFieldOption } from "@/shared/form-controls/formControls";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";

const SCOPE_TEXTS = VOICE_MESSAGES_TEXTS.form.messageBlock.scopes;

interface ScopeOption extends RadioFieldOption {
  value: VoiceMessageScope;
}

/**
 * "היקף ההפעלה": ברירת המחדל ראשונה; האפשרות שפותחת את שדה המספרים אחרונה, כדי שהשדה ייפתח צמוד אליה
 * (ספק 05 form §3.2)
 */
export const SCOPE_OPTIONS: ScopeOption[] = [
  { value: "all", label: SCOPE_TEXTS.all.label, description: SCOPE_TEXTS.all.description },
  { value: "selected", label: SCOPE_TEXTS.selected.label, description: SCOPE_TEXTS.selected.description },
];

export const DEFAULT_SCOPE: VoiceMessageScope = "all";

export function isVoiceMessageScope(value: string | number): value is VoiceMessageScope {
  return SCOPE_OPTIONS.some((option) => option.value === value);
}
