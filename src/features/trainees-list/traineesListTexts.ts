export const TRAINEES_LIST_TEXTS = {
  title: "רשימת חניכים",

  toolbar: {
    searchLabel: "חיפוש חניכים",
    searchPlaceholder: "חיפוש לפי שם או מספר",
    clearSearch: "ניקוי חיפוש",
    filter: "סינון",
    filterWhenActive: "סינון, יש סינון פעיל",
    sort: "מיון",
  },

  states: {
    selectInstitute: "יש לבחור פנימייה כדי להציג את רשימת החניכים",
    loadingList: "טוען את רשימת החניכים…",
    loadFailed: "לא ניתן לטעון את הרשימה",
    retry: "נסה שוב",
    noResults: "לא נמצאו חניכים",
  },

  card: {
    activeBadge: "פעיל",
    restrictedUntil: "מוגבל עד",
    locationSeparator: ", ",
    minutes: (minutes: number) => `${minutes} דקות`,
    cellcomDiscrepancy: "קיים פער בנתונים בסלקום",
  },

  drawers: {
    close: "סגירה",
  },

  filterDrawer: {
    title: "סינון",
    showResults: (resultCount: number) => `הצג תוצאות (${resultCount})`,
    all: "הכל",
    none: "ללא",
    selectedCount: (count: number) => `${count} נבחרו`,
    groups: {
      wing: "אגף",
      location: "מיקום באגף",
      traineeRestriction: "הגבלה לחניך",
      recipientMessage: "הודעה קולית לנמען",
      phoneException: "הגבלה/היתר למספר",
      balance: "יתרה",
    },
    traineeRestriction: {
      full: "הגבלה מלאה פעילה",
      minutes: "הגבלת דקות פעילה",
    },
    // "אינטראקטיבית" בסכמה היא ההודעה החוזרת (כל 5 דקות במהלך השיחה)
    recipientMessage: {
      regular: "הודעה רגילה פעילה",
      interactive: "הודעה חוזרת פעילה",
    },
    phoneException: {
      restriction: "הגבלה למספר פעילה",
      permit: "היתר למספר פעיל",
    },
    balance: {
      hasBalance: "קיימת יתרה",
      noBalance: "ללא יתרה",
    },
    locationsLoading: "טוען מיקומים…",
    locationsLoadFailed: "לא ניתן לטעון את המיקומים",
    retry: "נסה שוב",
  },

  sortDrawer: {
    options: {
      nameAscending: "שם – א׳ עד ת׳",
      nameDescending: "שם – ת׳ עד א׳",
      // מוצעים - ממתינים לאישור (pending-decisions). "הגבלה" כאן היא הגבלה לחניך, לא הגבלה למספר
      statusRestrictedFirst: "סטטוס – עם הגבלה לחניך קודם",
      statusActiveFirst: "סטטוס – פעילים קודם",
      minutesDescending: "יתרת דקות – מהגבוהה לנמוכה",
      minutesAscending: "יתרת דקות – מהנמוכה לגבוהה",
      wingAscending: "אגף – א׳ עד ת׳",
      wingDescending: "אגף – ת׳ עד א׳",
      locationAscending: "מיקום באגף – א׳ עד ת׳",
      locationDescending: "מיקום באגף – ת׳ עד א׳",
    },
  },
} as const;
