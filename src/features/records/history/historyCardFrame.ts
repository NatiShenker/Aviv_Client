import type { ReactNode } from "react";

/** עוטף כל כרטיס ברשימה, למשל במסגרת כשהרשימה יושבת על משטח לבן (design.md) */
export type RenderCardFrame = (card: ReactNode) => ReactNode;

/** בלי עוטף: הכרטיס כמו שהוא, על רקע העמוד (מובייל) */
export const showCardAsIs: RenderCardFrame = (card) => card;
