import { useGame } from "../store/GameContext";
import { DelveBlessing } from "./delve/DelveBlessing";
import { DelveCombat } from "./delve/DelveCombat";
import { DelveContracts } from "./delve/DelveContracts";
import { DelveEvent } from "./delve/DelveEvent";
import { DelveMap } from "./delve/DelveMap";
import { DelveResult } from "./delve/DelveResult";

export function Hearthroads() {
  const { state } = useGame();
  const run = state.activeDelve;
  if (!run) return <DelveContracts />;
  if (run.phase === "result" || run.end) return <DelveResult />;
  if (run.phase === "combat") return <DelveCombat />;
  if (run.phase === "event") return <DelveEvent />;
  if (run.phase === "blessing") return <DelveBlessing />;
  return <DelveMap />;
}
