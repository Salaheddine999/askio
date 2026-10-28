import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "react-hot-toast";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Pencil, Plus, Trash2 } from "../components/icons";
import { apiRequest } from "../utils/api";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { usePlanAccess } from "../hooks/usePlanAccess";
import { LiveOrb } from "../components/LiveOrb";
import { orbPropsFor } from "../utils/orbColors";
import { ColorField, Field, Panel, PanelBody, inputClass } from "../components/editor/controls";
import type { ChatbotConfig } from "../components/editor/types";
import { LIMITS } from "../components/editor/types";
import PreviewFrame from "../components/editor/PreviewFrame";
import EmbedTab from "../components/editor/EmbedTab";
import { focusRing, primaryButton, secondaryButton } from "./dashboard/ui";
import { BLANK_ID, hasPlaceholder, startersFor } from "./onboarding/templates";
import { makeT, useLanguage, useT, type Lang } from "../i18n";
import { widgetMessages } from "../i18n/widget";
import { onboardingMessages } from "../i18n/messages/onboarding";
import { AiIcon } from "../components/icons";

type Step = 1 | 2 | 3 | 4;
type DraftFaq = { question: string; answer: string; selected: boolean };

const STEP_KEYS = ["stepBusiness", "stepQuestions", "stepLook", "stepInstall"] as const;
const COLORS = ["#101723", "#3B82F6", "#0891B2", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6"];

/** The starting config, with the widget's own text in the app's language. */
const baseConfig = (lang: Lang): ChatbotConfig => {
  const w = makeT(widgetMessages, lang);
  return {
    id: "",
    name: "",
    title: "",
    primaryColor: "#101723",
    secondaryColor: "#101723",
    position: "bottom-right",
    launcherStyle: "classic",
    greetingBubble: false,
    initialMessage: w("defaultWelcome"),
    placeholder: w("defaultPlaceholder"),
    language: lang,
    faqData: [],
    liveChatLink: "",
    enableLeadCapture: true,
    aiEnabled: false,
    aiTone: "",
  };
};

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

const StepIndicator: React.FC<{ step: Step }> = ({ step }) => {
  const t = useT(onboardingMessages);
  return (
  <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label={t("setupSteps")}>
    {STEP_KEYS.map((key, i) => {
      const label = t(key);
      const n = (i + 1) as Step;
      const done = n < step;
      const current = n === step;
      return (
        <li key={key} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-caption font-semibold ${
              done || current
                ? "bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875"
                : "border border-ink-120 text-ink-425 dark:border-ink-780"
            }`}
          >
            {done ? <Check size={13} strokeWidth={3} /> : n}
          </span>
          <span
            className={`text-body-sm ${
              current ? "font-medium text-ink-900 dark:text-ink-70" : "text-fg-subtle"
            }`}
          >
            {label}
          </span>
          {n < 4 && <span className="mx-1 hidden h-px w-6 bg-ink-120 sm:block dark:bg-ink-780" />}
        </li>
      );
    })}
  </ol>
  );
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const t = useT(onboardingMessages);
  const { lang } = useLanguage();
  const starters = startersFor(lang);
  const { canUseAi, loading: planLoading } = usePlanAccess();
  const wide = useMediaQuery("(min-width: 1280px)");

  const [step, setStep] = useState<Step>(1);
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [starterId, setStarterId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<DraftFaq[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [config, setConfig] = useState<ChatbotConfig>(() => baseConfig(lang));
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const selected = faqs.filter((f) => f.selected);
  const unfinished = selected.filter((f) => hasPlaceholder(f.question) || hasPlaceholder(f.answer)).length;
  const previewConfig = useMemo(
    () => ({ ...config, faqData: selected.map(({ question, answer }) => ({ question, answer })) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, faqs]
  );

  const update = <K extends keyof ChatbotConfig>(key: K, value: ChatbotConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const applyBusiness = (welcome?: string) => {
    const name = businessName.trim();
    setConfig((c) => ({
      ...c,
      name: c.name || name,
      title: c.title || name.slice(0, LIMITS.title),
      initialMessage: welcome || c.initialMessage,
    }));
  };

  const continueWithStarter = () => {
    if (!businessName.trim() || !starterId) {
      setShowErrors(true);
      return;
    }
    const starter = starters.find((s) => s.id === starterId);
    setFaqs((starter?.faqs || []).map((f) => ({ ...f, selected: true })));
    applyBusiness(starter?.welcome);
    setEditing(null);
    setStep(2);
  };

  const save = async (draft: ChatbotConfig, aiEnabled: boolean) => {
    const { id, ...rest } = draft;
    return apiRequest<{ chatbotId: string; aiEnabled: boolean }>("/api/chatbots/save", {
      authRequired: true,
      body: { chatbotId: id || chatbotId || "", config: { ...rest, aiEnabled } },
    });
  };

  // Pro only: create the chatbot with AI on, then write questions from the site.
  const scanWebsite = async () => {
    const url = normalizeWebsite(website);
    if (!businessName.trim() || !url) {
      setShowErrors(true);
      if (businessName.trim()) toast.error(t("websiteError"));
      return;
    }
    setScanning(true);
    try {
      const name = businessName.trim();
      const draft = { ...config, name: config.name || name, title: config.title || name.slice(0, LIMITS.title) };
      const saved = await save(draft, true);
      if (!saved.aiEnabled) throw new Error(t("aiNotEnabled"));
      setChatbotId(saved.chatbotId);
      setConfig({ ...draft, id: saved.chatbotId, aiEnabled: true });
      const { faqs: generated } = await apiRequest<{ faqs: { question: string; answer: string }[] }>(
        "/api/ai/generate-faq",
        { authRequired: true, body: { chatbotId: saved.chatbotId, url, isDeepCrawl: false } }
      );
      if (!generated?.length) throw new Error(t("scanEmpty"));
      setFaqs(generated.map((f) => ({ ...f, selected: true })));
      setEditing(null);
      setStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("scanFailed"));
    } finally {
      setScanning(false);
    }
  };

  const finish = async () => {
    if (!config.name.trim() || !config.title.trim()) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    const draft = { ...previewConfig, id: chatbotId || "" };
    try {
      let result;
      try {
        result = await save(draft, canUseAi);
      } catch (error) {
        // At the AI chatbot limit: create it without AI rather than not at all.
        if (canUseAi && error instanceof Error && /up to \d+ AI chatbots/i.test(error.message)) {
          result = await save(draft, false);
          toast(t("createdWithoutAi"));
        } else {
          throw error;
        }
      }
      setChatbotId(result.chatbotId);
      setStep(4);
    } catch (error) {
      toast.error(error instanceof Error ? t("createFailedWith", { message: error.message }) : t("createFailed"));
    } finally {
      setSaving(false);
    }
  };

  const setFaq = (i: number, patch: Partial<DraftFaq>) =>
    setFaqs((list) => list.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  const showPreview = wide && step >= 2 && step <= 3;

  return (
    <div className="min-h-screen bg-ink-30 font-sans text-ink-900 dark:bg-ink-875 dark:text-ink-130">
      <Helmet>
        <title>{t("pageTitle")}</title>
      </Helmet>

      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-h2 tracking-tight sm:text-h1 dark:text-ink-70">
                {step === 4 ? t("headingReady") : t("headingSetup")}
              </h1>
              <p className="mt-1 text-body-sm text-fg-muted">
                {step === 4 ? t("subReady") : t("subSetup")}
              </p>
            </div>
            {step < 4 && (
              <Link
                to="/configure"
                className={`rounded text-body-sm text-ink-545 underline-offset-2 hover:text-ink-900 hover:underline dark:text-ink-425 dark:hover:text-ink-130 ${focusRing}`}
              >
                {t("skip")}
              </Link>
            )}
          </div>
          <StepIndicator step={step} />
        </header>

        <div className={`mt-6 grid grid-cols-1 gap-6 ${showPreview ? "xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start" : ""}`}>
          <div className={`min-w-0 space-y-5 ${showPreview ? "" : "max-w-3xl"}`}>
            {step === 1 && (
              <>
                <Panel title={t("businessTitle")} description={t("businessDescription")}>
                  <PanelBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field
                      label={t("businessName")}
                      htmlFor="ob-name"
                      error={showErrors && !businessName.trim() ? t("businessNameError") : null}
                    >
                      <input
                        id="ob-name"
                        autoFocus
                        className={`${inputClass} h-10`}
                        placeholder={t("businessNamePlaceholder")}
                        maxLength={LIMITS.name}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </Field>
                    <Field
                      label={t("website")}
                      htmlFor="ob-site"
                      hint={canUseAi ? t("websiteHintAi") : t("websiteHint")}
                    >
                      <input
                        id="ob-site"
                        className={`${inputClass} h-10`}
                        placeholder={t("websitePlaceholder")}
                        value={website}
                        spellCheck={false}
                        autoComplete="url"
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </Field>
                  </PanelBody>
                </Panel>

                {canUseAi && (
                  <div className="flex flex-col gap-4 rounded-xl border border-ink-120 bg-ink-25 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-ink-780 dark:bg-ink-850">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875">
                        <AiIcon size={16} />
                      </span>
                      <div>
                        <p className="text-body-sm font-medium text-ink-900 dark:text-ink-70">{t("scanTitle")}</p>
                        <p className="mt-0.5 text-caption text-fg-subtle">{t("scanDescription")}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={scanWebsite}
                      disabled={scanning || !website.trim()}
                      className={`${primaryButton} shrink-0 self-start sm:self-auto`}
                    >
                      {scanning ? t("scanning") : t("scan")}
                    </button>
                  </div>
                )}

                <Panel
                  title={canUseAi ? t("typeTitleAi") : t("typeTitle")}
                  description={t("typeDescription")}
                >
                  <PanelBody>
                    <div role="radiogroup" aria-label={t("businessType")} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {[...starters, { id: BLANK_ID, label: t("blankLabel"), hint: t("blankHint") }].map((s) => {
                        const isSelected = starterId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setStarterId(s.id)}
                            className={`rounded-xl border px-4 py-3 text-left transition-colors ${focusRing} ${
                              isSelected
                                ? "border-ink-900 bg-ink-30 dark:border-ink-130 dark:bg-ink-875"
                                : "border-ink-120 hover:border-ink-325 dark:border-ink-780 dark:hover:border-ink-605"
                            }`}
                          >
                            <span className="block text-body-sm font-medium text-fg">{s.label}</span>
                            <span className="mt-0.5 block text-caption text-fg-subtle">{s.hint}</span>
                          </button>
                        );
                      })}
                    </div>
                    {showErrors && !starterId && (
                      <p role="alert" className="mt-3 text-caption text-red-600 dark:text-red-400">
                        {t("pickType")}
                      </p>
                    )}
                    {!canUseAi && !planLoading && (
                      <p className="mt-4 text-caption text-fg-subtle">
                        {t("proUpsell")}{" "}
                        <Link to="/plans" className="font-medium text-ink-900 underline underline-offset-2 dark:text-ink-70">
                          {t("seePro")}
                        </Link>
                      </p>
                    )}
                  </PanelBody>
                </Panel>

                <div className="flex justify-end">
                  <button type="button" onClick={continueWithStarter} disabled={scanning} className={primaryButton}>
                    {t("continue")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Panel
                  title={t("questionsTitle")}
                  description={t("questionsDescription")}
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setFaqs((list) => [...list, { question: "", answer: "", selected: true }]);
                        setEditing(faqs.length);
                      }}
                      className={secondaryButton}
                    >
                      <Plus size={15} />
                      {t("add")}
                    </button>
                  }
                >
                  {faqs.length === 0 ? (
                    <p className="px-6 py-10 text-center text-body-sm text-fg-subtle">
                      {t("noQuestions")}
                    </p>
                  ) : (
                    <ul className="divide-y divide-ink-70 dark:divide-ink-780">
                      {faqs.map((faq, i) => {
                        const needsDetails = faq.selected && (hasPlaceholder(faq.question) || hasPlaceholder(faq.answer));
                        return (
                          <li key={i} className={`px-5 py-4 sm:px-6 ${faq.selected ? "" : "opacity-55"}`}>
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={faq.selected}
                                onChange={(e) => setFaq(i, { selected: e.target.checked })}
                                aria-label={t("keepQuestion", { question: faq.question || t("newQuestion") })}
                                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-ink-900 dark:accent-ink-130"
                              />
                              {editing === i ? (
                                <div className="min-w-0 flex-1 space-y-2">
                                  <input
                                    autoFocus={!faq.question}
                                    className={`${inputClass} h-9 font-medium`}
                                    placeholder={t("questionPlaceholder")}
                                    maxLength={LIMITS.question}
                                    value={faq.question}
                                    onChange={(e) => setFaq(i, { question: e.target.value })}
                                  />
                                  <textarea
                                    autoFocus={!!faq.question}
                                    rows={3}
                                    className={`${inputClass} resize-y py-2 leading-relaxed`}
                                    placeholder={t("answerPlaceholder")}
                                    maxLength={LIMITS.answer}
                                    value={faq.answer}
                                    onChange={(e) => setFaq(i, { answer: e.target.value })}
                                  />
                                  <div className="flex justify-end">
                                    <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>
                                      {t("done")}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditing(i)}
                                  className={`min-w-0 flex-1 rounded-md text-left ${focusRing}`}
                                >
                                  <span className="block text-body-sm font-medium text-fg">
                                    {faq.question || t("untitledQuestion")}
                                  </span>
                                  <span className="mt-1 block text-body-sm text-fg-muted">
                                    {!faq.answer
                                      ? t("noAnswer")
                                      : faq.answer.split(/(\[[^\]]+\])/).map((part, k) =>
                                      /^\[[^\]]+\]$/.test(part) ? (
                                        <mark
                                          key={k}
                                          className="rounded bg-amber-100 px-0.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                                        >
                                          {part}
                                        </mark>
                                      ) : (
                                        <React.Fragment key={k}>{part}</React.Fragment>
                                      )
                                    )}
                                  </span>
                                  {needsDetails && (
                                    <span className="mt-1.5 inline-flex items-center gap-1 text-caption font-medium text-amber-700 dark:text-amber-300">
                                      <Pencil size={11} /> {t("addDetails")}
                                    </span>
                                  )}
                                </button>
                              )}
                              {editing !== i && (
                                <button
                                  type="button"
                                  aria-label={t("removeQuestion")}
                                  onClick={() => setFaqs((list) => list.filter((_, j) => j !== i))}
                                  className={`rounded-lg p-1.5 text-ink-425 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 ${focusRing}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>

                {showErrors && unfinished > 0 && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    {t.plural("placeholderWarning", unfinished)}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(1)} className={secondaryButton}>
                    <ArrowLeft size={16} />
                    {t("back")}
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-caption text-ink-545 sm:inline dark:text-ink-425">
                      {t.plural("kept", selected.length)}
                      {unfinished ? t.plural("toFinish", unfinished) : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (unfinished > 0) {
                          setShowErrors(true);
                          return;
                        }
                        setShowErrors(false);
                        setEditing(null);
                        setStep(3);
                      }}
                      className={primaryButton}
                    >
                      {t("continue")}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <Panel title={t("lookTitle")} description={t("lookDescription")}>
                  <PanelBody className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field
                        label={t("chatTitle")}
                        htmlFor="ob-title"
                        hint={t("chatTitleHint")}
                        error={showErrors && !config.title.trim() ? t("chatTitleError") : null}
                      >
                        <input
                          id="ob-title"
                          className={`${inputClass} h-10`}
                          maxLength={LIMITS.title}
                          value={config.title}
                          onChange={(e) => update("title", e.target.value)}
                        />
                      </Field>
                      <Field label={t("welcomeMessage")} htmlFor="ob-welcome">
                        <input
                          id="ob-welcome"
                          className={`${inputClass} h-10`}
                          maxLength={LIMITS.initialMessage}
                          value={config.initialMessage}
                          onChange={(e) => update("initialMessage", e.target.value)}
                        />
                      </Field>
                    </div>

                    <div>
                      <p className="mb-2 text-label text-fg">{t("brandColour")}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {COLORS.map((c) => {
                          const active = config.primaryColor.toLowerCase() === c.toLowerCase();
                          return (
                            <button
                              key={c}
                              type="button"
                              aria-label={t("useColour", { colour: c })}
                              aria-pressed={active}
                              onClick={() => setConfig((cfg) => ({ ...cfg, primaryColor: c, secondaryColor: c }))}
                              className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset ring-black/10 transition-transform hover:scale-110 ${focusRing} ${
                                active ? "ring-2 ring-offset-2 ring-offset-ink-25 !ring-ink-900 dark:ring-offset-ink-850 dark:!ring-ink-130" : ""
                              }`}
                              style={{ backgroundColor: c }}
                            >
                              {active && <Check size={14} strokeWidth={3} className="text-white" />}
                            </button>
                          );
                        })}
                        <div className="w-44">
                          <ColorField
                            label={t("customColour")}
                            color={config.primaryColor}
                            onChange={(c) => setConfig((cfg) => ({ ...cfg, primaryColor: c, secondaryColor: c }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-label text-fg">{t("launcher")}</p>
                      <div role="radiogroup" aria-label={t("launcherStyle")} className="grid max-w-sm grid-cols-2 gap-3">
                        {([
                          { value: "classic", label: t("classic") },
                          { value: "orb", label: "Kio" },
                        ] as const).map((o) => {
                          const isSelected = (config.launcherStyle ?? "classic") === o.value;
                          return (
                            <button
                              key={o.value}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => update("launcherStyle", o.value)}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${focusRing} ${
                                isSelected
                                  ? "border-ink-900 bg-ink-30 dark:border-ink-130 dark:bg-ink-875"
                                  : "border-ink-120 hover:border-ink-325 dark:border-ink-780"
                              }`}
                            >
                              {o.value === "orb" ? (
                                <LiveOrb size={30} {...orbPropsFor(config.primaryColor)} />
                              ) : (
                                <span className="h-[30px] w-[30px] rounded-full" style={{ background: config.primaryColor }} />
                              )}
                              <span className="text-body-sm font-medium text-fg">{o.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </PanelBody>
                </Panel>

                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(2)} className={secondaryButton}>
                    <ArrowLeft size={16} />
                    {t("back")}
                  </button>
                  <button type="button" onClick={finish} disabled={saving} className={primaryButton}>
                    {saving ? t("creating") : t("create")}
                  </button>
                </div>
              </>
            )}

            {step === 4 && chatbotId && (
              <>
                <EmbedTab chatbotId={chatbotId} hasChanges={false} saving={false} onSave={() => undefined} />
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => navigate(`/configure/${chatbotId}`)} className={primaryButton}>
                    {t("fineTune")}
                  </button>
                  <button type="button" onClick={() => navigate("/dashboard")} className={secondaryButton}>
                    {t("goToDashboard")}
                  </button>
                </div>
              </>
            )}
          </div>

          {showPreview && (
            <aside className="sticky top-6" aria-label={t("preview")}>
              <PreviewFrame config={previewConfig} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
