import { useEffect, useRef } from "react";

/**
 * For a tab bar that scrolls sideways on phones: fades the edge where more
 * tabs are hidden (via data-more-start / data-more-end, styled in index.css),
 * and brings the selected tab fully into view when it changes.
 */
export function useTabScroller<T extends HTMLElement>(activeKey: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      el.toggleAttribute("data-more-start", el.scrollLeft > 2);
      el.toggleAttribute("data-more-end", el.scrollLeft < max - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    const tab = el?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el || !tab) return;
    // Sideways only; scrollIntoView could also scroll the page.
    const left = tab.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
    const right = left + tab.offsetWidth;
    const pad = 24;
    if (left - pad < el.scrollLeft) el.scrollTo({ left: Math.max(0, left - pad), behavior: "smooth" });
    else if (right + pad > el.scrollLeft + el.clientWidth) el.scrollTo({ left: right + pad - el.clientWidth, behavior: "smooth" });
  }, [activeKey]);

  return ref;
}
