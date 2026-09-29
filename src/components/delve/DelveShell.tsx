import { BACKGROUNDS } from "../../data/backgrounds";
import { CONTRACT_BY_ID } from "../../data/delveContracts";
import { useGame } from "../../store/GameContext";
import type { ReactNode } from "react";

export function DelveShell({
  art,
  kicker,
  title,
  children,
}: {
  art?: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  const { state, openHearthroads, abandonRoad } = useGame();
  const run = state.activeDelve;
  const contract = run ? CONTRACT_BY_ID[run.contractId] : null;
  const scene = art ?? contract?.art ?? BACKGROUNDS.worldmap;
  const canAbandon = Boolean(run && !run.end && run.phase !== "result");

  return (
    <main className="hearthroads">
      <div className="hearthroads-frame">
        <img className="hearthroads-art" src={scene} alt="" />
        <div className="hearthroads-veil" />
      </div>
      <header className="hearthroads-bar">
        <div>
          <p className="kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        <div className="hearthroads-status">
          {run && !run.end ? (
            <>
              <span>{run.shardsEarned} shards on the road</span>
              {run.blessingIds.length ? <span>{run.blessingIds.length} blessing{run.blessingIds.length > 1 ? "s" : ""}</span> : null}
            </>
          ) : null}
          <button type="button" className="menu-btn" onClick={() => openHearthroads(false)}>
            Return to plaza
          </button>
          {canAbandon ? (
            <button type="button" className="menu-btn" onClick={() => abandonRoad()}>
              Abandon the road
            </button>
          ) : null}
        </div>
      </header>
      <div className="hearthroads-body">{children}</div>
    </main>
  );
}
