import { useMemo, useState } from "react";
import tavernScene from "../Assets/bg/tavern.jpg";
import { CARD_BY_ID } from "../data/cards";
import { HUD_ICONS } from "../data/hud";
import { CARD_BACK } from "../data/portraits";
import { GOLD_PACK_COST, TOKEN_PACK_COST } from "../game/quests";
import { useGame } from "../store/GameContext";
import type { PackResult, Rarity } from "../types";
import { Modal } from "./Modal";
import { PortraitCard } from "./PortraitCard";

const PARTICLE_COUNT = 26;

export function TavernShop() {
  const { state, buyCardPack, openTavern } = useGame();
  const [pull, setPull] = useState<PackResult | null>(null);
  const [stamp, setStamp] = useState(0);

  function buy(kind: "gold" | "token") {
    const result = buyCardPack(kind);
    if (result) {
      setPull(result);
      setStamp((n) => n + 1);
    }
  }

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
        <p className="muted tight tavern-blurb">
          New faces drift through with the road dust. Gold buys a chance; a token buys a name you don't have.
        </p>

        <div className="tavern-stage">
          {pull ? (
            <PackReveal key={`${pull.cardId}-${stamp}`} result={pull} />
          ) : (
            <p className="muted pull-hint">Buy a pack to see who walks in.</p>
          )}
        </div>

        <div className="tavern-actions">
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
          <button className="pack-btn tavern-close" type="button" onClick={() => openTavern(false)}>
            <strong>Close</strong>
            <em>Return to the plaza</em>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PackReveal({ result }: { result: PackResult }) {
  const [phase, setPhase] = useState<"back" | "flip" | "shown">("back");
  const template = CARD_BY_ID[result.cardId];
  const seeds = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => i), []);

  if (!template) return null;

  function reveal() {
    if (phase !== "back") return;
    setPhase("flip");
    window.setTimeout(() => setPhase("shown"), 780);
  }

  const rarity: Rarity = template.rarity;
  const live = phase !== "back";

  return (
    <div className={`pack-reveal rarity-${rarity} ${phase}`}>
      <button
        type="button"
        className="pack-flip"
        data-sfx="flip"
        onClick={reveal}
        disabled={phase !== "back"}
        aria-label={phase === "back" ? "Turn the card" : template.name}
      >
        <div className="pack-flip-inner">
          <div className="pack-face back">
            <img src={CARD_BACK} alt="A sealed card" />
          </div>
          <div className="pack-face front">
            <div className="pack-glow" aria-hidden />
            <PortraitCard template={template} owned size="inspect" />
          </div>
        </div>
        {live ? (
          <div className="pack-sparks" aria-hidden>
            {seeds.map((i) => (
              <span key={i} className="pack-spark" style={{ ["--spark-i" as string]: i }} />
            ))}
          </div>
        ) : null}
      </button>
      {phase === "back" ? (
        <p className="muted pull-hint">Turn the card.</p>
      ) : phase === "shown" ? (
        <p className={`pull-note ${result.isNew ? "new" : ""}`}>
          {result.isNew ? `${template.name} joins the company!` : `Another likeness — +${result.xp} XP`}
        </p>
      ) : (
        <p className="muted pull-hint"> </p>
      )}
    </div>
  );
}
