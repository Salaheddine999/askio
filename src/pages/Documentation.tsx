import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Code,
  Settings,
  MessageSquare,
  PlusCircle,
  Edit2,
  Trash2,
} from "lucide-react";

const Documentation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">ChatbotManager</h1>
          <Link
            to="/dashboard"
            className="text-indigo-500 hover:text-indigo-600 transition-colors duration-200 flex items-center"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Documentation</h2>

        <div className="space-y-8">
          <Section
            icon={<PlusCircle size={24} />}
            title="Creating a Chatbot"
            content={
              <>
                <p>To create a new chatbot:</p>
                <ol className="list-decimal list-inside ml-4 mt-2">
                  <li>Click on "Create New Chatbot" in the dashboard.</li>
                  <li>Fill in the required information (name, title, etc.).</li>
                  <li>Customize the appearance and behavior as needed.</li>
                  <li>Click "Save" to create your chatbot.</li>
                </ol>
              </>
            }
          />

          <Section
            icon={<Code size={24} />}
            title="Embedding Your Chatbot"
            content={
              <>
                <p>To embed your chatbot on your website:</p>
                <ol className="list-decimal list-inside ml-4 mt-2">
                  <li>Go to the dashboard and find your chatbot.</li>
                  <li>Click on "Edit" for the chatbot you want to embed.</li>
                  <li>Navigate to the "Embed" tab.</li>
                  <li>Copy the provided code snippet.</li>
                  <li>
                    Paste the code into your website's HTML where you want the
                    chatbot to appear.
                  </li>
                </ol>
              </>
            }
          />

          <Section
            icon={<Settings size={24} />}
            title="Customizing Your Chatbot"
            content={
              <>
                <p>You can customize various aspects of your chatbot:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Appearance: Change colors, position, and size.</li>
                  <li>Behavior: Set initial messages and response patterns.</li>
                  <li>FAQ: Add frequently asked questions and answers.</li>
                </ul>
                <p className="mt-2">
                  Access these options by editing your chatbot in the dashboard.
                </p>
              </>
            }
          />

          <Section
            icon={<MessageSquare size={24} />}
            title="Managing Conversations"
            content={
              <>
                <p>To manage your chatbot's conversations:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Set up FAQ responses for common queries.</li>
                  <li>Monitor chatbot performance in the dashboard.</li>
                  <li>Analyze user interactions to improve responses.</li>
                </ul>
              </>
            }
          />

          <Section
            icon={<Edit2 size={24} />}
            title="Editing Existing Chatbots"
            content={
              <>
                <p>To edit an existing chatbot:</p>
                <ol className="list-decimal list-inside ml-4 mt-2">
                  <li>
                    Go to the dashboard and find the chatbot you want to edit.
                  </li>
                  <li>Click on the "Edit" button next to the chatbot.</li>
                  <li>Make your desired changes in the configuration panel.</li>
                  <li>Click "Save" to apply your changes.</li>
                </ol>
              </>
            }
          />

          <Section
            icon={<Trash2 size={24} />}
            title="Deleting Chatbots"
            content={
              <>
                <p>To delete a chatbot:</p>
                <ol className="list-decimal list-inside ml-4 mt-2">
                  <li>
                    Go to the dashboard and find the chatbot you want to delete.
                  </li>
                  <li>Click on the "Delete" button next to the chatbot.</li>
                  <li>Confirm the deletion in the popup dialog.</li>
                </ol>
                <p className="mt-2 text-red-500">
                  Warning: This action is irreversible.
                </p>
              </>
            }
          />
        </div>
      </main>
    </div>
  );
};

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}> = ({ icon, title, content }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center mb-4">
      <div className="mr-4 text-indigo-500">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <div className="text-gray-600">{content}</div>
  </div>
);

export default Documentation;
