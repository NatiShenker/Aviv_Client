import { createContext, useContext } from "react";

const FormLayerLeavingContext = createContext(false);

/** מסמן לטופס שבתוכו שהוא נסגר ויוצא עכשיו באנימציה */
export const FormLayerLeavingProvider = FormLayerLeavingContext.Provider;

/** האם הטופס כבר נסגר, ונשאר על המסך רק עד סוף אנימציית היציאה */
export function useIsFormLayerLeaving(): boolean {
  return useContext(FormLayerLeavingContext);
}
