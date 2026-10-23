import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import {
  doc,
  getDoc,
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
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "react-hot-toast";
import Button from "./Button";
import Input from "./Input";
import Card from "./Card";
import { Helmet } from "react-helmet-async";
import { apiRequest } from "../utils/api";
import { LiveOrb } from "./LiveOrb";
import { orbPropsFor } from "../utils/orbColors";
import chatIcon from "../assets/chat1.svg";

// Dynamic import: AI feature is optional (not included in open-source builds)
const aiModules = import.meta.glob('./AiFaqGenerator.tsx');
const aiModuleLoader = Object.values(aiModules)[0];
const AiFaqGenerator = aiModuleLoader
  ? lazy(() => aiModuleLoader() as Promise<{ default: React.ComponentType<any> }>)
  : null;

const aiPersonaModules = import.meta.glob('./AiPersonaTab.tsx');
const aiPersonaModuleLoader = Object.values(aiPersonaModules)[0];
const AiPersonaTab = aiPersonaModuleLoader
  ? lazy(() => aiPersonaModuleLoader() as Promise<{ default: React.ComponentType<any> }>)
  : null;

function hasPaidAccessUntilPeriodEnd(subscriptionStatus: string, currentPeriodEnd?: string | null) {
  if (!["cancelled", "canceled"].includes(String(subscriptionStatus || "").toLowerCase())) {
    return false;
  }

  if (!currentPeriodEnd) {
    return false;
  }

  const endDate = new Date(currentPeriodEnd);
  return !Number.isNaN(endDate.getTime()) && endDate.getTime() > Date.now();
}

interface EditChatbotProps extends ChatbotProps {
  name: string;
}

interface FAQItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

// --- Section Header ---
const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-[#101723] dark:text-[#D7DFE5] font-sans">{title}</h2>
    <p className="text-body-sm text-[#647184] dark:text-[#9BAABD] mt-1">{description}</p>
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
      <div className={`w-10 h-[22px] rounded-full transition-colors duration-200 ${checked ? "bg-[#101723] dark:bg-[#D7DFE5]" : "bg-[#D7DFE5] dark:bg-[#39485B]"}`} />
      <div className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-[#F9FCFF] dark:bg-[#141D2B] shadow transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0"}`} />
    </div>
    <span className="ml-3 text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5] group-hover:text-[#141D2B] dark:group-hover:text-white transition-colors">{label}</span>
  </label>
);

// --- Input Field with helper text ---
const FormField = ({ label, helperText, children }: { label: string; helperText?: string; children: React.ReactNode }) => (
  <div>
    <label className="block mb-1.5 text-[#101723] dark:text-[#D7DFE5] font-medium text-body-sm">
      {label}
    </label>
    {children}
    {helperText && (
      <p className="mt-1.5 text-xs text-[#647184] dark:text-[#9BAABD]">{helperText}</p>
    )}
  </div>
);

const EditChatbot: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<EditChatbotProps>({
    id: "",
    name: "",
    title: "",
    primaryColor: "#101723",
    secondaryColor: "#243040",
    position: "bottom-right",
    launcherStyle: "classic",
    greetingBubble: false,
    initialMessage: "Hello! How can I help you today?",
    placeholder: "Type your message...",
    faqData: [],
    liveChatLink: "",
    enableLeadCapture: false,
    aiEnabled: false,
    aiTone: "",
  });
  const [faqInput, setFaqInput] = useState({ question: "", answer: "" });
  const [faqList, setFaqList] = useState<FAQItem[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [isDeleteFaqModalOpen, setIsDeleteFaqModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null);
  const [gradientStart, setGradientStart] = useState("#101723");
  const [gradientEnd, setGradientEnd] = useState("#243040");
  const [useGradient, setUseGradient] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(90);
  const [hasChanges, setHasChanges] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [canUseAi, setCanUseAi] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "enterprise">("free");
  
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
    fetchUserPlan();
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

  const fetchUserPlan = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userSnap.data();
      const storedPlan = (userData?.plan || (userData?.isPro ? "pro" : "free")) as
        | "free"
        | "pro"
        | "enterprise";
      const subscriptionStatus =
        userData?.subscriptionStatus || (storedPlan === "free" ? "inactive" : "active");
      const paidThroughPeriodEnd = hasPaidAccessUntilPeriodEnd(
        subscriptionStatus,
        userData?.currentPeriodEnd
      );
      const plan = (storedPlan === "enterprise"
        ? "enterprise"
        : storedPlan === "pro" || paidThroughPeriodEnd
          ? "pro"
          : "free") as "free" | "pro" | "enterprise";
      const allowed =
        plan === "enterprise" ||
        (plan === "pro" &&
          (["active", "trialing", "on_trial"].includes(subscriptionStatus) ||
            paidThroughPeriodEnd));

      setUserPlan(plan);
      setCanUseAi(allowed);
    } catch (error) {
      console.error("Error loading user plan:", error);
      setUserPlan("free");
      setCanUseAi(false);
    }
  };

  const handleConfigChange = (key: keyof EditChatbotProps, value: string | boolean) => {
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


  const persistConfig = async ({
    showSuccessToast = true,
    navigateAfterSave = true,
  }: {
    showSuccessToast?: boolean;
    navigateAfterSave?: boolean;
  } = {}) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to save the configuration.");
      return null;
    }
    if (!config.name.trim() || !config.title.trim()) {
      toast.error("Chatbot name and title are required.");
      return null;
    }
    try {
      const { id, ...chatbotConfig } = config;
      const result = await apiRequest<{ chatbotId: string; aiEnabled: boolean }>(
        "/api/chatbots/save",
        {
          authRequired: true,
          body: {
            chatbotId: id,
            config: chatbotConfig,
          },
        }
      );

      const nextConfig = { ...config, id: result.chatbotId, aiEnabled: result.aiEnabled };
      setConfig(nextConfig);

      setHasChanges(false);
      initialConfigRef.current = JSON.stringify(nextConfig);
      if (showSuccessToast) {
        toast.success("Configuration saved successfully!");
      }
      if (navigateAfterSave) {
        navigate(`/configure/${result.chatbotId}`);
      }
      return result;
    } catch (error) {
      console.error("Error saving config:", error);
      if (error instanceof Error) {
        toast.error(`Failed to save configuration: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while saving the configuration");
      }
      return null;
    }
  };

  const saveConfig = async () => {
    await persistConfig();
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
    "#101723",
    "#566273",
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
      <div className="bg-[#F9FCFF] p-4 rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Embedded Chatbot Preview</h2>
          <button
            onClick={() => setShowEmbedPreview(false)}
            className="text-[#647184] hover:text-[#243040]"
          >
            Close
          </button>
        </div>
        <div className="flex-grow overflow-hidden relative">
          <div className="absolute inset-0 overflow-auto">
            <div className="min-h-full p-4 bg-[#E7EDF6]">
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
    ...(AiPersonaTab ? [{ key: "ai_tone", label: "AI Persona", icon: MessageSquare, desc: "Personality & tone" }] : []),
    { key: "embed", label: "Embed", icon: Code2, desc: "Install on your site" },
  ];



  const inputClasses = "w-full p-2.5 bg-[#F9FCFF] dark:bg-[#273444] border border-[#D8DFE9] dark:border-[#39485B] text-[#101723] dark:text-[#D7DFE5] placeholder-[#647184] dark:placeholder-[#87909D] focus:ring-2 focus:ring-[#101723]/20 dark:focus:ring-[#D7DFE5]/20 focus:border-[#101723] dark:focus:border-[#D7DFE5] rounded-[9px] shadow-sm text-body-sm transition-all duration-200 outline-none";

  return (
    <div className="min-h-screen bg-[#F3F7FC] dark:bg-[#141D2B] font-sans text-[#101723] dark:text-[#D7DFE5]">
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
            <h1 className="text-h1 font-normal font-serif text-[#101723] dark:text-[#D7DFE5] tracking-tight">
              {id ? `Edit Chatbot` : "Create New Chatbot"}
            </h1>
            {id && config.name && (
              <span className="text-body-sm text-[#647184] dark:text-[#9BAABD] bg-[#E7EDF6] dark:bg-[#1A2533] px-3 py-1 rounded-full border border-[#D8DFE9] dark:border-[#2B3646]">
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
              className="bg-[#101723] dark:bg-[#D7DFE5] hover:bg-[#243040] dark:hover:bg-[#E7EDF6] text-white dark:text-[#141D2B] shadow-md text-button font-medium px-4 py-2 rounded-[9px]"
              icon={showChatbot ? EyeOff : Eye}
            >
              {showChatbot ? "Hide Preview" : "Live Preview"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="bg-[#F9FCFF] dark:bg-[#1A2533] border border-[#D8DFE9] dark:border-[#2B3646] text-[#566273] dark:text-[#9BAABD] hover:bg-[#F3F7FC] dark:hover:bg-[#141D2B] hover:text-[#101723] dark:hover:text-[#D7DFE5] shadow-sm text-button font-medium px-4 py-2 rounded-[9px]"
              icon={ArrowLeft}
            >
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Config Panel */}
          <Card className="lg:col-span-2 bg-[#F9FCFF] dark:bg-[#1A2533] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[9px] border-none dark:border dark:border-[#2B3646] overflow-visible">
            {/* Tab Navigation */}
            <div className="flex border-b border-[#D8DFE9] dark:border-[#2B3646] px-3 sm:px-6 pt-3 sm:pt-4 gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-body-sm font-medium transition-all duration-200 rounded-t-lg whitespace-nowrap ${
                      isActive
                        ? "text-[#101723] dark:text-[#D7DFE5] bg-[#F3F7FC] dark:bg-[#141D2B]"
                        : "text-[#647184] dark:text-[#9BAABD] hover:text-[#101723] dark:hover:text-[#D7DFE5] hover:bg-[#F3F7FC]/50 dark:hover:bg-[#141D2B]/30"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-[#101723] dark:text-[#D7DFE5]" : ""} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#101723] dark:bg-[#D7DFE5] rounded-full" />
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

                    <div className="h-px bg-[#D8DFE9] dark:bg-[#273444]" />

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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField label="Input Placeholder" helperText="Placeholder text in the message input field">
                        <input
                          className={inputClasses}
                          placeholder="Type your message..."
                          value={config.placeholder}
                          onChange={(e) => handleConfigChange("placeholder", e.target.value)}
                        />
                      </FormField>

                      <FormField label="Live Chat Link" helperText="Where users are directed if the bot cannot answer (e.g., https://wa.me/123, or mailto:support@example.com)">
                        <input
                          className={inputClasses}
                          placeholder="e.g. https://wa.me/123456789"
                          value={config.liveChatLink || ""}
                          onChange={(e) => handleConfigChange("liveChatLink", e.target.value)}
                        />
                      </FormField>
                    </div>

                    <div className="pt-2">
                       <ToggleSwitch
                          checked={config.enableLeadCapture === true || (config.enableLeadCapture as unknown as string) === "true"}
                          onChange={(val) => handleConfigChange("enableLeadCapture", val)}
                          label="Enable Lead Capture (Ask for email when no answer is found)"
                        />
                    </div>

                    <div className="pt-2">
                      {canUseAi ? (
                        <>
                          <ToggleSwitch
                            checked={config.aiEnabled === true}
                            onChange={(val) => handleConfigChange("aiEnabled", val)}
                            label="Enable AI features for this chatbot"
                          />
                          <p className="mt-2 text-xs text-[#647184] dark:text-[#9BAABD]">
                            {userPlan === "enterprise"
                              ? "Enterprise can enable AI across custom chatbot limits."
                              : "Pro includes up to 10 AI-enabled chatbots."}
                          </p>
                        </>
                      ) : (
                        <div className="rounded-[9px] border border-[#D8DFE9] dark:border-[#2B3646] bg-[#F3F7FC] dark:bg-[#141D2B] p-4">
                          <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                            AI features are part of Pro
                          </p>
                          <p className="mt-1 text-xs text-[#647184] dark:text-[#9BAABD]">
                            Free plans can create unlimited manual chatbots. Upgrade to enable AI on up to 10 chatbots.
                          </p>
                          <Link
                            to="/plans"
                            className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#101723] dark:bg-[#D7DFE5] px-4 py-2 text-sm font-medium text-white dark:text-[#141D2B] hover:bg-[#243040] dark:hover:bg-[#E7EDF6] transition-colors"
                          >
                            Upgrade
                          </Link>
                        </div>
                      )}
                    </div>
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
                    {/* Launcher Style */}
                    <FormField label="Launcher Style" helperText="The button visitors click to open the chat. Kio is a little orb in your primary color whose eyes follow the visitor's pointer.">
                      <div className="grid grid-cols-2 gap-3 max-w-[420px]" role="radiogroup" aria-label="Launcher style">
                        {([
                          { value: "classic", label: "Classic" },
                          { value: "orb", label: "Kio" },
                        ] as const).map((option) => {
                          const selected = (config.launcherStyle ?? "classic") === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => handleConfigChange("launcherStyle", option.value)}
                              className={`flex flex-col items-center gap-3 rounded-[9px] border p-4 transition-colors ${
                                selected
                                  ? "border-[#101723] bg-[#F9FCFF] ring-2 ring-[#101723]/10 dark:border-[#D7DFE5] dark:bg-[#1A2533] dark:ring-[#D7DFE5]/10"
                                  : "border-[#D8DFE9] hover:border-[#9BAABD] dark:border-[#2B3646] dark:hover:border-[#566273]"
                              }`}
                            >
                              <span className="flex h-16 items-center justify-center">
                                {option.value === "orb" ? (
                                  <LiveOrb size={52} {...orbPropsFor(config.primaryColor)} />
                                ) : (
                                  <span
                                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-md"
                                    style={{
                                      background: config.primaryColor.startsWith("linear-gradient")
                                        ? config.primaryColor
                                        : `linear-gradient(145deg, ${config.primaryColor}, ${config.primaryColor}cc)`,
                                    }}
                                  >
                                    <img src={chatIcon} alt="" className="h-6 w-6" />
                                  </span>
                                )}
                              </span>
                              <span className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </FormField>

                    <div>
                      <ToggleSwitch
                        checked={config.greetingBubble === true}
                        onChange={(val) => handleConfigChange("greetingBubble", val)}
                        label="Show a greeting bubble"
                      />
                      <p className="mt-2 text-xs text-[#647184] dark:text-[#9BAABD]">
                        Shows a short "Hi! 👋 Need a hand?" beside the launcher a few seconds after a visitor arrives, once per visitor. They can dismiss it or click it to open the chat.
                      </p>
                    </div>

                    <div className="h-px bg-[#D8DFE9] dark:bg-[#273444]" />

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
                              className="flex-1 h-2 bg-[#D8DFE9] dark:bg-[#39485B] rounded-lg appearance-none cursor-pointer accent-[#101723] dark:accent-[#D7DFE5]"
                            />
                            <span className="text-body-sm font-mono text-[#101723] dark:text-[#D7DFE5] bg-[#E7EDF6] dark:bg-[#273444] px-2.5 py-1 rounded-md min-w-[52px] text-center">
                              {gradientAngle}°
                            </span>
                          </div>
                        </FormField>

                        {/* Gradient Preview */}
                        <div className="space-y-2">
                          <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">Preview</p>
                          <div
                            className="h-16 rounded-[9px] border border-[#D8DFE9] dark:border-[#2B3646] shadow-inner"
                            style={{ background: config.primaryColor }}
                          />
                          <p className="text-xs text-[#647184] dark:text-[#9BAABD]">
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
                      <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5] mb-3">Quick Colors</p>
                      <div className="flex flex-wrap gap-2">
                        {predefinedColors.map((color) => {
                          const isActive = !useGradient && config.primaryColor === color;
                          return (
                            <button
                              key={color}
                              className={`w-9 h-9 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                                isActive
                                  ? "border-[#101723] dark:border-[#D7DFE5] ring-2 ring-[#101723]/20 dark:ring-[#D7DFE5]/20 scale-110"
                                  : "border-[#D8DFE9] dark:border-[#2B3646] hover:border-[#9BAABD]"
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
                  <div className="bg-[#F3F7FC] dark:bg-[#141D2B] rounded-[9px] border border-[#D8DFE9] dark:border-[#2B3646] p-5 mb-6">
                    <h3 className="text-body-sm font-semibold text-[#101723] dark:text-[#D7DFE5] mb-3">
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
                        <p className="text-xs text-[#647184] dark:text-[#9BAABD] mt-1 text-right">
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
                        <p className="text-xs text-[#647184] dark:text-[#9BAABD] mt-1 text-right">
                          {faqInput.answer.length} characters
                        </p>
                      </div>
                      {editingFaqIndex !== null ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdateFaq}
                            className="bg-[#101723] dark:bg-[#D7DFE5] hover:bg-[#243040] dark:hover:bg-[#E7EDF6] text-white dark:text-[#141D2B] shadow-md rounded-[9px] text-body-sm"
                            icon={Save}
                          >
                            Update
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            className="bg-[#F9FCFF] dark:bg-[#1A2533] border border-[#D8DFE9] dark:border-[#2B3646] text-[#566273] dark:text-[#9BAABD] hover:bg-[#F3F7FC] dark:hover:bg-[#141D2B] hover:text-[#101723] dark:hover:text-[#D7DFE5] shadow-sm rounded-[9px] text-body-sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={handleAddFaq}
                            className="bg-[#101723] dark:bg-[#D7DFE5] hover:bg-[#243040] dark:hover:bg-[#E7EDF6] text-white dark:text-[#141D2B] shadow-md rounded-[9px] text-body-sm flex-1 sm:flex-none"
                            icon={Plus}
                          >
                            Add FAQ
                          </Button>
                          {AiFaqGenerator && (
                            <>
                              <div className="hidden sm:block w-px bg-[#D8DFE9] dark:bg-[#273444] mx-1"></div>
                              <Suspense fallback={null}>
                                <AiFaqGenerator
                                  chatbotId={config.id || id}
                                  aiEnabled={config.aiEnabled === true}
                                  canUseAi={canUseAi}
                                  aiTone={config.aiTone}
                                  ensureChatbotSaved={async () => {
                                    const result = await persistConfig({
                                      showSuccessToast: false,
                                      navigateAfterSave: false,
                                    });

                                    return result?.chatbotId || config.id || id || null;
                                  }}
                                  onFaqsApproved={(faqs: { question: string; answer: string }[]) => {
                                    const faqsWithState = faqs.map((f: { question: string; answer: string }) => ({ ...f, isOpen: false }));
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
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E7EDF6] dark:bg-[#1A2533] flex items-center justify-center">
                        <MessageSquare size={28} className="text-[#647184] dark:text-[#9BAABD]" />
                      </div>
                      <h3 className="text-body-sm font-semibold text-[#101723] dark:text-[#D7DFE5] mb-1">
                        No FAQs yet
                      </h3>
                      <p className="text-xs text-[#647184] dark:text-[#9BAABD] max-w-[260px] mx-auto">
                        Add your first question above to help users get quick answers from your chatbot.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {faqList.map((faq, index) => (
                        <div
                          key={index}
                          className="border border-[#D8DFE9] dark:border-[#2B3646] rounded-[9px] overflow-hidden transition-shadow duration-200 hover:shadow-sm"
                        >
                          <div
                            className="bg-[#F9FCFF] dark:bg-[#1A2533] p-4 flex justify-between items-center cursor-pointer hover:bg-[#F3F7FC] dark:hover:bg-[#141D2B] transition-colors duration-200"
                            onClick={() => toggleFAQ(index)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E7EDF6] dark:bg-[#273444] flex items-center justify-center text-xs font-semibold text-[#566273] dark:text-[#9BAABD]">
                                {index + 1}
                              </span>
                              <span className="font-medium text-body-sm text-[#101723] dark:text-[#D7DFE5]">
                                {faq.question}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <button
                                className="text-[#647184] dark:text-[#9BAABD] hover:text-[#101723] dark:hover:text-[#D7DFE5] p-1.5 rounded-md hover:bg-[#E7EDF6] dark:hover:bg-[#273444] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFaq(index);
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="text-[#647184] dark:text-[#9BAABD] hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteFaqModal(index);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                              {faq.isOpen ? (
                                <ChevronUp size={16} className="text-[#647184] ml-1" />
                              ) : (
                                <ChevronDown size={16} className="text-[#647184] ml-1" />
                              )}
                            </div>
                          </div>
                          {faq.isOpen && (
                            <div className="px-4 pb-4 pt-2 bg-[#F3F7FC] dark:bg-[#141D2B] border-t border-[#D8DFE9] dark:border-[#2B3646]">
                              <p className="text-body-sm text-[#566273] dark:text-[#9BAABD] pl-9">
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

              {/* ========== AI TONE TAB (Premium - loaded dynamically) ========== */}
              {activeTab === "ai_tone" && AiPersonaTab && (
                canUseAi && config.aiEnabled ? (
                  <Suspense fallback={null}>
                    <AiPersonaTab
                      aiTone={config.aiTone || ""}
                      onChange={(value: string) => handleConfigChange("aiTone", value)}
                      inputClasses={inputClasses}
                    />
                  </Suspense>
                ) : (
                  <div className="rounded-[9px] border border-[#D8DFE9] dark:border-[#2B3646] bg-[#F3F7FC] dark:bg-[#141D2B] p-5">
                    <SectionHeader
                      title="AI Persona"
                      description={
                        canUseAi
                          ? "Turn on AI features for this chatbot to customize how the assistant writes and responds."
                          : "Upgrade to Pro to unlock AI personas and AI-powered replies."
                      }
                    />
                    <p className="text-body-sm text-[#566273] dark:text-[#9BAABD]">
                      {canUseAi
                        ? "This chatbot is currently using manual FAQ matching only."
                        : "Free plans include unlimited manual chatbots. Upgrade when you want AI responses and custom AI behavior."}
                    </p>
                    {!canUseAi && (
                      <Link
                        to="/plans"
                        className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#101723] dark:bg-[#D7DFE5] px-4 py-2 text-sm font-medium text-white dark:text-[#141D2B] hover:bg-[#243040] dark:hover:bg-[#E7EDF6] transition-colors"
                      >
                        Upgrade to Pro
                      </Link>
                    )}
                  </div>
                )
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
                        className="bg-[#101723] dark:bg-[#D7DFE5] hover:bg-[#243040] dark:hover:bg-[#E7EDF6] text-white dark:text-[#141D2B] shadow-md rounded-[9px]"
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
                            className="flex items-start gap-3 p-3 rounded-[9px] bg-[#F3F7FC] dark:bg-[#141D2B] border border-[#D8DFE9] dark:border-[#2B3646]"
                          >
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#101723] dark:bg-[#D7DFE5] text-white dark:text-[#141D2B] flex items-center justify-center text-xs font-bold">
                              {item.step}
                            </span>
                            <div>
                              <p className="text-body-sm font-semibold text-[#101723] dark:text-[#D7DFE5]">{item.title}</p>
                              <p className="text-xs text-[#647184] dark:text-[#9BAABD]">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Embed Code Block */}
                      <div className="rounded-[9px] border border-[#D8DFE9] dark:border-[#2B3646] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F3F7FC] dark:bg-[#141D2B] border-b border-[#D8DFE9] dark:border-[#2B3646]">
                          <span className="text-xs font-medium text-[#647184] dark:text-[#9BAABD] uppercase tracking-wider">HTML</span>
                          <button
                            onClick={handleCopyEmbed}
                            className="flex items-center gap-1.5 text-xs font-medium text-[#566273] dark:text-[#9BAABD] hover:text-[#101723] dark:hover:text-[#D7DFE5] bg-[#F9FCFF] dark:bg-[#1A2533] border border-[#D8DFE9] dark:border-[#2B3646] px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-sm"
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
                        <pre className="p-4 bg-[#141D2B] dark:bg-[#0C0A09] text-[#E7EDF6] text-xs font-mono overflow-x-auto leading-relaxed">
                          <code>{generateEmbedCode()}</code>
                        </pre>
                      </div>

                      <p className="mt-4 text-xs text-[#647184] dark:text-[#9BAABD] flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        Make sure to replace any placeholder values in the embed code with your actual chatbot configuration.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Floating Save Bar */}
            <div className="sticky bottom-0 bg-[#F9FCFF]/80 dark:bg-[#1A2533]/80 backdrop-blur-md border-t border-[#D8DFE9] dark:border-[#2B3646] px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 rounded-b-[9px]">
              <p className="text-xs text-[#647184] dark:text-[#9BAABD] text-center sm:text-left">
                {hasChanges ? "You have unsaved changes" : "All changes saved"}
              </p>
              <div className="flex gap-2 justify-center sm:justify-end">
                {hasChanges && id && (
                  <Button
                    onClick={discardChanges}
                    className="bg-[#F9FCFF] dark:bg-[#141D2B] border border-[#D8DFE9] dark:border-[#2B3646] text-[#566273] dark:text-[#9BAABD] hover:bg-[#F3F7FC] dark:hover:bg-[#1A2533] hover:text-[#101723] dark:hover:text-[#D7DFE5] shadow-sm text-body-sm font-medium px-4 py-2 rounded-[9px]"
                    icon={RotateCcw}
                  >
                    Discard
                  </Button>
                )}
                <Button
                  onClick={saveConfig}
                  className="bg-[#101723] dark:bg-[#D7DFE5] hover:bg-[#243040] dark:hover:bg-[#E7EDF6] text-white dark:text-[#141D2B] shadow-md text-body-sm font-medium px-5 py-2 rounded-[9px]"
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
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#101723] dark:text-[#D7DFE5] font-sans">
                    Preview
                  </h2>
                  <span className="text-xs text-[#647184] dark:text-[#9BAABD] bg-[#E7EDF6] dark:bg-[#1A2533] px-2.5 py-1 rounded-full border border-[#D8DFE9] dark:border-[#2B3646]">
                    {positionLabels[config.position] || config.position}
                  </span>
                </div>

                <div className="border border-[#D8DFE9] dark:border-[#2B3646] rounded-[9px] overflow-hidden bg-[#F9FCFF] dark:bg-[#1A2533]">
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
              </div>
            </div>
          </div>
        </div>

        {showEmbedPreview && <EmbedPreviewModal />}

        {showChatbot && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div className="pointer-events-auto">
              <Chatbot
                {...config}
                isEmbedded={true}
                customPositionClass={`${positionClasses[config.position]} m-4`}
              />
            </div>
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
          <p className="text-[#566273] dark:text-[#9BAABD]">
            Are you sure you want to delete this FAQ?
          </p>
        </ConfirmationModal>
      </div>
    </div>
  );
};

export default EditChatbot;

