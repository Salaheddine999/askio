import brandLogo from "../assets/logo.svg";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaFacebookMessenger, FaInstagram, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { pageGreetingFor, type PageGreeting } from "../utils/pageGreetings";
import { X, ThumbsUp, ThumbsDown, MessageSquare, Bot, UserRound, ArrowUp, ChevronLeft, ChevronRight, CircleCheck, ExternalLink } from "./icons";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import { db } from "../utils/db";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";
import bot1 from "../assets/chat1.svg";
import { apiRequest } from "../utils/api";
import { LiveOrb, type LiveOrbFinish, type LiveOrbPersonality } from "./LiveOrb";
import { headerOrbPropsFor, orbPropsFor, type LauncherStyle } from "../utils/orbColors";
import { isOwnerBrowsing } from "../utils/ownerSession";
import { isPresenceOnline, LIVE_WAIT_MS, type LiveStatus } from "../utils/liveChat";
import { contactChannel, normalizeContactLink, withWhatsAppText, type ContactChannel } from "../utils/links";
import { pickSuggested, SUGGESTED_QUESTIONS as MAX_SUGGESTIONS } from "../utils/suggestions";
import { isLang, makeT, type Lang } from "../i18n";
import { widgetMessages } from "../i18n/widget";
import { AiIcon } from "./icons";

type Message = {
  text: string;
  /** "agent" is the owner answering live; "notice" is a line like "Sara joined". */
  sender: "user" | "bot" | "agent" | "notice";
  isFallback?: boolean;
  isLeadCapture?: boolean;
  name?: string;
  /** The FAQ question an answer came from, shown under it. */
  source?: string;
  /** That FAQ's button ("Track my order"), shown under the answer. */
  action?: { label: string; href: string };
};

/** How long a "typing" signal stays on screen, and how often one is sent. */
const TYPING_SHOW_MS = 5000;
const TYPING_SEND_MS = 3000;

/** How long the launcher waits before showing the greeting bubble. */
const GREETING_DELAY_MS = 4000;
/** How long the orb looks at the bubble before following the pointer again. */
const GREETING_GLANCE_MS = 1500;

// Matches the length limit in the Firestore rules for logged questions.
const MAX_MESSAGE_LENGTH = 2000;
export interface ChatbotProps {
  id: string;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialMessage: string;
  placeholder: string;
  faqData: Array<{ question: string; answer: string; suggested?: boolean; buttonLabel?: string; buttonUrl?: string }>;
  isEmbedded?: boolean;
  isPreview?: boolean;
  isActive?: boolean;
  customPositionClass?: string;
  gradientStart?: string;
  liveChatLink?: string;
  enableLeadCapture?: boolean;
  /** Show "Answered from: <FAQ>" under answers. On unless turned off. */
  showSources?: boolean;
  aiTone?: string;
  aiEnabled?: boolean;
  launcherStyle?: LauncherStyle;
  /** How Kio carries itself, when the launcher is Kio. */
  kioPersonality?: LiveOrbPersonality;
  /** Kio's surface: glossy with a highlight, or matte. */
  kioFinish?: LiveOrbFinish;
  greetingBubble?: boolean;
  /** Greetings for specific pages, shown beside the launcher and on the home screen. */
  pageGreetings?: PageGreeting[];
  /** Set by an admin when the owner's account is suspended; the widget stays hidden. */
  suspended?: boolean;
  /** The owner saves conversations (Pro): messages are sent to be stored, and visitors are told. */
  saveConversations?: boolean;
  /** Visitors can ask for the owner while they're online in the dashboard (Pro). */
  liveChat?: boolean;
  /** The language of the widget's own text, for visitors. English by default. */
  language?: Lang;
  /** The chatbot owner's uid, from the saved config. */
  user_id?: string;
}

/** The chat apps a "talk to a human" link can open, with their brand colour. */
/** A random id from the browser's secure generator: `length` characters, 5 bits each. */
const randomId = (length: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(length)), (b) => (b & 31).toString(32)).join("");

// Storage can be unavailable in a third-party iframe; the widget works without it.
const readStored = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStored = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not kept; the visitor may be asked again next time.
  }
};

const CHANNELS: Record<ContactChannel, { name: string; color: string }> = {
  whatsapp: { name: "WhatsApp", color: "#1FAF55" },
  telegram: { name: "Telegram", color: "#229ED9" },
  messenger: { name: "Messenger", color: "#0084FF" },
  instagram: { name: "Instagram", color: "#E1306C" },
};

const channelIcon = (channel: ContactChannel, size: number) => {
  const Icon = { whatsapp: FaWhatsapp, telegram: FaTelegramPlane, messenger: FaFacebookMessenger, instagram: FaInstagram }[channel];
  return <Icon size={size} aria-hidden="true" />;
};

const Chatbot: React.FC<ChatbotProps> = ({
  id,
  user_id,
  title,
  primaryColor,
  secondaryColor,
  position,
  initialMessage,
  placeholder,
  faqData,
  isEmbedded,
  customPositionClass,
  liveChatLink,
  enableLeadCapture,
  showSources = true,
  aiEnabled,
  launcherStyle = "classic",
  kioPersonality = "lively",
  kioFinish = "glossy",
  greetingBubble = false,
  pageGreetings,
  isPreview = false,
  language,
  saveConversations = false,
  liveChat = false,
}) => {
  const t = useMemo(() => makeT(widgetMessages, isLang(language) ? language : "en"), [language]);
  const contactHref = normalizeContactLink(liveChatLink);
  // A chat app link (WhatsApp, Telegram, Messenger, Instagram) gets its own
  // button and home card. WhatsApp can take the visitor's question typed in;
  // the others can't, so tapping copies it for them to paste.
  const channel = contactChannel(contactHref);
  /** The button the owner put on an FAQ's answer, if it has a working link. */
  const actionFor = (question?: string) => {
    const faq = question ? faqData.find((f) => f.question === question) : undefined;
    const href = normalizeContactLink(faq?.buttonUrl);
    return faq?.buttonLabel && href ? { label: faq.buttonLabel, href } : undefined;
  };

  // Leads, analytics and ratings go through the server, which checks and
  // rate-limits them. The owner isn't a visitor: their preview, and their own
  // chats with the bot in a browser where they're signed in, record nothing.
  const record = async (kind: "lead" | "event" | "unanswered" | "feedback" | "message" | "typing" | "seen", fields: Record<string, unknown>) => {
    if (!id || isPreview || isOwnerBrowsing(user_id)) return;
    await apiRequest("/api/ai/record", { body: { kind, chatbotId: id, ...fields } });
  };
  // For listeners set up once, so they always use the current settings.
  const recordRef = useRef(record);
  recordRef.current = record;
  const [messages, setMessages] = useState<Message[]>([]);
  // Only the latest reply the bot couldn't answer offers a human, so several
  // misses in a row don't repeat the button.
  const lastFallbackIndex = messages.reduce((last, m, i) => (m.isFallback ? i : last), -1);

  // Kio reacts for a moment: a smile for a thumbs up or a sent email, an
  // unsure glance when it can't answer.
  const [reaction, setReaction] = useState<"happy" | "unsure" | null>(null);
  const reactionTimer = useRef<number>();
  const react = (next: "happy" | "unsure") => {
    window.clearTimeout(reactionTimer.current);
    setReaction(next);
    reactionTimer.current = window.setTimeout(() => setReaction(null), 1800);
  };
  useEffect(() => () => window.clearTimeout(reactionTimer.current), []);
  const seenMessages = useRef(0);
  useEffect(() => {
    const added = messages.length > seenMessages.current;
    seenMessages.current = messages.length;
    const last = messages[messages.length - 1];
    if (added && last?.sender === "bot" && (last.isFallback || last.isLeadCapture)) react("unsure");
  }, [messages]);

  // One conversation per chatbot per browser tab, so moving between pages of
  // the owner's site continues the same saved conversation.
  // The id is the visitor's only key to their conversation, so it's always
  // random from the browser's secure generator, even when storage is blocked.
  const sessionId = useMemo(() => {
    const key = `askio-chat-session:${id}`;
    try {
      const existing = sessionStorage.getItem(key);
      if (existing) return existing;
      const created = randomId(24);
      sessionStorage.setItem(key, created);
      return created;
    } catch {
      return randomId(24);
    }
  }, [id]);

  // Send each new message once, in order, when the owner saves conversations.
  // The welcome message (index 0) isn't saved; it's the same for everyone.
  const savedCount = useRef(1);
  // Set once a message is stored, so the conversation exists for live chat.
  const [conversationSaved, setConversationSaved] = useState(false);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    if (messages.length < savedCount.current) savedCount.current = Math.min(messages.length, 1);
    if (!saveConversations || !id || isPreview) {
      savedCount.current = Math.max(messages.length, 1);
      return;
    }
    const fresh = messages.slice(savedCount.current);
    savedCount.current = Math.max(messages.length, 1);
    for (const message of fresh) {
      // The owner's live replies are already saved; notices are only shown.
      if (!message.text || message.sender === "agent" || message.sender === "notice") continue;
      saveQueue.current = saveQueue.current
        .then(() =>
          record("message", {
            role: message.sender === "user" ? "visitor" : "bot",
            text: message.text,
            sessionId,
            anonymousToken,
            ...(message.sender === "user" && pageUrl.current ? { page: pageUrl.current } : {}),
          })
        )
        .then(() => setConversationSaved(true))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(!isEmbedded);
  // The widget opens on a home screen (greeting, popular questions); the
  // chat takes over once the visitor asks something.
  const [view, setView] = useState<"home" | "chat">("home");
  // The widget's size on a website: the panel the embed script opens
  // (360×600, smaller on small screens, the whole screen on phones).
  const [space, setSpace] = useState({ width: 360, height: 600, fullscreen: false });
  useEffect(() => {
    if (!isEmbedded) return;
    const onSpace = (event: MessageEvent) => {
      if (event.source !== window.parent || event.data?.type !== "askioSpace") return;
      const width = Number(event.data.width);
      const height = Number(event.data.height);
      if (width > 0 && height > 0) setSpace({ width, height, fullscreen: event.data.fullscreen === true });
    };
    window.addEventListener("message", onSpace);
    return () => window.removeEventListener("message", onSpace);
  }, [isEmbedded]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingGlance, setGreetingGlance] = useState(false);
  const launcherRef = useRef<HTMLDivElement>(null);
  // Guards late size reports once the bubble starts hiding.
  const greetingVisibleRef = useRef(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [fuse, setFuse] = useState<Fuse<{
    question: string;
    answer: string;
  }> | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [anonymousToken, setAnonymousToken] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState("");
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);

  const isGradient = primaryColor.startsWith("linear-gradient");

  const headerStyle = {
    backgroundColor: isGradient ? "transparent" : primaryColor,
    backgroundImage: isGradient ? primaryColor : "none",
  };

  const buttonStyle = {
    backgroundColor: isGradient ? "transparent" : secondaryColor,
    backgroundImage: isGradient ? secondaryColor : "none",
  };

  const userMessageStyle = {
    backgroundColor: isGradient ? "transparent" : secondaryColor,
    backgroundImage: isGradient ? secondaryColor : "none",
  };

  useEffect(() => {
    setMessages([{ text: initialMessage, sender: "bot" }]);
  }, [initialMessage]);

  // A few suggestions, not the whole list: the ones the owner starred (or
  // the first ones) to start, and the closest ones after a missed question.
  const topQuestions = useMemo(() => pickSuggested(faqData).map((faq) => faq.question), [faqData]);
  useEffect(() => {
    setSuggestions(topQuestions);
  }, [topQuestions]);
  // Looser than the answer matcher, and reads the answers too, so "related"
  // finds questions near a miss rather than exact matches.
  const relatedFuse = useMemo(
    () => new Fuse(faqData, { keys: [{ name: "question", weight: 2 }, "answer"], threshold: 0.6, ignoreLocation: true }),
    [faqData]
  );

  useEffect(() => {
    const fuseInstance = new Fuse(faqData, {
      keys: ["question"],
      threshold: 0.4, // Adjusts the sensitivity of the matching
    });
    setFuse(fuseInstance);
  }, [faqData]);

  useEffect(() => {
    // Kept across visits when the browser allows storage; a fresh one per
    // visit when it doesn't (third-party iframes often can't store anything).
    try {
      const storedToken = localStorage.getItem("anonymousToken");
      if (storedToken) {
        setAnonymousToken(storedToken);
        return;
      }
      const newToken = randomId(16);
      localStorage.setItem("anonymousToken", newToken);
      setAnonymousToken(newToken);
    } catch {
      setAnonymousToken(randomId(16));
    }
  }, []);

  useEffect(() => {
    const checkPreviousFeedback = async () => {
      if (!anonymousToken || !id) return;

      const feedbackKey = `feedback_${id}`;
      const storedFeedback = readStored(feedbackKey);
      if (storedFeedback) {
        setHasFeedback(true);
        return;
      }

      try {
        const feedbackDoc = await getDoc(
          doc(db, "feedback", `${id}_${anonymousToken}`)
        );
        if (feedbackDoc.exists()) {
          setHasFeedback(true);
          writeStored(feedbackKey, "true");
        }
      } catch (error) {
        console.error("Error checking previous feedback:", error);
      }
    };

    checkPreviousFeedback();
  }, [id, anonymousToken]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Same shape the Firestore rules accept, so a lead is never silently rejected.
    if (!/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(leadEmail.trim())) {
      setMessages((prev) => [
        ...prev,
        { text: t("invalidEmail"), sender: "bot" }
      ]);
      return;
    }

    setHasSubmittedLead(true);
    setIsTyping(true);

    try {
      if (id) {
        await record("lead", { email: leadEmail.trim(), anonymousToken, sessionId });
      }
      setIsTyping(false);
      react("happy");
      setMessages((prev) => [
        ...prev,
        { text: t("leadThanks"), sender: "bot" }
      ]);
    } catch (error) {
      console.error("Error submitting lead:", error);
      setIsTyping(false);
      setHasSubmittedLead(false);
      setMessages((prev) => [
        ...prev,
        { text: t("leadSaveError"), sender: "bot" }
      ]);
    }
  };

  // Live chat: when the owner is online, a visitor can ask for them. The
  // owner's online status and, once asked, this conversation are followed in
  // Firestore; the bot stays quiet until the owner ends the chat.
  const canTalkLive = liveChat && saveConversations && !!id && !!user_id && !isPreview && !isOwnerBrowsing(user_id);
  const [ownerOnline, setOwnerOnline] = useState(false);
  useEffect(() => {
    // Only while the chat is open: most visitors never open it, and every
    // listening page reads the owner's status again each minute.
    if (!canTalkLive || !user_id || !isOpen) return;
    let latest: Record<string, unknown> | undefined;
    const update = () => setOwnerOnline(isPresenceOnline(latest));
    const unsubscribe = onSnapshot(
      doc(db, "presence", user_id),
      (snap) => {
        latest = snap.data();
        update();
      },
      () => setOwnerOnline(false)
    );
    // Online goes stale without a fresh heartbeat; check now and then.
    const timer = window.setInterval(update, 30_000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [canTalkLive, user_id, isOpen]);

  const [live, setLive] = useState<{ status: LiveStatus; name: string } | null>(null);
  const liveRef = useRef(live);
  liveRef.current = live;
  const [liveFollowing, setLiveFollowing] = useState(false);
  const seenAgentMessages = useRef(0);
  const lastAgentTyping = useRef(0);
  const [agentTyping, setAgentTyping] = useState<{ name: string; until: number } | null>(null);
  useEffect(() => {
    if (!agentTyping) return;
    const timer = window.setTimeout(() => setAgentTyping(null), Math.max(0, agentTyping.until - Date.now()));
    return () => window.clearTimeout(timer);
  }, [agentTyping]);
  // While talking to a person, say "typing" at most every few seconds.
  const lastTypingSent = useRef(0);
  const sendTyping = () => {
    if (!liveRef.current || !id || Date.now() - lastTypingSent.current < TYPING_SEND_MS) return;
    lastTypingSent.current = Date.now();
    void record("typing", { sessionId }).catch(() => undefined);
  };
  const agentLabel = (name?: string) => name || t("teamName");

  /** `announce` adds "I'm asking someone to join"; skipped when the AI just said so. */
  const requestPerson = async (announce = true) => {
    if (liveRef.current || !id) return;
    setLive({ status: "waiting", name: "" });
    setShowSuggestions(false);
    if (announce) setMessages((prev) => [...prev, { text: t("liveWaiting"), sender: "bot" }]);
    try {
      await apiRequest("/api/ai/record", { body: { kind: "handoff", action: "request", chatbotId: id, sessionId, anonymousToken } });
      setLiveFollowing(true);
    } catch {
      setLive(null);
      setMessages((prev) => [...prev, { text: t("liveUnavailable"), sender: "bot", isFallback: true }]);
    }
  };

  // With live chat on, the widget follows its conversation from the first
  // saved message, so the owner can join at any time, asked or not.
  const following = liveFollowing || (canTalkLive && conversationSaved);
  useEffect(() => {
    if (!following || !id) return;
    let first = true;
    return onSnapshot(
      doc(db, "conversations", `${id}_${sessionId}`),
      (snap) => {
        const data = snap.data();
        if (!data) return;
        const agent = (Array.isArray(data.messages) ? data.messages : [])
          .filter((m: { role?: string }) => m.role === "agent")
          .sort((a: { at: number }, b: { at: number }) => a.at - b.at);
        // The first look only counts replies from before (say, on another
        // page of the site); everything after it is shown.
        if (first && !liveRef.current) seenAgentMessages.current = agent.length;
        first = false;
        const fresh = agent.slice(seenAgentMessages.current);
        seenAgentMessages.current = agent.length;
        const name = typeof data.agentName === "string" ? data.agentName : "";
        const current = liveRef.current;
        const added: Message[] = [];
        // A fresh "typing" stamp shows the indicator for a few seconds; the
        // reply itself, when it comes, takes its place.
        const typingAt = data.agentTypingAt?.toMillis?.() ?? 0;
        if (typingAt && typingAt !== lastAgentTyping.current) {
          lastAgentTyping.current = typingAt;
          if (!first) setAgentTyping({ name, until: Date.now() + TYPING_SHOW_MS });
        }
        if (fresh.length) setAgentTyping(null);
        if (data.liveStatus === "active" && current?.status !== "active") {
          added.push({ text: t("liveJoined", { name: agentLabel(name) }), sender: "notice" });
          react("happy");
        }
        for (const m of fresh) added.push({ text: m.text, sender: "agent", name: m.name || name });
        if (data.liveStatus === "active" || data.liveStatus === "waiting") {
          setLive({ status: data.liveStatus, name });
        } else if (current) {
          // Ended, missed, or back to idle: the bot answers again.
          if (data.liveStatus === "ended") added.push({ text: t("liveEnded", { name: agentLabel(current.name || name) }), sender: "notice" });
          setLive(null);
          setLiveFollowing(false);
        }
        if (added.length) setMessages((prev) => [...prev, ...added]);
      },
      () => undefined
    );
  }, [following, id, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nobody answered in time: let go, and offer the email form or contact link.
  useEffect(() => {
    if (live?.status !== "waiting" || !liveFollowing) return;
    const timer = window.setTimeout(() => {
      void apiRequest("/api/ai/record", { body: { kind: "handoff", action: "cancel", chatbotId: id, sessionId, anonymousToken } }).catch(() => undefined);
      setLive(null);
      setLiveFollowing(false);
      const leadCapture = enableLeadCapture === true || (enableLeadCapture as unknown as string) === "true";
      setMessages((prev) => [
        ...prev,
        { text: t("liveNoAnswer"), sender: "bot", isFallback: !leadCapture },
        ...(leadCapture ? [{ text: t("leadAsk"), sender: "bot" as const, isLeadCapture: true }] : []),
      ]);
    }, LIVE_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [live?.status, liveFollowing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (input.trim() === "") return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setShowSuggestions(false);
    setInput("");
    // A person is (or is about to be) answering: no bot reply.
    if (liveRef.current) return;

    let matchedFaq: { question: string; answer: string } | undefined;

    if (fuse) {
      const result = fuse.search(input.trim());
      if (result.length > 0) {
        matchedFaq = result[0].item;
      }
    } else {
      matchedFaq = faqData.find(
        (item) => item.question.toLowerCase() === input.toLowerCase()
      );
    }

    setIsTyping(true);

    if (aiEnabled && id) {
      // Stays true unless the server sends no AI reply (monthly limit, rate
      // limit or AI unavailable); then the regular FAQ flow below answers.
      let aiHandled = true;
      try {
        const historyContext = messages.filter(m => !m.isFallback && !m.isLeadCapture);
        const { reply: aiResponseText, answered, sources, live: ownerLive } = await apiRequest<{
          reply: string | null;
          answered?: boolean;
          sources?: string[];
          live?: boolean;
          fallback?: string;
        }>(
          "/api/ai/chat-response",
          {
            body: {
              chatbotId: id,
              query: input,
              history: historyContext,
            },
          }
        );
        
        if (aiResponseText) {
          // Check if the AI indicated it couldn't answer the question
          const lowerResponse = aiResponseText.toLowerCase();
          const cantAnswerPhrases = [
            "don't know", "do not know", "don't have", "do not have",
            "cannot answer", "can't answer", "not sure", "no information",
            "human agent", "connect you with", "beyond my knowledge",
            "outside my knowledge", "i'm unable to", "i am unable to",
            "don't have information", "no answer", "can't help with that",
            "unable to help", "not in my knowledge",
          ];
          // The server says whether it answered, in any language; older
          // replies without that flag fall back to spotting English phrases.
          const aiCouldNotAnswer =
            typeof answered === "boolean" ? !answered : cantAnswerPhrases.some((phrase) => lowerResponse.includes(phrase));

          // You're online: the AI said it's getting you, so hand off instead
          // of showing a link or asking for an email.
          const handOff = aiCouldNotAnswer && canTalkLive && (ownerLive ?? ownerOnline) && !liveRef.current;

          setMessages((prev) => [
            ...prev,
            {
              text: aiResponseText,
              sender: "bot",
              isFallback: aiCouldNotAnswer && !enableLeadCapture && !handOff,
              source: aiCouldNotAnswer ? undefined : sources?.[0],
              action: aiCouldNotAnswer ? undefined : actionFor(sources?.[0]),
            },
          ]);

          if (handOff) {
            void requestPerson(false);
            if (id) void record("unanswered", { query: input, anonymousToken }).catch(() => undefined);
          } else if (aiCouldNotAnswer) {
            // Otherwise show lead capture or the contact link.
            const isLeadCaptureEnabled = enableLeadCapture === true || (enableLeadCapture as unknown as string) === "true";
            if (isLeadCaptureEnabled) {
              setMessages((prev) => [
                ...prev,
                {
                  text: t("leadAsk"),
                  sender: "bot",
                  isLeadCapture: true,
                },
              ]);
            } else if (liveChatLink) {
              // isFallback is already set on the AI response above to show the live chat link
              setTimeout(() => {
                setShowSuggestions(true);
                updateSuggestions(input);
              }, 100);
            }

            // Track as unanswered query
            if (id) {
              try {
                await record("unanswered", { query: input, anonymousToken });
              } catch (error) {
                console.error("Error tracking unanswered query:", error);
              }
            }
          }
          
          if (id && !aiCouldNotAnswer) {
            try {
              await record("event", { type: "ai_generated", userQuery: input, anonymousToken });
            } catch (error) {
              console.error("Error tracking analytics event:", error);
            }
          }
        } else {
          aiHandled = false;
        }
      } catch (error) {
        // Unreachable server or network: answer from the FAQs instead.
        console.error("Error generating AI response:", error);
        aiHandled = false;
      } finally {
        if (aiHandled) setIsTyping(false);
      }
      if (aiHandled) return; // Exit early since we used the AI
    }

    setTimeout(async () => {
      if (matchedFaq) {
        setMessages((prev) => [
          ...prev,
          { text: matchedFaq.answer, sender: "bot", source: matchedFaq.question, action: actionFor(matchedFaq.question) },
        ]);
        setIsTyping(false);
        
        // Track analytics
        if (id) {
          try {
            await record("event", { type: "faq_matched", question: matchedFaq.question, userQuery: input, anonymousToken });
          } catch (error) {
            console.error("Error tracking analytics event:", error);
          }
        }
      } else if (canTalkLive && ownerOnline && !liveRef.current) {
        // No answer, and you're online: get you instead of a link or form.
        setIsTyping(false);
        void requestPerson();
        if (id) void record("unanswered", { query: input, anonymousToken }).catch(() => undefined);
      } else {
        const isLeadCaptureEnabled = enableLeadCapture === true || (enableLeadCapture as unknown as string) === "true";
        if (isLeadCaptureEnabled) {
          setMessages((prev) => [
            ...prev,
            {
              text: t("noAnswerLeadAsk"),
              sender: "bot",
              isLeadCapture: true,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              text: t("noAnswerRelated"),
              sender: "bot",
              isFallback: true,
            },
          ]);
        }
        setIsTyping(false);

        // Track unanswered query
        if (id) {
          try {
            await record("unanswered", { query: input, anonymousToken });
          } catch (error) {
            console.error("Error tracking unanswered query:", error);
          }
        }

        setTimeout(() => {
          setShowSuggestions(true);
          updateSuggestions(input);
        }, 100);
      }
    }, 1500); // Simulate typing delay
  };

  const updateSuggestions = (userInput: string) => {
    const related = relatedFuse
      .search(userInput.trim())
      .slice(0, MAX_SUGGESTIONS)
      .map((r) => r.item.question);
    setSuggestions(related.length > 0 ? related : topQuestions);
  };

  const handleSuggestionClick = (event: React.MouseEvent, question: string) => {
    event.preventDefault();
    event.stopPropagation();
    askSuggested(question);
  };

  const askSuggested = (question: string) => {
    setView("chat");
    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    const matchedFaq = faqData.find((faq) => faq.question === question);
    if (matchedFaq) {
      setIsTyping(true);
      setTimeout(async () => {
        setMessages((prev) => [
          ...prev,
          { text: matchedFaq.answer, sender: "bot", source: matchedFaq.question, action: actionFor(matchedFaq.question) },
        ]);
        setShowSuggestions(false);
        setIsTyping(false);

        // Track suggestion click analytics
        if (id) {
          try {
            await record("event", { type: "suggestion_clicked", question: matchedFaq.question, anonymousToken });
          } catch (error) {
            console.error("Error tracking suggestion click:", error);
          }
        }
      }, 1500); // Simulate typing delay
    }
  };

  // Reopening goes back to where the visitor was: the chat once they've
  // asked something, the home screen before that.
  const hasConversation = messages.some((m) => m.sender === "user" || m.sender === "agent");
  const hasConversationRef = useRef(hasConversation);
  hasConversationRef.current = hasConversation;
  const lastVisitorQuestion = [...messages].reverse().find((m) => m.sender === "user")?.text ?? "";
  // For apps whose links can't carry a message: the question goes on the
  // clipboard so the visitor only has to paste it.
  const copyQuestion = () => {
    if (!lastVisitorQuestion || !navigator.clipboard) return;
    navigator.clipboard.writeText(lastVisitorQuestion).then(
      () => toast.success(t("questionCopied")),
      () => undefined
    );
  };
  const toggleChatbot = () => {
    if (!isOpen) setView(hasConversation ? "chat" : "home");
    setIsOpen(!isOpen);
  };
  const startChat = () => {
    setView("chat");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };
  // A person joining (or a live chat in progress) always shows the chat.
  useEffect(() => {
    if (live) setView("chat");
  }, [live]);

  const positionClasses = {
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
  };

  const combinedPositionClass = customPositionClass
    ? customPositionClass
    : positionClasses[position];

  useEffect(() => {
    if (isEmbedded) {
      window.parent.postMessage({ type: "chatbotState", isOpen }, "*");
    }
  }, [isOpen, isEmbedded]);

  useEffect(() => {
    // Askio.open() / close() and data-askio-open buttons on the page.
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || event.data?.type !== "toggleChatbot") return;
      const open = event.data.isOpen === true;
      if (open) setView(hasConversationRef.current ? "chat" : "home");
      setIsOpen(open);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // The page the visitor is on, from the embed script.
  const pageUrl = useRef("");
  const [pageAddress, setPageAddress] = useState("");
  useEffect(() => {
    if (!isEmbedded) return;
    const onPage = (event: MessageEvent) => {
      if (event.source !== window.parent || event.data?.type !== "askioPage") return;
      const url = event.data.url;
      if (typeof url !== "string" || !/^https?:\/\//.test(url) || url.length > 300) return;
      const first = !pageUrl.current;
      pageUrl.current = url;
      setPageAddress(url);
      // Tells the dashboard this chatbot is on a website, once a day per browser.
      if (first) {
        const key = `askio-seen:${id}`;
        const today = new Date().toISOString().slice(0, 10);
        try {
          if (localStorage.getItem(key) === today) return;
          localStorage.setItem(key, today);
        } catch {
          // Storage blocked: report anyway; the server ignores repeats.
        }
        void recordRef.current("seen", { page: url }).catch(() => undefined);
      }
    };
    window.addEventListener("message", onPage);
    return () => window.removeEventListener("message", onPage);
  }, [isEmbedded, id]);

  // The embed script forwards the host page's pointer so the orb's eyes can
  // follow it beyond this small iframe. Replaying it as a pointermove lets the
  // orb treat it like a local pointer.
  useEffect(() => {
    if (!isEmbedded || launcherStyle !== "orb") return;
    const handlePointer = (event: MessageEvent) => {
      if (event.source !== window.parent || event.data?.type !== "askioPointer") return;
      const { x, y } = event.data;
      if (typeof x !== "number" || typeof y !== "number") return;
      window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y }));
    };
    window.addEventListener("message", handlePointer);
    return () => window.removeEventListener("message", handlePointer);
  }, [isEmbedded, launcherStyle]);

  // The greeting bubble shows once per visitor, a few seconds after the
  // launcher appears. Opening the chat also counts as having seen it.
  const greetingSeenKey = `askio-greeting-seen:${id}`;
  const markGreetingSeen = () => {
    try {
      localStorage.setItem(greetingSeenKey, "1");
    } catch {
      // Storage can be blocked in third-party iframes; then it may show again.
    }
  };

  const pageGreeting = useMemo(() => pageGreetingFor(pageGreetings, pageAddress), [pageGreetings, pageAddress]);
  const [greetingText, setGreetingText] = useState<string | null>(null);
  useEffect(() => {
    if (!isEmbedded || !pageGreeting || isOpen) return;
    const key = `askio-page-greeting-seen:${id}:${pageGreeting.match}`;
    try {
      if (localStorage.getItem(key) === "1") return;
    } catch {
      // Unreadable storage: show it, at worst once per page load.
    }
    const timer = window.setTimeout(() => {
      setGreetingText(pageGreeting.message);
      setShowGreeting(true);
      try {
        localStorage.setItem(key, "1");
      } catch {
        // Blocked storage; it may show again.
      }
    }, GREETING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isEmbedded, pageGreeting, isOpen, id]);

  useEffect(() => {
    // A page greeting takes this page's bubble instead.
    if (!isEmbedded || !greetingBubble || isOpen || pageGreeting) return;
    try {
      if (localStorage.getItem(greetingSeenKey) === "1") return;
    } catch {
      // Unreadable storage: show it, at worst once per page load.
    }
    const timer = window.setTimeout(() => {
      setShowGreeting(true);
      markGreetingSeen();
    }, GREETING_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbedded, greetingBubble, isOpen, greetingSeenKey, pageGreeting]);

  useEffect(() => {
    if (!isOpen) return;
    setShowGreeting(false);
    if (greetingBubble) markGreetingSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, greetingBubble]);

  // While the bubble shows, tell the embed script how much room it needs so
  // the iframe grows just around it. It shrinks again after the exit animation.
  // A quick glance at the bubble as it appears, then back to the pointer.
  useEffect(() => {
    if (!showGreeting) {
      setGreetingGlance(false);
      return;
    }
    setGreetingGlance(true);
    const timer = window.setTimeout(() => setGreetingGlance(false), GREETING_GLANCE_MS);
    return () => window.clearTimeout(timer);
  }, [showGreeting]);

  const handleGreetingHidden = () => {
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage({ type: "chatbotGreeting", visible: false }, "*");
    }
  };

  useEffect(() => {
    const el = launcherRef.current;
    if (!isEmbedded || window.parent === window) return;
    if (!showGreeting) {
      if (!greetingVisibleRef.current) return;
      greetingVisibleRef.current = false;
      // Shrink back once the exit animation has had time to finish.
      const timer = window.setTimeout(handleGreetingHidden, 300);
      return () => window.clearTimeout(timer);
    }
    if (!el) return;
    greetingVisibleRef.current = true;
    const report = () => {
      if (!greetingVisibleRef.current) return;
      window.parent.postMessage(
        // The pill sits beside the launcher, so only the width grows.
        { type: "chatbotGreeting", visible: true, width: Math.ceil(el.offsetWidth) + 4, height: 62 },
        "*"
      );
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbedded, showGreeting]);

  // Only the message list scrolls: scrollIntoView would also scroll the
  // page around the widget, like the editor around its preview.
  const scrollToBottom = () => {
    const list = messagesRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFeedbackClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from propagating
    setShowFeedback(true);
  };

  const handleFeedback = async (isPositive: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasFeedback) {
      toast.error(t("alreadyRated"));
      return;
    }

    if (!id || !anonymousToken) {
      console.error("Chatbot ID or anonymous token is missing");
      toast.error(t("feedbackUnavailable"));
      return;
    }

    try {
      await record("feedback", { isPositive, anonymousToken });

      writeStored(`feedback_${id}`, "true");
      setHasFeedback(true);
      react(isPositive ? "happy" : "unsure");
      toast.success(t("feedbackThanks"));
      setShowFeedback(false);
    } catch (error) {
      if (error instanceof Error && /already rated/i.test(error.message)) {
        writeStored(`feedback_${id}`, "true");
        setHasFeedback(true);
        setShowFeedback(false);
        return;
      }
      console.error("Error submitting feedback:", error);
      toast.error(t("feedbackFailed"));
    }
  };

  // With the orb launcher, the orb carries into the chat as the bot's face.
  const useOrb = launcherStyle === "orb";
  const orbMood = isTyping ? "thinking" : reaction ?? (inputFocused && input.trim() ? "listening" : "idle");
  const statusText =
    live?.status === "waiting"
      ? t("liveConnecting")
      : !useOrb
        ? t("readyToChat")
        : orbMood === "thinking"
          ? t("thinking")
          : orbMood === "listening"
            ? t("listening")
            : t("readyToChat");

  const isLeftPosition = position.endsWith("left");
  // The orb glances toward the bubble as it appears.
  const greetingLook = useMemo(
    () => (greetingGlance ? { x: isLeftPosition ? 0.55 : -0.55, y: 0.05 } : null),
    [greetingGlance, isLeftPosition]
  );

  const launcherButton = launcherStyle === "orb" ? (
    <motion.button
      onClick={toggleChatbot}
      aria-label={t("openChat")}
      className={`relative w-16 h-16 flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-425`}
      style={{ filter: "drop-shadow(0 6px 12px rgba(16, 23, 35, 0.22))" }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
    >
      <LiveOrb size={56} {...orbPropsFor(primaryColor)} personality={kioPersonality} finish={kioFinish} lookAt={greetingLook} />
    </motion.button>
  ) : (
    <motion.button
      onClick={toggleChatbot}
      aria-label={t("openChat")}
      className={`relative w-16 h-16 flex items-center justify-center text-white rounded-full shadow-lg transition-all duration-300 overflow-hidden`}
      style={{
        background: isGradient
          ? primaryColor
          : `linear-gradient(145deg, ${primaryColor}, ${primaryColor}cc)`,
        boxShadow: `0 4px 10px rgba(0, 0, 0, 0.1), inset 0 -4px 4px rgba(0, 0, 0, 0.1), inset 0 4px 4px rgba(255, 255, 255, 0.2)`,
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 6px 15px rgba(0, 0, 0, 0.15), inset 0 -6px 6px rgba(0, 0, 0, 0.15), inset 0 6px 6px rgba(255, 255, 255, 0.25)`,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <img src={bot1} alt="bot" className="w-8 h-8" />
      </div>
    </motion.button>
  );

  // A short pill beside the launcher, so it never reaches up over the page.
  const greetingBubbleEl = (
    <motion.div
      key="greeting"
      initial={{ opacity: 0, x: isLeftPosition ? -8 : 8, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: isLeftPosition ? -6 : 6, scale: 0.96 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ transformOrigin: isLeftPosition ? "left center" : "right center" }}
      className="flex items-center rounded-full border border-ink-120 bg-ink-25 shadow-[0_8px_24px_-12px_rgba(16,23,35,0.35)]"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowGreeting(false);
          setView(hasConversation ? "chat" : "home");
          setIsOpen(true);
        }}
        className="whitespace-nowrap rounded-full py-2 pl-3.5 pr-1 text-[13px] font-medium text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-425"
      >
        <span className="block max-w-[260px] truncate">{greetingText || t("greeting")}</span>
      </button>
      <button
        type="button"
        aria-label={t("dismissGreeting")}
        onClick={(e) => {
          e.stopPropagation();
          setShowGreeting(false);
        }}
        className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full text-ink-425 transition-colors hover:bg-ink-70 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-425"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </motion.div>
  );

  const chatbotButton = (
    <div
      ref={launcherRef}
      className={`fixed ${combinedPositionClass} z-50 flex items-center gap-2 ${isLeftPosition ? "flex-row-reverse" : "flex-row"}`}
    >
      <AnimatePresence onExitComplete={handleGreetingHidden}>
        {showGreeting ? greetingBubbleEl : null}
      </AnimatePresence>
      {launcherButton}
    </div>
  );

  // The bot's face: Kio with the orb launcher, the Askio bubble otherwise.
  const botFace = (size: number, onHeader = false) =>
    useOrb ? (
      <LiveOrb
        size={size}
        {...(onHeader ? headerOrbPropsFor(primaryColor) : orbPropsFor(primaryColor))}
        personality={kioPersonality}
        finish={kioFinish}
        mood={orbMood}
      />
    ) : (
      <div
        className={`flex items-center justify-center rounded-full ${onHeader ? "bg-white/[0.16]" : ""}`}
        style={{ width: size, height: size, ...(onHeader ? {} : headerStyle) }}
      >
        <img src={brandLogo} alt="" className="brightness-0 invert" style={{ width: size * 0.55, height: size * 0.55 }} />
      </div>
    );

  const homeCard =
    "rounded-2xl border border-ink-90 bg-[#FFFFFF] dark:border-ink-805 dark:bg-ink-865";
  const homeView = (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:thin]">
      <div className="relative flex-shrink-0 px-5 pb-14 pt-5 text-white" style={headerStyle}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {botFace(38, true)}
            <span className="truncate text-[13px] font-semibold text-white/90">{title || "Askio Assistant"}</span>
          </div>
          {isEmbedded && (
            <button
              onClick={toggleChatbot}
              aria-label={t("closeChat")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          )}
        </div>
        <p className="relative mt-7 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] text-white/55">{t("homeHello")}</p>
        <p className="relative text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] [text-wrap:balance]">{pageGreeting?.message || t("homeHeading")}</p>
      </div>

      <div className="relative z-10 -mt-9 flex flex-col gap-2.5 px-3.5 pb-3.5">
        <button
          type="button"
          onClick={startChat}
          className={`${homeCard} group flex items-center justify-between gap-3 px-4 py-3.5 text-left shadow-[0_6px_20px_-12px_rgba(16,23,35,0.25)] transition-colors hover:border-ink-165 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-425 dark:hover:border-ink-710`}
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-ink-900 dark:text-ink-70">{t("askQuestion")}</span>
            <span className="mt-0.5 block text-[12px] text-ink-545 dark:text-ink-325">{t("askQuestionHint")}</span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform group-hover:translate-x-0.5" style={buttonStyle}>
            <ArrowUp size={16} strokeWidth={2.5} className="rotate-90" />
          </span>
        </button>

        {canTalkLive && ownerOnline && (
          <div className={`${homeCard} flex items-center gap-2.5 px-4 py-3`}>
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[12px] leading-snug text-ink-715 dark:text-ink-230">{t("teamOnline")}</span>
          </div>
        )}

        {contactHref && channel && !(canTalkLive && ownerOnline) && (
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${homeCard} flex items-center gap-3 px-4 py-3 transition-colors hover:border-ink-165 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-425 dark:hover:border-ink-710`}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${CHANNELS[channel].color}26`, color: CHANNELS[channel].color }}
            >
              {channelIcon(channel, 18)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-ink-900 dark:text-ink-70">{t("messageUsOn", { app: CHANNELS[channel].name })}</span>
              <span className="mt-0.5 block text-[12px] text-ink-545 dark:text-ink-325">{t("channelCardHint")}</span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-ink-425" aria-hidden="true" />
          </a>
        )}

        {topQuestions.length > 0 && (
          <div className={`${homeCard} py-1.5`}>
            <p className="px-4 pb-1 pt-2 text-caption font-medium text-ink-425">{t("popularQuestions")}</p>
            <ul>
              {topQuestions.map((question, i) => (
                <li key={question} className={i > 0 ? "border-t border-ink-65 dark:border-ink-805" : ""}>
                  <button
                    type="button"
                    onClick={() => askSuggested(question)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] text-ink-900 transition-colors hover:bg-ink-35 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink-425 dark:text-ink-130 dark:hover:bg-ink-835"
                  >
                    <span className="min-w-0 [text-wrap:pretty]">{question}</span>
                    <ChevronRight size={15} className="shrink-0 text-ink-425" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // On a website the page draws the panel's shadow and corners and animates
  // it; in the editor's preview the widget does that itself.
  const onSite = isEmbedded && !customPositionClass;
  const chatbotContent = (
    <motion.div
      initial={onSite ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={onSite ? undefined : { opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`${
        isEmbedded ? `fixed ${combinedPositionClass} z-50` : "w-full h-full"
      } bg-ink-35 dark:bg-ink-895 flex flex-col overflow-hidden ${
        onSite
          ? space.fullscreen
            ? ""
            : "rounded-[22px]"
          : isEmbedded
            ? "w-[min(360px,calc(100%-20px))] h-[min(600px,calc(100%-20px))] rounded-[22px] ring-1 ring-black/[0.06] dark:ring-white/[0.06] shadow-[0_16px_48px_-12px_rgba(16,23,35,0.28)]"
            : "rounded-[22px] shadow-lg"
      }`}
      style={onSite ? { width: space.width, height: space.height } : undefined}
    >
      {view === "home" ? homeView : (<>
      {/* Chat header: back to the home screen, who's answering, and how. */}
      <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-ink-90 bg-[#FFFFFF] px-3 py-3 dark:border-ink-805 dark:bg-ink-865">
        <button
          type="button"
          onClick={() => setView("home")}
          aria-label={t("back")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-605 transition-colors hover:bg-ink-60 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-425 dark:text-ink-325 dark:hover:bg-ink-805 dark:hover:text-ink-70"
        >
          <ChevronLeft size={18} strokeWidth={2.25} />
        </button>
        <div className="relative shrink-0">
          {botFace(34)}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-ink-865" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[14px] font-semibold leading-tight tracking-[-0.01em] text-ink-900 dark:text-ink-70">{title || "Askio Assistant"}</h2>
          {/* Visitors should always know they aren't talking to a person (EU AI Act, art. 50). */}
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-caption">
            {live?.status === "active" ? (
              <span className="flex min-w-0 items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300" aria-live="polite">
                <UserRound size={11} strokeWidth={2.25} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{t("liveWith", { name: agentLabel(live.name) })}</span>
              </span>
            ) : (
              <>
                <span className="flex shrink-0 items-center gap-1 font-medium text-fg-muted">
                  {aiEnabled ? (
                    <AiIcon size={12} className="shrink-0" />
                  ) : (
                    <Bot size={12} strokeWidth={2.25} className="shrink-0" aria-hidden="true" />
                  )}
                  {aiEnabled ? t("aiAssistant") : t("automatedAssistant")}
                </span>
                <span className="shrink-0 text-ink-230 dark:text-ink-640">·</span>
                <span className="min-w-0 truncate text-ink-425" aria-live="polite">
                  {canTalkLive && ownerOnline && !live ? t("teamCanJoin") : statusText}
                </span>
              </>
            )}
          </div>
        </div>
        {isEmbedded && (
          <button
            onClick={toggleChatbot}
            aria-label={t("closeChat")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-605 transition-colors hover:bg-ink-60 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-425 dark:text-ink-325 dark:hover:bg-ink-805 dark:hover:text-ink-70"
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div ref={messagesRef} className="flex-grow overflow-y-auto px-3.5 py-4 space-y-3 [scrollbar-width:thin] [scrollbar-color:rgba(100,113,132,0.35)_transparent]">
        <AnimatePresence>
          {messages.map((message, index) =>
            message.sender === "notice" ? (
              <motion.p
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-caption text-ink-545 dark:text-ink-325"
              >
                {message.text}
              </motion.p>
            ) : (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`flex max-w-[84%] flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`inline-block px-3.5 py-2.5 text-[13.5px] leading-relaxed [overflow-wrap:anywhere] ${
                  message.sender === "user"
                    ? "text-white rounded-[18px] rounded-br-[6px]"
                    : message.sender === "agent"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-200 dark:ring-emerald-900/60 text-fg rounded-[18px] rounded-bl-[6px]"
                      : "bg-[#FFFFFF] dark:bg-ink-850 ring-1 ring-ink-90 dark:ring-ink-805 text-fg rounded-[18px] rounded-bl-[6px]"
                }`}
                style={message.sender === "user" ? userMessageStyle : {}}
              >
                {message.sender === "agent" && (
                  <span className="mb-0.5 flex items-center gap-1 text-caption font-semibold text-emerald-700 dark:text-emerald-300">
                    <UserRound size={11} aria-hidden="true" />
                    {agentLabel(message.name)}
                  </span>
                )}
                {message.text}

                {/* Fallback Live Chat Link */}
                {message.isFallback && index === lastFallbackIndex && canTalkLive && ownerOnline && !live && (
                  <div className="mt-2.5 flex justify-start">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void requestPerson();
                      }}
                      className="inline-flex items-center justify-center bg-ink-25 dark:bg-ink-790 hover:bg-ink-30 dark:hover:bg-ink-710 text-fg text-[12px] font-medium py-1.5 px-3 rounded-md shadow-sm border border-ink-120 dark:border-ink-710 transition-colors gap-1.5"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      {t("chatWithPersonNow")}
                    </button>
                  </div>
                )}
                {message.isFallback && index === lastFallbackIndex && contactHref && !(canTalkLive && ownerOnline && !live) && (
                  <div className="mt-2.5 flex justify-start">
                    <a
                      href={channel === "whatsapp" ? withWhatsAppText(contactHref, lastVisitorQuestion) : contactHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (channel && channel !== "whatsapp") copyQuestion();
                      }}
                      className="inline-flex items-center justify-center bg-ink-25 dark:bg-ink-790 hover:bg-ink-30 dark:hover:bg-ink-710 text-fg text-[12px] font-medium py-1.5 px-3 rounded-full shadow-sm border border-ink-120 dark:border-ink-710 transition-colors gap-1.5"
                    >
                      {channel ? (
                        <span style={{ color: CHANNELS[channel].color }}>{channelIcon(channel, 14)}</span>
                      ) : (
                        <MessageSquare size={14} className="text-emerald-500" />
                      )}
                      {channel ? t("continueOn", { app: CHANNELS[channel].name }) : t("chatWithHuman")}
                    </a>
                  </div>
                )}

                {/* Lead Capture Form */}
                {message.isLeadCapture && !hasSubmittedLead && (
                  <div className="mt-3">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLeadSubmit(e);
                      }} 
                      className="flex flex-col gap-2"
                    >
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder={t("emailPlaceholder")}
                        className="w-full px-3 py-2 rounded-md bg-ink-25 dark:bg-ink-850 border border-ink-120 dark:border-ink-710 text-[13px] text-fg placeholder-ink-545 focus:outline-none focus:border-emerald-500 transition-colors"
                        required
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-medium py-2 rounded-md transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("sendEmail")}
                      </button>
                    </form>
                    {contactHref && (
                      <div className="mt-2 text-center text-caption text-ink-545">
                        {t("preferToTalk")}{" "}
                        <a
                          href={contactHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-fg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("chatWithHuman")}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {message.sender === "bot" && message.action && (
                <a
                  href={message.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-425"
                  style={buttonStyle}
                >
                  <span className="truncate">{message.action.label}</span>
                  <ExternalLink size={12} className="shrink-0" aria-hidden="true" />
                </a>
              )}
              {/* Which FAQ the answer came from: proof it isn't made up. */}
              {message.sender === "bot" && message.source && showSources !== false && (
                <span className="mt-1.5 inline-flex max-w-full items-start gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-caption leading-snug text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <CircleCheck size={12} className="mt-px shrink-0" aria-hidden="true" />
                  <span className="min-w-0">{t("answeredFrom", { source: message.source })}</span>
                </span>
              )}
              </div>
            </motion.div>
            )
          )}

          {/* Suggestion Chips */}
          {showSuggestions &&
            messages.length > 0 &&
            messages[messages.length - 1]?.sender === "bot" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="pt-1"
              >
                <div className="flex flex-col items-end gap-1.5">
                  {suggestions.map((question, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleSuggestionClick(e, question)}
                      className="max-w-[88%] text-[12.5px] leading-snug [text-wrap:pretty] bg-[#FFFFFF] dark:bg-ink-850 hover:bg-ink-60 dark:hover:bg-ink-805 text-fg py-2 px-3.5 rounded-[18px] transition-colors duration-150 ring-1 ring-ink-120 hover:ring-ink-165 dark:ring-ink-780 dark:hover:ring-ink-710 text-left"
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            {useOrb ? (
              <div className="inline-flex items-center gap-2 py-1.5 pl-1.5 pr-3.5 rounded-[18px] rounded-bl-[6px] bg-[#FFFFFF] ring-1 ring-ink-90 dark:bg-ink-850 dark:ring-ink-805">
                <LiveOrb size={24} {...orbPropsFor(primaryColor)} finish={kioFinish} mood="thinking" interactive={false} />
                <span className="text-[12px] text-ink-545 dark:text-ink-325">{t("thinking")}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-3.5 py-3 rounded-[18px] rounded-bl-[6px] bg-[#FFFFFF] ring-1 ring-ink-90 dark:bg-ink-850 dark:ring-ink-805">
                <span className="h-1.5 w-1.5 bg-ink-325 dark:bg-ink-545 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                <span className="h-1.5 w-1.5 bg-ink-325 dark:bg-ink-545 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                <span className="h-1.5 w-1.5 bg-ink-325 dark:bg-ink-545 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
              </div>
            )}
          </motion.div>
        )}
        {agentTyping && (
          <div className="flex justify-start" aria-live="polite">
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-emerald-50 px-3.5 py-2 text-[12px] text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/60">
              <span className="flex gap-0.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 motion-reduce:animate-none" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
              {t("agentTyping", { name: agentLabel(agentTyping.name) })}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-ink-90 bg-[#FFFFFF] px-3 pb-3 pt-2.5 dark:border-ink-805 dark:bg-ink-865">
        {canTalkLive && ownerOnline && !live && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void requestPerson();
            }}
            className="mb-2 inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium text-ink-605 transition-colors hover:text-ink-900 dark:text-ink-325 dark:hover:text-ink-130"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {t("talkToPerson")}
          </button>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-1.5 rounded-full bg-ink-45 py-1.5 pl-4 pr-1.5 ring-1 ring-transparent transition-shadow focus-within:ring-ink-165 dark:bg-ink-835 dark:focus-within:ring-ink-710">
          <input
            ref={inputRef}
            type="text"
            value={input}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value) sendTyping();
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            className="min-w-0 flex-grow bg-transparent py-1 text-[13px] text-ink-900 placeholder-ink-425 focus:outline-none dark:text-ink-130"
            placeholder={placeholder}
          />
          <motion.button
            type="submit"
            disabled={!input.trim()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-35"
            style={buttonStyle}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("send")}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </motion.button>
        </form>
      </div>

      {/* Feedback prompt */}
      {!hasFeedback && !showFeedback && messages.length > 1 && (
        <div className="bg-[#FFFFFF] px-4 pb-1 text-center dark:bg-ink-865">
          <button
            onClick={handleFeedbackClick}
            className="text-caption text-ink-545 dark:text-ink-325 hover:text-fg transition-colors duration-200"
          >
            {t("wasHelpful")}
          </button>
        </div>
      )}
      {showFeedback && !hasFeedback && (
        <div className="flex items-center justify-center gap-4 bg-[#FFFFFF] px-4 pb-1.5 dark:bg-ink-865">
          <button
            onClick={(e) => handleFeedback(true, e)}
            className="flex items-center gap-1 text-[12px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200"
          >
            <ThumbsUp size={14} />
            <span>{t("helpful")}</span>
          </button>
          <div className="w-px h-4 bg-ink-120 dark:bg-ink-790"></div>
          <button
            onClick={(e) => handleFeedback(false, e)}
            className="flex items-center gap-1 text-[12px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
          >
            <ThumbsDown size={14} />
            <span>{t("notHelpful")}</span>
          </button>
        </div>
      )}

      </>)}

      {/* Footer */}
      <div className={`flex-shrink-0 pb-2.5 pt-1.5 text-center text-caption text-ink-425 ${view === "home" ? "bg-ink-35 dark:bg-ink-895" : "bg-[#FFFFFF] dark:bg-ink-865"}`}>
        {saveConversations && <p className="mb-0.5 px-4">{t("chatSaved")}</p>}
        {t("poweredBy")}{" "}
        <a
          href="https://getaskio.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-fg-muted hover:text-fg transition-colors"
        >
          Askio
        </a>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {isEmbedded ? (isOpen ? chatbotContent : chatbotButton) : chatbotContent}
    </AnimatePresence>
  );
};

export default Chatbot;
