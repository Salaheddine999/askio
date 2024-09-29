import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Edit2,
  LoaderCircle,
  Trash2,
  Bot,
  Search,
  Info,
  Grid,
  List,
  Code,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  BarChart2,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { toast } from "react-hot-toast";
import { Transition } from "@headlessui/react";
import { useModal } from "../hooks/useModal";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import { format } from "date-fns";
import { useCollection } from "react-firebase-hooks/firestore";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import PageHeader from "../components/PageHeader";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

interface DashboardProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deleteModal = useModal();
  const embedModal = useModal();
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(
    null
  );
  const [feedbackCounts, setFeedbackCounts] = useState<{
    [key: string]: FeedbackCounts;
  }>({});
  const [feedbackSnapshot] = useCollection(query(collection(db, "feedback")));
  const [totalFeedback, setTotalFeedback] = useState<number>(0);
  const [satisfactionRate, setSatisfactionRate] = useState<number>(0);
  const [selectedChatbotMetrics, setSelectedChatbotMetrics] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<"chatbots" | "metrics">(
    "chatbots"
  );
  const [sortBy, setSortBy] = useState<"title" | "createdAt" | "lastUpdated">(
    "title"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [chatbotsPerPage] = useState(6);

  useEffect(() => {
    fetchChatbots();
  }, []);

  useEffect(() => {
    if (feedbackSnapshot && chatbots.length > 0) {
      const newFeedbackCounts: { [key: string]: FeedbackCounts } = {};
      let totalPositive = 0;
      let totalNegative = 0;

      feedbackSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Only count feedback for chatbots belonging to the current user
        if (chatbots.some((chatbot) => chatbot.id === data.chatbotId)) {
          if (!newFeedbackCounts[data.chatbotId]) {
            newFeedbackCounts[data.chatbotId] = { positive: 0, negative: 0 };
          }
          if (data.isPositive) {
            newFeedbackCounts[data.chatbotId].positive++;
            totalPositive++;
          } else {
            newFeedbackCounts[data.chatbotId].negative++;
            totalNegative++;
          }
        }
      });

      setFeedbackCounts(newFeedbackCounts);
      setTotalFeedback(totalPositive + totalNegative);
      setSatisfactionRate(
        totalPositive + totalNegative > 0
          ? (totalPositive / (totalPositive + totalNegative)) * 100
          : 0
      );
    }
  }, [feedbackSnapshot, chatbots]);

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

  const sortedChatbots = useMemo(() => {
    return [...chatbots].sort((a, b) => {
      if (sortBy === "title") {
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else {
        const dateA = new Date(a[sortBy]).getTime();
        const dateB = new Date(b[sortBy]).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
    });
  }, [chatbots, sortBy, sortOrder]);

  const filteredChatbots = useMemo(() => {
    return sortedChatbots.filter((chatbot) =>
      chatbot.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedChatbots, searchTerm]);

  const handleSort = (newSortBy: "title" | "createdAt" | "lastUpdated") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  const selectChatbotMetrics = (chatbotId: string) => {
    setSelectedChatbotMetrics(chatbotId);
  };

  const getMetricsData = () => {
    if (selectedChatbotMetrics) {
      const chatbot = chatbots.find((c) => c.id === selectedChatbotMetrics);
      const feedback = feedbackCounts[selectedChatbotMetrics] || {
        positive: 0,
        negative: 0,
      };
      return {
        labels: [chatbot?.title || "Selected Chatbot"],
        datasets: [
          {
            label: "Positive",
            data: [feedback.positive],
            backgroundColor: "#4CAF50",
          },
          {
            label: "Negative",
            data: [feedback.negative],
            backgroundColor: "#F44336",
          },
        ],
      };
    }
    return {
      labels: chatbots.map((chatbot) => chatbot.title),
      datasets: [
        {
          label: "Positive",
          data: chatbots.map(
            (chatbot) => feedbackCounts[chatbot.id]?.positive || 0
          ),
          backgroundColor: "#4CAF50",
        },
        {
          label: "Negative",
          data: chatbots.map(
            (chatbot) => feedbackCounts[chatbot.id]?.negative || 0
          ),
          backgroundColor: "#F44336",
        },
      ],
    };
  };

  const toggleSortDropdown = () => {
    setIsSortDropdownOpen(!isSortDropdownOpen);
  };

  // Calculate pagination
  const indexOfLastChatbot = currentPage * chatbotsPerPage;
  const indexOfFirstChatbot = indexOfLastChatbot - chatbotsPerPage;
  const currentChatbots = filteredChatbots.slice(
    indexOfFirstChatbot,
    indexOfLastChatbot
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="w-full 2xl:w-[85%] px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        <PageHeader title="Chatbot Dashboard" toggleSidebar={toggleSidebar} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Chatbots
              </h3>
              <Bot className="text-[#aab2ff] w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {chatbots.length}
            </p>
          </Card>
          <Card className="bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Feedback
              </h3>
              <ThumbsUp className="text-[#aab2ff] w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {totalFeedback}
            </p>
          </Card>
          <Card className="bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Satisfaction Rate
              </h3>
              <BarChart2 className="text-[#aab2ff] w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {satisfactionRate.toFixed(1)}%
            </p>
          </Card>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("chatbots")}
                className={`${
                  activeTab === "chatbots"
                    ? "border-[#aab2ff] text-[#aab2ff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Chatbots
              </button>
              <button
                onClick={() => setActiveTab("metrics")}
                className={`${
                  activeTab === "metrics"
                    ? "border-[#aab2ff] text-[#aab2ff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Metrics
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "chatbots" && (
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Chatbots
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-grow md:flex-grow-0 md:w-64">
                    <Input
                      type="text"
                      placeholder="Search chatbots..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-gray-100 dark:bg-gray-700 rounded-md"
                    />
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleViewMode}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        viewMode === "grid"
                          ? "bg-[#aab2ff] text-white dark:text-black"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={toggleViewMode}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        viewMode === "list"
                          ? "bg-[#aab2ff] text-white dark:text-black"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                  <div className="relative">
                    <Button
                      onClick={toggleSortDropdown}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      icon={Filter}
                    >
                      Sort
                    </Button>
                    {isSortDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                        <button
                          onClick={() => {
                            handleSort("title");
                            setIsSortDropdownOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                        >
                          Sort by Title
                        </button>
                        <button
                          onClick={() => {
                            handleSort("createdAt");
                            setIsSortDropdownOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                        >
                          Sort by Creation Date
                        </button>
                        <button
                          onClick={() => {
                            handleSort("lastUpdated");
                            setIsSortDropdownOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                        >
                          Sort by Last Updated
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => navigate("/configure")}
                    className="bg-[#aab2ff] hover:bg-[#9da6ff] text-black dark:text-white"
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
                    className="animate-spin text-indigo-500 dark:text-indigo-400"
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
                      <Info
                        className="h-5 w-5 text-red-400"
                        aria-hidden="true"
                      />
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
              <AnimatePresence>
                {!loading && !error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`${
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                        : "space-y-4 sm:space-y-6"
                    }`}
                  >
                    {currentChatbots.map((chatbot, index) => (
                      <motion.div
                        key={chatbot.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.1,
                          ease: "easeInOut",
                        }}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 ${
                          viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                        }`}
                      >
                        <div
                          className={`p-4 sm:p-6 flex flex-col ${
                            viewMode === "list" ? "flex-grow" : "h-full"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gradient-to-br from-[#aab2ff] to-[#7d87ff] p-2 rounded-lg shadow-md">
                                <Bot size={24} className="text-white" />
                              </div>
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                {chatbot.title}
                              </h3>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full">
                              <ThumbsUp size={14} className="text-[#aab2ff]" />
                              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                {feedbackCounts[chatbot.id]?.positive || 0}
                              </span>
                              <ThumbsDown
                                size={14}
                                className="text-red-500 ml-2"
                              />
                              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                {feedbackCounts[chatbot.id]?.negative || 0}
                              </span>
                            </div>
                          </div>

                          <div className="flex-grow">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center space-x-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span>
                                  Created:{" "}
                                  {format(chatbot.createdAt, "MMM d, yyyy")}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span>
                                  Updated:{" "}
                                  {format(chatbot.lastUpdated, "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button
                              onClick={() =>
                                navigate(`/configure/${chatbot.id}`)
                              }
                              className="w-full sm:w-auto bg-[#aab2ff] text-black hover:bg-[#9da6ff] dark:text-white"
                              icon={Edit2}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => openEmbedModal(chatbot.id)}
                              className="w-full sm:w-auto bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                              icon={Code}
                            >
                              Embed
                            </Button>
                            <Button
                              onClick={() => openDeleteModal(chatbot.id)}
                              className="w-full sm:w-auto bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                              icon={Trash2}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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
              {!loading &&
                !error &&
                filteredChatbots.length > chatbotsPerPage && (
                  <div className="mt-8 flex justify-center">
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({
                        length: Math.ceil(
                          filteredChatbots.length / chatbotsPerPage
                        ),
                      }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => paginate(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === index + 1
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={
                          currentPage ===
                          Math.ceil(filteredChatbots.length / chatbotsPerPage)
                        }
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                )}
            </div>
          </Card>
        )}

        {activeTab === "metrics" && (
          <Card className="bg-white dark:bg-gray-800 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Chatbot Performance Metrics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Bar
                  data={getMetricsData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                      title: {
                        display: true,
                        text: "Feedback by Chatbot",
                      },
                    },
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Overall Satisfaction
                </h3>
                <Doughnut
                  data={{
                    labels: ["Positive", "Negative"],
                    datasets: [
                      {
                        data: [
                          totalFeedback - (totalFeedback - satisfactionRate),
                          totalFeedback - satisfactionRate,
                        ],
                        backgroundColor: ["#4CAF50", "#F44336"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Chatbot List
              </h3>
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {chatbots.map((chatbot) => (
                  <li
                    key={chatbot.id}
                    className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md"
                  >
                    <span className="text-gray-800 dark:text-gray-200">
                      {chatbot.title}
                    </span>
                    <Button
                      onClick={() => selectChatbotMetrics(chatbot.id)}
                      className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
                      icon={BarChart2}
                    >
                      View Metrics
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
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
