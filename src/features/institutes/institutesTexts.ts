export const INSTITUTES_TEXTS = {
  selectLabel: "פנימייה",
  selectPlaceholder: "בחירת פנימייה",
  loading: "טוען…",
  loadFailed: "לא ניתן לטעון את רשימת הפנימיות",
  noPermittedInstitutes: "אין לך הרשאה לאף פנימייה",
  retry: "טעינה מחדש",
  permissionsLoadFailed: "לא ניתן לטעון את ההרשאות לפנימייה",
  // מוצע - ממתין לאישור (pending-decisions)
  noPermissionForAction: "אין לך הרשאה לפעולה זו",

  // מבנה הפנימייה, משותף לכמה מסכים
  organization: {
    wing: (wingName: string) => `אגף ${wingName}`,
  },
} as const;
