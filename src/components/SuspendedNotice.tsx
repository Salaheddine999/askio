import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { signOut } from "firebase/auth";
import { format } from "date-fns";
import { Mail, ShieldAlert } from "lucide-react";
import { auth } from "../utils/firebase";
import { COMPANY } from "../pages/legal/company";
import { reviewEmailHref } from "../utils/support";
import { focusRing, primaryButton, secondaryButton, surface } from "../pages/dashboard/ui";
import type { Suspension } from "../hooks/useSuspension";
import { dateLocale, useT } from "../i18n";
import { suspensionMessages } from "../i18n/messages/suspension";

/** Shown in place of the app's pages while the account is suspended. */
const SuspendedNotice: React.FC<{ suspension: Suspension }> = ({ suspension }) => {
  const t = useT(suspensionMessages);
  const navigate = useNavigate();
  const email = auth.currentUser?.email;

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#F3F7FC] px-4 py-12 sm:py-20 dark:bg-[#141D2B]">
      <Helmet>
        <title>{t("metaTitle")}</title>
      </Helmet>
      <section className={`${surface} w-full max-w-xl`} aria-labelledby="suspended-title">
        <div className="px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
            <ShieldAlert size={20} />
          </span>
          <h1 id="suspended-title" className="mt-5 font-serif text-h2 tracking-tight text-[#101723] dark:text-[#E7EDF6]">
            {t("title")}
          </h1>
          <p className="mt-2 text-body-sm leading-relaxed text-[#566273] dark:text-[#9BAABD]">
            {suspension.since
              ? t("bodySince", {
                  date: format(suspension.since, t.lang === "en" ? "MMMM d, yyyy" : "PPP", { locale: dateLocale(t.lang) }),
                })
              : t("body")}
          </p>

          {suspension.reason && (
            <div className="mt-5 rounded-xl border border-[#E7EDF6] bg-[#F3F7FC] px-4 py-3 dark:border-[#2B3646] dark:bg-[#141D2B]">
              <p className="text-caption font-medium text-[#647184] dark:text-[#87909D]">{t("reason")}</p>
              <p className="mt-1 whitespace-pre-line text-body-sm text-[#101723] dark:text-[#D7DFE5]">{suspension.reason}</p>
            </div>
          )}

          <p className="mt-5 text-body-sm leading-relaxed text-[#566273] dark:text-[#9BAABD]">
            {t("reviewBefore")}{" "}
            <a
              href={reviewEmailHref(email)}
              className={`font-medium text-[#101723] underline underline-offset-2 dark:text-[#E7EDF6] ${focusRing}`}
            >
              {COMPANY.contactEmail}
            </a>{" "}
            {t("reviewAfter")}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <a href={reviewEmailHref(email)} className={primaryButton}>
              <Mail size={15} />
              {t("contactUs")}
            </a>
            <Link to="/settings" className={secondaryButton}>
              {t("settingsLink")}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#E7EDF6] px-6 py-4 text-caption text-[#647184] sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:border-[#2B3646] dark:text-[#87909D]">
          <span className="truncate">{email ? t("signedInAs", { email }) : ""}</span>
          <button
            type="button"
            onClick={async () => {
              await signOut(auth).catch(() => undefined);
              navigate("/");
            }}
            className={`self-start rounded font-medium text-[#566273] hover:text-[#101723] sm:self-auto dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] ${focusRing}`}
          >
            {t("signOut")}
          </button>
        </div>
      </section>
    </div>
  );
};

export default SuspendedNotice;
