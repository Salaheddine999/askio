import React, { useEffect, useState } from "react";
import { db, auth } from "../utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Edit2,
  LoaderCircle,
  Trash2,
  Bot,
  Search,
  ChevronRight,
  Info,
  Grid,
  List,
  Code,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { toast } from "react-hot-toast";
import { Transition } from "@headlessui/react";
import { useModal } from "../hooks/useModal";
import { motion } from "framer-motion";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import { format } from "date-fns";
import { useCollection } from "react-firebase-hooks/firestore";

interface Chatbot {
  id: string;
  title: string;
  position: string;
  createdAt: Date;
  lastUpdated: Date;
}

interface FeedbackCounts {
  positive: number;
  negative: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deleteModal = useModal();
  const embedModal = useModal();
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(
    null
  );
  const [feedbackCounts, setFeedbackCounts] = useState<{
    [key: string]: FeedbackCounts;
  }>({});
  const [feedbackSnapshot] = useCollection(query(collection(db, "feedback")));

  useEffect(() => {
    fetchChatbots();
    checkIfNewUser();
  }, []);

  useEffect(() => {
    if (feedbackSnapshot) {
      const newFeedbackCounts: { [key: string]: FeedbackCounts } = {};
      feedbackSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!newFeedbackCounts[data.chatbotId]) {
          newFeedbackCounts[data.chatbotId] = { positive: 0, negative: 0 };
        }
        if (data.isPositive) {
          newFeedbackCounts[data.chatbotId].positive++;
        } else {
          newFeedbackCounts[data.chatbotId].negative++;
        }
      });
      setFeedbackCounts(newFeedbackCounts);
    }
  }, [feedbackSnapshot]);

  const checkIfNewUser = async () => {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().first_login) {
        setIsNewUser(true);
        // Update the first_login flag
        await updateDoc(docRef, { first_login: false });
      }
    }
  };

  const fetchChatbots = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const q = query(
        collection(db, "chatbot_configs"),
        where("user_id", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const chatbotData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as Chatbot;
      });
      setChatbots(chatbotData);
    } catch (error) {
      console.error("Error fetching chatbots:", error);
      setError(
        `Failed to fetch chatbots: ${
          (error as Error).message
        }. Please try refreshing the page or contact support if the issue persists.`
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setChatbotToDelete(id);
    deleteModal.openModal();
  };

  const deleteChatbot = async () => {
    if (!chatbotToDelete) return;

    try {
      await deleteDoc(doc(db, "chatbot_configs", chatbotToDelete));
      setChatbots(chatbots.filter((chatbot) => chatbot.id !== chatbotToDelete));
      toast.success("Chatbot deleted successfully");
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      setError(`Failed to delete chatbot: ${(error as Error).message}`);
    } finally {
      deleteModal.closeModal();
    }
  };

  const openEmbedModal = (id: string) => {
    setSelectedChatbotId(id);
    embedModal.openModal();
  };

  const generateEmbedCode = (id: string) => {
    const scriptSrc = `${window.location.origin}/chatbot-embed.js`;
    return `<div id="chatbot-container"></div>
<script src="${scriptSrc}"></script>
<script>
  ChatbotEmbed.init("${id}", "${window.location.origin}");
</script>`;
  };

  const copyEmbedCode = () => {
    if (selectedChatbotId) {
      const embedCode = generateEmbedCode(selectedChatbotId);
      navigator.clipboard.writeText(embedCode).then(
        () => {
          toast.success("Embed code copied to clipboard!");
          embedModal.closeModal();
        },
        () => {
          toast.error("Failed to copy embed code.");
        }
      );
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const filteredChatbots = chatbots.filter((chatbot) =>
    chatbot.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <header className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Chatbot Dashboard
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            Manage and optimize your chatbots
          </p>
        </header>

        {isNewUser && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-8 border-l-4 border-indigo-500">
            <div className="flex items-start">
              <Info
                className="text-indigo-500 mr-4 mt-1 flex-shrink-0"
                size={24}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to Askio Chatbot
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Get started by creating your first chatbot. Our documentation
                  can help you make the most of our platform.
                </p>
                <Link
                  to="/docs"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  View Documentation
                  <ChevronRight
                    className="ml-2 -mr-1 h-5 w-5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-white">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Chatbots
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="relative w-full sm:w-64">
                  <Input
                    type="text"
                    placeholder="Search chatbots..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-gray-700"
                  />
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleViewMode}
                    className={`p-2 rounded-md ${
                      viewMode === "grid"
                        ? "bg-indigo-100 dark:bg-indigo-300"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={toggleViewMode}
                    className={`p-2 rounded-md ${
                      viewMode === "list"
                        ? "bg-indigo-100 dark:bg-indigo-300"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>
                <Button
                  onClick={() => navigate("/configure")}
                  className="bg-[#aab2ff] hover:bg-indigo-400 text-black"
                  icon={PlusCircle}
                >
                  Create New Chatbot
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <Transition
              show={loading}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="flex justify-center items-center h-64">
                <LoaderCircle
                  className="animate-spin text-indigo-600 dark:text-indigo-400"
                  size={48}
                />
              </div>
            </Transition>
            {error && (
              <div
                className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 p-4 mb-4 rounded-md"
                role="alert"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fetchChatbots()}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Retry
                </button>
              </div>
            )}
            <Transition
              show={!loading && !error}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className={`${
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }`}
              >
                {filteredChatbots.map((chatbot) => (
                  <Card
                    key={chatbot.id}
                    className={`overflow-hidden ${
                      viewMode === "list"
                        ? "flex flex-col sm:flex-row items-center"
                        : ""
                    }`}
                  >
                    <div
                      className={`p-6 space-y-4 ${
                        viewMode === "list" ? "flex-grow" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full">
                            <Bot
                              size={24}
                              className="text-indigo-600 dark:text-indigo-400"
                            />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {chatbot.title}
                          </h3>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(chatbot.createdAt, "MMM d, yyyy")}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          Last updated:{" "}
                          {format(chatbot.lastUpdated, "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center space-x-2">
                          <ThumbsUp size={16} className="text-green-500" />
                          <span>
                            {feedbackCounts[chatbot.id]?.positive || 0}
                          </span>
                          <ThumbsDown size={16} className="text-red-500" />
                          <span>
                            {feedbackCounts[chatbot.id]?.negative || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          onClick={() => navigate(`/configure/${chatbot.id}`)}
                          className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
                          icon={Edit2}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => openEmbedModal(chatbot.id)}
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                          icon={Code}
                        >
                          Embed
                        </Button>
                        <Button
                          onClick={() => openDeleteModal(chatbot.id)}
                          className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                          icon={Trash2}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Transition>
            {!loading && !error && filteredChatbots.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-16">
                <p className="text-xl mb-6">
                  {searchTerm
                    ? "No chatbots found matching your search."
                    : "No chatbots found. Create one to get started!"}
                </p>
                {!searchTerm && (
                  <Link
                    to="/configure"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-[#aab2ff] hover:bg-[#8e98ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <PlusCircle size={20} className="mr-2" />
                    Create Your First Chatbot
                  </Link>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={deleteChatbot}
        title="Delete Chatbot"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500 dark:focus:ring-red-400"
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this chatbot? This action cannot be
          undone.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={embedModal.isOpen}
        onClose={embedModal.closeModal}
        title="Embed Code"
        confirmText="Copy to Clipboard"
        cancelText="Close"
        onConfirm={copyEmbedCode}
        confirmButtonClass="bg-[#aab2ff] text-black hover:bg-[#8e98ff] dark:bg-[#aab2ff] dark:hover:bg-[#8e98ff] focus:ring-[#aab2ff] dark:focus:ring-[#8e98ff]"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Copy and paste this code into your website to embed the chatbot.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-x-auto"
        >
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {selectedChatbotId && generateEmbedCode(selectedChatbotId)}
          </pre>
        </motion.div>
      </ConfirmationModal>
    </div>
  );
};

export default Dashboard;
