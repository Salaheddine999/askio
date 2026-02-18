export default function HatchStrip({ count = 500 }: { count?: number }) {
  return (
    <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden shrink-0" aria-hidden="true">
      <div className="w-[162px] left-[-58px] top-[-120px] absolute flex flex-col">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="self-stretch h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
          />
        ))}
      </div>
    </div>
  );
}
