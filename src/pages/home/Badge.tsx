export default function Badge({ text }: { text: string }) {
  return (
    <div className="px-4 py-1.5 bg-white dark:bg-[#292524] shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] rounded-full flex items-center gap-2 border border-[rgba(2,6,23,0.08)] dark:border-[#44403C]">
      <div className="w-2 h-2 rounded-full bg-[#37322F] dark:bg-[#F5F5F4]" />
      <span className="text-[#37322F] dark:text-[#F5F5F4] text-caption font-medium">{text}</span>
    </div>
  );
}
