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
    <div className="min-h-screen bg-[#E7EDF6] dark:bg-[#141D2B]">
      <div className="w-full lg:w-[80%] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl font-medium mt-8 mb-6 dark:text-[#E7EDF6]">
          Profile
        </h1>
        <div className="bg-[#F9FCFF] shadow-md rounded-lg p-6 dark:bg-[#1A2533]">
          <div className="mb-4">
            <label className="block text-[#243040] text-sm font-bold mb-2 dark:text-[#E7EDF6]">
              Email
            </label>
            <p className="text-[#566273] dark:text-[#E7EDF6]">{user?.email}</p>
          </div>
          <div className="mb-4">
            <label className="block text-[#243040] text-sm font-bold mb-2 dark:text-[#E7EDF6]">
              Name
            </label>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-[#243040] leading-tight focus:outline-none focus:shadow-outline dark:bg-[#243040] dark:text-[#E7EDF6] dark:border-[#566273]"
              />
            ) : (
              <p className="text-[#566273] dark:text-[#E7EDF6]">
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
              className="bg-[#647184] hover:bg-[#566273] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
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
            confirmButtonClass="bg-[#101723] text-white hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6]"
          >
            <p>Are you sure you want to update your profile?</p>
          </ConfirmationModal>
        </div>
      </div>
    </div>
  );
};

export default Profile;
