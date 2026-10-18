import "./styles/index.css";
// הספרייה רושמת את הלוקאל העברי על עותק פרטי של moment, ולכן אביב רושמת אותו גם על העותק שה-TimePicker משתמש בו
import "moment/locale/he";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { registerGlobalErrorHandlers } from "./infrastructure/errors/errorReporting";
import { initHttpClient } from "./infrastructure/http";
import { prepareAppEntry } from "./shared/navigation/appEntry";

// נקודת כניסה למצב העצמאי: iframe במובייל וטאבלט. במצב MFE בדסקטופ הראוטר ייקבע בנפרד.
const ROOT_ELEMENT_ID = "root";

registerGlobalErrorHandlers();
initHttpClient();
// הקידומת של המארח (בסיס הראוטר). כניסה ישירה לכתובת פנימית מוחלפת כאן במסך הפתיחה
const appBasePath = prepareAppEntry();

const rootElement = document.getElementById(ROOT_ELEMENT_ID);
if (!rootElement) {
  throw new Error(`Root element #${ROOT_ELEMENT_ID} was not found`);
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter basename={appBasePath} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
