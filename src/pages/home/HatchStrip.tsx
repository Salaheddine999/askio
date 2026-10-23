// A 10px tile with one diagonal stroke, plus corner stubs so tiles join seamlessly.
// Used as a mask so the line color can follow light/dark mode through a class.
const HATCH_TILE = 10;
const HATCH_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${HATCH_TILE}' height='${HATCH_TILE}'%3E%3Cpath d='M-1 1l2-2M0 ${HATCH_TILE}L${HATCH_TILE} 0M${HATCH_TILE - 1} ${HATCH_TILE + 1}l2-2' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E")`;

export default function HatchStrip() {
  return (
    <div
      aria-hidden="true"
      className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch shrink-0 bg-[rgba(16,23,35,0.12)] dark:bg-[rgba(215,223,229,0.09)]"
      style={{
        maskImage: HATCH_MASK,
        WebkitMaskImage: HATCH_MASK,
        maskSize: `${HATCH_TILE}px ${HATCH_TILE}px`,
        WebkitMaskSize: `${HATCH_TILE}px ${HATCH_TILE}px`,
      }}
    />
  );
}
