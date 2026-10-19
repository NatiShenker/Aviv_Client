import { useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/shared/dom/prefersReducedMotion";
import DrawerPane from "./DrawerPane";
import { FormLayerLeavingProvider } from "./drawerFormLeaving";
import { SCREEN_ENTER_CLASS, SCREEN_EXIT_CLASS } from "./drawerScreenMotion";
import { UnsavedChangesMute } from "./unsavedChanges";

// הטופס הוא שכבה מעל המסך שמתחתיו, בגובה ובשטח שלו
const FORM_PANE_LAYOUT_CLASS = "absolute inset-0 z-10 bg-paper";

interface ShownForm<TTarget> {
  target: TTarget;
  /** מזהה לכל פתיחה, כדי שטופס חדש לא יקבל את המופע של טופס שעדיין יוצא */
  openingId: number;
}

interface FormLayers<TTarget> {
  open: ShownForm<TTarget> | null;
  /** הטופס שנסגר, עד סוף אנימציית היציאה שלו */
  leaving: ShownForm<TTarget> | null;
  openingCount: number;
}

interface DrawerFormHostProps<TTarget> {
  /** הטופס הפתוח (למשל יצירה או עריכה של רשומה), או null כשאין טופס */
  formTarget: TTarget | null;
  renderForm: (target: TTarget) => ReactNode;
  /** המסך שמתחת (למשל ההיסטוריה) */
  children: ReactNode;
}

/**
 * מסך במגירה, ומעליו טופס כשהוא פתוח - המקבילה של גיליון הטופס מעל ההיסטוריה במובייל.
 * הטופס נכנס כמו מסך חדש (קדימה) ויוצא כמו חזרה, והמסך שמתחתיו זז איתו (ספק 02 §8.5).
 * המסך שמתחת נשאר mounted, ולכן החיפוש, המיון, הכרטיס הפתוח והגלילה נשמרים; בזמן שהטופס פתוח הוא inert
 */
export default function DrawerFormHost<TTarget>({ formTarget, renderForm, children }: DrawerFormHostProps<TTarget>) {
  const [layers, setLayers] = useState<FormLayers<TTarget>>(() => buildInitialLayers(formTarget));

  // הטופס נפתח או נסגר: מעדכנים את השכבות כבר ברינדור הזה (התבנית של React להתאמת מצב לשינוי ב-prop)
  const shownTarget = layers.open?.target ?? null;
  if (formTarget !== shownTarget) {
    setLayers(buildNextLayers(layers, formTarget));
  }

  const isFormOpen = layers.open !== null;
  const screenMotionClass = resolveScreenMotionClass(isFormOpen, layers.leaving !== null);
  const finishLeaving = () => setLayers((current) => ({ ...current, leaving: null }));

  // רשימה עם key לכל פתיחה: כשהטופס הפתוח הופך ליוצא, React שומר את אותו מופע
  const formPanes = [
    ...(layers.leaving ? [{ form: layers.leaving, isLeaving: true }] : []),
    ...(layers.open ? [{ form: layers.open, isLeaving: false }] : []),
  ];

  return (
    // clip ולא hidden - כדי שמעבר הפוקוס לטופס שנכנס לא יגלול את המכולה הצידה (ראו DrawerScreenTransition)
    <div className="relative flex min-h-0 flex-1 flex-col overflow-clip">
      <DrawerPane layoutClass="flex-1" motionClass={screenMotionClass} isInert={isFormOpen}>
        {children}
      </DrawerPane>

      {formPanes.map(({ form, isLeaving }) => (
        <DrawerPane
          key={form.openingId}
          layoutClass={FORM_PANE_LAYOUT_CLASS}
          motionClass={isLeaving ? SCREEN_EXIT_CLASS.back : SCREEN_ENTER_CLASS.forward}
          isInert={isLeaving}
          onOwnAnimationEnd={isLeaving ? finishLeaving : undefined}
        >
          <FormLayerLeavingProvider value={isLeaving}>
            <UnsavedChangesMute isMuted={isLeaving}>{renderForm(form.target)}</UnsavedChangesMute>
          </FormLayerLeavingProvider>
        </DrawerPane>
      ))}
    </div>
  );
}

function buildInitialLayers<TTarget>(formTarget: TTarget | null): FormLayers<TTarget> {
  return {
    open: formTarget === null ? null : { target: formTarget, openingId: 0 },
    leaving: null,
    openingCount: 0,
  };
}

function buildNextLayers<TTarget>(layers: FormLayers<TTarget>, formTarget: TTarget | null): FormLayers<TTarget> {
  if (formTarget === null) {
    // הטופס נסגר: הוא יוצא באנימציה, ובהעדפת "הפחתת תנועה" יורד מיד
    return { ...layers, open: null, leaving: prefersReducedMotion() ? null : layers.open };
  }
  // טופס חדש נפתח. טופס שעדיין יוצא (נסגר הרגע) יורד מיד
  const openingCount = layers.openingCount + 1;
  return { open: { target: formTarget, openingId: openingCount }, leaving: null, openingCount };
}

// המסך שמתחת זז עם הטופס: יוצא כשהטופס נכנס, וחוזר כשהטופס יוצא
function resolveScreenMotionClass(isFormOpen: boolean, isFormLeaving: boolean): string {
  if (isFormOpen) {
    return SCREEN_EXIT_CLASS.forward;
  }
  return isFormLeaving ? SCREEN_ENTER_CLASS.back : "";
}
