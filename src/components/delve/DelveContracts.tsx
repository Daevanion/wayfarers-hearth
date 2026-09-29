import { useMemo, useState } from "react";
import { CARD_BY_ID } from "../../data/cards";
import { CONTRACT_BY_ID } from "../../data/delveContracts";
import { ELEMENT_ICON, ELEMENT_LABEL } from "../../data/icons";
import { BACKGROUNDS } from "../../data/backgrounds";
import { delveUnlocked, idleOwnedIds } from "../../game/delve";
import { cardPower } from "../../game/formulas";
import { isBusy, isExhausted } from "../../game/quests";
import { useGame } from "../../store/GameContext";
import { PortraitCard } from "../PortraitCard";
import { DelveShell } from "./DelveShell";

export function DelveContracts() {
  const { state, now, startDelveRun } = useGame();
  const [offerKey, setOfferKey] = useState<string | null>(state.delveOffers[0]?.key ?? null);
  const [team, setTeam] = useState<string[]>([]);
  const offer = state.delveOffers.find((entry) => entry.key === offerKey) ?? state.delveOffers[0];
  const contract = offer ? CONTRACT_BY_ID[offer.contractId] : null;
  const unlocked = delveUnlocked(state);
  const idle = useMemo(() => idleOwnedIds(state, now), [state, now]);

  function toggle(id: string) {
    if (!contract) return;
    setTeam((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id);
      if (current.length >= contract.seats) return current;
      return [...current, id];
    });
  }

  function start() {
    if (!offer || !contract) return;
    startDelveRun(offer.key, team);
  }

  return (
    <DelveShell art={BACKGROUNDS.worldmap} kicker="Hearthroads" title="Contracts on the road">
      {!unlocked ? (
        <p className="hearthroads-locked">Five names on the ledger open this road. The hearth still waits on company.</p>
      ) : (
        <>
          <div className="delve-contracts">
            {state.delveOffers.map((entry) => {
              const def = CONTRACT_BY_ID[entry.contractId];
              if (!def) return null;
              const threat = entry.threatElement ? ELEMENT_ICON[entry.threatElement] : null;
              return (
                <button
                  key={entry.key}
                  type="button"
                  className={`delve-contract ${offer?.key === entry.key ? "on" : ""}`}
                  onClick={() => {
                    setOfferKey(entry.key);
                    setTeam([]);
                  }}
                >
                  <img src={BACKGROUNDS.questPage1} alt="" className="delve-contract-page" />
                  <span className="delve-contract-inner">
                    <img src={def.art} alt="" className="delve-contract-art" />
                    <strong>{def.name}</strong>
                    <em>{def.seats} seats · {def.layers.length} forks</em>
                    <span>{def.flavor}</span>
                    <span className="delve-contract-threat">
                      {threat && entry.threatElement ? (
                        <>
                          <img src={threat} alt="" />
                          {ELEMENT_LABEL[entry.threatElement]} threat
                        </>
                      ) : (
                        "No named threat"
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {contract ? (
            <section className="delve-party">
              <h3>
                Company · {team.length}/{contract.seats}
              </h3>
              <div className="delve-party-row">
                {state.cards.map((owned) => {
                  const template = CARD_BY_ID[owned.id];
                  if (!template) return null;
                  const busy = isBusy(state, owned.id) || isExhausted(state, owned.id, now);
                  const selected = team.includes(owned.id);
                  const blocked = busy || (!selected && team.length >= contract.seats);
                  return (
                    <PortraitCard
                      key={owned.id}
                      template={template}
                      owned
                      power={cardPower(owned)}
                      size="compact"
                      selected={selected}
                      dimmed={blocked && !selected}
                      exhausted={busy}
                      onClick={() => {
                        if (busy) return;
                        toggle(owned.id);
                      }}
                    />
                  );
                })}
              </div>
              <p className="muted tight">
                {idle.length < contract.seats
                  ? "Not enough idle names for this contract."
                  : "Idle names only. Marching, resting, or recovering cannot take the road."}
              </p>
              <button
                type="button"
                className="menu-btn on"
                disabled={team.length !== contract.seats}
                onClick={start}
              >
                Take the road
              </button>
            </section>
          ) : null}
        </>
      )}
    </DelveShell>
  );
}
