import { IpsRadioGroupMobile, type IpsRadioGroupMobileValue } from "ui-library";
import PhoneNumbersField from "@/features/records/form/phone/PhoneNumbersField";
import PhoneSearchField from "@/features/records/form/phone/PhoneSearchField";
import FormSection from "@/shared/components/form/FormSection";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import { NUMBER_RECORD_FIELD_IDS, canSearchPhone } from "./numberRecordFormLogic";
import { RECORD_TYPE_OPTIONS, isNumberRecordType } from "./numberRestrictionsOptions";
import PermitLookupResult from "./PermitLookupResult";
import type { RestrictionOptionsListComponent } from "./RestrictionPicker";
import type { NumberRecordFormController } from "./useNumberRecordForm";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form.actionType;

interface ActionTypeBlockProps {
  form: NumberRecordFormController;
  /** רשימת ההגבלות לבחירה בהיתר, בתצוגה של הפריסה */
  RestrictionOptionsList: RestrictionOptionsListComponent;
}

/** בלוק 0 ביצירה - "הגבלה או היתר": הבחירה, ושדה המספר של כל סוג (ספק 04 form §3.2) */
export default function ActionTypeBlock({ form, RestrictionOptionsList }: ActionTypeBlockProps) {
  const { state } = form;
  const isPermit = state.recordType === "permit";

  const handleTypeChange = (value: IpsRadioGroupMobileValue) => {
    if (isNumberRecordType(value)) {
      form.changeType(value);
    }
  };

  return (
    <FormSection title={TEXTS.title}>
      <IpsRadioGroupMobile
        aria-label={TEXTS.title}
        options={RECORD_TYPE_OPTIONS}
        value={state.recordType}
        onChange={handleTypeChange}
      />

      <div className="mt-3">
        {isPermit ? (
          <PhoneSearchField
            id={NUMBER_RECORD_FIELD_IDS.phone}
            hint={TEXTS.phoneHints.permit}
            value={state.phoneDraft}
            onChange={form.changePhone}
            error={state.errors.phone}
            canSearch={canSearchPhone(state)}
            isSearching={state.lookup.status === "searching"}
            onSearch={form.searchPhone}
          />
        ) : (
          <PhoneNumbersField
            id={NUMBER_RECORD_FIELD_IDS.phone}
            hint={TEXTS.phoneHints.restriction}
            value={state.phoneDraft}
            onChange={form.changePhone}
            error={state.errors.phone}
            phones={state.addedPhones}
            onAdd={form.addPhone}
            onRemove={form.removePhone}
          />
        )}
      </div>

      {isPermit && <PermitLookupResult form={form} RestrictionOptionsList={RestrictionOptionsList} />}
    </FormSection>
  );
}
