import { BLESSING_BY_ID } from "../../data/delveBlessings";
import { BACKGROUNDS } from "../../data/backgrounds";
import { useGame } from "../../store/GameContext";
import { DelveShell } from "./DelveShell";

export function DelveBlessing() {
  const { state, pickRoadBlessing } = useGame();
  const run = state.activeDelve;
  if (!run) return null;

  return (
    <DelveShell art={BACKGROUNDS.brokenChapel} kicker="A roadside mercy" title="Choose a blessing">
      <div className="delve-blessings">
        {run.blessingChoices.map((id) => {
          const def = BLESSING_BY_ID[id];
          if (!def) return null;
          return (
            <button key={id} type="button" className="delve-blessing" onClick={() => pickRoadBlessing(id)}>
              <strong>{def.name}</strong>
              <span>{def.blurb}</span>
            </button>
          );
        })}
      </div>
    </DelveShell>
  );
}
