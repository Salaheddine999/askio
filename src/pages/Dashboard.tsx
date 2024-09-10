import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { Link } from "react-router-dom";
import { PostgrestError } from "@supabase/supabase-js";
import { PlusCircle, Edit2, Loader, Trash2 } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";

interface Chatbot {
  id: string;
  title: string;
  position: string;
}

const Dashboard: React.FC = () => {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async (retries = 3) => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("chatbot_configs")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      setChatbots(data || []);
      setLoading(false);
    } catch (err) {
      const error = err as PostgrestError;
      console.error(
        "Error fetching chatbots:",
        error.message,
        error.details,
        error.hint
      );
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        setTimeout(() => fetchChatbots(retries - 1), 1000);
      } else {
        setError(`Failed to fetch chatbots: ${error.message}`);
        setLoading(false);
      }
    }
  };

  const openDeleteModal = (id: string) => {
    setChatbotToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setChatbotToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const deleteChatbot = async () => {
    if (!chatbotToDelete) return;

    try {
      const { error } = await supabase
        .from("chatbot_configs")
        .delete()
        .eq("id", chatbotToDelete);

      if (error) throw error;

      setChatbots(chatbots.filter((chatbot) => chatbot.id !== chatbotToDelete));
    } catch (err) {
      const error = err as PostgrestError;
      console.error("Error deleting chatbot:", error);
      setError(`Failed to delete chatbot: ${error.message}`);
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-3xl font-bold text-indigo-900 mb-4 sm:mb-0">
          Your Chatbots
        </h2>
        <Link
          to="/configure"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center w-full sm:w-auto justify-center"
        >
          <PlusCircle size={20} className="mr-2" />
          Create New Chatbot
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin text-indigo-600" size={48} />
        </div>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => (
            <div
              key={chatbot.id}
              className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200 border border-indigo-100"
            >
              <h3 className="text-xl font-semibold mb-2 text-indigo-900">
                {chatbot.title}
              </h3>
              <p className="text-indigo-600 mb-4">
                Position: {chatbot.position}
              </p>
              <div className="flex justify-between items-center">
                <Link
                  to={`/configure/${chatbot.id}`}
                  className="text-indigo-600 hover:text-indigo-700 transition-colors duration-200 flex items-center"
                >
                  <Edit2 size={16} className="mr-2" />
                  Edit
                </Link>
                <button
                  onClick={() => openDeleteModal(chatbot.id)}
                  className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && chatbots.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No chatbots found. Create one to get started!
        </p>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteChatbot}
        title="Delete Chatbot"
        message="Are you sure you want to delete this chatbot? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Dashboard;
