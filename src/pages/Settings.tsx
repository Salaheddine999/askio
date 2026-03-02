import React, { useState, useEffect } from "react";
import { auth, db } from "../utils/firebase";
import {
  User,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
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
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { useModal } from "../hooks/useModal";
import Input from "../components/Input";
import Button from "../components/Button";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Settings: React.FC<{ toggleSidebar: () => void }> = ({}) => {
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
        setName(userDoc.data().name || "");
        setEmail(currentUser.email || "");
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
        await deleteDoc(doc(db, "users", user.uid));
        await user.delete();
        toast.success("Account deleted successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    }
  };

  const getInitials = () => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "?";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F3] dark:bg-[#1C1917] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#37322F] dark:border-[#F5F5F4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] dark:bg-[#1C1917] font-sans text-[#37322F]">
      <Helmet>
        <title>Settings | Askio Chatbot</title>
        <meta
          name="description"
          content="Manage your Askio Chatbot account settings and preferences."
        />
      </Helmet>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8 lg:py-12 max-w-[1000px]">
        {/* Page Header */}
        <h1 className="text-3xl lg:text-4xl font-bold font-sans text-[#37322F] dark:text-[#F5F5F4] tracking-tight mb-8">
          Settings
        </h1>

        <div className="space-y-6">

          {/* ────────────────────────────────────────── */}
          {/* PROFILE SECTION                            */}
          {/* ────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#292524] rounded-xl border border-[#E0DEDB] dark:border-[#44403C] shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-2.5">
              <UserCircle size={18} className="text-[#605A57] dark:text-[#A8A29E]" />
              <h2 className="text-base font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                Profile
              </h2>
            </div>

            {/* Avatar + info row */}
            <div className="p-6">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center text-white dark:text-[#1C1917] text-xl font-bold shadow-sm shrink-0">
                  {getInitials()}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] truncate">
                    {name || "No name set"}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-[#605A57] dark:text-[#A8A29E]">
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
              <div className="border-t border-[#E0DEDB] dark:border-[#44403C] pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#37322F] dark:text-[#F5F5F4]">
                      Display Name
                    </p>
                    <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mt-0.5">
                      This is how your name appears across the platform.
                    </p>
                  </div>
                  {editing ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 sm:w-56 bg-white border border-[#E0DEDB] text-[#37322F] text-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-lg shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
                      />
                      <Button
                        onClick={updateModal.openModal}
                        className="bg-[#37322F] hover:bg-[#2a2522] text-white text-sm font-medium py-2 px-3 rounded-lg shadow-sm"
                        icon={Save}
                      >
                        Save
                      </Button>
                      <button
                        onClick={() => { setEditing(false); fetchUser(); }}
                        className="p-2 rounded-lg text-[#605A57] hover:text-[#37322F] hover:bg-[#F7F5F3] dark:text-[#A8A29E] dark:hover:text-[#F5F5F4] dark:hover:bg-[#44403C] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setEditing(true)}
                      className="bg-white border border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] text-sm font-medium py-2 px-4 rounded-lg shadow-sm dark:bg-[#44403C] dark:text-[#A8A29E] dark:border-[#57534E] dark:hover:bg-[#57534E] dark:hover:text-[#F5F5F4]"
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
          <div className="bg-white dark:bg-[#292524] rounded-xl border border-[#E0DEDB] dark:border-[#44403C] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-2.5">
              <Paintbrush size={18} className="text-[#605A57] dark:text-[#A8A29E]" />
              <h2 className="text-base font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                Appearance
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#37322F] dark:text-[#F5F5F4]">
                    Theme
                  </p>
                  <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mt-0.5">
                    Switch between light and dark mode.
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-9 w-[4.5rem] items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#37322F]/20 ${
                    darkMode
                      ? "bg-[#37322F]"
                      : "bg-[#E0DEDB]"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      darkMode ? "translate-x-9" : "translate-x-1"
                    }`}
                  >
                    {darkMode ? (
                      <Moon size={14} className="text-[#37322F]" />
                    ) : (
                      <Sun size={14} className="text-amber-500" />
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────── */}
          {/* SECURITY SECTION                           */}
          {/* ────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#292524] rounded-xl border border-[#E0DEDB] dark:border-[#44403C] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-2.5">
              <Shield size={18} className="text-[#605A57] dark:text-[#A8A29E]" />
              <h2 className="text-base font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                Security
              </h2>
            </div>

            <div className="divide-y divide-[#E0DEDB] dark:divide-[#44403C]">
              {/* Change password */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#37322F] dark:text-[#F5F5F4]">
                    Password
                  </p>
                  <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mt-0.5">
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
                    className="bg-white border border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] text-sm font-medium py-2 px-4 rounded-lg shadow-sm dark:bg-[#44403C] dark:text-[#A8A29E] dark:border-[#57534E] dark:hover:bg-[#57534E] dark:hover:text-[#F5F5F4]"
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
                  <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mt-0.5">
                    Permanently remove your account and all associated data. This cannot be undone.
                  </p>
                </div>
                <Button
                  onClick={deleteAccountModal.openModal}
                  className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm font-medium py-2 px-4 rounded-lg shadow-sm dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-950/40"
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
        confirmButtonClass="bg-[#37322F] text-white hover:bg-[#2a2522] shadow-md dark:text-white"
      >
        <p className="text-[#605A57] dark:text-gray-300">Are you sure you want to update your profile?</p>
      </ConfirmationModal>

      {/* Change Password Modal */}
      <ConfirmationModal
        isOpen={changePasswordModal.isOpen}
        onClose={changePasswordModal.closeModal}
        onConfirm={handleChangePassword}
        title="Change Password"
        confirmText="Change Password"
        cancelText="Cancel"
        confirmButtonClass="bg-[#37322F] text-white hover:bg-[#2a2522] shadow-md dark:text-white"
      >
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-lg shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
          />
          <Input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-lg shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
          />
          <Input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-lg shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
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
        <p className="mb-4 text-[#605A57] dark:text-gray-300">
          Are you sure you want to delete your account? This action cannot be
          undone.
        </p>
        {!isGoogleAccount && (
          <Input
            type="password"
            placeholder="Enter your password to confirm"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-lg shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
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
