import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

const Documentation: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  return (
    <div className="min-h-screen py-12 bg-gray-100 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-black mb-8 dark:text-white">
          Askio Chatbot Documentation
        </h1>
        <p className="text-xl text-gray-700 mb-12 dark:text-gray-300">
          Learn how to create, customize, and embed your chatbot on your website
          using Askio Chatbot.
        </p>

        {sections.map((section) => (
          <Section
            key={section.title}
            title={section.title}
            content={section.content}
            isOpen={openSection === section.title}
            toggleSection={() => toggleSection(section.title)}
          />
        ))}

        <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
          <h3 className="text-lg font-semibold text-black mb-2 dark:text-white">
            Pro Tips
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              Regularly update your FAQs based on user interactions and
              feedback.
            </li>
            <li>Use clear and concise language in your chatbot responses.</li>
            <li>
              Test your chatbot thoroughly before embedding it on your live
              website.
            </li>
            <li>
              Monitor chatbot performance and user satisfaction to make
              improvements.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

const Section: React.FC<{
  title: string;
  content: string[];
  isOpen: boolean;
  toggleSection: () => void;
}> = ({ title, content, isOpen, toggleSection }) => (
  <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <button
      className="w-full text-left p-6 focus:outline-none"
      onClick={toggleSection}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          {title}
        </h2>
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
  </div>
);

const sections = [
  {
    title: "1. Creating Your First Chatbot",
    content: [
      "Log in to your Askio Chatbot account and navigate to the Dashboard.",
      "Click the 'Create New Chatbot' button at the top of the page.",
      "Enter a name for your chatbot and click 'Create'.",
      "You'll be redirected to the chatbot configuration page.",
    ],
  },
  {
    title: "2. Customizing Appearance",
    content: [
      "In the chatbot configuration page, go to the 'Appearance' tab.",
      "Choose primary and secondary colors for your chatbot using the color pickers or predefined color options.",
      "Select the position where your chatbot will appear on your website (e.g., bottom-right, bottom-left).",
      "Preview your changes in real-time using the chatbot preview on the right side of the screen.",
    ],
  },
  {
    title: "3. Setting Up FAQs",
    content: [
      "Navigate to the 'FAQ' tab in the chatbot configuration.",
      "Click 'Add FAQ' to create a new question-answer pair.",
      "Enter the question in the 'Question' field and the corresponding answer in the 'Answer' field.",
      "Click 'Add FAQ' to save the new FAQ.",
      "Repeat this process for all the FAQs you want to add.",
      "To edit an existing FAQ, click the edit icon next to the FAQ, make your changes, and click 'Update FAQ'.",
      "To delete an FAQ, click the delete icon next to the FAQ and confirm the deletion.",
    ],
  },
  {
    title: "4. Configuring General Settings",
    content: [
      "Go to the 'General' tab in the chatbot configuration.",
      "Set the chatbot's title, which will appear in the chat header.",
      "Enter an initial message that users will see when they first open the chat.",
      "Customize the placeholder text for the user input field.",
      "Click 'Save' to apply your changes.",
    ],
  },
  {
    title: "5. Getting the Embed Code",
    content: [
      "Once you've configured your chatbot, go to the 'Embed' tab.",
      "You'll see a code snippet that you need to add to your website.",
      "Click the 'Copy to Clipboard' button to copy the embed code.",
    ],
  },
  {
    title: "6. Embedding on Your Website",
    content: [
      "Open your website's HTML file or template in your preferred editor.",
      "Paste the copied embed code just before the closing </body> tag.",
      "Save the changes to your HTML file.",
      "If you're using a content management system (CMS), paste the code in the appropriate section for adding custom scripts.",
      "Test your website to ensure the chatbot appears and functions correctly.",
    ],
  },
];

export default Documentation;
