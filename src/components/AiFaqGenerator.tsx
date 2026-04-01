import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../utils/firebase";
import {
  Sparkles,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "./Button";
import { apiRequest } from "../utils/api";
import UpgradeModal from "./UpgradeModal";
import { useNavigate } from "react-router-dom";

interface FAQItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface AiFaqGeneratorProps {
  onFaqsApproved: (faqs: { question: string; answer: string }[]) => void;
  aiTone?: string;
  chatbotId?: string;
  aiEnabled?: boolean;
  canUseAi?: boolean;
  ensureChatbotSaved?: () => Promise<string | null>;
}

const AiFaqGenerator: React.FC<AiFaqGeneratorProps> = ({
  onFaqsApproved,
  aiTone,
  chatbotId,
  aiEnabled = false,
  canUseAi = false,
  ensureChatbotSaved,
}) => {
  const navigate = useNavigate();
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingFaqs, setPendingFaqs] = useState<FAQItem[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isDeepCrawl, setIsDeepCrawl] = useState(false);

  const handleAiScrape = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to use this feature.");
      return;
    }

    if (!aiEnabled) {
      toast.error("Enable AI for this chatbot before using AI FAQ generation.");
      return;
    }

    if (!scrapeUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setIsScraping(true);
      const resolvedChatbotId = chatbotId || (await ensureChatbotSaved?.());

      if (!resolvedChatbotId) {
        toast.error("Please complete the required chatbot details before generating FAQs.");
        return;
      }

      const { faqs: newFaqs } = await apiRequest<{ faqs: { question: string; answer: string }[] }>(
        "/api/ai/generate-faq",
        {
          authRequired: true,
          body: {
            chatbotId: resolvedChatbotId,
            url: scrapeUrl,
            isDeepCrawl,
            aiTone,
          },
        }
      );

      const faqsWithState = newFaqs.map((faq: { question: string; answer: string }) => ({
        ...faq,
        isOpen: false,
      }));
      setPendingFaqs(faqsWithState);
      setShowReviewModal(true);

      toast.success(`Generated ${newFaqs.length} FAQs! Please review them.`);
      setShowUrlModal(false);
      setScrapeUrl("");
    } catch (error: unknown) {
      console.error("Scraping error:", error);
      if (
        error instanceof Error &&
        /pro|enterprise|limit|enable ai|subscription/i.test(error.message)
      ) {
        setShowUpgradeModal(true);
      }
      toast.error(
        (error instanceof Error ? error.message : null) || "Failed to generate FAQs from the provided URL."
      );
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      {/* AI Trigger Button */}
      {canUseAi ? (
        <Button
          onClick={() => setShowUrlModal(true)}
          className="bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] text-[#37322F] dark:text-[#F5F5F4] hover:bg-[#FAFAF9] dark:hover:bg-[#1C1917] hover:border-[#37322F] dark:hover:border-[#A8A29E] shadow-sm rounded-[9px] text-body-sm flex-1 sm:flex-none"
          icon={Sparkles}
        >
          Generate with AI
        </Button>
      ) : (
        <Button
          onClick={() => navigate("/plans")}
          className="bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] shadow-sm rounded-[9px] text-body-sm flex-1 sm:flex-none"
          icon={Sparkles}
        >
          Upgrade to Use AI
        </Button>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* URL Input Modal */}
      <AnimatePresence>
        {showUrlModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1C1917] rounded-xl shadow-xl w-full max-w-md p-6 border border-[#E0DEDB] dark:border-[#44403C] overflow-hidden relative"
            >
              <AnimatePresence mode="wait">
                {isScraping ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    {/* Document icon with animated scan lines */}
                    <div className="relative w-20 h-24 mb-8">
                      <div className="w-full h-full rounded-lg border-2 border-[#E0DEDB] dark:border-[#57534E] bg-[#FAFAF9] dark:bg-[#292524] flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                        <motion.div
                          animate={{ y: ["-100%", "400%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "easeInOut",
                          }}
                          className="absolute left-2 right-2 h-4 bg-gradient-to-b from-transparent via-[#37322F]/5 dark:via-[#F5F5F4]/5 to-transparent rounded z-10"
                        />
                        <div className="space-y-2 w-full px-3">
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0,
                            }}
                            className="h-1.5 bg-[#D6D3D1] dark:bg-[#57534E] rounded-full w-[85%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.2,
                            }}
                            className="h-1.5 bg-[#D6D3D1] dark:bg-[#57534E] rounded-full w-[65%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.4,
                            }}
                            className="h-1.5 bg-[#D6D3D1] dark:bg-[#57534E] rounded-full w-[75%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.6,
                            }}
                            className="h-1.5 bg-[#D6D3D1] dark:bg-[#57534E] rounded-full w-[50%]"
                          />
                        </div>
                      </div>
                      <motion.div
                        animate={{
                          scale: [1, 1.15, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "easeInOut",
                        }}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center shadow-md"
                      >
                        <Sparkles
                          size={14}
                          className="text-white dark:text-[#1C1917]"
                        />
                      </motion.div>
                    </div>

                    <h3 className="text-lg font-bold text-[#37322F] dark:text-[#F5F5F4] mb-1.5 font-serif tracking-tight">
                      Reading your website...
                    </h3>
                    <p className="text-sm text-[#78716C] dark:text-[#A8A29E] max-w-[280px] leading-relaxed">
                      Our AI is scanning the page content and crafting relevant
                      FAQs for your chatbot.
                    </p>
                    <div className="flex gap-1.5 mt-5">
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-[#37322F] dark:bg-[#A8A29E]"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.2,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-[#37322F] dark:bg-[#A8A29E]"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.4,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-[#37322F] dark:bg-[#A8A29E]"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Sparkles
                            size={16}
                            className="text-[#37322F] dark:text-[#F5F5F4]"
                          />
                          <h3 className="text-lg font-bold text-[#37322F] dark:text-[#F5F5F4] font-serif tracking-tight">
                            Generate with AI
                          </h3>
                        </div>
                        <p className="text-xs text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                          Paste a URL and we'll generate FAQs from its content.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowUrlModal(false)}
                        className="text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] p-1 rounded-md hover:bg-[#F5F5F4] dark:hover:bg-[#292524] transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#605A57] dark:text-[#A8A29E] mb-1.5 uppercase tracking-wider">
                          Website URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/about"
                          value={scrapeUrl}
                          onChange={(e) => setScrapeUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-[#E0DEDB] dark:border-[#44403C] rounded-xl focus:ring-2 focus:ring-[#37322F]/10 dark:focus:ring-[#F5F5F4]/10 focus:border-[#37322F] dark:focus:border-[#A8A29E] bg-[#FAFAF9] dark:bg-[#292524] text-[#37322F] dark:text-[#F5F5F4] text-sm outline-none transition-all placeholder-[#A8A29E] dark:placeholder-[#78716C]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#292524]">
                        <div>
                          <p className="text-sm font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                            Deep Crawl
                          </p>
                          <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                            Scans a few linked pages like About, Pricing, and
                            Contact for more complete FAQs.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsDeepCrawl(!isDeepCrawl)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#37322F]/30 dark:focus:ring-[#F5F5F4]/30 focus:ring-offset-2 ${
                            isDeepCrawl
                              ? "bg-[#37322F] dark:bg-[#F5F5F4]"
                              : "bg-[#D6D3D1] dark:bg-[#57534E]"
                          }`}
                          role="switch"
                          aria-checked={isDeepCrawl}
                        >
                          <span
                            className={`${
                              isDeepCrawl ? "translate-x-4" : "translate-x-0"
                            } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#1C1917] shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>

                      <div className="flex gap-3 justify-end pt-2">
                        <Button
                          onClick={() => setShowUrlModal(false)}
                          className="bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] text-[#605A57] dark:text-[#A8A29E] hover:bg-[#FAFAF9] dark:hover:bg-[#1C1917] shadow-sm rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAiScrape}
                          disabled={!scrapeUrl}
                          className="bg-[#37322F] dark:bg-[#F5F5F4] hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] text-white dark:text-[#1C1917] shadow-md rounded-lg min-w-[120px]"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1C1917] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#E0DEDB] dark:border-[#44403C] overflow-hidden"
            >
              <div className="p-6 border-b border-[#E0DEDB] dark:border-[#44403C] flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-[#F5F5F4] dark:bg-[#292524] rounded-lg text-[#37322F] dark:text-[#F5F5F4]">
                      <Sparkles size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-[#37322F] dark:text-[#F5F5F4] font-serif tracking-tight">
                      Review Generated FAQs
                    </h3>
                  </div>
                  <p className="text-sm text-[#78716C] dark:text-[#A8A29E] leading-relaxed max-w-lg">
                    We've extracted the core information from the website. You
                    can edit any text or remove irrelevant questions before
                    adding them.
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] p-1 rounded-lg hover:bg-[#FAFAF9] dark:hover:bg-[#292524] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto overflow-x-hidden space-y-5 bg-[#FAFAF9] dark:bg-[#1C1917] flex-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {pendingFaqs.map((faq, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        transition: { duration: 0.15 },
                      }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      key={index}
                      className="bg-white dark:bg-[#292524] p-5 rounded-2xl shadow-sm border border-[#E0DEDB] dark:border-[#44403C] group relative hover:border-[#37322F]/20 dark:hover:border-[#A8A29E]/30 transition-colors"
                    >
                      <button
                        onClick={() =>
                          setPendingFaqs((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="absolute -right-3 -top-3 bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] text-[#A8A29E] hover:text-red-500 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
                        title="Remove FAQ"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span className="w-4 h-px bg-[#E0DEDB] dark:bg-[#44403C] inline-block"></span>
                            Question
                          </label>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const newFaqs = [...pendingFaqs];
                              newFaqs[index].question = e.target.value;
                              setPendingFaqs(newFaqs);
                            }}
                            className="w-full bg-[#FAFAF9] dark:bg-[#1C1917] border border-transparent hover:border-[#E0DEDB] dark:hover:border-[#44403C] px-3 py-2 rounded-lg text-[#37322F] dark:text-[#F5F5F4] font-medium outline-none focus:bg-white dark:focus:bg-[#292524] focus:border-[#37322F]/30 dark:focus:border-[#A8A29E]/30 focus:ring-4 focus:ring-[#37322F]/5 dark:focus:ring-[#F5F5F4]/5 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span className="w-4 h-px bg-[#E0DEDB] dark:bg-[#44403C] inline-block"></span>
                            Answer
                          </label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => {
                              const newFaqs = [...pendingFaqs];
                              newFaqs[index].answer = e.target.value;
                              setPendingFaqs(newFaqs);
                            }}
                            className="w-full bg-[#FAFAF9] dark:bg-[#1C1917] border border-transparent hover:border-[#E0DEDB] dark:hover:border-[#44403C] px-3 py-2.5 rounded-lg text-[#605A57] dark:text-[#A8A29E] text-sm resize-none outline-none focus:bg-white dark:focus:bg-[#292524] focus:border-[#37322F]/30 dark:focus:border-[#A8A29E]/30 focus:ring-4 focus:ring-[#37322F]/5 dark:focus:ring-[#F5F5F4]/5 transition-all min-h-[80px]"
                            rows={3}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {pendingFaqs.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#292524] rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
                      <Check size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-[#37322F] dark:text-[#F5F5F4] mb-1">
                      You're all clear!
                    </h4>
                    <p className="text-sm text-[#78716C] dark:text-[#A8A29E] max-w-[250px]">
                      You've discarded all the generated questions. You can
                      close this modal or generate again.
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="p-4 border-t border-[#E0DEDB] dark:border-[#44403C] flex justify-end gap-3 shrink-0 bg-white dark:bg-[#1C1917]">
                <Button
                  onClick={() => setShowReviewModal(false)}
                  className="bg-transparent border border-[#E0DEDB] dark:border-[#44403C] text-[#605A57] dark:text-[#A8A29E] hover:bg-[#FAFAF9] dark:hover:bg-[#292524] shadow-none"
                >
                  Discard All
                </Button>
                <Button
                  onClick={() => {
                    const cleanFaqs = pendingFaqs.map(
                      ({ isOpen, ...rest }) => rest
                    );
                    onFaqsApproved(cleanFaqs);
                    setShowReviewModal(false);
                    setPendingFaqs([]);
                    toast.success("Added to chatbot!");
                  }}
                  disabled={pendingFaqs.length === 0}
                  className="bg-[#37322F] dark:bg-[#F5F5F4] hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] text-white dark:text-[#1C1917] shadow-md"
                >
                  Add {pendingFaqs.length} FAQs to Chatbot
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiFaqGenerator;
