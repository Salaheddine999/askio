import React from "react";
import { format } from "date-fns";
import {
  Bot,
  Calendar,
  Edit2,
  Code,
  Trash2,
  MoreVertical,
  MessageSquare,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { Menu, Transition } from "@headlessui/react";

interface ChatbotCardProps {
  chatbot: {
    id: string;
    title: string;
    createdAt: Date;
    lastUpdated: Date;
  };
  feedback: {
    positive: number;
    negative: number;
  };
  viewMode: "grid" | "list";
  onEdit: (id: string) => void;
  onEmbed: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

const ChatbotCard: React.FC<ChatbotCardProps> = ({
  chatbot,
  feedback,
  viewMode,
  onEdit,
  onEmbed,
  onDelete,
  index,
}) => {
  const totalFeedback = feedback.positive + feedback.negative;
  const satisfactionRate =
    totalFeedback > 0
      ? Math.round((feedback.positive / totalFeedback) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeInOut",
      }}
      className={`group relative bg-white dark:bg-[#1C1917] rounded-2xl border border-[#E7E5E4] dark:border-[#44403C] hover:border-[#D6D3D1] dark:hover:border-[#57534E] shadow-sm hover:shadow-md transition-all duration-300 overflow-visible ${
        viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"
      }`}
    >
      <div className={`p-6 flex flex-col h-full ${viewMode === "list" ? "sm:flex-row sm:items-center sm:w-full" : ""}`}>
        
        {/* Header Section */}
        <div className={`flex justify-between items-start mb-6 ${viewMode === "list" ? "sm:mb-0 sm:flex-1" : ""}`}>
            <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#FAFAF9] dark:bg-[#292524] rounded-xl border border-[#E7E5E4] dark:border-[#44403C] group-hover:scale-105 transition-transform duration-300">
                    <Bot size={24} className="text-[#44403C] dark:text-[#A8A29E]" />
                </div>
                <div>
                    <h3 className="text-lg font-serif font-semibold text-[#292524] dark:text-[#F5F5F4] leading-tight mb-1">
                        {chatbot.title}
                    </h3>
                    <div className="flex items-center text-xs text-[#78716C] dark:text-[#A8A29E]">
                        <Calendar size={12} className="mr-1.5" />
                        Created {format(chatbot.createdAt, "MMM d, yyyy")}
                    </div>
                </div>
            </div>
             {/* Context Menu for List View or Grid View */}
             <Menu as="div" className="relative ml-2">
                <Menu.Button className="p-1 rounded-md hover:bg-[#F5F5F4] dark:hover:bg-[#292524] text-[#A8A29E] transition-colors">
                 <MoreVertical size={18} />
                </Menu.Button>
                 <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right bg-white dark:bg-[#1C1917] divide-y divide-[#E7E5E4] dark:divide-[#44403C] rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none z-10 border border-[#E7E5E4] dark:border-[#44403C]">
                        <div className="p-1">
                             <Menu.Item>
                                {({ active }) => (
                                    <button
                                    onClick={() => onEmbed(chatbot.id)}
                                    className={`${
                                        active ? "bg-[#FAFAF9] dark:bg-[#292524]" : ""
                                    } group flex w-full items-center rounded-lg px-2 py-2 text-sm text-[#44403C] dark:text-[#E7E5E4]`}
                                    >
                                    <Code className="mr-2 h-4 w-4 text-[#78716C]" />
                                    Get Embed Code
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                    onClick={() => onDelete(chatbot.id)}
                                    className={`${
                                        active ? "bg-red-50 dark:bg-red-950/20" : ""
                                    } group flex w-full items-center rounded-lg px-2 py-2 text-sm text-red-600 dark:text-red-400`}
                                    >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Chatbot
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>

        {/* Metrics Grid */}
        <div className={`grid grid-cols-2 gap-3 mb-6 ${viewMode === 'list' ? 'sm:mb-0 sm:mx-8 sm:w-64 sm:flex-none' : ''}`}>
            <div className="bg-[#FAFAF9] dark:bg-[#292524] rounded-lg p-3 border border-[#E7E5E4] dark:border-[#44403C]">
                <div className="text-xs text-[#78716C] dark:text-[#A8A29E] font-medium mb-1 flex items-center">
                    <Activity size={12} className="mr-1" /> Satisfaction
                </div>
                 <div className="text-lg font-semibold text-[#292524] dark:text-[#F5F5F4]">
                    {satisfactionRate}%
                </div>
            </div>
             <div className="bg-[#FAFAF9] dark:bg-[#292524] rounded-lg p-3 border border-[#E7E5E4] dark:border-[#44403C]">
                <div className="text-xs text-[#78716C] dark:text-[#A8A29E] font-medium mb-1 flex items-center">
                   <MessageSquare size={12} className="mr-1" /> Feedback
                </div>
                 <div className="text-lg font-semibold text-[#292524] dark:text-[#F5F5F4]">
                    {totalFeedback}
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className={`mt-auto ${viewMode === 'list' ? 'sm:mt-0 sm:ml-auto' : ''}`}>
             <button
                onClick={() => onEdit(chatbot.id)}
                className="w-full flex items-center justify-center space-x-2 bg-[#292524] hover:bg-[#1C1917] dark:bg-[#F5F5F4] dark:hover:bg-[#E7E5E4] text-white dark:text-[#1C1917] py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
                <Edit2 size={16} />
                <span>Manage Chatbot</span>
            </button>
        </div>

      </div>
    </motion.div>
  );
};

export default ChatbotCard;
