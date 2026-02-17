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
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { useModal } from "../hooks/useModal";
import Card from "../components/Card";
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

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
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
      <div className="w-full lg:w-[80%] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* User Profile Card */}
        <Card className="bg-white dark:bg-[#292524] p-6 mb-6 shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] rounded-[9px] border-none">
          <h2 className="text-h3 font-semibold text-[#37322F] mb-4 dark:text-[#F5F5F4] font-sans">
            User Profile
          </h2>
          <div className="mb-4">
            <label className="block text-[#37322F] text-body-sm font-medium mb-2 dark:text-[#F5F5F4]">
              Email
            </label>
            <p className="text-[#605A57] dark:text-[#D6D3D1]">{email}</p>
          </div>
          <div className="mb-4">
            <label className="block text-[#37322F] text-body-sm font-medium mb-2 dark:text-[#F5F5F4]">
              Name
            </label>
            {editing ? (
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-body-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-[9px] shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
              />
            ) : (
              <p className="text-[#605A57] dark:text-[#D6D3D1]">
                {name || "Not set"}
              </p>
            )}
          </div>
          {editing ? (
            <Button
              onClick={updateModal.openModal}
              className="bg-[#37322F] hover:bg-[#2a2522] text-white text-button font-medium py-2 px-4 rounded-[9px] shadow-md flex items-center"
              icon={Save}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              onClick={() => setEditing(true)}
              className="bg-white border border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] text-button font-medium py-2 px-4 rounded-[9px] shadow-sm flex items-center"
              icon={Edit2}
            >
              Edit Profile
            </Button>
          )}
        </Card>

        {/* Appearance Card */}
        <Card className="bg-white dark:bg-[#292524] p-6 mb-6 shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] rounded-[9px] border-none">
          <h2 className="text-h3 font-semibold text-[#37322F] mb-4 dark:text-[#F5F5F4] font-sans">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-[#605A57] dark:text-[#D6D3D1]">Dark Mode</span>
            <Button
              onClick={toggleDarkMode}
              className={`${
                darkMode
                  ? "bg-[#37322F] text-white hover:bg-[#2a2522]"
                  : "bg-white border border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F]"
              } text-button font-medium py-2 px-4 rounded-[9px] shadow-sm flex items-center`}
              icon={darkMode ? Sun : Moon}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </Card>

        {/* Security Card */}
        <Card className="bg-white dark:bg-[#292524] p-6 mb-6 shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] rounded-[9px] border-none">
          <h2 className="text-h3 font-semibold text-[#37322F] mb-4 dark:text-[#F5F5F4] font-sans">
            Security
          </h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#605A57] dark:text-[#D6D3D1]">
              Change Password
            </span>
            {isGoogleAccount ? (
              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                <AlertCircle size={20} className="mr-2" />
                <span>Not available for Google accounts</span>
              </div>
            ) : (
              <Button
                onClick={changePasswordModal.openModal}
                className="bg-white border border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] text-button font-medium py-2 px-4 rounded-[9px] shadow-sm flex items-center"
                icon={Lock}
              >
                Update
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#605A57] dark:text-[#D6D3D1]">
              Delete Account
            </span>
            <Button
              onClick={deleteAccountModal.openModal}
              className="bg-white border border-red-200 text-red-600 hover:bg-red-50 text-button font-medium py-2 px-4 rounded-[9px] shadow-sm flex items-center"
              icon={Trash2}
            >
              Delete
            </Button>
          </div>
        </Card>

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
              className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-body-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-[9px] shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
            />
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-body-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-[9px] shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-body-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-[9px] shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
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
              className="w-full bg-white border border-[#E0DEDB] text-[#37322F] text-body-sm placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] rounded-[9px] shadow-sm py-2 px-3 dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] dark:placeholder-[#78716C]"
            />
          )}
          {isGoogleAccount && (
            <p className="text-yellow-600 dark:text-yellow-400">
              You will be redirected to Google to confirm your account deletion.
            </p>
          )}
        </ConfirmationModal>
      </div>
    </div>
  );
};
export default Settings;
