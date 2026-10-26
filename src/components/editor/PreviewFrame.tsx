import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import Chatbot from "../Chatbot";
import { focusRing } from "../../pages/dashboard/ui";
import { ChatbotConfig } from "./types";
import { useT } from "../../i18n";
import { editorMessages } from "../../i18n/messages/editor";

const CORNER: Record<ChatbotConfig["position"], string> = {
  "bottom-right": "bottom-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "top-right": "top-0 right-0",
  "top-left": "top-0 left-0",
};

const Line: React.FC<{ w: string; className?: string }> = ({ w, className = "" }) => (
  <span className={`block h-2 rounded-full bg-[#E7EDF6] dark:bg-[#223042] ${className}`} style={{ width: w }} />
);

/**
 * The real widget on a mock web page. The page is a containing block for the
 * widget's fixed positioning, so it sits in the page's corner, as on a site.
 */
const PreviewFrame: React.FC<{ config: ChatbotConfig }> = ({ config }) => {
  const t = useT(editorMessages);
  const [run, setRun] = useState(0);

  const replay = () => {
    try {
      localStorage.removeItem(`askio-greeting-seen:${config.id}`);
    } catch {
      // Without storage the greeting just may not replay.
    }
    setRun((n) => n + 1);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-[#101723] dark:text-[#E7EDF6]">{t("preview")}</h2>
          <p className="text-caption text-[#647184] dark:text-[#87909D]">{t("previewDesc")}</p>
        </div>
        <button
          type="button"
          onClick={replay}
          title={t("startOver")}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-caption font-medium text-[#566273] transition-colors hover:bg-[#E7EDF6] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
        >
          <RotateCcw size={13} />
          {t("restart")}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] shadow-[0_1px_2px_rgba(16,23,35,0.04)] dark:border-[#2B3646] dark:bg-[#1A2533]">
        <div className="flex items-center gap-3 border-b border-[#E7EDF6] px-3 py-2.5 dark:border-[#2B3646]">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#D8DFE9] dark:bg-[#39485B]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#D8DFE9] dark:bg-[#39485B]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#D8DFE9] dark:bg-[#39485B]" />
          </span>
          <span className="flex-1 truncate rounded-md bg-[#F3F7FC] px-2.5 py-1 text-center text-[11px] text-[#87909D] dark:bg-[#141D2B]">
            yourwebsite.com
          </span>
        </div>

        <div className="relative h-[572px] overflow-hidden bg-[#F3F7FC] dark:bg-[#141D2B]" style={{ transform: "translateZ(0)" }}>
          <div aria-hidden className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <span className="h-3 w-16 rounded-full bg-[#D8DFE9] dark:bg-[#2B3646]" />
              <span className="flex gap-3">
                <Line w="28px" />
                <Line w="28px" />
                <Line w="28px" />
              </span>
            </div>
            <div className="space-y-2.5 pt-6">
              <Line w="70%" className="h-4" />
              <Line w="52%" className="h-4" />
              <Line w="80%" className="mt-4" />
              <Line w="64%" />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="block h-20 rounded-lg bg-[#E7EDF6] dark:bg-[#1A2533]" />
              ))}
            </div>
            <div className="space-y-2">
              <Line w="90%" />
              <Line w="76%" />
              <Line w="84%" />
            </div>
          </div>

          <Chatbot
            key={run}
            {...config}
            isEmbedded
            isPreview
            customPositionClass={`${CORNER[config.position] ?? CORNER["bottom-right"]} m-3`}
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewFrame;
