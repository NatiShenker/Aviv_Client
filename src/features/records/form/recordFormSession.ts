import type { FormSaveProps } from "./FormFooter";

/** מה שפתיחה אחת של טופס רשומה צריכה, בלי המעטפת: כותרת, גוף הטופס, ומצב השמירה לפוטר */
export interface RecordFormSession<TFormProps> {
  title: string;
  formProps: TFormProps;
  saveProps: FormSaveProps;
  /** המשתמש שינה ערך מאז שהטופס נפתח */
  hasUserChanges: boolean;
}
