import { Component, type ReactNode } from "react";
import { IpsButton } from "ui-library";
import { toAppError } from "./appError";
import { reportError } from "./errorReporting";
import { ERROR_SCREEN_TEXTS } from "./errorTexts";

const RENDER_ERROR_CONTEXT = "render error";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

// React תופס שגיאות רינדור רק ברכיב מחלקה, ולכן זה הרכיב היחיד באפליקציה שנכתב כמחלקה
export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    reportError(toAppError(error), RENDER_ERROR_CONTEXT);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackScreen />;
    }
    return this.props.children;
  }
}

function ErrorFallbackScreen() {
  return (
    <main
      dir="rtl"
      lang="he"
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-5 text-center"
    >
      <h1 className="text-lg font-medium text-text-primary">{ERROR_SCREEN_TEXTS.title}</h1>
      <p className="text-base text-text-muted">{ERROR_SCREEN_TEXTS.description}</p>
      <IpsButton variant="contained" onClick={() => window.location.reload()}>
        {ERROR_SCREEN_TEXTS.reload}
      </IpsButton>
    </main>
  );
}
