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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Helmet>
        <title>Settings | Askio Chatbot</title>
        <meta
          name="description"
          content="Manage your Askio Chatbot account settings and preferences."
        />
      </Helmet>
      <div className="w-full lg:w-[80%] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* User Profile Card */}
        <Card className="bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            User Profile
          </h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-100">
              Email
            </label>
            <p className="text-gray-600 dark:text-gray-100">{email}</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-100">
              Name
            </label>
            {editing ? (
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-100">
                {name || "Not set"}
              </p>
            )}
          </div>
          {editing ? (
            <Button
              onClick={updateModal.openModal}
              className="bg-[#aab2ff] hover:bg-[#8e98ff] text-black dark:text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
              icon={Save}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              onClick={() => setEditing(true)}
              className="bg-[#aab2ff] hover:bg-[#8e98ff] text-black dark:text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
              icon={Edit2}
            >
              Edit Profile
            </Button>
          )}
        </Card>

        {/* Appearance Card */}
        <Card className="bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-100">Dark Mode</span>
            <Button
              onClick={toggleDarkMode}
              className={`${
                darkMode
                  ? "bg-[#aab2ff] hover:bg-[#8e98ff]"
                  : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              } text-black dark:text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center`}
              icon={darkMode ? Sun : Moon}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </Card>

        {/* Security Card */}
        <Card className="bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Security
          </h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700 dark:text-gray-100">
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
                className="bg-[#aab2ff] hover:bg-[#8e98ff] text-black dark:text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                icon={Lock}
              >
                Update
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-100">
              Delete Account
            </span>
            <Button
              onClick={deleteAccountModal.openModal}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
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
          confirmButtonClass="bg-[#aab2ff] text-black hover:bg-[#8e98ff] dark:text-white"
        >
          <p>Are you sure you want to update your profile?</p>
        </ConfirmationModal>

        {/* Change Password Modal */}
        <ConfirmationModal
          isOpen={changePasswordModal.isOpen}
          onClose={changePasswordModal.closeModal}
          onConfirm={handleChangePassword}
          title="Change Password"
          confirmText="Change Password"
          cancelText="Cancel"
          confirmButtonClass="bg-[#aab2ff] text-black hover:bg-[#8e98ff] dark:text-white"
        >
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
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
          confirmButtonClass="bg-red-500 text-white hover:bg-red-600"
        >
          <p className="mb-4">
            Are you sure you want to delete your account? This action cannot be
            undone.
          </p>
          {!isGoogleAccount && (
            <Input
              type="password"
              placeholder="Enter your password to confirm"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
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
