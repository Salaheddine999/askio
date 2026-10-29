import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Eye, EyeOff } from "./icons";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import { apiRequest } from "../utils/api";
import { normalizeContactLink } from "../utils/links";
import { useMediaQuery } from "../hooks/useMediaQuery";
import Chatbot from "./Chatbot";
import BotAvatar from "./BotAvatar";
import { Skeleton, SkeletonCard } from "./Skeleton";
import ConfirmationModal from "./ConfirmationModal";
import { focusRing, primaryButton, secondaryButton } from "../pages/dashboard/ui";
import { backLink } from "../pages/dashboard/styles";
import { Panel } from "./editor/controls";
import { ChatbotConfig, ConfigChange, Plan } from "./editor/types";
import GeneralTab, { GeneralErrors } from "./editor/GeneralTab";
import AppearanceTab from "./editor/AppearanceTab";
import FaqTab from "./editor/FaqTab";
import EmbedTab from "./editor/EmbedTab";
import PreviewFrame from "./editor/PreviewFrame";
import { useTabScroller } from "../hooks/useTabScroller";
import { makeT, useLanguage, useT, type Lang } from "../i18n";
import { widgetMessages } from "../i18n/widget";
import { editorMessages } from "../i18n/messages/editor";
import { AiIcon } from "./icons";

// Dynamic import: AI feature is optional (not included in open-source builds)
const aiModules = import.meta.glob('./AiFaqGenerator.tsx');
const aiModuleLoader = Object.values(aiModules)[0];
const AiFaqGenerator = aiModuleLoader
  ? lazy(() => aiModuleLoader() as Promise<{ default: React.ComponentType<Record<string, unknown>> }>)
  : null;

const aiPersonaModules = import.meta.glob('./AiPersonaTab.tsx');
const aiPersonaModuleLoader = Object.values(aiPersonaModules)[0];
const AiPersonaTab = aiPersonaModuleLoader
  ? lazy(() => aiPersonaModuleLoader() as Promise<{ default: React.ComponentType<Record<string, unknown>> }>)
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

const DEFAULT_CONFIG: ChatbotConfig = {
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
  showSources: true,
  aiEnabled: false,
  aiTone: "",
  language: "en",
};

/** A blank chatbot whose widget speaks the app's language. */
function newChatbotConfig(lang: Lang): ChatbotConfig {
  const w = makeT(widgetMessages, lang);
  return { ...DEFAULT_CONFIG, language: lang, initialMessage: w("defaultWelcome"), placeholder: w("defaultPlaceholder") };
}

type TabKey = "general" | "appearance" | "faq" | "ai" | "embed";

type EditorKey = keyof (typeof editorMessages)["en"];

const TABS: { key: TabKey; label: EditorKey }[] = [
  { key: "general", label: "tabGeneral" },
  { key: "appearance", label: "tabAppearance" },
  { key: "faq", label: "tabFaq" },
  ...(AiPersonaTab ? [{ key: "ai" as const, label: "tabAi" as const }] : []),
  { key: "embed", label: "tabInstall" },
];

const CORNER: Record<ChatbotConfig["position"], string> = {
  "bottom-right": "bottom-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "top-right": "top-0 right-0",
  "top-left": "top-0 left-0",
};

const leadCaptureOn = (c: ChatbotConfig) =>
  c.enableLeadCapture === true || (c.enableLeadCapture as unknown as string) === "true";

const EditorSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div className="space-y-6" aria-busy="true" aria-label={label}>
    <div className="space-y-3">
      <Skeleton className="h-3.5 w-20" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-8 w-56" />
      </div>
    </div>
    <div className="flex gap-6 border-b border-ink-120 pb-3 dark:border-ink-780">
      {[64, 84, 72, 76, 52].map((w) => (
        <Skeleton key={w} className="h-4" style={{ width: w }} />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-5">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i}>
            <div className="border-b border-ink-70 px-6 py-4 dark:border-ink-780">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-3.5 w-56" />
            </div>
            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </SkeletonCard>
        ))}
      </div>
      <Skeleton className="hidden h-[640px] rounded-xl xl:block" />
    </div>
  </div>
);

const EditChatbot: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const t = useT(editorMessages);
  const { lang } = useLanguage();

  // Analytics links here with a question nobody could get answered.
  const faqQuestion = (location.state as { faqQuestion?: string } | null)?.faqQuestion ?? null;
  // Back goes where the owner came from on the dashboard; otherwise to the
  // chatbot list, the editor's natural parent.
  const from = (location.state as { from?: string } | null)?.from;
  const backTo = from?.startsWith("/dashboard") ? from : "/dashboard?tab=chatbots";

  // A new chatbot starts in the app's language, and that start is the saved baseline.
  const [config, setConfig] = useState<ChatbotConfig>(() => (id ? DEFAULT_CONFIG : newChatbotConfig(lang)));
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(id ? DEFAULT_CONFIG : newChatbotConfig(lang)));
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [linkTouched, setLinkTouched] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [canUseAi, setCanUseAi] = useState(false);
  const [userPlan, setUserPlan] = useState<Plan>("free");
  const loadedId = useRef<string | null>(null);
  // Wide screens get the preview beside the form; others float it on demand.
  const wide = useMediaQuery("(min-width: 1280px)");

  const requestedTab = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey =
    requestedTab && TABS.some((tab) => tab.key === requestedTab) ? requestedTab : faqQuestion ? "faq" : "general";
  const tabScroller = useTabScroller<HTMLElement>(activeTab);
  const setActiveTab = useCallback(
    (tab: TabKey) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "general") next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true, state: location.state }
      ),
    [setSearchParams, location.state]
  );

  const hasChanges = useMemo(() => JSON.stringify(config) !== savedJson, [config, savedJson]);

  useEffect(() => {
    if (!id) {
      // From an existing chatbot to "New chatbot": start over.
      if (loadedId.current) {
        loadedId.current = null;
        const fresh = newChatbotConfig(lang);
        setConfig(fresh);
        setSavedJson(JSON.stringify(fresh));
        setShowErrors(false);
      }
      setLoading(false);
      return;
    }
    if (loadedId.current === id) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, "chatbot_configs", id));
        if (!snap.exists()) throw new Error(t("notFound"));
        if (cancelled) return;
        const data = { ...DEFAULT_CONFIG, ...snap.data(), id } as ChatbotConfig;
        loadedId.current = id;
        setConfig(data);
        setSavedJson(JSON.stringify(data));
        setShowErrors(false);
      } catch (error) {
        console.error("Error loading chatbot config:", error);
        if (!cancelled) toast.error(t("loadFailed", { error: (error as Error).message }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only a change of chatbot reloads; switching the app language mid-edit shouldn't.
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    (async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userSnap.data();
        const storedPlan = (userData?.plan || (userData?.isPro ? "pro" : "free")) as Plan;
        const subscriptionStatus =
          userData?.subscriptionStatus || (storedPlan === "free" ? "inactive" : "active");
        const paidThroughPeriodEnd = hasPaidAccessUntilPeriodEnd(subscriptionStatus, userData?.currentPeriodEnd);
        const plan: Plan =
          storedPlan === "enterprise" ? "enterprise" : storedPlan === "pro" || paidThroughPeriodEnd ? "pro" : "free";
        const allowed =
          plan === "enterprise" ||
          (plan === "pro" &&
            (["active", "trialing", "on_trial"].includes(subscriptionStatus) || paidThroughPeriodEnd));

        setUserPlan(plan);
        setCanUseAi(allowed);
      } catch (error) {
        console.error("Error loading user plan:", error);
        setUserPlan("free");
        setCanUseAi(false);
      }
    })();
  }, []);

  const handleChange: ConfigChange = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Only a handoff link that the widget will actually show needs to be valid.
  const linkInvalid =
    !leadCaptureOn(config) && !!config.liveChatLink && normalizeContactLink(config.liveChatLink) === null;

  const errors: GeneralErrors = {
    name: showErrors && !config.name.trim() ? t("errName") : null,
    title: showErrors && !config.title.trim() ? t("errTitle") : null,
    liveChatLink:
      (showErrors || linkTouched) && linkInvalid
        ? t("errLink")
        : null,
  };

  const handleLinkBlur = () => {
    setLinkTouched(true);
    const normalized = normalizeContactLink(config.liveChatLink);
    if (normalized && normalized !== config.liveChatLink) handleChange("liveChatLink", normalized);
  };

  const persistConfig = async ({
    showSuccessToast = true,
    navigateAfterSave = true,
  }: {
    showSuccessToast?: boolean;
    navigateAfterSave?: boolean;
  } = {}) => {
    if (!config.name.trim() || !config.title.trim() || linkInvalid) {
      setShowErrors(true);
      setActiveTab("general");
      toast.error(linkInvalid && config.name.trim() && config.title.trim()
        ? t("checkLinkBeforeSaving")
        : t("nameAndTitleBeforeSaving"));
      return null;
    }
    const user = auth.currentUser;
    if (!user) {
      toast.error(t("mustBeLoggedInToSave"));
      return null;
    }

    const toSave: ChatbotConfig = {
      ...config,
      liveChatLink: leadCaptureOn(config) ? config.liveChatLink : normalizeContactLink(config.liveChatLink) ?? "",
    };

    setSaving(true);
    try {
      const { id: chatbotId, ...chatbotConfig } = toSave;
      const result = await apiRequest<{ chatbotId: string; aiEnabled: boolean; saveConversations?: boolean; liveChat?: boolean }>("/api/chatbots/save", {
        authRequired: true,
        body: { chatbotId, config: chatbotConfig },
      });

      const next = {
        ...toSave,
        id: result.chatbotId,
        aiEnabled: result.aiEnabled,
        saveConversations: result.saveConversations === true,
        liveChat: result.liveChat === true,
      };
      loadedId.current = result.chatbotId;
      setConfig(next);
      setSavedJson(JSON.stringify(next));
      setShowErrors(false);
      if (showSuccessToast) {
        toast.success(chatbotId ? t("changesSaved") : t("chatbotCreated"));
      }
      if (navigateAfterSave && result.chatbotId !== id) {
        navigate(`/configure/${result.chatbotId}${location.search}`, { replace: true, state: location.state });
      }
      return result;
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error(
        error instanceof Error ? t("saveFailedWith", { error: error.message }) : t("saveFailed")
      );
      return null;
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (!saving) void persistConfig();
  };

  const discardChanges = () => {
    setConfig(JSON.parse(savedJson));
    setShowErrors(false);
    setLinkTouched(false);
  };

  // Ctrl/Cmd+S saves; the latest save is kept in a ref so the listener stays put.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  // Links elsewhere in the app (sidebar, navbar, back) don't unload the page,
  // so ask before they drop unsaved changes.
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  useEffect(() => {
    if (!hasChanges) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [hasChanges]);

  const heading = config.name.trim() || (id ? t("untitledChatbot") : t("newChatbot"));
  const aiReady = canUseAi && config.aiEnabled === true;

  const aiGenerator = AiFaqGenerator ? (
    <Suspense fallback={null}>
      <AiFaqGenerator
        chatbotId={config.id || id}
        aiEnabled={config.aiEnabled === true}
        canUseAi={canUseAi}
        aiTone={config.aiTone}
        ensureChatbotSaved={async () => {
          const result = await persistConfig({ showSuccessToast: false, navigateAfterSave: false });
          return result?.chatbotId || config.id || id || null;
        }}
        onFaqsApproved={(faqs: { question: string; answer: string }[]) =>
          setConfig((prev) => ({ ...prev, faqData: [...prev.faqData, ...faqs] }))
        }
      />
    </Suspense>
  ) : null;

  return (
    <div className="min-h-screen bg-ink-30 font-sans text-ink-900 dark:bg-ink-875 dark:text-ink-130">
      <Helmet>
        <title>{`${id ? config.name || t("editChatbot") : t("newChatbot")} | Askio`}</title>
        <meta
          name="description"
          content={id ? t("metaEdit", { name: config.name }) : t("metaNew")}
        />
      </Helmet>

      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {loading ? (
          <EditorSkeleton label={t("loading")} />
        ) : (
          <>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <Link
                  to={backTo}
                  className={backLink}
                >
                  <ArrowLeft size={14} />
                  {t("dashboard")}
                </Link>
                <div className="mt-2 flex min-w-0 items-center gap-3">
                  <BotAvatar color={config.primaryColor} launcherStyle={config.launcherStyle} size={34} />
                  <h1 className="truncate font-display text-h2 tracking-tight text-ink-900 sm:text-h1 dark:text-ink-130">
                    {heading}
                  </h1>
                  {config.aiEnabled && (
                    <span className="hidden shrink-0 items-center gap-1 rounded-full border border-ink-120 bg-ink-25 px-2 py-0.5 text-caption font-medium text-ink-605 sm:inline-flex dark:border-ink-780 dark:bg-ink-850 dark:text-ink-325">
                      <AiIcon size={12} />
                      {t("aiBadge")}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                aria-pressed={showPreview}
                className={`${secondaryButton} self-start sm:self-auto xl:hidden`}
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? t("hidePreview") : t("preview")}
              </button>
            </header>

            <nav
              ref={tabScroller}
              role="tablist"
              aria-label={t("settingsTabs")}
              className="scrollbar-hide -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-ink-120 px-4 sm:mx-0 sm:px-0 dark:border-ink-780"
            >
              {TABS.map((tab) => {
                const selected = activeTab === tab.key;
                const count = tab.key === "faq" ? config.faqData.length : 0;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative -mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-body-sm font-medium transition-colors ${focusRing} ${
                      selected
                        ? "border-ink-900 text-ink-900 dark:border-ink-130 dark:text-ink-70"
                        : "border-transparent text-ink-545 hover:text-ink-900 dark:text-ink-425 dark:hover:text-ink-130"
                    }`}
                  >
                    {t(tab.label)}
                    {count > 0 && (
                      <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-caption font-semibold leading-none tabular-nums bg-ink-70 text-ink-605 dark:bg-ink-790 dark:text-ink-325">
                        {count}
                      </span>
                    )}
                    {tab.key === "general" && showErrors && (errors.name || errors.title || errors.liveChatLink) && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-label={t("needsAttention")} />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
              <div className="min-w-0">
                <div role="tabpanel" aria-label={t(TABS.find((tab) => tab.key === activeTab)?.label ?? "tabGeneral")}>
                  {activeTab === "general" && (
                    <GeneralTab
                      config={config}
                      onChange={handleChange}
                      errors={errors}
                      onLinkBlur={handleLinkBlur}
                      canUseAi={canUseAi}
                      userPlan={userPlan}
                    />
                  )}

                  {activeTab === "appearance" && <AppearanceTab config={config} onChange={handleChange} />}

                  {activeTab === "faq" && (
                    <FaqTab
                      faqs={config.faqData}
                      onChange={(faqs) => handleChange("faqData", faqs)}
                      aiGenerator={aiGenerator}
                      initialQuestion={faqQuestion}
                    />
                  )}

                  {activeTab === "ai" &&
                    AiPersonaTab &&
                    (aiReady ? (
                      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                        <AiPersonaTab
                          aiTone={config.aiTone || ""}
                          onChange={(value: string) => handleChange("aiTone", value)}
                          accentColor={config.secondaryColor}
                        />
                      </Suspense>
                    ) : (
                      <Panel title={t("tabAi")} description={t("personaDesc")}>
                        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <p className="text-body-sm text-fg-muted">
                            {canUseAi
                              ? t("personaTurnOnHint")
                              : t("personaProHint")}
                          </p>
                          {canUseAi ? (
                            <button
                              type="button"
                              onClick={() => handleChange("aiEnabled", true)}
                              className={`${primaryButton} shrink-0 self-start sm:self-auto`}
                            >
                              <AiIcon size={15} />
                              {t("turnOnAiReplies")}
                            </button>
                          ) : (
                            <Link to="/plans" className={`${primaryButton} shrink-0 self-start sm:self-auto`}>
                              {t("seePro")}
                            </Link>
                          )}
                        </div>
                      </Panel>
                    ))}

                  {activeTab === "embed" && (
                    <EmbedTab chatbotId={id} hasChanges={hasChanges} saving={saving} onSave={save} />
                  )}
                </div>

                <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-3 rounded-xl border border-ink-120 bg-ink-25 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(16,23,35,0.25)] dark:border-ink-780 dark:bg-ink-850">
                  <p className="flex min-w-0 items-center gap-2 text-body-sm text-fg-muted" aria-live="polite">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        hasChanges || !id ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                    <span className="truncate">
                      {!id ? t("notCreatedYet") : hasChanges ? t("unsavedChanges") : t("allChangesSaved")}
                    </span>
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    {hasChanges && id && (
                      <button type="button" onClick={discardChanges} disabled={saving} className={secondaryButton}>
                        {t("discard")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving || (!!id && !hasChanges)}
                      title="Ctrl+S"
                      className={primaryButton}
                    >
                      {saving ? t("saving") : id ? t("saveChanges") : t("createChatbot")}
                    </button>
                  </div>
                </div>
              </div>

              {wide && (
                <aside className="sticky top-6" aria-label={t("preview")}>
                  <PreviewFrame config={config} />
                </aside>
              )}
            </div>
          </>
        )}
      </div>

      {showPreview && !wide && !loading && (
        <Chatbot
          {...config}
          isEmbedded
          isPreview
          customPositionClass={`${CORNER[config.position] ?? CORNER["bottom-right"]} m-4`}
        />
      )}

      <ConfirmationModal
        isOpen={leaveTo !== null}
        onClose={() => setLeaveTo(null)}
        onConfirm={() => {
          setLeaveTo(null);
          if (leaveTo) navigate(leaveTo);
        }}
        title={t("leaveTitle")}
        confirmText={t("leaveConfirm")}
        cancelText={t("keepEditing")}
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500"
      >
        <p>{t("leaveBody")}</p>
      </ConfirmationModal>
    </div>
  );
};

export default EditChatbot;
