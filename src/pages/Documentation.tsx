import React, { useRef } from "react";
import {
  Book,
  Code,
  Palette,
  Cog,
  Layers,
  Upload,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

// --- Data ---

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  steps: string[];
}

const sections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Book,
    steps: [
      "Sign in to your Askio Chatbot account and navigate to the Dashboard.",
      "Click the 'Create New Chatbot' button located at the top of the page.",
      "Provide a name for your chatbot and click 'Create'.",
      "You will be redirected to the chatbot configuration page to begin customization.",
    ],
  },
  {
    id: "customizing-appearance",
    title: "Customizing Appearance",
    icon: Palette,
    steps: [
      "In the chatbot configuration page, navigate to the 'Appearance' tab.",
      "Select primary and secondary colors for your chatbot using the color pickers or predefined color options.",
      "Choose the position where your chatbot will appear on your website (e.g., bottom-right, bottom-left).",
      "Utilize the real-time preview on the right side of the screen to visualize your changes.",
    ],
  },
  {
    id: "configuring-faqs",
    title: "Configuring FAQs",
    icon: Layers,
    steps: [
      "Go to the 'FAQ' tab in the chatbot configuration.",
      "Click 'Add FAQ' to create a new question-answer pair.",
      "Input the question in the 'Question' field and the corresponding answer in the 'Answer' field.",
      "Click 'Add FAQ' to save the new FAQ entry.",
      "Repeat this process for all the FAQs you wish to include.",
      "To modify an existing FAQ, click the edit icon next to the FAQ, make your changes, and click 'Update FAQ'.",
      "To remove an FAQ, click the delete icon next to the FAQ and confirm the deletion.",
    ],
  },
  {
    id: "general-settings",
    title: "General Settings",
    icon: Cog,
    steps: [
      "Access the 'General' tab in the chatbot configuration.",
      "Set the chatbot's title, which will be displayed in the chat header.",
      "Craft an initial message that users will see when they first open the chat.",
      "Customize the placeholder text for the user input field.",
      "Click 'Save' to apply your changes.",
    ],
  },
  {
    id: "generating-embed-code",
    title: "Generating Embed Code",
    icon: Code,
    steps: [
      "Once you've completed configuring your chatbot, go to the 'Embed' tab.",
      "You'll find a code snippet that needs to be added to your website.",
      "Use the 'Copy to Clipboard' button to copy the embed code.",
    ],
  },
  {
    id: "website-integration",
    title: "Website Integration",
    icon: Upload,
    steps: [
      "Open your website's HTML file or template in your preferred code editor.",
      "Paste the copied embed code just before the closing </body> tag.",
      "Save the changes to your HTML file.",
      "If you're using a content management system (CMS), paste the code in the designated section for adding custom scripts.",
      "Test your website to ensure the chatbot appears and functions correctly.",
    ],
  },
];

const bestPractices = [
  "Regularly update your FAQs based on user interactions and feedback.",
  "Use clear, concise language in your chatbot responses to enhance user experience.",
  "Conduct thorough testing of your chatbot before embedding it on your live website.",
  "Continuously monitor chatbot performance and user satisfaction to drive improvements.",
  "Ensure your chatbot's tone and style align with your brand's voice and values.",
];

// --- Component ---

const Documentation: React.FC<{ toggleSidebar: () => void }> = () => {
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3] dark:bg-[#1C1917] font-sans text-[#37322F]">
      <Helmet>
        <title>Documentation | Askio Chatbot</title>
        <meta
          name="description"
          content="Comprehensive guide for creating, customizing, and integrating Askio Chatbot into your website."
        />
      </Helmet>

      <main className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8 lg:py-12 max-w-[1400px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold font-sans text-[#37322F] dark:text-[#F5F5F4] tracking-tight mb-3">
            Documentation
          </h1>
          <p className="text-base lg:text-lg text-[#605A57] dark:text-[#A8A29E] max-w-3xl leading-relaxed">
            Everything you need to create, customize, and embed your Askio
            chatbot. Follow the steps below to get up and running.
          </p>
        </div>

        {/* Quick Jump Navigation */}
        <div className="mb-10 lg:mb-12 p-4 rounded-xl bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A8A29E] dark:text-[#78716C] mb-3">
            Jump to
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] hover:bg-[#F7F5F3] dark:hover:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C] transition-colors"
              >
                <section.icon size={14} className="opacity-60" />
                {section.title}
              </button>
            ))}
            <button
              onClick={() => scrollTo("best-practices")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] hover:bg-[#F7F5F3] dark:hover:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C] transition-colors"
            >
              <Lightbulb size={14} className="opacity-60" />
              Best Practices
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10 lg:space-y-14">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              className="scroll-mt-8"
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#37322F]/[0.05] dark:bg-white/[0.06] border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center shrink-0">
                  <section.icon
                    size={20}
                    className="text-[#37322F] dark:text-[#F5F5F4]"
                  />
                </div>
                <h2 className="text-xl lg:text-2xl font-semibold text-[#37322F] dark:text-[#F5F5F4] font-sans tracking-tight">
                  {section.title}
                </h2>
              </div>

              {/* Steps */}
              <div className="space-y-4 lg:space-y-5 max-w-3xl">
                {section.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                      {index + 1}
                    </span>
                    <p className="text-[15px] text-[#605A57] dark:text-[#D6D3D1] leading-relaxed pt-0.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              {/* Embed Code Block */}
              {section.id === "generating-embed-code" && (
                <div className="mt-6 rounded-xl bg-[#1C1917] dark:bg-[#0C0A09] border border-[#44403C] overflow-hidden max-w-3xl">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#44403C]">
                    <span className="text-xs font-medium text-[#A8A29E]">
                      HTML
                    </span>
                    <span className="text-[10px] text-[#78716C] uppercase tracking-wider">
                      Example
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-sm text-emerald-400 font-mono leading-relaxed">
{`<script
  src="https://askio.vercel.app/embed/YOUR_CHATBOT_ID"
  defer>
</script>`}
                    </code>
                  </pre>
                </div>
              )}

              {/* Divider */}
              <div className="mt-8 lg:mt-12 border-t border-[#E0DEDB] dark:border-[#44403C]/60" />
            </section>
          ))}

          {/* Best Practices */}
          <section
            id="best-practices"
            ref={(el) => { sectionRefs.current["best-practices"] = el; }}
            className="scroll-mt-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                <Lightbulb
                  size={20}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              <h2 className="text-xl lg:text-2xl font-semibold text-[#37322F] dark:text-[#F5F5F4] font-sans tracking-tight">
                Best Practices
              </h2>
            </div>

            <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-5 lg:p-6 max-w-3xl">
              <ul className="space-y-3.5">
                {bestPractices.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-[15px] text-[#605A57] dark:text-[#D6D3D1] leading-relaxed"
                  >
                    <ChevronRight
                      size={16}
                      className="text-amber-500 dark:text-amber-400 shrink-0 mt-1"
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Footer spacer */}
        <div className="h-16" />
      </main>
    </div>
  );
};

export default Documentation;
