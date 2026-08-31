import { useState } from "react";
import tavernScene from "../Assets/bg/tavern.jpg";
import { CARD_BY_ID } from "../data/cards";
import { HUD_ICONS } from "../data/hud";
import { GOLD_PACK_COST, TOKEN_PACK_COST } from "../game/quests";
import { playSfx } from "../game/audio";
import { useGame } from "../store/GameContext";
import type { PackResult } from "../types";
import { Modal } from "./Modal";
import { PortraitCard } from "./PortraitCard";

export function TavernShop() {
  const { state, buyCardPack, openTavern } = useGame();
  const [pull, setPull] = useState<PackResult | null>(null);

  function buy(kind: "gold" | "token") {
    const result = buyCardPack(kind);
    if (result) {
      playSfx("flip");
      setPull(result);
    }
  }

  const pulled = pull ? CARD_BY_ID[pull.cardId] : null;

  return (
    <Modal
      kicker="The storefront"
      title="Tavern"
      onClose={() => openTavern(false)}
      scene={tavernScene}
      tone="hearth"
      className="tavern-modal"
    >
      <div className="tavern-shop">
        <p className="muted tight">
          New faces drift through with the road dust. Gold buys a chance; a token buys a name you don't have.
        </p>

        <div className="pack-row">
          <button
            className="pack-btn"
            type="button"
            disabled={state.gold < GOLD_PACK_COST}
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
            disabled={state.tokens < TOKEN_PACK_COST}
            onClick={() => buy("token")}
          >
            <strong>Sealed letter</strong>
            <em>A card you don't own, if any remain</em>
            <span>
              <img className="stat-icon" src={HUD_ICONS.tokens} alt="" />
              {TOKEN_PACK_COST} token
            </span>
          </button>
        </div>

        {pulled ? (
          <div className="pull-reveal" key={pull!.cardId + String(state.cards.length)}>
            <PortraitCard template={pulled} owned size="inspect" />
            <p className={`pull-note ${pull!.isNew ? "new" : ""}`}>
              {pull!.isNew ? `${pulled.name} joins the company!` : `Another likeness — +${pull!.xp} XP`}
            </p>
          </div>
        ) : (
          <p className="muted pull-hint">Buy a pack to see who walks in.</p>
        )}
      </div>
    </Modal>
  );
}
