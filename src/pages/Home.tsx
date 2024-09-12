import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  ToyBrick,
  ArrowRight,
  Brush,
  Menu,
  X,
  Send,
  Star,
  Code,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Bot,
  Paintbrush,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";

export default function ChatbotLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      type: "bot",
      content: "Hi there! I'm your Askio!",
    },
    {
      type: "bot",
      content:
        "Feel free to ask me anything, and I'll do my best to assist you!",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [chatMessages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      setChatMessages([...chatMessages, { type: "user", content: userInput }]);
      setUserInput("");
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content:
              "That's an interesting question! I'd be happy to help you with that. Could you provide more details?",
          },
        ]);
      }, 1000);
    }
  };

  useEffect(() => {
    // Create the chatbot container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot-container";
    document.body.appendChild(chatbotContainer);

    // Load the chatbot script
    const script = document.createElement("script");
    script.src = "https://askio.vercel.app/chatbot-embed.js";
    script.async = true;

    script.onload = () => {
      // Initialize the chatbot after the script has loaded
      const initScript = document.createElement("script");
      initScript.text = `
        ChatbotEmbed.init("78c33df1-8040-4465-b718-5fb2061efacb", "https://askio.vercel.app");
      `;
      document.body.appendChild(initScript);
    };

    document.body.appendChild(script);

    return () => {
      // Clean up
      document.body.removeChild(chatbotContainer);
      document.body.removeChild(script);
      const initScript = document.querySelector(
        'script[text*="ChatbotEmbed.init"]'
      );
      if (initScript) document.body.removeChild(initScript);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header className="bg-white shadow-md fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-[#aab2ff] flex items-center">
            <img src="./icon.svg" alt="Askio" className="w-14 h-14 mr-2" />
            <span className="text-black">Askio</span>
          </div>
          <nav className="hidden md:flex space-x-6 text-black text-lg">
            <a
              href="#features"
              className="hover:text-[#aab2ff] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#aab2ff] transition-colors"
            >
              How it Works
            </a>
            <a
              href="#testimonials"
              className="hover:text-[#aab2ff] transition-colors"
            >
              Testimonials
            </a>
          </nav>
          <div className="hidden md:flex space-x-4 flex items-center">
            <Link
              to="https://github.com/Salaheddine999/askio"
              className="flex items-center text-black px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              <FaGithub className="text-black mr-2 h-6 w-6" />
              Star on Github
            </Link>
            <Link
              to="/auth"
              className="bg-[#aab2ff] text-black px-4 py-2 font-semibold rounded-md hover:bg-[#8e98ff] transition-colors"
            >
              Get Started
            </Link>
          </div>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="md:hidden bg-white py-4 px-4 shadow-md">
          <nav className="flex flex-col space-y-4">
            <a
              href="#features"
              className="hover:text-[#aab2ff] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#aab2ff] transition-colors"
            >
              How it Works
            </a>
            <a
              href="#testimonials"
              className="hover:text-[#aab2ff] transition-colors"
            >
              Testimonials
            </a>
            <button className="text-[#aab2ff] hover:text-[#8e98ff] transition-colors">
              Login
            </button>
            <button className="bg-[#aab2ff] text-white px-4 py-2 rounded-md hover:bg-[#8e98ff] transition-colors">
              Register
            </button>
          </nav>
        </div>
      )}

      <main className="pt-28">
        <section className="py-20 overflow-hidden">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="md:w-1/2 mb-10 md:mb-0"
            >
              <h1 className="text-6xl font-bold mb-6 ">
                Custom Chatbots, Limitless{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                  Possibilities
                </span>
              </h1>
              <p className="text-xl mb-8 text-gray-600">
                Create custom chatbots tailored to your brand. Effortlessly
                integrate them into your website and engage visitors with
                smarter, personalized interactions.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white px-4 py-2 rounded-[10px] text-md font-semibold hover:shadow-lg transition-all duration-300"
              >
                Try It Now <ArrowRight className="inline ml-2" />
              </motion.button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:w-1/2"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-auto transform hover:scale-105 transition-transform duration-300 border-2 border-[#aab2ff]">
                <div className="space-y-4 h-80 overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-[#aab2ff] scrollbar-track-gray-100">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex items-start ${
                        message.type === "user" ? "justify-end" : ""
                      }`}
                    >
                      {message.type === "bot" && (
                        <div className="w-8 h-8 bg-gradient-to-r from-[#aab2ff] to-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-2 shadow-md">
                          <img
                            src="./logo-transparent.svg"
                            alt="Askio"
                            className="w-8 h-8"
                          />
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white"
                            : "bg-gray-100 text-black"
                        } max-w-[80%] shadow-md`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="flex items-center">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow mr-2 border-[#aab2ff] focus:ring-[#aab2ff] focus:border-[#aab2ff] transition-all duration-300 rounded-md px-2 py-2 border-2"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-[#aab2ff] to-indigo-500 hover:from-[#8e98ff] hover:to-indigo-700 text-white transition-all duration-300 shadow-md hover:shadow-lg rounded-md px-3 py-3"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>

        <section
          id="features"
          className="py-20 bg-gradient-to-b from-white to-[#f8f9ff]"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-5xl font-bold text-center mb-16 text-black">
              Key{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Features
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  icon: <Brush className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Easy Customization",
                  description:
                    "Create chatbots that perfectly match your brand.",
                },
                {
                  icon: <ToyBrick className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Seamless Integration",
                  description:
                    "Add your chatbot to any website with just a few clicks.",
                },
                {
                  icon: <MessageCircle className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Real-Time Engagement",
                  description:
                    "Engage visitors instantly with customized conversations.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transform scale-100 hover:scale-105 transition-transform duration-300 border-2 border-[#aab2ff] hover:border-[#8e98ff] hover:border-2"
                >
                  <div className="flex justify-center mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-5xl font-bold text-center mb-16 text-black">
              How It{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Works
              </span>
            </h2>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-12 md:space-y-0 md:space-x-16">
              {[
                {
                  step: 1,
                  icon: <Bot size={40} />,
                  title: "Create & Configure",
                  description:
                    "Craft your chatbot from scratch, inputting your custom Q&As and choosing its placement.",
                },
                {
                  step: 2,
                  icon: <Paintbrush size={40} />,
                  title: "Customize",
                  description:
                    "Tailor your bot's look to match your brand and website design - all without touching code.",
                },
                {
                  step: 3,
                  icon: <Code size={40} />,
                  title: "Plug & Play",
                  description:
                    "Get your unique embed code and easily add the chatbot to your website.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="flex flex-col items-center text-center max-w-xs group"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-[#aab2ff] to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    {item.icon}
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6 transform transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
                    <h3 className="text-xl font-semibold mb-2 text-black">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="testimonials"
          className="py-20 bg-gradient-to-b from-[#f8f9ff] to-white"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-5xl font-bold text-center mb-16 text-black">
              What Our{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Users Say
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah L.",
                  role: "Boutique Owner",
                  quote:
                    "As a small business owner, I was skeptical about chatbots. But this free tool changed everything! It's like having a 24/7 customer service rep.",
                },
                {
                  name: "Mark L.",
                  role: "E-commerce Entrepreneur",
                  quote:
                    "Multiple sites, one solution. Cart abandonment down 15%. Best free tool ever!",
                },
                {
                  name: "Pat M.",
                  role: "Freelance Designer",
                  quote:
                    "Easy to customize, easier to use. It's like having a tireless assistant.",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-[#aab2ff]"
                >
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#aab2ff] to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                        {testimonial.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-black">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-[#aab2ff]">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 italic">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  <div className="flex mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="text-yellow-400 fill-current"
                        size={20}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* New FAQ section */}
        <section id="faq" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-5xl font-bold text-center mb-16 text-black">
              Frequently Asked{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Questions
              </span>
            </h2>
            <div className="max-w-3xl mx-auto">
              {[
                {
                  question: "What is Askio?",
                  answer:
                    "Askio is a versatile, easy-to-use chatbot that can be added to any website to improve user engagement and provide instant responses to visitor queries.",
                },
                {
                  question: "Is Askio really free to use?",
                  answer:
                    "Yes, Askio is completely free to use. We believe in making technology accessible to everyone, so you can enjoy all of Askio's features without any cost.",
                },
                {
                  question:
                    "Do I have control over where the chatbot appears on my website?",
                  answer:
                    "Absolutely. You can choose where you want the chatbot to appear on your website.",
                },
                {
                  question:
                    "Do I need coding skills to implement this chatbot?",
                  answer:
                    "No coding skills are required. The chatbot is designed to be easy to implement without any coding knowledge.",
                },
                {
                  question:
                    "Can I create multiple chatbots for different websites?",
                  answer:
                    "Yes, you can create multiple chatbots, allowing you to have different chatbots for your various websites or web pages.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="mb-6"
                >
                  <details className="border border-[#aab2ff] mb-4 rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-md">
                    <summary className="text-black hover:text-[#aab2ff] transition-colors duration-300 px-6 py-4 bg-white hover:bg-[#f8f9ff]">
                      {item.question}
                    </summary>
                    <p className="text-gray-600 px-6 py-4 bg-[#f8f9ff]">
                      {item.answer}
                    </p>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Boost Your Website's Engagement Today!
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Enhance customer support and engagement on all your websites -
              instantly and effortlessly, with no coding needed.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/auth"
                className="bg-white text-[#aab2ff] px-8 py-4 rounded-[10px] text-lg font-semibold hover:bg-gray-100 transition-colors duration-300 inline-flex items-center"
              >
                Start Building Now
                <ArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">Askio</div>
              <p className="text-gray-400">
                Elevate Your Website - Free Chatbot!
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {["Features", "How it Works", "Testimonials"].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase().replace(" ", "-")}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                {[Twitter, Facebook, Linkedin, Instagram].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon size={24} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            © 2024 Askio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
