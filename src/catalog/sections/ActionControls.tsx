import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { IpsButton, IpsIconButton } from "ui-library";
import CatalogSection from "../CatalogSection";
import { CATALOG_TEXTS } from "../catalogTexts";

const TEXTS = CATALOG_TEXTS.actions;

export default function ActionControls() {
  return (
    <CatalogSection title={CATALOG_TEXTS.sectionTitles.actions}>
      <IpsButton variant="contained" fullWidth endIcon={<AddIcon />}>
        {TEXTS.newRecord}
      </IpsButton>

      <div className="grid grid-cols-2 gap-2">
        <IpsButton variant="outlined">{TEXTS.cancel}</IpsButton>
        <IpsButton variant="contained">{TEXTS.save}</IpsButton>
      </div>

      <IpsButton variant="outlined" fullWidth endIcon={<EditOutlinedIcon />}>
        {TEXTS.edit}
      </IpsButton>

      <IpsButton variant="contained" loading>
        {TEXTS.save}
      </IpsButton>

      <div className="flex items-center gap-2">
        <IpsIconButton icon={<ArrowForwardIcon />} aria-label={TEXTS.back} tooltip={TEXTS.back} />
        <IpsIconButton icon={<SearchIcon />} aria-label={TEXTS.search} tooltip={TEXTS.search} />
        <IpsIconButton icon={<CloseIcon />} aria-label={TEXTS.close} tooltip={TEXTS.close} />
      </div>
    </CatalogSection>
  );
}
