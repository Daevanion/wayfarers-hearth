import { useState, type CSSProperties } from "react";
import { HUD_ICONS } from "../data/hud";
import { CARD_BACK } from "../data/portraits";
import { GOLD_PACK_COST, TOKEN_PACK_COST } from "../game/quests";
import { useGame } from "../store/GameContext";
import type { PackResult } from "../types";
import { Modal } from "./Modal";
import { PackOpening } from "./PackOpening";

type PackCount = 1 | 3 | 10;

export function TavernShop() {
  const { state, buyCardPack, openTavern, openGuild, inspect } = useGame();
  const [opening, setOpening] = useState<PackResult[] | null>(null);
  const [count, setCount] = useState<PackCount>(1);

  function toggleCount(next: PackCount) {
    setCount((current) => (current === next ? 1 : next));
  }

  function buy(kind: "gold" | "token") {
    if (opening) return;
    const results = buyCardPack(kind, count);
    if (results?.length) setOpening(results);
  }

  const goldCost = GOLD_PACK_COST * count;
  const tokenCost = TOKEN_PACK_COST * count;
  const canGold = state.gold >= goldCost;
  const canToken = state.tokens >= tokenCost;
  const canThree = state.gold >= GOLD_PACK_COST * 3 || state.tokens >= TOKEN_PACK_COST * 3;
  const canTen = state.gold >= GOLD_PACK_COST * 10 || state.tokens >= TOKEN_PACK_COST * 10;

  return (
    <>
      <Modal
        kicker="The storefront"
        title="Tavern"
        onClose={() => openTavern(false)}
        className="tavern-modal"
      >
        <div className="tavern-shop">
          <p className="muted tight tavern-blurb">
            New faces drift through with the road dust. Gold buys a chance; a token buys a name you don't have.
          </p>

          <div className="tavern-stage">
            <p className="muted pull-hint">Buy a pack to see who walks in.</p>
          </div>

          <div className="tavern-count">
            <button
              type="button"
              className={`menu-btn ${count === 3 ? "on" : ""}`}
              disabled={Boolean(opening) || !canThree}
              onClick={() => toggleCount(3)}
            >
              Open 3
            </button>
            <button
              type="button"
              className={`menu-btn ${count === 10 ? "on" : ""}`}
              disabled={Boolean(opening) || !canTen}
              onClick={() => toggleCount(10)}
            >
              Open 10
            </button>
          </div>

          <div className="tavern-actions" style={{ ["--pack-back" as string]: `url(${CARD_BACK})` } as CSSProperties}>
            <button
              className="pack-btn road"
              type="button"
              disabled={Boolean(opening) || !canGold}
              onClick={() => buy("gold")}
            >
              <strong>Road pack{count > 1 ? ` ×${count}` : ""}</strong>
              <em>Any card, dupes turn to XP</em>
              <span>
                <img className="stat-icon" src={HUD_ICONS.gold} alt="" />
                {goldCost} gold
              </span>
            </button>
            <button
              className="pack-btn premium"
              type="button"
              disabled={Boolean(opening) || !canToken}
              onClick={() => buy("token")}
            >
              <strong>Sealed letter{count > 1 ? ` ×${count}` : ""}</strong>
              <em>A card you don't own, if any remain</em>
              <span>
                <img className="stat-icon" src={HUD_ICONS.tokens} alt="" />
                {tokenCost} token{tokenCost > 1 ? "s" : ""}
              </span>
            </button>
            <button className="pack-btn tavern-close" type="button" onClick={() => openTavern(false)}>
              <strong>Close</strong>
              <em>Return to the plaza</em>
            </button>
          </div>
        </div>
      </Modal>
      {opening ? (
        <PackOpening
          results={opening}
          onBack={() => setOpening(null)}
          onCollection={() => {
            const firstNew = opening.find((entry) => entry.isNew) ?? opening[0];
            setOpening(null);
            if (firstNew) inspect(firstNew.cardId);
            openGuild(true);
          }}
        />
      ) : null}
    </>
  );
}
