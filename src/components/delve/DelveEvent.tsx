import { CARD_BY_ID } from "../../data/cards";
import { EVENT_BY_ID } from "../../data/delveEvents";
import { eventChoiceAvailable } from "../../game/delve";
import { traitLabel } from "../../data/traits";
import { useGame } from "../../store/GameContext";
import { DelveShell } from "./DelveShell";

export function DelveEvent() {
  const { state, resolveRoadEvent } = useGame();
  const run = state.activeDelve;
  const event = run?.eventId ? EVENT_BY_ID[run.eventId] : null;
  if (!run || !event) return null;

  return (
    <DelveShell art={event.art} kicker="A fork in the tale" title={event.title}>
      <article className="delve-event">
        <img className="delve-event-art" src={event.art} alt="" />
        <p>{event.body}</p>
        <ul className="delve-choices">
          {event.choices.map((choice) => {
            const ok = eventChoiceAvailable(run, choice.needTrait);
            const who = choice.needTrait
              ? run.team
                  .map((id) => CARD_BY_ID[id])
                  .filter((card) => card?.traits.includes(choice.needTrait!))
                  .map((card) => card!.name)
              : [];
            return (
              <li key={choice.id}>
                <button type="button" className="menu-btn" disabled={!ok} onClick={() => resolveRoadEvent(choice.id)}>
                  {choice.label}
                  {choice.needTrait ? (
                    <em>
                      {ok ? who.join(", ") : `Needs ${traitLabel(choice.needTrait)}`}
                    </em>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </article>
    </DelveShell>
  );
}
