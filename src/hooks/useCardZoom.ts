import { useEffect, useRef, useState } from "react";

export function useCardZoom() {
  const [mode, setMode] = useState<"off" | "hover" | "pin">("off");
  const timer = useRef(0);

  function enter() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setMode((current) => (current === "off" ? "hover" : current));
    }, 2000);
  }

  function leave() {
    window.clearTimeout(timer.current);
    setMode((current) => (current === "hover" ? "off" : current));
  }

  function pin() {
    window.clearTimeout(timer.current);
    setMode("pin");
  }

  function toggle(event?: { preventDefault(): void; stopPropagation(): void }) {
    event?.preventDefault();
    event?.stopPropagation();
    setMode((current) => (current === "off" ? "pin" : "off"));
  }

  function close() {
    window.clearTimeout(timer.current);
    setMode("off");
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { open: mode !== "off", pinned: mode === "pin", enter, leave, pin, toggle, close };
}
