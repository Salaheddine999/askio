import React from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
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

const buttonBase =
  "px-4 py-2 rounded-[9px] text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-875";

/**
 * A small dialog with a title, a body and up to two actions. Headless UI
 * handles focus, Escape and scroll locking; the fade is plain CSS, so it
 * ends cleanly instead of blinking on its last frame.
 */
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
}) => (
  <Dialog open={isOpen} onClose={onClose} className="relative z-50">
    <DialogBackdrop
      transition
      className="fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out data-[closed]:opacity-0"
    />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        transition
        className="w-full max-w-md overflow-hidden rounded-[9px] bg-ink-25 shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-ink-850"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-fg">{title}</DialogTitle>
            <button
              onClick={onClose}
              aria-label={cancelText || "Close"}
              className="rounded-md text-ink-605 transition-colors duration-150 hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/25 dark:text-ink-325 dark:hover:text-ink-130 dark:focus-visible:ring-ink-130/40"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mb-6 text-ink-605 dark:text-ink-130">{children}</div>
          <div className="flex justify-end gap-3">
            {cancelText && (
              <button
                onClick={onClose}
                className={`${buttonBase} ${
                  cancelButtonClass ||
                  "border border-ink-120 bg-ink-25 text-ink-605 hover:bg-ink-30 hover:text-ink-900 focus-visible:ring-ink-900/25 dark:border-ink-710 dark:bg-ink-790 dark:text-ink-325 dark:hover:bg-ink-710 dark:hover:text-ink-130 dark:focus-visible:ring-ink-130/40"
                }`}
              >
                {cancelText}
              </button>
            )}
            {confirmText && onConfirm && (
              <button
                onClick={onConfirm}
                className={`${buttonBase} ${
                  confirmButtonClass ||
                  "bg-ink-900 text-white hover:bg-ink-805 dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70"
                }`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
);

export default ConfirmationModal;
