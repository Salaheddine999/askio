import React, { useState, useEffect } from "react";
import { auth, db } from "../utils/firebase";
import { User, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Edit2, Save } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { useModal } from "../hooks/useModal";

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const updateModal = useModal();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setName(userDoc.data().name || "");
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
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full lg:w-[80%] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl font-medium mt-8 mb-6 dark:text-gray-100">
          Profile
        </h1>
        <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-100">
              Email
            </label>
            <p className="text-gray-600 dark:text-gray-100">{user?.email}</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-100">
              Name
            </label>
            {editing ? (
              <input
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
            <button
              onClick={updateModal.openModal}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <Save size={20} className="mr-2" />
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <Edit2 size={20} className="mr-2" />
              Edit Profile
            </button>
          )}
          <ConfirmationModal
            isOpen={updateModal.isOpen}
            onClose={updateModal.closeModal}
            onConfirm={updateUserProfile}
            title="Update Profile"
            confirmText="Update"
            cancelText="Cancel"
            confirmButtonClass="bg-[#aab2ff] text-black hover:bg-[#8e98ff] dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <p>Are you sure you want to update your profile?</p>
          </ConfirmationModal>
        </div>
      </div>
    </div>
  );
};

export default Profile;
