import { useEffect, type ReactNode } from "react";
import { playSfx, sfxFromEventTarget, unlockAudio } from "../game/audio";

export function SfxRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    function onPointerDown() {
      unlockAudio();
    }
    function onClick(event: MouseEvent) {
      unlockAudio();
      const kind = sfxFromEventTarget(event.target);
      if (kind) playSfx(kind);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return children;
}
