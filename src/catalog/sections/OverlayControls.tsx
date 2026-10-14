import { useState } from "react";
import {
  IpsAccordion,
  IpsButton,
  IpsDialog,
  IpsDrawer,
  IpsPillSelect,
  TOAST_TYPES,
  useToast,
  type IpsPillSelectProps,
} from "ui-library";
import CatalogSection from "../CatalogSection";
import { DEMO_RECORD_DETAILS, SORT_OPTIONS } from "../catalogOptions";
import { CATALOG_TEXTS } from "../catalogTexts";

const TEXTS = CATALOG_TEXTS.overlays;

const TOAST_DEMOS = [
  { type: TOAST_TYPES.SUCCESS, label: TEXTS.toastLabels.success, message: TEXTS.toastMessages.success },
  { type: TOAST_TYPES.INFO, label: TEXTS.toastLabels.info, message: TEXTS.toastMessages.info },
  { type: TOAST_TYPES.WARNING, label: TEXTS.toastLabels.warning, message: TEXTS.toastMessages.warning },
  { type: TOAST_TYPES.DANGER, label: TEXTS.toastLabels.danger, message: TEXTS.toastMessages.danger },
];

export default function OverlayControls() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortKey, setSortKey] = useState<IpsPillSelectProps["value"]>(SORT_OPTIONS[0].value);
  const addToast = useToast();

  const closeSheet = () => setSheetOpen(false);
  const closeDialog = () => setDialogOpen(false);

  return (
    <CatalogSection title={CATALOG_TEXTS.sectionTitles.overlays}>
      <div className="grid grid-cols-2 gap-2">
        <IpsButton variant="outlined" onClick={() => setSheetOpen(true)}>
          {TEXTS.openSheet}
        </IpsButton>
        <IpsButton variant="outlined" onClick={() => setDialogOpen(true)}>
          {TEXTS.openDialog}
        </IpsButton>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOAST_DEMOS.map(({ type, label, message }) => (
          <IpsButton key={type} variant="outlined" size="small" onClick={() => addToast(type, message)}>
            {label}
          </IpsButton>
        ))}
      </div>

      <IpsAccordion summary={TEXTS.accordionSummary}>
        <dl className="grid grid-cols-2 gap-y-4">
          {DEMO_RECORD_DETAILS.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-sm text-text-muted">{label}</dt>
              <dd className="mt-0.5 text-base text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </IpsAccordion>

      <IpsDrawer open={sheetOpen} anchor="bottom" title={TEXTS.sheetTitle} onClose={closeSheet} rtl>
        <IpsPillSelect options={SORT_OPTIONS} value={sortKey} onChange={setSortKey} />
      </IpsDrawer>

      <IpsDialog
        open={dialogOpen}
        title={TEXTS.dialogTitle}
        onClose={closeDialog}
        rtl
        actions={
          <>
            <IpsButton variant="outlined" onClick={closeDialog}>
              {TEXTS.stay}
            </IpsButton>
            <IpsButton variant="contained" onClick={closeDialog}>
              {TEXTS.leave}
            </IpsButton>
          </>
        }
      >
        <p className="text-base text-text-secondary">{TEXTS.dialogBody}</p>
      </IpsDialog>
    </CatalogSection>
  );
}
