import { useEffect, type ReactNode } from "react";
import { playSfx, sfxFromEventTarget } from "../game/audio";

export function SfxRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const kind = sfxFromEventTarget(event.target);
      if (kind) playSfx(kind);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return children;
}
