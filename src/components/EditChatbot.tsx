import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertCircle,
  Edit2,
  Settings,
  Palette,
  HelpCircle,
  Code2,
  Check,
  Copy,
  MessageSquare,
  RotateCcw,
  X,
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "react-hot-toast";
import Button from "./Button";
import Input from "./Input";
import Card from "./Card";
import { Helmet } from "react-helmet-async";

// Dynamic import: AI feature is optional (not included in open-source builds)
const aiModules = import.meta.glob('./AiFaqGenerator.tsx');
const AiFaqGenerator = Object.keys(aiModules).length > 0
  ? lazy(() => import('./AiFaqGenerator'))
  : null;

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
  const [hasChanges, setHasChanges] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  
  const initialConfigRef = useRef<string>("");

  const positionClasses = {
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
  };

  const positionLabels: Record<string, string> = {
    "bottom-right": "Bottom Right",
    "bottom-left": "Bottom Left",
    "top-right": "Top Right",
    "top-left": "Top Left",
  };

  useEffect(() => {
    if (id) {
      fetchChatbotConfig();
    }
  }, [id]);

  useEffect(() => {
    setFaqList(config.faqData.map((faq) => ({ ...faq, isOpen: false })));
  }, [config.faqData]);

  // Track unsaved changes
  useEffect(() => {
    const currentJson = JSON.stringify(config);
    if (initialConfigRef.current && currentJson !== initialConfigRef.current) {
      setHasChanges(true);
    }
  }, [config]);

  const fetchChatbotConfig = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, "chatbot_configs", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id, ...docSnap.data() } as EditChatbotProps;
        setConfig(data);
        initialConfigRef.current = JSON.stringify(data);
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

      setHasChanges(false);
      initialConfigRef.current = JSON.stringify(config);
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

  const discardChanges = () => {
    if (initialConfigRef.current) {
      setConfig(JSON.parse(initialConfigRef.current));
      setHasChanges(false);
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

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setEmbedCopied(true);
    toast.success("Embed code copied to clipboard!");
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const predefinedColors: string[] = [
    "#818CF8",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#0891B2",
    "#000000",
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

  const tabs = [
    { key: "general", label: "General", icon: Settings, desc: "Basic settings" },
    { key: "appearance", label: "Appearance", icon: Palette, desc: "Colors & style" },
    { key: "faq", label: "FAQ", icon: HelpCircle, desc: "Questions & answers" },
    { key: "embed", label: "Embed", icon: Code2, desc: "Install on your site" },
  ];

  // --- Section Header ---
  const SectionHeader = ({ title, description }: { title: string; description: string }) => (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] font-sans">{title}</h2>
      <p className="text-body-sm text-[#78716C] dark:text-[#A8A29E] mt-1">{description}</p>
    </div>
  );

  // --- Toggle Switch ---
  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="inline-flex items-center cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-10 h-[22px] rounded-full transition-colors duration-200 ${checked ? "bg-[#37322F] dark:bg-[#F5F5F4]" : "bg-[#D6D3D1] dark:bg-[#57534E]"}`} />
        <div className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white dark:bg-[#1C1917] shadow transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0"}`} />
      </div>
      <span className="ml-3 text-body-sm font-medium text-[#37322F] dark:text-[#F5F5F4] group-hover:text-[#1C1917] dark:group-hover:text-white transition-colors">{label}</span>
    </label>
  );

  // --- Input Field with helper text ---
  const FormField = ({ label, helperText, children }: { label: string; helperText?: string; children: React.ReactNode }) => (
    <div>
      <label className="block mb-1.5 text-[#37322F] dark:text-[#F5F5F4] font-medium text-body-sm">
        {label}
      </label>
      {children}
      {helperText && (
        <p className="mt-1.5 text-xs text-[#A8A29E] dark:text-[#78716C]">{helperText}</p>
      )}
    </div>
  );

  const inputClasses = "w-full p-2.5 bg-white dark:bg-[#44403C] border border-[#E0DEDB] dark:border-[#57534E] text-[#37322F] dark:text-[#F5F5F4] placeholder-[#9CA3AF] dark:placeholder-[#78716C] focus:ring-2 focus:ring-[#37322F]/20 dark:focus:ring-[#F5F5F4]/20 focus:border-[#37322F] dark:focus:border-[#F5F5F4] rounded-[9px] shadow-sm text-body-sm transition-all duration-200 outline-none";

  return (
    <div className="min-h-screen bg-[#F7F5F3] dark:bg-[#1C1917] font-sans text-[#37322F] dark:text-[#F5F5F4]">
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-h1 font-normal font-serif text-[#37322F] dark:text-[#F5F5F4] tracking-tight">
              {id ? `Edit Chatbot` : "Create New Chatbot"}
            </h1>
            {id && config.name && (
              <span className="text-body-sm text-[#78716C] dark:text-[#A8A29E] bg-[#F5F5F4] dark:bg-[#292524] px-3 py-1 rounded-full border border-[#E0DEDB] dark:border-[#44403C]">
                {config.name}
              </span>
            )}
            {hasChanges && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowChatbot(!showChatbot)}
              className="bg-[#37322F] dark:bg-[#F5F5F4] hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] text-white dark:text-[#1C1917] shadow-md text-button font-medium px-4 py-2 rounded-[9px]"
              icon={showChatbot ? EyeOff : Eye}
            >
              {showChatbot ? "Hide Preview" : "Live Preview"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] text-[#605A57] dark:text-[#A8A29E] hover:bg-[#FAFAF9] dark:hover:bg-[#1C1917] hover:text-[#37322F] dark:hover:text-[#F5F5F4] shadow-sm text-button font-medium px-4 py-2 rounded-[9px]"
              icon={ArrowLeft}
            >
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Config Panel */}
          <Card className="lg:col-span-2 bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[9px] border-none dark:border dark:border-[#44403C] overflow-visible">
            {/* Tab Navigation */}
            <div className="flex border-b border-[#E0DEDB] dark:border-[#44403C] px-3 sm:px-6 pt-3 sm:pt-4 gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-body-sm font-medium transition-all duration-200 rounded-t-lg whitespace-nowrap ${
                      isActive
                        ? "text-[#37322F] dark:text-[#F5F5F4] bg-[#FAFAF9] dark:bg-[#1C1917]"
                        : "text-[#78716C] dark:text-[#78716C] hover:text-[#37322F] dark:hover:text-[#D6D3D1] hover:bg-[#FAFAF9]/50 dark:hover:bg-[#1C1917]/30"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-[#37322F] dark:text-[#F5F5F4]" : ""} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#37322F] dark:bg-[#F5F5F4] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 sm:p-6">
              {/* ========== GENERAL TAB ========== */}
              {activeTab === "general" && (
                <div>
                  <SectionHeader
                    title="Basic Settings"
                    description="Configure your chatbot's name, title, and default messages."
                  />
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField label="Chatbot Name" helperText="Internal name for your reference">
                        <Input
                          placeholder="e.g. Support Bot"
                          value={config.name}
                          onChange={(e) => handleConfigChange("name", e.target.value)}
                          className={inputClasses}
                        />
                      </FormField>
                      <FormField label="Chatbot Title" helperText="Displayed in the chat window header">
                        <Input
                          placeholder="e.g. Customer Support"
                          value={config.title}
                          onChange={(e) => handleConfigChange("title", e.target.value)}
                          className={inputClasses}
                        />
                      </FormField>
                    </div>

                    <div className="h-px bg-[#E0DEDB] dark:bg-[#44403C]" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField label="Widget Position" helperText="Where the chat widget appears on your site">
                        <select
                          className={inputClasses}
                          value={config.position}
                          onChange={(e) => handleConfigChange("position", e.target.value)}
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </FormField>
                      <FormField label="Initial Message" helperText="First message users see when opening the chat">
                        <input
                          className={inputClasses}
                          placeholder="Hello! How can I help you today?"
                          value={config.initialMessage}
                          onChange={(e) => handleConfigChange("initialMessage", e.target.value)}
                        />
                      </FormField>
                    </div>

                    <FormField label="Input Placeholder" helperText="Placeholder text in the message input field">
                      <input
                        className={inputClasses}
                        placeholder="Type your message..."
                        value={config.placeholder}
                        onChange={(e) => handleConfigChange("placeholder", e.target.value)}
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* ========== APPEARANCE TAB ========== */}
              {activeTab === "appearance" && (
                <div>
                  <SectionHeader
                    title="Colors & Style"
                    description="Customize how your chatbot looks with colors and gradients."
                  />

                  <div className="space-y-6">
                    {/* Gradient Toggle */}
                    <ToggleSwitch
                      checked={useGradient}
                      onChange={setUseGradient}
                      label="Use Gradient Colors"
                    />

                    {useGradient ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <FormField label="Gradient Start">
                            <div className="flex flex-col space-y-3">
                              <div className="max-w-[200px]">
                                <HexColorPicker color={gradientStart} onChange={setGradientStart} />
                              </div>
                              <HexColorInput
                                color={gradientStart}
                                onChange={setGradientStart}
                                className={`${inputClasses} max-w-[200px] font-mono`}
                              />
                            </div>
                          </FormField>
                          <FormField label="Gradient End">
                            <div className="flex flex-col space-y-3">
                              <div className="max-w-[200px]">
                                <HexColorPicker color={gradientEnd} onChange={setGradientEnd} />
                              </div>
                              <HexColorInput
                                color={gradientEnd}
                                onChange={setGradientEnd}
                                className={`${inputClasses} max-w-[200px] font-mono`}
                              />
                            </div>
                          </FormField>
                        </div>

                        <FormField label="Gradient Angle">
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={gradientAngle}
                              onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                              className="flex-1 h-2 bg-[#E0DEDB] dark:bg-[#57534E] rounded-lg appearance-none cursor-pointer accent-[#37322F] dark:accent-[#F5F5F4]"
                            />
                            <span className="text-body-sm font-mono text-[#37322F] dark:text-[#F5F5F4] bg-[#F5F5F4] dark:bg-[#44403C] px-2.5 py-1 rounded-md min-w-[52px] text-center">
                              {gradientAngle}°
                            </span>
                          </div>
                        </FormField>

                        {/* Gradient Preview */}
                        <div className="space-y-2">
                          <p className="text-body-sm font-medium text-[#37322F] dark:text-[#F5F5F4]">Preview</p>
                          <div
                            className="h-16 rounded-[9px] border border-[#E0DEDB] dark:border-[#44403C] shadow-inner"
                            style={{ background: config.primaryColor }}
                          />
                          <p className="text-xs text-[#A8A29E] dark:text-[#78716C]">
                            This gradient will be applied to both primary and secondary colors.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField label="Primary Color">
                          <div className="flex flex-col space-y-3">
                            <div className="max-w-[200px]">
                              <HexColorPicker
                                color={config.primaryColor}
                                onChange={(color) => handleConfigChange("primaryColor", color)}
                              />
                            </div>
                            <HexColorInput
                              color={config.primaryColor}
                              onChange={(color) => handleConfigChange("primaryColor", color)}
                              className={`${inputClasses} max-w-[200px] font-mono`}
                            />
                          </div>
                        </FormField>
                        <FormField label="Secondary Color">
                          <div className="flex flex-col space-y-3">
                            <div className="max-w-[200px]">
                              <HexColorPicker
                                color={config.secondaryColor}
                                onChange={(color) => handleConfigChange("secondaryColor", color)}
                              />
                            </div>
                            <HexColorInput
                              color={config.secondaryColor}
                              onChange={(color) => handleConfigChange("secondaryColor", color)}
                              className={`${inputClasses} max-w-[200px] font-mono`}
                            />
                          </div>
                        </FormField>
                      </div>
                    )}

                    {/* Quick Colors */}
                    <div>
                      <p className="text-body-sm font-medium text-[#37322F] dark:text-[#F5F5F4] mb-3">Quick Colors</p>
                      <div className="flex flex-wrap gap-2">
                        {predefinedColors.map((color) => {
                          const isActive = !useGradient && config.primaryColor === color;
                          return (
                            <button
                              key={color}
                              className={`w-9 h-9 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                                isActive
                                  ? "border-[#37322F] dark:border-[#F5F5F4] ring-2 ring-[#37322F]/20 dark:ring-[#F5F5F4]/20 scale-110"
                                  : "border-[#E0DEDB] dark:border-[#44403C] hover:border-[#A8A29E]"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                setUseGradient(false);
                                handleConfigChange("primaryColor", color);
                                handleConfigChange("secondaryColor", color);
                              }}
                            >
                              {isActive && (
                                <Check size={14} className="text-white mx-auto" strokeWidth={3} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== FAQ TAB ========== */}
              {activeTab === "faq" && (
                <div>
                  <SectionHeader
                    title="Frequently Asked Questions"
                    description="Add common questions and answers to help users get quick responses."
                  />

                  {/* FAQ Form */}
                  <div className="bg-[#FAFAF9] dark:bg-[#1C1917] rounded-[9px] border border-[#E0DEDB] dark:border-[#44403C] p-5 mb-6">
                    <h3 className="text-body-sm font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
                      {editingFaqIndex !== null ? "Edit FAQ" : "Add New FAQ"}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <input
                          className={inputClasses}
                          placeholder="Enter a question..."
                          value={faqInput.question}
                          onChange={(e) =>
                            setFaqInput((prev) => ({ ...prev, question: e.target.value }))
                          }
                        />
                        <p className="text-xs text-[#A8A29E] dark:text-[#78716C] mt-1 text-right">
                          {faqInput.question.length} characters
                        </p>
                      </div>
                      <div>
                        <textarea
                          className={`${inputClasses} min-h-[80px] resize-y`}
                          placeholder="Enter the answer..."
                          value={faqInput.answer}
                          onChange={(e) =>
                            setFaqInput((prev) => ({ ...prev, answer: e.target.value }))
                          }
                        />
                        <p className="text-xs text-[#A8A29E] dark:text-[#78716C] mt-1 text-right">
                          {faqInput.answer.length} characters
                        </p>
                      </div>
                      {editingFaqIndex !== null ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdateFaq}
                            className="bg-[#37322F] dark:bg-[#F5F5F4] hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] text-white dark:text-[#1C1917] shadow-md rounded-[9px] text-body-sm"
                            icon={Save}
                          >
                            Update
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            className="bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] text-[#605A57] dark:text-[#A8A29E] hover:bg-[#FAFAF9] dark:hover:bg-[#1C1917] hover:text-[#37322F] dark:hover:text-[#F5F5F4] shadow-sm rounded-[9px] text-body-sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={handleAddFaq}
                            className="bg-[#37322F] dark:bg-[#F5F5F4] hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] text-white dark:text-[#1C1917] shadow-md rounded-[9px] text-body-sm flex-1 sm:flex-none"
                            icon={Plus}
                          >
                            Add FAQ
                          </Button>
                          {AiFaqGenerator && (
                            <>
                              <div className="hidden sm:block w-px bg-[#E0DEDB] dark:bg-[#44403C] mx-1"></div>
                              <Suspense fallback={null}>
                                <AiFaqGenerator
                                  onFaqsApproved={(faqs) => {
                                    const faqsWithState = faqs.map(f => ({ ...f, isOpen: false }));
                                    setConfig(prev => ({ ...prev, faqData: [...prev.faqData, ...faqs] }));
                                    setFaqList(prev => [...prev, ...faqsWithState]);
                                    setHasChanges(true);
                                  }}
                                />
                              </Suspense>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FAQ List */}
                  {faqList.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F5F4] dark:bg-[#292524] flex items-center justify-center">
                        <MessageSquare size={28} className="text-[#A8A29E] dark:text-[#78716C]" />
                      </div>
                      <h3 className="text-body-sm font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-1">
                        No FAQs yet
                      </h3>
                      <p className="text-xs text-[#A8A29E] dark:text-[#78716C] max-w-[260px] mx-auto">
                        Add your first question above to help users get quick answers from your chatbot.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {faqList.map((faq, index) => (
                        <div
                          key={index}
                          className="border border-[#E0DEDB] dark:border-[#44403C] rounded-[9px] overflow-hidden transition-shadow duration-200 hover:shadow-sm"
                        >
                          <div
                            className="bg-white dark:bg-[#292524] p-4 flex justify-between items-center cursor-pointer hover:bg-[#FAFAF9] dark:hover:bg-[#1C1917] transition-colors duration-200"
                            onClick={() => toggleFAQ(index)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F5F5F4] dark:bg-[#44403C] flex items-center justify-center text-xs font-semibold text-[#605A57] dark:text-[#A8A29E]">
                                {index + 1}
                              </span>
                              <span className="font-medium text-body-sm text-[#37322F] dark:text-[#F5F5F4]">
                                {faq.question}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <button
                                className="text-[#A8A29E] dark:text-[#78716C] hover:text-[#37322F] dark:hover:text-[#F5F5F4] p-1.5 rounded-md hover:bg-[#F5F5F4] dark:hover:bg-[#44403C] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFaq(index);
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="text-[#A8A29E] dark:text-[#78716C] hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteFaqModal(index);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                              {faq.isOpen ? (
                                <ChevronUp size={16} className="text-[#A8A29E] ml-1" />
                              ) : (
                                <ChevronDown size={16} className="text-[#A8A29E] ml-1" />
                              )}
                            </div>
                          </div>
                          {faq.isOpen && (
                            <div className="px-4 pb-4 pt-2 bg-[#FAFAF9] dark:bg-[#1C1917] border-t border-[#E0DEDB] dark:border-[#44403C]">
                              <p className="text-body-sm text-[#605A57] dark:text-[#A8A29E] pl-9">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========== EMBED TAB ========== */}
              {activeTab === "embed" && (
                <div>
                  {!id ? (
                    <div className="space-y-6">
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[9px] p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-body-sm font-medium text-amber-800 dark:text-amber-300">
                            Save Required
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                            Please save the chatbot configuration first to get the embed code.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={saveConfig}
                        className="bg-[#37322F] dark:bg-[#F5F5F4] hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] text-white dark:text-[#1C1917] shadow-md rounded-[9px]"
                        icon={Save}
                      >
                        Save Configuration
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <SectionHeader
                        title="Install on Your Website"
                        description="Copy the embed code and paste it into your website's HTML."
                      />

                      {/* How it works steps */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {[
                          { step: "1", title: "Copy Code", desc: "Click the copy button below" },
                          { step: "2", title: "Paste in HTML", desc: "Before the closing </body> tag" },
                          { step: "3", title: "Go Live", desc: "Your chatbot will appear on site" },
                        ].map((item) => (
                          <div
                            key={item.step}
                            className="flex items-start gap-3 p-3 rounded-[9px] bg-[#FAFAF9] dark:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C]"
                          >
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] flex items-center justify-center text-xs font-bold">
                              {item.step}
                            </span>
                            <div>
                              <p className="text-body-sm font-semibold text-[#37322F] dark:text-[#F5F5F4]">{item.title}</p>
                              <p className="text-xs text-[#A8A29E] dark:text-[#78716C]">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Embed Code Block */}
                      <div className="rounded-[9px] border border-[#E0DEDB] dark:border-[#44403C] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] dark:bg-[#1C1917] border-b border-[#E0DEDB] dark:border-[#44403C]">
                          <span className="text-xs font-medium text-[#78716C] dark:text-[#A8A29E] uppercase tracking-wider">HTML</span>
                          <button
                            onClick={handleCopyEmbed}
                            className="flex items-center gap-1.5 text-xs font-medium text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-sm"
                          >
                            {embedCopied ? (
                              <>
                                <Check size={13} className="text-green-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 bg-[#1C1917] dark:bg-[#0C0A09] text-[#E7E5E4] text-xs font-mono overflow-x-auto leading-relaxed">
                          <code>{generateEmbedCode()}</code>
                        </pre>
                      </div>

                      <p className="mt-4 text-xs text-[#A8A29E] dark:text-[#78716C] flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        Make sure to replace any placeholder values in the embed code with your actual chatbot configuration.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Floating Save Bar */}
            <div className="sticky bottom-0 bg-white/80 dark:bg-[#292524]/80 backdrop-blur-md border-t border-[#E0DEDB] dark:border-[#44403C] px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 rounded-b-[9px]">
              <p className="text-xs text-[#A8A29E] dark:text-[#78716C] text-center sm:text-left">
                {hasChanges ? "You have unsaved changes" : "All changes saved"}
              </p>
              <div className="flex gap-2 justify-center sm:justify-end">
                {hasChanges && id && (
                  <Button
                    onClick={discardChanges}
                    className="bg-white dark:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C] text-[#605A57] dark:text-[#A8A29E] hover:bg-[#FAFAF9] dark:hover:bg-[#292524] hover:text-[#37322F] dark:hover:text-[#F5F5F4] shadow-sm text-body-sm font-medium px-4 py-2 rounded-[9px]"
                    icon={RotateCcw}
                  >
                    Discard
                  </Button>
                )}
                <Button
                  onClick={saveConfig}
                  className="bg-[#37322F] dark:bg-[#F5F5F4] hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] text-white dark:text-[#1C1917] shadow-md text-body-sm font-medium px-5 py-2 rounded-[9px]"
                  icon={Save}
                >
                  {id ? "Save" : "Create Chatbot"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Preview Panel — hidden on mobile, visible on lg+ */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <Card className="border-none shadow-none bg-transparent dark:bg-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] font-sans">
                    Preview
                  </h2>
                  <span className="text-xs text-[#A8A29E] dark:text-[#78716C] bg-[#F5F5F4] dark:bg-[#292524] px-2.5 py-1 rounded-full border border-[#E0DEDB] dark:border-[#44403C]">
                    {positionLabels[config.position] || config.position}
                  </span>
                </div>

                <div className="border border-[#E0DEDB] dark:border-[#44403C] rounded-[9px] overflow-hidden bg-white dark:bg-[#292524]">
                  <div
                    className="relative overflow-hidden w-full"
                    style={{ height: "500px" }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full">
                        <Chatbot {...config} isEmbedded={false} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
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
          confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md"
        >
          <p className="text-[#605A57] dark:text-[#A8A29E]">
            Are you sure you want to delete this FAQ?
          </p>
        </ConfirmationModal>
      </div>
    </div>
  );
};

export default EditChatbot;

