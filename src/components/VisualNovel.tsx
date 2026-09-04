import { useEffect, useRef, useState } from "react";
import { BACKGROUNDS } from "../data/backgrounds";
import { VN_SCENES, VN_SPEAKERS } from "../data/vn";
import { useGame } from "../store/GameContext";

const ENTER_MS = 560;
const LOCK_MS = 2000;
const CHAR_MS = 26;
const SWAP_MS = 240;
const LEAVE_MS = 420;

export function VisualNovel() {
  const { ui, endVn } = useGame();
  const scene = ui.vnScene ? VN_SCENES[ui.vnScene] : null;
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [locked, setLocked] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const closing = useRef(false);
  const advanceRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!scene) return;
    closing.current = false;
    setEntered(false);
    setLeaving(false);
    setLineIndex(0);
    setTyped(0);
    setLocked(true);
    setSwapping(false);
    const enter = window.setTimeout(() => setEntered(true), ENTER_MS);
    return () => window.clearTimeout(enter);
  }, [scene?.id]);

  const line = scene?.lines[lineIndex];

  useEffect(() => {
    if (!scene || !line || !entered || leaving) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTyped(reduce ? line.text.length : 0);
    setLocked(true);
    const lock = window.setTimeout(() => setLocked(false), LOCK_MS);
    if (reduce) return () => window.clearTimeout(lock);

    const type = window.setInterval(() => {
      setTyped((n) => {
        if (n >= line.text.length) {
          window.clearInterval(type);
          return n;
        }
        return n + 1;
      });
    }, CHAR_MS);
    return () => {
      window.clearTimeout(lock);
      window.clearInterval(type);
    };
  }, [scene, line, lineIndex, entered, leaving]);

  const complete = Boolean(line && typed >= line.text.length);
  const canAdvance = Boolean(scene && line && entered && !locked && !swapping && !leaving);

  function advance() {
    if (!scene || !line || !canAdvance) return;
    if (!complete) {
      setTyped(line.text.length);
      return;
    }
    if (lineIndex + 1 < scene.lines.length) {
      setSwapping(true);
      window.setTimeout(() => {
        setLineIndex((i) => i + 1);
        setSwapping(false);
      }, SWAP_MS);
      return;
    }
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    window.setTimeout(endVn, LEAVE_MS);
  }

  advanceRef.current = advance;

  useEffect(() => {
    if (!scene) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        advanceRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene]);

  if (!scene || !line) return null;

  const speaker = VN_SPEAKERS[line.speaker];
  const shown = line.text.slice(0, typed);

  return (
    <div
      className={`vn ${entered ? "in" : ""} ${leaving ? "out" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Dialogue"
      onClick={advance}
    >
      <img className="vn-bg" src={BACKGROUNDS.town3} alt="" />
      <div className="vn-dim" />
      <div className="vn-stage">
        {(["hera", "cedric"] as const).map((id) => {
          const who = VN_SPEAKERS[id];
          const on = who.id === speaker.id;
          return (
            <figure key={id} className={`vn-sprite ${who.side} ${on ? "on" : "off"}`} aria-hidden={!on}>
              <img src={who.sprite} alt="" />
            </figure>
          );
        })}
      </div>
      <div
        className={`vn-box ${swapping ? "swap" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          advance();
        }}
      >
        <p className="vn-name">{speaker.name}</p>
        <p className="vn-line">
          {shown}
          {entered && !complete ? <span className="vn-caret type" aria-hidden /> : null}
        </p>
        <button type="button" className={`vn-next ${canAdvance && complete ? "ready" : ""}`} disabled={!canAdvance}>
          {canAdvance && complete ? "Continue" : "…"}
        </button>
      </div>
    </div>
  );
}
