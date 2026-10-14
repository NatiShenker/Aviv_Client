import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { useState } from "react";
import { IpsSwitch, IpsTextArea, IpsTextField } from "ui-library";
import CatalogSection from "../CatalogSection";
import { CATALOG_TEXTS } from "../catalogTexts";

const TEXTS = CATALOG_TEXTS.text;

export default function TextControls() {
  const [search, setSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const errorText = showErrors ? TEXTS.requiredError : undefined;

  return (
    <CatalogSection title={CATALOG_TEXTS.sectionTitles.text}>
      <IpsSwitch
        checked={showErrors}
        onChange={(event) => setShowErrors(event.target.checked)}
        label={TEXTS.showErrors}
      />

      <IpsTextField
        type="search"
        placeholder={TEXTS.searchPlaceholder}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        fullWidth
      />

      <IpsTextField
        type="tel"
        label={TEXTS.phoneLabel}
        placeholder={TEXTS.phonePlaceholder}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        endAdornment={<PhoneOutlinedIcon />}
        required
        error={showErrors}
        helperText={errorText}
        fullWidth
      />

      <IpsTextArea
        label={TEXTS.detailsLabel}
        placeholder={TEXTS.detailsPlaceholder}
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        rows={3}
        error={showErrors}
        helperText={errorText}
      />
    </CatalogSection>
  );
}
