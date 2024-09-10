import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageSquare,
  Zap,
  Shield,
  Code,
  Check,
} from "lucide-react";

const Home: React.FC = () => {
  return (
    <div className="mx-auto min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-100 to-indigo-50">
        <nav className="container mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-indigo-600 flex items-center">
              <MessageSquare className="mr-2" />
              ChatbotManager
            </div>
            <div className="space-x-4">
              <Link
                to="/auth"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Log in
              </Link>
              <Link
                to="/auth"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Sign up
              </Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-900 leading-tight mb-6">
            Intelligent Chatbots <br />
            <span className="text-indigo-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build, customize, and deploy AI-powered chatbots for your website or
            application in minutes.
          </p>
          <Link
            to="/auth"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-3 rounded-md transition-colors duration-200 inline-flex items-center"
          >
            Get Started
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </header>

      <main>
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Why Choose ChatbotManager?
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard
                icon={<Code className="text-indigo-500" size={40} />}
                title="Easy Integration"
                description="Embed your chatbot on any website with just a few lines of code."
              />
              <FeatureCard
                icon={<Zap className="text-indigo-500" size={40} />}
                title="Powerful Customization"
                description="Tailor your chatbot's appearance and behavior to match your brand."
              />
              <FeatureCard
                icon={<Shield className="text-indigo-500" size={40} />}
                title="Secure & Reliable"
                description="Built with industry-standard security practices to protect your data."
              />
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-indigo-50 to-blue-50 py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Supercharge Your Customer Interactions
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of businesses already using ChatbotManager to
                improve their customer service and boost engagement.
              </p>
              <ul className="text-left inline-block mb-8">
                {[
                  "24/7 Customer Support",
                  "Increased Conversions",
                  "Personalized User Experience",
                  "Reduced Support Costs",
                ].map((item, index) => (
                  <li key={index} className="flex items-center mb-4">
                    <Check className="text-green-500 mr-2" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-3 rounded-md transition-colors duration-200 inline-flex items-center"
              >
                Start Building Now
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-indigo-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2023 ChatbotManager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-200">
    <div className="mb-4 flex justify-center">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Home;
