import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { User } from "@supabase/supabase-js";
import { Edit2, Save } from "lucide-react";

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    setName(user?.user_metadata?.name || "");
    setLoading(false);
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name },
      });

      if (error) throw error;

      setEditing(false);
      fetchUser();
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-3xl font-medium mb-6 dark:text-gray-100">Profile</h1>
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
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-100">
              {name || "Not set"}
            </p>
          )}
        </div>
        {editing ? (
          <button
            onClick={updateProfile}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
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
      </div>
    </div>
  );
};

export default Profile;
