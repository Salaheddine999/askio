import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import Chatbot, { ChatbotProps } from "./Chatbot";
import { PostgrestError } from "@supabase/supabase-js";
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

interface EditChatbotProps extends ChatbotProps {
  name: string;
  gradientStart?: string;
  gradientEnd?: string;
  useGradient: boolean;
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
    primaryColor: "#4F46E5", // indigo-600
    secondaryColor: "#6366F1", // indigo-500
    position: "bottom-right",
    initialMessage: "Hello! How can I help you today?",
    placeholder: "Type your message...",
    faqData: [],
    gradientStart: "#4F46E5",
    gradientEnd: "#6366F1",
    useGradient: false,
  });
  const [faqInput, setFaqInput] = useState({ question: "", answer: "" });
  const [faqList, setFaqList] = useState<FAQItem[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [isDeleteFaqModalOpen, setIsDeleteFaqModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null);
  const [gradientAngle, setGradientAngle] = useState(90);

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
      const { data, error } = await supabase
        .from("chatbot_configs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setConfig(data as EditChatbotProps);
    } catch (err) {
      const error = err as PostgrestError;
      console.error("Error loading chatbot config:", error);
      toast.error(`Failed to load chatbot configuration: ${error.message}`);
    }
  };

  const handleConfigChange = (
    key: keyof EditChatbotProps,
    value: string | boolean
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

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
    if (!config.name.trim() || !config.title.trim()) {
      toast.error("Chatbot name and title are required.");
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { name, id, ...chatbotConfig } = config;
      const result = id
        ? await supabase
            .from("chatbot_configs")
            .update({ ...chatbotConfig, name })
            .eq("id", id)
            .eq("user_id", user.id)
        : await supabase
            .from("chatbot_configs")
            .insert({ ...chatbotConfig, name, user_id: user.id });

      if (result.error) throw result.error;
      toast.success("Configuration saved successfully!");

      if (!id && result.data) {
        const newChatbot = result.data[0] as { id: string };
        navigate(`/configure/${newChatbot.id}`);
      }
    } catch (err) {
      const error = err as PostgrestError;
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration! Try again later.");
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

  const AppearanceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="useGradient"
          checked={config.useGradient}
          onChange={(e) => handleConfigChange("useGradient", e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="useGradient" className="dark:text-gray-100">
          Use Gradient
        </label>
      </div>
      {config.useGradient ? (
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <label className="block mb-2 dark:text-gray-100">
              Gradient Start Color
            </label>
            <div className="flex items-center space-x-2">
              <HexColorPicker
                color={config.gradientStart}
                onChange={(color) => handleConfigChange("gradientStart", color)}
              />
              <HexColorInput
                color={config.gradientStart}
                onChange={(color) => handleConfigChange("gradientStart", color)}
                className="w-20 p-1 text-sm border rounded-md"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block mb-2 dark:text-gray-100">
              Gradient End Color
            </label>
            <div className="flex items-center space-x-2">
              <HexColorPicker
                color={config.gradientEnd}
                onChange={(color) => handleConfigChange("gradientEnd", color)}
              />
              <HexColorInput
                color={config.gradientEnd}
                onChange={(color) => handleConfigChange("gradientEnd", color)}
                className="w-20 p-1 text-sm border rounded-md"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <label className="block mb-2 dark:text-gray-100">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <HexColorPicker
                color={config.primaryColor}
                onChange={(color) => handleConfigChange("primaryColor", color)}
              />
              <HexColorInput
                color={config.primaryColor}
                onChange={(color) => handleConfigChange("primaryColor", color)}
                className="w-20 p-1 text-sm border rounded-md"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block mb-2 dark:text-gray-100">
              Secondary Color
            </label>
            <div className="flex items-center space-x-2">
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
                className="w-20 p-1 text-sm border rounded-md"
              />
            </div>
          </div>
        </div>
      )}
      {config.useGradient && (
        <div>
          <label className="block mb-2 dark:text-gray-100">
            Gradient Angle: {gradientAngle}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={gradientAngle}
            onChange={(e) => setGradientAngle(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}
      <div className="flex flex-wrap mt-4">
        <h3 className="w-full mb-2 dark:text-gray-100">Preset Colors</h3>
        {predefinedColors.map((color) => (
          <button
            key={color}
            className="w-8 h-8 m-1 rounded-md border border-gray-300 transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
            onClick={() => {
              if (config.useGradient) {
                handleConfigChange("gradientStart", color);
                handleConfigChange(
                  "gradientEnd",
                  lightenDarkenColor(color, 20)
                );
              } else {
                handleConfigChange("primaryColor", color);
                handleConfigChange(
                  "secondaryColor",
                  lightenDarkenColor(color, 20)
                );
              }
            }}
          ></button>
        ))}
      </div>
    </div>
  );

  // Helper function to lighten or darken a color
  function lightenDarkenColor(col: string, amt: number) {
    let usePound = false;
    if (col[0] === "#") {
      col = col.slice(1);
      usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    let b = ((num >> 8) & 0x00ff) + amt;
    let g = (num & 0x0000ff) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl mt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <h1 className="text-3xl font-medium text-black dark:text-gray-100 mb-4 sm:mb-0">
          {id ? `Edit Chatbot: ${config.name}` : "Create New Chatbot"}
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            className="bg-[#aab2ff] hover:bg-indigo-400 text-black px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
            onClick={() => setShowChatbot(!showChatbot)}
          >
            {showChatbot ? (
              <>
                <EyeOff size={20} className="mr-2" />
                Hide Chatbot
              </>
            ) : (
              <>
                <Eye size={20} className="mr-2" />
                Show Chatbot
              </>
            )}
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Chatbot List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  activeTab === tab
                    ? "bg-[#aab2ff] text-black"
                    : "bg-gray-200 text-gray-800 hover:bg-[#aab2ff]"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-black dark:text-gray-100">
                    Chatbot Name
                  </label>
                  <input
                    className="w-full p-2 border rounded-md text-black"
                    placeholder="Chatbot Name"
                    value={config.name}
                    onChange={(e) => handleConfigChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-black dark:text-gray-100">
                    Chatbot Title
                  </label>
                  <input
                    className="w-full p-2 border rounded-md text-black"
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
                  <label className="block mb-2 dark:text-gray-100">
                    Position
                  </label>
                  <select
                    className="w-full p-2 border rounded-md"
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
                  <label className="block mb-2 dark:text-gray-100">
                    Initial Message
                  </label>
                  <input
                    className="w-full p-2 border rounded-md"
                    placeholder="Initial Message"
                    value={config.initialMessage}
                    onChange={(e) =>
                      handleConfigChange("initialMessage", e.target.value)
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 dark:text-gray-100">
                  Input Placeholder
                </label>
                <input
                  className="w-full p-2 border rounded-md"
                  placeholder="Input Placeholder"
                  value={config.placeholder}
                  onChange={(e) =>
                    handleConfigChange("placeholder", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {activeTab === "appearance" && <AppearanceTab />}

          {activeTab === "faq" && (
            <>
              <div className="space-y-2 mb-6">
                <input
                  className="w-full p-2 border rounded-md"
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
                  className="w-full p-2 border rounded-md"
                  placeholder="Answer"
                  value={faqInput.answer}
                  onChange={(e) =>
                    setFaqInput((prev) => ({ ...prev, answer: e.target.value }))
                  }
                />
                {editingFaqIndex !== null ? (
                  <div className="flex space-x-2">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md transition-colors duration-200 flex items-center"
                      onClick={handleUpdateFaq}
                    >
                      <Save size={20} className="mr-2" />
                      Update FAQ
                    </button>
                    <button
                      className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md transition-colors duration-200 flex items-center"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="bg-[#aab2ff] hover:bg-indigo-400 text-black p-2 rounded-md transition-colors duration-200 flex items-center"
                    onClick={handleAddFaq}
                  >
                    <Plus size={20} className="mr-2" />
                    Add FAQ
                  </button>
                )}
              </div>
              <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-2">
                {faqList.map((faq, index) => (
                  <div
                    key={index}
                    className="border rounded-md overflow-hidden"
                  >
                    <div
                      className="bg-gray-100 p-4 flex justify-between items-center cursor-pointer"
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
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-gray-100">
            Preview
          </h2>
          <div
            className="border rounded-md bg-gray-100 relative overflow-hidden mx-auto"
            style={{ height: "520px", maxWidth: "370px" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full">
                <Chatbot
                  {...config}
                  isEmbedded={false}
                  isPreview={true}
                  gradientAngle={gradientAngle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          className="bg-green-400 hover:bg-green-500 text-white px-6 py-2 rounded-md transition-colors duration-200 flex items-center"
          onClick={saveConfig}
        >
          <Save size={20} className="mr-2" />
          {id ? "Save Configuration" : "Create Chatbot"}
        </button>
      </div>

      {showEmbedPreview && <EmbedPreviewModal />}

      {showChatbot && (
        <div className="fixed z-50" style={{ margin: "10px" }}>
          <Chatbot {...config} isEmbedded={true} />
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteFaqModalOpen}
        onClose={closeDeleteFaqModal}
        onConfirm={handleDeleteFaq}
        title="Delete FAQ"
        message="Are you sure you want to delete this FAQ?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default EditChatbot;
