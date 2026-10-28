import React, { useEffect, useState } from "react";
import { embedCodeFor } from "../utils/embedCode";
import { Helmet } from "react-helmet-async";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ChevronsUpDown,
  Clock,
  Copy,
  Download,
  Globe,
  LoaderCircle,
  ShoppingBag,
  Unplug,
} from "../components/icons";
import { FaWordpress, FaShopify } from "react-icons/fa";
import { SiWix } from "react-icons/si";
import { Link } from "react-router-dom";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { apiRequest } from "../utils/api";
import { toast } from "react-hot-toast";
import BotAvatar from "../components/BotAvatar";
import ConfirmationModal from "../components/ConfirmationModal";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { CreateChatbotLink, EmptyState, focusRing, primaryButton, secondaryButton, surface } from "./dashboard/ui";
import { DUMMY_CHATBOTS } from "../utils/dummyData";
import { useT } from "../i18n";
import { integrationsMessages } from "../i18n/messages/integrations";

type MessageKey = keyof typeof integrationsMessages.en;

type Platform = "wordpress" | "shopify" | "wix" | "html";

interface Chatbot {
  id: string;
  title: string;
  primaryColor?: string;
  launcherStyle?: string;
  isActive?: boolean;
}

interface ShopifyConnection {
  id: string;
  shop: string;
  chatbotId: string;
  chatbotTitle: string;
  connectedAt: string;
}

// label is a brand name, except "Any website", which is a message key (labelKey).
const PLATFORMS: {
  key: Platform;
  label?: string;
  labelKey?: MessageKey;
  tagline: MessageKey;
  effort: MessageKey;
  icon: React.ReactNode;
  logo: React.ReactNode;
}[] = [
  {
    key: "wordpress",
    label: "WordPress",
    tagline: "wordpressTagline",
    effort: "wordpressEffort",
    icon: <FaWordpress size={20} className="text-[#21759B]" />,
    logo: <FaWordpress size={26} className="text-[#21759B]" />,
  },
  {
    key: "shopify",
    label: "Shopify",
    tagline: "shopifyTagline",
    effort: "shopifyEffort",
    icon: <FaShopify size={20} className="text-[#5E8E3E]" />,
    logo: <FaShopify size={26} className="text-[#5E8E3E]" />,
  },
  {
    key: "wix",
    label: "Wix",
    tagline: "wixTagline",
    effort: "wixEffort",
    icon: <SiWix size={20} className="text-[#0C6EFC]" />,
    logo: <SiWix size={26} className="text-[#0C6EFC]" />,
  },
  {
    key: "html",
    labelKey: "anyWebsite",
    tagline: "htmlTagline",
    effort: "htmlEffort",
    icon: <Globe size={20} className="text-ink-605" />,
    logo: <Globe size={26} className="text-ink-605" />,
  },
];

interface IntegrationsProps {
  testMode?: boolean;
}

export default function Integrations({ testMode = false }: IntegrationsProps) {
  const t = useT(integrationsMessages);
  const [rawChatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<string>("");
  const [activePlatform, setActivePlatform] = useState<Platform>("wordpress");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [shopUrl, setShopUrl] = useState("");
  const [shopifyConnections, setShopifyConnections] = useState<ShopifyConnection[]>([]);
  const [connectionToRemove, setConnectionToRemove] = useState<ShopifyConnection | null>(null);

  const origin = window.location.origin;
  // Untitled chatbots get their fallback name here, so it follows the language.
  const chatbots = rawChatbots.map((c) => (c.title ? c : { ...c, title: t("untitledChatbot") }));

  useEffect(() => {
    if (testMode) {
      setChatbots(DUMMY_CHATBOTS);
      setSelectedChatbot(DUMMY_CHATBOTS[0].id);
      setLoading(false);
      return;
    }
    fetchChatbots();
    fetchShopifyConnections();
    handleShopifyCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode]);

  const handleShopifyCallback = async () => {
    // Shopify sent the merchant back; the server finishes the install for the
    // signed-in owner who started it.
    const params = new URLSearchParams(window.location.search);
    const pending = params.get('shopify_pending');
    if (pending || params.get('shopify_error')) {
      window.history.replaceState({}, '', '/integrations');
      setActivePlatform('shopify');
      if (!pending) {
        toast.error(t("toastConnectFailed"));
        return;
      }
      try {
        const { shop } = await apiRequest<{ shop: string }>("/api/account/shopify-connect", {
          authRequired: true,
          body: { pending },
        });
        toast.success(t("toastConnected", { shop }));
        fetchShopifyConnections();
      } catch (err) {
        toast.error((err as Error).message || t("toastConnectFailed"));
      }
    }
  };

  const fetchShopifyConnections = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, 'shopify_connections'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      setShopifyConnections(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShopifyConnection))
      );
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  const disconnectShopify = async (connectionId: string) => {
    try {
      await deleteDoc(doc(db, 'shopify_connections', connectionId));
      toast.success(t("toastDisconnected"));
      fetchShopifyConnections();
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast.error(t("toastDisconnectFailed"));
    } finally {
      setConnectionToRemove(null);
    }
  };

  const fetchChatbots = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, "chatbot_configs"),
        where("user_id", "==", user.uid)
      );
      const snap = await getDocs(q);
      const bots = snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title || "",
        primaryColor: d.data().primaryColor,
        launcherStyle: d.data().launcherStyle,
        isActive: d.data().isActive,
      }));
      setChatbots(bots);
      if (bots.length > 0) setSelectedChatbot(bots[0].id);
    } catch (err) {
      console.error("Error fetching chatbots:", err);
    } finally {
      setLoading(false);
    }
  };

  const embedCode = selectedChatbot
    ? embedCodeFor(selectedChatbot, origin)
    : "";

  const copyToClipboard = (text: string, type: "embed" | "id") => {
    navigator.clipboard.writeText(text).then(
      () => {
        const set = type === "embed" ? setCopied : setCopiedId;
        set(true);
        setTimeout(() => set(false), 2000);
        toast.success(type === "embed" ? t("toastEmbedCopied") : t("toastIdCopied"));
      },
      () => toast.error(t("toastCopyFailed"))
    );
  };

  const downloadWordPressPlugin = async () => {
    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Fetch the PHP file from public directory
      const response = await fetch("/askio-chatbot/askio-chatbot.php");
      const phpContent = await response.text();

      const folder = zip.folder("askio-chatbot");
      if (folder) {
        folder.file("askio-chatbot.php", phpContent);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "askio-chatbot.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("toastPluginDownloaded"));
    } catch (err) {
      console.error("Error generating plugin zip:", err);
      toast.error(t("toastPluginFailed"));
    } finally {
      setDownloading(false);
    }
  };

  const connectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    const shop = shopUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!shop || !shop.includes('.myshopify.com')) {
      toast.error(t("toastInvalidShop"));
      return;
    }
    if (!selectedChatbot) {
      toast.error(t("toastSelectChatbot"));
      return;
    }
    if (testMode) {
      toast.success(t("toastTestMode"));
      return;
    }
    try {
      const { url } = await apiRequest<{ url: string }>("/api/account/shopify-start", {
        authRequired: true,
        body: { shop, chatbotId: selectedChatbot },
      });
      window.location.href = url;
    } catch (err) {
      toast.error((err as Error).message || t("toastConnectFailed"));
    }
  };

  const selectedBot = chatbots.find((c) => c.id === selectedChatbot);
  const platform = PLATFORMS.find((p) => p.key === activePlatform)!;
  const platformLabel = (p: (typeof PLATFORMS)[number]) => (p.labelKey ? t(p.labelKey) : p.label);

  if (loading) return <IntegrationsSkeleton />;

  return (
    <div className="min-h-screen bg-ink-30 font-sans text-ink-900 dark:bg-ink-875">
      <Helmet>
        <title>{t("metaTitle")}</title>
      </Helmet>

      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-h2 tracking-tight text-ink-900 sm:text-h1 dark:text-ink-130">
              {t("title")}
            </h1>
            <p className="mt-1 text-body-sm text-fg-muted">
              {t("subtitle")}
            </p>
          </div>
          <Link to="/documentation" className={secondaryButton}>
            <BookOpen size={15} />
            {t("documentation")}
          </Link>
        </header>

        {chatbots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-165 bg-ink-25/60 dark:border-ink-710 dark:bg-ink-850/40">
            <EmptyState
              icon={Bot}
              title={t("noChatbotsTitle")}
              description={t("noChatbotsDescription")}
              action={<CreateChatbotLink label={t("createChatbot")} />}
            />
          </div>
        ) : (
          <>
            {/* Chatbot to install */}
            <section className={`${surface} flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center`}>
              <div className="min-w-0 lg:w-80">
                <StepLabel n={1}>{t("stepChatbot")}</StepLabel>
                <ChatbotPicker chatbots={chatbots} value={selectedChatbot} onChange={setSelectedChatbot} />
              </div>
              <div className="hidden h-12 w-px bg-ink-70 lg:block dark:bg-ink-780" />
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-caption font-medium text-fg-muted">{t("chatbotId")}</p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-ink-70 bg-ink-30 px-3 py-2 font-mono text-[13px] text-ink-900 select-all dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130">
                    {selectedChatbot}
                  </code>
                  <button onClick={() => copyToClipboard(selectedChatbot, "id")} className={secondaryButton}>
                    {copiedId ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                    <span className="hidden sm:inline">{copiedId ? t("copied") : t("copy")}</span>
                  </button>
                </div>
                <p className="mt-1.5 text-caption text-fg-subtle">
                  {t("chatbotIdHint")}
                </p>
              </div>
            </section>

            {/* Platform picker */}
            <section>
              <StepLabel n={2}>{t("stepPlatform")}</StepLabel>
              <div role="tablist" aria-label={t("platformTabs")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {PLATFORMS.map((p) => {
                  const active = p.key === activePlatform;
                  const connected = p.key === "shopify" ? shopifyConnections.length : 0;
                  return (
                    <button
                      key={p.key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActivePlatform(p.key)}
                      className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition-colors sm:p-4 ${focusRing} ${
                        active
                          ? "border-ink-900 bg-ink-25 shadow-[0_0_0_1px_#101723] dark:border-ink-130 dark:bg-ink-850 dark:shadow-[0_0_0_1px_#D7DFE5]"
                          : "border-ink-120 bg-ink-25 hover:border-ink-230 dark:border-ink-780 dark:bg-ink-850 dark:hover:border-ink-710"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-70 bg-white dark:border-ink-780 dark:bg-ink-30">
                        {p.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-body-sm font-semibold text-ink-900 dark:text-ink-30">
                          {platformLabel(p)}
                        </span>
                        <span className="hidden truncate text-caption text-ink-545 sm:block dark:text-ink-425">{t(p.tagline)}</span>
                      </span>
                      {connected > 0 && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-caption font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/25 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {connected}
                        </span>
                      )}
                      {active && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Instructions */}
            <section className={`${surface} overflow-hidden`}>
              <div className="flex flex-wrap items-center gap-4 border-b border-ink-70 px-5 py-4 sm:px-6 dark:border-ink-780">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink-70 bg-white dark:border-ink-780 dark:bg-ink-30">
                  {platform.logo}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-h3 text-fg">
                    {platform.label ? t("installOn", { platform: platform.label }) : t("installOnAnyWebsite")}
                  </h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-fg-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} />
                      {t(platform.effort)}
                    </span>
                    {selectedBot && (
                      <span className="inline-flex items-center gap-1.5">
                        <BotAvatar color={selectedBot.primaryColor} launcherStyle={selectedBot.launcherStyle} size={16} />
                        {selectedBot.title}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                {activePlatform === "wordpress" && (
                  <>
                    <Steps
                      steps={[
                        { title: t("wpStep1Title"), body: t("wpStep1Body") },
                        { title: t("wpStep2Title"), body: t("wpStep2Body") },
                        { title: t("wpStep3Title"), body: t("wpStep3Body") },
                        { title: t("wpStep4Title"), body: t("wpStep4Body") },
                      ]}
                    />
                    <ActionPanel title={t("wpPanelTitle")} description={t("wpPanelDescription")}>
                      <button onClick={downloadWordPressPlugin} disabled={downloading} className={`${primaryButton} w-full sm:w-auto`}>
                        {downloading ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
                        {downloading ? t("preparing") : t("downloadFile", { file: "askio-chatbot.zip" })}
                      </button>
                      <div className="mt-5 border-t border-ink-70 pt-4 dark:border-ink-780">
                        <p className="text-caption font-medium text-fg-muted">{t("neededInStep3")}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="min-w-0 flex-1 truncate rounded-lg bg-ink-900 px-3 py-2 font-mono text-[13px] text-ink-130">
                            {selectedChatbot}
                          </code>
                          <button onClick={() => copyToClipboard(selectedChatbot, "id")} className={secondaryButton} aria-label={t("copyChatbotId")}>
                            {copiedId ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                          </button>
                        </div>
                      </div>
                    </ActionPanel>
                  </>
                )}

                {activePlatform === "shopify" && (
                  <>
                    <Steps
                      steps={[
                        { title: t("shopifyStep1Title"), body: t("shopifyStep1Body") },
                        { title: t("shopifyStep2Title"), body: t("shopifyStep2Body") },
                        { title: t("shopifyStep3Title"), body: t("shopifyStep3Body") },
                      ]}
                    />
                    <div className="space-y-4">
                      <ActionPanel
                        title={shopifyConnections.length > 0 ? t("connectAnotherStore") : t("connectYourStore")}
                        description={t("shopifyPanelDescription")}
                      >
                        <form onSubmit={connectShopify} className="flex flex-col gap-2 sm:flex-row">
                          <label className="sr-only" htmlFor="shop-url">
                            {t("storeUrl")}
                          </label>
                          <div className="relative flex-1">
                            <ShoppingBag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-425" />
                            <input
                              id="shop-url"
                              type="text"
                              inputMode="url"
                              autoComplete="off"
                              value={shopUrl}
                              onChange={(e) => setShopUrl(e.target.value)}
                              placeholder="yourstore.myshopify.com"
                              className="h-9 w-full rounded-lg border border-ink-120 bg-ink-25 pl-9 pr-3 text-body-sm text-ink-900 placeholder:text-ink-425 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10 dark:border-ink-780 dark:bg-ink-850 dark:text-ink-130 dark:focus:border-ink-325"
                            />
                          </div>
                          <button type="submit" className={primaryButton}>
                            {t("connect")}
                            <ArrowRight size={15} />
                          </button>
                        </form>
                        <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/15">
                          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <p className="text-caption leading-relaxed text-amber-900 dark:text-amber-200">
                            {t("shopifyWarningBefore")}
                            <strong>{t("shopifyWarningNotApproved")}</strong>
                            {t("shopifyWarningMiddle")}
                            <strong>{t("shopifyWarningInstall")}</strong>
                            {t("shopifyWarningAfter")}
                          </p>
                        </div>
                      </ActionPanel>

                      {shopifyConnections.length > 0 && (
                        <div className="rounded-xl border border-ink-70 dark:border-ink-780">
                          <p className="border-b border-ink-70 px-4 py-2.5 text-caption font-medium text-ink-545 dark:border-ink-780 dark:text-ink-425">
                            {t("connectedStores")}
                          </p>
                          <ul className="divide-y divide-ink-70 dark:divide-ink-780">
                            {shopifyConnections.map((conn) => (
                              <li key={conn.id} className="flex items-center gap-3 px-4 py-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400">
                                  <ShoppingBag size={15} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-body-sm font-medium text-fg">{conn.shop}</p>
                                  <p className="truncate text-caption text-fg-subtle">
                                    {conn.chatbotTitle || chatbots.find((b) => b.id === conn.chatbotId)?.title || conn.chatbotId}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setConnectionToRemove(conn)}
                                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-caption font-medium text-ink-605 hover:bg-red-50 hover:text-red-600 dark:text-ink-325 dark:hover:bg-red-950/30 dark:hover:text-red-400 ${focusRing}`}
                                >
                                  <Unplug size={13} />
                                  {t("disconnect")}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activePlatform === "wix" && (
                  <>
                    <Steps
                      steps={[
                        { title: t("wixStep1Title"), body: t("wixStep1Body") },
                        { title: t("wixStep2Title"), body: t("wixStep2Body") },
                        { title: t("wixStep3Title"), body: t("wixStep3Body") },
                        { title: t("wixStep4Title"), body: t("wixStep4Body") },
                      ]}
                    />
                    <EmbedCodeBlock code={embedCode} copied={copied} onCopy={() => copyToClipboard(embedCode, "embed")} />
                  </>
                )}

                {activePlatform === "html" && (
                  <>
                    <Steps
                      steps={[
                        { title: t("htmlStep1Title"), body: t("htmlStep1Body") },
                        { title: t("htmlStep2Title"), body: t("htmlStep2Body") },
                        { title: t("htmlStep3Title"), body: t("htmlStep3Body") },
                      ]}
                      footer={t("htmlFooter")}
                    />
                    <EmbedCodeBlock code={embedCode} copied={copied} onCopy={() => copyToClipboard(embedCode, "embed")} />
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={connectionToRemove !== null}
        onClose={() => setConnectionToRemove(null)}
        onConfirm={() => connectionToRemove && disconnectShopify(connectionToRemove.id)}
        title={t("disconnectTitle")}
        confirmText={t("disconnect")}
        cancelText={t("cancel")}
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500"
      >
        <p className="text-body-sm text-ink-605 dark:text-ink-130">
          {t("disconnectBefore")}
          <span className="font-medium text-ink-900 dark:text-white">{connectionToRemove?.shop}</span>
          {t("disconnectAfter")}
        </p>
      </ConfirmationModal>
    </div>
  );
}

// --- Sub-components ---

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-caption font-medium text-fg-muted">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink-900 text-caption font-semibold leading-none tabular-nums text-white dark:bg-ink-130 dark:text-ink-875">
        {n}
      </span>
      {children}
    </p>
  );
}

function ChatbotPicker({
  chatbots,
  value,
  onChange,
}: {
  chatbots: Chatbot[];
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useT(integrationsMessages);
  const selected = chatbots.find((c) => c.id === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        className={`flex h-11 w-full items-center gap-2.5 rounded-lg border border-ink-120 bg-ink-25 px-2.5 text-left transition-colors hover:border-ink-230 data-[open]:border-ink-900 dark:border-ink-780 dark:bg-ink-875 dark:hover:border-ink-710 dark:data-[open]:border-ink-325 ${focusRing}`}
      >
        <BotAvatar color={selected?.primaryColor} launcherStyle={selected?.launcherStyle} size={26} muted={selected?.isActive === false} />
        <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-fg">
          {selected?.title || t("selectChatbot")}
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-ink-425" />
      </ListboxButton>
      {/* Anchored (portalled) and non-modal: the page keeps scrolling and doesn't shift while it's open. */}
      <ListboxOptions
        anchor="bottom start"
        modal={false}
        transition
        className="z-50 max-h-72 w-[var(--button-width)] min-w-56 overflow-auto rounded-xl border border-ink-120 bg-ink-25 p-1.5 shadow-lg transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-ink-780 dark:bg-ink-850"
      >
        {chatbots.map((bot) => (
          <ListboxOption
            key={bot.id}
            value={bot.id}
            className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-body-sm data-[focus]:bg-ink-30 dark:data-[focus]:bg-ink-790"
          >
            <BotAvatar color={bot.primaryColor} launcherStyle={bot.launcherStyle} size={22} muted={bot.isActive === false} />
            <span className="min-w-0 flex-1 truncate text-ink-900 group-data-[selected]:font-medium dark:text-ink-130">
              {bot.title}
            </span>
            {bot.isActive === false && <span className="text-caption text-ink-425">{t("paused")}</span>}
            <Check size={15} className="invisible text-ink-900 group-data-[selected]:visible dark:text-ink-130" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

function Steps({ steps, footer }: { steps: { title: string; body: string }[]; footer?: string }) {
  return (
    <div>
      <ol className="relative">
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span aria-hidden className="absolute left-[13px] top-8 bottom-1 w-px bg-ink-120 dark:bg-ink-780" />
            )}
            <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full border border-ink-120 bg-ink-30 text-caption font-semibold leading-none tabular-nums text-ink-900 dark:border-ink-710 dark:bg-ink-875 dark:text-ink-130">
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-body-sm font-semibold text-fg">{step.title}</h3>
              <p className="mt-1 text-body-sm leading-relaxed text-fg-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {footer && (
        <p className="mt-6 rounded-lg bg-ink-30 px-3 py-2.5 text-caption text-ink-605 dark:bg-ink-875 dark:text-ink-325">
          {footer}
        </p>
      )}
    </div>
  );
}

function ActionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-70 bg-ink-30/60 p-4 sm:p-5 dark:border-ink-780 dark:bg-ink-875/60">
      <h3 className="text-body font-semibold text-fg">{title}</h3>
      <p className="mb-4 mt-0.5 text-body-sm text-fg-muted">{description}</p>
      {children}
    </div>
  );
}

function EmbedCodeBlock({
  code,
  copied,
  onCopy,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const t = useT(integrationsMessages);
  return (
    <div className="self-start overflow-hidden rounded-xl border border-ink-805 bg-ink-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="flex items-center gap-2 text-caption font-medium text-ink-325">
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
          </span>
          {t("embedCode")}
        </span>
        <button
          onClick={onCopy}
          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-caption font-medium transition-colors ${focusRing} ${
            copied ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-ink-70 hover:bg-white/15"
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? t("copied") : t("copyCode")}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-ink-130">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function IntegrationsSkeleton() {
  const t = useT(integrationsMessages);
  return (
    <div className="min-h-screen bg-ink-30 dark:bg-ink-875" aria-busy="true" aria-label={t("loading")}>
      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <div className="space-y-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <SkeletonCard className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
          <Skeleton className="h-11 w-full lg:w-80" />
          <Skeleton className="h-9 flex-1" />
        </SkeletonCard>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </SkeletonCard>
          ))}
        </div>
        <SkeletonCard>
          <div className="flex items-center gap-4 border-b border-ink-70 px-6 py-4 dark:border-ink-780">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 p-6 xl:grid-cols-2">
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
