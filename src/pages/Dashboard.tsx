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
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    fetchChatbots();
    checkIfNewUser();
  }, []);

  const checkIfNewUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_login")
        .eq("id", user.id)
        .single();

      if (data && data.first_login) {
        setIsNewUser(true);
        // Update the first_login flag
        await supabase
          .from("profiles")
          .update({ first_login: false })
          .eq("id", user.id);
      }
    }
  };

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
        setError(
          `Failed to fetch chatbots: ${error.message}. Please try refreshing the page or contact support if the issue persists.`
        );
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isNewUser && (
        <div
          className="bg-green-100 dark:bg-green-800 border-l-4 border-green-500 text-green-700 dark:text-green-200 p-4 mb-8 rounded-md"
          role="alert"
        >
          <p className="font-bold">Welcome to Askio Chatbot!</p>
          <p>
            Get started by creating your first chatbot. If you need help, check
            out our documentation.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-200 mb-4 sm:mb-0">
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
          <Loader
            className="animate-spin text-indigo-600 dark:text-indigo-400"
            size={48}
          />
        </div>
      )}
      {error && (
        <div
          className="bg-red-100 dark:bg-red-800 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mb-4 rounded-md"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => fetchChatbots()}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => (
            <div
              key={chatbot.id}
              className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200 border border-indigo-100 dark:border-indigo-800"
            >
              <h3 className="text-xl font-semibold mb-2 text-indigo-900 dark:text-indigo-200">
                {chatbot.title}
              </h3>
              <p className="text-indigo-600 dark:text-indigo-400 mb-4">
                Position: {chatbot.position}
              </p>
              <div className="flex justify-between items-center">
                <Link
                  to={`/configure/${chatbot.id}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200 flex items-center"
                >
                  <Edit2 size={16} className="mr-2" />
                  Edit
                </Link>
                <button
                  onClick={() => openDeleteModal(chatbot.id)}
                  className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200 flex items-center"
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
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          <p className="text-xl mb-4">
            No chatbots found. Create one to get started!
          </p>
          <Link
            to="/configure"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md transition-colors duration-200 inline-flex items-center"
          >
            <PlusCircle size={24} className="mr-2" />
            Create Your First Chatbot
          </Link>
        </div>
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
