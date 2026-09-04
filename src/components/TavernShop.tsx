import { useState, type CSSProperties } from "react";
import { HUD_ICONS } from "../data/hud";
import { CARD_BACK } from "../data/portraits";
import { GOLD_PACK_COST, TOKEN_PACK_COST } from "../game/quests";
import { useGame } from "../store/GameContext";
import type { PackResult } from "../types";
import { Modal } from "./Modal";
import { PackOpening } from "./PackOpening";

export function TavernShop() {
  const { state, buyCardPack, openTavern, openGuild, inspect } = useGame();
  const [opening, setOpening] = useState<PackResult | null>(null);

  function buy(kind: "gold" | "token") {
    if (opening) return;
    const result = buyCardPack(kind);
    if (result) setOpening(result);
  }

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

          <div className="tavern-actions" style={{ ["--pack-back" as string]: `url(${CARD_BACK})` } as CSSProperties}>
            <button
              className="pack-btn road"
              type="button"
              disabled={Boolean(opening) || state.gold < GOLD_PACK_COST}
              onClick={() => buy("gold")}
            >
              <strong>Road pack</strong>
              <em>Any card, dupes turn to XP</em>
              <span>
                <img className="stat-icon" src={HUD_ICONS.gold} alt="" />
                {GOLD_PACK_COST} gold
              </span>
            </button>
            <button
              className="pack-btn premium"
              type="button"
              disabled={Boolean(opening) || state.tokens < TOKEN_PACK_COST}
              onClick={() => buy("token")}
            >
              <strong>Sealed letter</strong>
              <em>A card you don't own, if any remain</em>
              <span>
                <img className="stat-icon" src={HUD_ICONS.tokens} alt="" />
                {TOKEN_PACK_COST} token
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
          result={opening}
          onBack={() => setOpening(null)}
          onCollection={() => {
            const cardId = opening.cardId;
            setOpening(null);
            inspect(cardId);
            openGuild(true);
          }}
        />
      ) : null}
    </>
  );
}
