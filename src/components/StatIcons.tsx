import { COMBAT_ICON, COMBAT_LABEL, ELEMENT_ICON, ELEMENT_LABEL } from "../data/icons";
import { TRAITS } from "../data/traits";
import type { CombatId, ElementId } from "../types";

export function ElementBadge({ element, labeled }: { element: ElementId; labeled?: boolean }) {
  const icon = ELEMENT_ICON[element];
  return (
    <span className={`element-badge el-${element}`} title={`${ELEMENT_LABEL[element]} element`}>
      {icon ? <img src={icon} alt="" /> : <span className="el-null-mark" aria-hidden>◇</span>}
      {labeled ? <em>{ELEMENT_LABEL[element]}</em> : null}
    </span>
  );
}

export function CombatBadges({ combat, labeled }: { combat: CombatId[]; labeled?: boolean }) {
  return (
    <span className="combat-badges">
      {combat.map((c) => (
        <span key={c} className="combat-badge" title={`${COMBAT_LABEL[c]} combat`}>
          <img src={COMBAT_ICON[c]} alt={COMBAT_LABEL[c]} />
          {labeled ? <em>{COMBAT_LABEL[c]}</em> : null}
        </span>
      ))}
    </span>
  );
}

export function TraitChips({ traits, compact }: { traits: string[]; compact?: boolean }) {
  if (traits.length === 0) return null;
  return (
    <ul className={`trait-chips ${compact ? "compact" : ""}`}>
      {traits.map((id) => {
        const def = TRAITS[id];
        if (!def) return null;
        return (
          <li key={id} className={def.good ? "good" : "bad"} title={def.blurb}>
            {def.name}
          </li>
        );
      })}
    </ul>
  );
}
