import { useEffect, type ReactNode } from "react";
import { pauseMenuBgm, startMenuBgm, unlockAudio } from "../game/audio";
import { useGame } from "../store/GameContext";

export function BgmRoot({ children }: { children: ReactNode }) {
  const { ui } = useGame();
  const onMenu = ui.screen === "title" || ui.screen === "plaza";

  useEffect(() => {
    if (onMenu) startMenuBgm();
    else pauseMenuBgm();
  }, [onMenu]);

  useEffect(() => {
    function unlock() {
      unlockAudio();
      if (onMenu) startMenuBgm();
    }
    document.addEventListener("pointerdown", unlock);
    return () => document.removeEventListener("pointerdown", unlock);
  }, [onMenu]);

  return children;
}
