import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../utils/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import Chatbot, { ChatbotProps } from "./Chatbot";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Code,
  AlertCircle,
  Edit2,
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "react-hot-toast";
import Button from "./Button";
import Input from "./Input";
import Card from "./Card";
import { Helmet } from "react-helmet-async";

interface EditChatbotProps extends ChatbotProps {
  name: string;
}

interface FAQItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

const EditChatbot: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<EditChatbotProps>({
    id: "",
    name: "",
    title: "",
    primaryColor: "#4F46E5",
    secondaryColor: "#6366F1",
    position: "bottom-right",
    initialMessage: "Hello! How can I help you today?",
    placeholder: "Type your message...",
    faqData: [],
  });
  const [faqInput, setFaqInput] = useState({ question: "", answer: "" });
  const [faqList, setFaqList] = useState<FAQItem[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [isDeleteFaqModalOpen, setIsDeleteFaqModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null);
  const [gradientStart, setGradientStart] = useState("#4F46E5");
  const [gradientEnd, setGradientEnd] = useState("#6366F1");
  const [useGradient, setUseGradient] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(90);

  const positionClasses = {
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
  };

  useEffect(() => {
    if (id) {
      fetchChatbotConfig();
    }
  }, [id]);

  useEffect(() => {
    setFaqList(config.faqData.map((faq) => ({ ...faq, isOpen: false })));
  }, [config.faqData]);

  const fetchChatbotConfig = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, "chatbot_configs", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setConfig({ id, ...docSnap.data() } as EditChatbotProps);
      } else {
        throw new Error("No such document!");
      }
    } catch (error) {
      console.error("Error loading chatbot config:", error);
      toast.error(
        `Failed to load chatbot configuration: ${(error as Error).message}`
      );
    }
  };

  const handleConfigChange = (key: keyof EditChatbotProps, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateGradient = () => {
    if (useGradient) {
      const gradientColor = `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`;
      handleConfigChange("primaryColor", gradientColor);
      handleConfigChange("secondaryColor", gradientColor);
    }
  };

  useEffect(() => {
    updateGradient();
  }, [gradientStart, gradientEnd, useGradient, gradientAngle]);

  const handleAddFaq = () => {
    if (faqInput.question && faqInput.answer) {
      setConfig((prev) => ({
        ...prev,
        faqData: [...prev.faqData, faqInput],
      }));
      setFaqList((prev) => [...prev, { ...faqInput, isOpen: false }]);
      setFaqInput({ question: "", answer: "" });
    }
  };

  const handleEditFaq = (index: number) => {
    setEditingFaqIndex(index);
    setFaqInput(faqList[index]);
  };

  const handleUpdateFaq = () => {
    if (editingFaqIndex !== null) {
      setConfig((prev) => ({
        ...prev,
        faqData: prev.faqData.map((faq, i) =>
          i === editingFaqIndex ? faqInput : faq
        ),
      }));
      setFaqList((prev) =>
        prev.map((faq, i) =>
          i === editingFaqIndex ? { ...faqInput, isOpen: faq.isOpen } : faq
        )
      );
      setEditingFaqIndex(null);
      setFaqInput({ question: "", answer: "" });
    }
  };

  const handleCancelEdit = () => {
    setEditingFaqIndex(null);
    setFaqInput({ question: "", answer: "" });
  };

  const openDeleteFaqModal = (index: number) => {
    setFaqToDelete(index);
    setIsDeleteFaqModalOpen(true);
  };

  const closeDeleteFaqModal = () => {
    setFaqToDelete(null);
    setIsDeleteFaqModalOpen(false);
  };

  const handleDeleteFaq = () => {
    if (faqToDelete !== null) {
      setConfig((prev) => ({
        ...prev,
        faqData: prev.faqData.filter((_, i) => i !== faqToDelete),
      }));
      setFaqList((prev) => prev.filter((_, i) => i !== faqToDelete));
      closeDeleteFaqModal();
    }
  };

  const toggleFAQ = (index: number) => {
    setFaqList((prev) =>
      prev.map((faq, i) =>
        i === index ? { ...faq, isOpen: !faq.isOpen } : faq
      )
    );
  };

  const saveConfig = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to save the configuration.");
      return;
    }
    if (!config.name.trim() || !config.title.trim()) {
      toast.error("Chatbot name and title are required.");
      return;
    }
    try {
      const { id, ...chatbotConfig } = config;
      const dataToSave = {
        ...chatbotConfig,
        user_id: user.uid,
        lastUpdated: serverTimestamp(),
      };

      let docRef;
      if (id) {
        docRef = doc(db, "chatbot_configs", id);
        await updateDoc(docRef, dataToSave);
      } else {
        docRef = doc(collection(db, "chatbot_configs"));
        await setDoc(docRef, {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
      }

      toast.success("Configuration saved successfully!");
      navigate(`/configure/${docRef.id}`);
    } catch (error) {
      console.error("Error saving config:", error);
      if (error instanceof Error) {
        toast.error(`Failed to save configuration: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while saving the configuration");
      }
    }
  };

  const generateEmbedCode = () => {
    if (!id) {
      return "// Chatbot not created yet. Save the configuration to get the embed code.";
    }
    const scriptSrc = `${window.location.origin}/chatbot-embed.js`;
    return `<div id="chatbot-container"></div>
<script src="${scriptSrc}"></script>
<script>
  ChatbotEmbed.init("${id}", "${window.location.origin}");
</script>`;
  };

  const EmbedTab = () => {
    if (!id) {
      return (
        <div className="space-y-6">
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded"
            role="alert"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  Please save the chatbot configuration first to get the embed
                  code.
                </p>
              </div>
            </div>
          </div>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
            onClick={saveConfig}
          >
            <Save size={20} className="mr-2" />
            Save Configuration
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
          Embed Instructions
        </h2>
        <p className="text-gray-700 dark:text-gray-100">
          To add this chatbot to your website, follow these steps:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-100">
          <li>Copy the embed code below.</li>
          <li>
            Paste the code into your website's HTML, just before the closing
            &lt;/body&gt; tag.
          </li>
          <li>
            The chatbot will appear in the specified position on your website.
          </li>
        </ol>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
            Embed Code
          </h3>
          <div className="bg-gray-100 p-4 rounded-md">
            <code>{generateEmbedCode()}</code>
          </div>
          <button
            className="mt-2 bg-[#aab2ff] hover:bg-indigo-400 text-black px-4 py-2 rounded transition-colors duration-200 flex items-center"
            onClick={() => {
              navigator.clipboard.writeText(generateEmbedCode());
              toast.success("Embed code copied to clipboard!");
            }}
          >
            <Code size={20} className="mr-2" />
            Copy to Clipboard
          </button>
        </div>
        <p className="mt-4 text-yellow-600">
          Note: Make sure to replace any placeholder values in the embed code
          with your actual chatbot configuration.
        </p>
      </div>
    );
  };

  const predefinedColors: string[] = [
    "#818CF8", // indigo-400
    "#EF4444", // red-500
    "#10B981", // green-500
    "#F59E0B", // yellow-500
    "#3B82F6", // blue-500
    "#8B5CF6", // purple-500
    "#EC4899", // pink-500
    "#0891B2", // teal-500
    "#000000", // black
  ];

  const EmbedPreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Embedded Chatbot Preview</h2>
          <button
            onClick={() => setShowEmbedPreview(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <div className="flex-grow overflow-hidden relative">
          <div className="absolute inset-0 overflow-auto">
            <div className="min-h-full p-4 bg-gray-100">
              <h1 className="text-3xl font-bold mb-4">Sample Website</h1>
              <p className="mb-4">
                This is how your chatbot would appear on a real website.
              </p>
              <div className="fixed bottom-4 right-4" style={{ zIndex: 1000 }}>
                <Chatbot {...config} isEmbedded={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = ["general", "appearance", "faq", "embed"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Helmet>
        <title>
          {id ? `Edit Chatbot: ${config.name}` : "Create New Chatbot"} | Askio
        </title>
        <meta
          name="description"
          content={
            id
              ? `Edit and configure your ${config.name} chatbot`
              : "Create and configure a new chatbot for your website"
          }
        />
      </Helmet>
      <div className="w-full 2xl:w-[80%] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">
            {id ? `Edit Chatbot: ${config.name}` : "Create New Chatbot"}
          </h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => setShowChatbot(!showChatbot)}
              className="bg-[#aab2ff] hover:bg-indigo-400 text-black"
              icon={showChatbot ? EyeOff : Eye}
            >
              {showChatbot ? "Hide Chatbot" : "Show Chatbot"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              icon={ArrowLeft}
            >
              Back to Chatbot List
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6 bg-white">
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? "bg-[#aab2ff] text-black"
                      : "bg-gray-200 text-gray-800 hover:bg-[#aab2ff] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            {activeTab === "general" && (
              <div className="space-y-6 ">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-black dark:text-gray-100 font-medium">
                      Chatbot Name
                    </label>
                    <Input
                      placeholder="Chatbot Name"
                      value={config.name}
                      onChange={(e) =>
                        handleConfigChange("name", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-black dark:text-gray-100 font-medium">
                      Chatbot Title
                    </label>
                    <Input
                      placeholder="Chatbot Title"
                      value={config.title}
                      onChange={(e) =>
                        handleConfigChange("title", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-black dark:text-gray-100 font-medium">
                      Position
                    </label>
                    <select
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-50 dark:text-gray-100 dark:focus:ring-gray-500 dark:focus:border-gray-500"
                      value={config.position}
                      onChange={(e) =>
                        handleConfigChange("position", e.target.value)
                      }
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-black dark:text-gray-100 font-medium">
                      Initial Message
                    </label>
                    <input
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-50 dark:text-gray-100 dark:focus:ring-gray-500 dark:focus:border-gray-500"
                      placeholder="Initial Message"
                      value={config.initialMessage}
                      onChange={(e) =>
                        handleConfigChange("initialMessage", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 dark:text-gray-100 font-medium">
                    Input Placeholder
                  </label>
                  <input
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-50 dark:text-gray-100 dark:focus:ring-gray-500 dark:focus:border-gray-500"
                    placeholder="Input Placeholder"
                    value={config.placeholder}
                    onChange={(e) =>
                      handleConfigChange("placeholder", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="useGradient"
                    checked={useGradient}
                    onChange={(e) => setUseGradient(e.target.checked)}
                    className="mr-2 dark:text-gray-100"
                  />
                  <label
                    htmlFor="useGradient"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Use Gradient for Colors
                  </label>
                </div>
                {useGradient ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block mb-2 dark:text-gray-100 font-medium">
                          Gradient Start
                        </label>
                        <div className="flex flex-col space-y-2 dark:text-gray-100">
                          <HexColorPicker
                            color={gradientStart}
                            onChange={setGradientStart}
                          />
                          <HexColorInput
                            color={gradientStart}
                            onChange={setGradientStart}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 dark:text-gray-100 font-medium">
                          Gradient End
                        </label>
                        <div className="flex flex-col space-y-2 dark:text-gray-100">
                          <HexColorPicker
                            color={gradientEnd}
                            onChange={setGradientEnd}
                          />
                          <HexColorInput
                            color={gradientEnd}
                            onChange={setGradientEnd}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 dark:text-gray-100 font-medium">
                        Gradient Angle
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={gradientAngle}
                          onChange={(e) =>
                            setGradientAngle(parseInt(e.target.value))
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 dark:text-gray-100"
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {gradientAngle}°
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div
                        className="h-20 rounded-md"
                        style={{ background: config.primaryColor }}
                      ></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This gradient will be applied to both primary and
                        secondary colors.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-2 dark:text-gray-100 font-medium">
                        Primary Color
                      </label>
                      <div className="flex flex-col space-y-2 dark:text-gray-100">
                        <HexColorPicker
                          color={config.primaryColor}
                          onChange={(color) =>
                            handleConfigChange("primaryColor", color)
                          }
                        />
                        <HexColorInput
                          color={config.primaryColor}
                          onChange={(color) =>
                            handleConfigChange("primaryColor", color)
                          }
                          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 dark:text-gray-100 font-medium">
                        Secondary Color
                      </label>
                      <div className="flex flex-col space-y-2 dark:text-gray-100">
                        <HexColorPicker
                          color={config.secondaryColor}
                          onChange={(color) =>
                            handleConfigChange("secondaryColor", color)
                          }
                        />
                        <HexColorInput
                          color={config.secondaryColor}
                          onChange={(color) =>
                            handleConfigChange("secondaryColor", color)
                          }
                          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap mt-4">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 m-1 rounded-md border border-gray-300"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setUseGradient(false);
                        handleConfigChange("primaryColor", color);
                        handleConfigChange("secondaryColor", color);
                      }}
                    ></button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "faq" && (
              <>
                <div className="space-y-2 mb-6">
                  <input
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Question"
                    value={faqInput.question}
                    onChange={(e) =>
                      setFaqInput((prev) => ({
                        ...prev,
                        question: e.target.value,
                      }))
                    }
                  />
                  <textarea
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Answer"
                    value={faqInput.answer}
                    onChange={(e) =>
                      setFaqInput((prev) => ({
                        ...prev,
                        answer: e.target.value,
                      }))
                    }
                  />
                  {editingFaqIndex !== null ? (
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleUpdateFaq}
                        className="bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
                        icon={Save}
                      >
                        Update FAQ
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleAddFaq}
                      className="bg-[#aab2ff] hover:bg-indigo-400 text-black dark:bg-indigo-600 dark:hover:bg-indigo-700"
                      icon={Plus}
                    >
                      Add FAQ
                    </Button>
                  )}
                </div>
                <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-2">
                  {faqList.map((faq, index) => (
                    <div
                      key={index}
                      className="border rounded-md overflow-hidden"
                    >
                      <div
                        className="bg-gray-100 p-4 flex justify-between items-center cursor-pointer dark:bg-gray-700 dark:text-gray-100"
                        onClick={() => toggleFAQ(index)}
                      >
                        <span className="font-semibold">{faq.question}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-indigo-400 hover:text-indigo-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFaq(index);
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteFaqModal(index);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                          {faq.isOpen ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>
                      </div>
                      {faq.isOpen && (
                        <div className="p-4">
                          <p className="text-gray-700 dark:text-gray-100">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "embed" && <EmbedTab />}
          </Card>

          <Card className="lg:col-span-1 border-none shadow-none dark:bg-gray-900">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Preview
            </h2>
            <div
              className="border rounded-md bg-white dark:bg-gray-800 relative overflow-hidden"
              style={{ height: "520px", maxWidth: "370px" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full">
                  <Chatbot {...config} isEmbedded={false} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Button
            onClick={saveConfig}
            className="bg-green-400 hover:bg-green-500 text-white"
            icon={Save}
          >
            {id ? "Save Configuration" : "Create Chatbot"}
          </Button>
        </div>

        {showEmbedPreview && <EmbedPreviewModal />}

        {showChatbot && (
          <div className="fixed z-50">
            <Chatbot
              {...config}
              isEmbedded={true}
              customPositionClass={`${positionClasses[config.position]} m-4`}
            />
          </div>
        )}

        <ConfirmationModal
          isOpen={isDeleteFaqModalOpen}
          onClose={closeDeleteFaqModal}
          onConfirm={handleDeleteFaq}
          title="Delete FAQ"
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500 dark:focus:ring-red-400"
        >
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this FAQ?
          </p>
        </ConfirmationModal>
      </div>
    </div>
  );
};

export default EditChatbot;
