import React from "react";
import { format } from "date-fns";
import {
  Bot,
  Edit2,
  Code,
  Trash2,
  MoreVertical,
  ArrowRight,
  Power,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { Menu, Transition } from "@headlessui/react";

interface ChatbotCardProps {
  chatbot: {
    id: string;
    title: string;
    createdAt: Date;
    lastUpdated: Date;
    isActive?: boolean;
  };
  feedback: {
    positive: number;
    negative: number;
  };
  viewMode: "grid" | "list";
  onEdit: (id: string) => void;
  onEmbed: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  index: number;
}

const ChatbotCard: React.FC<ChatbotCardProps> = ({
  chatbot,
  feedback,
  viewMode,
  onEdit,
  onEmbed,
  onDelete,
  onToggleActive,
  index,
}) => {
  const isActive = chatbot.isActive ?? true;
  const totalFeedback = feedback.positive + feedback.negative;
  const satisfactionRate =
    totalFeedback > 0
      ? Math.round((feedback.positive / totalFeedback) * 100)
      : 0;

  if (viewMode === "list") {
    return (
      <tr className="hover:bg-[#FAFAF9] dark:hover:bg-[#292524] transition-colors group">
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="relative flex-shrink-0 h-10 w-10 flex items-center justify-center bg-[#F7F5F3] dark:bg-[#292524] rounded-lg border border-[#E0DEDB] dark:border-[#44403C] text-[#37322F] dark:text-[#F5F5F4]">
              <Bot size={20} />
              <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-[#1C1917] ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`}></div>
            </div>
            <div className="ml-3 sm:ml-4">
              <div className="text-body-sm font-medium text-[#37322F] dark:text-[#F5F5F4] font-sans truncate max-w-[120px] sm:max-w-xs">
                {chatbot.title}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                    <ThumbsUp size={14} className="mr-1 sm:mr-1.5" />
                    <span className="font-medium">{feedback.positive}</span>
                </div>
                <div className="flex items-center text-rose-600 dark:text-rose-400 text-sm">
                    <ThumbsDown size={14} className="mr-1 sm:mr-1.5" />
                    <span className="font-medium text-body-sm">{feedback.negative}</span>
                </div>
            </div>
        </td>
        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-body-sm text-[#605A57] dark:text-[#A8A29E]">
            {format(chatbot.createdAt, "MMM d, yyyy")}
        </td>
        <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-body-sm text-[#605A57] dark:text-[#A8A29E]">
            {format(chatbot.lastUpdated, "MMM d, yyyy")}
        </td>
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-body-sm font-medium">
            <div className="flex items-center justify-end space-x-1 sm:space-x-3">
                <button
                    onClick={() => onToggleActive(chatbot.id)}
                    className={`${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'} hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors`}
                    title={isActive ? "Deactivate" : "Activate"}
                >
                    <Power size={16} />
                </button>
                <button
                    onClick={() => onEdit(chatbot.id)}
                    className="text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
                    title="Edit"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onEmbed(chatbot.id)}
                    className="text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
                    title="Embed"
                >
                    <Code size={16} />
                </button>
                <button
                    onClick={() => onDelete(chatbot.id)}
                    className="text-[#605A57] dark:text-[#A8A29E] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </td>
      </tr>
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
      <div className="p-3 sm:p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon Container with Gradient */}
            <div className="relative group-hover:scale-105 transition-transform duration-300">
               <div className="relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  <Bot size={20} className="sm:w-[22px] sm:h-[22px] text-zinc-700 dark:text-zinc-300" strokeWidth={1.5} />
               </div>
               {/* Live Indicator */}
               <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-white dark:bg-[#1C1917] rounded-full flex items-center justify-center">
                  <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                    {isActive ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-full w-full bg-zinc-400"></span>
                    )}
                  </span>
               </div>
            </div>
            
            <div className="pt-0.5">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight mb-1 tracking-tight">
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
                        onClick={() => onToggleActive(chatbot.id)}
                        className={`${
                            active
                            ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-600 dark:text-zinc-400"
                        } group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors`}
                        >
                        {isActive ? (
                            <>
                                <Pause className="mr-2.5 h-4 w-4 opacity-70" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <Play className="mr-2.5 h-4 w-4 opacity-70" />
                                Activate
                            </>
                        )}
                        </button>
                    )}
                    </Menu.Item>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 sm:mb-4 py-3 px-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
             {/* Satisfaction Metric */}
             <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 dark:text-zinc-500 mb-1">Satisfaction</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-serif text-zinc-900 dark:text-zinc-50 leading-none">
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
             <div className="flex flex-col sm:pl-4 sm:border-l border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 dark:text-zinc-500 mb-1">Feedback</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-serif text-zinc-900 dark:text-zinc-50 leading-none">
                        {totalFeedback}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-serif italic">
                        responses
                    </span>
                </div>
             </div>
        </div>

        {/* Footer / Action */}
        <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
                onClick={() => onEdit(chatbot.id)}
                className="group/btn w-full relative flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium shadow-sm hover:shadow transition-all duration-200"
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
