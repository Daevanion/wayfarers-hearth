import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { STARTER_IDS, CARD_BY_ID } from "../data/cards";
import { BACKGROUNDS } from "../data/backgrounds";
import { ROLE_LABEL } from "../data/icons";
import { CARD_BACK } from "../data/portraits";
import { playSfx } from "../game/audio";
import { useGame } from "../store/GameContext";
import { PortraitCard } from "./PortraitCard";

type DrawBeat = "enter" | "sealed" | "spin" | "fan";

const FAN = [
  { x: "-8.6rem", y: "0.7rem", rot: "-10deg" },
  { x: "0rem", y: "-0.8rem", rot: "0deg" },
  { x: "8.6rem", y: "0.7rem", rot: "10deg" },
];

export function OpeningDraw() {
  const { ui, finishIntro } = useGame();
  const [beat, setBeat] = useState<DrawBeat>("enter");
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, x: 50, y: 50 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBeat("fan");
      return;
    }
    const enter = window.setTimeout(() => setBeat("sealed"), 900);
    return () => window.clearTimeout(enter);
  }, []);

  useEffect(() => {
    if (beat !== "spin") return;
    const done = window.setTimeout(() => {
      playSfx("card");
      setBeat("fan");
    }, 780);
    return () => window.clearTimeout(done);
  }, [beat]);

  if (!ui.intro) return null;

  function onMove(event: MouseEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    setTilt({
      rx: (0.5 - y) * 16,
      ry: (x - 0.5) * 22,
      x: x * 100,
      y: y * 100,
    });
  }

  function draw() {
    if (beat !== "sealed" && beat !== "enter") return;
    playSfx("flip");
    setBeat("spin");
  }

  const packStyle = {
    ["--rx" as string]: `${tilt.rx}deg`,
    ["--ry" as string]: `${tilt.ry}deg`,
    ["--mx" as string]: `${tilt.x}%`,
    ["--my" as string]: `${tilt.y}%`,
  } as CSSProperties;

  return (
    <div className={`opening-draw ${beat}`}>
      <img className="opening-bg" src={BACKGROUNDS.town3} alt="" />
      <div className="opening-blur" />
      <div className="opening-vignette" />

      {beat !== "fan" ? (
        <div className="opening-focus">
          <p className="kicker opening-kicker">The first lamp</p>
          <button
            type="button"
            className={`draw-pack ${beat === "spin" ? "spin" : beat === "sealed" ? "bob" : ""}`}
            style={packStyle}
            data-sfx="flip"
            onMouseMove={onMove}
            onMouseLeave={() => setTilt({ rx: 0, ry: 0, x: 50, y: 50 })}
            onClick={draw}
            aria-label="Draw your company"
          >
            <span className="draw-glow" aria-hidden />
            <span className="draw-flip">
              <span className="draw-face back">
                <img src={CARD_BACK} alt="" draggable={false} />
              </span>
              <span className="draw-face front">
                <img src={CARD_BY_ID[STARTER_IDS[0]].portrait ?? CARD_BACK} alt="" draggable={false} />
              </span>
            </span>
          </button>
          <p className="opening-hint">{beat === "spin" ? "The seal breaks…" : "A sealed name. Click to draw."}</p>
        </div>
      ) : (
        <div className="opening-focus fan-focus">
          <p className="kicker opening-kicker">Three names to start</p>
          <button className="cta opening-go" type="button" onClick={finishIntro}>
            To the board
          </button>
          <div className="draw-fan" aria-label="Starting company">
            {STARTER_IDS.map((id, i) => {
              const t = CARD_BY_ID[id];
              const pose = FAN[i];
              return (
                <div
                  key={id}
                  className="fan-card"
                  style={
                    {
                      ["--fan-x" as string]: pose.x,
                      ["--fan-y" as string]: pose.y,
                      ["--fan-rot" as string]: pose.rot,
                      ["--fan-delay" as string]: `${80 + i * 90}ms`,
                    } as CSSProperties
                  }
                >
                  <div className={`idle-${i % 5}`}>
                    <PortraitCard template={t} owned size="inspect" />
                    <p className="fan-role">{ROLE_LABEL[t.role]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
