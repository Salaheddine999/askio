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
            className="bg-[#F9FCFF] dark:bg-[#1A2533] rounded-[9px] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] max-w-md w-full overflow-hidden border-none"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#101723] dark:text-[#D7DFE5]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] transition-colors duration-150"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6 text-[#566273] dark:text-[#D7DFE5]">
                {children}
              </div>
              <div className="flex justify-end space-x-4">
                {cancelText && (
                  <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-[9px] text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#141D2B] ${
                      cancelButtonClass ||
                      "bg-[#F9FCFF] border border-[#D8DFE9] text-[#566273] hover:bg-[#F3F7FC] hover:text-[#101723] dark:border-[#39485B] dark:text-[#9BAABD] dark:bg-[#273444] dark:hover:bg-[#39485B] dark:hover:text-[#D7DFE5]"
                    }`}
                  >
                    {cancelText}
                  </button>
                )}
                {confirmText && onConfirm && (
                  <button
                    onClick={onConfirm}
                    className={`px-4 py-2 rounded-[9px] text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#141D2B] ${
                      confirmButtonClass ||
                      "bg-[#101723] text-white hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6]"
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
