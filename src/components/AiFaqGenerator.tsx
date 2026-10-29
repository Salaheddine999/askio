import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
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
import { LiveOrb } from "./LiveOrb";

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

// Both windows fade in with plain CSS; Headless UI handles focus, Escape and scroll.
const backdropClass =
  "fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out data-[closed]:opacity-0";
const panelTransition = "transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0";
const closeButton =
  "rounded-md p-1 text-ink-545 transition-colors hover:bg-ink-70 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/25 dark:hover:bg-ink-850 dark:focus-visible:ring-ink-130/40";

// The page Kio reads while it drafts FAQs: four lines, the current one
// darker, and Kio's gaze stepping along each line, then down to the next.
const READING_LINES = ["w-[85%]", "w-[65%]", "w-[75%]", "w-[50%]"];
const LINE_Y = [0.34, 0.12, -0.1, -0.32];

const ReadingKio: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setStep((n) => (n + 1) % (READING_LINES.length * 2)), 600);
    return () => window.clearInterval(id);
  }, [reduceMotion]);
  const line = Math.floor(step / 2);

  return (
    <div className="mb-8 flex items-end gap-3" aria-hidden="true">
      <div className="flex h-24 w-20 flex-col justify-center gap-2.5 rounded-lg border border-ink-120 bg-ink-30 px-3 dark:border-ink-710 dark:bg-ink-850">
        {READING_LINES.map((width, i) => (
          <div
            key={width}
            className={`h-1.5 rounded-full transition-colors duration-300 ${width} ${
              i === line ? "bg-ink-425 dark:bg-ink-325" : "bg-ink-130 dark:bg-ink-710"
            }`}
          />
        ))}
      </div>
      <LiveOrb size={56} interactive={false} lookAt={{ x: step % 2 ? -0.35 : -0.75, y: LINE_Y[line] }} />
    </div>
  );
};

// Kio smiles as the drafted answers arrive, then settles.
const HappyKio: React.FC = () => {
  const [happy, setHappy] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setHappy(false), 2200);
    return () => window.clearTimeout(id);
  }, []);
  return <LiveOrb size={32} mood={happy ? "happy" : "idle"} />;
};

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
      {/* While Kio reads the site, Escape and outside clicks don't close it,
          so the request isn't cut off halfway. */}
      <Dialog open={showUrlModal} onClose={() => !isScraping && setShowUrlModal(false)} className="relative z-50">
        <DialogBackdrop transition className={backdropClass} />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className={`relative w-full max-w-md overflow-hidden rounded-xl border border-ink-120 bg-ink-25 p-6 shadow-lg dark:border-ink-780 dark:bg-ink-875 ${panelTransition}`}
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
                    <ReadingKio />

                    <DialogTitle className="mb-1.5 font-display text-h3 tracking-tight text-fg">
                      {t("readingSite")}
                    </DialogTitle>
                    <p className="max-w-[280px] text-body-sm text-fg-muted">
                      {t("readingSiteDesc")}
                    </p>
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
                          <DialogTitle className="font-display text-h3 tracking-tight text-fg">
                            {t("generateWithAi")}
                          </DialogTitle>
                        </div>
                        <p className="text-body-sm text-fg-muted">
                          {t("generateDesc")}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowUrlModal(false)}
                        aria-label={t("close")}
                        className={closeButton}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-caption font-medium text-fg-muted">
                          {t("websiteUrl")}
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/about"
                          value={scrapeUrl}
                          onChange={(e) => setScrapeUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-ink-120 dark:border-ink-780 rounded-xl focus:ring-2 focus:ring-ink-900/10 dark:focus:ring-ink-130/10 focus:border-ink-900 dark:focus:border-ink-325 bg-ink-30 dark:bg-ink-850 text-fg text-body-sm outline-none transition-all placeholder-ink-545 dark:placeholder-ink-425"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border border-ink-120 dark:border-ink-780 bg-ink-30 dark:bg-ink-850">
                        <div>
                          <p className="text-body-sm font-medium text-fg">
                            {t("deepCrawl")}
                          </p>
                          <p className="mt-0.5 text-caption text-fg-subtle">
                            {t("deepCrawlDesc")}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsDeepCrawl(!isDeepCrawl)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/30 dark:focus-visible:ring-ink-130/30 focus-visible:ring-offset-2 ${
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
          </DialogPanel>
        </div>
      </Dialog>

      {/* FAQ Review Modal */}
      <Dialog open={showReviewModal} onClose={() => setShowReviewModal(false)} className="relative z-[60]">
        <DialogBackdrop transition className={backdropClass} />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className={`flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-ink-120 bg-ink-25 shadow-lg dark:border-ink-780 dark:bg-ink-875 ${panelTransition}`}
          >
              <div className="p-6 border-b border-ink-120 dark:border-ink-780 flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <HappyKio />
                    <DialogTitle className="font-display text-h3 tracking-tight text-fg">
                      {t("reviewTitle")}
                    </DialogTitle>
                  </div>
                  <p className="max-w-lg text-body-sm text-fg-muted">
                    {t("reviewDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  aria-label={t("close")}
                  className={closeButton}
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
                        className="absolute -right-3 -top-3 bg-ink-25 dark:bg-ink-850 border border-ink-120 dark:border-ink-780 text-ink-545 hover:text-red-500 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition-colors hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
                        title={t("removeFaq")}
                        aria-label={t("removeFaq")}
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="space-y-4">
                        <div>
                          <label className="mb-1.5 block text-caption font-medium text-fg-muted">
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
                            className="w-full bg-ink-30 dark:bg-ink-875 border border-transparent hover:border-ink-120 dark:hover:border-ink-780 px-3 py-2 rounded-lg text-fg font-medium outline-none focus:bg-ink-25 dark:focus:bg-ink-850 focus:border-ink-900/30 dark:focus:border-ink-325/30 focus:ring-4 focus:ring-ink-900/5 dark:focus:ring-ink-130/5 transition-all text-body-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-caption font-medium text-fg-muted">
                            {t("answer")}
                          </label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => {
                              const newFaqs = [...pendingFaqs];
                              newFaqs[index].answer = e.target.value;
                              setPendingFaqs(newFaqs);
                            }}
                            className="w-full bg-ink-30 dark:bg-ink-875 border border-transparent hover:border-ink-120 dark:hover:border-ink-780 px-3 py-2.5 rounded-lg text-fg-muted text-body-sm resize-none outline-none focus:bg-ink-25 dark:focus:bg-ink-850 focus:border-ink-900/30 dark:focus:border-ink-325/30 focus:ring-4 focus:ring-ink-900/5 dark:focus:ring-ink-130/5 transition-all min-h-[80px]"
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
                    <h4 className="mb-1 text-body font-semibold text-fg">
                      {t("allClear")}
                    </h4>
                    <p className="max-w-[250px] text-body-sm text-fg-muted">
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
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default AiFaqGenerator;
