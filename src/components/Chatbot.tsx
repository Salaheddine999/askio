import brandLogo from "../assets/logo.svg";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Send, X, ThumbsUp, ThumbsDown, MessageSquare, Sparkles, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import { db } from "../utils/db";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import bot1 from "../assets/chat1.svg";
import { apiRequest } from "../utils/api";
import { LiveOrb } from "./LiveOrb";
import { headerOrbPropsFor, orbPropsFor, type LauncherStyle } from "../utils/orbColors";
import { isOwnerBrowsing } from "../utils/ownerSession";
import { normalizeContactLink } from "../utils/links";
import { isLang, makeT, type Lang } from "../i18n";
import { widgetMessages } from "../i18n/widget";

type Message = {
  text: string;
  sender: "user" | "bot";
  isFallback?: boolean;
  isLeadCapture?: boolean;
};

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
  faqData: Array<{ question: string; answer: string }>;
  isEmbedded?: boolean;
  isPreview?: boolean;
  isActive?: boolean;
  customPositionClass?: string;
  gradientStart?: string;
  liveChatLink?: string;
  enableLeadCapture?: boolean;
  aiTone?: string;
  aiEnabled?: boolean;
  launcherStyle?: LauncherStyle;
  greetingBubble?: boolean;
  /** Set by an admin when the owner's account is suspended; the widget stays hidden. */
  suspended?: boolean;
  /** The owner saves conversations (Pro): messages are sent to be stored, and visitors are told. */
  saveConversations?: boolean;
  /** The language of the widget's own text, for visitors. English by default. */
  language?: Lang;
  /** The chatbot owner's uid, from the saved config. */
  user_id?: string;
}

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
  aiEnabled,
  launcherStyle = "classic",
  greetingBubble = false,
  isPreview = false,
  language,
  saveConversations = false,
}) => {
  const t = useMemo(() => makeT(widgetMessages, isLang(language) ? language : "en"), [language]);
  const contactHref = normalizeContactLink(liveChatLink);

  // Leads, analytics and ratings go through the server, which checks and
  // rate-limits them. The owner isn't a visitor: their preview, and their own
  // chats with the bot in a browser where they're signed in, record nothing.
  const record = async (kind: "lead" | "event" | "unanswered" | "feedback" | "message", fields: Record<string, unknown>) => {
    if (!id || isPreview || isOwnerBrowsing(user_id)) return;
    await apiRequest("/api/ai/record", { body: { kind, chatbotId: id, ...fields } });
  };
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
  const sessionId = useMemo(() => {
    const key = `askio-chat-session:${id}`;
    try {
      const existing = sessionStorage.getItem(key);
      if (existing) return existing;
      const created = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("");
      sessionStorage.setItem(key, created);
      return created;
    } catch {
      return Math.random().toString(36).slice(2, 14).padEnd(12, "0");
    }
  }, [id]);

  // Send each new message once, in order, when the owner saves conversations.
  // The welcome message (index 0) isn't saved; it's the same for everyone.
  const savedCount = useRef(1);
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
      if (!message.text) continue;
      saveQueue.current = saveQueue.current
        .then(() =>
          record("message", {
            role: message.sender === "user" ? "visitor" : "bot",
            text: message.text,
            sessionId,
            anonymousToken,
          })
        )
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(!isEmbedded);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingGlance, setGreetingGlance] = useState(false);
  const launcherRef = useRef<HTMLDivElement>(null);
  // Guards late size reports once the bubble starts hiding.
  const greetingVisibleRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    // Initialize suggestions with all FAQ questions
    setSuggestions(faqData.map((faq) => faq.question));
  }, [faqData]);

  useEffect(() => {
    const fuseInstance = new Fuse(faqData, {
      keys: ["question"],
      threshold: 0.4, // Adjusts the sensitivity of the matching
    });
    setFuse(fuseInstance);
  }, [faqData]);

  useEffect(() => {
    // Generate or retrieve the anonymous token
    const storedToken = localStorage.getItem("anonymousToken");
    if (storedToken) {
      setAnonymousToken(storedToken);
    } else {
      const newToken = generateAnonymousToken();
      localStorage.setItem("anonymousToken", newToken);
      setAnonymousToken(newToken);
    }
  }, []);

  const generateAnonymousToken = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  useEffect(() => {
    const checkPreviousFeedback = async () => {
      if (!anonymousToken || !id) return;

      const feedbackKey = `feedback_${id}`;
      const storedFeedback = localStorage.getItem(feedbackKey);
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
          localStorage.setItem(feedbackKey, "true");
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (input.trim() === "") return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setShowSuggestions(false);
    setInput("");

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
        const { reply: aiResponseText } = await apiRequest<{ reply: string | null; fallback?: string }>(
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
          const aiCouldNotAnswer = cantAnswerPhrases.some(phrase => lowerResponse.includes(phrase));

          setMessages((prev) => [
            ...prev,
            { text: aiResponseText, sender: "bot", isFallback: aiCouldNotAnswer && !enableLeadCapture },
          ]);

          // If the AI couldn't answer, show lead capture or live chat fallback
          if (aiCouldNotAnswer) {
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
        console.error("Error generating AI response:", error);
        // Fallback to standard flow on error
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
              text: t("errorRelated"),
              sender: "bot",
              isFallback: true,
            },
          ]);
          setTimeout(() => {
            setShowSuggestions(true);
            updateSuggestions(input);
          }, 100);
        }
      } finally {
        if (aiHandled) setIsTyping(false);
      }
      if (aiHandled) return; // Exit early since we used the AI
    }

    setTimeout(async () => {
      if (matchedFaq) {
        setMessages((prev) => [
          ...prev,
          { text: matchedFaq.answer, sender: "bot" },
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
    // Filter suggestions based on user input
    const filteredSuggestions = faqData
      .filter((faq) =>
        faq.question.toLowerCase().includes(userInput.toLowerCase())
      )
      .map((faq) => faq.question);

    setSuggestions(
      filteredSuggestions.length > 0
        ? filteredSuggestions
        : faqData.map((faq) => faq.question)
    );
  };

  const handleSuggestionClick = (event: React.MouseEvent, question: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    const matchedFaq = faqData.find((faq) => faq.question === question);
    if (matchedFaq) {
      setIsTyping(true);
      setTimeout(async () => {
        setMessages((prev) => [
          ...prev,
          { text: matchedFaq.answer, sender: "bot" },
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

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

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
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "toggleChatbot") {
        setIsOpen(event.data.isOpen);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  useEffect(() => {
    if (!isEmbedded || !greetingBubble || isOpen) return;
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
  }, [isEmbedded, greetingBubble, isOpen, greetingSeenKey]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

      localStorage.setItem(`feedback_${id}`, "true");
      setHasFeedback(true);
      react(isPositive ? "happy" : "unsure");
      toast.success(t("feedbackThanks"));
      setShowFeedback(false);
    } catch (error) {
      if (error instanceof Error && /already rated/i.test(error.message)) {
        localStorage.setItem(`feedback_${id}`, "true");
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
  const statusText = !useOrb ? t("readyToChat") : orbMood === "thinking" ? t("thinking") : orbMood === "listening" ? t("listening") : t("readyToChat");

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
      className={`relative w-16 h-16 flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87909D]`}
      style={{ filter: "drop-shadow(0 6px 12px rgba(16, 23, 35, 0.22))" }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
    >
      <LiveOrb size={56} {...orbPropsFor(primaryColor)} lookAt={greetingLook} />
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
      className="flex items-center rounded-full border border-[#D8DFE9] bg-[#F9FCFF] shadow-[0_8px_24px_-12px_rgba(16,23,35,0.35)]"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowGreeting(false);
          setIsOpen(true);
        }}
        className="whitespace-nowrap rounded-full py-2 pl-3.5 pr-1 text-[13px] font-medium text-[#101723] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87909D]"
      >
        {t("greeting")}
      </button>
      <button
        type="button"
        aria-label={t("dismissGreeting")}
        onClick={(e) => {
          e.stopPropagation();
          setShowGreeting(false);
        }}
        className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[#87909D] transition-colors hover:bg-[#E7EDF6] hover:text-[#101723] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87909D]"
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

  const chatbotContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`${
        isEmbedded ? `fixed ${combinedPositionClass} z-50` : "w-full h-full"
      } bg-[#F9FCFF] dark:bg-[#141D2B] flex flex-col rounded-xl overflow-hidden ${
        isEmbedded ? "w-[350px] h-[520px] shadow-2xl shadow-black/10 dark:shadow-black/30" : "shadow-lg"
      }`}
    >
      {/* Header */}
      <div
        className="text-white px-5 py-5 flex items-center justify-between gap-3 relative overflow-hidden flex-shrink-0"
        style={headerStyle}
      >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-black/10" />
        
        <div className="flex min-w-0 flex-1 items-center gap-3.5 relative z-10">
          <div className="relative shrink-0">
            {useOrb ? (
              <LiveOrb size={40} {...headerOrbPropsFor(primaryColor)} mood={orbMood} />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#F9FCFF]/20 backdrop-blur-sm flex items-center justify-center shadow-sm shadow-black/10">
                <img src={brandLogo} alt="Askio" className="w-6 h-6 brightness-0 invert" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm">
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-bold text-base leading-tight tracking-[-0.01em]">{title || "Askio Assistant"}</h2>
            {/* One line: the label stays whole, the status shortens if space runs out. */}
            <div className="flex min-w-0 items-center gap-1.5 mt-0.5 whitespace-nowrap">
              {/* Visitors should always know they aren't talking to a person (EU AI Act, art. 50).
                  The green dot on the avatar already shows the chat is online. */}
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-white/75">
                {aiEnabled ? (
                  <Sparkles size={11} strokeWidth={2.25} className="shrink-0" aria-hidden="true" />
                ) : (
                  <Bot size={12} strokeWidth={2.25} className="shrink-0" aria-hidden="true" />
                )}
                {aiEnabled ? t("aiAssistant") : t("automatedAssistant")}
              </span>
              <span className="shrink-0 text-white/30">·</span>
              <span className="min-w-0 truncate text-[11px] text-white/50" aria-live="polite">{statusText}</span>
            </div>
          </div>
        </div>

        {isEmbedded && (
          <button
            onClick={toggleChatbot}
            aria-label={t("closeChat")}
            className="relative z-10 w-8 h-8 rounded-xl bg-[#F9FCFF]/10 hover:bg-[#F9FCFF]/20 border border-white/10 flex items-center justify-center transition-all duration-200 hover:scale-105"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3 [scrollbar-width:thin] [scrollbar-color:rgba(100,113,132,0.35)_transparent]">
        <AnimatePresence>
          {messages.map((message, index) => (
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
              <div
                className={`inline-block px-3.5 py-2.5 max-w-[80%] text-[13px] leading-relaxed ${
                  message.sender === "user"
                    ? "text-white rounded-2xl rounded-br-md"
                    : "bg-[#E7EDF6] dark:bg-[#1A2533] text-[#101723] dark:text-[#D7DFE5] rounded-2xl rounded-bl-md"
                }`}
                style={message.sender === "user" ? userMessageStyle : {}}
              >
                {message.text}
                
                {/* Fallback Live Chat Link */}
                {message.isFallback && index === lastFallbackIndex && contactHref && (
                  <div className="mt-2.5 flex justify-start">
                    <a
                      href={contactHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-[#F9FCFF] dark:bg-[#273444] hover:bg-[#F3F7FC] dark:hover:bg-[#39485B] text-[#101723] dark:text-[#D7DFE5] text-[12px] font-medium py-1.5 px-3 rounded-md shadow-sm border border-[#D8DFE9] dark:border-[#39485B] transition-colors gap-1.5"
                    >
                      <MessageSquare size={14} className="text-emerald-500" />
                      {t("chatWithHuman")}
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
                        className="w-full px-3 py-2 rounded-md bg-[#F9FCFF] dark:bg-[#1A2533] border border-[#D8DFE9] dark:border-[#39485B] text-[13px] text-[#101723] dark:text-[#D7DFE5] placeholder-[#647184] focus:outline-none focus:border-emerald-500 transition-colors"
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
                      <div className="mt-2 text-center text-[11px] text-[#647184]">
                        {t("preferToTalk")}{" "}
                        <a
                          href={contactHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-[#101723] dark:hover:text-[#D7DFE5]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("chatWithHuman")}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

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
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((question, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleSuggestionClick(e, question)}
                      className="max-w-full text-[12px] leading-snug [text-wrap:pretty] bg-[#F9FCFF] dark:bg-[#1A2533] hover:bg-[#E7EDF6] dark:hover:bg-[#273444] text-[#101723] dark:text-[#D7DFE5] py-2 px-3.5 rounded-2xl transition-colors duration-150 border border-[#D8DFE9] hover:border-[#C9D3E0] dark:border-[#2B3646] dark:hover:border-[#39485B] text-left"
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
              <div className="inline-flex items-center gap-2 py-1.5 pl-1.5 pr-3.5 rounded-2xl rounded-bl-md bg-[#E7EDF6] dark:bg-[#1A2533]">
                <LiveOrb size={24} {...orbPropsFor(primaryColor)} mood="thinking" interactive={false} />
                <span className="text-[12px] text-[#647184] dark:text-[#9BAABD]">Thinking…</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-3.5 py-3 rounded-2xl rounded-bl-md bg-[#E7EDF6] dark:bg-[#1A2533]">
                <span className="h-1.5 w-1.5 bg-[#9BAABD] dark:bg-[#647184] rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                <span className="h-1.5 w-1.5 bg-[#9BAABD] dark:bg-[#647184] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                <span className="h-1.5 w-1.5 bg-[#9BAABD] dark:bg-[#647184] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
              </div>
            )}
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-[#D8DFE9]/60 dark:border-[#2B3646]/60 bg-[#F3F7FC] dark:bg-[#141D2B]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            className="flex-grow px-3.5 py-2 rounded-full bg-[#F9FCFF] dark:bg-[#1A2533] border border-[#D8DFE9] dark:border-[#2B3646] text-[13px] text-[#101723] dark:text-[#D7DFE5] placeholder-[#647184] dark:placeholder-[#87909D] focus:outline-none focus:border-[#101723]/30 dark:focus:border-[#9BAABD]/30 transition-colors"
            placeholder={placeholder}
          />
          <motion.button
            type="submit"
            className="w-9 h-9 rounded-full text-white flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-90"
            style={buttonStyle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("send")}
          >
            <Send size={15} className="-translate-x-[1px]" />
          </motion.button>
        </form>
      </div>

      {/* Feedback prompt */}
      {!hasFeedback && !showFeedback && messages.length > 1 && (
        <div className="px-4 py-2 border-t border-[#D8DFE9]/60 dark:border-[#2B3646]/60 text-center">
          <button
            onClick={handleFeedbackClick}
            className="text-[11px] text-[#647184] dark:text-[#9BAABD] hover:text-[#101723] dark:hover:text-[#D7DFE5] transition-colors duration-200"
          >
            {t("wasHelpful")}
          </button>
        </div>
      )}
      {showFeedback && !hasFeedback && (
        <div className="px-4 py-2.5 border-t border-[#D8DFE9]/60 dark:border-[#2B3646]/60 flex justify-center items-center gap-4">
          <button
            onClick={(e) => handleFeedback(true, e)}
            className="flex items-center gap-1 text-[12px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200"
          >
            <ThumbsUp size={14} />
            <span>{t("helpful")}</span>
          </button>
          <div className="w-px h-4 bg-[#D8DFE9] dark:bg-[#273444]"></div>
          <button
            onClick={(e) => handleFeedback(false, e)}
            className="flex items-center gap-1 text-[12px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
          >
            <ThumbsDown size={14} />
            <span>{t("notHelpful")}</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="py-2 border-t border-[#D8DFE9]/60 dark:border-[#2B3646]/60 text-center text-[10px] text-[#647184] dark:text-[#9BAABD] bg-[#F3F7FC] dark:bg-[#141D2B] rounded-b-xl">
        {saveConversations && <p className="mb-0.5 px-4">{t("chatSaved")}</p>}
        {t("poweredBy")}{" "}
        <a
          href="https://getaskio.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#566273] dark:text-[#9BAABD] hover:text-[#101723] dark:hover:text-[#D7DFE5] transition-colors"
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
