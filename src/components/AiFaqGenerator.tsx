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
import { primaryButton, secondaryButton } from "../pages/dashboard/ui";
import { apiRequest } from "../utils/api";
import UpgradeModal from "./UpgradeModal";
import { useNavigate } from "react-router-dom";
import { useT } from "../i18n";
import { editorMessages } from "../i18n/messages/editor";

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
  const t = useT(editorMessages);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingFaqs, setPendingFaqs] = useState<FAQItem[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isDeepCrawl, setIsDeepCrawl] = useState(false);

  const openGeneratedFaqs = (newFaqs: { question: string; answer: string }[]) => {
    const faqsWithState = newFaqs.map((faq) => ({
      ...faq,
      isOpen: false,
    }));

    setPendingFaqs(faqsWithState);
    setShowReviewModal(true);
    toast.success(t.plural("foundQuestions", newFaqs.length));
    setShowUrlModal(false);
    setScrapeUrl("");
  };

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    try {
      const normalized = new URL(withProtocol);
      if (!["http:", "https:"].includes(normalized.protocol)) {
        return null;
      }

      return normalized.toString();
    } catch {
      return null;
    }
  };

  const handleAiScrape = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error(t("mustBeLoggedIn"));
      return;
    }

    if (!aiEnabled) {
      toast.error(t("enableAiFirst"));
      return;
    }

    const normalizedUrl = normalizeUrl(scrapeUrl);

    if (!normalizedUrl) {
      toast.error(t("invalidUrl"));
      return;
    }

    try {
      setIsScraping(true);
      const resolvedChatbotId = chatbotId || (await ensureChatbotSaved?.());

      if (!resolvedChatbotId) {
        toast.error(t("completeDetailsFirst"));
        return;
      }

      const { faqs: newFaqs } = await apiRequest<{ faqs: { question: string; answer: string }[] }>(
        "/api/ai/generate-faq",
        {
          authRequired: true,
          body: {
            chatbotId: resolvedChatbotId,
            url: normalizedUrl,
            isDeepCrawl,
            aiTone,
          },
        }
      );
      openGeneratedFaqs(newFaqs);
    } catch (error: unknown) {
      console.error("Scraping error:", error);

      if (
        import.meta.env.DEV &&
        error instanceof Error &&
        /timed too long|gateway timeout|504/i.test(error.message)
      ) {
        try {
          const { generateFaqsFromUrl } = await import("../utils/ai");
          const fallbackFaqs = await generateFaqsFromUrl(
            normalizedUrl,
            isDeepCrawl,
            aiTone
          );
          openGeneratedFaqs(fallbackFaqs);
          return;
        } catch (fallbackError) {
          console.error("Client-side FAQ fallback failed:", fallbackError);
        }
      }

      if (
        !canUseAi &&
        error instanceof Error &&
        /pro|enterprise|limit|enable ai|subscription/i.test(error.message)
      ) {
        setShowUpgradeModal(true);
      }
      toast.error(
        (error instanceof Error ? error.message : null) || t("generateFailed")
      );
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      {/* AI Trigger Button */}
      {canUseAi ? (
        <button
          type="button"
          onClick={() => {
            if (!aiEnabled) {
              toast.error(t("turnOnAiToGenerate"));
              return;
            }
            setShowUrlModal(true);
          }}
          title={aiEnabled ? t("generateTooltip") : t("turnOnAiFirstTooltip")}
          className={secondaryButton}
        >
          <Sparkles size={15} />
          {t("generateWithAi")}
        </button>
      ) : (
        <button type="button" onClick={() => navigate("/plans")} className={secondaryButton}>
          <Sparkles size={15} />
          {t("generateWithAi")}
          <span className="rounded bg-[#E7EDF6] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[#566273] dark:bg-[#273444] dark:text-[#9BAABD]">
            Pro
          </span>
        </button>
      )}

      {/* Upgrade Modal */}
      {!canUseAi && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

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
              className="bg-[#F9FCFF] dark:bg-[#141D2B] rounded-xl shadow-xl w-full max-w-md p-6 border border-[#D8DFE9] dark:border-[#2B3646] overflow-hidden relative"
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
                      <div className="w-full h-full rounded-lg border-2 border-[#D8DFE9] dark:border-[#39485B] bg-[#F3F7FC] dark:bg-[#1A2533] flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                        <motion.div
                          animate={{ y: ["-100%", "400%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "easeInOut",
                          }}
                          className="absolute left-2 right-2 h-4 bg-gradient-to-b from-transparent via-[#101723]/5 dark:via-[#D7DFE5]/5 to-transparent rounded z-10"
                        />
                        <div className="space-y-2 w-full px-3">
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0,
                            }}
                            className="h-1.5 bg-[#D7DFE5] dark:bg-[#39485B] rounded-full w-[85%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.2,
                            }}
                            className="h-1.5 bg-[#D7DFE5] dark:bg-[#39485B] rounded-full w-[65%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.4,
                            }}
                            className="h-1.5 bg-[#D7DFE5] dark:bg-[#39485B] rounded-full w-[75%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.6,
                            }}
                            className="h-1.5 bg-[#D7DFE5] dark:bg-[#39485B] rounded-full w-[50%]"
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
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#101723] dark:bg-[#D7DFE5] flex items-center justify-center shadow-md"
                      >
                        <Sparkles
                          size={14}
                          className="text-white dark:text-[#141D2B]"
                        />
                      </motion.div>
                    </div>

                    <h3 className="text-lg font-bold text-[#101723] dark:text-[#D7DFE5] mb-1.5 font-serif tracking-tight">
                      {t("readingSite")}
                    </h3>
                    <p className="text-sm text-[#647184] dark:text-[#9BAABD] max-w-[280px] leading-relaxed">
                      {t("readingSiteDesc")}
                    </p>
                    <div className="flex gap-1.5 mt-5">
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-[#101723] dark:bg-[#9BAABD]"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.2,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-[#101723] dark:bg-[#9BAABD]"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.4,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-[#101723] dark:bg-[#9BAABD]"
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
                            className="text-[#101723] dark:text-[#D7DFE5]"
                          />
                          <h3 className="text-lg font-bold text-[#101723] dark:text-[#D7DFE5] font-serif tracking-tight">
                            {t("generateWithAi")}
                          </h3>
                        </div>
                        <p className="text-xs text-[#647184] dark:text-[#9BAABD] leading-relaxed">
                          {t("generateDesc")}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowUrlModal(false)}
                        aria-label={t("close")}
                        className="text-[#647184] hover:text-[#101723] dark:hover:text-[#D7DFE5] p-1 rounded-md hover:bg-[#E7EDF6] dark:hover:bg-[#1A2533] transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#566273] dark:text-[#9BAABD] mb-1.5 uppercase tracking-wider">
                          {t("websiteUrl")}
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/about"
                          value={scrapeUrl}
                          onChange={(e) => setScrapeUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-[#D8DFE9] dark:border-[#2B3646] rounded-xl focus:ring-2 focus:ring-[#101723]/10 dark:focus:ring-[#D7DFE5]/10 focus:border-[#101723] dark:focus:border-[#9BAABD] bg-[#F3F7FC] dark:bg-[#1A2533] text-[#101723] dark:text-[#D7DFE5] text-sm outline-none transition-all placeholder-[#647184] dark:placeholder-[#87909D]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border border-[#D8DFE9] dark:border-[#2B3646] bg-[#F3F7FC] dark:bg-[#1A2533]">
                        <div>
                          <p className="text-sm font-semibold text-[#101723] dark:text-[#D7DFE5]">
                            {t("deepCrawl")}
                          </p>
                          <p className="text-xs text-[#647184] dark:text-[#9BAABD] mt-0.5">
                            {t("deepCrawlDesc")}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsDeepCrawl(!isDeepCrawl)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#101723]/30 dark:focus:ring-[#D7DFE5]/30 focus:ring-offset-2 ${
                            isDeepCrawl
                              ? "bg-[#101723] dark:bg-[#D7DFE5]"
                              : "bg-[#D7DFE5] dark:bg-[#39485B]"
                          }`}
                          role="switch"
                          aria-checked={isDeepCrawl}
                          aria-label={t("deepCrawl")}
                        >
                          <span
                            className={`${
                              isDeepCrawl ? "translate-x-4" : "translate-x-0"
                            } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#F9FCFF] dark:bg-[#141D2B] shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>

                      <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={() => setShowUrlModal(false)} className={secondaryButton}>
                          {t("cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={handleAiScrape}
                          disabled={!scrapeUrl.trim()}
                          className={`${primaryButton} min-w-[110px]`}
                        >
                          {t("generate")}
                        </button>
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
              className="bg-[#F9FCFF] dark:bg-[#141D2B] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#D8DFE9] dark:border-[#2B3646] overflow-hidden"
            >
              <div className="p-6 border-b border-[#D8DFE9] dark:border-[#2B3646] flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-[#E7EDF6] dark:bg-[#1A2533] rounded-lg text-[#101723] dark:text-[#D7DFE5]">
                      <Sparkles size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-[#101723] dark:text-[#D7DFE5] font-serif tracking-tight">
                      {t("reviewTitle")}
                    </h3>
                  </div>
                  <p className="text-sm text-[#647184] dark:text-[#9BAABD] leading-relaxed max-w-lg">
                    {t("reviewDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  aria-label={t("close")}
                  className="text-[#647184] hover:text-[#101723] dark:hover:text-[#D7DFE5] p-1 rounded-lg hover:bg-[#F3F7FC] dark:hover:bg-[#1A2533] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto overflow-x-hidden space-y-5 bg-[#F3F7FC] dark:bg-[#141D2B] flex-1 custom-scrollbar">
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
                      className="bg-[#F9FCFF] dark:bg-[#1A2533] p-5 rounded-2xl shadow-sm border border-[#D8DFE9] dark:border-[#2B3646] group relative hover:border-[#101723]/20 dark:hover:border-[#9BAABD]/30 transition-colors"
                    >
                      <button
                        onClick={() =>
                          setPendingFaqs((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="absolute -right-3 -top-3 bg-[#F9FCFF] dark:bg-[#1A2533] border border-[#D8DFE9] dark:border-[#2B3646] text-[#647184] hover:text-red-500 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
                        title={t("removeFaq")}
                        aria-label={t("removeFaq")}
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#647184] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span className="w-4 h-px bg-[#D8DFE9] dark:bg-[#273444] inline-block"></span>
                            {t("question")}
                          </label>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const newFaqs = [...pendingFaqs];
                              newFaqs[index].question = e.target.value;
                              setPendingFaqs(newFaqs);
                            }}
                            className="w-full bg-[#F3F7FC] dark:bg-[#141D2B] border border-transparent hover:border-[#D8DFE9] dark:hover:border-[#2B3646] px-3 py-2 rounded-lg text-[#101723] dark:text-[#D7DFE5] font-medium outline-none focus:bg-[#F9FCFF] dark:focus:bg-[#1A2533] focus:border-[#101723]/30 dark:focus:border-[#9BAABD]/30 focus:ring-4 focus:ring-[#101723]/5 dark:focus:ring-[#D7DFE5]/5 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#647184] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span className="w-4 h-px bg-[#D8DFE9] dark:bg-[#273444] inline-block"></span>
                            {t("answer")}
                          </label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => {
                              const newFaqs = [...pendingFaqs];
                              newFaqs[index].answer = e.target.value;
                              setPendingFaqs(newFaqs);
                            }}
                            className="w-full bg-[#F3F7FC] dark:bg-[#141D2B] border border-transparent hover:border-[#D8DFE9] dark:hover:border-[#2B3646] px-3 py-2.5 rounded-lg text-[#566273] dark:text-[#9BAABD] text-sm resize-none outline-none focus:bg-[#F9FCFF] dark:focus:bg-[#1A2533] focus:border-[#101723]/30 dark:focus:border-[#9BAABD]/30 focus:ring-4 focus:ring-[#101723]/5 dark:focus:ring-[#D7DFE5]/5 transition-all min-h-[80px]"
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
                    <div className="w-16 h-16 bg-[#E7EDF6] dark:bg-[#1A2533] rounded-full flex items-center justify-center mb-4 text-[#87909D] dark:text-[#647184]">
                      <Check size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-[#101723] dark:text-[#D7DFE5] mb-1">
                      {t("allClear")}
                    </h4>
                    <p className="text-sm text-[#647184] dark:text-[#9BAABD] max-w-[250px]">
                      {t("allClearDesc")}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="p-4 border-t border-[#D8DFE9] dark:border-[#2B3646] flex justify-end gap-3 shrink-0 bg-[#F9FCFF] dark:bg-[#141D2B]">
                <button type="button" onClick={() => setShowReviewModal(false)} className={secondaryButton}>
                  {t("discardAll")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanFaqs = pendingFaqs.map(
                      ({ isOpen, ...rest }) => rest
                    );
                    onFaqsApproved(cleanFaqs);
                    setShowReviewModal(false);
                    setPendingFaqs([]);
                    toast.success(t("addedToast"));
                  }}
                  disabled={pendingFaqs.length === 0}
                  className={primaryButton}
                >
                  {t.plural("addQuestions", pendingFaqs.length)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiFaqGenerator;
