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
  Sparkles,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import AiUsageMeter from "../components/AiUsageMeter";
import { useModal } from "../hooks/useModal";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FormPageSkeleton } from "../components/Skeleton";
import { redirectToBillingPortal, redirectToProCheckout } from "../utils/billing";
import { PRO_AI_REPLY_LIMIT, PRO_PRICE } from "../utils/pricing";
import { focusRing, primaryButton, secondaryButton, surface } from "./dashboard/ui";
import type { Suspension } from "../hooks/useSuspension";
import { reviewEmailHref } from "../utils/support";

type Plan = "free" | "pro" | "enterprise";

const SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "billing", label: "Plan & billing", icon: CreditCard },
  { id: "appearance", label: "Appearance", icon: Monitor },
  { id: "security", label: "Sign-in & security", icon: KeyRound },
  { id: "danger", label: "Delete account", icon: Trash2 },
];

const inputClass =
  "h-10 w-full rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] px-3 text-body-sm text-[#101723] placeholder:text-[#87909D] focus:border-[#101723] focus:outline-none focus:ring-2 focus:ring-[#101723]/10 disabled:opacity-60 dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5] dark:focus:border-[#9BAABD] dark:focus:ring-[#D7DFE5]/10";

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
    <div className="border-b border-[#E7EDF6] px-5 py-4 sm:px-6 dark:border-[#2B3646]">
      <h2 className={`text-body font-semibold ${tone === "danger" ? "text-red-600 dark:text-red-400" : "text-[#101723] dark:text-[#E7EDF6]"}`}>
        {title}
      </h2>
      <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">{description}</p>
    </div>
    <div className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">{children}</div>
  </section>
);

const Row: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div className="min-w-0">
      <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{label}</p>
      {hint && <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">{hint}</p>}
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
  const navigate = useNavigate();
  const deleteAccountModal = useModal();
  const [user, setUser] = useState<User | null>(null);
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
      toast.success("Name updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Couldn't update your name. Please try again.");
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
      toast.error("Your new password needs at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("The new passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await updatePassword(user, newPassword);
      toast.success("Password changed");
      resetPasswordForm();
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Couldn't change your password. Check your current password and try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  const sendResetEmail = async () => {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`We sent a reset link to ${email}`);
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error("Couldn't send the reset email. Please try again.");
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
      if (!response.ok) throw new Error(payload.error || "Failed to delete account.");

      await signOut(auth).catch(() => undefined);
      toast.success("Your account and all its data have been deleted");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error && error.message ? error.message : "Failed to delete account. Please try again.");
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
      ? periodEnd.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      : null;
  const isPaid = userPlan !== "free";
  const cancelled = subscriptionStatus === "cancelled" || subscriptionStatus === "expired";
  const statusTone = ["active", "on_trial", "trialing"].includes(subscriptionStatus)
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/25 dark:text-emerald-400"
    : ["paused", "past_due", "unpaid", "cancelled"].includes(subscriptionStatus)
      ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/25 dark:text-amber-400"
      : "bg-[#E7EDF6] text-[#566273] ring-[#566273]/15 dark:bg-[#243040] dark:text-[#9BAABD]";
  const statusLabel = String(subscriptionStatus || "inactive")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const planLabel = userPlan === "pro" ? "Pro" : userPlan === "enterprise" ? "Enterprise" : "Free";

  return (
    <div className="min-h-screen bg-[#F3F7FC] font-sans text-[#101723] dark:bg-[#141D2B]">
      <Helmet>
        <title>Settings | Askio</title>
        <meta name="description" content="Manage your Askio account, plan and preferences." />
      </Helmet>

      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header>
          <h1 className="font-serif text-h2 tracking-tight text-[#101723] sm:text-h1 dark:text-[#D7DFE5]">Settings</h1>
          <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">Your account, plan and preferences.</p>
        </header>

        {suspension && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/30"
          >
            <p className="text-body-sm text-amber-900 dark:text-amber-200">
              <span className="font-medium">Your account is suspended.</span> You can still manage billing or delete
              your account here. Everything else is paused.
            </p>
            <a href={reviewEmailHref(email)} className={`${secondaryButton} shrink-0 self-start sm:self-auto`}>
              Contact us
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label="Settings sections" className="hidden lg:block">
            <div className="sticky top-6 space-y-0.5">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-sm transition-colors ${focusRing} ${
                    s.id === "danger"
                      ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      : "text-[#566273] hover:bg-[#E7EDF6]/70 hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#1F2B3A] dark:hover:text-[#D7DFE5]"
                  }`}
                >
                  <s.icon size={14} className="shrink-0 opacity-70" />
                  {s.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="min-w-0 max-w-3xl space-y-5">
            {/* Profile */}
            <Section id="profile" title="Profile" description="How you appear in Askio.">
              <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-black/5" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#101723] text-body font-semibold text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-[#101723] dark:text-[#E7EDF6]">{savedName || "No name set"}</p>
                  <p className="truncate text-body-sm text-[#647184] dark:text-[#87909D]">{email}</p>
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
                  <span className="mb-1.5 block text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">Full name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
                </label>
                <div className="flex gap-2">
                  {name !== savedName && (
                    <button type="button" onClick={() => setName(savedName)} className={secondaryButton}>
                      Cancel
                    </button>
                  )}
                  <button type="submit" disabled={name.trim() === savedName || savingName} className={primaryButton}>
                    {savingName ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
              <Row label="Email" hint="Used to sign in and for account emails.">
                <span className="text-body-sm text-[#566273] dark:text-[#9BAABD]">{email}</span>
              </Row>
            </Section>

            {/* Plan & billing */}
            <Section id="billing" title="Plan & billing" description="Your subscription and AI usage. Payments are handled by Lemon Squeezy.">
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-h3 text-[#101723] dark:text-[#E7EDF6]">{planLabel}</span>
                    {isPaid && (
                      <span className={`rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset ${statusTone}`}>{statusLabel}</span>
                    )}
                  </div>
                  <p className="mt-1 text-body-sm text-[#647184] dark:text-[#87909D]">
                    {!isPaid
                      ? `Upgrade to Pro for AI replies (${PRO_AI_REPLY_LIMIT.toLocaleString()} a month), AI-generated FAQs and AI personas, from $${PRO_PRICE.monthly}/month.`
                      : cancelled && periodEndLabel
                        ? `Your subscription is cancelled. You keep ${planLabel} until ${periodEndLabel}.`
                        : periodEndLabel
                          ? `Renews on ${periodEndLabel}.`
                          : "Thanks for supporting Askio."}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!isPaid && !suspension && (
                    <button
                      type="button"
                      disabled={billingActionLoading}
                      onClick={() => runBillingAction(() => redirectToProCheckout(), "Couldn't open checkout right now.")}
                      className={primaryButton}
                    >
                      <Sparkles size={15} />
                      {billingActionLoading ? "Opening…" : "Upgrade to Pro"}
                    </button>
                  )}
                  {(isPaid || hasSubscription) && (
                    <button
                      type="button"
                      disabled={billingActionLoading}
                      onClick={() => runBillingAction(() => redirectToBillingPortal(), "Couldn't open billing right now.")}
                      className={secondaryButton}
                    >
                      <ExternalLink size={15} />
                      {billingActionLoading ? "Opening…" : "Manage billing"}
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

            {/* Appearance */}
            <Section id="appearance" title="Appearance" description="How Askio looks on this device.">
              <Row label="Theme" hint="Saved in this browser.">
                <div
                  role="radiogroup"
                  aria-label="Theme"
                  className="inline-flex h-9 items-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] p-0.5 dark:border-[#2B3646] dark:bg-[#141D2B]"
                >
                  {[
                    { dark: false, label: "Light", icon: Sun },
                    { dark: true, label: "Dark", icon: Moon },
                  ].map((t) => {
                    const active = darkMode === t.dark;
                    return (
                      <button
                        key={t.label}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDarkMode(t.dark)}
                        className={`flex h-full items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors ${focusRing} ${
                          active
                            ? "bg-[#F9FCFF] text-[#101723] shadow-sm dark:bg-[#273444] dark:text-[#D7DFE5]"
                            : "text-[#647184] hover:text-[#101723] dark:text-[#87909D] dark:hover:text-[#D7DFE5]"
                        }`}
                      >
                        <t.icon size={14} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </Row>
            </Section>

            {/* Sign-in & security */}
            <Section id="security" title="Sign-in & security" description="How you sign in to Askio.">
              <Row
                label="Sign-in method"
                hint={isGoogleAccount ? "You sign in with your Google account." : "You sign in with your email and a password."}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7EDF6] px-2.5 py-1 text-caption font-medium text-[#243040] dark:bg-[#243040] dark:text-[#D7DFE5]">
                  <Check size={12} />
                  {isGoogleAccount ? "Google" : "Email & password"}
                </span>
              </Row>
              {!isGoogleAccount && (
                <div className="px-5 py-4 sm:px-6">
                  {!passwordOpen ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">Password</p>
                        <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">Use at least 6 characters.</p>
                      </div>
                      <button type="button" onClick={() => setPasswordOpen(true)} className={secondaryButton}>
                        <KeyRound size={15} />
                        Change password
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">Change password</p>
                      <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={inputClass}
                        required
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={inputClass}
                          required
                        />
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Confirm new password"
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
                          className={`rounded text-caption font-medium text-[#566273] underline-offset-2 hover:text-[#101723] hover:underline dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] ${focusRing}`}
                        >
                          Forgot your current password? Email me a reset link
                        </button>
                        <div className="flex gap-2">
                          <button type="button" onClick={resetPasswordForm} className={secondaryButton}>
                            Cancel
                          </button>
                          <button type="submit" disabled={savingPassword} className={primaryButton}>
                            {savingPassword ? "Saving…" : "Update password"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
              <Row label="Sign out" hint="Sign out of Askio in this browser.">
                <button type="button" onClick={handleSignOut} className={secondaryButton}>
                  <LogOut size={15} />
                  Sign out
                </button>
              </Row>
            </Section>

            {/* Danger zone */}
            <Section id="danger" title="Delete account" description="Permanently remove your account and everything in it." tone="danger">
              <Row
                label="Delete your account"
                hint="Deletes your chatbots and all the leads, questions and analytics they collected, and cancels any subscription. This can't be undone."
              >
                <button
                  type="button"
                  onClick={() => {
                    setDeletePassword("");
                    deleteAccountModal.openModal();
                  }}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-[#F9FCFF] px-3.5 text-button text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30 ${focusRing}`}
                >
                  <Trash2 size={15} />
                  Delete account
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
        title="Delete account"
        confirmText={deleting ? "Deleting…" : "Delete permanently"}
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md"
      >
        <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-body-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            This permanently deletes your account, your chatbots and everything they collected (leads, questions, feedback
            and analytics), and cancels any active subscription. Chatbots embedded on your sites will stop working.
          </p>
        </div>
        {isGoogleAccount ? (
          <p className="mt-3 text-body-sm text-[#566273] dark:text-[#9BAABD]">You'll be asked to confirm with Google.</p>
        ) : (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">Enter your password to confirm</span>
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
