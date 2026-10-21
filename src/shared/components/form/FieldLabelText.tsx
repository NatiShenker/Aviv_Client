interface FieldLabelTextProps {
  text: string;
  isRequired?: boolean;
  id?: string;
}

/**
 * תווית מעל שדה שאינו פקד נייטיבי אחד (גורם מאשר, צירוף קובץ, קבוצת כפתורי סינון), באותו מראה כמו התוויות של
 * פקדי הספרייה: 12, אפור כהה, בלי גובה שורה עודף. פקדי הספרייה מציגים את התווית שלהם בעצמם.
 */
export default function FieldLabelText({ text, isRequired = false, id }: FieldLabelTextProps) {
  return (
    <span id={id} className="mb-1 block text-xs leading-none text-text-secondary">
      {text}
      {isRequired && (
        <span aria-hidden="true" className="text-error">
          {" *"}
        </span>
      )}
    </span>
  );
}
