import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText,
  cancelText,
  confirmButtonClass,
  cancelButtonClass,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-[#292524] rounded-[9px] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] max-w-md w-full overflow-hidden border-none"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#37322F] dark:text-[#F5F5F4]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-[#605A57] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:text-[#F5F5F4] transition-colors duration-150"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6 text-[#605A57] dark:text-[#D6D3D1]">
                {children}
              </div>
              <div className="flex justify-end space-x-4">
                {cancelText && (
                  <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-[9px] text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1C1917] ${
                      cancelButtonClass ||
                      "bg-white border border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] dark:border-[#57534E] dark:text-[#A8A29E] dark:bg-[#44403C] dark:hover:bg-[#57534E] dark:hover:text-[#F5F5F4]"
                    }`}
                  >
                    {cancelText}
                  </button>
                )}
                {confirmText && onConfirm && (
                  <button
                    onClick={onConfirm}
                    className={`px-4 py-2 rounded-[9px] text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1C1917] ${
                      confirmButtonClass ||
                      "bg-[#37322F] text-white hover:bg-[#2a2522] dark:bg-[#F5F5F4] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
                    }`}
                  >
                    {confirmText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
