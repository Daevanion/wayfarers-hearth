import { BACKGROUNDS } from "../data/backgrounds";
import { usePointerSway } from "../hooks/usePointerSway";
import { useGame } from "../store/GameContext";

export function TitleScreen() {
  const { begin } = useGame();
  const sway = usePointerSway(14);
  return (
    <div className="title-screen map-title">
      <div className="map-frame">
        <div className="map-stage" ref={sway}>
          <img className="map-art" src={BACKGROUNDS.town3} alt="" />
        </div>
      </div>
      <div className="title-copy map-title-copy">
        <p className="kicker">A hearth, a board, a road</p>
        <h1>Wayfarer's Hearth</h1>
        <p className="lede">
          Bounties go up with the sun. Match the right traits to the right work, send your company
          out, and be at the board when they come home.
        </p>
        <button className="cta" onClick={begin}>
          Light the hearth
        </button>
      </div>
    </div>
  );
}
