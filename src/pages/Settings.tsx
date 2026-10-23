import React, { useState, useEffect } from "react";
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
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Edit2,
  Save,
  Moon,
  Sun,
  Lock,
  Trash2,
  AlertCircle,
  Mail,
  UserCircle,
  X,
  Shield,
  Paintbrush,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { useModal } from "../hooks/useModal";
import Input from "../components/Input";
import Button from "../components/Button";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FormPageSkeleton } from "../components/Skeleton";
import { redirectToBillingPortal, redirectToProCheckout } from "../utils/billing";

const Settings: React.FC<{ toggleSidebar: () => void }> = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const updateModal = useModal();
  const deleteAccountModal = useModal();
  const changePasswordModal = useModal();
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "enterprise">("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [billingActionLoading, setBillingActionLoading] = useState(false);

  useEffect(() => {
    fetchUser();
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);
  }, []);

  const fetchUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setIsGoogleAccount(
        currentUser.providerData[0].providerId === "google.com"
      );
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const plan = (userData.plan || (userData.isPro ? "pro" : "free")) as
          | "free"
          | "pro"
          | "enterprise";
        setName(userData.name || "");
        setEmail(currentUser.email || "");
        setUserPlan(plan);
        setSubscriptionStatus(
          userData.subscriptionStatus ||
            (plan === "free" ? "inactive" : "active")
        );
        setCurrentPeriodEnd(userData.currentPeriodEnd || null);
        setHasSubscription(Boolean(userData.lemonSqueezySubscriptionId));
      }
    }
    setLoading(false);
  };

  const updateUserProfile = async () => {
    try {
      if (user) {
        await updateProfile(user, { displayName: name });
        await updateDoc(doc(db, "users", user.uid), { name });
      }
      setEditing(false);
      fetchUser();
      updateModal.closeModal();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  const handleChangePassword = async () => {
    if (isGoogleAccount) {
      toast.error("Password change is not available for Google accounts.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast.success("Password changed successfully");
        changePasswordModal.closeModal();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        "Failed to change password. Please check your current password."
      );
    }
  };

  const deleteAccount = async () => {
    try {
      if (user) {
        if (isGoogleAccount) {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
        } else if (user.email) {
          const credential = EmailAuthProvider.credential(
            user.email,
            currentPassword
          );
          await reauthenticateWithCredential(user, credential);
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
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error && error.message ? error.message : "Failed to delete account. Please try again.");
    }
  };

  const getInitials = () => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "?";
  };

  const formatPlanLabel = (plan: string) => {
    if (plan === "pro") return "Pro";
    if (plan === "enterprise") return "Enterprise";
    return "Free";
  };

  const formatStatusLabel = (status: string) =>
    String(status || "inactive")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatPeriodEndLabel = (value: string | null) => {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeClasses = (status: string) => {
    if (["active", "trialing", "on_trial"].includes(status)) {
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40";
    }

    if (["paused", "past_due", "unpaid"].includes(status)) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/40";
    }

    return "bg-[#E7EDF6] text-[#243040] border-[#D8DFE9] dark:bg-[#273444] dark:text-[#D7DFE5] dark:border-[#39485B]";
  };

  const handleManageBilling = async () => {
    try {
      setBillingActionLoading(true);
      await redirectToBillingPortal();
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error("Unable to open billing management right now.");
    } finally {
      setBillingActionLoading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    try {
      setBillingActionLoading(true);
      await redirectToProCheckout();
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast.error("Unable to open checkout right now.");
    } finally {
      setBillingActionLoading(false);
    }
  };

  if (loading) {
    return (
      <FormPageSkeleton />
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F7FC] dark:bg-[#141D2B] font-sans text-[#101723]">
      <Helmet>
        <title>Settings | Askio Chatbot</title>
        <meta
          name="description"
          content="Manage your Askio Chatbot account settings and preferences."
        />
      </Helmet>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8 lg:py-12 max-w-[1000px]">
        {/* Page Header */}
        <h1 className="text-3xl lg:text-4xl font-bold font-sans text-[#101723] dark:text-[#D7DFE5] tracking-tight mb-8">
          Settings
        </h1>

        <div className="space-y-6">

          {/* ────────────────────────────────────────── */}
          {/* PROFILE SECTION                            */}
          {/* ────────────────────────────────────────── */}
          <div className="bg-[#F9FCFF] dark:bg-[#1A2533] rounded-xl border border-[#D8DFE9] dark:border-[#2B3646] shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-[#D8DFE9] dark:border-[#2B3646] flex items-center gap-2.5">
              <UserCircle size={18} className="text-[#566273] dark:text-[#9BAABD]" />
              <h2 className="text-base font-semibold text-[#101723] dark:text-[#D7DFE5]">
                Profile
              </h2>
            </div>

            {/* Avatar + info row */}
            <div className="p-6">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#101723] dark:bg-[#D7DFE5] flex items-center justify-center text-white dark:text-[#141D2B] text-xl font-bold shadow-sm shrink-0">
                  {getInitials()}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-[#101723] dark:text-[#D7DFE5] truncate">
                    {name || "No name set"}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-[#566273] dark:text-[#9BAABD]">
                    <Mail size={13} />
                    <span className="truncate">{email}</span>
                  </div>
                  {isGoogleAccount && (
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40">
                      Google Account
                    </span>
                  )}
                </div>
              </div>

              {/* Edit name */}
              <div className="border-t border-[#D8DFE9] dark:border-[#2B3646] pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                      Display Name
                    </p>
                    <p className="text-sm text-[#566273] dark:text-[#9BAABD] mt-0.5">
                      This is how your name appears across the platform.
                    </p>
                  </div>
                  {editing ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 sm:w-56 bg-[#F9FCFF] border border-[#D8DFE9] text-[#101723] text-sm placeholder-[#647184] focus:ring-[#101723] focus:border-[#101723] rounded-lg shadow-sm py-2 px-3 dark:bg-[#273444] dark:text-[#D7DFE5] dark:border-[#39485B] dark:placeholder-[#87909D]"
                      />
                      <Button
                        onClick={updateModal.openModal}
                        className="bg-[#101723] hover:bg-[#243040] text-white text-sm font-medium py-2 px-3 rounded-lg shadow-sm"
                        icon={Save}
                      >
                        Save
                      </Button>
                      <button
                        onClick={() => { setEditing(false); fetchUser(); }}
                        className="p-2 rounded-lg text-[#566273] hover:text-[#101723] hover:bg-[#F3F7FC] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] dark:hover:bg-[#273444] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setEditing(true)}
                      className="bg-[#F9FCFF] border border-[#D8DFE9] text-[#566273] hover:bg-[#F3F7FC] hover:text-[#101723] text-sm font-medium py-2 px-4 rounded-lg shadow-sm dark:bg-[#273444] dark:text-[#9BAABD] dark:border-[#39485B] dark:hover:bg-[#39485B] dark:hover:text-[#D7DFE5]"
                      icon={Edit2}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────── */}
          {/* APPEARANCE SECTION                         */}
          {/* ────────────────────────────────────────── */}
          <div className="bg-[#F9FCFF] dark:bg-[#1A2533] rounded-xl border border-[#D8DFE9] dark:border-[#2B3646] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D8DFE9] dark:border-[#2B3646] flex items-center gap-2.5">
              <Paintbrush size={18} className="text-[#566273] dark:text-[#9BAABD]" />
              <h2 className="text-base font-semibold text-[#101723] dark:text-[#D7DFE5]">
                Appearance
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                    Theme
                  </p>
                  <p className="text-sm text-[#566273] dark:text-[#9BAABD] mt-0.5">
                    Switch between light and dark mode.
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-9 w-[4.5rem] items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#101723]/20 ${
                    darkMode
                      ? "bg-[#101723]"
                      : "bg-[#D8DFE9]"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F9FCFF] shadow-sm transition-transform duration-200 ${
                      darkMode ? "translate-x-9" : "translate-x-1"
                    }`}
                  >
                    {darkMode ? (
                      <Moon size={14} className="text-[#101723]" />
                    ) : (
                      <Sun size={14} className="text-[#566273]" />
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────── */}
          {/* SECURITY SECTION                           */}
          {/* ────────────────────────────────────────── */}
          <div className="bg-[#F9FCFF] dark:bg-[#1A2533] rounded-xl border border-[#D8DFE9] dark:border-[#2B3646] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D8DFE9] dark:border-[#2B3646] flex items-center gap-2.5">
              <CreditCard size={18} className="text-[#566273] dark:text-[#9BAABD]" />
              <h2 className="text-base font-semibold text-[#101723] dark:text-[#D7DFE5]">
                Billing
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                    Current Plan
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-[#D8DFE9] px-2.5 py-1 text-xs font-medium text-[#101723] dark:border-[#39485B] dark:text-[#D7DFE5]">
                      {formatPlanLabel(userPlan)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClasses(subscriptionStatus)}`}
                    >
                      {formatStatusLabel(subscriptionStatus)}
                    </span>
                  </div>
                </div>

                {userPlan === "free" ? (
                  <Button
                    onClick={handleUpgradeToPro}
                    disabled={billingActionLoading}
                    className="bg-[#101723] hover:bg-[#243040] text-white text-sm font-medium py-2 px-4 rounded-lg shadow-sm dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6]"
                    icon={CreditCard}
                  >
                    {billingActionLoading ? "Opening..." : "Upgrade to Pro"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleManageBilling}
                    disabled={billingActionLoading}
                    className="bg-[#F9FCFF] border border-[#D8DFE9] text-[#566273] hover:bg-[#F3F7FC] hover:text-[#101723] text-sm font-medium py-2 px-4 rounded-lg shadow-sm dark:bg-[#273444] dark:text-[#9BAABD] dark:border-[#39485B] dark:hover:bg-[#39485B] dark:hover:text-[#D7DFE5]"
                    icon={ExternalLink}
                  >
                    {billingActionLoading ? "Opening..." : "Manage Subscription"}
                  </Button>
                )}
              </div>

              <div className="rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] p-4 dark:border-[#2B3646] dark:bg-[#141D2B]">
                <p className="text-sm text-[#566273] dark:text-[#9BAABD]">
                  {userPlan === "free"
                    ? "You are currently on the free plan. Upgrade to unlock AI features and subscription billing."
                    : "You can review billing details, update payment information, or cancel your subscription from the billing portal."}
                </p>
                {formatPeriodEndLabel(currentPeriodEnd) && (
                  <p className="mt-2 text-sm text-[#101723] dark:text-[#D7DFE5]">
                    {["cancelled", "expired"].includes(subscriptionStatus)
                      ? `Access ends on ${formatPeriodEndLabel(currentPeriodEnd)}.`
                      : `Next billing date: ${formatPeriodEndLabel(currentPeriodEnd)}.`}
                  </p>
                )}
                {userPlan !== "free" && (
                  <p className="mt-2 text-xs text-[#647184] dark:text-[#9BAABD]">
                    Cancellation is handled securely through our billing portal.
                    {hasSubscription
                      ? " Your subscription can be canceled there at any time."
                      : " If your portal link is unavailable, contact support and we’ll help."}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#F9FCFF] dark:bg-[#1A2533] rounded-xl border border-[#D8DFE9] dark:border-[#2B3646] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D8DFE9] dark:border-[#2B3646] flex items-center gap-2.5">
              <Shield size={18} className="text-[#566273] dark:text-[#9BAABD]" />
              <h2 className="text-base font-semibold text-[#101723] dark:text-[#D7DFE5]">
                Security
              </h2>
            </div>

            <div className="divide-y divide-[#D8DFE9] dark:divide-[#2B3646]">
              {/* Change password */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                    Password
                  </p>
                  <p className="text-sm text-[#566273] dark:text-[#9BAABD] mt-0.5">
                    {isGoogleAccount
                      ? "Password management is handled by Google."
                      : "Update your password to keep your account secure."}
                  </p>
                </div>
                {isGoogleAccount ? (
                  <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle size={15} />
                    <span>Via Google</span>
                  </div>
                ) : (
                  <Button
                    onClick={changePasswordModal.openModal}
                    className="bg-[#F9FCFF] border border-[#D8DFE9] text-[#566273] hover:bg-[#F3F7FC] hover:text-[#101723] text-sm font-medium py-2 px-4 rounded-lg shadow-sm dark:bg-[#273444] dark:text-[#9BAABD] dark:border-[#39485B] dark:hover:bg-[#39485B] dark:hover:text-[#D7DFE5]"
                    icon={Lock}
                  >
                    Change Password
                  </Button>
                )}
              </div>

              {/* Delete account */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Delete Account
                  </p>
                  <p className="text-sm text-[#566273] dark:text-[#9BAABD] mt-0.5">
                    Permanently remove your account and all associated data. This cannot be undone.
                  </p>
                </div>
                <Button
                  onClick={deleteAccountModal.openModal}
                  className="bg-[#F9FCFF] border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm font-medium py-2 px-4 rounded-lg shadow-sm dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-950/40"
                  icon={Trash2}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Update Profile Modal */}
      <ConfirmationModal
        isOpen={updateModal.isOpen}
        onClose={updateModal.closeModal}
        onConfirm={updateUserProfile}
        title="Update Profile"
        confirmText="Update"
        cancelText="Cancel"
        confirmButtonClass="bg-[#101723] text-white hover:bg-[#243040] shadow-md dark:text-white"
      >
        <p className="text-[#566273] dark:text-[#D7DFE5]">Are you sure you want to update your profile?</p>
      </ConfirmationModal>

      {/* Change Password Modal */}
      <ConfirmationModal
        isOpen={changePasswordModal.isOpen}
        onClose={changePasswordModal.closeModal}
        onConfirm={handleChangePassword}
        title="Change Password"
        confirmText="Change Password"
        cancelText="Cancel"
        confirmButtonClass="bg-[#101723] text-white hover:bg-[#243040] shadow-md dark:text-white"
      >
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-[#F9FCFF] border border-[#D8DFE9] text-[#101723] text-sm placeholder-[#647184] focus:ring-[#101723] focus:border-[#101723] rounded-lg shadow-sm py-2 px-3 dark:bg-[#273444] dark:text-[#D7DFE5] dark:border-[#39485B] dark:placeholder-[#87909D]"
          />
          <Input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-[#F9FCFF] border border-[#D8DFE9] text-[#101723] text-sm placeholder-[#647184] focus:ring-[#101723] focus:border-[#101723] rounded-lg shadow-sm py-2 px-3 dark:bg-[#273444] dark:text-[#D7DFE5] dark:border-[#39485B] dark:placeholder-[#87909D]"
          />
          <Input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full bg-[#F9FCFF] border border-[#D8DFE9] text-[#101723] text-sm placeholder-[#647184] focus:ring-[#101723] focus:border-[#101723] rounded-lg shadow-sm py-2 px-3 dark:bg-[#273444] dark:text-[#D7DFE5] dark:border-[#39485B] dark:placeholder-[#87909D]"
          />
        </div>
      </ConfirmationModal>

      {/* Delete Account Modal */}
      <ConfirmationModal
        isOpen={deleteAccountModal.isOpen}
        onClose={deleteAccountModal.closeModal}
        onConfirm={deleteAccount}
        title="Delete Account"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md"
      >
        <p className="mb-4 text-[#566273] dark:text-[#D7DFE5]">
          This permanently deletes your account, your chatbots and everything they
          collected (leads, questions, feedback and analytics), and cancels any active
          subscription. Chatbots embedded on your sites will stop working. This cannot be undone.
        </p>
        {!isGoogleAccount && (
          <Input
            type="password"
            placeholder="Enter your password to confirm"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-[#F9FCFF] border border-[#D8DFE9] text-[#101723] text-sm placeholder-[#647184] focus:ring-[#101723] focus:border-[#101723] rounded-lg shadow-sm py-2 px-3 dark:bg-[#273444] dark:text-[#D7DFE5] dark:border-[#39485B] dark:placeholder-[#87909D]"
          />
        )}
        {isGoogleAccount && (
          <p className="text-yellow-600 dark:text-yellow-400">
            You will be redirected to Google to confirm your account deletion.
          </p>
        )}
      </ConfirmationModal>
    </div>
  );
};
export default Settings;
