import React from "react";
import { X, CheckCircle2 } from "./icons";
import Button from "./Button";
import { redirectToProCheckout } from "../utils/billing";
import { useT } from "../i18n";
import { settingsMessages } from "../i18n/messages/settings";
import { ProIcon } from "./icons";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const t = useT(settingsMessages);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80">
      <div 
        className="w-full max-w-md bg-ink-25 dark:bg-ink-875 rounded-2xl shadow-lg border border-ink-70 dark:border-ink-850 overflow-hidden"
      >
        <div className="relative h-32 bg-ink-900 dark:bg-ink-850 flex items-center justify-center overflow-hidden">
            
            <ProIcon className="w-12 h-12 text-white" />
            
            <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                aria-label={t("upgradeClose")}
            >
                <X size={16} />
            </button>
        </div>
        
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-fg mb-2 font-display">
            {t("upgradeTitle")}
          </h2>
          <p className="text-fg-muted text-sm mb-6">
            {t("upgradeBody")}
          </p>

          <div className="space-y-3 mb-8 text-left max-w-[240px] mx-auto">
            <div className="flex items-center gap-3 text-sm text-fg">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span>{t("upgradeFeatureChatbots")}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-fg">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span>{t("upgradeFeatureFaq")}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-fg">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span>{t("upgradeFeatureLive")}</span>
            </div>
          </div>

          <Button
            onClick={() => {
              onClose();
              void redirectToProCheckout();
            }}
            className="w-full bg-ink-900 hover:bg-ink-805 text-white dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70 shadow-lg py-2.5 rounded-xl font-medium transition-all group"
          >
            <span className="flex items-center justify-center gap-2">
                {t("upgradeToPro")}
                <ProIcon size={16} />
            </span>
          </Button>
          
          <button 
            onClick={onClose}
            className="mt-4 text-xs font-medium text-ink-545 hover:text-ink-900 dark:hover:text-white transition-colors"
          >
              {t("upgradeLater")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
