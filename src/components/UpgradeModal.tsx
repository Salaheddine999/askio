import React from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
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

const FEATURES = ["upgradeFeatureChatbots", "upgradeFeatureFaq", "upgradeFeatureLive"] as const;

/** What Pro adds, with the way to it. Headless UI handles focus, Escape and scroll. */
const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const t = useT(settingsMessages);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[100]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/60 transition-opacity duration-200 ease-out data-[closed]:opacity-0 dark:bg-black/80"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md overflow-hidden rounded-2xl border border-ink-70 bg-ink-25 shadow-lg transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-ink-850 dark:bg-ink-875"
        >
          <div className="relative flex h-32 items-center justify-center bg-ink-900 dark:bg-ink-850">
            <ProIcon className="h-12 w-12 text-white" />
            <button
              onClick={onClose}
              className="absolute end-3 top-3 rounded-full bg-black/20 p-1.5 text-white transition-colors hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={t("upgradeClose")}
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 text-center">
            <DialogTitle className="mb-2 font-display text-h3 tracking-tight text-fg">{t("upgradeTitle")}</DialogTitle>
            <p className="mb-6 text-body-sm text-fg-muted">{t("upgradeBody")}</p>

            <ul className="mx-auto mb-8 max-w-[300px] space-y-3 text-start">
              {FEATURES.map((key) => (
                <li key={key} className="flex items-center gap-3 text-body-sm text-fg">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => {
                onClose();
                void redirectToProCheckout();
              }}
              className="w-full rounded-xl bg-ink-900 py-2.5 font-medium text-white shadow-lg transition-all hover:bg-ink-805 dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70"
            >
              <span className="flex items-center justify-center gap-2">
                {t("upgradeToPro")}
                <ProIcon size={16} />
              </span>
            </Button>

            <button
              onClick={onClose}
              className="mt-4 rounded text-caption font-medium text-ink-545 transition-colors hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/25 dark:hover:text-white dark:focus-visible:ring-ink-130/40"
            >
              {t("upgradeLater")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default UpgradeModal;
