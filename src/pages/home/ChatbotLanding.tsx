import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import LandingNav from "./LandingNav";
import HeroSection from "./HeroSection";
import DemoSection from "./DemoSection";
import FeaturesSection from "./FeaturesSection";
import LiveOrbSection from "./LiveOrbSection";
import PlansSection from "./PlansSection";
import HowItWorks from "./HowItWorks";
import TestimonialsSection from "./TestimonialsSection";
import FAQSection from "./FAQSection";
import CTASection from "./CTASection";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import MarqueeStrip from "./MarqueeStrip";

export default function ChatbotLanding() {
  useEffect(() => {
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot-container";
    document.body.appendChild(chatbotContainer);
    const script = document.createElement("script");
    script.src = `${window.location.origin}/chatbot-embed.js`;
    script.async = true;
    script.onload = () => {
      const initScript = document.createElement("script");
      initScript.text = `ChatbotEmbed.init("eh0qWjVhkPeBwzGxYLv6", "${window.location.origin}");`;
      document.body.appendChild(initScript);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(chatbotContainer);
      document.body.removeChild(script);
      const initScript = document.querySelector('script[text*="ChatbotEmbed.init"]');
      if (initScript) document.body.removeChild(initScript);
    };
  }, []);

  return (
    <div className="askio-home w-full min-h-screen bg-[#F3F7FC] dark:bg-[#141D2B] font-sans text-[#101723] overflow-x-hidden">
      <Helmet>
        <title>Askio · A chatbot for your website that answers from your FAQs</title>
        <meta
          name="description"
          content="Turn your FAQs into a chatbot that looks like your brand. Answer visitors instantly, capture leads and chat live. Free plan, no coding."
        />
      </Helmet>

      <div className="relative mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-0">
        <div className="hidden lg:block w-[1px] h-full absolute left-0 top-0 bg-[rgba(16,23,35,0.12)] dark:bg-[#2B3646]" />
        <div className="hidden lg:block w-[1px] h-full absolute right-0 top-0 bg-[rgba(16,23,35,0.12)] dark:bg-[#2B3646]" />

        <LandingNav />
        <HeroSection />
        <MarqueeStrip />
        <DemoSection />
        <FeaturesSection />
        <LiveOrbSection />
        <PlansSection />
        <HowItWorks />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
        <Footer />
      </div>

      <ScrollToTop />
    </div>
  );
}
