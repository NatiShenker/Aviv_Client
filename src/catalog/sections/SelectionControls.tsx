import { useState } from "react";
import {
  IpsAutocomplete,
  IpsCheckBox,
  IpsChipSelect,
  IpsPillSelect,
  IpsSelect,
  IpsSwitch,
  type IpsPillSelectProps,
  type IpsSelectOption,
} from "ui-library";
import CatalogSection from "../CatalogSection";
import { APPROVER_OPTIONS, DEVICE_OPTIONS, REASON_OPTIONS, STATUS_OPTIONS } from "../catalogOptions";
import { CATALOG_TEXTS } from "../catalogTexts";

const TEXTS = CATALOG_TEXTS.selection;

export default function SelectionControls() {
  const [reason, setReason] = useState("");
  const [devices, setDevices] = useState<(string | number)[]>([]);
  const [approver, setApprover] = useState<IpsSelectOption | null>(null);
  const [status, setStatus] = useState<IpsPillSelectProps["value"]>(STATUS_OPTIONS[0].value);
  const [repeat, setRepeat] = useState(false);
  const [attachmentConfirmed, setAttachmentConfirmed] = useState(false);

  return (
    <CatalogSection title={CATALOG_TEXTS.sectionTitles.selection}>
      <IpsSelect
        label={TEXTS.reasonLabel}
        placeholder={TEXTS.reasonPlaceholder}
        options={REASON_OPTIONS}
        value={reason}
        onChange={(value) => setReason(String(value))}
      />

      <IpsChipSelect
        label={TEXTS.devicesLabel}
        placeholder={TEXTS.devicesPlaceholder}
        options={DEVICE_OPTIONS}
        value={devices}
        onChange={setDevices}
      />

      <IpsAutocomplete
        label={TEXTS.approverLabel}
        options={APPROVER_OPTIONS}
        value={approver}
        onChange={(_event, value) => setApprover(value)}
        getOptionLabel={(option: IpsSelectOption) => option.label}
        fullWidth
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">{TEXTS.statusLabel}</span>
        <IpsPillSelect options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </div>

      <IpsSwitch checked={repeat} onChange={(event) => setRepeat(event.target.checked)} label={TEXTS.repeatLabel} />

      <IpsCheckBox
        checked={attachmentConfirmed}
        onChange={(event) => setAttachmentConfirmed(event.target.checked)}
        label={TEXTS.attachmentConfirmLabel}
      />
    </CatalogSection>
  );
}
