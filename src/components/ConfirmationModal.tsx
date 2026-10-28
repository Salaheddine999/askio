import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "./icons";

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
            className="bg-ink-25 dark:bg-ink-850 rounded-[9px] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] max-w-md w-full overflow-hidden border-none"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-fg">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-ink-605 hover:text-ink-900 dark:text-ink-325 dark:hover:text-ink-130 transition-colors duration-150"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6 text-ink-605 dark:text-ink-130">
                {children}
              </div>
              <div className="flex justify-end space-x-4">
                {cancelText && (
                  <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-[9px] text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-ink-875 ${
                      cancelButtonClass ||
                      "bg-ink-25 border border-ink-120 text-ink-605 hover:bg-ink-30 hover:text-ink-900 dark:border-ink-710 dark:text-ink-325 dark:bg-ink-790 dark:hover:bg-ink-710 dark:hover:text-ink-130"
                    }`}
                  >
                    {cancelText}
                  </button>
                )}
                {confirmText && onConfirm && (
                  <button
                    onClick={onConfirm}
                    className={`px-4 py-2 rounded-[9px] text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-ink-875 ${
                      confirmButtonClass ||
                      "bg-ink-900 text-white hover:bg-ink-805 dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70"
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
