import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Book,
  Code,
  Palette,
  Cog,
  Layers,
  Upload,
} from "lucide-react";
import Card from "../components/Card";
import { Helmet } from "react-helmet-async";

const Documentation: React.FC<{ toggleSidebar: () => void }> = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  return (
    <div className="min-h-screen py-12 bg-gray-100 dark:bg-gray-900">
      <Helmet>
        <title>Documentation | Askio Chatbot</title>
        <meta
          name="description"
          content="Comprehensive guide for creating, customizing, and integrating Askio Chatbot into your website."
        />
      </Helmet>
      <main className="w-full lg:w-[80%] px-4 sm:px-6 lg:px-8 mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 dark:text-white">
          Askio Chatbot Documentation
        </h1>
        <p className="text-xl text-gray-700 mb-12 dark:text-gray-300">
          Welcome to the comprehensive guide for creating, customizing, and
          integrating Askio Chatbot into your website.
        </p>

        {sections.map((section) => (
          <Section
            key={section.title}
            title={section.title}
            content={section.content}
            icon={section.icon}
            isOpen={openSection === section.title}
            toggleSection={() => toggleSection(section.title)}
          />
        ))}

        <Card className="mt-12 bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 dark:text-blue-200">
            Best Practices
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              Regularly update your FAQs based on user interactions and
              feedback.
            </li>
            <li>
              Use clear, concise language in your chatbot responses to enhance
              user experience.
            </li>
            <li>
              Conduct thorough testing of your chatbot before embedding it on
              your live website.
            </li>
            <li>
              Continuously monitor chatbot performance and user satisfaction to
              drive improvements.
            </li>
            <li>
              Ensure your chatbot's tone and style align with your brand's voice
              and values.
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

const Section: React.FC<{
  title: string;
  content: string[];
  icon: React.ElementType;
  isOpen: boolean;
  toggleSection: () => void;
}> = ({ title, content, icon: Icon, isOpen, toggleSection }) => (
  <Card className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <button
      className="w-full text-left p-6 focus:outline-none"
      onClick={toggleSection}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Icon size={24} className="text-indigo-500 mr-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
      </div>
    </button>
    {isOpen && (
      <div className="px-6 pb-6">
        <ol className="list-decimal list-inside space-y-4">
          {content.map((step, index) => (
            <li key={index} className="text-gray-700 dark:text-gray-300">
              {step}
            </li>
          ))}
        </ol>
      </div>
    )}
  </Card>
);

const sections = [
  {
    title: "Getting Started",
    icon: Book,
    content: [
      "Sign in to your Askio Chatbot account and navigate to the Dashboard.",
      "Click the 'Create New Chatbot' button located at the top of the page.",
      "Provide a name for your chatbot and click 'Create'.",
      "You will be redirected to the chatbot configuration page to begin customization.",
    ],
  },
  {
    title: "Customizing Appearance",
    icon: Palette,
    content: [
      "In the chatbot configuration page, navigate to the 'Appearance' tab.",
      "Select primary and secondary colors for your chatbot using the color pickers or predefined color options.",
      "Choose the position where your chatbot will appear on your website (e.g., bottom-right, bottom-left).",
      "Utilize the real-time preview on the right side of the screen to visualize your changes.",
    ],
  },
  {
    title: "Configuring FAQs",
    icon: Layers,
    content: [
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
    title: "General Settings",
    icon: Cog,
    content: [
      "Access the 'General' tab in the chatbot configuration.",
      "Set the chatbot's title, which will be displayed in the chat header.",
      "Craft an initial message that users will see when they first open the chat.",
      "Customize the placeholder text for the user input field.",
      "Click 'Save' to apply your changes.",
    ],
  },
  {
    title: "Generating Embed Code",
    icon: Code,
    content: [
      "Once you've completed configuring your chatbot, go to the 'Embed' tab.",
      "You'll find a code snippet that needs to be added to your website.",
      "Use the 'Copy to Clipboard' button to copy the embed code.",
    ],
  },
  {
    title: "Website Integration",
    icon: Upload,
    content: [
      "Open your website's HTML file or template in your preferred code editor.",
      "Paste the copied embed code just before the closing </body> tag.",
      "Save the changes to your HTML file.",
      "If you're using a content management system (CMS), paste the code in the designated section for adding custom scripts.",
      "Test your website to ensure the chatbot appears and functions correctly.",
    ],
  },
];

export default Documentation;
