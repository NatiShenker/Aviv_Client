// סוגי input שמקלידים בהם טקסט חופשי
const TEXT_INPUT_TYPES = ["text", "search", "tel", "email", "number", "url", "password"];

/** האם האלמנט הוא שדה שמקלידים בו (למשל כדי ש-Escape בתוכו יישאר של השדה) */
export function isTextEntryElement(element: Element | null): boolean {
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }
  return element instanceof HTMLInputElement && TEXT_INPUT_TYPES.includes(element.type);
}
