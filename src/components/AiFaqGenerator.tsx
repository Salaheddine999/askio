import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../utils/firebase";
import {
  Trash2,
  Check,
  X,
} from "./icons";
import { toast } from "react-hot-toast";
import { primaryButton, secondaryButton } from "../pages/dashboard/ui";
import { apiRequest } from "../utils/api";
import UpgradeModal from "./UpgradeModal";
import { useNavigate } from "react-router-dom";
import { useT } from "../i18n";
import { editorMessages } from "../i18n/messages/editor";
import { AiIcon } from "./icons";

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
    if (newFaqs.length === 0) {
      toast.error(t("noFactsFound"));
      return;
    }
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
          <AiIcon size={15} />
          {t("generateWithAi")}
        </button>
      ) : (
        <button type="button" onClick={() => navigate("/plans")} className={secondaryButton}>
          <AiIcon size={15} />
          {t("generateWithAi")}
          <span className="rounded bg-ink-70 px-1.5 py-px text-caption font-semibold text-ink-605 dark:bg-ink-790 dark:text-ink-325">
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-ink-25 dark:bg-ink-875 rounded-xl shadow-lg w-full max-w-md p-6 border border-ink-120 dark:border-ink-780 overflow-hidden relative"
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
                      <div className="w-full h-full rounded-lg border-2 border-ink-120 dark:border-ink-710 bg-ink-30 dark:bg-ink-850 flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                        <motion.div
                          animate={{ y: ["-100%", "400%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "easeInOut",
                          }}
                          className="absolute left-2 right-2 h-4 bg-gradient-to-b from-transparent via-ink-900/5 dark:via-ink-130/5 to-transparent rounded z-10"
                        />
                        <div className="space-y-2 w-full px-3">
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0,
                            }}
                            className="h-1.5 bg-ink-130 dark:bg-ink-710 rounded-full w-[85%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.2,
                            }}
                            className="h-1.5 bg-ink-130 dark:bg-ink-710 rounded-full w-[65%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.4,
                            }}
                            className="h-1.5 bg-ink-130 dark:bg-ink-710 rounded-full w-[75%]"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.6,
                            }}
                            className="h-1.5 bg-ink-130 dark:bg-ink-710 rounded-full w-[50%]"
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
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-ink-900 dark:bg-ink-130 flex items-center justify-center shadow-md"
                      >
                        <AiIcon
                          size={14}
                          className="text-white dark:text-ink-875"
                        />
                      </motion.div>
                    </div>

                    <h3 className="text-lg font-bold text-fg mb-1.5 font-display tracking-tight">
                      {t("readingSite")}
                    </h3>
                    <p className="text-sm text-ink-545 dark:text-ink-325 max-w-[280px] leading-relaxed">
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
                        className="w-1.5 h-1.5 rounded-full bg-ink-900 dark:bg-ink-325"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.2,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-ink-900 dark:bg-ink-325"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.4,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-ink-900 dark:bg-ink-325"
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
                          <AiIcon
                            size={16}
                            className="text-fg"
                          />
                          <h3 className="text-lg font-bold text-fg font-display tracking-tight">
                            {t("generateWithAi")}
                          </h3>
                        </div>
                        <p className="text-xs text-ink-545 dark:text-ink-325 leading-relaxed">
                          {t("generateDesc")}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowUrlModal(false)}
                        aria-label={t("close")}
                        className="text-ink-545 hover:text-fg p-1 rounded-md hover:bg-ink-70 dark:hover:bg-ink-850 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-fg-muted mb-1.5">
                          {t("websiteUrl")}
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/about"
                          value={scrapeUrl}
                          onChange={(e) => setScrapeUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-ink-120 dark:border-ink-780 rounded-xl focus:ring-2 focus:ring-ink-900/10 dark:focus:ring-ink-130/10 focus:border-ink-900 dark:focus:border-ink-325 bg-ink-30 dark:bg-ink-850 text-fg text-sm outline-none transition-all placeholder-ink-545 dark:placeholder-ink-425"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border border-ink-120 dark:border-ink-780 bg-ink-30 dark:bg-ink-850">
                        <div>
                          <p className="text-sm font-semibold text-fg">
                            {t("deepCrawl")}
                          </p>
                          <p className="text-xs text-ink-545 dark:text-ink-325 mt-0.5">
                            {t("deepCrawlDesc")}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsDeepCrawl(!isDeepCrawl)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ink-900/30 dark:focus:ring-ink-130/30 focus:ring-offset-2 ${
                            isDeepCrawl
                              ? "bg-ink-900 dark:bg-ink-130"
                              : "bg-ink-130 dark:bg-ink-710"
                          }`}
                          role="switch"
                          aria-checked={isDeepCrawl}
                          aria-label={t("deepCrawl")}
                        >
                          <span
                            className={`${
                              isDeepCrawl ? "translate-x-4" : "translate-x-0"
                            } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-ink-25 dark:bg-ink-875 shadow ring-0 transition duration-200 ease-in-out`}
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-ink-25 dark:bg-ink-875 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col border border-ink-120 dark:border-ink-780 overflow-hidden"
            >
              <div className="p-6 border-b border-ink-120 dark:border-ink-780 flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-ink-70 dark:bg-ink-850 rounded-lg text-fg">
                      <AiIcon size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-fg font-display tracking-tight">
                      {t("reviewTitle")}
                    </h3>
                  </div>
                  <p className="text-sm text-ink-545 dark:text-ink-325 leading-relaxed max-w-lg">
                    {t("reviewDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  aria-label={t("close")}
                  className="text-ink-545 hover:text-fg p-1 rounded-lg hover:bg-ink-30 dark:hover:bg-ink-850 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto overflow-x-hidden space-y-5 bg-ink-30 dark:bg-ink-875 flex-1 custom-scrollbar">
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
                      className="bg-ink-25 dark:bg-ink-850 p-5 rounded-2xl shadow-sm border border-ink-120 dark:border-ink-780 group relative hover:border-ink-900/20 dark:hover:border-ink-325/30 transition-colors"
                    >
                      <button
                        onClick={() =>
                          setPendingFaqs((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="absolute -right-3 -top-3 bg-ink-25 dark:bg-ink-850 border border-ink-120 dark:border-ink-780 text-ink-545 hover:text-red-500 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
                        title={t("removeFaq")}
                        aria-label={t("removeFaq")}
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-caption font-bold text-ink-545 mb-1.5 flex items-center gap-1.5">
                            <span className="w-4 h-px bg-ink-120 dark:bg-ink-790 inline-block"></span>
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
                            className="w-full bg-ink-30 dark:bg-ink-875 border border-transparent hover:border-ink-120 dark:hover:border-ink-780 px-3 py-2 rounded-lg text-fg font-medium outline-none focus:bg-ink-25 dark:focus:bg-ink-850 focus:border-ink-900/30 dark:focus:border-ink-325/30 focus:ring-4 focus:ring-ink-900/5 dark:focus:ring-ink-130/5 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-caption font-bold text-ink-545 mb-1.5 flex items-center gap-1.5">
                            <span className="w-4 h-px bg-ink-120 dark:bg-ink-790 inline-block"></span>
                            {t("answer")}
                          </label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => {
                              const newFaqs = [...pendingFaqs];
                              newFaqs[index].answer = e.target.value;
                              setPendingFaqs(newFaqs);
                            }}
                            className="w-full bg-ink-30 dark:bg-ink-875 border border-transparent hover:border-ink-120 dark:hover:border-ink-780 px-3 py-2.5 rounded-lg text-fg-muted text-sm resize-none outline-none focus:bg-ink-25 dark:focus:bg-ink-850 focus:border-ink-900/30 dark:focus:border-ink-325/30 focus:ring-4 focus:ring-ink-900/5 dark:focus:ring-ink-130/5 transition-all min-h-[80px]"
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
                    <div className="w-16 h-16 bg-ink-70 dark:bg-ink-850 rounded-full flex items-center justify-center mb-4 text-ink-425 dark:text-ink-545">
                      <Check size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-fg mb-1">
                      {t("allClear")}
                    </h4>
                    <p className="text-sm text-ink-545 dark:text-ink-325 max-w-[250px]">
                      {t("allClearDesc")}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="p-4 border-t border-ink-120 dark:border-ink-780 flex justify-end gap-3 shrink-0 bg-ink-25 dark:bg-ink-875">
                <button type="button" onClick={() => setShowReviewModal(false)} className={secondaryButton}>
                  {t("discardAll")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanFaqs = pendingFaqs.map(
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      ({ isOpen: _isOpen, ...rest }) => rest
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
