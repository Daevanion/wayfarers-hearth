import { HUD_ICONS } from "../data/hud";
import { playSfx } from "../game/audio";
import { useGame } from "../store/GameContext";

export function HUD() {
  const { state, now, openGuild, openCatalogue, openTavern, openQuestBoard, ui } = useGame();
  if (ui.intro) return null;

  const underway = state.board.filter((q) => q.status === "underway");
  const ready = underway.filter((q) => now >= q.endsAt).length;

  function toggleBoard() {
    const next = !ui.questBoardOpen;
    if (next) playSfx("board");
    openQuestBoard(next);
  }

  return (
    <header className="hud map-hud">
      <div className="hud-brand">
        <p className="kicker">The bounty board</p>
        <h1>Wayfarer's Hearth</h1>
      </div>
      <ul className="hud-resources">
        <li>
          <img className="stat-icon" src={HUD_ICONS.gold} alt="" />
          <span>Gold</span>
          <strong>{state.gold}</strong>
        </li>
        <li>
          <img className="stat-icon" src={HUD_ICONS.tokens} alt="" />
          <span>Tokens</span>
          <strong>{state.tokens}</strong>
        </li>
      </ul>
      <div className="hud-day">
        <span className="quest-label">Today's bounties</span>
        <span className="quest-time">
          {underway.length === 0
            ? "No teams out"
            : ready > 0
              ? `${ready} team${ready > 1 ? "s" : ""} returned`
              : `${underway.length} team${underway.length > 1 ? "s" : ""} out`}
        </span>
        <span className="quest-raid">New bounties at midnight</span>
      </div>
      <div className="hud-actions">
        <button className="ghost tiny" onClick={() => openTavern(true)}>
          Tavern
        </button>
        <button className="ghost tiny" onClick={() => openGuild(true)}>
          Collection
        </button>
        <button className="ghost tiny" onClick={() => openCatalogue(true)}>
          Full catalogue
        </button>
      </div>
      <div className="hud-questboard">
        <button
          type="button"
          className={`questboard-btn ${ui.questBoardOpen ? "on" : ""}`}
          aria-label="Quest Board"
          aria-expanded={ui.questBoardOpen}
          onClick={toggleBoard}
        >
          <img src={HUD_ICONS.questboard} alt="" />
        </button>
        <span className="hud-bubble" role="tooltip">
          Quest Board
        </span>
      </div>
    </header>
  );
}
