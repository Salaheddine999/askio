import React from "react";

import { format } from "date-fns";
import {
  Bot,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Edit2,
  Code,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "./Button";
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
      className={`group bg-white dark:bg-[#292524] rounded-xl shadow-[0px_2px_4px_rgba(0,0,0,0.04),0px_0px_0px_1px_rgba(0,0,0,0.06)] dark:shadow-[0px_0px_0px_1px_#44403C] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.08),0px_0px_0px_1px_rgba(0,0,0,0.06)] dark:hover:shadow-[0px_0px_0px_1px_#57534E] overflow-visible transition-all duration-300 ${
        viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"
      }`}
    >
      <div
        className={`p-5 flex flex-col ${
          viewMode === "list" ? "flex-grow sm:flex-row sm:items-center" : "h-full"
        }`}
      >
        {/* Header Section */}
        <div
          className={`flex items-start justify-between mb-4 ${
            viewMode === "list" ? "sm:mb-0 sm:flex-1 sm:items-center" : ""
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="bg-[#FAFAF9] dark:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C] p-2.5 rounded-lg group-hover:scale-105 transition-transform duration-300">
              <Bot size={20} className="text-[#37322F] dark:text-[#F5F5F4]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#37322F] dark:text-[#F5F5F4] font-sans leading-tight">
                {chatbot.title}
              </h3>
              {viewMode === "list" && (
                <div className="flex items-center gap-3 mt-1 sm:hidden">
                   <span className="text-xs text-[#605A57] dark:text-[#A8A29E]">
                    Updated {format(chatbot.lastUpdated, "MMM d")}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {viewMode === "grid" && (
            <Menu as="div" className="relative ml-2">
              <Menu.Button className="p-1 rounded-md hover:bg-[#F7F5F3] dark:hover:bg-[#44403C] text-[#9CA3AF] transition-colors">
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
                <Menu.Items className="absolute right-0 mt-1 w-36 origin-top-right bg-white dark:bg-[#292524] divide-y divide-[#E0DEDB] dark:divide-[#44403C] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-[#E0DEDB] dark:border-[#44403C]">
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onEdit(chatbot.id)}
                          className={`${
                            active ? "bg-[#F7F5F3] dark:bg-[#44403C]" : ""
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm text-[#37322F] dark:text-[#F5F5F4]`}
                        >
                          <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onEmbed(chatbot.id)}
                          className={`${
                            active ? "bg-[#F7F5F3] dark:bg-[#44403C]" : ""
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm text-[#37322F] dark:text-[#F5F5F4]`}
                        >
                          <Code className="mr-2 h-4 w-4" aria-hidden="true" />
                          Embed
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onDelete(chatbot.id)}
                          className={`${
                            active ? "bg-red-50 dark:bg-red-900/20" : ""
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600 dark:text-red-400`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>

        {/* Info Section */}
        <div className={`flex-grow ${viewMode === "list" ? "sm:flex sm:items-center sm:gap-8 sm:mx-8" : ""}`}>
           {/* Feedback Pill */}
          <div className={`flex items-center self-start bg-[#F7F5F3] dark:bg-[#44403C] rounded-full px-3 py-1 mb-4 ${viewMode === 'list' ? 'sm:mb-0' : ''}`}>
            <div className="flex items-center gap-1 pr-3 border-r border-[#E0DEDB] dark:border-[#57534E]">
              <ThumbsUp size={12} className="text-[#37322F] dark:text-[#A8A29E]" />
              <span className="text-xs font-semibold text-[#37322F] dark:text-[#F5F5F4]">
                {feedback.positive}
              </span>
            </div>
            <div className="flex items-center gap-1 pl-3">
              <ThumbsDown size={12} className="text-[#9CA3AF]" />
              <span className="text-xs font-semibold text-[#605A57] dark:text-[#A8A29E]">
                {feedback.negative}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className={`${viewMode === "list" ? "hidden sm:flex" : "grid grid-cols-2 gap-2 mb-4"}`}>
            <div className={`flex items-center gap-1.5 text-xs text-[#605A57] dark:text-[#A8A29E] ${viewMode === "list" ? "mr-6" : ""}`}>
              <Calendar size={12} className="text-[#9CA3AF]" />
              <span className="truncate">
                Created {format(chatbot.createdAt, "MMM d, yyyy")}
              </span>
            </div>
            {(viewMode === "grid" || viewMode === "list") && (
                <div className="flex items-center gap-1.5 text-xs text-[#605A57] dark:text-[#A8A29E]">
                <Calendar size={12} className="text-[#9CA3AF]" />
                <span className="truncate">
                    Updated {format(chatbot.lastUpdated, "MMM d, yyyy")}
                </span>
                </div>
            )}
          </div>
        </div>

        {/* Actions Footer (Grid - Buttons, List - Menu) */}
        {viewMode === "grid" ? (
         <div className="pt-4 mt-auto border-t border-[#E0DEDB] dark:border-[#44403C] flex gap-2">
            <Button
                onClick={() => onEdit(chatbot.id)}
                className="flex-1 bg-[#37322F] hover:bg-[#2a2522] text-white text-xs py-2 h-auto shadow-sm dark:text-white justify-center"
            >
                Edit
            </Button>
            <button
                onClick={() => onEmbed(chatbot.id)}
                className="p-2 border border-[#E0DEDB] dark:border-[#44403C] rounded-md text-[#605A57] dark:text-[#A8A29E] hover:bg-[#FAFAF9] dark:hover:bg-[#44403C] transition-colors"
                title="Embed Code"
            >
                <Code size={16} />
            </button>
         </div>
        ) : (
            <div className="hidden sm:flex items-center gap-2">
                 <Button
                    onClick={() => onEdit(chatbot.id)}
                    className="bg-white border border-[#E0DEDB] text-[#37322F] hover:bg-[#FAFAF9] text-xs py-1.5 h-auto shadow-sm dark:bg-[#292524] dark:border-[#44403C] dark:text-[#F5F5F4]"
                >
                    Edit
                </Button>
                 <Menu as="div" className="relative">
                    <Menu.Button className="p-1.5 rounded-md hover:bg-[#E0DEDB] dark:hover:bg-[#44403C] text-[#605A57] dark:text-[#A8A29E] transition-colors">
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
                         <Menu.Items className="absolute right-0 mt-1 w-36 origin-top-right bg-white dark:bg-[#292524] divide-y divide-[#E0DEDB] dark:divide-[#44403C] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-[#E0DEDB] dark:border-[#44403C]">
                            <div className="px-1 py-1">
                                <Menu.Item>
                                {({ active }) => (
                                    <button
                                    onClick={() => onEmbed(chatbot.id)}
                                    className={`${
                                        active ? "bg-[#F7F5F3] dark:bg-[#44403C]" : ""
                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm text-[#37322F] dark:text-[#F5F5F4]`}
                                    >
                                    <Code className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Embed
                                    </button>
                                )}
                                </Menu.Item>
                                <Menu.Item>
                                {({ active }) => (
                                    <button
                                    onClick={() => onDelete(chatbot.id)}
                                    className={`${
                                        active ? "bg-red-50 dark:bg-red-900/20" : ""
                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600 dark:text-red-400`}
                                    >
                                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Delete
                                    </button>
                                )}
                                </Menu.Item>
                            </div>
                         </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatbotCard;
