import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import LandingNav from "./LandingNav";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
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
    script.src = "https://askio.vercel.app/chatbot-embed.js";
    script.async = true;
    script.onload = () => {
      const initScript = document.createElement("script");
      initScript.text = `ChatbotEmbed.init("eh0qWjVhkPeBwzGxYLv6", "https://askio.vercel.app");`;
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
    <div className="w-full min-h-screen bg-[#F7F5F3] dark:bg-[#1C1917] font-sans text-[#37322F] overflow-x-hidden">
      <Helmet>
        <title>Askio - Your Chatbot Builder</title>
        <meta name="description" content="Create custom chatbots tailored to your brand. Effortlessly integrate them into your website." />
      </Helmet>

      <div className="relative mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-0">
        <div className="hidden lg:block w-[1px] h-full absolute left-0 top-0 bg-[rgba(55,50,47,0.12)] dark:bg-[#44403C]" />
        <div className="hidden lg:block w-[1px] h-full absolute right-0 top-0 bg-[rgba(55,50,47,0.12)] dark:bg-[#44403C]" />

        <LandingNav />
        <HeroSection />
        <MarqueeStrip />
        <FeaturesSection />
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
