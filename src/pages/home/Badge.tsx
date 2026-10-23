export default function Badge({ text }: { text: string }) {
  return (
    <div className="px-4 py-1.5 bg-[#F9FCFF] dark:bg-[#1A2533] shadow-[0px_0px_0px_4px_rgba(16,23,35,0.05)] rounded-full flex items-center gap-2 border border-[rgba(2,6,23,0.08)] dark:border-[#2B3646]">
      <div className="w-2 h-2 rounded-full bg-[#87909D] dark:bg-[#D7DFE5]" />
      <span className="text-[#101723] dark:text-[#D7DFE5] text-caption font-medium">{text}</span>
    </div>
  );
}
