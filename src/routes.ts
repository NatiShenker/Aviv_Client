export const ROUTES = {
  root: "/",
  catalog: "/catalog",
  /** מסך הפעולות של חניך (ספק 02) - המסך עצמו עדיין לא נבנה */
  traineeActions: (traineeId: number) => `/child/${traineeId}`,
} as const;
