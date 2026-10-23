import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { FaWordpress, FaShopify } from "react-icons/fa";
import { SiWix } from "react-icons/si";
import { Link } from "react-router-dom";
import { db, auth } from "../utils/firebase";
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import BotAvatar from "../components/BotAvatar";
import ConfirmationModal from "../components/ConfirmationModal";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { CreateChatbotLink, EmptyState, focusRing, primaryButton, secondaryButton, surface } from "./dashboard/ui";
import { DUMMY_CHATBOTS } from "../utils/dummyData";

type Platform = "wordpress" | "shopify" | "wix" | "html";

interface Chatbot {
  id: string;
  title: string;
  primaryColor?: string;
  isActive?: boolean;
}

interface ShopifyConnection {
  id: string;
  shop: string;
  chatbotId: string;
  chatbotTitle: string;
  connectedAt: string;
}

const PLATFORMS: {
  key: Platform;
  label: string;
  tagline: string;
  effort: string;
  icon: React.ReactNode;
  logo: React.ReactNode;
}[] = [
  {
    key: "wordpress",
    label: "WordPress",
    tagline: "Install our plugin",
    effort: "No code · 3 min",
    icon: <FaWordpress size={20} className="text-[#21759B]" />,
    logo: <FaWordpress size={26} className="text-[#21759B]" />,
  },
  {
    key: "shopify",
    label: "Shopify",
    tagline: "Connect your store",
    effort: "No code · 2 min",
    icon: <FaShopify size={20} className="text-[#5E8E3E]" />,
    logo: <FaShopify size={26} className="text-[#5E8E3E]" />,
  },
  {
    key: "wix",
    label: "Wix",
    tagline: "Paste an HTML embed",
    effort: "Copy & paste · 5 min",
    icon: <SiWix size={20} className="text-[#0C6EFC]" />,
    logo: <SiWix size={26} className="text-[#0C6EFC]" />,
  },
  {
    key: "html",
    label: "Any website",
    tagline: "Webflow, Squarespace, HTML…",
    effort: "Copy & paste · 1 min",
    icon: <Globe size={20} className="text-[#566273]" />,
    logo: <Globe size={26} className="text-[#566273]" />,
  },
];

interface IntegrationsProps {
  testMode?: boolean;
}

export default function Integrations({ testMode = false }: IntegrationsProps) {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
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
    const params = new URLSearchParams(window.location.search);
    if (params.get('shopify_connected') === 'true') {
      const shop = params.get('shop');
      const chatbotId = params.get('chatbotId');
      const user = auth.currentUser;
      if (shop && chatbotId && user) {
        try {
          const connectionId = shop.replace(/\./g, '_');
          const chatbotTitle = params.get('chatbotTitle') || 'Chatbot';
          await setDoc(doc(db, 'shopify_connections', connectionId), {
            shop,
            chatbotId,
            chatbotTitle,
            userId: user.uid,
            connectedAt: new Date().toISOString(),
          });
          toast.success(`Connected to ${shop}!`);
          fetchShopifyConnections();
        } catch (err) {
          console.error('Error saving connection:', err);
        }
      }
      window.history.replaceState({}, '', '/integrations');
      setActivePlatform('shopify');
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
      toast.success('Store disconnected.');
      fetchShopifyConnections();
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast.error("Couldn't disconnect the store. Please try again.");
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
        title: d.data().title || "Untitled Chatbot",
        primaryColor: d.data().primaryColor,
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
    ? `<div id="chatbot-container"></div>\n<script src="${origin}/chatbot-embed.js"></script>\n<script>\n  ChatbotEmbed.init("${selectedChatbot}", "${origin}");\n</script>`
    : "";

  const copyToClipboard = (text: string, type: "embed" | "id") => {
    navigator.clipboard.writeText(text).then(
      () => {
        const set = type === "embed" ? setCopied : setCopiedId;
        set(true);
        setTimeout(() => set(false), 2000);
        toast.success(type === "embed" ? "Embed code copied" : "Chatbot ID copied");
      },
      () => toast.error("Couldn't copy to the clipboard.")
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
      toast.success("Plugin downloaded!");
    } catch (err) {
      console.error("Error generating plugin zip:", err);
      toast.error("Failed to download plugin.");
    } finally {
      setDownloading(false);
    }
  };

  const connectShopify = (e: React.FormEvent) => {
    e.preventDefault();
    const shop = shopUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!shop || !shop.includes('.myshopify.com')) {
      toast.error('Please enter a valid Shopify store URL (e.g. yourstore.myshopify.com)');
      return;
    }
    if (!selectedChatbot) {
      toast.error('Please select a chatbot first.');
      return;
    }
    if (testMode) {
      toast.success("(Test mode) This would open Shopify to install the app.");
      return;
    }
    const chatbotTitle = chatbots.find(b => b.id === selectedChatbot)?.title || 'Chatbot';
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(shop)}&chatbotId=${encodeURIComponent(selectedChatbot)}&chatbotTitle=${encodeURIComponent(chatbotTitle)}`;
  };

  const selectedBot = chatbots.find((c) => c.id === selectedChatbot);
  const platform = PLATFORMS.find((p) => p.key === activePlatform)!;

  if (loading) return <IntegrationsSkeleton />;

  return (
    <div className="min-h-screen bg-[#F3F7FC] font-sans text-[#101723] dark:bg-[#141D2B]">
      <Helmet>
        <title>Integrations | Askio Chatbot</title>
      </Helmet>

      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-h2 tracking-tight text-[#101723] sm:text-h1 dark:text-[#D7DFE5]">
              Integrations
            </h1>
            <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">
              Put your chatbot on your website. Pick a chatbot, choose your platform and follow the steps.
            </p>
          </div>
          <Link to="/documentation" className={secondaryButton}>
            <BookOpen size={15} />
            Documentation
          </Link>
        </header>

        {chatbots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#C9D3E0] bg-[#F9FCFF]/60 dark:border-[#39485B] dark:bg-[#1A2533]/40">
            <EmptyState
              icon={Bot}
              title="Create a chatbot first"
              description="Once you have a chatbot, come back here to add it to WordPress, Shopify, Wix or any other website."
              action={<CreateChatbotLink label="Create chatbot" />}
            />
          </div>
        ) : (
          <>
            {/* Chatbot to install */}
            <section className={`${surface} flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center`}>
              <div className="min-w-0 lg:w-80">
                <StepLabel n={1}>Chatbot to install</StepLabel>
                <ChatbotPicker chatbots={chatbots} value={selectedChatbot} onChange={setSelectedChatbot} />
              </div>
              <div className="hidden h-12 w-px bg-[#E7EDF6] lg:block dark:bg-[#2B3646]" />
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-caption font-medium text-[#566273] dark:text-[#9BAABD]">Chatbot ID</p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-[#E7EDF6] bg-[#F3F7FC] px-3 py-2 font-mono text-[13px] text-[#101723] select-all dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5]">
                    {selectedChatbot}
                  </code>
                  <button onClick={() => copyToClipboard(selectedChatbot, "id")} className={secondaryButton}>
                    {copiedId ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                    <span className="hidden sm:inline">{copiedId ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="mt-1.5 text-caption text-[#647184] dark:text-[#87909D]">
                  The WordPress plugin asks for this. The other platforms use the embed code, which already includes it.
                </p>
              </div>
            </section>

            {/* Platform picker */}
            <section>
              <StepLabel n={2}>Where is your website?</StepLabel>
              <div role="tablist" aria-label="Platform" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                          ? "border-[#101723] bg-[#F9FCFF] shadow-[0_0_0_1px_#101723] dark:border-[#D7DFE5] dark:bg-[#1A2533] dark:shadow-[0_0_0_1px_#D7DFE5]"
                          : "border-[#D8DFE9] bg-[#F9FCFF] hover:border-[#B8C3D1] dark:border-[#2B3646] dark:bg-[#1A2533] dark:hover:border-[#39485B]"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E7EDF6] bg-white dark:border-[#2B3646] dark:bg-[#F3F7FC]">
                        {p.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-body-sm font-semibold text-[#101723] dark:text-[#F3F7FC]">
                          {p.label}
                        </span>
                        <span className="hidden truncate text-caption text-[#647184] sm:block dark:text-[#87909D]">{p.tagline}</span>
                      </span>
                      {connected > 0 && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/25 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {connected}
                        </span>
                      )}
                      {active && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#101723] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">
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
              <div className="flex flex-wrap items-center gap-4 border-b border-[#E7EDF6] px-5 py-4 sm:px-6 dark:border-[#2B3646]">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E7EDF6] bg-white dark:border-[#2B3646] dark:bg-[#F3F7FC]">
                  {platform.logo}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-h3 text-[#101723] dark:text-[#D7DFE5]">
                    Install on {platform.label === "Any website" ? "any website" : platform.label}
                  </h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} />
                      {platform.effort}
                    </span>
                    {selectedBot && (
                      <span className="inline-flex items-center gap-1.5">
                        <BotAvatar color={selectedBot.primaryColor} size={16} />
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
                        { title: "Download the plugin", body: "A small plugin that connects your WordPress site to Askio." },
                        { title: "Upload it to WordPress", body: "In your WordPress admin go to Plugins → Add New → Upload Plugin, choose the .zip and click Install Now, then Activate." },
                        { title: "Paste your Chatbot ID", body: "Open “Askio Chatbot” in the WordPress sidebar, paste the Chatbot ID from above and click Save Settings." },
                        { title: "Check your site", body: "The chatbot appears on every page. Changes you make in Askio show up straight away." },
                      ]}
                    />
                    <ActionPanel title="Get the plugin" description="Works with WordPress 5.0 and newer. No theme changes needed.">
                      <button onClick={downloadWordPressPlugin} disabled={downloading} className={`${primaryButton} w-full sm:w-auto`}>
                        {downloading ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
                        {downloading ? "Preparing…" : "Download askio-chatbot.zip"}
                      </button>
                      <div className="mt-5 border-t border-[#E7EDF6] pt-4 dark:border-[#2B3646]">
                        <p className="text-caption font-medium text-[#566273] dark:text-[#9BAABD]">You'll need this in step 3</p>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="min-w-0 flex-1 truncate rounded-lg bg-[#101723] px-3 py-2 font-mono text-[13px] text-[#D7DFE5]">
                            {selectedChatbot}
                          </code>
                          <button onClick={() => copyToClipboard(selectedChatbot, "id")} className={secondaryButton} aria-label="Copy Chatbot ID">
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
                        { title: "Enter your store URL", body: "Type your yourstore.myshopify.com address and click Connect." },
                        { title: "Approve the app in Shopify", body: "Shopify opens and asks you to allow Askio. Use the “Install unlisted app” link at the bottom of the warning page." },
                        { title: "That's it", body: "The chatbot appears on your storefront. Changes you make in Askio show up straight away." },
                      ]}
                    />
                    <div className="space-y-4">
                      <ActionPanel
                        title={shopifyConnections.length > 0 ? "Connect another store" : "Connect your store"}
                        description="We add the chatbot to your storefront automatically."
                      >
                        <form onSubmit={connectShopify} className="flex flex-col gap-2 sm:flex-row">
                          <label className="sr-only" htmlFor="shop-url">
                            Store URL
                          </label>
                          <div className="relative flex-1">
                            <ShoppingBag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#87909D]" />
                            <input
                              id="shop-url"
                              type="text"
                              inputMode="url"
                              autoComplete="off"
                              value={shopUrl}
                              onChange={(e) => setShopUrl(e.target.value)}
                              placeholder="yourstore.myshopify.com"
                              className="h-9 w-full rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] pl-9 pr-3 text-body-sm text-[#101723] placeholder:text-[#87909D] focus:border-[#101723] focus:outline-none focus:ring-2 focus:ring-[#101723]/10 dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5] dark:focus:border-[#9BAABD]"
                            />
                          </div>
                          <button type="submit" className={primaryButton}>
                            Connect
                            <ArrowRight size={15} />
                          </button>
                        </form>
                        <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/15">
                          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <p className="text-caption leading-relaxed text-amber-900 dark:text-amber-200">
                            Our app is still in Shopify's review, so Shopify shows an <strong>“App isn't approved”</strong> warning.
                            It's safe to continue: click <strong>“Install unlisted app”</strong> at the bottom of that page.
                          </p>
                        </div>
                      </ActionPanel>

                      {shopifyConnections.length > 0 && (
                        <div className="rounded-xl border border-[#E7EDF6] dark:border-[#2B3646]">
                          <p className="border-b border-[#E7EDF6] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[#647184] dark:border-[#2B3646] dark:text-[#87909D]">
                            Connected stores
                          </p>
                          <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
                            {shopifyConnections.map((conn) => (
                              <li key={conn.id} className="flex items-center gap-3 px-4 py-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400">
                                  <ShoppingBag size={15} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{conn.shop}</p>
                                  <p className="truncate text-caption text-[#647184] dark:text-[#87909D]">
                                    {conn.chatbotTitle || chatbots.find((b) => b.id === conn.chatbotId)?.title || conn.chatbotId}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setConnectionToRemove(conn)}
                                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-caption font-medium text-[#566273] hover:bg-red-50 hover:text-red-600 dark:text-[#9BAABD] dark:hover:bg-red-950/30 dark:hover:text-red-400 ${focusRing}`}
                                >
                                  <Unplug size={13} />
                                  Disconnect
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
                        { title: "Open the Wix Editor", body: "From your Wix dashboard, open the editor for your site." },
                        { title: "Add an HTML embed", body: "Click + → Embed Code → Embed HTML. A custom HTML element is added to the page." },
                        { title: "Paste the code", body: "Choose “Code” in the element's settings, paste the embed code and click Update." },
                        { title: "Publish", body: "Click Publish. The chatbot now appears on your live site." },
                      ]}
                    />
                    <EmbedCodeBlock code={embedCode} copied={copied} onCopy={() => copyToClipboard(embedCode, "embed")} />
                  </>
                )}

                {activePlatform === "html" && (
                  <>
                    <Steps
                      steps={[
                        { title: "Copy the embed code", body: "It already includes the chatbot you picked above." },
                        {
                          title: "Paste it before </body>",
                          body: "Add it to every page, or to your site's shared footer or layout template so it loads everywhere.",
                        },
                        { title: "Reload your site", body: "The chatbot button appears in the corner you chose in Askio." },
                      ]}
                      footer="Works on Squarespace, Webflow, Ghost, Framer, custom HTML and any other site where you can add code."
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
        title="Disconnect store"
        confirmText="Disconnect"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500"
      >
        <p className="text-body-sm text-[#566273] dark:text-[#D7DFE5]">
          The chatbot will stop showing on{" "}
          <span className="font-medium text-[#101723] dark:text-white">{connectionToRemove?.shop}</span>. You can connect it
          again at any time.
        </p>
      </ConfirmationModal>
    </div>
  );
}

// --- Sub-components ---

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-caption font-medium text-[#566273] dark:text-[#9BAABD]">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#101723] text-[10px] font-semibold text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">
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
  const selected = chatbots.find((c) => c.id === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        className={`flex h-11 w-full items-center gap-2.5 rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] px-2.5 text-left transition-colors hover:border-[#B8C3D1] data-[open]:border-[#101723] dark:border-[#2B3646] dark:bg-[#141D2B] dark:hover:border-[#39485B] dark:data-[open]:border-[#9BAABD] ${focusRing}`}
      >
        <BotAvatar color={selected?.primaryColor} size={26} muted={selected?.isActive === false} />
        <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
          {selected?.title || "Select a chatbot"}
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-[#87909D]" />
      </ListboxButton>
      {/* Anchored (portalled) and non-modal: the page keeps scrolling and doesn't shift while it's open. */}
      <ListboxOptions
        anchor="bottom start"
        modal={false}
        transition
        className="z-50 max-h-72 w-[var(--button-width)] min-w-56 overflow-auto rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-1.5 shadow-xl transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-[#2B3646] dark:bg-[#1A2533]"
      >
        {chatbots.map((bot) => (
          <ListboxOption
            key={bot.id}
            value={bot.id}
            className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-body-sm data-[focus]:bg-[#F3F7FC] dark:data-[focus]:bg-[#273444]"
          >
            <BotAvatar color={bot.primaryColor} size={22} muted={bot.isActive === false} />
            <span className="min-w-0 flex-1 truncate text-[#101723] group-data-[selected]:font-medium dark:text-[#D7DFE5]">
              {bot.title}
            </span>
            {bot.isActive === false && <span className="text-caption text-[#87909D]">Paused</span>}
            <Check size={15} className="invisible text-[#101723] group-data-[selected]:visible dark:text-[#D7DFE5]" />
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
              <span aria-hidden className="absolute left-[13px] top-8 bottom-1 w-px bg-[#D8DFE9] dark:bg-[#2B3646]" />
            )}
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D8DFE9] bg-[#F3F7FC] text-caption font-semibold text-[#101723] dark:border-[#39485B] dark:bg-[#141D2B] dark:text-[#D7DFE5]">
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-body-sm font-semibold text-[#101723] dark:text-[#D7DFE5]">{step.title}</h3>
              <p className="mt-1 text-body-sm leading-relaxed text-[#566273] dark:text-[#9BAABD]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {footer && (
        <p className="mt-6 rounded-lg bg-[#F3F7FC] px-3 py-2.5 text-caption text-[#566273] dark:bg-[#141D2B] dark:text-[#9BAABD]">
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
    <div className="rounded-xl border border-[#E7EDF6] bg-[#F3F7FC]/60 p-4 sm:p-5 dark:border-[#2B3646] dark:bg-[#141D2B]/60">
      <h3 className="text-body font-semibold text-[#101723] dark:text-[#D7DFE5]">{title}</h3>
      <p className="mb-4 mt-0.5 text-body-sm text-[#566273] dark:text-[#9BAABD]">{description}</p>
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
  return (
    <div className="self-start overflow-hidden rounded-xl border border-[#243040] bg-[#101723] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="flex items-center gap-2 text-caption font-medium text-[#9BAABD]">
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
          </span>
          Embed code
        </span>
        <button
          onClick={onCopy}
          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-caption font-medium transition-colors ${focusRing} ${
            copied ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-[#E7EDF6] hover:bg-white/15"
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-[#D7DFE5]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function IntegrationsSkeleton() {
  return (
    <div className="min-h-screen bg-[#F3F7FC] dark:bg-[#141D2B]" aria-busy="true" aria-label="Loading">
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
          <div className="flex items-center gap-4 border-b border-[#E7EDF6] px-6 py-4 dark:border-[#2B3646]">
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
