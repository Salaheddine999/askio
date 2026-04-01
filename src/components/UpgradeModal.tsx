import React from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";
import Button from "./Button";
import { redirectToProCheckout } from "../utils/billing";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1C1917] rounded-2xl shadow-xl border border-gray-100 dark:border-[#292524] overflow-hidden"
      >
        <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
             {/* Decorative background circles */}
            <div className="absolute top-0 right-0 w-32 h-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/10 blur-xl"></div>
            
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
            
            <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                aria-label="Close"
            >
                <X size={16} />
            </button>
        </div>
        
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-[#37322F] dark:text-[#F5F5F4] mb-2 font-serif">
            Unlock AI Chatbots
          </h2>
          <p className="text-[#605A57] dark:text-[#A8A29E] text-sm mb-6">
            Free plans can create unlimited manual chatbots. Upgrade to Pro to enable AI on up to 10 chatbots.
          </p>

          <div className="space-y-3 mb-8 text-left max-w-[240px] mx-auto">
            <div className="flex items-center gap-3 text-sm text-[#37322F] dark:text-[#D6D3D1]">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span>AI on up to 10 chatbots</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#37322F] dark:text-[#D6D3D1]">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span>AI FAQ generation and AI responses</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#37322F] dark:text-[#D6D3D1]">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span>Remove Askio branding</span>
            </div>
          </div>

          <Button
            onClick={() => {
              onClose();
              void redirectToProCheckout();
            }}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg py-2.5 rounded-xl font-medium transition-all group"
          >
            <span className="flex items-center justify-center gap-2">
                Upgrade to Pro
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
            </span>
          </Button>
          
          <button 
            onClick={onClose}
            className="mt-4 text-xs font-medium text-[#A8A29E] hover:text-[#37322F] dark:hover:text-white transition-colors"
          >
              Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
