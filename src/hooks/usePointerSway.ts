import { useEffect, useRef } from "react";

export function usePointerSway(strength = 16) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = node;

    let frame = 0;
    function onMove(event: MouseEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * -2 * strength;
        const y = (event.clientY / window.innerHeight - 0.5) * -2 * strength;
        target.style.setProperty("--sway-x", `${x.toFixed(2)}px`);
        target.style.setProperty("--sway-y", `${y.toFixed(2)}px`);
      });
    }

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [strength]);

  return ref;
}
