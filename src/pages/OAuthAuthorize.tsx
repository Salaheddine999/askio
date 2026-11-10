import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import type { User } from "firebase/auth";
import BrandLogo from "../components/BrandLogo";
import { AlertTriangle, Check, X } from "../components/icons";
import { apiRequest } from "../utils/api";
import { clearOAuthReturn, rememberOAuthReturn } from "../utils/oauthReturn";
import { reportClientError } from "../utils/monitoring";
import { useT } from "../i18n";
import { oauthMessages } from "../i18n/messages/oauth";
import { primaryButton, secondaryButton, surface } from "./dashboard/styles";

// /oauth/authorize: where an AI app (Claude, ChatGPT, …) sends an owner to
// connect it to their Askio account. The server checks the request
// (api/_lib/oauth.js); this page shows who is asking and what they would be
// able to do, and sends the owner back with the answer. Nothing is granted
// until they click "Allow access".

const PARAMS = ["client_id", "redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state", "scope", "resource"];

type RequestInfo = { appName: string; returnsTo: string; local: boolean };

const Shell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  // Covers the app's sidebar: this page stands on its own.
  <main className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-30 px-4 py-10 dark:bg-ink-875">
    <Helmet>
      <title>{title}</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <div className="my-auto w-full max-w-md">
      <div className="mb-6 flex justify-center text-ink-900 dark:text-ink-70">
        <BrandLogo size={24} />
      </div>
      <div className={`${surface} p-6`}>{children}</div>
    </div>
  </main>
);

const OAuthAuthorize: React.FC<{ user: User | null }> = ({ user }) => {
  const t = useT(oauthMessages);
  const location = useLocation();
  const [info, setInfo] = useState<RequestInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [deciding, setDeciding] = useState(false);

  const request = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return Object.fromEntries(PARAMS.map((name) => [name, query.get(name) ?? ""]));
  }, [location.search]);

  useEffect(() => {
    if (!user) {
      // Sign-in and sign-up come back here (see Auth.tsx and App.tsx).
      rememberOAuthReturn(`${location.pathname}${location.search}`);
      return;
    }
    clearOAuthReturn();
    let current = true;
    apiRequest<RequestInfo>("/api/account/oauth-request", { authRequired: true, body: request })
      .then((result) => current && setInfo(result))
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [user, request, location.pathname, location.search]);

  const decide = async (allow: boolean) => {
    setDeciding(true);
    try {
      const { redirectTo } = await apiRequest<{ redirectTo: string }>("/api/account/oauth-decide", {
        authRequired: true,
        body: { ...request, allow },
      });
      // The server only answers with an address the app registered.
      window.location.assign(redirectTo);
    } catch (error) {
      reportClientError(error, { area: "oauth" });
      setFailed(true);
      setDeciding(false);
    }
  };

  if (!user) {
    return (
      <Shell title={t("metaTitle")}>
        <h1 className="font-display text-h3 text-fg">{t("signInTitle")}</h1>
        <p className="mt-2 text-body-sm text-fg-muted">{t("signInBody")}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link to="/auth" className={`${primaryButton} flex-1`}>
            {t("signIn")}
          </Link>
          <Link to="/auth?mode=register" className={`${secondaryButton} flex-1`}>
            {t("createAccount")}
          </Link>
        </div>
      </Shell>
    );
  }

  if (failed) {
    return (
      <Shell title={t("metaTitle")}>
        <div className="flex gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <h1 className="text-body font-semibold text-fg">{t("errorTitle")}</h1>
            <p className="mt-1 text-body-sm text-fg-muted">{t("errorGeneric")}</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (!info) {
    return (
      <Shell title={t("metaTitle")}>
        <p className="py-6 text-center text-body-sm text-fg-subtle">{t("working")}</p>
      </Shell>
    );
  }

  return (
    <Shell title={t("metaTitle")}>
      <h1 className="font-display text-h3 text-fg [overflow-wrap:anywhere]">{t("title", { app: info.appName })}</h1>
      <p className="mt-1 text-body-sm text-fg-subtle [overflow-wrap:anywhere]">{t("signedInAs", { email: user.email ?? "" })}</p>

      <p className="mt-5 text-body-sm font-medium text-fg">{t("canTitle")}</p>
      <ul className="mt-2 space-y-1.5">
        {[t("canChatbots"), t("canQuestions")].map((line) => (
          <li key={line} className="flex gap-2 text-body-sm text-fg-muted">
            <Check size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {line}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-body-sm font-medium text-fg">{t("cannotTitle")}</p>
      <ul className="mt-2 space-y-1.5">
        {[t("cannotBilling"), t("cannotDelete")].map((line) => (
          <li key={line} className="flex gap-2 text-body-sm text-fg-muted">
            <X size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
            {line}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-lg bg-ink-30 p-3 text-caption text-fg-muted dark:bg-ink-875">
        <p className="[overflow-wrap:anywhere]">
          {info.local ? t("returnsLocal") : t("returnsTo", { place: info.returnsTo })}
        </p>
        <p className="mt-1">{t("warning")}</p>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
        <button type="button" disabled={deciding} onClick={() => void decide(false)} className={`${secondaryButton} flex-1`}>
          {t("cancel")}
        </button>
        <button type="button" disabled={deciding} onClick={() => void decide(true)} className={`${primaryButton} flex-1`}>
          {deciding ? t("working") : t("allow")}
        </button>
      </div>
      <p className="mt-3 text-center text-caption text-fg-subtle">{t("revokeHint")}</p>
    </Shell>
  );
};

export default OAuthAuthorize;
