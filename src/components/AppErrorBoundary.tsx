import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useT } from "../i18n";
import { commonMessages } from "../i18n/messages/common";
import { isChunkLoadError, reloadForNewVersion } from "../utils/lazyPage";
import { reportClientError } from "../utils/monitoring";
import { primaryButton, secondaryButton, surface } from "../pages/dashboard/styles";

const ErrorScreen: React.FC = () => {
  const t = useT(commonMessages);
  return (
    <div role="alert" className="flex min-h-[60vh] items-center justify-center bg-[#F3F7FC] px-4 py-16 dark:bg-[#141D2B]">
      <div className={`${surface} w-full max-w-md px-6 py-8 text-center`}>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle size={20} />
        </span>
        <h1 className="mt-4 font-serif text-h3 text-[#101723] dark:text-[#E7EDF6]">{t("errorTitle")}</h1>
        <p className="mt-1.5 text-body-sm text-[#566273] dark:text-[#9BAABD]">{t("errorBody")}</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className={primaryButton}>
            <RotateCcw size={15} />
            {t("reloadPage")}
          </button>
          {/* A full load, not a router link: the app's state may be what broke. */}
          <a href="/dashboard" className={secondaryButton}>
            {t("goToDashboard")}
          </a>
        </div>
      </div>
    </div>
  );
};

/**
 * Shows an error screen instead of a blank page when a page fails to load or
 * crashes. A page file missing after a deploy gets one automatic reload first.
 * Changing `resetKey` (the route) clears the error, so navigating away works.
 */
export default class AppErrorBoundary extends React.Component<
  { resetKey: string; children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Page failed:", error);
    if (isChunkLoadError(error)) reloadForNewVersion();
    else reportClientError(error, { boundary: this.props.resetKey === "navbar" ? "sidebar" : "page" });
  }

  componentDidUpdate(previous: { resetKey: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback !== undefined ? this.props.fallback : <ErrorScreen />;
  }
}
