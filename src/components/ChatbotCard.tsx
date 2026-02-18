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
  ArrowRight,
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

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.2,
          delay: index * 0.03,
          ease: "easeInOut",
        }}
        className="group relative bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E5E4] dark:border-[#44403C] hover:border-[#D6D3D1] dark:hover:border-[#57534E] shadow-sm hover:shadow-md transition-all duration-200 overflow-visible mb-3"
      >
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icon & Title */}
          <div className="flex items-center space-x-4 flex-grow min-w-0">
            <div className="p-2.5 bg-[#FAFAF9] dark:bg-[#292524] rounded-lg border border-[#E7E5E4] dark:border-[#44403C] flex-shrink-0">
              <Bot size={20} className="text-[#44403C] dark:text-[#A8A29E]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-sans font-semibold text-[#292524] dark:text-[#F5F5F4] leading-tight truncate">
                {chatbot.title}
              </h3>
              <div className="flex items-center text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                <Calendar size={12} className="mr-1.5" />
                Created {format(chatbot.createdAt, "MMM d, yyyy")}
              </div>
            </div>
          </div>

          {/* Metrics - Row Style */}
          <div className="flex items-center space-x-6 sm:px-4 border-t sm:border-t-0 sm:border-l border-[#E7E5E4] dark:border-[#44403C] pt-3 sm:pt-0 mt-2 sm:mt-0">
            <div className="flex items-center space-x-2">
              <Activity size={14} className="text-[#78716C] dark:text-[#A8A29E]" />
              <div className="flex flex-col">
                 <span className="text-xs text-[#78716C] dark:text-[#A8A29E] font-medium hidden sm:inline-block">Satisfaction</span>
                 <span className="text-sm font-semibold text-[#292524] dark:text-[#F5F5F4]">{satisfactionRate}%</span>
              </div>
            </div>
             <div className="flex items-center space-x-2">
              <MessageSquare size={14} className="text-[#78716C] dark:text-[#A8A29E]" />
               <div className="flex flex-col">
                 <span className="text-xs text-[#78716C] dark:text-[#A8A29E] font-medium hidden sm:inline-block">Feedback</span>
                 <span className="text-sm font-semibold text-[#292524] dark:text-[#F5F5F4]">{totalFeedback}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:ml-auto border-t sm:border-t-0 border-[#E7E5E4] dark:border-[#44403C] pt-3 sm:pt-0 mt-2 sm:mt-0">
            <button
               onClick={() => onEdit(chatbot.id)}
               className="flex-1 sm:flex-none items-center justify-center px-4 py-2 bg-white dark:bg-[#292524] border border-[#E7E5E4] dark:border-[#44403C] hover:bg-[#FAFAF9] dark:hover:bg-[#1C1917] text-[#292524] dark:text-[#F5F5F4] text-sm font-medium rounded-lg transition-colors shadow-sm flex"
             >
               <Edit2 size={14} className="mr-2" />
               Manage
             </button>
             
              <Menu as="div" className="relative">
                <Menu.Button className="p-2 rounded-lg hover:bg-[#F5F5F4] dark:hover:bg-[#292524] border border-transparent hover:border-[#E7E5E4] dark:hover:border-[#44403C] text-[#A8A29E] transition-all">
                 <MoreVertical size={16} />
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
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      className="group relative flex flex-col justify-between bg-white dark:bg-[#1C1917] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-4">
            {/* Icon Container with Gradient */}
            <div className="relative group-hover:scale-105 transition-transform duration-300">
               <div className="relative h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  <Bot size={22} className="text-zinc-700 dark:text-zinc-300" strokeWidth={1.5} />
               </div>
               {/* Live Indicator */}
               <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-white dark:bg-[#1C1917] rounded-full flex items-center justify-center">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
               </div>
            </div>
            
            <div className="pt-0.5">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight mb-1 tracking-tight">
                {chatbot.title}
              </h3>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                  v1.0
                </span>
                <span>•</span>
                 <span>{format(chatbot.createdAt, "MMM d")}</span>
              </div>
            </div>
          </div>

          <Menu as="div" className="relative -mr-2 -mt-2">
            <Menu.Button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors focus:outline-none">
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
              <Menu.Items className="absolute right-0 mt-1 w-48 origin-top-right bg-white dark:bg-[#1C1917] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 z-10 focus:outline-none divide-y divide-dashed divide-zinc-200 dark:divide-zinc-800">
                <div className="pb-1">
                    <Menu.Item>
                    {({ active }) => (
                        <button
                        onClick={() => onEmbed(chatbot.id)}
                        className={`${
                            active
                            ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-600 dark:text-zinc-400"
                        } group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors`}
                        >
                        <Code className="mr-2.5 h-4 w-4 opacity-70" />
                        Embed
                        </button>
                    )}
                    </Menu.Item>
                </div>
                <div className="pt-1">
                    <Menu.Item>
                    {({ active }) => (
                        <button
                        onClick={() => onDelete(chatbot.id)}
                        className={`${
                            active
                            ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                            : "text-red-600 dark:text-red-400"
                        } group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors`}
                        >
                        <Trash2 className="mr-2.5 h-4 w-4 opacity-70" />
                        Delete
                        </button>
                    )}
                    </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-2 gap-4 mb-6 py-4 px-4 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
             {/* Satisfaction Metric */}
             <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 dark:text-zinc-500 mb-1">Satisfaction</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif text-zinc-900 dark:text-zinc-50 leading-none">
                        {satisfactionRate}%
                    </span>
                    {satisfactionRate > 0 && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                             satisfactionRate >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                             satisfactionRate >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
                             "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                        }`}>
                            {satisfactionRate >= 80 ? "Excellent" : satisfactionRate >= 50 ? "Average" : "Poor"}
                        </span>
                    )}
                </div>
             </div>

             {/* Feedback Metric */}
             <div className="flex flex-col pl-4 border-l border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 dark:text-zinc-500 mb-1">Feedback</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif text-zinc-900 dark:text-zinc-50 leading-none">
                        {totalFeedback}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-serif italic">
                        responses
                    </span>
                </div>
             </div>
        </div>

        {/* Footer / Action */}
        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
                onClick={() => onEdit(chatbot.id)}
                className="group/btn w-full relative flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium shadow-sm hover:shadow transition-all duration-200"
            >
                <Edit2 size={14} className="opacity-80" />
                <span>Manage Chatbot</span>
                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200" />
            </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatbotCard;
