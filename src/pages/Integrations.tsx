import { useEffect, useState } from "react";
import { Blocks, Copy, Check, Download, ChevronDown, ExternalLink, LoaderCircle, Globe, ShoppingBag, AlertCircle } from "lucide-react";
import { FaWordpress, FaShopify } from "react-icons/fa";
import { SiWix } from "react-icons/si";
import { db, auth } from "../utils/firebase";
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

type Platform = "wordpress" | "shopify" | "wix" | "html";

interface Chatbot {
  id: string;
  title: string;
}

interface ShopifyConnection {
  id: string;
  shop: string;
  chatbotId: string;
  chatbotTitle: string;
  connectedAt: string;
}

export default function Integrations() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<string>("");
  const [activePlatform, setActivePlatform] = useState<Platform>("wordpress");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shopUrl, setShopUrl] = useState("");
  const [shopifyConnections, setShopifyConnections] = useState<ShopifyConnection[]>([]);

  const origin = window.location.origin;

  useEffect(() => {
    fetchChatbots();
    fetchShopifyConnections();
    handleShopifyCallback();
  }, []);

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
      const bots = snap.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || "Untitled Chatbot",
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
    navigator.clipboard.writeText(text).then(() => {
      if (type === "embed") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      }
      toast.success("Copied to clipboard!");
    });
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

  const platforms: { key: Platform; label: string; icon: React.ReactNode }[] = [
    { key: "wordpress", label: "WordPress", icon: <FaWordpress size={18} className="text-[#21759B]" /> },
    { key: "shopify", label: "Shopify", icon: <FaShopify size={18} className="text-[#95BF47]" /> },
    { key: "wix", label: "Wix", icon: <SiWix size={18} className="text-[#0C6EFC]" /> },
    { key: "html", label: "Any Website", icon: <Globe size={18} className="text-[#605A57] dark:text-[#A8A29E]" /> },
  ];

  const selectedBot = chatbots.find((c) => c.id === selectedChatbot);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F3] dark:bg-[#1C1917] flex items-center justify-center">
        <LoaderCircle className="animate-spin text-[#37322F] dark:text-[#F5F5F4]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] dark:bg-[#1C1917] font-sans text-[#37322F]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#FAFAF9] dark:bg-[#292524] flex items-center justify-center border border-[#E0DEDB] dark:border-[#44403C]">
          <Blocks className="w-5 h-5 text-[#37322F] dark:text-[#F5F5F4]" />
        </div>
        <div>
          <h1 className="text-h1 font-serif text-[#37322F] dark:text-[#F5F5F4]">
            Integrations
          </h1>
          <p className="text-body text-[#605A57] dark:text-[#A8A29E]">
            Connect your Askio chatbot to any website or platform.
          </p>
        </div>
      </div>

      {/* No chatbots state */}
      {chatbots.length === 0 ? (
        <div className="rounded-xl border border-[rgba(55,50,47,0.12)] dark:border-[#44403C] bg-white dark:bg-[#292524] p-12 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-2">
            No chatbots yet
          </h2>
          <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mb-4">
            Create a chatbot first, then come back here to integrate it with your website.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </a>
        </div>
      ) : (
        <>
          {/* Chatbot Selector */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-[#605A57] dark:text-[#A8A29E] mb-2 uppercase tracking-wider">
              Select Chatbot
            </label>
            <div className="relative w-full max-w-sm">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#E0DEDB] dark:border-[#44403C] bg-white dark:bg-[#292524] text-sm text-[#37322F] dark:text-[#F5F5F4] hover:border-[#37322F]/30 dark:hover:border-[#A8A29E]/30 transition-colors"
              >
                <span className="truncate">
                  {selectedBot?.title || "Select a chatbot"}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-[#A8A29E] transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#E0DEDB] dark:border-[#44403C] bg-white dark:bg-[#292524] shadow-lg overflow-hidden">
                  {chatbots.map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => {
                        setSelectedChatbot(bot.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F5F5F4] dark:hover:bg-[#44403C] transition-colors ${
                        bot.id === selectedChatbot
                          ? "bg-[#F5F5F4] dark:bg-[#44403C] text-[#37322F] dark:text-[#F5F5F4] font-medium"
                          : "text-[#605A57] dark:text-[#A8A29E]"
                      }`}
                    >
                      {bot.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chatbot ID Display */}
          <div className="mb-8 p-4 rounded-xl border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#292524]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#A8A29E] dark:text-[#78716C] uppercase tracking-wider font-medium">
                  Your Chatbot ID
                </span>
                <p className="mt-1 font-mono text-sm text-[#37322F] dark:text-[#F5F5F4] select-all">
                  {selectedChatbot}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(selectedChatbot, "id")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E0DEDB] dark:border-[#44403C] bg-white dark:bg-[#1C1917] text-[#605A57] dark:text-[#A8A29E] hover:bg-[#F5F5F4] dark:hover:bg-[#44403C] transition-colors"
              >
                {copiedId ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    Copy ID
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Platform Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[#FAFAF9] dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] w-fit">
            {platforms.map((p) => (
              <button
                key={p.key}
                onClick={() => setActivePlatform(p.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activePlatform === p.key
                    ? "bg-white dark:bg-[#44403C] text-[#37322F] dark:text-[#F5F5F4] shadow-sm"
                    : "text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4]"
                }`}
              >
                <span>{p.icon}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="rounded-xl border border-[rgba(55,50,47,0.12)] dark:border-[#44403C] bg-white dark:bg-[#292524] overflow-hidden">
            {/* WordPress */}
            {activePlatform === "wordpress" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FaWordpress size={28} className="text-[#21759B]" />
                  <div>
                    <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                      WordPress Integration
                    </h2>
                    <p className="text-sm text-[#605A57] dark:text-[#A8A29E]">
                      No coding required — install the plugin and enter your Chatbot ID.
                    </p>
                  </div>
                </div>

                {/* Download Plugin */}
                <div className="mb-8 p-5 rounded-xl bg-[#FAFAF9] dark:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C]">
                  <h3 className="text-sm font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3 flex items-center gap-2">
                    <Download size={16} className="text-[#605A57] dark:text-[#A8A29E]" />
                    Step 1: Download the Plugin
                  </h3>
                  <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mb-4">
                    Download the Askio Chatbot plugin for WordPress. This is a lightweight plugin that connects your site to Askio.
                  </p>
                  <button
                    onClick={downloadWordPressPlugin}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {downloading ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Download askio-chatbot.zip
                      </>
                    )}
                  </button>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  <StepCard
                    number={2}
                    title="Install the Plugin"
                    description='In your WordPress admin, go to Plugins → Add New → Upload Plugin. Choose the downloaded .zip file and click "Install Now", then activate it.'
                  />
                  <StepCard
                    number={3}
                    title="Enter Your Chatbot ID"
                    description={`In your WordPress admin, click "Askio Chatbot" in the sidebar. Paste your Chatbot ID (shown above) and click "Save Settings".`}
                  />
                  <StepCard
                    number={4}
                    title="You're Done!"
                    description="Visit your WordPress site — the Askio chatbot will appear automatically. Any changes you make in the Askio dashboard will be reflected instantly."
                  />
                </div>
              </div>
            )}

            {/* Shopify */}
            {activePlatform === "shopify" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FaShopify size={28} className="text-[#95BF47]" />
                  <div>
                    <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                      Shopify Integration
                    </h2>
                    <p className="text-sm text-[#605A57] dark:text-[#A8A29E]">
                      Add the chatbot to your Shopify store in a few simple steps.
                    </p>
                  </div>
                </div>

                {/* Connected Stores */}
                {shopifyConnections.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3 flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      Connected Stores
                    </h3>
                    <div className="space-y-3">
                      {shopifyConnections.map((conn) => (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAF9] dark:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <ShoppingBag size={16} className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#37322F] dark:text-[#F5F5F4]">
                                {conn.shop}
                              </p>
                              <p className="text-xs text-[#A8A29E] dark:text-[#78716C]">
                                Chatbot: <span className="font-medium text-[#605A57] dark:text-[#D6D3D1]">{conn.chatbotTitle || chatbots.find(b => b.id === conn.chatbotId)?.title || conn.chatbotId}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => disconnectShopify(conn.id)}
                            className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connect to Shopify */}
                <div className="mb-8 p-5 rounded-xl bg-[#FAFAF9] dark:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C]">
                  <h3 className="text-sm font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#605A57] dark:text-[#A8A29E]" />
                    {shopifyConnections.length > 0 ? 'Connect Another Store' : 'Connect Your Shopify Store'}
                  </h3>
                  <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mb-6">
                    Enter your Shopify store URL and click connect. We'll automatically add the chatbot to your storefront.
                  </p>

                  <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Pre-release installation notice
                        </p>
                        <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-1">
                          Since our app is pending public store review, Shopify will show an <strong className="font-semibold text-amber-900 dark:text-amber-200">"App isn't approved"</strong> warning during installation. 
                          You can safely bypass this by clicking the <strong className="font-semibold text-amber-900 dark:text-amber-200">"Install unlisted app"</strong> link at the bottom of the page to proceed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-sm">
                      <label className="block text-xs text-[#A8A29E] dark:text-[#78716C] mb-1.5 font-medium">
                        Store URL
                      </label>
                      <input
                        type="text"
                        value={shopUrl}
                        onChange={(e) => setShopUrl(e.target.value)}
                        placeholder="yourstore.myshopify.com"
                        className="w-full px-4 py-2.5 rounded-lg border border-[#E0DEDB] dark:border-[#44403C] bg-white dark:bg-[#292524] text-sm text-[#37322F] dark:text-[#F5F5F4] placeholder-[#A8A29E] dark:placeholder-[#78716C] focus:outline-none focus:border-[#37322F]/30 dark:focus:border-[#A8A29E]/30 transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const shop = shopUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
                        if (!shop || !shop.includes('.myshopify.com')) {
                          toast.error('Please enter a valid Shopify store URL (e.g. yourstore.myshopify.com)');
                          return;
                        }
                        if (!selectedChatbot) {
                          toast.error('Please select a chatbot first.');
                          return;
                        }
                        const chatbotTitle = chatbots.find(b => b.id === selectedChatbot)?.title || 'Chatbot';
                        window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(shop)}&chatbotId=${encodeURIComponent(selectedChatbot)}&chatbotTitle=${encodeURIComponent(chatbotTitle)}`;
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      <ShoppingBag size={16} />
                      Connect to Shopify
                    </button>
                  </div>
                </div>

                {/* How it works */}
                <div className="space-y-4">
                  <StepCard
                    number={1}
                    title="Enter Your Store URL"
                    description='Type your Shopify store URL above (e.g. yourstore.myshopify.com) and click "Connect to Shopify".'
                  />
                  <StepCard
                    number={2}
                    title="Authorize the App"
                    description="You will be redirected to Shopify to authorize the Askio Chatbot app. Follow the unlisted app link at the bottom of the warning page to grant permission."
                  />
                  <StepCard
                    number={3}
                    title="You're Done!"
                    description="The chatbot will automatically appear on your Shopify store. Any changes you make in Askio are reflected instantly."
                  />
                </div>
              </div>
            )}

            {/* Wix */}
            {activePlatform === "wix" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <SiWix size={28} className="text-[#0C6EFC]" />
                  <div>
                    <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                      Wix Integration
                    </h2>
                    <p className="text-sm text-[#605A57] dark:text-[#A8A29E]">
                      Add the chatbot to your Wix site using the HTML embed feature.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <StepCard
                    number={1}
                    title="Open the Wix Editor"
                    description="Go to your Wix site dashboard and open the Wix Editor for the page where you want the chatbot."
                  />
                  <StepCard
                    number={2}
                    title="Add an HTML Embed"
                    description='Click the "+" button → Embed Code → Embed HTML. This will add a custom HTML element to your page.'
                  />
                  <StepCard
                    number={3}
                    title="Paste the Embed Code"
                    description='Select "Code" mode in the HTML settings panel, paste the code below, and click "Update".'
                  />
                  <StepCard
                    number={4}
                    title="Publish Your Site"
                    description='Click "Publish" to make the changes live. The chatbot will now appear on your Wix site.'
                  />
                </div>

                <EmbedCodeBlock
                  code={embedCode}
                  copied={copied}
                  onCopy={() => copyToClipboard(embedCode, "embed")}
                />
              </div>
            )}

            {/* HTML / Any Website */}
            {activePlatform === "html" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Globe size={28} className="text-[#605A57] dark:text-[#A8A29E]" />
                  <div>
                    <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                      Any Website
                    </h2>
                    <p className="text-sm text-[#605A57] dark:text-[#A8A29E]">
                      Add the chatbot to any website by pasting this code before the closing{" "}
                      <code className="text-xs bg-[#F5F5F4] dark:bg-[#44403C] px-1.5 py-0.5 rounded">
                        {"</body>"}
                      </code>{" "}
                      tag.
                    </p>
                  </div>
                </div>

                <EmbedCodeBlock
                  code={embedCode}
                  copied={copied}
                  onCopy={() => copyToClipboard(embedCode, "embed")}
                />

                <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>Tip:</strong> This code works on any platform — Squarespace, Webflow, Ghost, custom HTML, and more. Just paste it before the closing{" "}
                    <code className="text-xs bg-amber-100 dark:bg-amber-800/30 px-1 py-0.5 rounded">
                      {"</body>"}
                    </code>{" "}
                    tag of your HTML.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Help link */}
          <div className="mt-6 text-center">
            <a
              href="/documentation"
              className="inline-flex items-center gap-1.5 text-sm text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
            >
              Need help? Visit the documentation
              <ExternalLink size={14} />
            </a>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-[#E0DEDB] dark:border-[#44403C] bg-white dark:bg-[#292524]">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] text-xs font-bold flex items-center justify-center">
        {number}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-1">
          {title}
        </h4>
        <p className="text-sm text-[#605A57] dark:text-[#A8A29E] leading-relaxed">
          {description}
        </p>
      </div>
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
    <div className="rounded-xl border border-[#E0DEDB] dark:border-[#44403C] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] dark:bg-[#1C1917] border-b border-[#E0DEDB] dark:border-[#44403C]">
        <span className="text-xs font-medium text-[#A8A29E] dark:text-[#78716C] uppercase tracking-wider">
          Embed Code
        </span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#E0DEDB] dark:border-[#44403C] bg-white dark:bg-[#292524] text-[#605A57] dark:text-[#A8A29E] hover:bg-[#F5F5F4] dark:hover:bg-[#44403C] transition-colors"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={13} />
              Copy Code
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-[#37322F] dark:text-[#E7E5E4] bg-white dark:bg-[#292524]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
