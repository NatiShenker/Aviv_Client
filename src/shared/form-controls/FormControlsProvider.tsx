import { createContext, useContext, type ReactNode } from "react";
import type { FormControls } from "./formControls";

const FormControlsContext = createContext<FormControls | null>(null);

interface FormControlsProviderProps {
  /** הפקדים של הפריסה. אובייקט קבוע, כדי שלא ייצור רינדור מחדש */
  controls: FormControls;
  children: ReactNode;
}

/** הפריסה קובעת כאן את פקדי הטפסים, פעם אחת, לכל הטפסים שמתחתיה */
export function FormControlsProvider({ controls, children }: FormControlsProviderProps) {
  return <FormControlsContext.Provider value={controls}>{children}</FormControlsContext.Provider>;
}

/** פקדי הטופס של הפריסה הנוכחית */
export function useFormControls(): FormControls {
  const controls = useContext(FormControlsContext);
  if (!controls) {
    throw new Error("useFormControls must be used inside FormControlsProvider");
  }
  return controls;
}
