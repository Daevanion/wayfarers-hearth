import { CONTRACT_BY_ID } from "../../data/delveContracts";
import { ELEMENT_ICON, ELEMENT_LABEL } from "../../data/icons";
import { useGame } from "../../store/GameContext";
import type { DelveNodeKind } from "../../types";
import { DelveShell } from "./DelveShell";

const KIND_MARK: Record<DelveNodeKind, string> = {
  fight: "⚔",
  elite: "☠",
  event: "?",
  rest: "▲",
  boss: "♛",
};

const KIND_LABEL: Record<DelveNodeKind, string> = {
  fight: "Fight",
  elite: "Elite",
  event: "Event",
  rest: "Camp",
  boss: "Boss",
};

export function DelveMap() {
  const { state, chooseRoadNode } = useGame();
  const run = state.activeDelve;
  if (!run) return null;
  const contract = CONTRACT_BY_ID[run.contractId];
  const layers = Math.max(...run.nodes.map((node) => node.layer)) + 1;
  const width = 120 + layers * 150;
  const height = 420;
  const threat = run.threatElement ? ELEMENT_ICON[run.threatElement] : null;

  function pos(node: { layer: number; slot: number }) {
    const inLayer = run!.nodes.filter((entry) => entry.layer === node.layer).length;
    const x = 70 + node.layer * 150;
    const span = inLayer === 1 ? 0 : 220;
    const y = height / 2 + (inLayer === 1 ? 0 : (node.slot / Math.max(1, inLayer - 1) - 0.5) * span);
    return { x, y };
  }

  return (
    <DelveShell kicker={contract?.name ?? "Hearthroads"} title="Choose the next fork">
      <div className="delve-map-meta">
        {threat && run.threatElement ? (
          <span>
            <img src={threat} alt="" /> {ELEMENT_LABEL[run.threatElement]} threat
          </span>
        ) : (
          <span>No named threat</span>
        )}
        <span>Blessings: {run.blessingIds.length || "none"}</span>
      </div>
      <svg className="delve-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Branching road map">
        {run.nodes.flatMap((node) => {
          const from = pos(node);
          return node.edges.map((edgeId) => {
            const dest = run.nodes.find((entry) => entry.id === edgeId);
            if (!dest) return null;
            const to = pos(dest);
            const walked = run.visited.includes(node.id) && run.visited.includes(dest.id);
            return (
              <line
                key={`${node.id}-${edgeId}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={`delve-edge ${walked ? "walked" : ""}`}
              />
            );
          });
        })}
        {run.nodes.map((node) => {
          const { x, y } = pos(node);
          const reachable = run.reachable.includes(node.id);
          const current = run.currentNodeId === node.id;
          const visited = run.visited.includes(node.id);
          return (
            <g
              key={node.id}
              className={`delve-node is-${node.kind} ${reachable ? "reachable" : ""} ${current ? "current" : ""} ${visited ? "visited" : ""}`}
              transform={`translate(${x} ${y})`}
              onClick={() => reachable && chooseRoadNode(node.id)}
            >
              <circle r="28" />
              <text y="6" textAnchor="middle">
                {KIND_MARK[node.kind].trim()}
              </text>
              <title>{KIND_LABEL[node.kind]}</title>
            </g>
          );
        })}
      </svg>
      <p className="muted tight">Gold nodes are open. Take a fight, a camp, a tale, or the named terror at the end.</p>
    </DelveShell>
  );
}
