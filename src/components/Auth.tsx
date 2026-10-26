import brandLogo from "../assets/logo.svg";
import React, { useState } from "react";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { redirectToProCheckout } from "../utils/billing";
import { useT } from "../i18n";
import { authMessages } from "../i18n/messages/auth";

const Auth: React.FC = () => {
  const t = useT(authMessages);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /** New accounts go to the guided first-chatbot setup; returning ones to the dashboard. */
  const handlePostAuthRedirect = async (isNewAccount = false) => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");

    if (next === "pro-checkout") {
      await redirectToProCheckout(params.get("interval") === "yearly" ? "yearly" : "monthly");
      return;
    }

    navigate(isNewAccount ? "/start" : "/dashboard");
  };

  const switchMode = (next: "login" | "register" | "reset") => {
    setMode(next);
    setError(null);
    setResetSent(false);
  };

  // Firebase sends the reset email. The result looks the same whether or not the
  // address has an account, so this form can't be used to find out who's signed up.
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      try {
        await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/auth` });
      } catch (err: unknown) {
        const code = (err as { code?: string }).code || "";
        // The return link needs an authorised domain; without it, send a plain reset email.
        if (code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
          await sendPasswordResetEmail(auth, email);
        } else {
          throw err;
        }
      }
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      if (code === "auth/user-not-found") {
        setResetSent(true);
      } else if (code === "auth/invalid-email") {
        setError(t("errorInvalidEmail"));
      } else if (code === "auth/too-many-requests") {
        setError(t("errorTooManyReset"));
      } else {
        setError(t("errorResetFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        await handlePostAuthRedirect();
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email?.toLowerCase() || "",
          name: "",
          createdAt: new Date(),
          aiScansCount: 0,
          isPro: false,
          plan: "free",
          subscriptionStatus: "inactive",
          aiChatbotLimit: 0,
          // New accounts keep the language they signed up in, on every device.
          language: t.lang,
        });
        toast.success(t("registered"));
        await handlePostAuthRedirect(true);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      const messages: Record<string, string> = {
        "auth/invalid-credential": t("errorInvalidCredential"),
        "auth/user-not-found": t("errorUserNotFound"),
        "auth/wrong-password": t("errorWrongPassword"),
        "auth/email-already-in-use": t("errorEmailInUse"),
        "auth/weak-password": t("errorWeakPassword"),
        "auth/invalid-email": t("errorInvalidEmail"),
        "auth/too-many-requests": t("errorTooMany"),
      };
      setError(messages[code] || t("errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const isNewAccount = !userDoc.exists();
      if (isNewAccount) {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email?.toLowerCase() || "",
          name: userCredential.user.displayName || "",
          createdAt: new Date(),
          aiScansCount: 0,
          isPro: false,
          plan: "free",
          subscriptionStatus: "inactive",
          aiChatbotLimit: 0,
          // New accounts keep the language they signed up in, on every device.
          language: t.lang,
        });
      }
      await handlePostAuthRedirect(isNewAccount);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F7FC] dark:bg-[#141D2B] px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[380px]"
      >
        {/* Brand */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={brandLogo} alt="Askio" className="w-7 h-7 dark:brightness-0 dark:invert" />
          <span className="text-lg font-medium font-sans text-[#101723] dark:text-[#D7DFE5] tracking-tight">
            Askio
          </span>
        </Link>

        {/* Card */}
        <div className="bg-[#F9FCFF] dark:bg-[#1A2533] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_-10px_rgba(0,0,0,0.08)] dark:shadow-none border border-[rgba(16,23,35,0.06)] dark:border-[#2B3646] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "register" ? 8 : -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "register" ? -8 : 8 }}
                transition={{ duration: 0.15 }}
              >
                <h2 className="text-xl font-serif text-[#101723] dark:text-[#D7DFE5] tracking-tight">
                  {mode === "login" ? t("welcomeBack") : mode === "register" ? t("createAccountTitle") : t("resetTitle")}
                </h2>
                <p className="text-[13px] text-[#647184] dark:text-[#9BAABD] mt-1">
                  {mode === "login"
                    ? t("loginSubtitle")
                    : mode === "register"
                      ? t("registerSubtitle")
                      : t("resetSubtitle")}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                >
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg px-3 py-2.5 flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-[13px] text-red-700 dark:text-red-400 leading-snug">
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mode !== "reset" && (
              <>
            {/* Google OAuth */}
            <button
              onClick={handleOAuth}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-[#D8DFE9] dark:border-[#2B3646] rounded-xl bg-[#F9FCFF] dark:bg-[#141D2B] text-[#101723] dark:text-[#D7DFE5] text-[13px] font-medium hover:bg-[#F3F7FC] dark:hover:bg-[#1A2533] hover:border-[#D7DFE5] dark:hover:border-[#39485B] transition-all duration-200 group"
            >
              <svg
                className="h-4 w-4 mr-2.5 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("continueWithGoogle")}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D8DFE9] dark:border-[#2B3646]" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="px-2.5 bg-[#F9FCFF] dark:bg-[#1A2533] text-[#647184] dark:text-[#9BAABD] font-medium uppercase tracking-wider">
                  {t("or")}
                </span>
              </div>
            </div>
              </>
            )}

            {mode === "reset" && resetSent ? (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[14px] font-medium text-[#101723] dark:text-[#D7DFE5]">{t("checkInbox")}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#647184] dark:text-[#9BAABD]">
                  {t("resetSentBefore")} <span className="font-medium text-[#101723] dark:text-[#D7DFE5]">{email}</span>
                  {t("resetSentAfter")}
                </p>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="mt-5 w-full rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] px-4 py-2.5 text-[13px] font-medium text-[#101723] transition-colors hover:bg-[#F3F7FC] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5] dark:hover:bg-[#1A2533]"
                >
                  {t("backToSignIn")}
                </button>
              </div>
            ) : (
            <form onSubmit={mode === "reset" ? handleReset : handleAuth} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold text-[#566273] dark:text-[#9BAABD] mb-1 uppercase tracking-wider"
                >
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D8DFE9] dark:border-[#2B3646] rounded-xl focus:ring-2 focus:ring-[#101723]/15 dark:focus:ring-[#D7DFE5]/15 focus:border-[#101723] dark:focus:border-[#D7DFE5] transition-all duration-200 bg-[#F3F7FC] dark:bg-[#141D2B] text-[#101723] dark:text-[#D7DFE5] text-[13px] placeholder-[#647184] dark:placeholder-[#87909D] outline-none"
                />
              </div>

              {mode !== "reset" && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-semibold text-[#566273] dark:text-[#9BAABD] uppercase tracking-wider"
                  >
                    {t("password")}
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("reset")}
                      className="text-[12px] font-medium text-[#566273] hover:text-[#101723] hover:underline dark:text-[#9BAABD] dark:hover:text-[#D7DFE5]"
                    >
                      {t("forgotPassword")}
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D8DFE9] dark:border-[#2B3646] rounded-xl focus:ring-2 focus:ring-[#101723]/15 dark:focus:ring-[#D7DFE5]/15 focus:border-[#101723] dark:focus:border-[#D7DFE5] transition-all duration-200 bg-[#F3F7FC] dark:bg-[#141D2B] text-[#101723] dark:text-[#D7DFE5] text-[13px] placeholder-[#647184] dark:placeholder-[#87909D] outline-none"
                />
              </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#101723] dark:bg-[#D7DFE5] text-white dark:text-[#141D2B] py-2.5 px-4 rounded-xl text-[13px] font-medium hover:bg-[#243040] dark:hover:bg-[#E7EDF6] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] mt-1"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t("processing")}
                  </span>
                ) : (
                  <span>
                    {mode === "login" ? t("signInButton") : mode === "register" ? t("createAccount") : t("sendResetLink")}
                  </span>
                )}
              </button>
            </form>
            )}

            {mode === "reset" && !resetSent && (
              <p className="mt-4 text-center text-[11.5px] leading-relaxed text-[#647184] dark:text-[#9BAABD]">
                {t("googleResetHint")}
              </p>
            )}

            {/* Google sign-in can also create an account, so this shows on sign-in and sign-up. */}
            {mode !== "reset" && (
            <p className="mt-4 text-center text-[11.5px] leading-relaxed text-[#647184] dark:text-[#9BAABD]">
              {t("consentBefore")}{" "}
              <Link to="/terms" className="font-medium text-[#101723] underline underline-offset-2 hover:no-underline dark:text-[#D7DFE5]">
                {t("consentTerms")}
              </Link>{" "}
              {t("consentAnd")}{" "}
              <Link to="/privacy" className="font-medium text-[#101723] underline underline-offset-2 hover:no-underline dark:text-[#D7DFE5]">
                {t("consentPrivacy")}
              </Link>
              {t("consentAfter")}
            </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F3F7FC] dark:bg-[#141D2B] border-t border-[rgba(16,23,35,0.06)] dark:border-[#2B3646]">
            <p className="text-center text-[13px] text-[#647184] dark:text-[#9BAABD]">
              {mode === "reset" ? (
                <span>
                  {t("remembered")}{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-[#101723] dark:text-[#D7DFE5] font-semibold hover:underline"
                  >
                    {t("signIn")}
                  </button>
                </span>
              ) : mode === "login" ? (
                <span>
                  {t("noAccount")}{" "}
                  <button
                    onClick={() => switchMode("register")}
                    className="text-[#101723] dark:text-[#D7DFE5] font-semibold hover:underline"
                  >
                    {t("signUp")}
                  </button>
                </span>
              ) : (
                <span>
                  {t("haveAccount")}{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-[#101723] dark:text-[#D7DFE5] font-semibold hover:underline"
                  >
                    {t("signIn")}
                  </button>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Trust line */}
        <p className="mt-5 text-center text-[11px] text-[#647184] dark:text-[#9BAABD]">
          {t("trustLine")}
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
