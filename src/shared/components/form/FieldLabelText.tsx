interface FieldLabelTextProps {
  text: string;
  isRequired?: boolean;
  id?: string;
}

/**
 * תווית מעל שדה שאינו פקד נייטיבי אחד (גורם מאשר, צירוף קובץ), באותו מראה כמו התוויות של פקדי הספרייה.
 * פקדי הספרייה מציגים את התווית שלהם בעצמם.
 */
export default function FieldLabelText({ text, isRequired = false, id }: FieldLabelTextProps) {
  return (
    <span id={id} className="mb-1 block text-xs text-text-muted">
      {text}
      {isRequired && (
        <span aria-hidden="true" className="text-error">
          {" *"}
        </span>
      )}
    </span>
  );
}
