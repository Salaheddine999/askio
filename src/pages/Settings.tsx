import React, { useEffect, useState } from "react";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import {
  User,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  AlertTriangle,
  Check,
  CreditCard,
  ExternalLink,
  KeyRound,
  LogOut,
  LucideIcon,
  Monitor,
  Moon,
  Sun,
  Trash2,
  UserRound,
} from "../components/icons";
import ConfirmationModal from "../components/ConfirmationModal";
import AiUsageMeter from "../components/AiUsageMeter";
import { useModal } from "../hooks/useModal";
import { toast } from "react-hot-toast";
import { reportClientError } from "../utils/monitoring";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FormPageSkeleton } from "../components/Skeleton";
import { redirectToBillingPortal, redirectToProCheckout } from "../utils/billing";
import { PRO_AI_REPLY_LIMIT, PRO_PRICE } from "../utils/pricing";
import { focusRing, primaryButton, secondaryButton, surface } from "./dashboard/ui";
import type { Suspension } from "../hooks/useSuspension";
import { useLanguage, useT } from "../i18n";
import LanguageSelect from "../components/LanguageSelect";
import { Switch } from "../components/editor/controls";
import { pushState, turnOffPush, turnOnPush, type PushState } from "../utils/push";
import { settingsMessages } from "../i18n/messages/settings";
import { reviewEmailHref } from "../utils/support";
import { ProIcon } from "../components/icons";

type Plan = "free" | "pro" | "enterprise";

type SettingsKey = keyof typeof settingsMessages.en;

const SECTIONS: { id: string; label: SettingsKey; icon: LucideIcon }[] = [
  { id: "profile", label: "sectionProfile", icon: UserRound },
  { id: "billing", label: "sectionBilling", icon: CreditCard },
  { id: "appearance", label: "sectionAppearance", icon: Monitor },
  { id: "security", label: "sectionSecurity", icon: KeyRound },
  { id: "danger", label: "sectionDanger", icon: Trash2 },
];

const inputClass =
  "h-10 w-full rounded-lg border border-ink-120 bg-ink-25 px-3 text-body-sm text-ink-900 placeholder:text-ink-425 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10 disabled:opacity-60 dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130 dark:focus:border-ink-325 dark:focus:ring-ink-130/10";

const Section: React.FC<{ id: string; title: string; description: string; children: React.ReactNode; tone?: "danger" }> = ({
  id,
  title,
  description,
  children,
  tone,
}) => (
  <section
    id={id}
    className={`scroll-mt-6 ${surface} ${tone === "danger" ? "border-red-200 dark:border-red-900/50" : ""}`}
  >
    <div className="border-b border-ink-70 px-5 py-4 sm:px-6 dark:border-ink-780">
      <h2 className={`text-body font-semibold ${tone === "danger" ? "text-red-600 dark:text-red-400" : "text-ink-900 dark:text-ink-70"}`}>
        {title}
      </h2>
      <p className="mt-0.5 text-body-sm text-fg-subtle">{description}</p>
    </div>
    <div className="divide-y divide-ink-70 dark:divide-ink-780">{children}</div>
  </section>
);

const Row: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div className="min-w-0">
      <p className="text-body-sm font-medium text-fg">{label}</p>
      {hint && <p className="mt-0.5 text-caption text-fg-subtle">{hint}</p>}
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
  </div>
);

interface SettingsProps {
  toggleSidebar: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  /** Set while the account is suspended: upgrading is off, billing and deletion stay. */
  suspension?: Suspension | null;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, setDarkMode, suspension }) => {
  const { lang, setLang } = useLanguage();
  const t = useT(settingsMessages);
  const navigate = useNavigate();
  const deleteAccountModal = useModal();
  const [user, setUser] = useState<User | null>(null);
  const [emailAlerts, setEmailAlerts] = useState({ leads: true, missedChats: true, setup: true });
  const [push, setPush] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    void pushState().then(setPush, () => setPush("unsupported"));
  }, []);
  const togglePush = async (on: boolean) => {
    const current = auth.currentUser;
    if (!current) return;
    setPushBusy(true);
    try {
      setPush(on ? await turnOnPush(current.uid) : await turnOffPush(current.uid));
    } catch (error) {
      console.error("Couldn't change push notifications:", error);
      reportClientError(error, { area: "push" });
      // The browser's own reason, so a failure on a phone can be told apart.
      const reason = error instanceof Error ? error.message : "";
      toast.error(reason ? `${t("pushFailed")} (${reason.slice(0, 120)})` : t("pushFailed"));
    } finally {
      setPushBusy(false);
    }
  };
  const saveEmailAlert = async (type: "leads" | "missedChats" | "setup", on: boolean) => {
    const user = auth.currentUser;
    if (!user) return;
    setEmailAlerts((current) => ({ ...current, [type]: on }));
    try {
      await updateDoc(doc(db, "users", user.uid), { [`emailAlerts.${type}`]: on });
    } catch {
      setEmailAlerts((current) => ({ ...current, [type]: !on }));
      toast.error(t("alertSaveFailed"));
    }
  };
  const [loading, setLoading] = useState(true);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [email, setEmail] = useState("");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [userPlan, setUserPlan] = useState<Plan>("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [billingActionLoading, setBillingActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || "");
        setIsGoogleAccount(currentUser.providerData.some((p) => p.providerId === "google.com"));
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() || {};
        const plan = (userData.plan || (userData.isPro ? "pro" : "free")) as Plan;
        const displayName = userData.name || currentUser.displayName || "";
        setName(displayName);
        setSavedName(displayName);
        setUserPlan(plan);
        setSubscriptionStatus(userData.subscriptionStatus || (plan === "free" ? "inactive" : "active"));
        setCurrentPeriodEnd(userData.currentPeriodEnd || null);
        setEmailAlerts({
          leads: userData.emailAlerts?.leads !== false,
          missedChats: userData.emailAlerts?.missedChats !== false,
          setup: userData.emailAlerts?.setup !== false,
        });
        setHasSubscription(Boolean(userData.lemonSqueezySubscriptionId));
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveName = async () => {
    if (!user) return;
    const trimmed = name.trim();
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: trimmed });
      await updateDoc(doc(db, "users", user.uid), { name: trimmed });
      setName(trimmed);
      setSavedName(trimmed);
      toast.success(t("nameUpdated"));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("nameUpdateFailed"));
    } finally {
      setSavingName(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (newPassword.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(t("passwordsDontMatch"));
      return;
    }
    setSavingPassword(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await updatePassword(user, newPassword);
      toast.success(t("passwordChanged"));
      resetPasswordForm();
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(t("passwordChangeFailed"));
    } finally {
      setSavingPassword(false);
    }
  };

  const sendResetEmail = async () => {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(t("resetEmailSent", { email }));
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error(t("resetEmailFailed"));
    }
  };

  const handleSignOut = async () => {
    await signOut(auth).catch(() => undefined);
    navigate("/");
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      if (isGoogleAccount) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else if (user.email) {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, deletePassword));
      }
      // The server removes every record tied to the account (chatbots,
      // visitor data, usage, integrations) and then the login itself.
      const token = await user.getIdToken(true);
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || t("deleteFailed"));

      await signOut(auth).catch(() => undefined);
      toast.success(t("accountDeleted"));
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error && error.message ? error.message : t("deleteFailedRetry"));
    } finally {
      setDeleting(false);
    }
  };

  const runBillingAction = async (action: () => Promise<void>, failure: string) => {
    setBillingActionLoading(true);
    try {
      await action();
    } catch (error) {
      console.error("Billing action failed:", error);
      toast.error(error instanceof Error && error.message ? `${failure} ${error.message}` : failure);
    } finally {
      setBillingActionLoading(false);
    }
  };

  // Links like /settings#emails land on that section once it has rendered.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!loading && id) document.getElementById(id)?.scrollIntoView();
  }, [loading]);

  if (loading) return <FormPageSkeleton />;

  const initials = (savedName || email || "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const periodEndLabel =
    periodEnd && !Number.isNaN(periodEnd.getTime())
      ? periodEnd.toLocaleDateString(t.lang, { year: "numeric", month: "long", day: "numeric" })
      : null;
  const isPaid = userPlan !== "free";
  const cancelled = subscriptionStatus === "cancelled" || subscriptionStatus === "expired";
  const statusTone = ["active", "on_trial", "trialing"].includes(subscriptionStatus)
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/25 dark:text-emerald-400"
    : ["paused", "past_due", "unpaid", "cancelled"].includes(subscriptionStatus)
      ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/25 dark:text-amber-400"
      : "bg-ink-70 text-ink-605 ring-ink-605/15 dark:bg-ink-805 dark:text-ink-325";
  const statusKey = `status_${subscriptionStatus || "inactive"}`;
  const statusLabel =
    statusKey in settingsMessages.en
      ? t(statusKey as SettingsKey)
      : String(subscriptionStatus || "inactive")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
  const planLabel = userPlan === "pro" ? "Pro" : userPlan === "enterprise" ? "Enterprise" : t("planFree");

  return (
    <div className="min-h-screen bg-ink-30 font-sans text-ink-900 dark:bg-ink-875">
      <Helmet>
        <title>{t("metaTitle")}</title>
        <meta name="description" content={t("metaDescription")} />
      </Helmet>

      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header>
          <h1 className="font-display text-h2 tracking-tight text-ink-900 sm:text-h1 dark:text-ink-130">{t("title")}</h1>
          <p className="mt-1 text-body-sm text-fg-muted">{t("subtitle")}</p>
        </header>

        {suspension && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/30"
          >
            <p className="text-body-sm text-amber-900 dark:text-amber-200">
              <span className="font-medium">{t("suspendedBold")}</span> {t("suspendedText")}
            </p>
            <a href={reviewEmailHref(email)} className={`${secondaryButton} shrink-0 self-start sm:self-auto`}>
              {t("contactUs")}
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label={t("sectionsNav")} className="hidden lg:block">
            <div className="sticky top-6 space-y-0.5">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-sm transition-colors ${focusRing} ${
                    s.id === "danger"
                      ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      : "text-ink-605 hover:bg-ink-70/70 hover:text-ink-900 dark:text-ink-325 dark:hover:bg-ink-825 dark:hover:text-ink-130"
                  }`}
                >
                  <s.icon size={14} className="shrink-0 opacity-70" />
                  {t(s.label)}
                </a>
              ))}
            </div>
          </nav>

          <div className="min-w-0 max-w-3xl space-y-5">
            {/* Profile */}
            <Section id="profile" title={t("sectionProfile")} description={t("profileDescription")}>
              <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-black/5" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-900 text-body font-semibold text-white dark:bg-ink-130 dark:text-ink-875">
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-ink-900 dark:text-ink-70">{savedName || t("noName")}</p>
                  <p className="truncate text-body-sm text-fg-subtle">{email}</p>
                </div>
              </div>
              <form
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-end sm:px-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveName();
                }}
              >
                <label className="min-w-0 flex-1">
                  <span className="mb-1.5 block text-body-sm font-medium text-fg">{t("fullName")}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} className={inputClass} />
                </label>
                <div className="flex gap-2">
                  {name !== savedName && (
                    <button type="button" onClick={() => setName(savedName)} className={secondaryButton}>
                      {t("cancel")}
                    </button>
                  )}
                  <button type="submit" disabled={name.trim() === savedName || savingName} className={primaryButton}>
                    {savingName ? t("saving") : t("save")}
                  </button>
                </div>
              </form>
              <Row label={t("email")} hint={t("emailHint")}>
                <span className="text-body-sm text-fg-muted">{email}</span>
              </Row>
            </Section>

            {/* Plan & billing */}
            <Section id="billing" title={t("sectionBilling")} description={t("billingDescription")}>
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-h3 text-ink-900 dark:text-ink-70">{planLabel}</span>
                    {isPaid && (
                      <span className={`rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset ${statusTone}`}>{statusLabel}</span>
                    )}
                  </div>
                  <p className="mt-1 text-body-sm text-fg-subtle">
                    {!isPaid
                      ? t("upgradePitch", { limit: PRO_AI_REPLY_LIMIT.toLocaleString(t.lang), price: `$${PRO_PRICE.monthly}` })
                      : cancelled && periodEndLabel
                        ? t("cancelledUntil", { plan: planLabel, date: periodEndLabel })
                        : periodEndLabel
                          ? t("renewsOn", { date: periodEndLabel })
                          : t("thanks")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!isPaid && !suspension && (
                    <button
                      type="button"
                      disabled={billingActionLoading}
                      onClick={() => runBillingAction(() => redirectToProCheckout(), t("checkoutFailed"))}
                      className={primaryButton}
                    >
                      <ProIcon size={15} />
                      {billingActionLoading ? t("opening") : t("upgradeToPro")}
                    </button>
                  )}
                  {(isPaid || hasSubscription) && (
                    <button
                      type="button"
                      disabled={billingActionLoading}
                      onClick={() => runBillingAction(() => redirectToBillingPortal(), t("billingFailed"))}
                      className={secondaryButton}
                    >
                      <ExternalLink size={15} />
                      {billingActionLoading ? t("opening") : t("manageBilling")}
                    </button>
                  )}
                </div>
              </div>
              {isPaid && (
                <div className="px-5 py-4 sm:px-6 [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-0 [&>div]:shadow-none">
                  <AiUsageMeter />
                </div>
              )}
            </Section>

            {/* Email alerts */}
            <Section id="emails" title={t("sectionEmails")} description={t("emailsDescription")}>
              <Row label={t("alertLeads")} hint={t("alertLeadsHint")}>
                <Switch checked={emailAlerts.leads} onChange={(v) => void saveEmailAlert("leads", v)} label={t("alertLeads")} />
              </Row>
              <Row label={t("alertMissed")} hint={t("alertMissedHint")}>
                <Switch checked={emailAlerts.missedChats} onChange={(v) => void saveEmailAlert("missedChats", v)} label={t("alertMissed")} />
              </Row>
              <Row label={t("alertSetup")} hint={t("alertSetupHint")}>
                <Switch checked={emailAlerts.setup} onChange={(v) => void saveEmailAlert("setup", v)} label={t("alertSetup")} />
              </Row>
              <Row
                label={t("pushTitle")}
                hint={
                  push === "blocked"
                    ? t("pushBlocked")
                    : push === "unsupported"
                      ? t("pushUnsupported")
                      : push === "unconfigured"
                        ? t("pushUnconfigured")
                        : t("pushHint")
                }
              >
                <Switch
                  checked={push === "on"}
                  onChange={(v) => void togglePush(v)}
                  label={t("pushTitle")}
                  disabled={pushBusy || push === null || push === "unsupported" || push === "unconfigured" || push === "blocked"}
                />
              </Row>
            </Section>

            {/* Appearance */}
            <Section id="appearance" title={t("sectionAppearance")} description={t("appearanceDescription")}>
              <Row label={t("language")} hint={t("languageHint")}>
                <LanguageSelect value={lang} onChange={setLang} label={t("language")} size="sm" className="w-48" />
              </Row>
              <Row label={t("theme")} hint={t("themeHint")}>
                <div
                  role="radiogroup"
                  aria-label={t("theme")}
                  className="inline-flex h-9 items-center rounded-lg border border-ink-120 bg-ink-30 p-0.5 dark:border-ink-780 dark:bg-ink-875"
                >
                  {[
                    { dark: false, label: t("light"), icon: Sun },
                    { dark: true, label: t("dark"), icon: Moon },
                  ].map((option) => {
                    const active = darkMode === option.dark;
                    return (
                      <button
                        key={String(option.dark)}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDarkMode(option.dark)}
                        className={`flex h-full items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors ${focusRing} ${
                          active
                            ? "bg-ink-25 text-ink-900 shadow-sm dark:bg-ink-790 dark:text-ink-130"
                            : "text-ink-545 hover:text-ink-900 dark:text-ink-425 dark:hover:text-ink-130"
                        }`}
                      >
                        <option.icon size={14} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </Row>
            </Section>

            {/* Sign-in & security */}
            <Section id="security" title={t("sectionSecurity")} description={t("securityDescription")}>
              <Row
                label={t("signInMethod")}
                hint={isGoogleAccount ? t("signInGoogleHint") : t("signInEmailHint")}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-70 px-2.5 py-1 text-caption font-medium text-ink-805 dark:bg-ink-805 dark:text-ink-130">
                  <Check size={12} />
                  {isGoogleAccount ? "Google" : t("methodEmail")}
                </span>
              </Row>
              {!isGoogleAccount && (
                <div className="px-5 py-4 sm:px-6">
                  {!passwordOpen ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-body-sm font-medium text-fg">{t("password")}</p>
                        <p className="mt-0.5 text-caption text-fg-subtle">{t("passwordHint")}</p>
                      </div>
                      <button type="button" onClick={() => setPasswordOpen(true)} className={secondaryButton}>
                        <KeyRound size={15} />
                        {t("changePassword")}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <p className="text-body-sm font-medium text-fg">{t("changePassword")}</p>
                      <input
                        type="password"
                        autoComplete="current-password"
                        placeholder={t("currentPassword")}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={inputClass}
                        required
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder={t("newPassword")}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={inputClass}
                          required
                        />
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder={t("confirmNewPassword")}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className={inputClass}
                          required
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={sendResetEmail}
                          className={`rounded text-caption font-medium text-ink-605 underline-offset-2 hover:text-ink-900 hover:underline dark:text-ink-325 dark:hover:text-ink-130 ${focusRing}`}
                        >
                          {t("forgotCurrent")}
                        </button>
                        <div className="flex gap-2">
                          <button type="button" onClick={resetPasswordForm} className={secondaryButton}>
                            {t("cancel")}
                          </button>
                          <button type="submit" disabled={savingPassword} className={primaryButton}>
                            {savingPassword ? t("saving") : t("updatePassword")}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
              <Row label={t("signOut")} hint={t("signOutHint")}>
                <button type="button" onClick={handleSignOut} className={secondaryButton}>
                  <LogOut size={15} />
                  {t("signOut")}
                </button>
              </Row>
            </Section>

            {/* Danger zone */}
            <Section id="danger" title={t("sectionDanger")} description={t("dangerDescription")} tone="danger">
              <Row
                label={t("deleteYourAccount")}
                hint={t("deleteHint")}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDeletePassword("");
                    deleteAccountModal.openModal();
                  }}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-ink-25 px-3.5 text-button text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30 ${focusRing}`}
                >
                  <Trash2 size={15} />
                  {t("deleteAccount")}
                </button>
              </Row>
            </Section>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteAccountModal.isOpen}
        onClose={deleteAccountModal.closeModal}
        onConfirm={deleting ? undefined : deleteAccount}
        title={t("deleteAccount")}
        confirmText={deleting ? t("deleting") : t("deletePermanently")}
        cancelText={t("cancel")}
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md"
      >
        <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-body-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            {t("deleteWarning")}
          </p>
        </div>
        {isGoogleAccount ? (
          <p className="mt-3 text-body-sm text-fg-muted">{t("confirmWithGoogle")}</p>
        ) : (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-body-sm font-medium text-fg">{t("enterPasswordToConfirm")}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
      </ConfirmationModal>
    </div>
  );
};

export default Settings;
