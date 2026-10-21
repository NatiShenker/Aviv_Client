export const TRAINEES_LIST_TEXTS = {
  title: "רשימת חניכים",

  toolbar: {
    searchLabel: "חיפוש חניכים",
    searchPlaceholder: "חיפוש לפי שם או מספר",
    clearSearch: "ניקוי חיפוש",
    filter: "סינון",
    filterWhenActive: "סינון, יש סינון פעיל",
    sort: "מיון",
    // מוצע - ממתין לאישור (pending-decisions)
    resultsCount: (count: number) => (count === 1 ? "מוצג חניך אחד" : `מוצגים ${count} חניכים`),
    // הערך הסגור של המיון בדסקטופ: שם פעולה ונקודתיים אחת, "מיון לפי שם: א׳ עד ת׳" (הוחלט 2026-10-21)
    sortValue: (sortLabel: string) => `מיון לפי ${sortLabel}`,
  },

  // פאנל המסננים בדסקטופ. "ניקוי מסננים" גם במגירת הסינון במובייל
  filterPanel: {
    // השם הנגיש של הפאנל - אין לו כותרת גלויה (הוחלט 2026-10-21)
    title: "מסננים",
    // בלי מספר המסננים הפעילים (הוחלט 2026-10-21)
    clearFilters: "ניקוי מסננים",
  },

  // דסקטופ: השם הנגיש של אזור הכרטיסים שנגלל
  cardsRegionLabel: "רשימת החניכים",
  // דסקטופ: השם הנגיש של הכרטיס כולו, שפותח את מגירת הפעולות. מוצע - ממתין לאישור (pending-decisions)
  openTraineeActions: (traineeAccessibleName: string) => `פתיחת הפעולות של ${traineeAccessibleName}`,

  states: {
    selectInstitute: "יש לבחור פנימייה כדי להציג את רשימת החניכים",
    loadingList: "טוען את רשימת החניכים…",
    loadFailed: "לא ניתן לטעון את רשימת החניכים",
    retry: "טעינה מחדש",
    noResults: "לא נמצאו חניכים",
  },

  card: {
    locationSeparator: ", ",
    minutes: (minutes: number) => (minutes === 1 ? "דקה אחת" : `${minutes} דקות`),
    cellcomDiscrepancy: "פער בנתונים מול סלקום",
  },

  filters: {
    title: "סינון",
    // בלי מספר התוצאות (הוחלט 2026-10-21)
    showResults: "הצגת התוצאות",
    all: "הכל",
    none: "ללא",
    selectedCount: (count: number) => `${count} נבחרו`,
    groups: {
      wing: "אגף",
      location: "מיקום באגף",
      traineeRestriction: "הגבלה לחניך",
      recipientMessage: "הודעה קולית לנמען",
      phoneException: "הגבלות והיתרים למספר",
      balance: "יתרה",
    },
    traineeRestriction: {
      full: "הגבלה מלאה פעילה",
      minutes: "הגבלת משך שיחה פעילה",
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
    retry: "טעינה מחדש",
  },

  sort: {
    options: {
      nameAscending: "שם: א׳ עד ת׳",
      nameDescending: "שם: ת׳ עד א׳",
      // הוחלט 2026-10-21. "הגבלה" כאן היא הגבלה לחניך, לא הגבלה למספר
      statusRestrictedFirst: "סטטוס: חניכים עם הגבלה תחילה",
      statusActiveFirst: "סטטוס: חניכים ללא הגבלה תחילה",
      minutesDescending: "יתרת דקות: מהגבוהה לנמוכה",
      minutesAscending: "יתרת דקות: מהנמוכה לגבוהה",
      wingAscending: "אגף: א׳ עד ת׳",
      wingDescending: "אגף: ת׳ עד א׳",
      locationAscending: "מיקום באגף: א׳ עד ת׳",
      locationDescending: "מיקום באגף: ת׳ עד א׳",
    },
  },
} as const;
