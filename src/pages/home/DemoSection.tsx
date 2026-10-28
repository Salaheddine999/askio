import { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Globe, Loader2 } from "lucide-react";
import Badge from "./Badge";
import MainCta, { ArrowBubble } from "./MainCta";
import { primaryCta } from "./buttonStyles";
import { DEMO_KEY, type DemoResult } from "../../utils/demo";

// The widget only loads once there's something to show on it.
const DemoPreview = lazy(() => import("./DemoPreview"));


const STEPS = ["Reading your website…", "Writing answers from your pages…", "Putting Askio on your site…"];

export default function DemoSection() {
  const [sectionRef, inView] = useInView({ triggerOnce: true, rootMargin: "0px 0px 200px 0px" });
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  // The demo can't run right now (daily limit, AI busy): offer sign-up instead.
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState<DemoResult | null>(null);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const timer = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 5000);
    return () => window.clearInterval(timer);
  }, [loading]);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError("Enter your website's address, like yourstore.com.");
      return;
    }
    setError("");
    setBusy("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: address }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.busy || response.status === 429 || response.status >= 500) {
        setBusy(data.error || "The demo is busy right now.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "That didn't work. Try again in a moment.");
      setResult(data as DemoResult);
    } catch (err) {
      // Offline or the server unreachable reads as busy too.
      if (!(err instanceof Error) || err.name === "TypeError") setBusy("The demo is busy right now.");
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const keep = () => {
    if (!result) return;
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify({ ...result, savedAt: Date.now() }));
    } catch {
      // Without storage they start from scratch; nothing breaks.
    }
    navigate("/auth?mode=register");
  };

  return (
    <motion.section
      ref={sectionRef}
      id="demo"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35 }}
      className="border-t border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]"
    >
      <div className="px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
          <Badge text="Try it now" />
          <h2 className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-serif tracking-tight [text-wrap:balance] text-[#101723] dark:text-[#D7DFE5]">
            See Askio on your website
          </h2>
          <p className="mt-3 max-w-md text-body text-[#566273] dark:text-[#9BAABD]">
            Enter your address. Askio reads your pages, writes the answers, and shows you the chatbot on your own site. No sign-up.
          </p>

          <form onSubmit={run} className="mt-8 flex w-full max-w-[520px] flex-col gap-2.5 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Your website</span>
              <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87909D]" aria-hidden="true" />
              <input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (error) setError("");
                }}
                placeholder="yourstore.com"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                disabled={loading}
                className="h-[52px] w-full rounded-full border border-[#D8DFE9] bg-[#F9FCFF] pl-11 pr-4 text-body text-[#101723] placeholder:text-[#87909D] focus:border-[#9BAABD] focus:outline-none dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5]"
              />
            </label>
            <button type="submit" disabled={loading} className={`${primaryCta} disabled:opacity-80`}>
              {loading ? "Building…" : "Show me"}
              {loading ? (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.14] dark:bg-[#101723]/[0.08]">
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                </span>
              ) : (
                <ArrowBubble className="bg-white/[0.14] dark:bg-[#101723]/[0.08]" />
              )}
            </button>
          </form>
          <p className="mt-3 min-h-[20px] text-caption" aria-live="polite">
            {error ? (
              <span className="text-red-600 dark:text-red-400">{error}</span>
            ) : loading ? (
              <span className="text-[#647184] dark:text-[#9BAABD]">{STEPS[step]} This takes about 20 seconds.</span>
            ) : null}
          </p>
        </div>

        {busy && !result && (
          <div className="mx-auto mt-8 flex max-w-[520px] flex-col items-center gap-4 rounded-2xl border border-[#D8DFE9] bg-[#F9FCFF] px-6 py-7 text-center dark:border-[#2B3646] dark:bg-[#1A2533]">
            <div>
              <p className="text-body font-semibold text-[#101723] dark:text-[#E7EDF6]">{busy}</p>
              <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">
                Create your chatbot free instead. It takes a few minutes, with no coding.
              </p>
            </div>
            <MainCta>Create your chatbot</MainCta>
          </div>
        )}

        {result && (
          <div className="mx-auto mt-10 max-w-[900px]">
            <Suspense fallback={<div className="h-[690px] animate-pulse rounded-2xl bg-[#E7EDF6] dark:bg-[#1A2533]" />}>
              <DemoPreview key={result.host} result={result} />
            </Suspense>
            <div className="mt-6 flex flex-col items-center gap-2 text-center">
              <p className="text-body-sm text-[#566273] dark:text-[#9BAABD]">
                {result.faqs.length} answers written from {result.host}. Ask the chatbot one of them, then make it yours.
              </p>
              <button type="button" onClick={keep} className={primaryCta}>
                Create this chatbot, free
                <ArrowBubble className="bg-white/[0.14] dark:bg-[#101723]/[0.08]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
