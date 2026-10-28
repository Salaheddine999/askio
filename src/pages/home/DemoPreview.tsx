import Chatbot from "../../components/Chatbot";
import type { DemoResult } from "../../utils/demo";

const Line = ({ w }: { w: string }) => <span className="block h-2 rounded-full bg-[#E7EDF6]" style={{ width: w }} />;

/**
 * A browser window showing the visitor's own site (its name, image and
 * colour) with the real Askio widget open on it, answering from the FAQs
 * written from their pages. Nothing is recorded: the widget runs as a preview.
 */
export default function DemoPreview({ result }: { result: DemoResult }) {
  const { host, site, faqs } = result;
  const name = site.title || host;
  const color = site.color || "#101723";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8DFE9] bg-[#F9FCFF] text-left shadow-[0_16px_48px_-24px_rgba(16,23,35,0.25)] dark:border-[#2B3646]">
      <div className="flex items-center gap-3 border-b border-[#E7EDF6] bg-[#F3F7FC] px-3 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#D8DFE9]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#D8DFE9]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#D8DFE9]" />
        </span>
        <span className="flex-1 truncate rounded-md bg-[#F9FCFF] px-2.5 py-1 text-center text-[11px] text-[#647184]">{host}</span>
      </div>

      {/* The page is the widget's containing block, so it sits in its corner. */}
      <div className="relative h-[640px] overflow-hidden bg-white" style={{ transform: "translateZ(0)" }}>
        <div aria-hidden="true" className="p-5 sm:p-7">
          <div className="flex items-center gap-2.5">
            {site.icon ? (
              <img src={site.icon} alt="" className="h-7 w-7 rounded-md object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="h-7 w-7 rounded-md" style={{ background: color }} />
            )}
            <span className="truncate text-[15px] font-semibold text-[#101723]">{name}</span>
            <span className="ml-auto hidden gap-4 sm:flex">
              <Line w="44px" />
              <Line w="52px" />
              <Line w="40px" />
            </span>
          </div>
          <div className="mt-6 overflow-hidden rounded-xl" style={{ background: `${color}14` }}>
            {site.image ? (
              <img src={site.image} alt="" className="h-[220px] w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-[220px] items-end p-6">
                <span className="text-[26px] font-semibold leading-tight text-[#101723]">{name}</span>
              </div>
            )}
          </div>
          <div className="mt-6 max-w-[55%] space-y-2.5">
            <Line w="90%" />
            <Line w="75%" />
            <Line w="82%" />
          </div>
          <div className="mt-6 grid max-w-[55%] grid-cols-2 gap-3">
            <span className="h-20 rounded-lg bg-[#F3F7FC]" />
            <span className="h-20 rounded-lg bg-[#F3F7FC]" />
          </div>
        </div>

        <Chatbot
          id=""
          title={name}
          primaryColor={color}
          secondaryColor={color}
          position="bottom-right"
          launcherStyle="orb"
          initialMessage={`Hi! Ask me anything about ${name}.`}
          placeholder="Type your question…"
          faqData={faqs}
          isEmbedded
          isPreview
          startOpen
          customPositionClass="bottom-0 right-0 m-3"
        />
      </div>
    </div>
  );
}
