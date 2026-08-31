import { useState } from "react";
import { EQUIPMENT, EQUIPMENT_BY_ID, SLOT_LABEL, SLOT_ORDER } from "../data/equipment";
import { MAX_EQUIP_LEVEL, RARITY_LABEL, scrapValue } from "../game/formulas";
import { useGame } from "../store/GameContext";
import { Modal, Tabs } from "./Modal";
import { ModPips } from "./StatIcons";
import type { EquipSlot } from "../types";

function temperCost(level: number) {
  return { gold: 16 + level * 14, iron: 2 + level };
}

export function Blacksmith() {
  const { state, openBuilding, craft, temper, scrap, wear, unwear } = useGame();
  const [tab, setTab] = useState("gear");
  const [focusSlot, setFocusSlot] = useState<EquipSlot>("head");

  const wornIds = new Set(Object.values(state.loadout).filter(Boolean) as string[]);
  const pool = state.equipment.filter((piece) => EQUIPMENT_BY_ID[piece.templateId]?.slot === focusSlot);

  return (
    <Modal kicker="Spark and soot" title="The Village Forge" onClose={() => openBuilding(null)} wide>
      <p className="lede">
        Gear belongs to the company, not any one name. Wear it on the road, improve what you find, or break
        it for the pile.
      </p>
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "gear", label: "Gear" },
          { id: "improve", label: "Improve" },
          { id: "discard", label: "Discard" },
          { id: "craft", label: "Craft" },
        ]}
      />

      {tab === "gear" ? (
        <div className="smith-layout">
          <div className="paper-doll">
            {SLOT_ORDER.map((slot) => {
              const inst = state.loadout[slot];
              const piece = state.equipment.find((e) => e.instanceId === inst);
              const def = piece ? EQUIPMENT_BY_ID[piece.templateId] : null;
              return (
                <div
                  key={slot}
                  className={`slot-card ${focusSlot === slot ? "on" : ""}`}
                  onClick={() => setFocusSlot(slot)}
                >
                  <header>
                    <strong>{SLOT_LABEL[slot]}</strong>
                    {def ? (
                      <button
                        className="ghost tiny"
                        onClick={(e) => {
                          e.stopPropagation();
                          unwear(slot);
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </header>
                  <p>{def ? `${def.name} · Rank ${piece?.level}` : "Empty"}</p>
                  {def ? <ModPips mods={def.mods} compact /> : null}
                </div>
              );
            })}
          </div>
          <div className="stack">
            <h3 className="section-title">{SLOT_LABEL[focusSlot]} rack</h3>
            {pool.length === 0 ? (
              <p className="lede">Nothing for this slot yet. Craft one, or bring a piece home from the road.</p>
            ) : (
              <div className="equip-grid">
                {pool.map((piece) => {
                  const def = EQUIPMENT_BY_ID[piece.templateId];
                  const worn = wornIds.has(piece.instanceId);
                  return (
                    <button
                      key={piece.instanceId}
                      className={`equip-card clickable rarity-${def.rarity} ${worn ? "worn" : ""}`}
                      onClick={() => wear(piece.instanceId)}
                    >
                      <p className="adv-rarity">
                        {RARITY_LABEL[def.rarity]} · Rank {piece.level}
                        {worn ? " · worn" : ""}
                      </p>
                      <h3>{def.name}</h3>
                      <ModPips mods={def.mods} showValue />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "improve" ? (
        <div className="stack">
          {state.equipment.length === 0 ? (
            <p className="lede">The racks are empty. Found and crafted pieces can be improved here.</p>
          ) : (
            <div className="equip-grid">
              {state.equipment.map((piece) => {
                const def = EQUIPMENT_BY_ID[piece.templateId];
                if (!def) return null;
                const cost = temperCost(piece.level);
                return (
                  <article key={piece.instanceId} className={`equip-card rarity-${def.rarity}`}>
                    <p className="adv-rarity">
                      {RARITY_LABEL[def.rarity]} · {SLOT_LABEL[def.slot]} · Rank {piece.level}
                    </p>
                    <h3>{def.name}</h3>
                    <ModPips mods={def.mods} showValue />
                    <p className="cost-line">
                      Improve: {cost.gold}g · {cost.iron} iron
                    </p>
                    <button
                      className="cta small"
                      disabled={
                        piece.level >= MAX_EQUIP_LEVEL || state.gold < cost.gold || state.iron < cost.iron
                      }
                      onClick={() => temper(piece.instanceId)}
                    >
                      Improve
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === "discard" ? (
        <div className="stack">
          {state.equipment.length === 0 ? (
            <p className="lede">Nothing to break down.</p>
          ) : (
            <div className="equip-grid">
              {state.equipment.map((piece) => {
                const def = EQUIPMENT_BY_ID[piece.templateId];
                if (!def) return null;
                const yield_ = scrapValue(def.rarity, piece.level);
                return (
                  <article key={piece.instanceId} className={`equip-card rarity-${def.rarity}`}>
                    <p className="adv-rarity">
                      {RARITY_LABEL[def.rarity]} · {SLOT_LABEL[def.slot]} · Rank {piece.level}
                    </p>
                    <h3>{def.name}</h3>
                    <p className="cost-line">
                      Yield {yield_.gold}g · {yield_.iron} iron · {yield_.herbs} herbs · {yield_.relics} relics
                    </p>
                    <button className="ghost" onClick={() => scrap(piece.instanceId)}>
                      Discard
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === "craft" ? (
        <div className="equip-grid">
          {EQUIPMENT.filter((e) => e.craft).map((e) => {
            const c = e.craft!;
            const can =
              state.gold >= c.gold &&
              state.iron >= c.iron &&
              state.herbs >= c.herbs &&
              state.relics >= c.relics;
            return (
              <article key={e.id} className={`equip-card rarity-${e.rarity}`}>
                <p className="adv-rarity">
                  {RARITY_LABEL[e.rarity]} · {SLOT_LABEL[e.slot]}
                </p>
                <h3>{e.name}</h3>
                <ModPips mods={e.mods} showValue />
                <p className="cost-line">
                  {c.gold}g · {c.iron} iron · {c.herbs} herbs · {c.relics} relics
                </p>
                <button className="cta small" disabled={!can} onClick={() => craft(e.id)}>
                  Craft
                </button>
              </article>
            );
          })}
        </div>
      ) : null}
    </Modal>
  );
}
