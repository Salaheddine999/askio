import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LiveOrb } from "../components/LiveOrb";
import { primaryButton } from "./dashboard/ui";
import { useT } from "../i18n";
import { notFoundMessages } from "../i18n/messages/notFound";

/** Any address the app doesn't know: Kio glances away, unsure, and points you back. */
const NotFound: React.FC<{ signedIn: boolean }> = ({ signedIn }) => {
  const t = useT(notFoundMessages);
  return (
    <main
      className={`flex flex-col items-center justify-center px-6 text-center ${
        signedIn ? "min-h-[calc(100dvh-3.5rem)] lg:min-h-[100dvh]" : "min-h-[100dvh] bg-ink-30 dark:bg-ink-875"
      }`}
    >
      <Helmet>
        <title>{t("metaTitle")}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <LiveOrb size={96} mood="unsure" />
      <h1 className="mt-8 font-display text-h2 tracking-tight text-fg">{t("title")}</h1>
      <p className="mt-2 max-w-sm text-body text-fg-muted [text-wrap:balance]">{t("body")}</p>
      <Link to={signedIn ? "/dashboard" : "/"} className={`${primaryButton} mt-8`}>
        {signedIn ? t("toDashboard") : t("toHome")}
      </Link>
    </main>
  );
};

export default NotFound;
